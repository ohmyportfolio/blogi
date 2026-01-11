#!/usr/bin/env bash
set -euo pipefail

APP_NAME="${APP_NAME:-blogi}"
PORT="${PORT:-3000}"
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
  local elapsed=0
  local timeout=30
  while ! port_listening; do
    if [ "$elapsed" -ge "$timeout" ]; then
      echo "Port $PORT is not listening after restart."
      echo "Check pm2 logs: pm2 logs $APP_NAME --lines 200 --nostream"
      exit 1
    fi
    sleep 1
    elapsed=$((elapsed + 1))
  done
}

port_listening() {
  if command -v ss >/dev/null 2>&1; then
    if command -v rg >/dev/null 2>&1; then
      ss -lptn | rg -q ":${PORT}\\b"
      return $?
    fi
    ss -lptn | grep -q ":${PORT}[[:space:]]"
    return $?
  fi

  if command -v lsof >/dev/null 2>&1; then
    if command -v rg >/dev/null 2>&1; then
      lsof -iTCP -sTCP:LISTEN -nP | rg -q ":${PORT}\\b"
      return $?
    fi
    lsof -iTCP -sTCP:LISTEN -nP | grep -q ":${PORT}[[:space:]]"
    return $?
  fi

  return 0
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
