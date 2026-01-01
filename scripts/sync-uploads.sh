#!/usr/bin/env bash
set -euo pipefail

# Client-side sync for server uploads.
# Update SERVER_USER or REMOTE_UPLOADS_DIR if your environment differs.

SERVER_HOST="103.167.151.104"
SERVER_PORT="22"
SERVER_USER="root"
REMOTE_UPLOADS_DIR="/projects/danang-vip/public/uploads"
LOCAL_DIR="${HOME}/danang-vip-uploads"

# Set this to avoid prompts, or leave blank to be prompted.
PASSWORD=""

# Set to "true" to mirror server files and delete local extras.
DELETE="false"

if ! command -v rsync >/dev/null 2>&1; then
    echo "rsync is required. Install rsync and try again." >&2
    exit 1
fi

if [[ -z "${PASSWORD}" ]]; then
    read -r -s -p "SSH password for ${SERVER_USER}@${SERVER_HOST}: " PASSWORD
    echo
fi

mkdir -p "${LOCAL_DIR}"

RSYNC_OPTS=(-az --info=progress2)
if [[ "${DELETE}" == "true" ]]; then
    RSYNC_OPTS+=(--delete)
fi

SSH_CMD=(ssh -p "${SERVER_PORT}" -o StrictHostKeyChecking=accept-new)
REMOTE="${SERVER_USER}@${SERVER_HOST}:${REMOTE_UPLOADS_DIR%/}/"
LOCAL="${LOCAL_DIR%/}/"

if command -v sshpass >/dev/null 2>&1; then
    SSHPASS="${PASSWORD}" sshpass -e rsync "${RSYNC_OPTS[@]}" -e "${SSH_CMD[*]}" "${REMOTE}" "${LOCAL}"
else
    echo "sshpass not found; ssh will prompt for the password." >&2
    rsync "${RSYNC_OPTS[@]}" -e "${SSH_CMD[*]}" "${REMOTE}" "${LOCAL}"
fi

echo "Sync complete: ${LOCAL}"
