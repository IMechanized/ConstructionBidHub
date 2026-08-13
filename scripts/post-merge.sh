#!/bin/bash
set -e

echo "Running post-merge setup..."

# Install dependencies
npm install --legacy-peer-deps

# Push DB schema changes if any
npm run db:push 2>/dev/null || true

echo "Post-merge setup complete."
