#!/usr/bin/env bash
set -Eeuo pipefail

if (($# == 0)); then
    echo "Usage: $0 <https://host/up> [https://host/] [https://host/wisata]" >&2
    exit 64
fi

for url in "$@"; do
    echo "Health check: ${url}"
    curl --fail --location --silent --show-error \
        --retry 3 --retry-all-errors --connect-timeout 10 --max-time 30 \
        --output /dev/null --write-out 'HTTP %{http_code}\n' "$url"
done
