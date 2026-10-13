// 自建历史信誉库:每次查询自动记录,支持用户反馈事件
import { getDb, dbTry } from "./db";

export function recordCheck(ip: string, score: number | null, resultJson: string) {
  dbTry(() => {
    const d = getDb();
    const now = Date.now();
    const row = d.prepare("SELECT check_count FROM rep_ip WHERE ip=?").get(ip) as { check_count: number } | undefined;
    if (row) {
      d.prepare("UPDATE rep_ip SET last_seen=?, check_count=check_count+1, last_score=?, last_result_json=? WHERE ip=?")
        .run(now, score, resultJson, ip);
    } else {
      d.prepare("INSERT INTO rep_ip(ip,first_seen,last_seen,check_count,last_score,last_result_json) VALUES(?,?,?,?,?,?)")
        .run(ip, now, now, 1, score, resultJson);
    }
    d.prepare("INSERT INTO rep_events(ip,ts,kind,note,score) VALUES(?,?,'check',NULL,?)").run(ip, now, score);
  }, undefined);
}

export interface ReputationRecord {
  ok: boolean;
  ip: string;
  known: boolean;
  first_seen: number | null;
  last_seen: number | null;
  check_count: number;
  last_score: number | null;
  feedback: { ts: number; note: string; score: number | null }[];
}

export function queryReputation(ip: string): ReputationRecord {
  const empty: ReputationRecord = { ok: true, ip, known: false, first_seen: null, last_seen: null, check_count: 0, last_score: null, feedback: [] };
  return dbTry(() => {
    const d = getDb();
    const row = d.prepare("SELECT * FROM rep_ip WHERE ip=?").get(ip) as any;
    const fb = (d.prepare("SELECT ts,note,score FROM rep_events WHERE ip=? AND kind='feedback' ORDER BY ts DESC LIMIT 10").all(ip) || []) as any[];
    if (!row) return empty;
    return {
      ok: true, ip, known: true,
      first_seen: row.first_seen, last_seen: row.last_seen,
      check_count: row.check_count ?? 0, last_score: row.last_score ?? null,
      feedback: fb.map((f) => ({ ts: f.ts, note: f.note || "", score: f.score ?? null })),
    };
  }, empty);
}

export function recordFeedback(ip: string, note: string) {
  dbTry(() => {
    getDb().prepare("INSERT INTO rep_events(ip,ts,kind,note,score) VALUES(?,?,'feedback',?,NULL)").run(ip, Date.now(), note);
  }, undefined);
}
