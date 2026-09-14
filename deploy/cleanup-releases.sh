#!/usr/bin/env bash
set -Eeuo pipefail

DEPLOY_ROOT="${DEPLOY_ROOT:?DEPLOY_ROOT is required}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"
RELEASES_DIR="${DEPLOY_ROOT}/releases"

[[ "$KEEP_RELEASES" =~ ^[1-9][0-9]*$ ]] || { echo 'KEEP_RELEASES must be a positive integer' >&2; exit 64; }
[[ -d "$RELEASES_DIR" ]] || exit 0

current="$(readlink -f "${DEPLOY_ROOT}/current" 2>/dev/null || true)"
previous="$(readlink -f "${DEPLOY_ROOT}/previous" 2>/dev/null || true)"

mapfile -t releases < <(find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' | sort -rn | awk '{print $2}')

for index in "${!releases[@]}"; do
    release="${releases[$index]}"
    if ((index < KEEP_RELEASES)) || [[ "$release" == "$current" ]] || [[ "$release" == "$previous" ]]; then
        continue
    fi

    echo "Removing expired release: ${release}"
    if ! rm -rf -- "$release"; then
        echo "Warning: failed to remove expired release, leaving it for manual cleanup: ${release}" >&2
    fi
done
