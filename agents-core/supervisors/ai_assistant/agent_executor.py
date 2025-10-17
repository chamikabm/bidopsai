"""
AI Assistant Supervisor - FastAPI Application

Exposes /invocations endpoint for AI Assistant conversations.
Deployed as separate AgentCore Runtime on port 8001.
"""

import logging
from datetime import datetime
from typing import AsyncGenerator
from uuid import UUID, uuid4

from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.responses import StreamingResponse
from pydantic import ValidationError

from core.config import get_config
from core.conversation_manager import ConversationManager
from core.memory_manager import MemoryManager
from core.sse_manager import SSEManager
from models.request_models import InvocationRequest
from supervisors.ai_assistant.agent_builder import build_ai_assistant_graph
from supervisors.ai_assistant.state_models import (
    IntentRouterState,
    ConversationContext,
)
from tools.tool_config import configure_all_tools

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="AI Assistant Supervisor",
    description="Intent-based conversational agent for bid management",
    version="1.0.0"
)

# Global instances
sse_manager: SSEManager = None
memory_manager: MemoryManager = None
conversation_manager: ConversationManager = None
ai_assistant_graph = None


@app.on_event("startup")
async def startup_event():
    """Initialize managers on app startup"""
    global sse_manager, memory_manager, conversation_manager
    
    logger.info("Starting AI Assistant Supervisor...")
    
    # Initialize SSE manager
    sse_manager = SSEManager()
    await sse_manager.initialize()
    logger.info("SSE Manager initialized")
    
    # Initialize memory manager
    memory_manager = MemoryManager()
    await memory_manager.initialize()
    logger.info("Memory Manager initialized")
    
    # Initialize conversation manager
    conversation_manager = ConversationManager()
    logger.info("Conversation Manager initialized")
    
    # Initialize tool configuration (Phase 10: T109)
    configure_all_tools()
    logger.info("Tool configuration initialized")
    
    logger.info("AI Assistant Supervisor started successfully on port 8001")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on app shutdown"""
    logger.info("Shutting down AI Assistant Supervisor...")
    
    if sse_manager:
        await sse_manager.cleanup()
    if memory_manager:
        await memory_manager.cleanup()
    
    logger.info("AI Assistant Supervisor shutdown complete")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ai-assistant-supervisor",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/invocations")
async def invoke_ai_assistant(
    request: InvocationRequest,
    authorization: str = Header(None)
) -> StreamingResponse:
    """
    Invoke AI Assistant with user query
    
    This endpoint handles conversational AI interactions using Intent Router pattern.
    Each query is classified and routed to appropriate sub-agent.
    
    Request payload:
    {
        "user_id": "uuid",
        "session_id": "string",
        "project_id": "uuid",  // Optional
        "user_input": {
            "chat": "What's the status of project XYZ?"
        }
    }
    
    Response: SSE stream with agent responses
    
    Args:
        request: Invocation request with user query
        authorization: Bearer token for authentication
    
    Returns:
        StreamingResponse with SSE events
    """
    try:
        # Extract JWT from Authorization header
        cognito_jwt = None
        if authorization and authorization.startswith("Bearer "):
            cognito_jwt = authorization.replace("Bearer ", "")
        
        # Validate request
        if not request.user_input or not request.user_input.get("chat"):
            raise HTTPException(
                status_code=400,
                detail="user_input.chat is required for AI Assistant"
            )
        
        user_query = request.user_input["chat"]
        
        logger.info(
            f"AI Assistant invocation - User: {request.user_id}, "
            f"Session: {request.session_id}, Query: {user_query[:100]}..."
        )
        
        # Build AI Assistant graph with user's JWT
        global ai_assistant_graph
        if ai_assistant_graph is None:
            ai_assistant_graph = build_ai_assistant_graph(cognito_jwt)
        
        # Load conversation context from session memory
        context = await load_conversation_context(
            user_id=request.user_id,
            session_id=request.session_id,
            project_id=request.project_id
        )
        
        # Create initial state
        initial_state = IntentRouterState(
            user_query=user_query,
            conversation_context=context
        )
        
        # Create streaming response
        return StreamingResponse(
            stream_ai_assistant_response(
                graph=ai_assistant_graph,
                initial_state=initial_state,
                request=request
            ),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"  # Disable nginx buffering
            }
        )
        
    except ValidationError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error invoking AI Assistant: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


async def load_conversation_context(
    user_id: UUID,
    session_id: str,
    project_id: UUID = None
) -> ConversationContext:
    """
    Load conversation context from session memory
    
    Args:
        user_id: User ID
        session_id: Session ID
        project_id: Optional project ID for context
    
    Returns:
        ConversationContext with user preferences and history
    """
    try:
        # Load from session memory (if exists)
        session_key = f"user_{user_id}_session_{session_id}"
        session_data = await memory_manager.retrieve(
            key=session_key,
            memory_type="session",
            scope="user"
        )
        
        if session_data:
            return ConversationContext(
                user_id=user_id,
                session_id=session_id,
                project_id=project_id or session_data.get("active_project_id"),
                active_workflow_id=session_data.get("active_workflow_id"),
                conversation_history=session_data.get("conversation_history", []),
                user_preferences=session_data.get("preferences", {})
            )
        
        # Create new context if not found
        return ConversationContext(
            user_id=user_id,
            session_id=session_id,
            project_id=project_id
        )
        
    except Exception as e:
        logger.warning(f"Could not load session context: {e}")
        # Return minimal context on error
        return ConversationContext(
            user_id=user_id,
            session_id=session_id,
            project_id=project_id
        )


async def stream_ai_assistant_response(
    graph,
    initial_state: IntentRouterState,
    request: InvocationRequest
) -> AsyncGenerator[str, None]:
    """
    Stream AI Assistant response as SSE events
    
    Args:
        graph: Compiled AI Assistant graph
        initial_state: Initial router state
        request: Original request
    
    Yields:
        SSE formatted events
    """
    conversation_id = uuid4()
    
    try:
        # Send conversation_started event
        await sse_manager.send_event(
            event_type="conversation_started",
            data={
                "conversation_id": str(conversation_id),
                "user_query": initial_state.user_query,
                "timestamp": datetime.utcnow().isoformat()
            },
            project_id=request.project_id,
            session_id=request.session_id
        )
        yield sse_manager.format_sse_event("conversation_started", {
            "conversation_id": str(conversation_id),
            "user_query": initial_state.user_query
        })
        
        # Persist user input to conversation history
        if request.project_id:
            await conversation_manager.add_user_message(
                project_id=request.project_id,
                session_id=request.session_id,
                user_id=request.user_id,
                message_type="chat",
                content=initial_state.user_query
            )
        
        # Execute graph (streaming)
        logger.info("Executing AI Assistant graph...")
        
        # Send intent_classifying event
        await sse_manager.send_event(
            event_type="intent_classifying",
            data={"status": "classifying user intent"},
            project_id=request.project_id,
            session_id=request.session_id
        )
        yield sse_manager.format_sse_event("intent_classifying", {})
        
        # Execute graph
        final_state = await graph.ainvoke(initial_state)
        
        # Send intent_classified event
        if final_state.classified_intent:
            await sse_manager.send_event(
                event_type="intent_classified",
                data={
                    "intent": final_state.classified_intent.intent.value,
                    "confidence": final_state.classified_intent.confidence,
                    "agent": final_state.selected_agent
                },
                project_id=request.project_id,
                session_id=request.session_id
            )
            yield sse_manager.format_sse_event("intent_classified", {
                "intent": final_state.classified_intent.intent.value,
                "confidence": final_state.classified_intent.confidence,
                "agent": final_state.selected_agent
            })
        
        # Send agent_responding event
        await sse_manager.send_event(
            event_type="agent_responding",
            data={"agent": final_state.selected_agent},
            project_id=request.project_id,
            session_id=request.session_id
        )
        yield sse_manager.format_sse_event("agent_responding", {
            "agent": final_state.selected_agent
        })
        
        # Send response_ready event with full response
        await sse_manager.send_event(
            event_type="response_ready",
            data={
                "response": final_state.agent_response,
                "metadata": final_state.response_metadata
            },
            project_id=request.project_id,
            session_id=request.session_id
        )
        yield sse_manager.format_sse_event("response_ready", {
            "response": final_state.agent_response,
            "metadata": final_state.response_metadata
        })
        
        # Persist agent response to conversation history
        if request.project_id:
            await conversation_manager.add_agent_message(
                project_id=request.project_id,
                session_id=request.session_id,
                agent_name=final_state.selected_agent or "ai_assistant",
                content=final_state.agent_response,
                metadata=final_state.response_metadata
            )
        
        # Send conversation_completed event
        final_state.completed_at = datetime.utcnow()
        duration = (final_state.completed_at - final_state.started_at).total_seconds()
        
        await sse_manager.send_event(
            event_type="conversation_completed",
            data={
                "conversation_id": str(conversation_id),
                "duration_seconds": duration,
                "errors": final_state.errors
            },
            project_id=request.project_id,
            session_id=request.session_id
        )
        yield sse_manager.format_sse_event("conversation_completed", {
            "conversation_id": str(conversation_id),
            "duration_seconds": duration
        })
        
        logger.info(f"AI Assistant conversation completed in {duration:.2f}s")
        
    except Exception as e:
        logger.error(f"Error streaming AI Assistant response: {e}", exc_info=True)
        
        # Send error event
        await sse_manager.send_event(
            event_type="error_occurred",
            data={
                "error_code": "AI_ASSISTANT_ERROR",
                "error_message": str(e),
                "conversation_id": str(conversation_id)
            },
            project_id=request.project_id,
            session_id=request.session_id
        )
        yield sse_manager.format_sse_event("error_occurred", {
            "error_code": "AI_ASSISTANT_ERROR",
            "error_message": str(e)
        })


if __name__ == "__main__":
    import uvicorn
    
    config = get_config()
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001,  # Different port from Workflow Supervisor (8000)
        log_level="info",
        access_log=True
    )