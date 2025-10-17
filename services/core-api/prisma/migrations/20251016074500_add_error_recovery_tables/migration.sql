-- Migration: Add tables for error recovery and idempotency
-- Phase 8: Error Recovery Support

-- Idempotency cache table
CREATE TABLE IF NOT EXISTS "idempotency_cache" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "operation_key" TEXT NOT NULL,
    "result_data" JSONB,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idempotency_cache_pkey" PRIMARY KEY ("id")
);

-- Operation locks table for distributed locking
CREATE TABLE IF NOT EXISTS "operation_locks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "operation_key" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operation_locks_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE UNIQUE INDEX "idempotency_cache_operation_key_key" ON "idempotency_cache"("operation_key");
CREATE INDEX "idempotency_cache_expires_at_idx" ON "idempotency_cache"("expires_at");

CREATE UNIQUE INDEX "operation_locks_operation_key_key" ON "operation_locks"("operation_key");
CREATE INDEX "operation_locks_expires_at_idx" ON "operation_locks"("expires_at");

-- Add cleanup function to remove expired records
CREATE OR REPLACE FUNCTION cleanup_expired_idempotency() 
RETURNS void AS $$
BEGIN
    DELETE FROM idempotency_cache WHERE expires_at < NOW();
    DELETE FROM operation_locks WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (can be called by cron job or application)
COMMENT ON FUNCTION cleanup_expired_idempotency() IS 'Removes expired idempotency cache and lock records';