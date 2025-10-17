"""
Database tools for PostgreSQL operations.

Provides tools for agents to query and manipulate the RDS PostgreSQL database,
including CRUD operations for projects, workflows, tasks, artifacts, etc.
"""

from .project_tools import (
    create_project_document_tool,
    get_project_documents_tool,
    get_project_tool,
    update_project_document_tool,
    update_project_tool,
)
from .workflow_tools import (
    create_agent_task_tool,
    create_workflow_execution_tool,
    get_agent_task_tool,
    get_workflow_execution_tool,
    update_agent_task_tool,
    update_workflow_execution_tool,
)
from .artifact_tools import (
    create_artifact_tool,
    create_artifact_version_tool,
    get_artifact_tool,
    get_artifact_versions_tool,
    get_latest_artifact_version_tool,
    update_artifact_tool,
)
from .query_tools import (
    execute_query_tool,
    execute_transaction_tool,
)

__all__ = [
    # Project tools
    "get_project_tool",
    "update_project_tool",
    "get_project_documents_tool",
    "create_project_document_tool",
    "update_project_document_tool",
    # Workflow tools
    "create_workflow_execution_tool",
    "get_workflow_execution_tool",
    "update_workflow_execution_tool",
    "create_agent_task_tool",
    "get_agent_task_tool",
    "update_agent_task_tool",
    # Artifact tools
    "create_artifact_tool",
    "get_artifact_tool",
    "update_artifact_tool",
    "create_artifact_version_tool",
    "get_artifact_versions_tool",
    "get_latest_artifact_version_tool",
    # Query tools
    "execute_query_tool",
    "execute_transaction_tool",
]