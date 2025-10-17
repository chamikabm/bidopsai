"""
AgentCore Memory Manager for persistent memory across agent executions.

This module provides:
- Workflow memory (state across agent executions)
- Project memory (long-term project context)
- User preference memory (user-specific settings)
- Agent learning memory (patterns from past executions)
"""

import json
import logging
from typing import Optional, Any, Literal
from datetime import datetime, timedelta
from uuid import UUID

from pydantic import BaseModel, Field

from core.database import db_pool

logger = logging.getLogger(__name__)

# Memory types
MemoryType = Literal["workflow", "project", "user_preference", "agent_learning"]


class MemoryEntry(BaseModel):
    """Memory entry structure"""
    key: str
    value: dict[str, Any]
    memory_type: MemoryType
    scope: str  # workflow_id, project_id, user_id, etc.
    ttl_hours: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.now)
    expires_at: Optional[datetime] = None


class MemoryManager:
    """
    Manages persistent memory for agents using AgentCore Memory patterns.
    
    Memory Scopes:
    - workflow: Per-workflow execution state (TTL: session duration)
    - project: Long-term project context (TTL: project lifetime)
    - user_preference: User-specific preferences (TTL: 90 days)
    - agent_learning: Patterns learned from executions (TTL: 30 days)
    - session: Per-session conversation context (TTL: 24 hours)
    
    Integration with AgentCore RequestContext:
    - Uses RequestContext.session_id for session scoping
    - Uses RequestContext.user_id for user preference scoping
    - Stores session state for multi-turn conversations
    """
    
    def __init__(self):
        self._cache: dict[str, MemoryEntry] = {}
    
    def _generate_key(
        self,
        memory_type: MemoryType,
        scope: str,
        key: str
    ) -> str:
        """Generate unique memory key."""
        return f"{memory_type}:{scope}:{key}"
    
    async def set(
        self,
        key: str,
        value: dict[str, Any],
        memory_type: MemoryType,
        scope: str,
        ttl_hours: Optional[int] = None
    ) -> None:
        """
        Store value in memory.
        
        Args:
            key: Memory key
            value: Value to store (must be JSON-serializable)
            memory_type: Type of memory (workflow, project, user_preference, agent_learning)
            scope: Scope identifier (workflow_id, project_id, user_id)
            ttl_hours: Time-to-live in hours (None = no expiration)
        """
        full_key = self._generate_key(memory_type, scope, key)
        
        # Calculate expiration
        expires_at = None
        if ttl_hours:
            expires_at = datetime.now() + timedelta(hours=ttl_hours)
        
        entry = MemoryEntry(
            key=key,
            value=value,
            memory_type=memory_type,
            scope=scope,
            ttl_hours=ttl_hours,
            expires_at=expires_at
        )
        
        # Store in cache
        self._cache[full_key] = entry
        
        # Persist to database (using workflow_config JSONB field as storage)
        try:
            await self._persist_memory(full_key, entry)
            logger.debug(f"Stored memory: {full_key}")
        except Exception as e:
            logger.error(f"Failed to persist memory {full_key}: {e}")
            raise
    
    async def get(
        self,
        key: str,
        memory_type: MemoryType,
        scope: str,
        default: Optional[Any] = None
    ) -> Optional[dict[str, Any]]:
        """
        Retrieve value from memory.
        
        Args:
            key: Memory key
            memory_type: Type of memory
            scope: Scope identifier
            default: Default value if not found
            
        Returns:
            Stored value or default
        """
        full_key = self._generate_key(memory_type, scope, key)
        
        # Check cache first
        if full_key in self._cache:
            entry = self._cache[full_key]
            
            # Check expiration
            if entry.expires_at and entry.expires_at < datetime.now():
                logger.debug(f"Memory expired: {full_key}")
                await self.delete(key, memory_type, scope)
                return default
            
            logger.debug(f"Retrieved memory from cache: {full_key}")
            return entry.value
        
        # Load from database
        try:
            entry = await self._load_memory(full_key)
            
            if entry:
                # Check expiration
                if entry.expires_at and entry.expires_at < datetime.now():
                    logger.debug(f"Memory expired: {full_key}")
                    await self.delete(key, memory_type, scope)
                    return default
                
                # Cache it
                self._cache[full_key] = entry
                logger.debug(f"Retrieved memory from database: {full_key}")
                return entry.value
            
        except Exception as e:
            logger.error(f"Failed to load memory {full_key}: {e}")
        
        return default
    
    async def delete(
        self,
        key: str,
        memory_type: MemoryType,
        scope: str
    ) -> bool:
        """
        Delete value from memory.
        
        Args:
            key: Memory key
            memory_type: Type of memory
            scope: Scope identifier
            
        Returns:
            True if deleted, False if not found
        """
        full_key = self._generate_key(memory_type, scope, key)
        
        # Remove from cache
        self._cache.pop(full_key, None)
        
        # Remove from database
        try:
            await self._delete_memory(full_key)
            logger.debug(f"Deleted memory: {full_key}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete memory {full_key}: {e}")
            return False
    
    async def clear_scope(
        self,
        memory_type: MemoryType,
        scope: str
    ) -> int:
        """
        Clear all memory for a scope.
        
        Args:
            memory_type: Type of memory
            scope: Scope identifier
            
        Returns:
            Number of entries cleared
        """
        prefix = f"{memory_type}:{scope}:"
        
        # Clear from cache
        keys_to_delete = [k for k in self._cache.keys() if k.startswith(prefix)]
        for key in keys_to_delete:
            self._cache.pop(key, None)
        
        # Clear from database
        try:
            count = await self._clear_scope_memory(memory_type, scope)
            logger.info(f"Cleared {count} memory entries for {memory_type}:{scope}")
            return count
        except Exception as e:
            logger.error(f"Failed to clear scope memory: {e}")
            return 0
    
    async def _persist_memory(self, full_key: str, entry: MemoryEntry) -> None:
        """Persist memory entry to database."""
        # Store in a generic memory table (could be added to workflow_config or separate table)
        # For now, using workflow_executions.workflow_config JSONB field
        
        if entry.memory_type == "workflow":
            # Store in workflow_executions
            query = """
                UPDATE workflow_executions
                SET workflow_config = COALESCE(workflow_config, '{}'::jsonb) || $1::jsonb
                WHERE id = $2
            """
            memory_data = json.dumps({f"memory:{entry.key}": entry.value})
            await db_pool.execute(query, memory_data, UUID(entry.scope))
            
        elif entry.memory_type == "project":
            # Store in projects.metadata
            query = """
                UPDATE projects
                SET metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb
                WHERE id = $2
            """
            memory_data = json.dumps({f"memory:{entry.key}": entry.value})
            await db_pool.execute(query, memory_data, UUID(entry.scope))
            
        else:
            # For user_preference and agent_learning, store in agent_configurations_cache
            # as a workaround (in production, create dedicated memory table)
            logger.debug(f"Memory type {entry.memory_type} stored in cache only")
    
    async def _load_memory(self, full_key: str) -> Optional[MemoryEntry]:
        """Load memory entry from database."""
        parts = full_key.split(":", 2)
        if len(parts) != 3:
            return None
        
        memory_type, scope, key = parts
        
        try:
            if memory_type == "workflow":
                query = """
                    SELECT workflow_config
                    FROM workflow_executions
                    WHERE id = $1
                """
                row = await db_pool.fetchrow(query, UUID(scope))
                
                if row and row['workflow_config']:
                    config = row['workflow_config']
                    memory_key = f"memory:{key}"
                    if memory_key in config:
                        return MemoryEntry(
                            key=key,
                            value=config[memory_key],
                            memory_type=memory_type,  # type: ignore
                            scope=scope,
                            ttl_hours=None
                        )
            
            elif memory_type == "project":
                query = """
                    SELECT metadata
                    FROM projects
                    WHERE id = $1
                """
                row = await db_pool.fetchrow(query, UUID(scope))
                
                if row and row['metadata']:
                    metadata = row['metadata']
                    memory_key = f"memory:{key}"
                    if memory_key in metadata:
                        return MemoryEntry(
                            key=key,
                            value=metadata[memory_key],
                            memory_type=memory_type,  # type: ignore
                            scope=scope,
                            ttl_hours=None
                        )
            
        except Exception as e:
            logger.error(f"Failed to load memory from database: {e}")
        
        return None
    
    async def _delete_memory(self, full_key: str) -> None:
        """Delete memory entry from database."""
        parts = full_key.split(":", 2)
        if len(parts) != 3:
            return
        
        memory_type, scope, key = parts
        memory_key = f"memory:{key}"
        
        try:
            if memory_type == "workflow":
                query = """
                    UPDATE workflow_executions
                    SET workflow_config = workflow_config - $1
                    WHERE id = $2
                """
                await db_pool.execute(query, memory_key, UUID(scope))
                
            elif memory_type == "project":
                query = """
                    UPDATE projects
                    SET metadata = metadata - $1
                    WHERE id = $2
                """
                await db_pool.execute(query, memory_key, UUID(scope))
                
        except Exception as e:
            logger.error(f"Failed to delete memory from database: {e}")
    
    async def _clear_scope_memory(self, memory_type: str, scope: str) -> int:
        """Clear all memory entries for a scope from database."""
        # This is a simplified implementation
        # In production, use a dedicated memory table with proper indexes
        logger.debug(f"Clearing scope memory: {memory_type}:{scope}")
        return 0


# Global memory manager instance
_memory_manager_instance = None


def get_memory_manager() -> MemoryManager:
    """Get singleton memory manager instance."""
    global _memory_manager_instance
    if _memory_manager_instance is None:
        _memory_manager_instance = MemoryManager()
    return _memory_manager_instance


async def set_memory(
    key: str,
    value: dict[str, Any],
    memory_type: MemoryType,
    scope: str,
    ttl_hours: Optional[int] = None
) -> None:
    """Store value in memory."""
    manager = get_memory_manager()
    await manager.set(key, value, memory_type, scope, ttl_hours)


async def get_memory(
    key: str,
    memory_type: MemoryType,
    scope: str,
    default: Optional[Any] = None
) -> Optional[dict[str, Any]]:
    """Retrieve value from memory."""
    manager = get_memory_manager()
    return await manager.get(key, memory_type, scope, default)


async def delete_memory(
    key: str,
    memory_type: MemoryType,
    scope: str
) -> bool:
    """Delete value from memory."""
    manager = get_memory_manager()
    return await manager.delete(key, memory_type, scope)


async def clear_scope_memory(
    memory_type: MemoryType,
    scope: str
) -> int:
    """Clear all memory for a scope."""
    manager = get_memory_manager()
    return await manager.clear_scope(memory_type, scope)


# Session management helpers for AgentCore RequestContext
async def store_session_context(
    session_id: str,
    user_id: str,
    context_data: dict[str, Any],
    ttl_hours: int = 24
) -> None:
    """
    Store session context for multi-turn conversations.
    
    Args:
        session_id: AgentCore session ID
        user_id: User ID
        context_data: Session context (conversation history, active workflow, etc.)
        ttl_hours: Time-to-live in hours (default 24)
    """
    key = f"session_{session_id}"
    manager = get_memory_manager()
    await manager.set(
        key=key,
        value=context_data,
        memory_type="user_preference",  # Using user_preference for session data
        scope=user_id,
        ttl_hours=ttl_hours
    )


async def load_session_context(
    session_id: str,
    user_id: str
) -> Optional[dict[str, Any]]:
    """
    Load session context for resuming conversations.
    
    Args:
        session_id: AgentCore session ID
        user_id: User ID
    
    Returns:
        Session context or None
    """
    key = f"session_{session_id}"
    manager = get_memory_manager()
    return await manager.get(
        key=key,
        memory_type="user_preference",
        scope=user_id,
        default=None
    )


async def update_session_context(
    session_id: str,
    user_id: str,
    updates: dict[str, Any]
) -> None:
    """
    Update existing session context.
    
    Args:
        session_id: AgentCore session ID
        user_id: User ID
        updates: Dictionary of updates to merge
    """
    # Load existing context
    context = await load_session_context(session_id, user_id) or {}
    
    # Merge updates
    context.update(updates)
    
    # Store updated context
    await store_session_context(session_id, user_id, context)