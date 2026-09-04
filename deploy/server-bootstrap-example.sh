#!/usr/bin/env bash
set -Eeuo pipefail

# Run once as root. This provisions only an Indotix application root.
# It intentionally does not manage aaPanel, web server, firewall, or mail services.
DEPLOY_ROOT="${DEPLOY_ROOT:?Set DEPLOY_ROOT, for example /www/wwwroot/indotix}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
PHP_FPM_GROUP="${PHP_FPM_GROUP:?Set PHP_FPM_GROUP, for example www-data or nginx}"

[[ "$(id -u)" == '0' ]] || { echo 'Run this bootstrap script as root.' >&2; exit 1; }
[[ "$DEPLOY_ROOT" == /* ]] || { echo 'DEPLOY_ROOT must be an absolute path.' >&2; exit 64; }

if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
    adduser --disabled-password --gecos '' "$DEPLOY_USER"
fi

getent group "$PHP_FPM_GROUP" >/dev/null || { echo "Unknown PHP-FPM group: ${PHP_FPM_GROUP}" >&2; exit 1; }
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" -m 750 "$DEPLOY_ROOT"
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" -m 750 \
    "$DEPLOY_ROOT/releases" "$DEPLOY_ROOT/incoming" "$DEPLOY_ROOT/backups"
install -d -o "$DEPLOY_USER" -g "$PHP_FPM_GROUP" -m 775 \
    "$DEPLOY_ROOT/shared/storage/app/public" \
    "$DEPLOY_ROOT/shared/storage/framework/cache" \
    "$DEPLOY_ROOT/shared/storage/framework/sessions" \
    "$DEPLOY_ROOT/shared/storage/framework/views" \
    "$DEPLOY_ROOT/shared/storage/logs"

if [[ ! -e "$DEPLOY_ROOT/shared/.env" ]]; then
    install -o "$DEPLOY_USER" -g "$PHP_FPM_GROUP" -m 640 /dev/null "$DEPLOY_ROOT/shared/.env"
fi

echo "Bootstrap complete for ${DEPLOY_ROOT}. Populate shared/.env before deploying."
