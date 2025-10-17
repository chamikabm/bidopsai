-- CreateTable: sse_events_log
-- Purpose: Audit log of all SSE events sent to frontend for replay and debugging
-- Feature: AWS AgentCore Agentic System

CREATE TABLE "sse_events_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workflow_execution_id" UUID,
    "event_type" VARCHAR(100) NOT NULL,
    "event_data" JSONB NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sse_events_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sse_events_log_workflow_execution_id_sent_at_idx" ON "sse_events_log"("workflow_execution_id", "sent_at");

-- CreateIndex
CREATE INDEX "sse_events_log_event_type_idx" ON "sse_events_log"("event_type");

-- CreateIndex
CREATE INDEX "sse_events_log_sent_at_idx" ON "sse_events_log"("sent_at" DESC);

-- AddForeignKey
ALTER TABLE "sse_events_log" ADD CONSTRAINT "sse_events_log_workflow_execution_id_fkey" FOREIGN KEY ("workflow_execution_id") REFERENCES "workflow_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Comments
COMMENT ON TABLE "sse_events_log" IS 'Audit log of all SSE events sent to frontend for replay and debugging';
COMMENT ON COLUMN "sse_events_log"."event_type" IS 'SSE event type: workflow_created, parser_started, artifacts_ready, etc.';
COMMENT ON COLUMN "sse_events_log"."event_data" IS 'Complete event data payload as JSON';
COMMENT ON COLUMN "sse_events_log"."workflow_execution_id" IS 'Optional workflow reference, null for non-workflow events';