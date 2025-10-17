"""
Workflow Agent Builder - Refactored for Strands Agent Pattern

Constructs the Strands StateGraph for the Workflow Supervisor.
Defines the graph topology, conditional edges, and execution flow.

CRITICAL: All agents are pure Strands Agent instances invoked via graph nodes.
No .execute() methods - agents are called via agent.ainvoke() in node functions.

Graph Flow:
1. Initialize → Parser → Analysis → [Await Feedback]
2. [Decision: Reparse / Reanalyze / Proceed]
3. Content → Compliance → [Check] → QA → [Check]
4. [Await Review] → [Decision: Retry / Export]
5. Export → [Await Comms Permission] → [Decision: Proceed / Skip]
6. Comms → [Await Submission Permission] → [Decision: Proceed / Skip]
7. Submission → Complete

Conditional Routing:
- Analysis feedback: reparse, reanalyze, or proceed
- Compliance check: retry content or proceed to QA
- QA check: retry content or proceed to review
- Artifact review: retry content or export
- Comms permission: proceed or skip
- Submission permission: proceed or skip
"""

from typing import Literal
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from agents_core.core.observability import log_agent_action
from supervisors.workflow.state_models import WorkflowGraphState
from supervisors.workflow import graph_nodes


def _should_reanalyze(state: WorkflowGraphState) -> Literal["reanalyze", "reparse", "proceed"]:
    """
    Determine routing after analysis feedback.
    
    Decision based on user feedback intent:
    - "reparse": Issues with document parsing → restart from Parser
    - "reanalyze": Issues with analysis → restart from Analysis
    - "proceed": User approved → continue to Content
    
    Args:
        state: Current graph state
        
    Returns:
        Next node key
    """
    intent = state.feedback_intent
    
    log_agent_action(
        agent_name="workflow_supervisor",
        action="routing_after_analysis_feedback",
        details={
            "intent": intent,
            "workflow_id": str(state.workflow_execution_id)
        }
    )
    
    return intent


def _should_retry_content_compliance(state: WorkflowGraphState) -> Literal["retry_content", "proceed_qa"]:
    """
    Determine routing after compliance check.
    
    Decision based on compliance agent output:
    - Not compliant → Reset Content/Compliance tasks, restart from Content
    - Compliant → Proceed to QA
    
    Args:
        state: Current graph state
        
    Returns:
        Next node key
    """
    compliance_output = state.task_outputs.get("compliance", {})
    is_compliant = compliance_output.get("is_compliant", False)
    
    if not is_compliant:
        log_agent_action(
            agent_name="workflow_supervisor",
            action="compliance_failed_retry",
            details={
                "workflow_id": str(state.workflow_execution_id),
                "issues_count": len(compliance_output.get("feedback", []))
            }
        )
        # Reset tasks for retry
        state.reset_task("content")
        state.reset_task("compliance")
        return "retry_content"
    
    log_agent_action(
        agent_name="workflow_supervisor",
        action="compliance_passed",
        details={"workflow_id": str(state.workflow_execution_id)}
    )
    
    return "proceed_qa"


def _should_retry_content_qa(state: WorkflowGraphState) -> Literal["retry_content", "proceed_review"]:
    """
    Determine routing after QA check.
    
    Decision based on QA agent output:
    - QA failed → Reset Content/Compliance/QA tasks, restart from Content
    - QA passed → Proceed to artifact review
    
    Args:
        state: Current graph state
        
    Returns:
        Next node key
    """
    qa_output = state.task_outputs.get("qa", {})
    qa_passed = qa_output.get("overall_status") == "complete"
    
    if not qa_passed:
        log_agent_action(
            agent_name="workflow_supervisor",
            action="qa_failed_retry",
            details={
                "workflow_id": str(state.workflow_execution_id),
                "issues_count": qa_output.get("summary", {}).get("total_issues_found", 0)
            }
        )
        # Reset tasks for retry
        state.reset_task("content")
        state.reset_task("compliance")
        state.reset_task("qa")
        return "retry_content"
    
    log_agent_action(
        agent_name="workflow_supervisor",
        action="qa_passed",
        details={"workflow_id": str(state.workflow_execution_id)}
    )
    
    return "proceed_review"


def _should_retry_after_review(state: WorkflowGraphState) -> Literal["retry_content", "export_artifacts"]:
    """
    Determine routing after user artifact review.
    
    Decision based on user feedback and edits:
    - User requested changes or provided edits → Reset tasks, restart from Content
    - User approved → Export artifacts and proceed
    
    Args:
        state: Current graph state
        
    Returns:
        Next node key
    """
    user_feedback = state.user_feedback or ""
    has_content_edits = len(state.content_edits) > 0
    
    feedback_lower = user_feedback.lower()
    
    # Check for change requests
    change_keywords = ["change", "fix", "update", "modify", "edit", "improve"]
    has_change_request = any(keyword in feedback_lower for keyword in change_keywords)
    
    # Check for approval
    approval_keywords = ["approved", "approve", "looks good", "lgtm", "good to go"]
    has_approval = any(keyword in feedback_lower for keyword in approval_keywords)
    
    if has_change_request or has_content_edits:
        log_agent_action(
            agent_name="workflow_supervisor",
            action="user_requested_changes",
            details={
                "workflow_id": str(state.workflow_execution_id),
                "has_edits": has_content_edits,
                "edit_count": len(state.content_edits)
            }
        )
        # Reset tasks for retry with user feedback
        state.reset_task("content")
        state.reset_task("compliance")
        state.reset_task("qa")
        return "retry_content"
    
    if has_approval or (not has_change_request and not has_content_edits):
        # Default to approval if no clear change request and no edits
        log_agent_action(
            agent_name="workflow_supervisor",
            action="user_approved_artifacts",
            details={"workflow_id": str(state.workflow_execution_id)}
        )
        return "export_artifacts"
    
    # Fallback: if unclear, assume approval
    return "export_artifacts"


def _should_proceed_to_comms(state: WorkflowGraphState) -> Literal["proceed_comms", "skip_comms"]:
    """
    Determine if user wants to proceed with communications.
    
    Decision based on user permission:
    - User approved → Proceed to Comms agent
    - User declined → Skip to completion
    
    Args:
        state: Current graph state
        
    Returns:
        Next node key
    """
    user_feedback = state.user_feedback or ""
    feedback_lower = user_feedback.lower()
    
    # Check for approval
    approval_keywords = ["yes", "approved", "proceed", "send"]
    has_approval = any(keyword in feedback_lower for keyword in approval_keywords)
    
    # Check for rejection
    rejection_keywords = ["no", "skip", "decline", "don't"]
    has_rejection = any(keyword in feedback_lower for keyword in rejection_keywords)
    
    if has_rejection:
        log_agent_action(
            agent_name="workflow_supervisor",
            action="user_declined_comms",
            details={"workflow_id": str(state.workflow_execution_id)}
        )
        return "skip_comms"
    
    if has_approval:
        log_agent_action(
            agent_name="workflow_supervisor",
            action="user_approved_comms",
            details={"workflow_id": str(state.workflow_execution_id)}
        )
        return "proceed_comms"
    
    # Default: skip if unclear
    return "skip_comms"


def _should_proceed_to_submission(state: WorkflowGraphState) -> Literal["proceed_submission", "skip_submission"]:
    """
    Determine if user wants to proceed with submission.
    
    Decision based on user permission:
    - User approved → Proceed to Submission agent
    - User declined → Skip to completion
    
    Args:
        state: Current graph state
        
    Returns:
        Next node key
    """
    user_feedback = state.user_feedback or ""
    feedback_lower = user_feedback.lower()
    
    # Check for approval
    approval_keywords = ["yes", "approved", "proceed", "submit", "send"]
    has_approval = any(keyword in feedback_lower for keyword in approval_keywords)
    
    # Check for rejection
    rejection_keywords = ["no", "skip", "decline", "don't"]
    has_rejection = any(keyword in feedback_lower for keyword in rejection_keywords)
    
    if has_rejection:
        log_agent_action(
            agent_name="workflow_supervisor",
            action="user_declined_submission",
            details={"workflow_id": str(state.workflow_execution_id)}
        )
        return "skip_submission"
    
    if has_approval:
        log_agent_action(
            agent_name="workflow_supervisor",
            action="user_approved_submission",
            details={"workflow_id": str(state.workflow_execution_id)}
        )
        return "proceed_submission"
    
    # Default: skip if unclear
    return "skip_submission"


def build_workflow_graph() -> StateGraph:
    """
    Build and compile the Workflow Supervisor StateGraph.
    
    Graph Structure:
    - Entry: initialize
    - Sequential: parser → analysis → await_feedback
    - Decision: analysis feedback (reparse/reanalyze/proceed)
    - Sequential: content → compliance → qa
    - Decision: compliance check (retry/proceed)
    - Decision: QA check (retry/proceed)
    - Sequential: await_review
    - Decision: review feedback (retry/export)
    - Sequential: export → await_comms_permission
    - Decision: comms permission (proceed/skip)
    - Sequential: comms → await_submission_permission
    - Decision: submission permission (proceed/skip)
    - Sequential: submission → complete
    - Exit: END
    
    Returns:
        Compiled StateGraph with checkpointing enabled
    """
    log_agent_action(
        agent_name="workflow_supervisor",
        action="building_graph",
        details={"pattern": "StateGraph with Strands agents"}
    )
    
    # Initialize graph with state model
    workflow = StateGraph(WorkflowGraphState)
    
    # ========================================
    # Add Nodes (Execution Steps)
    # ========================================
    
    # Initialization
    workflow.add_node("initialize", graph_nodes.initialize_workflow_node)
    
    # Agent execution nodes (Strands pattern)
    workflow.add_node("parser", graph_nodes.parser_agent_node)
    workflow.add_node("analysis", graph_nodes.analysis_agent_node)
    workflow.add_node("content", graph_nodes.content_agent_node)
    workflow.add_node("compliance", graph_nodes.compliance_agent_node)
    workflow.add_node("qa", graph_nodes.qa_agent_node)
    workflow.add_node("comms", graph_nodes.comms_agent_node)
    workflow.add_node("submission", graph_nodes.submission_agent_node)
    
    # User interaction nodes
    workflow.add_node("await_analysis_feedback", graph_nodes.await_analysis_feedback_node)
    workflow.add_node("await_artifact_review", graph_nodes.await_artifact_review_node)
    workflow.add_node("await_comms_permission", graph_nodes.await_comms_permission_node)
    workflow.add_node("await_submission_permission", graph_nodes.await_submission_permission_node)
    
    # Finalization nodes
    workflow.add_node("export_artifacts", graph_nodes.export_artifacts_node)
    workflow.add_node("complete", graph_nodes.complete_workflow_node)
    
    # ========================================
    # Set Entry Point
    # ========================================
    
    workflow.set_entry_point("initialize")
    
    # ========================================
    # Add Sequential Edges
    # ========================================
    
    # Initialization → Parser → Analysis → Await Feedback
    workflow.add_edge("initialize", "parser")
    workflow.add_edge("parser", "analysis")
    workflow.add_edge("analysis", "await_analysis_feedback")
    
    # Content → Compliance (after feedback approved)
    workflow.add_edge("content", "compliance")
    
    # Comms → Await Submission Permission
    workflow.add_edge("comms", "await_submission_permission")
    
    # Submission → Complete
    workflow.add_edge("submission", "complete")
    
    # Complete → END
    workflow.add_edge("complete", END)
    
    # ========================================
    # Add Conditional Edges (Decision Points)
    # ========================================
    
    # Analysis Feedback Decision
    workflow.add_conditional_edges(
        "await_analysis_feedback",
        _should_reanalyze,
        {
            "reanalyze": "analysis",  # Loop back to Analysis
            "reparse": "parser",      # Loop back to Parser
            "proceed": "content"      # Continue to Content
        }
    )
    
    # Compliance Check Decision
    workflow.add_conditional_edges(
        "compliance",
        _should_retry_content_compliance,
        {
            "retry_content": "content",  # Loop back to Content
            "proceed_qa": "qa"           # Continue to QA
        }
    )
    
    # QA Check Decision
    workflow.add_conditional_edges(
        "qa",
        _should_retry_content_qa,
        {
            "retry_content": "content",              # Loop back to Content
            "proceed_review": "await_artifact_review"  # Continue to Review
        }
    )
    
    # Artifact Review Decision
    workflow.add_conditional_edges(
        "await_artifact_review",
        _should_retry_after_review,
        {
            "retry_content": "content",           # Loop back to Content
            "export_artifacts": "export_artifacts"  # Export and continue
        }
    )
    
    # Export → Await Comms Permission
    workflow.add_edge("export_artifacts", "await_comms_permission")
    
    # Comms Permission Decision
    workflow.add_conditional_edges(
        "await_comms_permission",
        _should_proceed_to_comms,
        {
            "proceed_comms": "comms",    # Proceed to Comms agent
            "skip_comms": "await_submission_permission"  # Skip to submission permission
        }
    )
    
    # Submission Permission Decision
    workflow.add_conditional_edges(
        "await_submission_permission",
        _should_proceed_to_submission,
        {
            "proceed_submission": "submission",  # Proceed to Submission agent
            "skip_submission": "complete"        # Skip to completion
        }
    )
    
    # ========================================
    # Compile with Checkpointing
    # ========================================
    
    checkpointer = MemorySaver()
    compiled_graph = workflow.compile(checkpointer=checkpointer)
    
    log_agent_action(
        agent_name="workflow_supervisor",
        action="graph_compiled",
        details={
            "nodes_count": 16,  # Total nodes
            "agent_nodes": 7,   # Pure Strands agents
            "checkpointing": "enabled",
            "pattern": "Strands StateGraph"
        }
    )
    
    return compiled_graph


def get_workflow_graph() -> StateGraph:
    """
    Get compiled workflow graph (singleton pattern).
    
    Returns:
        Compiled StateGraph instance
    """
    return build_workflow_graph()