#!/usr/bin/env bash
set -Eeuo pipefail

DEPLOY_ROOT="${DEPLOY_ROOT:?DEPLOY_ROOT is required}"
EXPECTED_ENVIRONMENT="${EXPECTED_ENVIRONMENT:-production}"
BACKUP_RETENTION="${BACKUP_RETENTION:-7}"
ENV_FILE="${DEPLOY_ROOT}/shared/.env"
BACKUP_DIR="${DEPLOY_ROOT}/backups"

[[ -f "$ENV_FILE" ]] || { echo "Missing shared environment file: ${ENV_FILE}" >&2; exit 1; }
[[ "$BACKUP_RETENTION" =~ ^[1-9][0-9]*$ ]] || { echo 'BACKUP_RETENTION must be a positive integer' >&2; exit 64; }

read_env() {
    php -r '
        $key = $argv[2];
        foreach (file($argv[1], FILE_IGNORE_NEW_LINES) ?: [] as $line) {
            $line = trim($line);
            if ($line === "" || str_starts_with($line, "#") || ! str_contains($line, "=")) continue;
            [$name, $value] = explode("=", $line, 2);
            if (trim($name) !== $key) continue;
            $value = trim($value);
            if (strlen($value) >= 2 && (($value[0] === "\"" && substr($value, -1) === "\"") || ($value[0] === "\047" && substr($value, -1) === "\047"))) $value = substr($value, 1, -1);
            echo $value;
            exit;
        }
    ' "$ENV_FILE" "$1"
}

[[ "$(read_env APP_ENV)" == "$EXPECTED_ENVIRONMENT" ]] || { echo 'APP_ENV guard rejected database backup.' >&2; exit 1; }
db_connection="$(read_env DB_CONNECTION)"
[[ "$db_connection" == "mysql" || "$db_connection" == "mariadb" ]] || { echo "Unsupported database connection: ${db_connection}" >&2; exit 1; }

dump_command="$(command -v mysqldump || command -v mariadb-dump || true)"
[[ -n "$dump_command" ]] || { echo 'mysqldump or mariadb-dump is required for production backup.' >&2; exit 1; }

umask 077
mkdir -p "$BACKUP_DIR"
timestamp="$(date -u +%Y%m%d-%H%M%S)"
backup_file="${BACKUP_DIR}/database-${EXPECTED_ENVIRONMENT}-${timestamp}.sql.gz"
temporary_file="${backup_file}.partial"

export MYSQL_PWD="$(read_env DB_PASSWORD)"
"$dump_command" --host="$(read_env DB_HOST)" --port="$(read_env DB_PORT)" \
    --user="$(read_env DB_USERNAME)" --single-transaction --quick --routines --events --skip-lock-tables \
    "$(read_env DB_DATABASE)" | gzip -c > "$temporary_file"
unset MYSQL_PWD

[[ -s "$temporary_file" ]] || { rm -f "$temporary_file"; echo 'Database backup is empty.' >&2; exit 1; }
mv "$temporary_file" "$backup_file"
find "$BACKUP_DIR" -maxdepth 1 -type f -name 'database-*.sql.gz' -printf '%T@ %p\n' | sort -rn | tail -n "+$((BACKUP_RETENTION + 1))" | cut -d' ' -f2- | xargs -r rm -f --
echo "Database backup complete: ${backup_file}"
