-- CreateTable: conversation_messages
-- Purpose: Stores all user-agent conversation history per project for audit and replay
-- Feature: AWS AgentCore Agentic System

CREATE TABLE "conversation_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "session_id" VARCHAR(255) NOT NULL,
    "user_id" UUID NOT NULL,
    "role" VARCHAR(50) NOT NULL CHECK ("role" IN ('user', 'assistant', 'system')),
    "content" JSONB NOT NULL,
    "metadata" JSONB DEFAULT '{}'::jsonb,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversation_messages_project_id_session_id_idx" ON "conversation_messages"("project_id", "session_id");

-- CreateIndex
CREATE INDEX "conversation_messages_created_at_idx" ON "conversation_messages"("created_at" DESC);

-- CreateIndex
CREATE INDEX "conversation_messages_user_id_idx" ON "conversation_messages"("user_id");

-- AddForeignKey
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add conversation tracking to workflow_executions
ALTER TABLE "workflow_executions" 
ADD COLUMN "session_id" VARCHAR(255),
ADD COLUMN "conversation_message_count" INTEGER DEFAULT 0;

-- CreateIndex
CREATE INDEX "workflow_executions_session_id_idx" ON "workflow_executions"("session_id");

-- Comments
COMMENT ON TABLE "conversation_messages" IS 'Stores all user-agent conversation history per project';
COMMENT ON COLUMN "conversation_messages"."role" IS 'Message role: user (from frontend), assistant (agent responses), system (internal)';
COMMENT ON COLUMN "conversation_messages"."content" IS 'Message content in JSON format (text, artifacts, SSE events)';
COMMENT ON COLUMN "conversation_messages"."metadata" IS 'Additional metadata: agent_name, event_type, timestamp';