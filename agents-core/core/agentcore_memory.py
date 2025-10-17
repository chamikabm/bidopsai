"""
AWS AgentCore Memory Service Integration

This module provides integration with AWS Bedrock AgentCore Memory Service
for multi-agent systems with shared long-term memory and actor-based isolation.

Features:
- Memory resource creation and management
- Actor-based namespace isolation for agents
- User preference extraction strategy
- Memory event creation and retrieval
- Integration with Strands Agent framework

Based on AWS AgentCore Memory best practices:
https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/memory.html
"""

import logging
from typing import Optional, Dict, Any, List
from datetime import datetime

from bedrock_agentcore.memory import MemoryClient
from bedrock_agentcore.memory.constants import StrategyType
from botocore.exceptions import ClientError

from core.config import get_config

logger = logging.getLogger(__name__)


class AgentCoreMemoryManager:
    """
    Manages AWS AgentCore Memory resources for multi-agent system.
    
    Memory Architecture:
    - Single memory resource shared across all agents
    - Actor-based namespaces for agent isolation
    - User preference extraction for long-term learning
    - Session-based conversation management
    
    Namespace Pattern:
    - bidops/{actorId}/preferences
    
    Actor IDs:
    - supervisor-{mode}-{timestamp}
    - {agent_name}-{timestamp}
    
    Example:
        manager = AgentCoreMemoryManager(region="us-west-2")
        await manager.initialize()
        
        # Create actor for agent
        actor_id = manager.create_actor_id("parser")
        
        # Save conversation
        await manager.save_conversation(
            actor_id=actor_id,
            session_id=session_id,
            user_message="Parse this document",
            assistant_message="Document parsed successfully"
        )
    """
    
    _instance: Optional["AgentCoreMemoryManager"] = None
    
    def __new__(cls, region: Optional[str] = None):
        """Singleton pattern."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self, region: Optional[str] = None):
        """
        Initialize AgentCore Memory Manager.
        
        Args:
            region: AWS region (default: from config)
        """
        if not hasattr(self, "_initialized"):
            config = get_config()
            
            # AWS configuration
            self.region = region or config.get("AWS_REGION", "us-west-2")
            
            # Memory configuration
            self.memory_name = config.get("AGENTCORE_MEMORY_NAME", "BidOpsAI_Memory")
            self.memory_id: Optional[str] = None
            self.event_expiry_days = int(config.get("AGENTCORE_MEMORY_EVENT_EXPIRY_DAYS", "7"))
            
            # Memory client (will be initialized in initialize())
            self.client: Optional[MemoryClient] = None
            
            self._initialized = True
            logger.info(f"AgentCoreMemoryManager initialized (region: {self.region})")
    
    async def initialize(self) -> str:
        """
        Initialize memory client and create/retrieve memory resource.
        
        Returns:
            Memory ID
            
        Raises:
            Exception: If memory creation/retrieval fails
        """
        if self.memory_id:
            logger.info(f"Memory already initialized: {self.memory_id}")
            return self.memory_id
        
        try:
            # Create memory client
            self.client = MemoryClient(region_name=self.region)
            logger.info("MemoryClient created")
            
            # Try to create memory resource
            try:
                logger.info(f"Creating memory resource: {self.memory_name}")
                memory = self.client.create_memory_and_wait(
                    name=self.memory_name,
                    description="BidOpsAI multi-agent bid processing system with long-term memory",
                    strategies=[{
                        StrategyType.USER_PREFERENCE.value: {
                            "name": "AgentPreferences",
                            "description": "Captures agent-specific and user preferences for bid processing",
                            "namespaces": ["bidops/{actorId}/preferences"]
                        }
                    }],
                    event_expiry_days=self.event_expiry_days,
                    max_wait=300,
                    poll_interval=10
                )
                
                self.memory_id = memory['id']
                logger.info(f"✓ Memory created successfully: {self.memory_id}")
                
            except ClientError as e:
                if e.response['Error']['Code'] == 'ValidationException' and "already exists" in str(e):
                    # Memory already exists, retrieve its ID
                    logger.info(f"Memory '{self.memory_name}' already exists, retrieving ID...")
                    memories = self.client.list_memories()
                    self.memory_id = next(
                        (m['id'] for m in memories if m['id'].startswith(self.memory_name)),
                        None
                    )
                    if self.memory_id:
                        logger.info(f"✓ Using existing memory: {self.memory_id}")
                    else:
                        raise ValueError(f"Memory '{self.memory_name}' exists but ID not found")
                else:
                    raise
            
            return self.memory_id
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize memory: {e}")
            # Cleanup on error
            if self.memory_id:
                try:
                    self.client.delete_memory_and_wait(memory_id=self.memory_id)
                    logger.info(f"Cleaned up memory: {self.memory_id}")
                except Exception as cleanup_error:
                    logger.error(f"Failed to clean up memory: {cleanup_error}")
            raise
    
    def create_actor_id(self, agent_name: str) -> str:
        """
        Create unique actor ID for an agent.
        
        Args:
            agent_name: Name of the agent (parser, analysis, content, etc.)
            
        Returns:
            Actor ID in format: {agent_name}-{timestamp}
        """
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        actor_id = f"{agent_name}-{timestamp}"
        logger.debug(f"Created actor ID: {actor_id}")
        return actor_id
    
    def get_namespace(self, actor_id: str) -> str:
        """
        Get memory namespace for an actor.
        
        Args:
            actor_id: Actor ID
            
        Returns:
            Namespace path
        """
        return f"bidops/{actor_id}/preferences"
    
    async def save_conversation(
        self,
        actor_id: str,
        session_id: str,
        user_message: str,
        assistant_message: str
    ) -> Dict[str, Any]:
        """
        Save conversation turn to memory.
        
        Args:
            actor_id: Actor ID (agent identifier)
            session_id: Session ID (shared across workflow)
            user_message: User's message
            assistant_message: Assistant's response
            
        Returns:
            Event creation response
        """
        if not self.client or not self.memory_id:
            raise ValueError("Memory not initialized. Call initialize() first.")
        
        try:
            result = self.client.create_event(
                memory_id=self.memory_id,
                actor_id=actor_id,
                session_id=session_id,
                messages=[
                    (user_message, "USER"),
                    (assistant_message, "ASSISTANT")
                ]
            )
            
            logger.debug(f"Saved conversation for actor {actor_id}, session {session_id}")
            return result
            
        except Exception as e:
            logger.error(f"Failed to save conversation: {e}")
            raise
    
    async def save_conversation_batch(
        self,
        actor_id: str,
        session_id: str,
        messages: List[tuple[str, str]]
    ) -> Dict[str, Any]:
        """
        Save multiple conversation turns at once.
        
        Args:
            actor_id: Actor ID
            session_id: Session ID
            messages: List of (message, role) tuples
                     role should be "USER" or "ASSISTANT"
        
        Returns:
            Event creation response
        """
        if not self.client or not self.memory_id:
            raise ValueError("Memory not initialized. Call initialize() first.")
        
        try:
            result = self.client.create_event(
                memory_id=self.memory_id,
                actor_id=actor_id,
                session_id=session_id,
                messages=messages
            )
            
            logger.debug(f"Saved {len(messages)} messages for actor {actor_id}")
            return result
            
        except Exception as e:
            logger.error(f"Failed to save conversation batch: {e}")
            raise
    
    async def cleanup(self):
        """
        Cleanup memory resource (use with caution in production).
        
        This deletes the memory resource. Only use for testing or
        explicit cleanup operations.
        """
        if not self.client or not self.memory_id:
            logger.warning("No memory to cleanup")
            return
        
        try:
            self.client.delete_memory_and_wait(
                memory_id=self.memory_id,
                max_wait=300,
                poll_interval=10
            )
            logger.info(f"Memory deleted: {self.memory_id}")
            self.memory_id = None
            
        except Exception as e:
            logger.error(f"Failed to cleanup memory: {e}")
            raise


# Singleton instance getter
_memory_manager_instance: Optional[AgentCoreMemoryManager] = None


def get_agentcore_memory_manager(region: Optional[str] = None) -> AgentCoreMemoryManager:
    """
    Get singleton AgentCore Memory Manager instance.
    
    Args:
        region: AWS region (optional, uses default if not specified)
        
    Returns:
        AgentCoreMemoryManager instance
    """
    global _memory_manager_instance
    if _memory_manager_instance is None:
        _memory_manager_instance = AgentCoreMemoryManager(region=region)
    return _memory_manager_instance


# Convenience functions
async def initialize_agentcore_memory(region: Optional[str] = None) -> str:
    """
    Initialize AgentCore Memory (call during application startup).
    
    Args:
        region: AWS region
        
    Returns:
        Memory ID
    """
    manager = get_agentcore_memory_manager(region)
    return await manager.initialize()


def create_agent_actor_id(agent_name: str) -> str:
    """
    Create actor ID for an agent.
    
    Args:
        agent_name: Agent name (parser, analysis, content, etc.)
        
    Returns:
        Actor ID
    """
    manager = get_agentcore_memory_manager()
    return manager.create_actor_id(agent_name)


async def save_agent_conversation(
    actor_id: str,
    session_id: str,
    user_message: str,
    assistant_message: str
) -> Dict[str, Any]:
    """
    Save agent conversation to memory.
    
    Args:
        actor_id: Actor ID
        session_id: Session ID
        user_message: User message
        assistant_message: Assistant response
        
    Returns:
        Event response
    """
    manager = get_agentcore_memory_manager()
    return await manager.save_conversation(
        actor_id=actor_id,
        session_id=session_id,
        user_message=user_message,
        assistant_message=assistant_message
    )