#!/bin/bash

echo "🧾 Lost & Found App - Post-Clone Checklist Script"

# Check 1: Docker installed?
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

# Check 2: Docker Compose installed?
if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose not found. Please install Docker Compose."
    exit 1
fi

# Check 3: .env file
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ .env file created from example."
    else
        echo "❌ .env.example file missing. Please provide one."
        exit 1
    fi
else
    echo "✅ .env file found."
fi

# Check 4: Required environment variables
required_vars=("STRIPE_SECRET_KEY" "EMAIL_SERVICE_API_KEY" "SHIPPING_API_KEY")
missing_vars=()

for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "⚠️  Missing required environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "   - $var"
    done
    echo "   Please add them to your .env file before continuing."
    exit 1
else
    echo "✅ All required environment variables present."
fi

# Step 5: Start containers
echo "🐳 Building and starting Docker containers..."
docker-compose up --build -d

# Step 6: Database init
echo "🗃 Initializing database..."
docker exec -i lostfound-pg psql -U postgres -d lostfound < backend/db/init.sql

# Step 7: Optional Mailpit setup
read -p "📬 Start Mailpit for local email testing? (y/n): " start_mailpit
if [[ "$start_mailpit" == "y" ]]; then
  docker run -d -p 1080:1080 -p 1025:1025 mailpit/mailpit
  echo "📨 Mailpit running at http://localhost:1080"
fi

echo "✅ Setup complete!"