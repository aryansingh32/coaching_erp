#!/bin/bash
# Generate self-signed TLS certs for local Nginx (dev only).
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)/ssl"
mkdir -p "$DIR"
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$DIR/privkey.pem" \
  -out "$DIR/fullchain.pem" \
  -subj "/CN=coachingos.local/O=CoachingOS Dev"
echo "Created $DIR/fullchain.pem and $DIR/privkey.pem"
