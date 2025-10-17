"""
AI Assistant Agent Builder

Builds Intent Router graph using Strands StateGraph.
Routes classified intents to appropriate sub-agents with mode="ai_assistant".
"""

import logging
from typing import Dict

from strands_agents import StateGraph, END

from agents.analysis_agent import create_analysis_agent
from agents.content_agent import create_content_agent
from agents.knowledge_agent import create_knowledge_agent
from core.config import get_config
from prompts.prompt_manager import PromptManager
from supervisors.ai_assistant.intent_classifier import (
    classify_intent,
    get_clarification_prompt,
    validate_context_availability,
)
from supervisors.ai_assistant.state_models import (
    IntentRouterState,
    IntentType,
    INTENT_ROUTES,
)
from tools.tool_manager import ToolManager

logger = logging.getLogger(__name__)


# Global instances (initialized once per app startup)
_tool_manager: ToolManager = None
_prompt_manager: PromptManager = None


async def initialize_managers(cognito_jwt: str = None):
    """Initialize shared managers for AI Assistant"""
    global _tool_manager, _prompt_manager
    
    if _tool_manager is None:
        _tool_manager = ToolManager(cognito_jwt)
        await _tool_manager.initialize()
        logger.info("ToolManager initialized for AI Assistant")
    
    if _prompt_manager is None:
        _prompt_manager = PromptManager()
        logger.info("PromptManager initialized for AI Assistant")


# Graph node functions
async def classify_intent_node(state: IntentRouterState) -> IntentRouterState:
    """
    Node 1: Classify user query into intent type
    
    Uses LLM to determine user intent and extract entities.
    """
    try:
        logger.info(f"Classifying intent for query: {state.user_query[:100]}...")
        
        # Prepare context for classification
        context = {
            "project_id": str(state.conversation_context.project_id) if state.conversation_context.project_id else None,
            "project_name": state.conversation_context.user_preferences.get("active_project_name"),
            "workflow_id": str(state.conversation_context.active_workflow_id) if state.conversation_context.active_workflow_id else None,
        }
        
        # Classify intent
        classification = await classify_intent(
            user_query=state.user_query,
            context=context
        )
        
        state.classified_intent = classification
        
        # Check if required context is available
        if not validate_context_availability(classification, context):
            # Need to ask user for more context
            state.classified_intent.intent = IntentType.CLARIFICATION_NEEDED
            state.classified_intent.reasoning = "Required context not available"
        
        logger.info(
            f"Intent classified: {classification.intent} "
            f"(confidence: {classification.confidence:.2f})"
        )
        
        return state
        
    except Exception as e:
        logger.error(f"Error classifying intent: {e}")
        state.errors.append(f"Intent classification failed: {str(e)}")
        # Default to general question on error
        state.classified_intent = IntentClassification(
            intent=IntentType.GENERAL_QUESTION,
            confidence=0.3,
            entities={},
            reasoning=f"Error: {str(e)}",
            requires_context=False
        )
        return state


async def route_to_agent_node(state: IntentRouterState) -> IntentRouterState:
    """
    Node 2: Route to appropriate agent based on intent
    
    Selects agent and tools from INTENT_ROUTES configuration.
    Creates agent instance with mode="ai_assistant".
    """
    try:
        intent = state.classified_intent.intent
        
        # Handle clarification needed
        if intent == IntentType.CLARIFICATION_NEEDED:
            state.agent_response = get_clarification_prompt(state.user_query)
            state.response_metadata["needs_clarification"] = True
            return state
        
        # Get route configuration for intent
        route_config = INTENT_ROUTES.get(intent)
        if not route_config:
            logger.warning(f"No route configured for intent: {intent}")
            state.errors.append(f"No route for intent: {intent}")
            state.agent_response = (
                "I'm not sure how to handle that request yet. "
                "Could you rephrase or try a different question?"
            )
            return state
        
        state.selected_agent = route_config.agent_name
        state.agent_tools = route_config.tools
        
        logger.info(
            f"Routing to agent: {route_config.agent_name} "
            f"with {len(route_config.tools)} tools"
        )
        
        # Get tools for agent
        agent_tools = _tool_manager.get_tools_for_agent(
            route_config.agent_name,
            mode="ai_assistant"
        )
        
        # Get prompt for agent
        system_prompt = _prompt_manager.get_prompt(
            agent_name=route_config.agent_name,
            mode="ai_assistant"
        )
        
        # Create agent based on type
        config = get_config()
        
        if route_config.agent_name == "analysis":
            agent = await create_analysis_agent(
                mode="ai_assistant",
                provider=config.default_llm_provider,
                model_id=config.default_model,
                tools=agent_tools,
                system_prompt=system_prompt,
                temperature=route_config.temperature,
                max_tokens=route_config.max_tokens
            )
        elif route_config.agent_name == "knowledge":
            agent = await create_knowledge_agent(
                mode="ai_assistant",
                provider=config.default_llm_provider,
                model_id=config.default_model,
                tools=agent_tools,
                system_prompt=system_prompt,
                temperature=route_config.temperature,
                max_tokens=route_config.max_tokens
            )
        elif route_config.agent_name == "content":
            agent = await create_content_agent(
                mode="ai_assistant",
                provider=config.default_llm_provider,
                model_id=config.default_model,
                tools=agent_tools,
                system_prompt=system_prompt,
                temperature=route_config.temperature,
                max_tokens=route_config.max_tokens
            )
        else:
            # Generic agent for general questions
            from strands_agents import Agent
            agent = Agent(
                name=route_config.agent_name,
                model=config.default_model,
                tools=agent_tools,
                system_prompt=system_prompt,
                temperature=route_config.temperature,
                max_tokens=route_config.max_tokens
            )
        
        # Invoke agent with user query
        logger.info(f"Invoking {route_config.agent_name} agent...")
        
        # Prepare input with conversation context
        agent_input = {
            "query": state.user_query,
            "user_id": str(state.conversation_context.user_id),
            "project_id": str(state.conversation_context.project_id) if state.conversation_context.project_id else None,
            "entities": state.classified_intent.entities,
        }
        
        # Invoke agent (streaming response)
        response = await agent.ainvoke(agent_input)
        
        state.agent_response = response.get("output", response.get("response", ""))
        state.response_metadata = {
            "agent_name": route_config.agent_name,
            "intent": intent.value,
            "confidence": state.classified_intent.confidence,
            "tools_used": response.get("tools_used", []),
        }
        
        logger.info(f"Agent response generated ({len(state.agent_response)} chars)")
        
        return state
        
    except Exception as e:
        logger.error(f"Error routing to agent: {e}", exc_info=True)
        state.errors.append(f"Agent execution failed: {str(e)}")
        state.agent_response = (
            "I encountered an error while processing your request. "
            "Please try again or rephrase your question."
        )
        return state


def should_retry(state: IntentRouterState) -> str:
    """
    Conditional edge: Check if we should retry or end
    
    Returns:
        "retry" if errors and retries available, "end" otherwise
    """
    if state.errors and state.retry_count < 2:
        return "retry"
    return "end"


def build_ai_assistant_graph(cognito_jwt: str = None) -> StateGraph:
    """
    Build AI Assistant Intent Router graph
    
    Graph structure:
    START -> classify_intent -> route_to_agent -> END
                                      |
                                  (on error)
                                      |
                                   retry -> classify_intent
    
    Args:
        cognito_jwt: User JWT token for AgentCore Gateway authentication
    
    Returns:
        Compiled StateGraph ready for execution
    """
    # Initialize managers
    import asyncio
    asyncio.create_task(initialize_managers(cognito_jwt))
    
    # Create graph
    graph = StateGraph(IntentRouterState)
    
    # Add nodes
    graph.add_node("classify_intent", classify_intent_node)
    graph.add_node("route_to_agent", route_to_agent_node)
    
    # Add edges
    graph.set_entry_point("classify_intent")
    graph.add_edge("classify_intent", "route_to_agent")
    
    # Conditional edge for retry
    graph.add_conditional_edges(
        "route_to_agent",
        should_retry,
        {
            "retry": "classify_intent",  # Loop back to reclassify
            "end": END
        }
    )
    
    # Compile graph
    compiled_graph = graph.compile()
    
    logger.info("AI Assistant Intent Router graph compiled successfully")
    
    return compiled_graph