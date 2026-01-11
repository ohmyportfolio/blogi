#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$ROOT_DIR/.dev.pid"
LOG_FILE="$ROOT_DIR/.dev.log"
ENV_FILE="$ROOT_DIR/.env"

usage() {
  echo "Usage: $(basename "$0") {start|stop|restart|status|log}"
  exit 1
}

get_env_value() {
  local key="$1"
  local file="$2"
  local line value

  if [[ ! -f "$file" ]]; then
    return 0
  fi

  line="$(grep -E "^(export[[:space:]]+)?${key}=" "$file" | tail -n 1 || true)"
  if [[ -z "$line" ]]; then
    return 0
  fi

  line="${line#export }"
  value="${line#${key}=}"

  if [[ "${value:0:1}" == "\"" && "${value: -1}" == "\"" ]]; then
    value="${value%\"}"
    value="${value#\"}"
  elif [[ "${value:0:1}" == "'" && "${value: -1}" == "'" ]]; then
    value="${value%\'}"
    value="${value#\'}"
  else
    value="${value%%#*}"
    value="${value%"${value##*[![:space:]]}"}"
  fi

  printf '%s' "$value"
}

print_connection_info() {
  local port database_url auth_url site_url uploads_dir uploads_url
  port="${PORT:-3000}"
  database_url="$(get_env_value "DATABASE_URL" "$ENV_FILE")"
  auth_url="$(get_env_value "AUTH_URL" "$ENV_FILE")"
  site_url="$(get_env_value "SITE_URL" "$ENV_FILE")"
  uploads_dir="$(get_env_value "UPLOADS_DIR" "$ENV_FILE")"
  uploads_url="$(get_env_value "UPLOADS_URL" "$ENV_FILE")"

  echo "Dev server: http://localhost:${port}"
  if [[ -n "$site_url" ]]; then
    echo "SITE_URL:   ${site_url}"
  fi
  if [[ -n "$auth_url" ]]; then
    echo "AUTH_URL:   ${auth_url}"
  fi
  if [[ -n "$uploads_dir" || -n "$uploads_url" ]]; then
    echo "Uploads:    dir=${uploads_dir:-./uploads} url=${uploads_url:-/uploads}"
  fi

  if [[ -n "$database_url" ]]; then
    local sanitized url_no_proto user_host db_name
    sanitized="${database_url#postgresql://}"
    sanitized="${sanitized#postgres://}"
    url_no_proto="$sanitized"
    user_host="${url_no_proto%%/*}"
    db_name="${url_no_proto#*/}"
    db_name="${db_name%%\?*}"
    local user host port_part
    if [[ "$user_host" == *"@"* ]]; then
      user="${user_host%%@*}"
      host_port="${user_host#*@}"
    else
      user=""
      host_port="$user_host"
    fi
    host="${host_port%%:*}"
    port_part="${host_port#*:}"
    if [[ "$host" == "$host_port" ]]; then
      port_part="5432"
    fi
    if [[ -n "$user" ]]; then
      user="${user%%:*}"
    fi
    echo "Database:   user=${user:-?} db=${db_name:-?} host=${host:-?} port=${port_part:-?}"
  else
    echo "Database:   DATABASE_URL not set in .env"
  fi
}

is_running() {
  if [[ ! -f "$PID_FILE" ]]; then
    return 1
  fi
  local pid
  pid="$(cat "$PID_FILE")"
  if [[ -z "$pid" ]]; then
    return 1
  fi
  if ps -p "$pid" >/dev/null 2>&1; then
    return 0
  fi
  return 1
}

start_dev() {
  if is_running; then
    echo "Dev server already running (pid $(cat "$PID_FILE"))"
    exit 0
  fi

  rm -f "$PID_FILE"
  : > "$LOG_FILE"

  echo "Starting dev server..."
  (cd "$ROOT_DIR" && nohup npm run dev > "$LOG_FILE" 2>&1 & echo $! > "$PID_FILE")
  sleep 1
  if is_running; then
    echo "Dev server started (pid $(cat "$PID_FILE"))"
    print_connection_info
    echo "Logs:       $LOG_FILE"
  else
    echo "Failed to start dev server. Check logs: $LOG_FILE"
    exit 1
  fi
}

stop_dev() {
  if ! is_running; then
    echo "Dev server is not running"
    rm -f "$PID_FILE"
    exit 0
  fi

  local pid
  pid="$(cat "$PID_FILE")"
  echo "Stopping dev server (pid $pid)..."
  kill "$pid" >/dev/null 2>&1 || true

  local elapsed=0
  local timeout=10
  while is_running; do
    if [[ "$elapsed" -ge "$timeout" ]]; then
      echo "Force killing dev server (pid $pid)"
      kill -9 "$pid" >/dev/null 2>&1 || true
      break
    fi
    sleep 1
    elapsed=$((elapsed + 1))
  done

  rm -f "$PID_FILE"
  echo "Dev server stopped"
}

status_dev() {
  if is_running; then
    echo "Dev server running (pid $(cat "$PID_FILE"))"
  else
    echo "Dev server not running"
    exit 1
  fi
}

log_dev() {
  if [[ ! -f "$LOG_FILE" ]]; then
    echo "No log file found: $LOG_FILE"
    exit 1
  fi
  tail -n 200 "$LOG_FILE"
}

case "${1:-}" in
  start) start_dev ;;
  stop) stop_dev ;;
  restart) stop_dev; start_dev ;;
  status) status_dev ;;
  log) log_dev ;;
  *) usage ;;
esac
