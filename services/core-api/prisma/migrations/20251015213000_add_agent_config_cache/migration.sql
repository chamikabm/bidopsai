-- CreateTable: agent_configurations_cache
-- Purpose: Cached agent configurations from SSM Parameter Store to reduce API calls
-- Feature: AWS AgentCore Agentic System

CREATE TABLE "agent_configurations_cache" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "agent_type" VARCHAR(50) NOT NULL UNIQUE,
    "model_name" VARCHAR(100) NOT NULL,
    "temperature" DECIMAL(3, 2) NOT NULL DEFAULT 0.7,
    "max_tokens" INTEGER NOT NULL,
    "system_prompt" JSONB NOT NULL,
    "additional_parameters" JSONB DEFAULT '{}'::jsonb,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "cache_expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_configurations_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agent_configurations_cache_agent_type_key" ON "agent_configurations_cache"("agent_type");

-- CreateIndex
CREATE INDEX "agent_configurations_cache_enabled_idx" ON "agent_configurations_cache"("enabled");

-- CreateIndex
CREATE INDEX "agent_configurations_cache_cache_expires_at_idx" ON "agent_configurations_cache"("cache_expires_at");

-- Add retry tracking to agent_tasks
ALTER TABLE "agent_tasks"
ADD COLUMN "retry_count" INTEGER DEFAULT 0,
ADD COLUMN "last_retry_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "agent_tasks_retry_count_idx" ON "agent_tasks"("retry_count");

-- Add parsed content reference to project_documents
ALTER TABLE "project_documents"
ADD COLUMN "parsing_status" VARCHAR(50) DEFAULT 'pending' CHECK ("parsing_status" IN ('pending', 'in_progress', 'completed', 'failed')),
ADD COLUMN "parsing_error" TEXT,
ADD COLUMN "parsed_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "project_documents_parsing_status_idx" ON "project_documents"("parsing_status");

-- Comments
COMMENT ON TABLE "agent_configurations_cache" IS 'Cached agent configurations from SSM Parameter Store';
COMMENT ON COLUMN "agent_configurations_cache"."agent_type" IS 'Agent type: parser, analysis, content, compliance, qa, comms, submission';
COMMENT ON COLUMN "agent_configurations_cache"."system_prompt" IS 'System prompt template with variables';
COMMENT ON COLUMN "agent_configurations_cache"."cache_expires_at" IS 'Cache expiration time, typically 1 hour';
COMMENT ON COLUMN "agent_tasks"."retry_count" IS 'Number of retry attempts for this task';
COMMENT ON COLUMN "agent_tasks"."last_retry_at" IS 'Timestamp of last retry attempt';
COMMENT ON COLUMN "project_documents"."parsing_status" IS 'Document parsing status for BDA processing';
COMMENT ON COLUMN "project_documents"."parsing_error" IS 'Error message if parsing failed';