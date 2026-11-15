#!/usr/bin/env bash
# Dump PostgreSQL from the Docker Compose stack.
# Usage: ./deploy/backup-db.sh
# Cron:  0 3 * * * /opt/hrtech/deploy/backup-db.sh >> /var/log/hrtech-backup.log 2>&1
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

BACKUP_DIR="${BACKUP_DIR:-$PWD/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

mkdir -p "$BACKUP_DIR"
file="$BACKUP_DIR/hrtech-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"
tmp="$file.tmp"

if ! docker compose exec -T db sh -c \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-acl' \
  | gzip -9 > "$tmp"; then
  rm -f "$tmp"
  echo "Backup failed" >&2
  exit 1
fi

if [[ ! -s "$tmp" ]]; then
  rm -f "$tmp"
  echo "Backup is empty" >&2
  exit 1
fi

mv "$tmp" "$file"
find "$BACKUP_DIR" -maxdepth 1 -type f -name '*.sql.gz' \
  -mtime "+${RETENTION_DAYS}" -delete

echo "Backup written: $file"
