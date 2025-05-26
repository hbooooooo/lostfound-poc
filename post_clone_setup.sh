#!/bin/bash

echo "🔧 Starting Lost & Found App Post-Clone Setup"

# Step 1: Initialize environment
echo "📁 Copying .env file..."
cp .env.example .env

# Step 2: Build and start Docker containers
echo "🐳 Building and starting Docker containers..."
docker-compose up --build -d

# Step 3: Initialize PostgreSQL database (if not already populated)
echo "🗃 Initializing database..."
docker exec -i lostfound-pg psql -U postgres -d lostfound < backend/db/init.sql

# Optional Mailpit container for email testing
read -p "📬 Start Mailpit for local email testing? (y/n): " start_mailpit
if [[ "$start_mailpit" == "y" ]]; then
  docker run -d -p 1080:1080 -p 1025:1025 mailpit/mailpit
  echo "Mailpit running at http://localhost:1080"
fi

echo "✅ Setup complete! Visit your frontend and backend endpoints to verify.