"""
Workflow Graph Node Implementations - Refactored for OOP Agent Pattern

Individual node functions for the Workflow Supervisor StateGraph.
Each node receives WorkflowGraphState, executes agent via Strands invocation, and returns updated state.

CRITICAL: Agents are OOP class instances that expose Strands Agent via get_agent().
They are invoked via agent_instance.get_agent().ainvoke(), following proper OOP patterns.

Node Types:
- Initialization: Setup workflow and tasks
- Agent Execution: Invoke Strands agents (Parser, Analysis, Content, etc.)
- User Interaction: Await and process feedback
- Completion: Finalize workflow

All nodes emit SSE events and update database records.
"""

import json
from datetime import datetime
from typing import Dict, Any, Optional
from uuid import UUID

from core.database import db_pool
from core.sse_manager import get_sse_manager
from core.error_handling import AgentError, ErrorCode, ErrorSeverity
from core.observability import log_agent_action
from models.workflow_models import WorkflowExecutionStatus
from models.sse_models import (
    WorkflowCreated,
    AgentHandoff,
    AwaitingFeedback,
    WorkflowStatusUpdate,
    WorkflowCompleted
)
from tools.database.db_tools import (
    create_workflow_execution,
    create_agent_task,
    update_workflow_execution,
    update_agent_task,
    get_next_incomplete_task,
    update_project
)
from tools.storage.artifact_export import ArtifactExporter

# Import OOP agent classes (not factory functions)
from agents import (
    ParserAgent,
    AnalysisAgent,
    ContentAgent,
    ComplianceAgent,
    QAAgent,
    CommsAgent,
    SubmissionAgent
)

from supervisors.workflow.state_models import WorkflowGraphState


# Module-level manager instances (initialized once)
_sse_manager = None
_agent_name = "workflow_supervisor"


def _get_sse_manager():
    """Get SSE manager instance"""
    global _sse_manager
    if _sse_manager is None:
        _sse_manager = get_sse_manager()
    return _sse_manager


def _extract_agent_output(agent_result: Any) -> Dict[str, Any]:
    """
    Extract structured output from Strands Agent result.
    
    Strands agents return AIMessage objects. We need to extract the
    actual content/output from the message.
    
    Args:
        agent_result: Raw result from agent.ainvoke()
        
    Returns:
        Structured dictionary with agent output
    """
    # Check if result has messages (typical Strands response)
    if hasattr(agent_result, "messages") and agent_result.messages:
        last_message = agent_result.messages[-1]
        content = last_message.content if hasattr(last_message, "content") else str(last_message)
    elif hasattr(agent_result, "content"):
        content = agent_result.content
    else:
        content = str(agent_result)
    
    # Try to parse as JSON if structured output was used
    try:
        if isinstance(content, str):
            parsed = json.loads(content)
            return parsed if isinstance(parsed, dict) else {"output": parsed}
        return {"output": content}
    except (json.JSONDecodeError, TypeError):
        return {"output": content}


async def _invoke_agent_with_context(
    agent_instance,
    agent_name: str,
    state: WorkflowGraphState,
    context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Invoke a Strands agent with proper context structure.
    
    OOP Pattern: Takes agent instance (ParserAgent, AnalysisAgent, etc.),
    calls get_agent() to get Strands Agent, then invokes.
    
    Strands agents expect input in the format:
    {
        "messages": [...],  # Conversation history
        "context": {...}    # Additional context data
    }
    
    Args:
        agent_instance: OOP agent instance (e.g., ParserAgent, AnalysisAgent)
        agent_name: Name of the agent (for logging)
        state: Current workflow state
        context: Additional context from previous agents
        
    Returns:
        Extracted agent output as dictionary
    """
    # Prepare input for Strands agent
    input_data = {
        "messages": [
            {
                "role": "system",
                "content": f"Execute {agent_name} task for workflow {state.workflow_execution_id}"
            },
            {
                "role": "user",
                "content": f"Process task for project {state.project_id}"
            }
        ],
        "context": {
            "workflow_execution_id": str(state.workflow_execution_id),
            "project_id": str(state.project_id),
            "user_id": str(state.user_id),
            "session_id": state.session_id,
            "previous_outputs": state.task_outputs,
            **(context or {})
        }
    }
    
    log_agent_action(
        agent_name=_agent_name,
        action=f"invoking_{agent_name}_agent",
        details={
            "workflow_id": str(state.workflow_execution_id),
            "has_context": context is not None
        }
    )
    
    # Get Strands Agent from OOP instance and invoke
    strands_agent = agent_instance.get_agent()
    result = await strands_agent.ainvoke(input_data)
    
    # Extract structured output
    output = _extract_agent_output(result)
    
    log_agent_action(
        agent_name=_agent_name,
        action=f"{agent_name}_agent_completed",
        details={
            "workflow_id": str(state.workflow_execution_id),
            "output_keys": list(output.keys())
        }
    )
    
    return output


# ========================================
# Supervisor Orchestrator Node
# ========================================

async def supervisor_node(state: WorkflowGraphState) -> WorkflowGraphState:
    """
    Supervisor orchestrator node - analyzes state and decides next action.
    
    This is the central orchestrator that:
    1. Analyzes completed tasks and current workflow state
    2. Determines the next appropriate action/node
    3. Handles feedback loops and retries
    4. Manages workflow progression
    
    Decision Logic:
    - First call: Initialize workflow
    - After initialize: Start with parser
    - After parser: Move to analysis
    - After analysis: Await user feedback
    - After feedback: Decide reparse/reanalyze/proceed
    - After content: Check compliance
    - After compliance: If passed, QA; else retry content
    - After QA: If passed, await review; else retry content
    - After review: If approved, export; else retry content
    - After export: Await comms permission
    - After comms decision: If yes, run comms; else await submission
    - After comms: Await submission permission
    - After submission decision: If yes, run submission; else complete
    - After submission: Complete workflow
    
    Args:
        state: Current workflow graph state
        
    Returns:
        Updated state with next_node decision
    """
    log_agent_action(
        agent_name=_agent_name,
        action="supervisor_analyzing_state",
        details={
            "workflow_id": str(state.workflow_execution_id) if state.workflow_execution_id else "not_initialized",
            "completed_tasks": state.completed_tasks,
            "current_status": state.current_status
        }
    )
    
    # Determine next node based on workflow state
    next_node = None
    reason = ""
    
    # Check if workflow needs initialization
    if not state.workflow_execution_id:
        next_node = "initialize"
        reason = "Workflow not initialized yet"
    
    # After initialization, start parser
    elif "initialize" in state.completed_tasks and "parser" not in state.completed_tasks:
        next_node = "parser"
        reason = "Workflow initialized, starting parser"
    
    # After parser, run analysis
    elif "parser" in state.completed_tasks and "analysis" not in state.completed_tasks:
        next_node = "analysis"
        reason = "Parser completed, starting analysis"
    
    # After analysis, await feedback
    elif "analysis" in state.completed_tasks and not state.awaiting_user_feedback:
        next_node = "await_analysis_feedback"
        reason = "Analysis completed, awaiting user feedback"
    
    # After feedback, check intent
    elif state.awaiting_user_feedback and "await_analysis_feedback" in state.completed_tasks:
        feedback_output = state.task_outputs.get("await_analysis_feedback", {})
        intent = feedback_output.get("intent", "proceed")
        
        if intent == "reparse":
            # Reset tasks for reparse
            state.completed_tasks = [t for t in state.completed_tasks if t not in ["parser", "analysis", "await_analysis_feedback"]]
            next_node = "parser"
            reason = "User requested reparse"
        elif intent == "reanalyze":
            # Reset analysis task
            state.completed_tasks = [t for t in state.completed_tasks if t not in ["analysis", "await_analysis_feedback"]]
            next_node = "analysis"
            reason = "User requested reanalysis"
        else:
            next_node = "content"
            reason = "User approved analysis, proceeding to content"
            state.awaiting_user_feedback = False
    
    # After content, check compliance
    elif "content" in state.completed_tasks and "compliance" not in state.completed_tasks:
        next_node = "compliance"
        reason = "Content completed, checking compliance"
    
    # After compliance, check if passed
    elif "compliance" in state.completed_tasks:
        compliance_output = state.task_outputs.get("compliance", {})
        is_compliant = compliance_output.get("is_compliant", False)
        
        if not is_compliant and "qa" not in state.completed_tasks:
            # Reset content and compliance for retry
            state.completed_tasks = [t for t in state.completed_tasks if t not in ["content", "compliance"]]
            next_node = "content"
            reason = "Compliance failed, retrying content"
        elif "qa" not in state.completed_tasks:
            next_node = "qa"
            reason = "Compliance passed, starting QA"
    
    # After QA, check if passed
    elif "qa" in state.completed_tasks and "await_artifact_review" not in state.completed_tasks:
        qa_output = state.task_outputs.get("qa", {})
        overall_status = qa_output.get("overall_status", "")
        
        if overall_status != "complete":
            # Reset content, compliance, QA for retry
            state.completed_tasks = [t for t in state.completed_tasks if t not in ["content", "compliance", "qa"]]
            next_node = "content"
            reason = "QA failed, retrying content"
        else:
            next_node = "await_artifact_review"
            reason = "QA passed, awaiting artifact review"
    
    # After artifact review, check if approved
    elif "await_artifact_review" in state.completed_tasks and not state.artifact_export_completed:
        review_output = state.task_outputs.get("await_artifact_review", {})
        approved = review_output.get("approved", False)
        
        if not approved:
            # Reset content pipeline for retry
            state.completed_tasks = [t for t in state.completed_tasks if t not in ["content", "compliance", "qa", "await_artifact_review"]]
            next_node = "content"
            reason = "Artifacts not approved, retrying content"
        else:
            next_node = "export_artifacts"
            reason = "Artifacts approved, exporting to S3"
    
    # After export, await comms permission
    elif state.artifact_export_completed and "await_comms_permission" not in state.completed_tasks:
        next_node = "await_comms_permission"
        reason = "Artifacts exported, awaiting comms permission"
    
    # After comms permission, decide
    elif "await_comms_permission" in state.completed_tasks and "comms" not in state.completed_tasks:
        permission_output = state.task_outputs.get("await_comms_permission", {})
        approved = permission_output.get("approved", False)
        
        if approved:
            next_node = "comms"
            reason = "Comms approved, sending notifications"
        else:
            next_node = "await_submission_permission"
            reason = "Comms skipped, awaiting submission permission"
    
    # After comms, await submission permission
    elif "comms" in state.completed_tasks and "await_submission_permission" not in state.completed_tasks:
        next_node = "await_submission_permission"
        reason = "Comms completed, awaiting submission permission"
    
    # After submission permission, decide
    elif "await_submission_permission" in state.completed_tasks and "submission" not in state.completed_tasks:
        permission_output = state.task_outputs.get("await_submission_permission", {})
        approved = permission_output.get("approved", False)
        
        if approved:
            next_node = "submission"
            reason = "Submission approved, sending bid"
        else:
            next_node = "complete"
            reason = "Submission skipped, completing workflow"
    
    # After submission, complete
    elif "submission" in state.completed_tasks:
        next_node = "complete"
        reason = "Submission completed, completing workflow"
    
    # Default fallback
    else:
        next_node = "complete"
        reason = "All tasks completed or error state, completing workflow"
    
    # Store decision in state
    state.task_outputs["supervisor"] = {
        "next_node": next_node,
        "reason": reason,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    log_agent_action(
        agent_name=_agent_name,
        action="supervisor_decision",
        details={
            "next_node": next_node,
            "reason": reason,
            "completed_tasks": state.completed_tasks
        }
    )
    
    return state


# ========================================
# Initialization Node
# ========================================

async def initialize_workflow_node(state: WorkflowGraphState) -> WorkflowGraphState:
    """
    Initialize workflow execution and create task records.
    
    Creates:
    - WorkflowExecution database record
    - AgentTask records for each agent in sequence
    - Emits workflow_created SSE event
    
    Args:
        state: Current graph state
        
    Returns:
        Updated state with workflow_execution_id set
    """
    log_agent_action(
        agent_name=_agent_name,
        action="initialize_workflow",
        details={"project_id": str(state.project_id)}
    )
    
    # Create workflow execution record
    workflow_execution = await create_workflow_execution(
        project_id=str(state.project_id),
        session_id=state.session_id,
        initiated_by=str(state.user_id),
        workflow_config={"mode": "workflow", "session_id": state.session_id}
    )
    
    workflow_id = UUID(workflow_execution["id"])
    
    # Create agent tasks in sequence
    agent_sequence = [
        ("parser", 1),
        ("analysis", 2),
        ("content", 3),
        ("compliance", 4),
        ("qa", 5),
        ("comms", 6),
        ("submission", 7),
    ]
    
    for agent_name, sequence in agent_sequence:
        await create_agent_task(
            workflow_execution_id=str(workflow_id),
            agent=agent_name,
            sequence_order=sequence,
            initiated_by=str(state.user_id)
        )
    
    # Send workflow created event
    sse_manager = _get_sse_manager()
    await sse_manager.send_event(
        session_id=state.session_id,
        event=WorkflowCreated(
            workflow_execution_id=str(workflow_id),
            project_id=str(state.project_id),
            total_tasks=len(agent_sequence),
            timestamp=datetime.utcnow()
        )
    )
    
    # Update state
    state.workflow_execution_id = workflow_id
    state.current_status = WorkflowExecutionStatus.IN_PROGRESS.value
    state.last_updated_at = datetime.utcnow()
    
    log_agent_action(
        agent_name=_agent_name,
        action="workflow_initialized",
        details={
            "workflow_id": str(workflow_id),
            "tasks_created": len(agent_sequence)
        }
    )
    
    return state


# ========================================
# Agent Execution Nodes (OOP Pattern)
# ========================================

async def parser_agent_node(state: WorkflowGraphState) -> WorkflowGraphState:
    """
    Execute Parser Agent node via OOP class instantiation.
    
    Parses uploaded project documents using Bedrock Data Automation.
    Updates ProjectDocument records with processed_file_location.
    
    Args:
        state: Current graph state
        
    Returns:
        Updated state with parser output
    """
    # Get parser task
    task = await get_next_incomplete_task(
        workflow_execution_id=str(state.workflow_execution_id),
        agent="parser"
    )
    
    if not task:
        raise AgentError(
            code=ErrorCode.AGENT_NO_DATA_FOUND,
            message="Parser task not found",
            severity=ErrorSeverity.HIGH
        )
    
    task_id = UUID(task["id"])
    
    # Update task to in progress
    await update_agent_task(
        task_id=str(task_id),
        status="IN_PROGRESS",
        started_at=datetime.utcnow().isoformat(),
        handled_by=str(state.user_id)
    )
    
    # Send handoff event
    sse_manager = _get_sse_manager()
    await sse_manager.send_event(
        session_id=state.session_id,
        event=AgentHandoff(
            from_agent="supervisor",
            to_agent="parser",
            agent_task_id=str(task_id),
            timestamp=datetime.utcnow()
        )
    )
    
    try:
        # Create Parser agent (Java-style instantiation)
        parser = ParserAgent(mode="workflow", provider="bedrock")
        
        # Invoke agent via OOP pattern
        output = await _invoke_agent_with_context(
            agent_instance=parser,
            agent_name="parser",
            state=state,
            context={}
        )
        
        # Update task as completed
        await update_agent_task(
            task_id=str(task_id),
            status="COMPLETED",
            output_data=output,
            completed_at=datetime.utcnow().isoformat(),
            completed_by=str(state.user_id)
        )
        
        # Update state
        state.task_outputs["parser"] = output
        state.completed_tasks.append("parser")
        state.current_agent = "parser"
        
        # Update workflow
        await update_workflow_execution(
            workflow_execution_id=str(state.workflow_execution_id)
        )
        
        # Update project progress (10% after parsing)
        await update_project(
            project_id=str(state.project_id),
            progress_percentage=10
        )
        
    except Exception as e:
        # Update task as failed
        await update_agent_task(
            task_id=str(task_id),
            status="FAILED",
            error_message=str(e),
            error_log=[{"error": str(e), "type": type(e).__name__}]
        )
        raise
    
    return state


async def analysis_agent_node(state: WorkflowGraphState) -> WorkflowGraphState:
    """
    Execute Analysis Agent node via OOP class instantiation.
    
    Analyzes RFP requirements, extracts client info, identifies deliverables.
    Generates markdown analysis report for user review.
    
    Args:
        state: Current graph state
        
    Returns:
        Updated state with analysis output
    """
    # Get analysis task
    task = await get_next_incomplete_task(
        workflow_execution_id=str(state.workflow_execution_id),
        agent="analysis"
    )
    
    if not task:
        raise AgentError(
            code=ErrorCode.AGENT_NO_DATA_FOUND,
            message="Analysis task not found",
            severity=ErrorSeverity.HIGH
        )
    
    task_id = UUID(task["id"])
    
    # Update task to in progress
    await update_agent_task(
        agent_task_id=task_id,
        status="IN_PROGRESS",
        started_at=datetime.utcnow(),
        handled_by=str(state.user_id)
    )
    
    # Send handoff event
    sse_manager = _get_sse_manager()
    await sse_manager.send_event(
        session_id=state.session_id,
        event=AgentHandoff(
            from_agent="parser",
            to_agent="analysis",
            agent_task_id=str(task_id),
            timestamp=datetime.utcnow()
        )
    )
    
    try:
        # Create Analysis agent (Java-style instantiation)
        analysis = AnalysisAgent(mode="workflow", provider="bedrock")
        
        # Pass parser output in context
        parser_output = state.task_outputs.get("parser", {})
        context = {"parser_output": parser_output}
        
        # Invoke agent via OOP pattern
        output = await _invoke_agent_with_context(
            agent_instance=analysis,
            agent_name="analysis",
            state=state,
            context=context
        )
        
        # Update task as completed
        await update_agent_task(
            agent_task_id=task_id,
            status="COMPLETED",
            output_data=output,
            completed_at=datetime.utcnow().isoformat(),
            completed_by=str(state.user_id)
        )
        
        # Update state
        state.task_outputs["analysis"] = output
        state.completed_tasks.append("analysis")
        state.current_agent = "analysis"
        
        # Update workflow
        await update_workflow_execution(
            workflow_execution_id=state.workflow_execution_id,
            last_updated_at=datetime.utcnow().isoformat()
        )
        
        # Update project progress (20% after analysis)
        await update_project(
            project_id=state.project_id,
            progress_percentage=20,
            updated_at=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        # Update task as failed
        await update_agent_task(
            agent_task_id=task_id,
            status="FAILED",
            error_message=str(e),
            error_log={"error": str(e), "type": type(e).__name__}
        )
        raise
    
    return state


async def content_agent_node(state: WorkflowGraphState) -> WorkflowGraphState:
    """
    Execute Content Agent node via OOP class instantiation.
    
    Generates bid artifacts (documents, Q&A, spreadsheets) using Knowledge Agent.
    Creates Artifact and ArtifactVersion database records.
    
    Args:
        state: Current graph state
        
    Returns:
        Updated state with content output
    """
    # Get content task
    task = await get_next_incomplete_task(
        workflow_execution_id=str(state.workflow_execution_id),
        agent="content"
    )
    
    if not task:
        raise AgentError(
            code=ErrorCode.AGENT_NO_DATA_FOUND,
            message="Content task not found",
            severity=ErrorSeverity.HIGH
        )
    
    task_id = UUID(task["id"])
    
    # Update task to in progress
    await update_agent_task(
        agent_task_id=task_id,
        status="IN_PROGRESS",
        started_at=datetime.utcnow(),
        handled_by=str(state.user_id)
    )
    
    # Send handoff event
    sse_manager = _get_sse_manager()
    await sse_manager.send_event(
        session_id=state.session_id,
        event=AgentHandoff(
            from_agent="analysis",
            to_agent="content",
            agent_task_id=str(task_id),
            timestamp=datetime.utcnow()
        )
    )
    
    try:
        # Create Content agent (Java-style instantiation)
        # Note: ContentAgent has KnowledgeAgent via Composition
        content = ContentAgent(mode="workflow", provider="bedrock")
        
        # Pass analysis output and any compliance/QA feedback in context
        context = {
            "analysis_output": state.task_outputs.get("analysis", {}),
            "compliance_feedback": state.task_outputs.get("compliance", {}),
            "qa_feedback": state.task_outputs.get("qa", {}),
            "user_edits": state.content_edits
        }
        
        # Invoke agent via OOP pattern
        output = await _invoke_agent_with_context(
            agent_instance=content,
            agent_name="content",
            state=state,
            context=context
        )
        
        # Update task as completed
        await update_agent_task(
            agent_task_id=task_id,
            status="COMPLETED",
            output_data=output,
            completed_at=datetime.utcnow().isoformat(),
            completed_by=str(state.user_id)
        )
        
        # Update state
        state.task_outputs["content"] = output
        state.completed_tasks.append("content")
        state.current_agent = "content"
        
        # Update workflow
        await update_workflow_execution(
            workflow_execution_id=state.workflow_execution_id,
            last_updated_at=datetime.utcnow().isoformat()
        )
        
        # Update project progress (40% after content)
        await update_project(
            project_id=state.project_id,
            progress_percentage=40,
            updated_at=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        # Update task as failed
        await update_agent_task(
            agent_task_id=task_id,
            status="FAILED",
            error_message=str(e),
            error_log={"error": str(e), "type": type(e).__name__}
        )
        raise
    
    return state


async def compliance_agent_node(state: WorkflowGraphState) -> WorkflowGraphState:
    """
    Execute Compliance Agent node via OOP class instantiation.
    
    Validates artifacts against Deloitte standards and compliance requirements.
    Provides feedback for non-compliant content.
    
    Args:
        state: Current graph state
        
    Returns:
        Updated state with compliance output
    """
    # Get compliance task
    task = await get_next_incomplete_task(
        workflow_execution_id=str(state.workflow_execution_id),
        agent="compliance"
    )
    
    if not task:
        raise AgentError(
            code=ErrorCode.AGENT_NO_DATA_FOUND,
            message="Compliance task not found",
            severity=ErrorSeverity.HIGH
        )
    
    task_id = UUID(task["id"])
    
    # Update task to in progress
    await update_agent_task(
        agent_task_id=task_id,
        status="IN_PROGRESS",
        started_at=datetime.utcnow(),
        handled_by=str(state.user_id)
    )
    
    # Send handoff event
    sse_manager = _get_sse_manager()
    await sse_manager.send_event(
        session_id=state.session_id,
        event=AgentHandoff(
            from_agent="content",
            to_agent="compliance",
            agent_task_id=str(task_id),
            timestamp=datetime.utcnow()
        )
    )
    
    try:
        # Create Compliance agent (Java-style instantiation)
        compliance = ComplianceAgent(mode="workflow", provider="bedrock")
        
        # Pass content output in context
        context = {"content_output": state.task_outputs.get("content", {})}
        
        # Invoke agent via OOP pattern
        output = await _invoke_agent_with_context(
            agent_instance=compliance,
            agent_name="compliance",
            state=state,
            context=context
        )
        
        # Update task as completed
        await update_agent_task(
            agent_task_id=task_id,
            status="COMPLETED",
            output_data=output,
            completed_at=datetime.utcnow().isoformat(),
            completed_by=str(state.user_id)
        )
        
        # Update state
        state.task_outputs["compliance"] = output
        state.completed_tasks.append("compliance")
        state.current_agent = "compliance"
        
        # Update workflow
        await update_workflow_execution(
            workflow_execution_id=state.workflow_execution_id,
            last_updated_at=datetime.utcnow().isoformat()
        )
        
        # Update project progress (60% after compliance)
        await update_project(
            project_id=state.project_id,
            progress_percentage=60,
            updated_at=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        # Update task as failed
        await update_agent_task(
            agent_task_id=task_id,
            status="FAILED",
            error_message=str(e),
            error_log={"error": str(e), "type": type(e).__name__}
        )
        raise
    
    return state


async def qa_agent_node(state: WorkflowGraphState) -> WorkflowGraphState:
    """
    Execute QA Agent node via OOP class instantiation.
    
    Performs quality assurance checks on artifacts.
    Identifies gaps, missing content, or quality issues.
    
    Args:
        state: Current graph state
        
    Returns:
        Updated state with QA output
    """
    # Get QA task
    task = await get_next_incomplete_task(
        workflow_execution_id=str(state.workflow_execution_id),
        agent="qa"
    )
    
    if not task:
        raise AgentError(
            code=ErrorCode.AGENT_NO_DATA_FOUND,
            message="QA task not found",
            severity=ErrorSeverity.HIGH
        )
    
    task_id = UUID(task["id"])
    
    # Update task to in progress
    await update_agent_task(
        agent_task_id=task_id,
        status="IN_PROGRESS",
        started_at=datetime.utcnow(),
        handled_by=str(state.user_id)
    )
    
    # Send handoff event
    sse_manager = _get_sse_manager()
    await sse_manager.send_event(
        session_id=state.session_id,
        event=AgentHandoff(
            from_agent="compliance",
            to_agent="qa",
            agent_task_id=str(task_id),
            timestamp=datetime.utcnow()
        )
    )
    
    try:
        # Create QA agent (Java-style instantiation)
        qa = QAAgent(mode="workflow", provider="bedrock")
        
        # Pass content and analysis outputs in context
        context = {
            "content_output": state.task_outputs.get("content", {}),
            "analysis_output": state.task_outputs.get("analysis", {})
        }
        
        # Invoke agent via OOP pattern
        output = await _invoke_agent_with_context(
            agent_instance=qa,
            agent_name="qa",
            state=state,
            context=context
        )
        
        # Update task as completed
        await update_agent_task(
            agent_task_id=task_id,
            status="COMPLETED",
            output_data=output,
            completed_at=datetime.utcnow().isoformat(),
            completed_by=str(state.user_id)
        )
        
        # Update state
        state.task_outputs["qa"] = output
        state.completed_tasks.append("qa")
        state.current_agent = "qa"
        
        # Update workflow
        await update_workflow_execution(
            workflow_execution_id=state.workflow_execution_id,
            last_updated_at=datetime.utcnow().isoformat()
        )
        
        # Update project progress (70% after QA)
        await update_project(
            project_id=state.project_id,
            progress_percentage=70,
            updated_at=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        # Update task as failed
        await update_agent_task(
            agent_task_id=task_id,
            status="FAILED",
            error_message=str(e),
            error_log={"error": str(e), "type": type(e).__name__}
        )
        raise
    
    return state


async def comms_agent_node(state: WorkflowGraphState) -> WorkflowGraphState:
    """
    Execute Comms Agent node via OOP class instantiation.
    
    Creates Slack channels, sends notifications to project members.
    Creates notification records in database.
    
    Args:
        state: Current graph state
        
    Returns:
        Updated state with comms output
    """
    # Get comms task
    task = await get_next_incomplete_task(
        workflow_execution_id=str(state.workflow_execution_id),
        agent="comms"
    )
    
    if not task:
        raise AgentError(
            code=ErrorCode.AGENT_NO_DATA_FOUND,
            message="Comms task not found",
            severity=ErrorSeverity.HIGH
        )
    
    task_id = UUID(task["id"])
    
    # Update task to in progress
    await update_agent_task(
        agent_task_id=task_id,
        status="IN_PROGRESS",
        started_at=datetime.utcnow(),
        handled_by=str(state.user_id)
    )
    
    # Send handoff event
    sse_manager = _get_sse_manager()
    await sse_manager.send_event(
        session_id=state.session_id,
        event=AgentHandoff(
            from_agent="supervisor",
            to_agent="comms",
            agent_task_id=str(task_id),
            timestamp=datetime.utcnow()
        )
    )
    
    try:
        # Create Comms agent (Java-style instantiation)
        comms = CommsAgent(mode="workflow", provider="bedrock")
        
        # Pass artifact export locations in context
        context = {
            "artifact_locations": state.artifact_export_locations,
            "project_id": str(state.project_id)
        }
        
        # Invoke agent via OOP pattern
        output = await _invoke_agent_with_context(
            agent_instance=comms,
            agent_name="comms",
            state=state,
            context=context
        )
        
        # Update task as completed
        await update_agent_task(
            agent_task_id=task_id,
            status="COMPLETED",
            output_data=output,
            completed_at=datetime.utcnow().isoformat(),
            completed_by=str(state.user_id)
        )
        
        # Update state
        state.task_outputs["comms"] = output
        state.completed_tasks.append("comms")
        state.current_agent = "comms"
        
        # Update workflow
        await update_workflow_execution(
            workflow_execution_id=state.workflow_execution_id,
            last_updated_at=datetime.utcnow().isoformat()
        )
        
        # Update project progress (90% after comms)
        await update_project(
            project_id=state.project_id,
            progress_percentage=90,
            updated_at=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        # Update task as failed (but don't fail workflow)
        await update_agent_task(
            agent_task_id=task_id,
            status="FAILED",
            error_message=str(e),
            error_log={"error": str(e), "type": type(e).__name__}
        )
        # Log but continue - comms is not critical
        log_agent_action(
            agent_name=_agent_name,
            action="comms_failed_continuing",
            details={"error": str(e)},
            level="warning"
        )
    
    return state


async def submission_agent_node(state: WorkflowGraphState) -> WorkflowGraphState:
    """
    Execute Submission Agent node via OOP class instantiation.
    
    Generates email draft, sends email with artifacts to client.
    Creates submission record in database.
    
    Args:
        state: Current graph state
        
    Returns:
        Updated state with submission output
    """
    # Get submission task
    task = await get_next_incomplete_task(
        workflow_execution_id=str(state.workflow_execution_id),
        agent="submission"
    )
    
    if not task:
        raise AgentError(
            code=ErrorCode.AGENT_NO_DATA_FOUND,
            message="Submission task not found",
            severity=ErrorSeverity.HIGH
        )
    
    task_id = UUID(task["id"])
    
    # Update task to in progress
    await update_agent_task(
        agent_task_id=task_id,
        status="IN_PROGRESS",
        started_at=datetime.utcnow(),
        handled_by=str(state.user_id)
    )
    
    # Send handoff event
    sse_manager = _get_sse_manager()
    await sse_manager.send_event(
        session_id=state.session_id,
        event=AgentHandoff(
            from_agent="comms",
            to_agent="submission",
            agent_task_id=str(task_id),
            timestamp=datetime.utcnow()
        )
    )
    
    try:
        # Create Submission agent (Java-style instantiation)
        submission = SubmissionAgent(mode="workflow", provider="bedrock")
        
        # Pass analysis and artifact data in context
        context = {
            "analysis_output": state.task_outputs.get("analysis", {}),
            "artifact_locations": state.artifact_export_locations,
            "project_id": str(state.project_id)
        }
        
        # Invoke agent via OOP pattern
        output = await _invoke_agent_with_context(
            agent_instance=submission,
            agent_name="submission",
            state=state,
            context=context
        )
        
        # Update task as completed
        await update_agent_task(
            agent_task_id=task_id,
            status="COMPLETED",
            output_data=output,
            completed_at=datetime.utcnow().isoformat(),
            completed_by=str(state.user_id)
        )
        
        # Update state
        state.task_outputs["submission"] = output
        state.completed_tasks.append("submission")
        state.current_agent = "submission"
        
        # Update workflow
        await update_workflow_execution(
            workflow_execution_id=state.workflow_execution_id,
            last_updated_at=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        # Update task as failed
        await update_agent_task(
            agent_task_id=task_id,
            status="FAILED",
            error_message=str(e),
            error_log={"error": str(e), "type": type(e).__name__}
        )
        raise
    
    return state


# ========================================
# User Interaction Nodes
# ========================================

async def await_analysis_feedback_node(state: WorkflowGraphState) -> WorkflowGraphState:
    """
    Pause workflow and await user feedback on analysis.
    
    Updates workflow status to WAITING and emits awaiting_feedback SSE event.
    
    Args:
        state: Current graph state
        
    Returns:
        Updated state with awaiting_feedback=True
    """
    # Update workflow to waiting status
    await update_workflow_execution(
        workflow_execution_id=state.workflow_execution_id,
        status=WorkflowExecutionStatus.WAITING.value,
        last_updated_at=datetime.utcnow().isoformat()
    )
    
    # Send awaiting feedback event
    sse_manager = _get_sse_manager()
    await sse_manager.send_event(
        session_id=state.session_id,
        event=AwaitingFeedback(
            workflow_execution_id=str(state.workflow_execution_id),
            prompt="Please review the analysis and provide feedback. Type 'approved' to continue, or describe any changes needed.",
            timestamp=datetime.utcnow()
        )
    )
    
    state.awaiting_user_feedback = True
    state.current_status = WorkflowExecutionStatus.WAITING.value
    
    log_agent_action(
        agent_name=_agent_name,
        action="awaiting_analysis_feedback",
        details={"workflow_id": str(state.workflow_execution_id)}
    )
    
    return state


async def await_artifact_review_node(state: WorkflowGraphState) -> WorkflowGraphState:
    """
    Pause workflow and await user review of artifacts.
    
    Updates workflow status to WAITING and emits awaiting_feedback SSE event.
    
    Args:
        state: Current graph state
        
    Returns:
        Updated state with awaiting_feedback=True
    """
    # Update workflow to waiting status
    await update_workflow_execution(
        workflow_execution_id=state.workflow_execution_id,
        status=WorkflowExecutionStatus.WAITING.value,
        last_updated_at=datetime.utcnow().isoformat()
    )
    
    # Send awaiting feedback event with artifacts
    sse_manager = _get_sse_manager()
    await sse_manager.send_event(
        session_id=state.session_id,
        event=AwaitingFeedback(
            workflow_execution_id=str(state.workflow_execution_id),
            prompt="Artifacts are ready for review. Please review and edit if needed. Type 'approved' to continue.",
            timestamp=datetime.utcnow()
        )
    )
    
    state.awaiting_user_feedback = True
    state.current_status = WorkflowExecutionStatus.WAITING.value
    
    log_agent_action(
        agent_name=_agent_name,
        action="awaiting_artifact_review",
        details={"workflow_id": str(state.workflow_execution_id)}
    )
    
    return state


async def await_comms_permission_node(state: WorkflowGraphState) -> WorkflowGraphState:
    """
    Pause workflow and await user permission for communications.
    
    Args:
        state: Current graph state
        
    Returns:
        Updated state awaiting comms permission
    """
    # Update workflow to waiting status
    await update_workflow_execution(
        workflow_execution_id=state.workflow_execution_id,
        status=WorkflowExecutionStatus.WAITING.value,
        last_updated_at=datetime.utcnow().isoformat()
    )
    
    # Send awaiting feedback event
    sse_manager = _get_sse_manager()
    await sse_manager.send_event(
        session_id=state.session_id,
        event=AwaitingFeedback(
            workflow_execution_id=str(state.workflow_execution_id),
            prompt="Send notifications to project stakeholders? (yes/no)",
            timestamp=datetime.utcnow()
        )
    )
    
    state.awaiting_user_feedback = True
    state.current_status = WorkflowExecutionStatus.WAITING.value
    
    return state


async def await_submission_permission_node(state: WorkflowGraphState) -> WorkflowGraphState:
    """
    Pause workflow and await user permission for submission.
    
    Args:
        state: Current graph state
        
    Returns:
        Updated state awaiting submission permission
    """
    # Update workflow to waiting status
    await update_workflow_execution(
        workflow_execution_id=state.workflow_execution_id,
        status=WorkflowExecutionStatus.WAITING.value,
        last_updated_at=datetime.utcnow().isoformat()
    )
    
    # Send awaiting feedback event
    sse_manager = _get_sse_manager()
    await sse_manager.send_event(
        session_id=state.session_id,
        event=AwaitingFeedback(
            workflow_execution_id=str(state.workflow_execution_id),
            prompt="Submit bid to client? (yes/no)",
            timestamp=datetime.utcnow()
        )
    )
    
    state.awaiting_user_feedback = True
    state.current_status = WorkflowExecutionStatus.WAITING.value
    
    return state


# ========================================
# Finalization Nodes
# ========================================

async def export_artifacts_node(state: WorkflowGraphState) -> WorkflowGraphState:
    """
    Export approved artifacts to S3.
    
    Updates ArtifactVersion records with S3 locations.
    Emits export progress SSE events.
    
    Args:
        state: Current graph state
        
    Returns:
        Updated state with export results
    """
    try:
        log_agent_action(
            agent_name=_agent_name,
            action="exporting_artifacts",
            details={
                "workflow_id": str(state.workflow_execution_id),
                "project_id": str(state.project_id)
            }
        )
        
        # Send export event
        sse_manager = _get_sse_manager()
        await sse_manager.send_event(
            session_id=state.session_id,
            event=WorkflowStatusUpdate(
                workflow_execution_id=str(state.workflow_execution_id),
                status="exporting_artifacts",
                message="Exporting artifacts to S3...",
                timestamp=datetime.utcnow()
            )
        )
        
        # Export artifacts
        export_result = await export_artifacts(
            project_id=state.project_id,
            user_id=state.user_id
        )
        
        # Store export result in state
        state.task_outputs["artifact_export"] = export_result
        
        # Update artifact locations in state
        for artifact_id_str, location in export_result.get("artifact_locations", {}).items():
            artifact_id = UUID(artifact_id_str)
            state.artifact_export_locations[artifact_id] = location
        
        # Send export complete event
        await sse_manager.send_event(
            session_id=state.session_id,
            event=WorkflowStatusUpdate(
                workflow_execution_id=str(state.workflow_execution_id),
                status="artifacts_exported",
                message=f"Successfully exported {export_result['exported_count']} artifacts to S3",
                timestamp=datetime.utcnow()
            )
        )
        
        log_agent_action(
            agent_name=_agent_name,
            action="artifacts_exported",
            details={
                "workflow_id": str(state.workflow_execution_id),
                "exported_count": export_result['exported_count']
            }
        )
        
    except Exception as e:
        log_agent_action(
            agent_name=_agent_name,
            action="artifact_export_failed",
            details={"error": str(e)},
            level="error"
        )
        
        # Send error event
        sse_manager = _get_sse_manager()
        await sse_manager.send_event(
            session_id=state.session_id,
            event=WorkflowStatusUpdate(
                workflow_execution_id=str(state.workflow_execution_id),
                status="export_failed",
                message=f"Failed to export artifacts: {str(e)}",
                timestamp=datetime.utcnow()
            )
        )
        
        raise AgentError(
            code=ErrorCode.TOOL_EXECUTION_FAILED,
            message=f"Failed to export artifacts: {str(e)}",
            severity=ErrorSeverity.HIGH,
            details={"error": str(e)}
        ) from e
    
    return state


async def complete_workflow_node(state: WorkflowGraphState) -> WorkflowGraphState:
    """
    Complete workflow execution.
    
    Updates workflow and project status to COMPLETED.
    Emits workflow_completed SSE event.
    
    Args:
        state: Current graph state
        
    Returns:
        Updated state with workflow_status=COMPLETED
    """
    # Update workflow status
    await update_workflow_execution(
        workflow_execution_id=state.workflow_execution_id,
        status=WorkflowExecutionStatus.COMPLETED.value,
        completed_by=str(state.user_id),
        completed_at=datetime.utcnow().isoformat(),
        last_updated_at=datetime.utcnow().isoformat()
    )
    
    # Update project status (100% complete)
    await update_project(
        project_id=state.project_id,
        status="COMPLETED",
        progress_percentage=100,
        completed_by=str(state.user_id),
        completed_at=datetime.utcnow().isoformat(),
        updated_at=datetime.utcnow().isoformat()
    )
    
    # Send completion event
    sse_manager = _get_sse_manager()
    await sse_manager.send_event(
        session_id=state.session_id,
        event=WorkflowCompleted(
            workflow_execution_id=str(state.workflow_execution_id),
            status="completed",
            message="Workflow completed successfully",
            timestamp=datetime.utcnow()
        )
    )
    
    state.current_status = WorkflowExecutionStatus.COMPLETED.value
    
    log_agent_action(
        agent_name=_agent_name,
        action="workflow_completed",
        details={"workflow_id": str(state.workflow_execution_id)}
    )
    
    return state