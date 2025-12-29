#!/usr/bin/env bash
set -euo pipefail

APP_NAME="danang-vip"
PORT="${PORT:-3010}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

ensure_pm2() {
  if ! command -v pm2 >/dev/null 2>&1; then
    echo "pm2 is not installed."
    exit 1
  fi
}

ensure_app_running() {
  if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
    pm2 restart "$APP_NAME"
  else
    (cd "$ROOT_DIR" && pm2 start npm --name "$APP_NAME" -- start -- -p "$PORT")
    pm2 save
  fi
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

echo "Build..."
npm run build

echo "Restart app..."
ensure_app_running

echo "Update completed."
