#!/usr/bin/env bash
# 拉取 Tor 官方出口表到本地 data/lists/(api 优先读此文件)
# 建议 crontab:17 * * * * ~/Projects/egresslab/scripts/update-tor.sh
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$DIR/data/lists"
curl -fsS --max-time 30 https://check.torproject.org/torbulkexitlist -o "$DIR/data/lists/tor-exits.txt.tmp"
mv "$DIR/data/lists/tor-exits.txt.tmp" "$DIR/data/lists/tor-exits.txt"
wc -l "$DIR/data/lists/tor-exits.txt"
