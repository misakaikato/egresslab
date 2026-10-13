// IP2Location DB11 CSV → SQLite 区间表导入
// 用法: node scripts/import-ip2location.mjs <IP2LOCATION-LITE-DB11.CSV>
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import path from "node:path";

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("usage: node import-ip2location.mjs <csv>");
  process.exit(1);
}

// CSV 行解析(处理引号转义)
function parseLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = false;
      } else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

const db = new DatabaseSync(path.join(process.cwd(), "data", "egresslab.db"));
db.exec("DELETE FROM ip2location_ranges");
const insert = db.prepare(
  "INSERT INTO ip2location_ranges(start_num,end_num,country_code,region_name,city_name,latitude,longitude,timezone) VALUES(?,?,?,?,?,?,?,?)"
);

const text = readFileSync(csvPath, "utf8");
const lines = text.split("\n").filter((l) => l.trim().startsWith('"'));
let n = 0;
db.exec("BEGIN");
for (const line of lines) {
  const c = parseLine(line);
  // DB11: ip_from, ip_to, country_code, country_name, region_name, city_name, lat, lon, zip, tz
  if (c.length < 11) continue;
  const from = Number(c[0]);
  const to = Number(c[1]);
  if (!Number.isFinite(from) || !Number.isFinite(to)) continue;
  insert.run(from, to, c[2] || "", c[4] || "", c[5] || "", Number(c[6]) || null, Number(c[7]) || null, c[9] || "");
  n++;
  if (n % 50000 === 0) console.log(`  ${n} rows...`);
}
db.exec("COMMIT");
console.log(`imported ${n} rows`);
