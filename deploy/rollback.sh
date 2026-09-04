#!/usr/bin/env bash
set -Eeuo pipefail

DEPLOY_ROOT="${DEPLOY_ROOT:?DEPLOY_ROOT is required}"
FAILED_RELEASE="${FAILED_RELEASE:-}"
PREVIOUS_LINK="${DEPLOY_ROOT}/previous"
CURRENT_LINK="${DEPLOY_ROOT}/current"

previous="$(readlink -f "$PREVIOUS_LINK" 2>/dev/null || true)"
[[ -n "$previous" && -d "$previous" ]] || { echo 'No previous release is available for rollback.' >&2; exit 1; }

if [[ -n "$FAILED_RELEASE" && "$previous" == "${DEPLOY_ROOT}/releases/${FAILED_RELEASE}" ]]; then
    echo 'Previous release points to the failed release; refusing rollback.' >&2
    exit 1
fi

ln -sfn "$previous" "${DEPLOY_ROOT}/.current-rollback"
mv -Tf "${DEPLOY_ROOT}/.current-rollback" "$CURRENT_LINK"

cd "$CURRENT_LINK"
php artisan optimize:clear --ansi
php artisan config:cache --ansi
php artisan view:cache --ansi

php artisan queue:restart --ansi

echo "Rollback complete: ${previous}"
