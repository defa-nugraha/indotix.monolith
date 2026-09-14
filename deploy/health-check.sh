#!/usr/bin/env bash
set -Eeuo pipefail

if (($# == 0)); then
    echo "Usage: $0 <https://host/up> [https://host/] [https://host/wisata]" >&2
    exit 64
fi

headers="$(mktemp)"
trap 'rm -f "$headers"' EXIT
index=0
for url in "$@"; do
    echo "Health check: ${url}"
    separator='?'
    [[ "$url" != *'?'* ]] || separator='&'
    status="$(curl --fail --silent --show-error \
        --retry 3 --retry-all-errors --connect-timeout 10 --max-time 30 \
        --header 'Cache-Control: no-cache' --dump-header "$headers" \
        --output /dev/null --write-out '%{http_code}' "${url}${separator}deploy_check=${EXPECTED_RELEASE:-health}-$(date +%s)")"
    [[ "$status" == '200' ]] || { echo "Unexpected HTTP ${status}; redirects are not a successful smoke check." >&2; exit 1; }
    if [[ "$index" == 0 && -n "${EXPECTED_RELEASE:-}" ]]; then
        actual="$(awk 'tolower($1) == "x-indotix-release:" {gsub(/\r/, "", $2); value=$2} END {print value}' "$headers")"
        if [[ "$actual" != "$EXPECTED_RELEASE" ]]; then
            echo 'Release identity mismatch: domain is not serving the activated release. Check aaPanel document root, PHP-FPM path/OPcache, and proxy cache.' >&2
            exit 1
        fi
    fi
    echo "HTTP ${status} verified"
    index=$((index + 1))
done
