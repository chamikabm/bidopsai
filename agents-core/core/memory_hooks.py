"""
Memory Hooks for Strands Agents

Provides hook providers that automatically save agent conversations
to AWS AgentCore Memory Service using Strands Agent hook system.

Features:
- Automatic conversation saving after agent invocations
- Actor and session management
- Integration with AfterInvocationEvent
- Error handling and logging

Usage:
    from agents_core.core.memory_hooks import create_memory_hook_provider
    from agents_core.core.agentcore_memory import get_agentcore_memory_manager
    
    # Create memory manager
    memory_manager = get_agentcore_memory_manager()
    await memory_manager.initialize()
    
    # Create hook provider
    hooks = create_memory_hook_provider(memory_manager.memory_id, memory_manager.client)
    
    # Use with agent
    agent = Agent(
        tools=[...],
        hooks=[hooks],
        state={"actor_id": actor_id, "session_id": session_id}
    )
"""

import logging
from typing import Optional

from strands.hooks import AfterInvocationEvent, HookProvider, HookRegistry
from bedrock_agentcore.memory import MemoryClient

logger = logging.getLogger(__name__)


class MemoryHookProvider(HookProvider):
    """
    Hook provider for automatic memory management in Strands Agents.
    
    This provider automatically saves conversations to AgentCore Memory
    after each agent invocation.
    
    Requirements:
    - Agent state must include: {"actor_id": str, "session_id": str}
    - Memory client must be initialized
    - Memory ID must be valid
    
    Example:
        hooks = MemoryHookProvider(
            memory_id="BidOpsAI_Memory-abc123",
            client=memory_client
        )
        
        agent = Agent(
            tools=[...],
            hooks=[hooks],
            state={
                "actor_id": "parser-20250117120000",
                "session_id": "session-20250117120000"
            }
        )
    """
    
    def __init__(self, memory_id: str, client: MemoryClient):
        """
        Initialize memory hook provider.
        
        Args:
            memory_id: AgentCore Memory resource ID
            client: MemoryClient instance
        """
        self.memory_id = memory_id
        self.client = client
        logger.info(f"MemoryHookProvider initialized (memory_id: {memory_id})")
    
    def save_memories(self, event: AfterInvocationEvent):
        """
        Save conversation after agent response.
        
        This hook is called after each agent invocation to automatically
        save the conversation turn to AgentCore Memory.
        
        Args:
            event: AfterInvocationEvent containing agent state and messages
        """
        try:
            messages = event.agent.messages
            
            if len(messages) < 2:
                logger.debug("Not enough messages to save")
                return
            
            # Extract last user and assistant messages
            user_msg = None
            assistant_msg = None
            
            # Iterate in reverse to get most recent messages
            for msg in reversed(messages):
                if msg["role"] == "assistant" and not assistant_msg:
                    # Get text content from assistant message
                    if isinstance(msg["content"], list) and len(msg["content"]) > 0:
                        content_item = msg["content"][0]
                        if isinstance(content_item, dict) and "text" in content_item:
                            assistant_msg = content_item["text"]
                        else:
                            assistant_msg = str(content_item)
                    else:
                        assistant_msg = str(msg["content"])
                        
                elif msg["role"] == "user" and not user_msg:
                    # Skip tool results
                    if isinstance(msg["content"], list) and len(msg["content"]) > 0:
                        content_item = msg["content"][0]
                        if isinstance(content_item, dict):
                            if "toolResult" in content_item:
                                continue  # Skip tool results
                            if "text" in content_item:
                                user_msg = content_item["text"]
                                break
                        else:
                            user_msg = str(content_item)
                            break
                    else:
                        user_msg = str(msg["content"])
                        break
            
            if not user_msg or not assistant_msg:
                logger.debug("Could not extract user/assistant messages")
                return
            
            # Get session info from agent state
            actor_id = event.agent.state.get("actor_id")
            session_id = event.agent.state.get("session_id")
            
            if not actor_id or not session_id:
                logger.warning("Missing actor_id or session_id in agent state")
                return
            
            # Save conversation to memory
            self.client.create_event(
                memory_id=self.memory_id,
                actor_id=actor_id,
                session_id=session_id,
                messages=[(user_msg, "USER"), (assistant_msg, "ASSISTANT")]
            )
            
            logger.info(f"✓ Saved conversation to memory (actor: {actor_id}, session: {session_id})")
            
        except Exception as e:
            logger.error(f"❌ Failed to save memories: {e}")
            # Don't raise - we don't want to break agent execution
    
    def register_hooks(self, registry: HookRegistry) -> None:
        """
        Register memory hooks with the agent.
        
        Args:
            registry: HookRegistry to register callbacks
        """
        registry.add_callback(AfterInvocationEvent, self.save_memories)
        logger.info("Memory hooks registered successfully")


def create_memory_hook_provider(
    memory_id: str,
    client: MemoryClient
) -> MemoryHookProvider:
    """
    Create a memory hook provider instance.
    
    Args:
        memory_id: AgentCore Memory resource ID
        client: MemoryClient instance
        
    Returns:
        MemoryHookProvider instance
        
    Example:
        from bedrock_agentcore.memory import MemoryClient
        
        client = MemoryClient(region_name="us-west-2")
        hooks = create_memory_hook_provider("memory-id", client)
    """
    return MemoryHookProvider(memory_id=memory_id, client=client)


class NoOpMemoryHookProvider(HookProvider):
    """
    No-op memory hook provider for testing or when memory is disabled.
    
    This provider does nothing but satisfies the interface requirements.
    Use when memory functionality is disabled or not available.
    """
    
    def register_hooks(self, registry: HookRegistry) -> None:
        """Register no hooks (no-op)."""
        logger.debug("NoOp memory hooks registered (memory disabled)")


def create_noop_memory_hook_provider() -> NoOpMemoryHookProvider:
    """
    Create a no-op memory hook provider.
    
    Returns:
        NoOpMemoryHookProvider instance
    """
    return NoOpMemoryHookProvider()