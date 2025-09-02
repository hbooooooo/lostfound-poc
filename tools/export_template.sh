#!/usr/bin/env bash
set -euo pipefail

# Usage: ./tools/export_template.sh <target_dir> <project_name> [backend_port] [nginx_port] [ml_port]

TARGET_DIR=${1:-}
PROJECT_NAME=${2:-}
BACKEND_PORT=${3:-3001}
NGINX_PORT=${4:-5174}
ML_PORT=${5:-8002}

if [[ -z "$TARGET_DIR" || -z "$PROJECT_NAME" ]]; then
  echo "Usage: $0 <target_dir> <project_name> [backend_port] [nginx_port] [ml_port]" >&2
  exit 1
fi

if [[ -e "$TARGET_DIR" && ! -d "$TARGET_DIR" ]]; then
  echo "Target exists and is not a directory: $TARGET_DIR" >&2
  exit 1
fi

mkdir -p "$TARGET_DIR"

copy() {
  rsync -a --exclude ".git" --exclude "node_modules" --exclude "uploads" --exclude "labels" "$1" "$TARGET_DIR/"
}

copy backend
copy frontend
copy ml_service
copy nginx
cp -a docker-compose.yml "$TARGET_DIR/" || true
cp -a docker-compose.cpu.yml "$TARGET_DIR/" 2>/dev/null || true
cp -a .gitignore "$TARGET_DIR/" || true
cp -a start_lostfound.sh "$TARGET_DIR/" || true

# basic .env template
cat > "$TARGET_DIR/.env" <<EOF
COMPOSE_PROJECT_NAME=$PROJECT_NAME
POSTGRES_DB=mydb
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_HOST=db
JWT_SECRET=please-change-me
ML_SERVICE_URL=http://ml_service
CORS_ORIGINS=
DEFAULT_ORG_NAME=$PROJECT_NAME
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
EOF

# Adjust ports in docker-compose.yml
if grep -q '"3000:3000"' "$TARGET_DIR/docker-compose.yml"; then
  sed -i.bak "s/\"3000:3000\"/\"$BACKEND_PORT:3000\"/" "$TARGET_DIR/docker-compose.yml"
fi
if grep -q '"5173:443"' "$TARGET_DIR/docker-compose.yml"; then
  sed -i.bak "s/\"5173:443\"/\"$NGINX_PORT:443\"/" "$TARGET_DIR/docker-compose.yml"
fi
if grep -q '"8001:80"' "$TARGET_DIR/docker-compose.yml"; then
  sed -i.bak "s/\"8001:80\"/\"$ML_PORT:80\"/" "$TARGET_DIR/docker-compose.yml"
fi

# Tweak vite allowedHosts (optional)
if grep -q "allowedHosts" "$TARGET_DIR/frontend/vite.config.js"; then
  sed -i.bak "s/allowedHosts: \['lost.bouard.com'\]/allowedHosts: []/" "$TARGET_DIR/frontend/vite.config.js" || true
fi

echo "Template exported to $TARGET_DIR"
echo "Next: cd $TARGET_DIR && docker compose up -d --build"

