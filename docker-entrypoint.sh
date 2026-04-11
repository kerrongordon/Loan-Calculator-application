#!/bin/sh
set -e
chown -R node:node /app/node_modules 2>/dev/null || true
exec gosu node "$@"
