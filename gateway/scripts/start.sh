#!/bin/sh
set -e
echo "Initializing NATS streams..."
node scripts/init-nats.js
echo "Running database migrations..."
node ./node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js
echo "Starting gateway..."
exec node dist/main
