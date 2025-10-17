-- CreateTable: conversation_messages for Phase 9
-- Stores complete conversation history (user inputs + agent responses + SSE events)

CREATE TABLE "conversation_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "workflow_execution_id" UUID,
    "session_id" TEXT NOT NULL,
    "user_id" UUID,
    
    -- Message details
    "role" TEXT NOT NULL CHECK (role IN ('user', 'agent', 'system')),
    "message_type" TEXT NOT NULL CHECK (message_type IN ('chat', 'content_edit', 'agent_output', 'system_event')),
    "content" TEXT NOT NULL,
    
    -- Metadata
    "agent_name" TEXT,
    "event_type" TEXT,
    "metadata" JSONB DEFAULT '{}',
    
    -- Timestamps
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id")
);

-- Create indexes for efficient queries
CREATE INDEX "conversation_messages_project_id_idx" ON "conversation_messages"("project_id");
CREATE INDEX "conversation_messages_workflow_id_idx" ON "conversation_messages"("workflow_execution_id");
CREATE INDEX "conversation_messages_session_id_idx" ON "conversation_messages"("session_id");
CREATE INDEX "conversation_messages_created_at_idx" ON "conversation_messages"("created_at");
CREATE INDEX "conversation_messages_role_idx" ON "conversation_messages"("role");

-- Full-text search index for conversation content
CREATE INDEX "conversation_messages_content_search_idx" ON "conversation_messages" USING gin(to_tsvector('english', content));

-- AddForeignKey
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_project_id_fkey" 
    FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (nullable)
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_workflow_id_fkey" 
    FOREIGN KEY ("workflow_execution_id") REFERENCES "workflow_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (nullable)
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Cleanup function: Delete old conversation messages (optional retention policy)
-- Run this periodically to manage database size
CREATE OR REPLACE FUNCTION cleanup_old_conversations(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM conversation_messages
    WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL
      AND role = 'system'  -- Keep user/agent messages longer
      AND message_type = 'system_event';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comment
COMMENT ON TABLE "conversation_messages" IS 'Complete conversation history including user inputs, agent responses, and system events (SSE)';
COMMENT ON FUNCTION cleanup_old_conversations IS 'Cleanup old system event messages based on retention policy';