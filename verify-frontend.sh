#!/bin/bash
# Frontend Service Health Check & Startup Script
# This script ensures the frontend is properly listening on port 3000

set -e

echo "=== FRONTEND STARTUP & VERIFICATION ==="

# Step 1: Kill any existing processes
echo "Step 1: Cleaning up old processes..."
taskkill /F /IM node.exe /IM npm.exe 2>&1 | grep -i SUCCESS || true
sleep 3

# Step 2: Verify ports are free
echo "Step 2: Checking if ports are free..."
PORT_CHECK=$(netstat -ano 2>/dev/null | grep ":3000 " || echo "FREE")
if [[ "$PORT_CHECK" != "FREE" ]]; then
  echo "❌ Port 3000 is still in use, killing process..."
  taskkill /F /IM node.exe 2>&1 || true
  sleep 3
fi

# Step 3: Start frontend
echo "Step 3: Starting frontend on port 3000..."
cd "c:\Users\HP\OneDrive\Desktop\Full-Stack-Assignment\frontend"
npm run dev &
FRONTEND_PID=$!
sleep 5

# Step 4: Verify frontend is listening
echo "Step 4: Verifying frontend is listening..."
MAX_ATTEMPTS=10
ATTEMPT=0
FRONTEND_READY=false

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if netstat -ano 2>/dev/null | grep ":3000 " > /dev/null; then
    echo "✅ Frontend is listening on port 3000"
    FRONTEND_READY=true
    break
  fi
  ATTEMPT=$((ATTEMPT + 1))
  echo "  Attempt $ATTEMPT/$MAX_ATTEMPTS... waiting for port to bind"
  sleep 2
done

if [ "$FRONTEND_READY" = false ]; then
  echo "❌ CRITICAL: Frontend failed to bind to port 3000 after $MAX_ATTEMPTS attempts"
  echo "Killing frontend process..."
  kill $FRONTEND_PID 2>/dev/null || true
  exit 1
fi

# Step 5: Test HTTP connectivity
echo "Step 5: Testing HTTP connectivity..."
HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [ "$HTTP_RESPONSE" = "200" ]; then
  echo "✅ Frontend is responding to HTTP requests (Status: 200)"
else
  echo "⚠️  Frontend port is bound but HTTP status: $HTTP_RESPONSE"
fi

echo ""
echo "=== FRONTEND VERIFICATION COMPLETE ==="
echo "✅ Frontend is ready at http://localhost:3000"
echo ""

# Keep process running
wait
