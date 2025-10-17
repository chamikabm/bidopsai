"""
Supervisor implementations package.

This package contains supervisor agents that orchestrate workflows:
- Workflow Supervisor: Main bid processing orchestrator (StateGraph)
- AI Assistant Supervisor: Conversational AI assistant (Intent Router)
"""

from agents_core.supervisors.workflow_supervisor import (
    WorkflowSupervisor,
    create_workflow_supervisor
)

__all__ = [
    "WorkflowSupervisor",
    "create_workflow_supervisor",
]