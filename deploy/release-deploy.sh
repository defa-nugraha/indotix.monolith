#!/usr/bin/env bash
set -Eeuo pipefail

DEPLOY_ROOT="${DEPLOY_ROOT:?DEPLOY_ROOT is required}"
RELEASE_ID="${RELEASE_ID:?RELEASE_ID is required}"
EXPECTED_ENVIRONMENT="${EXPECTED_ENVIRONMENT:?EXPECTED_ENVIRONMENT is required}"
EXPECTED_HOST="${EXPECTED_HOST:?EXPECTED_HOST is required}"
HEALTH_URL="${HEALTH_URL:?HEALTH_URL is required}"
SMOKE_URL="${SMOKE_URL:?SMOKE_URL is required}"
RUN_MIGRATIONS="${RUN_MIGRATIONS:-1}"

[[ "$(id -u)" != '0' ]] || { echo 'Release deployment must not run as root.' >&2; exit 1; }
[[ "$RELEASE_ID" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]] || { echo 'Invalid release ID.' >&2; exit 64; }

RELEASE_DIR="${DEPLOY_ROOT}/releases/${RELEASE_ID}"
SHARED_DIR="${DEPLOY_ROOT}/shared"
CURRENT_LINK="${DEPLOY_ROOT}/current"
PREVIOUS_LINK="${DEPLOY_ROOT}/previous"
switched=0

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
    ' "${SHARED_DIR}/.env" "$1"
}

rollback_on_error() {
    status=$?
    if ((switched)); then
        echo 'Release failed after activation; rolling back application files.' >&2
        DEPLOY_ROOT="$DEPLOY_ROOT" FAILED_RELEASE="$RELEASE_ID" "${RELEASE_DIR}/deploy/rollback.sh" || true
    fi
    exit "$status"
}
trap rollback_on_error ERR

[[ -d "$RELEASE_DIR" && -f "$RELEASE_DIR/artisan" ]] || { echo "Invalid release directory: ${RELEASE_DIR}" >&2; exit 1; }
[[ -f "${SHARED_DIR}/.env" ]] || { echo 'Missing shared/.env.' >&2; exit 1; }
[[ -d "${SHARED_DIR}/storage" ]] || { echo 'Missing shared/storage.' >&2; exit 1; }
[[ "$(read_env APP_ENV)" == "$EXPECTED_ENVIRONMENT" ]] || { echo 'APP_ENV guard rejected deployment.' >&2; exit 1; }
[[ "$(php -r 'echo parse_url($argv[1], PHP_URL_HOST) ?: "";' "$(read_env APP_URL)")" == "$EXPECTED_HOST" ]] || { echo 'APP_URL guard rejected deployment.' >&2; exit 1; }
if [[ "$EXPECTED_ENVIRONMENT" == 'production' && "$(read_env APP_DEBUG)" != 'false' ]]; then
    echo 'Production APP_DEBUG must be false.' >&2
    exit 1
fi

ln -sfn "${SHARED_DIR}/.env" "${RELEASE_DIR}/.env"
rm -rf "${RELEASE_DIR}/storage" "${RELEASE_DIR}/public/storage"
ln -s "${SHARED_DIR}/storage" "${RELEASE_DIR}/storage"
ln -s "${SHARED_DIR}/storage/app/public" "${RELEASE_DIR}/public/storage"

cd "$RELEASE_DIR"
php artisan package:discover --ansi
if [[ "$RUN_MIGRATIONS" == '1' ]]; then
    php artisan migrate --force --ansi
fi
php artisan optimize:clear --ansi
php artisan config:cache --ansi
php artisan view:cache --ansi

if [[ -L "$CURRENT_LINK" ]]; then
    ln -sfn "$(readlink -f "$CURRENT_LINK")" "${DEPLOY_ROOT}/.previous-next"
    mv -Tf "${DEPLOY_ROOT}/.previous-next" "$PREVIOUS_LINK"
fi
ln -sfn "$RELEASE_DIR" "${DEPLOY_ROOT}/.current-next"
mv -Tf "${DEPLOY_ROOT}/.current-next" "$CURRENT_LINK"
switched=1

php artisan queue:restart --ansi
printf '{"release":"%s","environment":"%s","commit":"%s","deployed_at":"%s"}\n' \
    "$RELEASE_ID" "$EXPECTED_ENVIRONMENT" "${GITHUB_SHA:-unknown}" "$(date -u +%FT%TZ)" > "${RELEASE_DIR}/release.json"

"${RELEASE_DIR}/deploy/health-check.sh" "$HEALTH_URL" "$SMOKE_URL"
DEPLOY_ROOT="$DEPLOY_ROOT" "${RELEASE_DIR}/deploy/cleanup-releases.sh"
echo "Release active: ${RELEASE_ID}"
