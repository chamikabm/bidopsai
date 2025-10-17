"""
Workflow Agent Executor - FastAPI Application

FastAPI application that exposes the Workflow Supervisor via the /invocations
endpoint following AWS AgentCore runtime requirements.

This module serves as the entry point for the Workflow Supervisor agent,
providing HTTP endpoints for agent invocation and SSE streaming.

Key Features:
- /invocations endpoint (POST) - Main agent entry point (AgentCore requirement)
- /stream/{session_id} endpoint (GET) - SSE streaming for real-time updates
- /health endpoint (GET) - Health check
- Graceful startup/shutdown with resource management
- Request validation with Pydantic models
- Graph checkpoint support for workflow interruption/resumption
- Error handling and observability

Architecture:
- Uses agent_builder to get compiled StateGraph
- Executes graph with proper state management
- Handles interruptions for user feedback
- Resumes from checkpoints on subsequent invocations
- Streams events via SSE manager
- Persists conversations via conversation manager
"""

import asyncio
import signal
import sys
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID

from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from agents_core.core.database import get_db_pool, close_db_pool
from agents_core.core.sse_manager import get_sse_manager
from agents_core.core.memory_manager import get_memory_manager
from agents_core.core.conversation_manager import add_user_input, add_sse_event
from agents_core.core.config import get_config
from agents_core.core.error_handling import (
    AgentError,
    ErrorCode,
    ErrorSeverity,
    format_error_response
)
from agents_core.core.observability import (
    log_agent_action,
    initialize_observability,
    track_agent_performance
)
from agents_core.models.request_models import (
    AgentCoreInvocationRequest,
    AgentCoreInvocationResponse
)
from agents_core.models.workflow_models import WorkflowExecutionStatus
from agents_core.tools.tool_config import configure_all_tools
from supervisors.workflow.agent_builder import get_workflow_graph
from supervisors.workflow.state_models import WorkflowGraphState
from supervisors.workflow.config import WorkflowConfig


# ========================================
# Application Lifespan Management
# ========================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application lifecycle - startup and shutdown.
    
    Startup:
    - Initialize database pool
    - Initialize SSE manager
    - Initialize memory manager
    - Load configuration
    - Initialize observability
    - Configure tools
    
    Shutdown:
    - Close database connections
    - Clean up SSE connections
    - Flush observability data
    """
    # Startup
    log_agent_action(
        agent_name="workflow_executor",
        action="startup_begin",
        details={"environment": get_config().environment}
    )
    
    try:
        # Initialize core services
        await get_db_pool()  # Creates singleton database pool
        get_sse_manager()  # Creates singleton SSE manager
        get_memory_manager()  # Creates singleton memory manager
        initialize_observability()  # Initialize LangFuse and observability
        
        # Initialize tool configuration
        configure_all_tools()
        
        log_agent_action(
            agent_name="workflow_executor",
            action="startup_complete",
            details={
                "services": ["database", "sse", "memory", "observability", "tools"],
                "mode": "workflow"
            }
        )
        
        yield
        
    finally:
        # Shutdown
        log_agent_action(
            agent_name="workflow_executor",
            action="shutdown_begin"
        )
        
        # Close database pool
        await close_db_pool()
        
        # Cleanup SSE connections
        sse_manager = get_sse_manager()
        await sse_manager.close_all()
        
        log_agent_action(
            agent_name="workflow_executor",
            action="shutdown_complete"
        )


# ========================================
# FastAPI Application
# ========================================

app = FastAPI(
    title="BidOpsAI Workflow Agent",
    description="AWS AgentCore Workflow Supervisor for automated bid processing",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware (configure based on environment)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ========================================
# Health Check Endpoint
# ========================================

@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    
    Checks:
    - Database connectivity
    - SSE manager status
    - Memory manager status
    
    Returns:
        JSON with health status and service checks
    """
    try:
        # Check database
        db_pool = await get_db_pool()
        db_healthy = db_pool is not None
        
        # Check SSE manager
        sse_manager = get_sse_manager()
        sse_healthy = sse_manager is not None
        
        # Check memory manager
        memory_manager = get_memory_manager()
        memory_healthy = memory_manager is not None
        
        all_healthy = db_healthy and sse_healthy and memory_healthy
        
        status_code = status.HTTP_200_OK if all_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
        
        return JSONResponse(
            status_code=status_code,
            content={
                "status": "healthy" if all_healthy else "unhealthy",
                "timestamp": datetime.utcnow().isoformat(),
                "services": {
                    "database": "up" if db_healthy else "down",
                    "sse": "up" if sse_healthy else "down",
                    "memory": "up" if memory_healthy else "down"
                },
                "mode": "workflow"
            }
        )
        
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        )


# ========================================
# Agent Invocation Endpoint (AgentCore Requirement)
# ========================================

@app.post(
    "/invocations",
    response_model=AgentCoreInvocationResponse,
    status_code=status.HTTP_200_OK
)
@track_agent_performance(agent_name="workflow_executor")
async def invoke_agent(request: AgentCoreInvocationRequest):
    """
    Main agent invocation endpoint (AWS AgentCore requirement).
    
    Receives workflow execution requests and orchestrates the complete
    bid processing workflow using Strands StateGraph pattern.
    
    Supports two execution modes:
    1. Initial Start (request.start=True): Creates new workflow, initializes state
    2. Resumption (request.start=False): Loads checkpoint, applies user input, resumes
    
    Request Body:
        - project_id: UUID of the project
        - user_id: UUID of the requesting user
        - session_id: Session ID for SSE streaming and checkpointing
        - start: Boolean indicating if this is initial workflow start
        - user_input: Optional user feedback/edits
            - chat: Text feedback/messages
            - content_edits: Artifact edit payloads
    
    Returns:
        AgentCoreInvocationResponse with:
        - workflow_execution_id: Created workflow ID
        - status: Current workflow status
        - message: Status message
        - sse_endpoint: Endpoint for SSE streaming
        - awaiting_feedback: Whether workflow is awaiting user input
    
    Raises:
        HTTPException: On validation or execution errors
    """
    log_agent_action(
        agent_name="workflow_executor",
        action="invocation_received",
        details={
            "project_id": str(request.project_id),
            "user_id": str(request.user_id),
            "session_id": request.session_id,
            "start": request.start,
            "has_user_input": request.user_input is not None
        }
    )
    
    try:
        # Validate request
        _validate_invocation_request(request)
        
        # Persist user input to conversation history
        if request.user_input:
            await _persist_user_input(request)
        
        # Execute workflow via StateGraph
        result = await _execute_workflow(request)
        
        # Prepare response
        response = AgentCoreInvocationResponse(
            workflow_execution_id=result["workflow_execution_id"],
            status=result["status"],
            message=result.get("message", "Workflow execution in progress"),
            sse_endpoint=f"/stream/{request.session_id}",
            awaiting_feedback=result.get("awaiting_feedback", False),
            timestamp=datetime.utcnow()
        )
        
        log_agent_action(
            agent_name="workflow_executor",
            action="invocation_complete",
            details={
                "workflow_id": str(result["workflow_execution_id"]),
                "status": result["status"],
                "awaiting_feedback": result.get("awaiting_feedback", False)
            }
        )
        
        return response
        
    except AgentError as e:
        log_agent_action(
            agent_name="workflow_executor",
            action="invocation_failed",
            details={
                "error_code": e.code,
                "error_message": str(e),
                "severity": e.severity
            },
            level="error"
        )
        
        error_response = format_error_response(e)
        raise HTTPException(
            status_code=_get_http_status_code(e.severity),
            detail=error_response
        )
        
    except Exception as e:
        log_agent_action(
            agent_name="workflow_executor",
            action="invocation_failed",
            details={"error": str(e)},
            level="error"
        )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error_code": "INTERNAL_ERROR",
                "message": "Internal server error",
                "details": str(e)
            }
        )


# ========================================
# SSE Streaming Endpoint
# ========================================

@app.get("/stream/{session_id}")
async def stream_events(session_id: str, request: Request):
    """
    SSE streaming endpoint for real-time workflow updates.
    
    Clients connect to this endpoint to receive Server-Sent Events about:
    - Workflow initialization
    - Agent handoffs
    - Task progress updates
    - User prompts (awaiting feedback)
    - Errors and warnings
    - Workflow completion
    
    Args:
        session_id: Session ID for event filtering
        request: FastAPI request object (for disconnect detection)
    
    Returns:
        StreamingResponse with SSE events
    """
    log_agent_action(
        agent_name="workflow_executor",
        action="sse_client_connected",
        details={"session_id": session_id}
    )
    
    sse_manager = get_sse_manager()
    
    async def event_generator():
        """Generate SSE events for the client."""
        client_id = None
        
        try:
            # Register client
            client_id = await sse_manager.register_client(session_id)
            
            # Send initial connection event
            yield f"event: connected\n"
            yield f"data: {{'session_id': '{session_id}', 'timestamp': '{datetime.utcnow().isoformat()}'}}\n\n"
            
            # Stream events
            async for event_data in sse_manager.stream_events(
                session_id=session_id,
                client_id=client_id
            ):
                # Check if client disconnected
                if await request.is_disconnected():
                    log_agent_action(
                        agent_name="workflow_executor",
                        action="sse_client_disconnected",
                        details={"session_id": session_id, "reason": "client_disconnect"}
                    )
                    break
                
                yield event_data
                
        except asyncio.CancelledError:
            log_agent_action(
                agent_name="workflow_executor",
                action="sse_stream_cancelled",
                details={"session_id": session_id}
            )
            
        except Exception as e:
            log_agent_action(
                agent_name="workflow_executor",
                action="sse_stream_error",
                details={"session_id": session_id, "error": str(e)},
                level="error"
            )
            yield f"event: error\n"
            yield f"data: {{'error': '{str(e)}', 'timestamp': '{datetime.utcnow().isoformat()}'}}\n\n"
            
        finally:
            # Unregister client
            if client_id:
                await sse_manager.unregister_client(session_id, client_id)
                log_agent_action(
                    agent_name="workflow_executor",
                    action="sse_client_unregistered",
                    details={"session_id": session_id}
                )
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable nginx buffering
        }
    )


# ========================================
# Helper Functions - Validation
# ========================================

def _validate_invocation_request(request: AgentCoreInvocationRequest) -> None:
    """
    Validate invocation request parameters.
    
    Validations:
    - Session ID format and length
    - Start flag consistency
    - User input validation
    
    Args:
        request: Invocation request
        
    Raises:
        HTTPException: On validation failure
    """
    # Validate session_id format
    if not request.session_id or len(request.session_id) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": "INVALID_SESSION_ID",
                "message": "Invalid session_id format (minimum 10 characters)"
            }
        )
    
    # Validate start flag logic
    if request.start and request.user_input:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": "INVALID_REQUEST",
                "message": "Cannot provide user_input when start=true (initial workflow start)"
            }
        )


async def _persist_user_input(request: AgentCoreInvocationRequest) -> None:
    """
    Persist user input to conversation history.
    
    Args:
        request: Invocation request with user input
    """
    try:
        if request.user_input.chat:
            await add_user_input(
                project_id=request.project_id,
                session_id=request.session_id,
                user_id=request.user_id,
                content=request.user_input.chat,
                message_type="chat",
                metadata={"start": request.start}
            )
        
        if request.user_input.content_edits:
            await add_user_input(
                project_id=request.project_id,
                session_id=request.session_id,
                user_id=request.user_id,
                content=str(request.user_input.content_edits),
                message_type="content_edit",
                metadata={"edit_count": len(request.user_input.content_edits)}
            )
            
    except Exception as e:
        # Log but don't fail workflow if conversation persistence fails
        log_agent_action(
            agent_name="workflow_executor",
            action="conversation_persist_failed",
            details={"error": str(e)},
            level="warning"
        )


# ========================================
# Helper Functions - Workflow Execution
# ========================================

async def _execute_workflow(request: AgentCoreInvocationRequest) -> Dict[str, Any]:
    """
    Execute workflow using Strands StateGraph with checkpoint support.
    
    Handles two execution modes:
    1. Initial start (request.start=True): Create new workflow, initialize state
    2. Resumption (request.start=False): Load checkpoint, apply user input, resume
    
    Args:
        request: Invocation request
        
    Returns:
        Execution result dictionary with:
        - workflow_execution_id: UUID
        - status: Current status
        - awaiting_feedback: Boolean
        - message: Status message
    """
    # Get compiled graph with checkpointer
    graph = get_workflow_graph()
    config = {"configurable": {"thread_id": request.session_id}}
    
    # Determine execution mode
    if request.start:
        # NEW WORKFLOW: Initialize state
        log_agent_action(
            agent_name="workflow_executor",
            action="workflow_initialization",
            details={
                "project_id": str(request.project_id),
                "session_id": request.session_id
            }
        )
        state = await _initialize_workflow_state(request)
    else:
        # RESUMPTION: Load checkpoint and update with user input
        log_agent_action(
            agent_name="workflow_executor",
            action="workflow_resumption",
            details={
                "session_id": request.session_id,
                "has_feedback": request.user_input is not None
            }
        )
        state = await _resume_workflow_state(request, graph, config)
    
    # Execute graph with streaming
    return await _execute_graph_with_streaming(graph, state, config, request)


async def _initialize_workflow_state(request: AgentCoreInvocationRequest) -> WorkflowGraphState:
    """
    Create initial state for new workflow execution.
    
    Args:
        request: Invocation request
        
    Returns:
        Initialized WorkflowGraphState
    """
    log_agent_action(
        agent_name="workflow_executor",
        action="creating_initial_state",
        details={"project_id": str(request.project_id)}
    )
    
    # Create initial state with required fields
    # Note: workflow_execution_id will be set by initialize node
    # Note: agent_tasks will be created by initialize node
    initial_state = WorkflowGraphState(
        workflow_execution_id=None,  # Set in initialize node
        project_id=request.project_id,
        user_id=request.user_id,
        session_id=request.session_id,
        current_agent=None,
        current_status=WorkflowExecutionStatus.OPEN.value,
        agent_tasks=[],  # Populated by initialize node
        completed_tasks=[],
        failed_tasks=[],
        task_outputs={},
        shared_context={},
        awaiting_user_feedback=False,
        user_feedback=None,
        feedback_intent="proceed",
        content_edits=[],
        user_feedback_history=[],
        last_user_message=None,
        supervisor_decisions=[],
        created_artifacts=[],
        artifact_export_locations={},
        errors=[],
        retry_count=0,
        started_at=datetime.utcnow(),
        last_updated_at=datetime.utcnow(),
        workflow_config={}
    )
    
    log_agent_action(
        agent_name="workflow_executor",
        action="initial_state_created",
        details={"session_id": request.session_id}
    )
    
    return initial_state


async def _resume_workflow_state(
    request: AgentCoreInvocationRequest,
    graph,
    config: Dict
) -> WorkflowGraphState:
    """
    Load existing state from checkpoint and update with user input.
    
    Args:
        request: Invocation request
        graph: Compiled StateGraph
        config: Graph config with thread_id
        
    Returns:
        Updated WorkflowGraphState ready for resumption
        
    Raises:
        HTTPException: If checkpoint not found
    """
    log_agent_action(
        agent_name="workflow_executor",
        action="loading_checkpoint",
        details={"session_id": request.session_id}
    )
    
    try:
        # Load checkpoint state
        checkpoint = graph.get_state(config)
        
        if not checkpoint or not checkpoint.values:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error_code": "WORKFLOW_NOT_FOUND",
                    "message": f"No workflow found for session_id: {request.session_id}"
                }
            )
        
        # Extract state from checkpoint
        state: WorkflowGraphState = checkpoint.values
        
        log_agent_action(
            agent_name="workflow_executor",
            action="checkpoint_loaded",
            details={
                "workflow_id": str(state.workflow_execution_id),
                "current_agent": state.current_agent,
                "completed_tasks": len(state.completed_tasks)
            }
        )
        
        # Update state with user input
        if request.user_input:
            # Update user feedback
            if request.user_input.chat:
                state.user_feedback = request.user_input.chat
                state.last_user_message = request.user_input.chat
                
                # Analyze feedback intent
                state.feedback_intent = _analyze_feedback_intent(request.user_input.chat)
            
            # Update content edits
            if request.user_input.content_edits:
                state.content_edits = request.user_input.content_edits
            
            # Clear awaiting flag so graph resumes
            state.awaiting_user_feedback = False
            state.last_updated_at = datetime.utcnow()
            
            log_agent_action(
                agent_name="workflow_executor",
                action="state_updated_with_feedback",
                details={
                    "workflow_id": str(state.workflow_execution_id),
                    "feedback_intent": state.feedback_intent,
                    "has_edits": len(state.content_edits) > 0
                }
            )
        
        return state
        
    except HTTPException:
        raise
    except Exception as e:
        log_agent_action(
            agent_name="workflow_executor",
            action="checkpoint_load_failed",
            details={"error": str(e)},
            level="error"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error_code": "CHECKPOINT_ERROR",
                "message": "Failed to load workflow checkpoint",
                "details": str(e)
            }
        )


async def _execute_graph_with_streaming(
    graph,
    state: WorkflowGraphState,
    config: Dict,
    request: AgentCoreInvocationRequest
) -> Dict[str, Any]:
    """
    Execute graph and stream events via SSE.
    
    Args:
        graph: Compiled StateGraph
        state: Initial or resumed state
        config: Graph config
        request: Invocation request
        
    Returns:
        Execution result dictionary
    """
    sse_manager = get_sse_manager()
    final_state = None
    
    log_agent_action(
        agent_name="workflow_executor",
        action="graph_execution_start",
        details={
            "session_id": request.session_id,
            "mode": "initial" if request.start else "resumption"
        }
    )
    
    try:
        # Stream graph execution
        async for event in graph.astream(state, config):
            # Extract state update from event
            if isinstance(event, dict):
                for node_name, node_output in event.items():
                    # Update final state
                    if isinstance(node_output, WorkflowGraphState):
                        final_state = node_output
                    
                    # Emit SSE event for node completion
                    await sse_manager.emit_event(
                        session_id=request.session_id,
                        event_type="node_completed",
                        data={
                            "node": node_name,
                            "current_agent": final_state.current_agent if final_state else None,
                            "progress": final_state.calculate_progress() if final_state else 0,
                            "timestamp": datetime.utcnow().isoformat()
                        }
                    )
                    
                    # Persist event to conversation
                    await add_sse_event(
                        project_id=request.project_id,
                        session_id=request.session_id,
                        event_type="node_completed",
                        data={"node": node_name}
                    )
                    
                    log_agent_action(
                        agent_name="workflow_executor",
                        action="node_completed",
                        details={
                            "node": node_name,
                            "workflow_id": str(final_state.workflow_execution_id) if final_state else None
                        }
                    )
            
            # Check if graph interrupted for user feedback
            if final_state and final_state.awaiting_user_feedback:
                log_agent_action(
                    agent_name="workflow_executor",
                    action="graph_interrupted",
                    details={
                        "workflow_id": str(final_state.workflow_execution_id),
                        "reason": "awaiting_user_feedback"
                    }
                )
                # Graph interrupted - return current state
                break
        
        # If loop completed without interruption, workflow is complete
        if final_state and not final_state.awaiting_user_feedback:
            log_agent_action(
                agent_name="workflow_executor",
                action="graph_execution_complete",
                details={
                    "workflow_id": str(final_state.workflow_execution_id),
                    "status": final_state.current_status
                }
            )
        
        # Return execution result
        return {
            "workflow_execution_id": final_state.workflow_execution_id,
            "status": final_state.current_status,
            "awaiting_feedback": final_state.awaiting_user_feedback,
            "message": _get_status_message(final_state)
        }
        
    except Exception as e:
        log_agent_action(
            agent_name="workflow_executor",
            action="graph_execution_failed",
            details={"error": str(e)},
            level="error"
        )
        
        # Emit error event via SSE
        await sse_manager.emit_event(
            session_id=request.session_id,
            event_type="error",
            data={
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
        raise


def _analyze_feedback_intent(feedback: str) -> str:
    """
    Analyze user feedback to determine intent.
    
    Intent classification:
    - "reparse": Issues with document parsing
    - "reanalyze": Issues with analysis
    - "proceed": User approved, continue
    
    Args:
        feedback: User feedback text
        
    Returns:
        Intent string
    """
    feedback_lower = feedback.lower()
    
    # Check for reparse keywords
    reparse_keywords = ["reparse", "re-parse", "parse again", "parsing", "document issue"]
    if any(keyword in feedback_lower for keyword in reparse_keywords):
        return "reparse"
    
    # Check for reanalyze keywords
    reanalyze_keywords = ["reanalyze", "re-analyze", "analyze again", "analysis issue", "wrong analysis"]
    if any(keyword in feedback_lower for keyword in reanalyze_keywords):
        return "reanalyze"
    
    # Default to proceed
    return "proceed"


def _get_status_message(state: WorkflowGraphState) -> str:
    """
    Get human-readable status message based on workflow state.
    
    Args:
        state: Workflow graph state
        
    Returns:
        Status message
    """
    if state.awaiting_user_feedback:
        return "Workflow paused - awaiting user feedback"
    elif state.current_status == WorkflowExecutionStatus.COMPLETED.value:
        return "Workflow completed successfully"
    elif state.current_status == WorkflowExecutionStatus.FAILED.value:
        return f"Workflow failed: {state.errors[-1] if state.errors else 'Unknown error'}"
    else:
        return f"Workflow in progress - current agent: {state.current_agent or 'initializing'}"


def _get_http_status_code(severity: ErrorSeverity) -> int:
    """
    Map error severity to HTTP status code.
    
    Args:
        severity: Error severity
        
    Returns:
        HTTP status code
    """
    severity_map = {
        ErrorSeverity.LOW: status.HTTP_400_BAD_REQUEST,
        ErrorSeverity.MEDIUM: status.HTTP_400_BAD_REQUEST,
        ErrorSeverity.HIGH: status.HTTP_500_INTERNAL_SERVER_ERROR,
        ErrorSeverity.CRITICAL: status.HTTP_503_SERVICE_UNAVAILABLE
    }
    return severity_map.get(severity, status.HTTP_500_INTERNAL_SERVER_ERROR)


# ========================================
# Signal Handlers
# ========================================

def handle_shutdown(signum, frame):
    """Handle shutdown signals gracefully."""
    log_agent_action(
        agent_name="workflow_executor",
        action="shutdown_signal_received",
        details={"signal": signum}
    )
    sys.exit(0)


signal.signal(signal.SIGINT, handle_shutdown)
signal.signal(signal.SIGTERM, handle_shutdown)


# ========================================
# Main Entry Point
# ========================================

if __name__ == "__main__":
    config = get_config()
    
    uvicorn.run(
        "supervisors.workflow.agent_executor:app",
        host="0.0.0.0",
        port=config.workflow_agent_port,
        reload=config.environment == "development",
        log_level="info",
        access_log=True
    )