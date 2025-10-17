"""
Observability setup with LangFuse and AgentCore tracing integration.

This module provides:
- LangFuse trace logging for LLM calls
- AgentCore runtime observability integration
- Structured logging with context
- Performance metrics tracking
"""

import logging
import time
import functools
from typing import Optional, Any, Callable
from datetime import datetime
from uuid import UUID, uuid4
from contextlib import contextmanager

from pydantic import BaseModel, Field

from core.config import get_config

logger = logging.getLogger(__name__)

# Try to import LangFuse (optional)
try:
    from langfuse import Langfuse
    from langfuse.decorators import observe, langfuse_context
    LANGFUSE_AVAILABLE = True
except ImportError:
    LANGFUSE_AVAILABLE = False
    logger.warning("LangFuse not available - tracing disabled")
    
    # Mock decorators if LangFuse not available
    def observe(*args, **kwargs):
        def decorator(func):
            return func
        return decorator if args and callable(args[0]) else decorator
    
    class MockLangfuseContext:
        def update_current_trace(self, **kwargs): pass
        def update_current_observation(self, **kwargs): pass
        def flush(self): pass
    
    langfuse_context = MockLangfuseContext()


class TraceMetadata(BaseModel):
    """Metadata for a trace"""
    workflow_execution_id: Optional[UUID] = None
    project_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    session_id: Optional[str] = None
    agent_name: Optional[str] = None
    task_id: Optional[UUID] = None


class PerformanceMetrics(BaseModel):
    """Performance metrics for operations"""
    operation: str
    start_time: datetime = Field(default_factory=datetime.now)
    end_time: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    success: bool = True
    error_message: Optional[str] = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class ObservabilityManager:
    """
    Manages observability with LangFuse and AgentCore integration.
    
    Features:
    - LangFuse trace creation and logging
    - Performance metrics collection
    - Structured logging with context
    - AgentCore runtime integration
    """
    
    def __init__(self):
        self._langfuse_client: Optional[Any] = None
        self._initialized = False
        self._metrics: list[PerformanceMetrics] = []
    
    def initialize(self):
        """Initialize observability clients."""
        if self._initialized:
            return
        
        config = get_config()
        
        # Initialize LangFuse if enabled
        if config.langfuse_enabled and LANGFUSE_AVAILABLE:
            try:
                self._langfuse_client = Langfuse(
                    public_key=config.langfuse_public_key,
                    secret_key=config.langfuse_secret_key,
                    host=config.langfuse_host
                )
                logger.info("LangFuse observability initialized")
            except Exception as e:
                logger.error(f"Failed to initialize LangFuse: {e}")
                self._langfuse_client = None
        else:
            logger.info("LangFuse observability disabled")
        
        self._initialized = True
    
    def create_trace(
        self,
        name: str,
        metadata: Optional[TraceMetadata] = None,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        tags: Optional[list[str]] = None
    ) -> str:
        """
        Create a new trace for workflow/agent execution.
        
        Args:
            name: Trace name (e.g., "workflow_execution", "agent_task")
            metadata: Trace metadata
            user_id: User ID
            session_id: Session ID
            tags: List of tags
            
        Returns:
            Trace ID
        """
        trace_id = str(uuid4())
        
        if self._langfuse_client:
            try:
                meta_dict = metadata.model_dump() if metadata else {}
                
                self._langfuse_client.trace(
                    id=trace_id,
                    name=name,
                    user_id=user_id,
                    session_id=session_id,
                    metadata=meta_dict,
                    tags=tags or []
                )
                
                logger.debug(f"Created trace: {name} (id: {trace_id})")
            except Exception as e:
                logger.error(f"Failed to create trace: {e}")
        
        return trace_id
    
    def update_trace(
        self,
        trace_id: str,
        output: Optional[Any] = None,
        metadata: Optional[dict] = None,
        tags: Optional[list[str]] = None
    ):
        """Update an existing trace."""
        if self._langfuse_client:
            try:
                langfuse_context.update_current_trace(
                    output=output,
                    metadata=metadata,
                    tags=tags
                )
            except Exception as e:
                logger.error(f"Failed to update trace {trace_id}: {e}")
    
    def log_llm_call(
        self,
        model: str,
        input_text: str,
        output_text: str,
        metadata: Optional[dict] = None,
        usage: Optional[dict] = None
    ):
        """
        Log LLM generation call.
        
        Args:
            model: Model name
            input_text: Input prompt
            output_text: Generated output
            metadata: Additional metadata
            usage: Token usage info (prompt_tokens, completion_tokens, total_tokens)
        """
        if self._langfuse_client:
            try:
                self._langfuse_client.generation(
                    name="llm_call",
                    model=model,
                    model_parameters={
                        **(metadata or {})
                    },
                    input=input_text,
                    output=output_text,
                    usage=usage
                )
                logger.debug(f"Logged LLM call: {model}")
            except Exception as e:
                logger.error(f"Failed to log LLM call: {e}")
    
    def track_metric(self, metric: PerformanceMetrics):
        """Track a performance metric."""
        self._metrics.append(metric)
        
        # Log to structured logs
        logger.info(
            f"Performance: {metric.operation}",
            extra={
                "operation": metric.operation,
                "duration_seconds": metric.duration_seconds,
                "success": metric.success,
                "metadata": metric.metadata
            }
        )
    
    @contextmanager
    def track_operation(self, operation: str, metadata: Optional[dict] = None):
        """
        Context manager to track operation performance.
        
        Usage:
            with observability.track_operation("parse_document"):
                # Your code here
                pass
        """
        metric = PerformanceMetrics(
            operation=operation,
            metadata=metadata or {}
        )
        
        start = time.time()
        
        try:
            yield metric
            metric.success = True
        except Exception as e:
            metric.success = False
            metric.error_message = str(e)
            raise
        finally:
            metric.end_time = datetime.now()
            metric.duration_seconds = time.time() - start
            self.track_metric(metric)
    
    def get_metrics(self, operation: Optional[str] = None) -> list[PerformanceMetrics]:
        """
        Get collected metrics.
        
        Args:
            operation: Optional filter by operation name
            
        Returns:
            List of metrics
        """
        if operation:
            return [m for m in self._metrics if m.operation == operation]
        return self._metrics.copy()
    
    def clear_metrics(self):
        """Clear collected metrics."""
        self._metrics.clear()
    
    def flush(self):
        """Flush any pending traces to LangFuse."""
        if self._langfuse_client:
            try:
                langfuse_context.flush()
                logger.debug("Flushed LangFuse traces")
            except Exception as e:
                logger.error(f"Failed to flush LangFuse: {e}")


# Global observability manager
observability = ObservabilityManager()


def init_observability():
    """Initialize global observability manager."""
    observability.initialize()


def trace_workflow(func: Callable) -> Callable:
    """
    Decorator to trace workflow execution.
    
    Usage:
        @trace_workflow
        async def execute_workflow(state):
            ...
    """
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        # Extract workflow info from args/kwargs
        workflow_name = func.__name__
        
        trace_id = observability.create_trace(
            name=f"workflow:{workflow_name}",
            tags=["workflow"]
        )
        
        try:
            result = await func(*args, **kwargs)
            observability.update_trace(
                trace_id,
                output={"status": "success"},
                metadata={"workflow": workflow_name}
            )
            return result
        except Exception as e:
            observability.update_trace(
                trace_id,
                output={"status": "failed", "error": str(e)},
                metadata={"workflow": workflow_name}
            )
            raise
        finally:
            observability.flush()
    
    return wrapper


def trace_agent(agent_name: str):
    """
    Decorator to trace agent execution.
    
    Usage:
        @trace_agent("parser")
        async def execute_parser(input_data):
            ...
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            trace_id = observability.create_trace(
                name=f"agent:{agent_name}",
                tags=["agent", agent_name]
            )
            
            with observability.track_operation(f"agent_{agent_name}"):
                try:
                    result = await func(*args, **kwargs)
                    observability.update_trace(
                        trace_id,
                        output={"status": "success"},
                        metadata={"agent": agent_name}
                    )
                    return result
                except Exception as e:
                    observability.update_trace(
                        trace_id,
                        output={"status": "failed", "error": str(e)},
                        metadata={"agent": agent_name}
                    )
                    raise
                finally:
                    observability.flush()
        
        return wrapper
    return decorator


# Structured logging helpers
def log_with_context(
    level: str,
    message: str,
    workflow_execution_id: Optional[UUID] = None,
    project_id: Optional[UUID] = None,
    agent_name: Optional[str] = None,
    **extra_fields
):
    """
    Log message with structured context.
    
    Args:
        level: Log level (INFO, WARNING, ERROR, etc.)
        message: Log message
        workflow_execution_id: Optional workflow ID
        project_id: Optional project ID
        agent_name: Optional agent name
        **extra_fields: Additional structured fields
    """
    context = {
        "workflow_execution_id": str(workflow_execution_id) if workflow_execution_id else None,
        "project_id": str(project_id) if project_id else None,
        "agent_name": agent_name,
        **extra_fields
    }
    
    # Remove None values
    context = {k: v for k, v in context.items() if v is not None}
    
    log_func = getattr(logger, level.lower(), logger.info)
    log_func(message, extra=context)