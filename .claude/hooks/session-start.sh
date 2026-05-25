#!/bin/bash
set -euo pipefail

# Only run setup in the remote Claude Code on the web environment.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Install npm dependencies so typecheck / build / dev work without delay.
npm install --no-audit --no-fund --loglevel=error
