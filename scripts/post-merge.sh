#!/bin/bash
set -e

echo "Running post-merge setup..."

# Install dependencies
node scripts/portable-lockfile.mjs --fix
npm install --legacy-peer-deps
node scripts/portable-lockfile.mjs --fix
node scripts/portable-lockfile.mjs

# Push DB schema changes if any
npm run db:push 2>/dev/null || true

echo "Post-merge setup complete."
