# =============================================================================
# BidOpsAI AI Assistant Supervisor Agent - Production Dockerfile
# =============================================================================
# Multi-stage build for optimized production image
# Uses UV for fast dependency installation and Python 3.12+

# Stage 1: Builder
FROM python:3.12-slim AS builder

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    UV_CACHE_DIR=/root/.cache/uv

WORKDIR /build

# Install system dependencies for building
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    g++ \
    make \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install UV package manager
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.cargo/bin:$PATH"

# Copy dependency files
COPY agents-core/pyproject.toml agents-core/uv.lock* ./

# Install production dependencies only
RUN uv pip install --system -r pyproject.toml --no-dev

# Copy application code
COPY agents-core/ ./

# Remove test files and dev tools
RUN find . -type d -name "tests" -exec rm -rf {} + && \
    find . -type d -name "__pycache__" -exec rm -rf {} + && \
    find . -type f -name "*.pyc" -delete && \
    find . -type f -name "*.pyo" -delete

# Stage 2: Runtime
FROM python:3.12-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app

# Create non-root user
RUN groupadd -r agentuser && useradd -r -g agentuser agentuser

WORKDIR /app

# Install runtime system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq5 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application from builder
COPY --from=builder /build /app

# Create necessary directories
RUN mkdir -p logs temp && \
    chown -R agentuser:agentuser /app

# Switch to non-root user
USER agentuser

# Expose port
EXPOSE 8002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8002/health || exit 1

# Set labels for metadata
LABEL maintainer="support@bidopsai.com" \
      description="BidOpsAI AI Assistant Supervisor Agent" \
      version="0.1.0"

# Run with uvicorn (no reload in production)
CMD ["uvicorn", "supervisors.ai_assistant.agent_executor:app", \
     "--host", "0.0.0.0", \
     "--port", "8002", \
     "--workers", "4", \
     "--log-level", "info", \
     "--access-log", \
     "--proxy-headers", \
     "--forwarded-allow-ips", "*"]