#!/bin/bash

echo "🔁 Starting Lost & Found Stack..."


# Navigate to project directory
cd ~/lostfound-poc || {
  echo "❌ Project directory not found"
  exit 1
}
 
# Start Docker containers
echo "🐳 Starting Docker containers..."
docker compose up -d

echo "✅ All services started."