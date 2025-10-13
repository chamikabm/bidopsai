#!/bin/bash

# BidOps.AI - Clean and Restart Only BidOps.AI Stack
# This script only affects containers with "bidopsai" in the name

set -e

echo "🧹 Cleaning up BidOps.AI containers..."

# Stop compose stack
echo "Stopping docker-compose stack..."
podman-compose -f infra/docker/docker-compose.dev.yml down -v 2>/dev/null || true

# Remove only bidopsai containers
echo "Removing bidopsai containers..."
podman ps -a --filter "name=bidopsai" --format "{{.ID}}" | xargs -r podman rm -f 2>/dev/null || true

# Remove only bidopsai volumes
echo "Removing bidopsai volumes..."
podman volume ls --filter "name=bidopsai" --format "{{.Name}}" | xargs -r podman volume rm -f 2>/dev/null || true

# Remove only bidopsai network
echo "Removing bidopsai network..."
podman network rm bidopsai-network 2>/dev/null || true

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📦 Building and starting containers..."
echo ""

# Start fresh
cd "$(dirname "$0")/.."
podman-compose -f infra/docker/docker-compose.dev.yml up --build -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 5

echo ""
echo "🎉 Done! Containers should be running now."
echo ""
echo "Check status with:"
echo "  podman ps --filter 'name=bidopsai'"
echo ""
echo "View logs with:"
echo "  podman logs -f bidopsai-web-dev"
echo "  podman logs -f bidopsai-core-api-dev"
echo "  podman logs -f bidopsai-postgres-dev"
echo ""
echo "📊 Next steps:"
echo "  1. Wait for postgres to be ready (check logs)"
echo "  2. Run migrations: podman exec bidopsai-core-api-dev npm run prisma:migrate"
echo "  3. Seed database: podman exec bidopsai-core-api-dev npm run prisma:seed"