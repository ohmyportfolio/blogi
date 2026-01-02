#!/usr/bin/env bash
set -euo pipefail

APP_NAME="danang-vip"
PORT="${PORT:-3010}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PM2_CONFIG="$ROOT_DIR/ecosystem.config.cjs"

ensure_pm2() {
  if ! command -v pm2 >/dev/null 2>&1; then
    echo "pm2 is not installed."
    exit 1
  fi

  if [ ! -f "$PM2_CONFIG" ]; then
    echo "Missing PM2 config: $PM2_CONFIG"
    exit 1
  fi
}

ensure_app_running() {
  pm2 delete "$APP_NAME" 2>/dev/null || true
  pm2 start "$PM2_CONFIG" --update-env
  pm2 save

  if ss -lptn | rg -q ":${PORT}\\b"; then
    return 0
  fi

  echo "Port $PORT is not listening after restart."
  echo "Check pm2 logs: pm2 logs $APP_NAME --lines 200 --nostream"
  exit 1
}

ensure_pm2

cd "$ROOT_DIR"
echo "Pull latest changes..."
git pull

echo "Install dependencies..."
npm ci

echo "Generate Prisma client..."
npx prisma generate

echo "Run DB migrations..."
npm run db:deploy

echo "Clean previous build..."
rm -rf .next

echo "Build..."
npm run build

echo "Restart app..."
ensure_app_running

echo "Update completed."
