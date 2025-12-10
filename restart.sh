#!/bin/bash

# QuorumAI - Restart script

echo "Restarting Quorum..."
echo ""

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        echo "Killing process on port $port (PID: $pid)..."
        kill -9 $pid 2>/dev/null
    fi
}

# Kill existing processes
kill_port 8001
kill_port 5173

# Wait a moment for ports to clear
sleep 1

# Run start script
./start.sh
