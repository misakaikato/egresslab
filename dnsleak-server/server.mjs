// ExitLens 真 DNS 泄漏观察者
// 职责:1) UDP 53 权威应答 leak 区内任意名(A=203.0.113.66),记录「谁来查的」
//      2) HTTP 查询日志 API(CORS 全开,供 ExitLens 前端调用)
// 部署:任意可开 UDP 53 的主机;CF 面板把 leak.exitlens.misakamikoto.top NS 指到本机
import dgram from "node:dgram";
import http from "node:http";
import { DatabaseSync } from "node:sqlite";
import { decode, encode } from "dns-packet";

const ZONE = (process.env.DNSLEAK_ZONE || "leak.exitlens.misakamikoto.top").toLowerCase().replace(/\.$/, "");
const HTTP_PORT = Number(process.env.HTTP_PORT || 8090);
const DB_PATH = process.env.DB_PATH || "./hits.db";
const ANSWER_A = process.env.ANSWER_A || "203.0.113.66";

const db = new DatabaseSync(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS hits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts INTEGER, token TEXT, name TEXT, src TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_token ON hits(token);
`);

const sock = dgram.createSocket("udp4");
sock.on("message", (buf, rinfo) => {
  try {
    const q = decode(buf);
    const name = String(q.questions?.[0]?.name || "").toLowerCase().replace(/\.$/, "");
    if (name.endsWith(ZONE)) {
      const token = name.split(".")[0].split("-")[0];
      try {
        db.prepare("INSERT INTO hits(ts,token,name,src) VALUES(?,?,?,?)").run(Date.now(), token, name, rinfo.address);
      } catch {}
    }
    const resp = encode({
      id: q.id,
      type: "response",
      flags: (q.flags || 0) | 0x8000, // QR
      questions: q.questions,
      answers: q.questions.map((qq) => ({ name: qq.name, type: "A", class: "IN", ttl: 60, data: ANSWER_A })),
    });
    sock.send(resp, rinfo.port, rinfo.address);
  } catch {}
});
sock.bind(53, () => console.log(`[dnsleak] authoritative for ${ZONE} on UDP 53`));

const json = (res, code, obj) => {
  res.writeHead(code, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET",
  });
  res.end(JSON.stringify(obj));
};

http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    if (url.pathname === "/healthz") return json(res, 200, { ok: true, zone: ZONE });
    const m = /^\/hits\/([a-z0-9]{4,16})$/.exec(url.pathname);
    if (!m) return json(res, 404, { ok: false });
    const token = m[1];
    const since = Number(url.searchParams.get("since") || 0);
    const rows = db.prepare("SELECT ts, name, src FROM hits WHERE token=? AND ts>? ORDER BY ts").all(token, since);
    const resolvers = [...new Set(rows.map((r) => r.src))];
    return json(res, 200, { ok: true, zone: ZONE, hits: rows.length, resolvers });
  })
  .listen(HTTP_PORT, () => console.log(`[dnsleak] log API on :${HTTP_PORT}`));
