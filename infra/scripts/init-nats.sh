#!/bin/bash
# Wait for NATS to be ready
echo "Waiting for NATS server to be ready..."
sleep 5

echo "Initializing NATS JetStream streams..."

# Create all required streams for the coaching system
for stream in STUDENT_EVENTS BATCH_EVENTS ATTENDANCE FEE_EVENTS LMS_EVENTS CLASS_EVENTS; do
  docker exec coaching_nats nats stream add $stream \
    --subjects "${stream,,}.>" \
    --storage file \
    --replicas 1 \
    --retention limits \
    --max-age 7d \
    --defaults 2>/dev/null || echo "Stream $stream already exists"
done

echo "NATS streams initialized successfully."
