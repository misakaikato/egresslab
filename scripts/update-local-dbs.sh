#!/usr/bin/env bash
# 本地库统一更新脚本(cron 每周跑一次即可)
# 无需 key:ip2region / db-ip
# 需要 env:MAXMIND_ACCOUNT_ID+MAXMIND_LICENSE_KEY / IPINFO_TOKEN / IP2LOCATION_TOKEN(缺哪个跳哪个)
set -uo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)"
DB="$DIR/data/db"
mkdir -p "$DB"
MONTH="$(date +%Y-%m)"

echo "== ip2region(随 npm 分发,如需更新执行: npm update ip2region;亦可手动放 v2 格式 db 到 $DB/ip2region.db 覆盖)=="

echo "== db-ip city lite(无需 key)=="
curl -fsSLm 300 "https://download.db-ip.com/free/dbip-city-lite-${MONTH}.mmdb.gz" -o /tmp/dbip.mmdb.gz \
  && gunzip -f /tmp/dbip.mmdb.gz && mv /tmp/dbip.mmdb "$DB/dbip-city-lite.mmdb" \
  && echo "dbip ok: $(wc -c < "$DB/dbip-city-lite.mmdb") bytes" || echo "dbip FAILED"

if [[ -n "${MAXMIND_ACCOUNT_ID:-}" && -n "${MAXMIND_LICENSE_KEY:-}" ]]; then
  echo "== MaxMind GeoLite2(用 env key)=="
  for db in GeoLite2-City GeoLite2-ASN; do
    curl -fsSLm 600 -u "$MAXMIND_ACCOUNT_ID:$MAXMIND_LICENSE_KEY" \
      "https://download.maxmind.com/geoip/databases/${db}/download?suffix=tar.gz" -o /tmp/mm.tgz \
      && tar -xzf /tmp/mm.tgz -C /tmp && mmfile=$(find /tmp -name "*.mmdb" | head -1) \
      && mv "$mmfile" "$DB/${db}.mmdb" && echo "$db ok" || echo "$db FAILED(检查 key)"
    rm -rf /tmp/mm.tgz /tmp/GeoLite2*
  done
else
  echo "-- MaxMind 跳过(未配置 MAXMIND_ACCOUNT_ID / MAXMIND_LICENSE_KEY)"
fi

if [[ -n "${IPINFO_TOKEN:-}" ]]; then
  echo "== IPInfo lite(用 env token)=="
  for pair in "country.mmdb:ipinfo-country.mmdb" "privacy_detection.mmdb:ipinfo-privacy.mmdb"; do
    remote="${pair%%:*}"; local_name="${pair##*:}"
    curl -fsSLm 300 "https://ipinfo.io/data/free/${remote}?token=${IPINFO_TOKEN}" -o "$DB/${local_name}.tmp" \
      && mv "$DB/${local_name}.tmp" "$DB/${local_name}" && echo "ipinfo $remote ok" || { echo "ipinfo $remote FAILED"; rm -f "$DB/${local_name}.tmp"; }
  done
else
  echo "-- IPInfo 跳过(未配置 IPINFO_TOKEN)"
fi

if [[ -n "${IP2LOCATION_TOKEN:-}" ]]; then
  echo "== IP2Location DB11 LITE CSV(用 env token)=="
  curl -fsSLm 600 "https://www.ip2location.com/download/?token=${IP2LOCATION_TOKEN}&file=DB11LITECSV" -o /tmp/ip2l.zip \
    && unzip -o -j /tmp/ip2l.zip -d /tmp/ip2l '*.CSV' '*.csv' \
    && node "$DIR/scripts/import-ip2location.mjs" "$(find /tmp/ip2l -name '*.CSV' -o -name '*.csv' | head -1)" \
    && echo "ip2location ok" || echo "ip2location FAILED(检查 token)"
  rm -rf /tmp/ip2l.zip /tmp/ip2l
else
  echo "-- IP2Location 跳过(未配置 IP2LOCATION_TOKEN)"
fi

echo "== 完成。当前本地库:"
ls -lh "$DB" 2>/dev/null | tail -8
