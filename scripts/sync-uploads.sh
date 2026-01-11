#!/usr/bin/env bash
set -euo pipefail

# Client-side sync for server uploads.
# Update SERVER_USER or REMOTE_UPLOADS_DIR if your environment differs.

SERVER_HOST="${SERVER_HOST:-your-server-host}"
SERVER_PORT="${SERVER_PORT:-22}"
SERVER_USER="${SERVER_USER:-root}"
REMOTE_UPLOADS_DIR="${REMOTE_UPLOADS_DIR:-/data/blogi/uploads}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
LOCAL_DIR="${LOCAL_DIR:-${SCRIPT_DIR}/../uploads}"
ENV_FILE="${ENV_FILE:-${SCRIPT_DIR}/../.env}"

# Set this to avoid prompts, or leave blank to be loaded from .env or prompted.
PASSWORD="${PASSWORD:-${PRD_SV_KEY:-}}"

# Set to "true" to mirror files and delete extras on the destination side.
DELETE="${DELETE:-false}"
DIRECTION="${DIRECTION:-pull}"
DRY_RUN="${DRY_RUN:-false}"

usage() {
    cat <<EOF
Usage: $(basename "$0") [--pull|--push|--both] [--delete] [--dry-run]

Environment overrides:
  SERVER_HOST, SERVER_PORT, SERVER_USER, REMOTE_UPLOADS_DIR, LOCAL_DIR
  ENV_FILE, PASSWORD (or PRD_SV_KEY), DELETE, DIRECTION
EOF
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --pull)
            DIRECTION="pull"
            ;;
        --push)
            DIRECTION="push"
            ;;
        --both)
            DIRECTION="both"
            ;;
        --delete)
            DELETE="true"
            ;;
        --dry-run)
            DRY_RUN="true"
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1" >&2
            usage >&2
            exit 1
            ;;
    esac
    shift
done

if ! command -v rsync >/dev/null 2>&1; then
    echo "rsync is required. Install rsync and try again." >&2
    exit 1
fi

get_env_value() {
    local key="$1"
    local file="$2"
    local line value

    line="$(grep -E "^(export[[:space:]]+)?${key}=" "${file}" | tail -n 1 || true)"
    if [[ -z "${line}" ]]; then
        return 0
    fi

    line="${line#export }"
    value="${line#${key}=}"

    if [[ "${value:0:1}" == "\"" && "${value: -1}" == "\"" ]]; then
        value="${value:1:-1}"
    elif [[ "${value:0:1}" == "'" && "${value: -1}" == "'" ]]; then
        value="${value:1:-1}"
    else
        value="${value%%#*}"
        value="${value%"${value##*[![:space:]]}"}"
    fi

    printf '%s' "${value}"
}

if [[ -z "${PASSWORD}" && -f "${ENV_FILE}" ]]; then
    ENV_PASSWORD="$(get_env_value "PRD_SV_KEY" "${ENV_FILE}")"
    if [[ -n "${ENV_PASSWORD}" ]]; then
        PASSWORD="${ENV_PASSWORD}"
    fi
fi

if [[ -z "${PASSWORD}" ]]; then
    read -r -s -p "SSH password for ${SERVER_USER}@${SERVER_HOST}: " PASSWORD
    echo
fi

case "${DIRECTION}" in
    pull|push|both)
        ;;
    *)
        echo "Invalid DIRECTION: ${DIRECTION}" >&2
        exit 1
        ;;
esac

RSYNC_OPTS=(-az --info=progress2)
if [[ "${DRY_RUN}" == "true" ]]; then
    RSYNC_OPTS+=(--dry-run)
fi
if [[ "${DELETE}" == "true" ]]; then
    RSYNC_OPTS+=(--delete)
fi

SSH_CMD=(ssh -p "${SERVER_PORT}" -o StrictHostKeyChecking=accept-new)
REMOTE="${SERVER_USER}@${SERVER_HOST}:${REMOTE_UPLOADS_DIR%/}/"
LOCAL="${LOCAL_DIR%/}/"

run_rsync() {
    local direction="$1"
    local source dest target

    if [[ "${direction}" == "pull" ]]; then
        source="${REMOTE}"
        dest="${LOCAL}"
        target="${LOCAL}"
        mkdir -p "${LOCAL_DIR}"
    else
        source="${LOCAL}"
        dest="${REMOTE}"
        target="${REMOTE}"
        if [[ ! -d "${LOCAL_DIR}" ]]; then
            echo "Local dir not found: ${LOCAL_DIR}" >&2
            exit 1
        fi
    fi

    if command -v sshpass >/dev/null 2>&1; then
        SSHPASS="${PASSWORD}" sshpass -e rsync "${RSYNC_OPTS[@]}" -e "${SSH_CMD[*]}" "${source}" "${dest}"
    elif [[ -n "${PASSWORD}" ]]; then
        ASKPASS_SCRIPT="$(mktemp)"
        chmod 700 "${ASKPASS_SCRIPT}"
        cat > "${ASKPASS_SCRIPT}" <<'EOF'
#!/usr/bin/env bash
echo "${ASKPASS_PASSWORD}"
EOF
        if command -v setsid >/dev/null 2>&1; then
            DISPLAY=1 SSH_ASKPASS_REQUIRE=force SSH_ASKPASS="${ASKPASS_SCRIPT}" ASKPASS_PASSWORD="${PASSWORD}" \
                setsid -w rsync "${RSYNC_OPTS[@]}" -e "${SSH_CMD[*]}" "${source}" "${dest}"
        else
            DISPLAY=1 SSH_ASKPASS_REQUIRE=force SSH_ASKPASS="${ASKPASS_SCRIPT}" ASKPASS_PASSWORD="${PASSWORD}" \
                rsync "${RSYNC_OPTS[@]}" -e "${SSH_CMD[*]}" "${source}" "${dest}"
        fi
        rm -f "${ASKPASS_SCRIPT}"
    else
        echo "sshpass not found; ssh will prompt for the password." >&2
        rsync "${RSYNC_OPTS[@]}" -e "${SSH_CMD[*]}" "${source}" "${dest}"
    fi

    echo "Sync complete (${direction}): ${target}"
}

if [[ "${DIRECTION}" == "both" ]]; then
    run_rsync "pull"
    run_rsync "push"
else
    run_rsync "${DIRECTION}"
fi
