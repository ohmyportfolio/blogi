#!/usr/bin/env bash
set -euo pipefail

APP_NAME="${APP_NAME:-blogi}"
PORT="${PORT:-3000}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PM2_CONFIG="$ROOT_DIR/ecosystem.config.cjs"

usage() {
  echo "Usage: $(basename "$0") {start|stop|restart|log|status}"
  exit 1
}

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

start_app() {
  ensure_pm2
  pm2 delete "$APP_NAME" 2>/dev/null || true
  pm2 start "$PM2_CONFIG" --update-env
  pm2 save
}

stop_app() {
  ensure_pm2
  pm2 stop "$APP_NAME"
}

restart_app() {
  ensure_pm2
  start_app
}

logs_app() {
  ensure_pm2
  pm2 logs "$APP_NAME" --lines 200
}

status_app() {
  ensure_pm2
  pm2 status "$APP_NAME"
}

case "${1:-}" in
  start) start_app ;;
  stop) stop_app ;;
  restart) restart_app ;;
  log) logs_app ;;
  status) status_app ;;
  *) usage ;;
esac
