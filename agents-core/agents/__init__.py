"""
Agents Package - OOP Class-based Agent Architecture

Provides BaseAgent abstract class and all concrete agent implementations
following proper object-oriented design principles.

Architecture:
- BaseAgent: Abstract base class with Template Method pattern
- WorkflowSupervisor: Orchestrates sequential bid workflow (separate file)
- AIAssistantSupervisor: Handles intent-based AI assistance (separate file)
- 8 Sub-Agents: Domain-specific task specialists

Design Principles:
- Encapsulation: State managed as private instance variables
- Inheritance: All agents inherit from BaseAgent
- Abstraction: BaseAgent defines contract, subclasses implement
- Composition: ContentAgent HAS-A KnowledgeAgent
- Polymorphism: All agents share common interface

Usage (Java-style instantiation):
    ```python
    # Create agents directly (no factory functions)
    supervisor = WorkflowSupervisor()
    assistant = AIAssistantSupervisor()
    parser = ParserAgent(mode="workflow")
    analysis = AnalysisAgent(mode="workflow")
    
    # Get Strands Agent instance and invoke
    result = await supervisor.get_agent().ainvoke({"project_id": "uuid"})
    ```
"""

# Base agent abstract class
from agents_core.agents.base_agent import BaseAgent

# Supervisor agents (two separate files)
from agents_core.agents.workflow_supervisor import WorkflowSupervisor
from agents_core.agents.ai_assistant_supervisor import AIAssistantSupervisor

# Sub-agents (domain specialists)
from agents_core.agents.parser_agent import ParserAgent
from agents_core.agents.analysis_agent import AnalysisAgent
from agents_core.agents.knowledge_agent import KnowledgeAgent
from agents_core.agents.content_agent import ContentAgent
from agents_core.agents.compliance_agent import ComplianceAgent
from agents_core.agents.qa_agent import QAAgent
from agents_core.agents.comms_agent import CommsAgent
from agents_core.agents.submission_agent import SubmissionAgent

__all__ = [
    # Base class
    "BaseAgent",
    
    # Supervisor classes (separate files)
    "WorkflowSupervisor",
    "AIAssistantSupervisor",
    
    # Sub-agent classes
    "ParserAgent",
    "AnalysisAgent",
    "KnowledgeAgent",
    "ContentAgent",
    "ComplianceAgent",
    "QAAgent",
    "CommsAgent",
    "SubmissionAgent",
]