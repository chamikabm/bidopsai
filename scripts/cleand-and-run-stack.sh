#!/bin/bash

# BidOps.AI - Fix Podman Container Dependencies
# This script cleans up corrupted Podman state and restarts containers

set -e

echo "🧹 Cleaning up Podman containers and networks..."

# Stop compose stack
echo "Stopping docker-compose stack..."
podman-compose -f infra/docker/docker-compose.dev.yml down -v 2>/dev/null || true

# Remove all containers (even stopped ones)
echo "Removing all containers..."
podman ps -aq | xargs -r podman rm -f 2>/dev/null || true

# Remove all networks
echo "Removing all networks..."
podman network ls --format "{{.Name}}" | grep -v "^podman$" | xargs -r podman network rm 2>/dev/null || true

# Clean up volumes
echo "Removing all volumes..."
podman volume ls -q | xargs -r podman volume rm -f 2>/dev/null || true

# System prune
echo "Running system prune..."
podman system prune -af --volumes

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📦 Building and starting containers..."
echo ""

# Start fresh
cd "$(dirname "$0")/.."
podman-compose -f infra/docker/docker-compose.dev.yml up --build

echo ""
echo "🎉 Done! Containers should be running now."
echo ""
echo "Check status with:"
echo "  podman ps"
echo ""
echo "View logs with:"
echo "  podman logs bidopsai-web-dev"
echo "  podman logs bidopsai-core-api-dev"
echo "  podman logs bidopsai-postgres-dev"