"""
Workflow Agent Executor - AgentCore Runtime Application

AWS Bedrock AgentCore application that exposes the Workflow Supervisor via
the BedrockAgentCoreApp runtime following AWS AgentCore best practices.

This module serves as the entry point for the Workflow Supervisor agent,
providing AgentCore-native endpoints for agent invocation and streaming.

Key Features:
- BedrockAgentCoreApp runtime (replaces FastAPI)
- @app.entrypoint decorator for main invocation
- Native streaming with agent.stream_async()
- RequestContext integration for session management
- Health check endpoint
- Graceful startup/shutdown with resource management
- Request validation with Pydantic models
- AgentCore Memory system integration
- Error handling and observability
- OTEL metrics to CloudWatch (workflow duration, agent task duration, error rates)

Architecture:
- Uses WorkflowSupervisor OOP class for graph execution
- Executes graph with StateGraph pattern
- Handles interruptions for user feedback
- Streams events natively via AgentCore
- Persists conversations via conversation manager
- Integrates with AgentCore Identity and Gateway
"""

import asyncio
import signal
import sys
import time
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID

from bedrock_agentcore import BedrockAgentCoreApp, RequestContext
from pydantic import BaseModel, Field

from agents_core.core.database import get_db_pool, close_db_pool
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
    track_agent_performance,
    get_observability_manager
)
from agents_core.models.request_models import (
    AgentCoreInvocationRequest,
    AgentCoreInvocationResponse
)
from agents_core.models.workflow_models import WorkflowExecutionStatus
from agents_core.tools.tool_config import configure_all_tools
from supervisors.workflow.workflow_supervisor import WorkflowSupervisor
from supervisors.workflow.state_models import WorkflowGraphState


# ========================================
# AgentCore Application
# ========================================

app = BedrockAgentCoreApp(
    name="BidOpsAI Workflow Agent",
    description="AWS AgentCore Workflow Supervisor for automated bid processing",
    version="1.0.0"
)


# ========================================
# Application Lifecycle Management
# ========================================

@app.on_event("startup")
async def startup_event():
    """
    Application startup - initialize core services.
    
    Initializes:
    - Database pool
    - Memory manager
    - Observability (LangFuse, OTEL)
    - Tool configuration
    """
    log_agent_action(
        agent_name="workflow_executor",
        action="startup_begin",
        details={"environment": get_config().environment}
    )
    
    try:
        # Initialize core services
        await get_db_pool()  # Creates singleton database pool
        get_memory_manager()  # Creates singleton memory manager
        initialize_observability()  # Initialize LangFuse and OTEL
        
        # Initialize tool configuration
        configure_all_tools()
        
        log_agent_action(
            agent_name="workflow_executor",
            action="startup_complete",
            details={
                "services": ["database", "memory", "observability", "tools"],
                "mode": "workflow"
            }
        )
        
    except Exception as e:
        log_agent_action(
            agent_name="workflow_executor",
            action="startup_failed",
            details={"error": str(e)},
            level="error"
        )
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """
    Application shutdown - cleanup resources.
    
    Cleanup:
    - Close database connections
    - Flush observability data
    """
    log_agent_action(
        agent_name="workflow_executor",
        action="shutdown_begin"
    )
    
    try:
        # Close database pool
        await close_db_pool()
        
        log_agent_action(
            agent_name="workflow_executor",
            action="shutdown_complete"
        )
        
    except Exception as e:
        log_agent_action(
            agent_name="workflow_executor",
            action="shutdown_failed",
            details={"error": str(e)},
            level="error"
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
    - Memory manager status
    
    Returns:
        JSON with health status and service checks
    """
    try:
        # Check database
        db_pool = await get_db_pool()
        db_healthy = db_pool is not None
        
        # Check memory manager
        memory_manager = get_memory_manager()
        memory_healthy = memory_manager is not None
        
        all_healthy = db_healthy and memory_healthy
        
        return {
            "status": "healthy" if all_healthy else "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "database": "up" if db_healthy else "down",
                "memory": "up" if memory_healthy else "down"
            },
            "mode": "workflow"
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


# ========================================
# Main Agent Invocation Entrypoint
# ========================================

@app.entrypoint()
@track_agent_performance(agent_name="workflow_executor")
async def invoke_workflow(
    request: AgentCoreInvocationRequest,
    context: RequestContext
):
    """
    Main agent invocation entrypoint (AgentCore native).
    
    Receives workflow execution requests and orchestrates the complete
    bid processing workflow using Strands StateGraph pattern.
    
    Supports two execution modes:
    1. Initial Start (request.start=True): Creates new workflow, initializes state
    2. Resumption (request.start=False): Loads from memory, applies user input, resumes
    
    Args:
        request: AgentCoreInvocationRequest with:
            - project_id: UUID of the project
            - user_id: UUID of the requesting user
            - session_id: Session ID for memory and streaming
            - start: Boolean indicating if this is initial workflow start
            - user_input: Optional user feedback/edits
                - chat: Text feedback/messages
                - content_edits: Artifact edit payloads
        context: RequestContext from AgentCore with:
            - user_id: Authenticated user ID
            - session_id: AgentCore session ID
            - metadata: Additional context
    
    Yields:
        Dict events with:
        - type: Event type (node_completed, awaiting_feedback, etc.)
        - data: Event-specific data
        - timestamp: ISO timestamp
        
        Final event includes:
        - workflow_execution_id: UUID
        - status: Current workflow status
        - message: Status message
        - awaiting_feedback: Whether workflow is awaiting user input
    
    Raises:
        AgentError: On validation or execution errors
    """
    log_agent_action(
        agent_name="workflow_executor",
        action="invocation_received",
        details={
            "project_id": str(request.project_id),
            "user_id": str(request.user_id),
            "session_id": request.session_id,
            "start": request.start,
            "has_user_input": request.user_input is not None,
            "context_user_id": context.user_id,
            "context_session_id": context.session_id
        }
    )
    
    try:
        # Validate request
        _validate_invocation_request(request)
        
        # Persist user input to conversation history
        if request.user_input:
            await _persist_user_input(request)
        
        # Create supervisor instance
        supervisor = WorkflowSupervisor()
        
        # Execute workflow with streaming - yield events in real-time
        async for event in _execute_workflow_with_streaming(
            supervisor=supervisor,
            request=request,
            context=context
        ):
            yield event
        
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
        
        raise
        
    except Exception as e:
        log_agent_action(
            agent_name="workflow_executor",
            action="invocation_failed",
            details={"error": str(e)},
            level="error"
        )
        
        raise AgentError(
            message=f"Internal server error: {str(e)}",
            code=ErrorCode.INTERNAL_ERROR,
            severity=ErrorSeverity.CRITICAL
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
        AgentError: On validation failure
    """
    # Validate session_id format
    if not request.session_id or len(request.session_id) < 10:
        raise AgentError(
            message="Invalid session_id format (minimum 10 characters)",
            code=ErrorCode.VALIDATION_ERROR,
            severity=ErrorSeverity.LOW
        )
    
    # Validate start flag logic
    if request.start and request.user_input:
        raise AgentError(
            message="Cannot provide user_input when start=true (initial workflow start)",
            code=ErrorCode.VALIDATION_ERROR,
            severity=ErrorSeverity.LOW
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

async def _execute_workflow_with_streaming(
    supervisor: WorkflowSupervisor,
    request: AgentCoreInvocationRequest,
    context: RequestContext
) -> Dict[str, Any]:
    """
    Execute workflow using WorkflowSupervisor with native AgentCore streaming.
    
    Handles two execution modes:
    1. Initial start (request.start=True): Create new workflow, initialize state
    2. Resumption (request.start=False): Load from memory, apply user input, resume
    
    Args:
        supervisor: WorkflowSupervisor instance
        request: Invocation request
        context: RequestContext from AgentCore
        
    Returns:
        Execution result dictionary with:
        - workflow_execution_id: UUID
        - status: Current status
        - awaiting_feedback: Boolean
        - message: Status message
        - events: Generator of streaming events
    """
    log_agent_action(
        agent_name="workflow_executor",
        action="workflow_execution_start",
        details={
            "session_id": request.session_id,
            "mode": "initial" if request.start else "resumption"
        }
    )
    
    # Start workflow performance tracking
    workflow_start_time = time.time()
    obs = get_observability_manager()
    
    try:
        # Prepare initial state
        if request.start:
            # NEW WORKFLOW: Initialize state
            state = _create_initial_state(request)
        else:
            # RESUMPTION: Load from memory and update
            state = await _load_and_update_state(supervisor, request, context)
        
        # Get the compiled graph
        graph = supervisor.get_graph()
        
        # Configure graph with session/thread ID
        config = {
            "configurable": {
                "thread_id": request.session_id,
                "user_id": str(request.user_id)
            }
        }
        
        # Execute with streaming using native AgentCore
        final_state = None
        events = []
        
        # Stream graph execution using agent.stream_async()
        async for event in graph.astream(state, config):
            # Extract state update from event
            if isinstance(event, dict):
                for node_name, node_output in event.items():
                    # Update final state
                    if isinstance(node_output, WorkflowGraphState):
                        final_state = node_output
                    
                    # Collect event
                    event_data = {
                        "type": "node_completed",
                        "node": node_name,
                        "current_agent": final_state.current_agent if final_state else None,
                        "progress": final_state.calculate_progress() if final_state else 0,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    events.append(event_data)
                    
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
                # Graph interrupted - break and return current state
                break
        
        # Record workflow duration metric
        workflow_duration = time.time() - workflow_start_time
        if final_state:
            obs.record_workflow_duration(
                duration_seconds=workflow_duration,
                workflow_id=str(final_state.workflow_execution_id),
                status=final_state.current_status,
                agent_count=len(final_state.completed_tasks)
            )
        
        # If loop completed without interruption, workflow is complete
        if final_state and not final_state.awaiting_user_feedback:
            log_agent_action(
                agent_name="workflow_executor",
                action="graph_execution_complete",
                details={
                    "workflow_id": str(final_state.workflow_execution_id),
                    "status": final_state.current_status,
                    "duration_seconds": workflow_duration
                }
            )
        
        # Return execution result
        return {
            "workflow_execution_id": str(final_state.workflow_execution_id),
            "status": final_state.current_status,
            "awaiting_feedback": final_state.awaiting_user_feedback,
            "message": _get_status_message(final_state),
            "events": events,  # AgentCore will handle streaming
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        # Record error metric
        workflow_duration = time.time() - workflow_start_time
        obs.record_agent_error(
            agent_name="workflow_executor",
            error_type=type(e).__name__,
            error_code=getattr(e, 'code', ErrorCode.EXECUTION_ERROR)
        )
        
        # Record failed workflow duration
        if hasattr(locals().get('final_state'), 'workflow_execution_id'):
            obs.record_workflow_duration(
                duration_seconds=workflow_duration,
                workflow_id=str(final_state.workflow_execution_id),
                status="failed",
                agent_count=len(final_state.completed_tasks) if final_state else 0
            )
        
        log_agent_action(
            agent_name="workflow_executor",
            action="workflow_execution_failed",
            details={
                "error": str(e),
                "duration_seconds": workflow_duration
            },
            level="error"
        )
        
        raise AgentError(
            message=f"Workflow execution failed: {str(e)}",
            code=ErrorCode.EXECUTION_ERROR,
            severity=ErrorSeverity.HIGH
        )


def _create_initial_state(request: AgentCoreInvocationRequest) -> WorkflowGraphState:
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
    initial_state = WorkflowGraphState(
        workflow_execution_id=None,  # Set in initialize node
        project_id=request.project_id,
        user_id=request.user_id,
        session_id=request.session_id,
        current_agent=None,
        current_status=WorkflowExecutionStatus.OPEN.value,
        agent_tasks=[],
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
    
    return initial_state


async def _load_and_update_state(
    supervisor: WorkflowSupervisor,
    request: AgentCoreInvocationRequest,
    context: RequestContext
) -> WorkflowGraphState:
    """
    Load existing state from AgentCore Memory and update with user input.
    
    Uses RequestContext.session_id for state persistence across invocations,
    enabling proper workflow resumption and multi-turn interactions.
    
    Args:
        supervisor: WorkflowSupervisor instance
        request: Invocation request with session_id
        context: RequestContext from AgentCore
        
    Returns:
        Updated WorkflowGraphState ready for resumption
        
    Raises:
        AgentError: If state not found in memory
    """
    log_agent_action(
        agent_name="workflow_executor",
        action="loading_state_from_memory",
        details={
            "session_id": request.session_id,
            "context_session_id": context.session_id,
            "user_id": str(request.user_id)
        }
    )
    
    try:
        # Get compiled graph
        graph = supervisor.get_graph()
        
        # Load checkpoint state from AgentCore Memory
        config = {"configurable": {"thread_id": request.session_id}}
        checkpoint = graph.get_state(config)
        
        if not checkpoint or not checkpoint.values:
            # Try loading from session memory as fallback
            state = await _load_state_from_session_memory(
                session_id=request.session_id,
                user_id=str(request.user_id)
            )
            
            if not state:
                raise AgentError(
                    message=f"No workflow found for session_id: {request.session_id}",
                    code=ErrorCode.WORKFLOW_NOT_FOUND,
                    severity=ErrorSeverity.MEDIUM
                )
        else:
            # Extract state from checkpoint
            state: WorkflowGraphState = checkpoint.values
        
        log_agent_action(
            agent_name="workflow_executor",
            action="state_loaded",
            details={
                "workflow_id": str(state.workflow_execution_id),
                "current_agent": state.current_agent,
                "completed_tasks": len(state.completed_tasks),
                "source": "checkpoint"
            }
        )
        
        # Update state with user input
        if request.user_input:
            if request.user_input.chat:
                state.user_feedback = request.user_input.chat
                state.last_user_message = request.user_input.chat
                state.feedback_intent = _analyze_feedback_intent(request.user_input.chat)
            
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
        
    except AgentError:
        raise
    except Exception as e:
        log_agent_action(
            agent_name="workflow_executor",
            action="state_load_failed",
            details={"error": str(e)},
            level="error"
        )
        raise AgentError(
            message=f"Failed to load workflow state: {str(e)}",
            code=ErrorCode.MEMORY_ERROR,
            severity=ErrorSeverity.HIGH
        )


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


async def _load_state_from_session_memory(
    session_id: str,
    user_id: str
) -> Optional[WorkflowGraphState]:
    """
    Load workflow state from session memory (fallback).
    
    Args:
        session_id: Session ID
        user_id: User ID
    
    Returns:
        WorkflowGraphState or None
    """
    try:
        from agents_core.core.memory_manager import load_session_context
        
        session_data = await load_session_context(session_id, user_id)
        
        if session_data and "workflow_state" in session_data:
            log_agent_action(
                agent_name="workflow_executor",
                action="state_loaded_from_session_memory",
                details={"session_id": session_id}
            )
            
            # Reconstruct state from session data
            # This is a simplified version - in production, serialize/deserialize properly
            return session_data["workflow_state"]
        
    except Exception as e:
        logger.warning(f"Could not load state from session memory: {e}")
    
    return None


async def _persist_state_to_session_memory(
    session_id: str,
    user_id: str,
    state: WorkflowGraphState
) -> None:
    """
    Persist workflow state to session memory.
    
    Args:
        session_id: Session ID
        user_id: User ID
        state: Workflow state to persist
    """
    try:
        from agents_core.core.memory_manager import update_session_context
        
        await update_session_context(
            session_id=session_id,
            user_id=user_id,
            updates={
                "workflow_state": state,
                "workflow_execution_id": str(state.workflow_execution_id),
                "current_agent": state.current_agent,
                "current_status": state.current_status,
                "last_updated": datetime.utcnow().isoformat()
            }
        )
        
        log_agent_action(
            agent_name="workflow_executor",
            action="state_persisted_to_session_memory",
            details={"session_id": session_id}
        )
        
    except Exception as e:
        logger.warning(f"Could not persist state to session memory: {e}")


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
    # Use bedrock_agentcore_starter_toolkit for deployment
    # For local development, AgentCore provides dev server
    import uvicorn
    
    config = get_config()
    
    # Note: In production, this will be deployed via AgentCore Runtime
    # For local dev, we can still use uvicorn with the ASGI app
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=config.workflow_agent_port,
        log_level="info",
        access_log=True
    )