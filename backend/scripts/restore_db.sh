#!/usr/bin/env bash
# ==============================================================================
# Database Restore Script for PostgreSQL
# WARNING: Restoring will overwrite existing database records!
# ==============================================================================
set -euo pipefail

export PATH="/Library/PostgreSQL/18/bin:/opt/homebrew/bin:/usr/local/bin:${PATH}"

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <path_to_backup.sql.gz>" >&2
    exit 1
fi

BACKUP_FILE="$1"
DB_NAME="${DB_NAME:-interview_platform}"
DB_USER="${DB_USER:-aayushbhakare}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5433}"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "[-] Error: Backup file '${BACKUP_FILE}' not found." >&2
    exit 1
fi

echo "[!] WARNING: You are about to restore into '${DB_NAME}' on ${DB_HOST}:${DB_PORT}."

if ! command -v psql >/dev/null 2>&1; then
    echo "[-] Error: psql utility not found on PATH." >&2
    exit 1
fi

TEMP_SQL=$(mktemp /tmp/restore_db_XXXXXX.sql)
trap 'rm -f "${TEMP_SQL}"' EXIT

echo "[*] Decompressing and validating archive to temporary file..."
gunzip -c "${BACKUP_FILE}" > "${TEMP_SQL}"

echo "[*] Applying SQL restore in a single transaction with ON_ERROR_STOP..."
psql -v ON_ERROR_STOP=1 --single-transaction -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -f "${TEMP_SQL}"
echo "[+] Database restore completed successfully."
