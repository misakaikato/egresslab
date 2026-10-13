// SQLite(node:sqlite)初始化:自建信誉库 + 蜜罐 + 情报缓存
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "egresslab.db");

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (db) return db;
  mkdirSync(DATA_DIR, { recursive: true });
  db = new DatabaseSync(DB_PATH);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS rep_ip (
      ip TEXT PRIMARY KEY, first_seen INTEGER, last_seen INTEGER,
      check_count INTEGER DEFAULT 0, last_score INTEGER, last_result_json TEXT
    );
    CREATE TABLE IF NOT EXISTS rep_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT, ip TEXT, ts INTEGER,
      kind TEXT CHECK(kind IN('check','feedback','drift')), note TEXT, score INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_rep_events_ip ON rep_events(ip, ts);
    CREATE TABLE IF NOT EXISTS honeypot_hits (
      id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER, src_ip TEXT,
      sensor TEXT, proto TEXT, detail TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_hp_ip ON honeypot_hits(src_ip, ts);
    CREATE TABLE IF NOT EXISTS intel_cache (
      key TEXT PRIMARY KEY, ts INTEGER, ttl_ms INTEGER, json TEXT
    );
    CREATE TABLE IF NOT EXISTS ip2location_ranges (
      start_num INTEGER, end_num INTEGER, country_code TEXT,
      region_name TEXT, city_name TEXT, latitude REAL, longitude REAL, timezone TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_ip2l ON ip2location_ranges(start_num);
  `);
  return db;
}

export function dbTry<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch (e) {
    console.error("[db]", e);
    return fallback;
  }
}
