#!/usr/bin/env bash
set -Eeuo pipefail

# Run once as root. This provisions only an Indotix application root.
# It intentionally does not manage aaPanel, web server, firewall, or mail services.
DEPLOY_ROOT="${DEPLOY_ROOT:?Set DEPLOY_ROOT, for example /www/wwwroot/indotix}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
PHP_FPM_GROUP="${PHP_FPM_GROUP:?Set PHP_FPM_GROUP, for example www-data or nginx}"
EXISTING_APP_ROOT="${EXISTING_APP_ROOT:-}"

[[ "$(id -u)" == '0' ]] || { echo 'Run this bootstrap script as root.' >&2; exit 1; }
[[ "$DEPLOY_ROOT" == /* ]] || { echo 'DEPLOY_ROOT must be an absolute path.' >&2; exit 64; }

if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
    adduser --disabled-password --gecos '' "$DEPLOY_USER"
fi

getent group "$PHP_FPM_GROUP" >/dev/null || { echo "Unknown PHP-FPM group: ${PHP_FPM_GROUP}" >&2; exit 1; }
command -v setfacl >/dev/null || { echo 'setfacl is required. Install the acl package first.' >&2; exit 1; }
usermod -a -G "$PHP_FPM_GROUP" "$DEPLOY_USER"
install -d -o "$DEPLOY_USER" -g "$PHP_FPM_GROUP" -m 750 "$DEPLOY_ROOT"
install -d -o "$DEPLOY_USER" -g "$PHP_FPM_GROUP" -m 750 \
    "$DEPLOY_ROOT/releases" "$DEPLOY_ROOT/shared" \
    "$DEPLOY_ROOT/shared/public" "$DEPLOY_ROOT/shared/public/guide-releases"
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" -m 750 \
    "$DEPLOY_ROOT/incoming" "$DEPLOY_ROOT/backups"
install -d -o "$DEPLOY_USER" -g "$PHP_FPM_GROUP" -m 2775 \
    "$DEPLOY_ROOT/shared/storage/app/public" \
    "$DEPLOY_ROOT/shared/storage/framework/cache/data" \
    "$DEPLOY_ROOT/shared/storage/framework/sessions" \
    "$DEPLOY_ROOT/shared/storage/framework/views" \
    "$DEPLOY_ROOT/shared/storage/logs"

if [[ ! -e "$DEPLOY_ROOT/shared/.env" ]]; then
    install -o "$DEPLOY_USER" -g "$PHP_FPM_GROUP" -m 640 /dev/null "$DEPLOY_ROOT/shared/.env"
fi

if [[ -n "$EXISTING_APP_ROOT" ]]; then
    [[ "$EXISTING_APP_ROOT" == /* ]] || { echo 'EXISTING_APP_ROOT must be an absolute path.' >&2; exit 64; }

    if [[ -d "$EXISTING_APP_ROOT/storage" ]]; then
        rsync -a --ignore-existing --chown="$DEPLOY_USER:$PHP_FPM_GROUP" \
            "$EXISTING_APP_ROOT/storage/" "$DEPLOY_ROOT/shared/storage/"
    fi

    if [[ -d "$EXISTING_APP_ROOT/public/storage" ]]; then
        rsync -a --ignore-existing --chown="$DEPLOY_USER:$PHP_FPM_GROUP" \
            "$EXISTING_APP_ROOT/public/storage/" "$DEPLOY_ROOT/shared/storage/app/public/"
    fi
fi

# PHP-FPM, queue workers, and deployment commands all write to shared storage.
# Setgid and default ACLs preserve access when any of those processes creates a path.
chown -R "$DEPLOY_USER:$PHP_FPM_GROUP" "$DEPLOY_ROOT/shared/storage"
find "$DEPLOY_ROOT/shared/storage" -type d -exec chmod 2775 {} +
find "$DEPLOY_ROOT/shared/storage" -type f -exec chmod 664 {} +
find "$DEPLOY_ROOT/shared/storage" -type d \
    -exec setfacl -m "u:${DEPLOY_USER}:rwx,g:${PHP_FPM_GROUP}:rwx,m::rwx" {} + \
    -exec setfacl -d -m "u:${DEPLOY_USER}:rwx,g:${PHP_FPM_GROUP}:rwx,m::rwx" {} +
find "$DEPLOY_ROOT/shared/storage" -type f \
    -exec setfacl -m "u:${DEPLOY_USER}:rw-,g:${PHP_FPM_GROUP}:rw-,m::rw-" {} +

echo "Bootstrap complete for ${DEPLOY_ROOT}. Populate shared/.env before deploying."
