#!/usr/bin/env bash
# ==============================================================================
# Database Backup Script for PostgreSQL (Production & Staging)
# ==============================================================================
set -euo pipefail

export PATH="/Library/PostgreSQL/18/bin:/opt/homebrew/bin:/usr/local/bin:${PATH}"

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="${DB_NAME:-interview_platform}"
DB_USER="${DB_USER:-aayushbhakare}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5433}"
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_backup_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "[*] Starting PostgreSQL backup for ${DB_NAME} on ${DB_HOST}:${DB_PORT}..."

if command -v pg_dump >/dev/null 2>&1; then
    pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" --no-owner --clean --if-exists | gzip > "${BACKUP_FILE}"
    echo "[+] Backup created successfully: ${BACKUP_FILE}"
    echo "[+] Backup size: $(du -h "${BACKUP_FILE}" | cut -f1)"
else
    echo "[-] Error: pg_dump utility not found on PATH." >&2
    exit 1
fi

# Retention policy: Delete backups older than 14 days
echo "[*] Cleaning up backups older than 14 days..."
find "${BACKUP_DIR}" -name "${DB_NAME}_backup_*.sql.gz" -type f -mtime +14 -exec rm -f {} +
echo "[+] Backup retention rotation completed."
