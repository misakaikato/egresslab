// English
const en: any = {
  meta: { title: "ExitLens · Claude IP Risk Check", desc: "See yourself the way Claude does: egress region, VPN/proxy/datacenter detection, exit consistency, WebRTC leaks and browser environment." },
  nav: { brand: "ExitLens", tag: "Claude egress risk check" },
  hero: {
    badge: "Self-hosted · your data stays on your machine",
    title: "What does Claude see when it sees you?",
    desc: "Check your network from Claude's perspective: whether the egress IP is in an officially supported region, whether it is a VPN/proxy/datacenter/WARP exit, whether Anthropic domains share the same exit, whether WebRTC leaks your real IP, and whether your browser environment carries mainland-China fingerprints.",
    privacy: "Environment signals are computed locally in your browser; intel queries only reach the public data sources listed below. Nothing is uploaded.",
    start: "Start scan",
    testing: "Scanning…",
    rescan: "Rescan",
    officialStatus: "Claude service",
    officialUnknown: "Unknown",
  },
  steps: { intel: "IP intel", path: "Exit paths", reach: "Reachability", leakEnv: "Leaks & env" },
  score: {
    title: "Environment score",
    hint: "Out of 100 — higher is safer",
    levels: { low: "Low risk", watch: "Watch", high: "High risk", severe: "Severe", blocked: "Region blocked", unreachable: "Unreachable" },
    coverage: "{n}% measured",
    gates: {
      unsupported: "Egress region is not on Anthropic's supported list — signup and access are restricted",
      unreachable: "claude.ai is unreachable — fix connectivity first",
      geoConflict: "Cloudflare and intel DB disagree about your region",
    },
    region: "Egress region",
    supported: { yes: "Supported", no: "Unsupported" },
  },
  dims: {
    network: { t: "Network type", d: "Residential/mobile is safest; datacenter, WARP, VPN, proxy lose points in that order" },
    exposure: { t: "Real-IP exposure", d: "Whether WebRTC-exposed public IPs match the Claude exit" },
    reputation: { t: "IP reputation", d: "Abuse reports and blacklist records" },
    consistency: { t: "Exit consistency", d: "Same exit across Anthropic domains, dual-stack and geo lookups" },
    browser: { t: "Browser environment", d: "Timezone/IP mismatch and mainland-China signals" },
    automation: { t: "Automation & cookies", d: "Automation or disabled cookies trigger CAPTCHA loops" },
  },
};
export default en;
en.dimCodes = {
  tor: "Tor exit", resproxy: "Residential proxy", vpn: "VPN", warp: "WARP", datacenter: "Datacenter/cloud",
  icloudRelay: "iCloud Private Relay", business: "Business line", residential: "Residential/mobile", unknownType: "Unknown type",
  leakVsClaude: "Leaks non-Claude IP", match: "Matches exit", otherFamily: "Other family", noCandidate: "No candidates", localOnly: "Local only", unsupported: "Cannot test",
  clean: "Clean record", flagged: "Flagged", domainsSame: "Same exit", domainsSplit: "Split exits",
  geoAgree: "Geo agrees", geoDisagree: "Geo conflicts", familySame: "Same country", familySplit: "Countries differ",
  tzMatch: "TZ matches", tzSameOffset: "TZ offset close", tzMismatch: "TZ mismatch", cnLow: "Low CN signals", cnHigh: "High CN signals",
  webdriver: "Automation detected", cookieOff: "Cookies disabled", ok: "OK", pending: "Pending",
};
en.path = {
  title: "Exit paths", browserV4: "Browser IPv4", browserV6: "Browser IPv6", direct: "Direct egress", anthropic: "Anthropic exit",
  ipGeo: "Geo cross-check", family: "IPv4 / IPv6", webrtc: "WebRTC", timezone: "TZ ↔ IP", route: "Claude routing",
  pending: "Pending", none: "None", same: "Same", diff: "Differs", via: "via", only4: "IPv4 only", only6: "IPv6 only",
};
en.probes = {
  title: "Anthropic reachability", web: "claude.ai web", api: "api.anthropic.com · API/Code", console: "platform.claude.com console",
  latency: "Latency", colo: "Colo", warpOn: "WARP on", warpOff: "WARP off", reachable: "Reachable", unreachable: "Unreachable", pending: "Pending",
};
en.env = {
  title: "Mainland-CN signals", desc: "7 weighted signals (timezone/language/fonts/vendor fonts/CN browsers/CN devices/Intl locale), all computed locally.",
  scoreLabel: "Score", level: { high: "High", medium: "Medium", low: "Low" },
  signals: { timezone: "Timezone", language: "Languages", fonts: "CN fonts", vendorFonts: "Vendor fonts", cnBrowser: "CN browser", deviceVendor: "CN device", locale: "Intl locale" },
  detected: "hit", notDetected: "clear", privacy: "Never uploaded.",
};
en.auto = { title: "Automation & cookies", webdriver: "webdriver", cookie: "Cookies", on: "on", off: "off", ok: "Normal", warn: "Suspicious" };
en.rep = {
  title: "Reputation history (self-built)", desc: "Query history and your feedback in local SQLite — gets smarter with use.",
  firstSeen: "First seen", lastSeen: "Last seen", checks: "Checks", lastScore: "Last score", none: "No local record for this IP yet",
  feedbackTitle: "Feedback", feedbackPlaceholder: "e.g. signup banned / works fine…", submit: "Submit", thanks: "Recorded",
};
en.cli = {
  title: "Terminal checks", desc: "A web page can't read the machine running Claude Code — cover these 6 in your terminal:",
  items: [
    { label: "Exit IP / region / WARP", note: "What Anthropic actually sees", cmd: "curl -s https://api.anthropic.com/cdn-cgi/trace | grep -E '^(ip|loc|warp|colo)='" },
    { label: "Dual-stack split", note: "v4/v6 exit mismatch means a leak", cmd: "curl -4 -s https://api.anthropic.com/cdn-cgi/trace | grep '^ip=' && curl -6 -s https://api.anthropic.com/cdn-cgi/trace | grep '^ip='" },
    { label: "System timezone", note: "The one Claude Code reads; TZ env overrides it", cmd: "date +%Z%z; readlink /etc/localtime; env | grep '^TZ='" },
    { label: "Env var exposure", note: "Relay/proxy/TZ/language; the telemetry env block also reports arch/shell/terminal", cmd: "env | grep -iE 'anthropic|proxy|^TZ=|lang|lc_'; uname -m; echo $SHELL / $TERM_PROGRAM" },
    { label: "DNS & hosts hijack", note: "Where split-routing configs hide", cmd: "grep -iE 'claude|anthropic' /etc/hosts; dig +short claude.ai; dig @1.1.1.1 +short claude.ai" },
    { label: "Local proxy processes", note: "CLIs often ignore system proxy and honor env vars only", cmd: "scutil --proxy; lsof -iTCP -sTCP:LISTEN -P -n 2>/dev/null | grep -iE 'clash|v2ray|sing|xray|ss-|surge' || true" },
    { label: "Claude Code local footprint", note: "~/.claude persists (command log/snapshots/transcripts) regardless of telemetry switches; ID truncated to 8 chars", cmd: "jq '{userID: .userID[0:8], numStartups, oauth: (.oauthAccount != null)}' ~/.claude.json 2>/dev/null; ls ~/.claude/bash-commands.log ~/.claude/shell-snapshots 2>/dev/null; echo DISABLE_TELEMETRY=$DISABLE_TELEMETRY" },
  ],
  copy: "Copy", copied: "Copied",
};
en.sources = { title: "Data sources", geo: "Geo & network: ipwho.is · ip-api.com · rdap.org", risk: "Risk: Tor exit list · DNSBL (barracuda/sorbs) · ThreatFox · StopForumSpam · FireHOL · optional proxycheck / AbuseIPDB (env)", cache: "Results cached 1 hour" };
en.err = { intelFailed: "Intel query failed — reputation dimension skipped" };
en.footer = { privacy: "Environment signals stay local · results never uploaded", selfhost: "Self-hosted open implementation" };

en.chain = {
  title: "Claude risk-control chain (reference)",
  note: "Sources: community open-source clients + local captures + frontend chunk strings (tiers: observed/open-source/static). All endpoints require a session and client-sha headers; this tool never calls them — reference only.",
  stages: [
    { src: "observed", name: "Pre-signup", ep: "/api/signups/lookup · yoti/age-verification", check: "Email/phone pre-check, Yoti age verification", dim: "Egress region + IP reputation (Network/Reputation dims)" },
    { src: "OSS", name: "Login/session", ep: "auth/mfa · session_reattest · trusted_devices", check: "SMS factor, WebAuthn re-attestation, trusted devices", dim: "TZ/language mismatch (Browser dim)" },
    { src: "observed", name: "KYC", ep: "organizations/{org}/kyc_status", check: "Persona KYC state machine (not_required→created→verified/denied)", dim: "Exit consistency + device fingerprint" },
    { src: "static", name: "Billing", ep: "billing/gift/purchase_eligibility · overage/checkout", check: "Purchase eligibility, gift route, upgrade step-up", dim: "IP reputation + billing region (Reputation dim)" },
    { src: "observed", name: "Behavior telemetry", ep: "event_logging/v2 · rum", check: "Typing latency, paste-length buckets, api_repeated_paths (repeats = script signature), daily-visible-ms", dim: "Not testable here — use the UI, avoid raw API calls, keep a normal usage pattern" },
    { src: "observed", name: "Runtime", ep: "account/standing · banners · challenge_redirect", check: "Ban/restriction status, risk banners, CAPTCHA redirects", dim: "Automation/cookies (Automation dim)" },
  ],
  errorsTitle: "Error code lookup",
  errors: [
    { code: "phone_verification_required", meaning: "Phone verification demanded at upgrade/checkout", action: "Pass this page's checks first; see below if number flagged" },
    { code: "phone_number_temp_blocked", meaning: "Phone number burned (recent abuse)", action: "Use another number; repeated hits poison the IP too" },
    { code: "kyc_pending", meaning: "Org-level Persona KYC pending", action: "Wait; features limited meanwhile" },
    { code: "challenge_redirect loop", meaning: "Endless CAPTCHA redirects", action: "Typical causes: automation / cookies off / datacenter IP (Automation + Network dims)" },
  ],
  deviceId: "Every web request carries anthropic-device-id and client-sha/build headers: device ID is independent of IP, but reusing one device across accounts links them — pair this tool's IP/environment layer with device rotation for anti-association.",
};

en.score.gates.challenged = "Cloudflare edge is challenging claude.ai — your IP is flagged at the edge";
en.dimCodes.swiftShader = "Software rendering (likely headless)";
en.dimCodes.platformSpoof = "Platform spoof mismatch (fonts vs UA)";
en.dimCodes.coloMatch = "Colo matches region";
en.dimCodes.coloMismatch = "Colo/region mismatch";
en.path.dns = "DNS resolution";
en.path.dnsOk = "Both providers clean";
en.path.dnsPolluted = "Out-of-range answers (poisoned/hijacked)";
en.path.dnsPartial = "Only one provider reachable";
en.path.dnsFailed = "Cannot test";
en.path.ptr = "PTR consistency";
en.path.ptrNone = "No PTR";
en.path.prefix = "Prefix age";
en.path.prefixNew = "fresh prefix";
en.path.neighbors = "Neighbor reputation";
en.path.safety = { title: "Platform preview", ai: "AI signup", media: "Streaming", signup: "Register", safe: "ok", caution: "caution", risk: "risk", note: "Rough preview derived from exit type & reputation — not official data" };
en.auto.spoof = "Platform spoof mismatch";

en.path.netClass = "Net class";
en.path.native = "Native IP";
en.path.nativeYes = "Native (reg=geo)";
en.path.nativeNo = "Broadcast/foreign";
en.path.h24 = "Country switches 24h";
en.path.h7d = "7-day switches";
en.path.trail = "Country trail";
en.path.times = "";
en.export = { md: "Export MD", json: "Export JSON" };
en.ai = { title: "AI service pack", desc: "Reachability of major AI platforms — all green means the exit isn't blacklisted across the AI industry:", reachable: "reachable" };

en.mode = { simple: "Simple", pro: "Expert" };
en.expand = { open: "Details", close: "Collapse" };
en.verdicts = {
  headline: {
    blocked: "Egress region not supported — switch nodes",
    unreachable: "claude.ai unreachable — check your network",
    challenged: "Egress flagged by Cloudflare — consider changing",
    low: "Environment looks clean — safe to use",
    watch: "Mostly fine — a few items worth adjusting",
    high: "Elevated risk — adjust per the indicators below",
    severe: "Multiple high risks — change network environment",
  },
  nativeYes: "native", nativeNo: "non-native",
  a: {
    unsupported: "Region unsupported", unsupportedSub: "Exit in {r}, outside Anthropic's supported list",
    unreachable: "claude.ai unreachable", unreachableSub: "Web endpoint failed — fix connectivity first",
    challenged: "Egress flagged", challengedSub: "Cloudflare issues a challenge for this exit — switch it",
    tor: "Tor exit", torSub: "Very high risk; login and signup likely refused",
    resproxy: "Residential proxy", resproxySub: "Pooled address — high risk",
    vpn: "VPN exit", vpnSub: "Shared exit; extra verification more likely",
    warp: "Cloudflare WARP", warpSub: "Anthropic can identify WARP traffic directly",
    datacenter: "Datacenter IP", datacenterSub: "Signup and login more likely to hit verification",
    icloud: "iCloud Private Relay", icloudSub: "Apple relay exit; moderate risk",
    business: "Business line", businessSub: "Common office network; low risk",
    residential: "Residential exit", residentialSub: "Common home network; lowest risk",
    unknown: "Ordinary network", unknownSub: "Not flagged as VPN or datacenter",
  },
  b: {
    leak: "WebRTC leaks real IP", leakSub: "Exposed an address different from the exit — disable in browser",
    dnsPolluted: "DNS answers abnormal", dnsPollutedSub: "Out-of-range results indicate poisoning or hijack",
    split: "Domains exit differently", splitSub: "claude.ai and the API use different exits",
    family: "Dual-stack in different countries", familySub: "IPv4 and IPv6 belong to different countries",
    colo: "Edge node mismatch", coloSub: "Connection point differs from IP registration",
    geo: "Geo lookups disagree", geoSub: "Two sources returned different countries",
    multiExit: "Multiple exits found", multiExitSub: "Probes returned different public IPs",
    clean: "Consistent exit, no leaks", cleanSub: "All entry points see the same address",
    partial: "Some items untested", partialSub: "Insufficient data — see expert view",
  },
  c: {
    automation: "Automation detected", automationSub: "Browser shows headless or spoofing signs",
    cookie: "Cookies disabled", cookieSub: "More likely to trigger CAPTCHA",
    tz: "Timezone mismatch", tzSub: "Timezone reveals actual location",
    cnHigh: "Strong CN-locale signals", cnHighSub: "Timezone, language and more point to a Chinese environment",
    clean: "Browser environment normal", cleanSub: "No automation, timezone consistent",
    partial: "Some items untested", partialSub: "See expert view",
  },
  d: {
    flagged: "IP has abuse records", flaggedSub: "Listed on blacklists or reports",
    switched: "Country switched within 24h", switchedSub: "Exit country changes trigger risk checks",
    neighbors: "Blacklisted neighbors", neighborsSub: "Adjacent IPs flagged — poor subnet reputation",
    freshPrefix: "Fresh prefix", freshPrefixSub: "This exit range was announced recently",
    aiBlocked: "Multiple AI services unreachable", aiBlockedSub: "Exit may be restricted by these services",
    clean: "Clean record", cleanSub: "No abuse records or unusual history",
    partial: "Insufficient history", partialSub: "Few checks so far — records build up with use",
  },
};

en.history = { title: "Scan history", count: "{n} on this device", empty: "Complete two scans to see the trend", local: "Stored only in this browser (localStorage). Never uploaded." };
en.fp = {
  title: "Browser fingerprint", hash: "Fingerprint ID", entropy: "Est. entropy", bits: "bits", factors: "factors", more: "more in expert view", claudeMark: "Claude collects", claudeNote: "Per community observation of the claude.ai frontend beacon, factors marked C are within its collection surface",
  unavailableNote: "Unavailable factors (browser hardening or extensions)",
  local: "All factors computed locally; the hash is never uploaded. Identical fingerprints enable cross-site linking — isolate fingerprints per environment.",
  pending: "Pending",
  keys: { canvas: "Canvas render", webgl: "WebGL renderer", webgl2: "WebGL2 extensions", audio: "Audio render", audioDetail: "Audio device", fonts: "Detectable fonts", fontWidths: "Font widths", screen: "Screen", geometry: "Window geometry", hardware: "Hardware", timezone: "Timezone", language: "Language", platform: "Platform", codecs: "Codec matrix", voices: "Voice list", uach: "UA-CH entropy", emoji: "Emoji render", keyboard: "Keyboard layout", display: "Display caps", intl: "Intl behavior", webgpu: "WebGPU", storage: "Storage quota", mediaDevices: "Media devices", connection: "Connection", timing: "Timing precision", apiSurface: "API surface", permissions: "Permissions", refresh: "Refresh rate", topology: "Display topology", textMetrics: "Text metrics", scrollbar: "Scrollbar width", math: "Math engine", webcodecs: "HW codecs", wasm: "WASM features", sdp: "SDP structure", clockSkew: "Clock skew", headerOrder: "HTTP header order", incognito: "Incognito hint", privacySet: "Privacy settings" },
  lies: { title: "Spoofing checks", none: "Factors corroborate each other; no spoofing found",
    keys: { platformFonts: "Platform/font mismatch", emojiPlatform: "Emoji/platform mismatch", webglMismatch: "WebGL1 vs WebGL2 differ", platformClaim: "Platform claims differ", tzSpoof: "Timezone spoofed", langSpoof: "Language spoofed", timingReduced: "Timing reduced (anti-fingerprint)", fontsChannel: "Font channels disagree", clockSkew: "Clock skew abnormal" } },
};

en.statusLevels = { none: "All systems go", minor: "Minor outage", major: "Major outage", critical: "Critical", maintenance: "Maintenance", unknown: "Unknown" };

en.compStatus = { operational: "Operational", degraded_performance: "Degraded", partial_outage: "Partial outage", major_outage: "Major outage", maintenance: "Maintenance", offline: "Offline" };
en.compUpdated = "Updated {t}";

en.inference = {
  title: "Deep assessment", note: "Second-order conclusions derived from evidence chains (heuristic, not direct measurement). Confidence: high = multiple independent signals.",
  conf: { high: "high", medium: "med", low: "low" },
  globalVpn: { title: "Global VPN — all traffic via one overseas exit", sub: "CN echo endpoints also return the overseas IP: full-tunnel, not split" },
  splitProxy: { title: "Split proxy — only foreign traffic proxied", sub: "CN direct, Claude via overseas exit; rule mode may leak domains" },
  cnDirect: { title: "Mainland-CN direct exit reaching Claude", sub: "Claude exit is in CN — rare; mind regional restrictions" },
  abroad: { title: "Physically abroad (or highly consistent)", sub: "Timezone matches exit; CN endpoints share the same exit" },
  tzDisguise: { title: "In CN with timezone faked to match exit", sub: "CN endpoints differ from exit, but timezone matches exit — deliberate disguise" },
  warp: { title: "Cloudflare WARP in use", sub: "Anthropic can identify WARP traffic directly" },
  mullvad: { title: "Mullvad VPN exit", sub: "Official Mullvad server range" },
  icloud: { title: "iCloud Private Relay", sub: "Apple relay, region-based exits" },
  v6LeakCn: { title: "IPv6 leaking to mainland CN", sub: "Proxy covers IPv4 only; IPv6 exposes real location" },
  v6Leak: { title: "IPv6 uses a different exit", sub: "Dual-stack countries differ — wider correlation surface" },
  sniBlock: { title: "Likely SNI blocking (IP not banned)", sub: "Millisecond failure = reset signature; change SNI/path, not IP" },
  pool: { title: "Likely fresh proxy-pool IP", sub: "Recently announced prefix + flagged neighbors — pool just provisioned" },
  antidetect: { title: "Anti-detect browser environment", sub: "Multiple spoof contradictions + proxy exit (risk engines can derive this too)" },
  hardened: { title: "Privacy-hardened browser", sub: "Timing/canvas/fonts restricted — Brave, RFP or extensions" },
  rotation: { title: "High-frequency exit rotation", sub: "Multiple country switches in 7 days — pool rotation or ephemeral network" },
  ideal: { title: "Native residential setup — near optimal", sub: "Residential + native + old prefix + clean + no contradictions" },
  ev: {
    tz: "Timezone", ipTz: "IP timezone", cnEcho: "CN echo", claudeExit: "Claude exit", colo: "Colo",
    globalVpnNote: "All echo sources return the same IP", splitNote: "CN and global endpoints differ",
    orgMatch: "Org matches {v}", v6Note: "Dual-stack countries differ", fastFail: "failed in {ms}ms (reset signature)",
    dnsOk: "DNS resolves normally", checkOfficial: "Official status OK", prefix: "Prefix first seen", neighbors: "Neighbors flagged",
    dcFlag: "Flagged as datacenter", lies: "{n} spoof contradictions", timing: "Timing precision reduced", blocked: "Blocked factors",
    sw7: "{n} country switches in 7d", trail: "Trail", residential: "Residential/mobile ASN", native: "Registered=geo (native)",
    clean: "Abuse/blacklist clean", noLies: "No spoof contradictions",
  },
};

Object.assign(en.inference, {
  domainSplitGeo: { title: "Anthropic domains split across countries", sub: "Different exits in different countries — per-domain proxy groups" },
  claudeOnlyExit: { title: "Claude-dedicated exit", sub: "Anthropic traffic pinned to a different exit than everything else" },
  smartRouting: { title: "Destination-based routing", sub: "Probe sources return different IPs — traffic split by target" },
  relayApac: { title: "Relay topology: APAC entry, foreign-registered exit", sub: "Traffic enters CF via APAC while the IP is registered elsewhere — classic relay" },
  coloMismatch: { title: "Edge entry ≠ IP geography", sub: "CF entry point differs from IP registration — relay or anycast" },
  fastPath: { title: "Suspiciously fast path", sub: "CN timezone + foreign exit + very low latency — premium transit or physically near exit" },
  longChain: { title: "Likely multi-hop chain", sub: "Latency over 1.2s — multiple relays" },
  traceBlocked: { title: "trace selectively blocked", sub: "Host reachable but cdn-cgi/trace filtered — treat reachability as approximate" },
  apiOnlyChallenge: { title: "API endpoint flagged alone", sub: "api.anthropic.com challenged while web is fine — switch exit for API-key use" },
  webrtcOff: { title: "WebRTC disabled", sub: "No public candidates — hardened; leak surface eliminated" },
  dohSplit: { title: "DoH provider blocked", sub: "Only some encrypted-DNS providers reachable — rule set doesn't cover them" },
  dnsMitm: { title: "DNS answers hijacked", sub: "DoH results out of range — MITM or transparent proxy forging answers" },
  cloudExit: { title: "Cloud-provider exit", sub: "ISP/ASN matches a cloud vendor — datacenter confirmed" },
  ptrProxy: { title: "PTR shows proxy naming", sub: "Reverse DNS contains vpn/proxy/tunnel keywords" },
  hijackedHome: { title: "Likely conscripted home IP", sub: "Residential ASN with abuse records — residential-proxy node" },
  fpRotating: { title: "Fingerprint + exit both rotating", sub: "Antidetect browser + proxy pool — high association risk" },
  fpDrift: { title: "Fingerprint drifted", sub: "Hash changed between scans — rotation config or browser update" },
  fpStableExitRotate: { title: "Stable fingerprint + rotating exits", sub: "Same browser, different exits — engines can cluster by fingerprint" },
  trendUp: { title: "Score trending up", sub: "Recent adjustments are working" },
  trendDown: { title: "Score trending down", sub: "Environment degrading — diff your recent changes" },
  stickyExit: { title: "Sticky exit", sub: "Same exit for 48h+ — fixed-IP setup, good for account stability" },
  redial: { title: "Same-country IP change (redial)", sub: "New IP, same country — normal PPPoE/mobile behavior, not pool rotation" },
  mobileEnv: { title: "Mobile network environment", sub: "Device and ASN both mobile — cellular exits are naturally stable" },
  headlessFarm: { title: "Likely headless farm", sub: "Low entropy + many unavailable factors + spoof signs — batch automation" },
});
en.inference.ev = { ...en.inference.ev,
  echo: "Echo sources", regGeo: "IP geo", latency: "Latency", claudeOnlyNote: "Other traffic uses a different exit",
  coloNote: "colo = where traffic actually enters CF", fastNote: "CN→US/EU direct is usually >150ms",
  chainNote: "Hops add latency", fallbackOk: "Host reachable (favicon)", traceBlockedNote: "cdn-cgi/trace request filtered",
  apiChallengeNote: "API and web can have independent policies", webrtcNoCandidate: "STUN yielded no public candidates",
  dohReachable: "Reachable DoH", dohNote: "Uncovered domains go direct", outOfRange: "Out-of-range answers",
  dnsMitmNote: "Real DoH answers stay in authoritative ranges", org: "ISP/ASN", cloudNote: "Cloud keyword matched",
  ptrNote: "PTR contains \"{kw}\"", hijackNote: "Common in conscripted residential networks",
  fpChanged: "Fingerprint hash changed between scans", fpDriftNote: "Browser updates also change it",
  fpStable: "Fingerprint stable", stableRotateNote: "Rotate fingerprint and exit together", scores: "Last four scores",
  sameExit48: "48h exit", stickyNote: "Fixed exits help account aging", redialNote: "PPPoE redial / cell handover",
  uaMobile: "UA is a mobile device", unavailable: "Unavailable factors", entropy: "Est. entropy",
};
en.inference.coherence = {
  title: "Cross-layer coherence {ok}/{n}", subOk: "Layers tell one story — your profile is credible to risk engines", subBad: "Cross-layer contradictions — fix per evidence",
  allOk: "Timezone/fingerprint/DNS/exits/colo corroborate each other",
  items: { tzGeo: "Timezone (CN) vs IP geo conflict", spoof: "{n} spoof contradictions", dns: "DNS answers abnormal", domainSplit: "Domain exits inconsistent", family: "Dual-stack countries differ", multiExit: "Multiple exits coexist", colo: "Entry point ≠ geography" },
};

en.account = {
  title: "Account check (manual consent)",
  consent: "Everything here requires your explicit action: keys and account data stay in this page's memory, go directly to Anthropic, never through this server. Nothing is stored or logged.",
  key: {
    title: "A · API Key check",
    run: "Check", valid: "valid", invalidShort: "error",
    ok: "Key valid; org can access {n} models",
    invalid: "Key invalid (authentication failed)",
    blocked: "Forbidden (403) — region block or insufficient permission",
    ratelimit: "Rate limited (429) — heavy usage or throttled",
    other: "HTTP {s} — consult Anthropic docs",
    network: "Request failed (exit cannot reach api.anthropic.com?)",
    privacy: "Prefer a restricted key; the field is password-masked and cleared after the check.",
  },
  login: {
    title: "B · Logged-in capture (claude.ai)",
    steps: "Open claude.ai → F12 → Console → paste and run the snippet → output is copied automatically → paste it back here. The snippet is fully transparent: reads only org/KYC/standing/device ID, sends nothing off-site.",
    copy: "Copy snippet", copied: "Copied", pasteHere: "Paste console output (JSON) here…",
    parse: "Parse", org: "Orgs", kyc: "KYC status", device: "Device ID (truncated)", gates: "Feature gates", standing: "Standing",
  },
};

en.statusSource = "Source: status.anthropic.com (Anthropic official) · 5 min cache · unrelated to this site";

en.account.login.email = "Email (masked)";
en.account.login.displayName = "Display name";
en.account.login.trial = "Trial";
en.account.login.trustedDevices = "Trusted devices";
en.account.login.members = "Members";
en.account.login.convs = "Conversations";
en.account.login.anonId = "Anonymous ID (truncated)";
en.account.login.banners = "Official banners";
en.account.login.statuses = "Endpoint statuses";
en.account.login.steps = "Open claude.ai → F12 → Console → paste & run → output copied → paste back here. Metadata only: org/account/KYC/trial/trusted devices/member & conversation counts/banners/device ID. Email masked; no conversation content is read.";

en.testingDone = "Scan complete";

Object.assign(en.inference, {
  patchworkEnv: { title: "Incomplete environment patchwork", sub: "Language switched to English but timezone still CN — partial disguise stands out more" },
  lowShare: { title: "Low-sharing exit signs", sub: "Clean neighbors + clean record — dedicated or low-share exit" },
  selfHosted: { title: "Likely self-hosted server relay", sub: "Datacenter attributes but clean & native — own VPS, not a pool" },
  asnCollateral: { title: "Likely ASN-range collateral", sub: "Clean IP yet challenged — the whole range is flagged; change range, not IP" },
  webrtcProxyGap: { title: "Proxy doesn't cover WebRTC", sub: "Proxy on but WebRTC leaks the real IP — enable leak protection in the client" },
  incognitoMyth: { title: "Incognito adds nothing vs risk engines", sub: "It only isolates local storage; fingerprint and IP stay identical" },
  dohAllFail: { title: "All DoH failed (exit still reachable)", sub: "Browser DNS resolved via proxy, or DoH fully blocked — worth confirming" },
  sparseFonts: { title: "Unusually sparse font set", sub: "Too few detectable fonts — anti-fingerprint tooling or minimal system" },
  registerNo: { title: "Environment not fit for new signups", sub: "Hard blockers remain (region/challenge/DC+CN signals) — fix first" },
  registerOk: { title: "Environment ready for signups", sub: "Residential + high score + no contradictions — safe to register" },
});
en.inference.ev = { ...en.inference.ev,
  lang: "Language", patchNote: "Timezone and language point to different identities",
  neighbors0: "0 flagged neighbors", oldPrefix: "Prefix has history",
  asnCollateralNote: "Clean IPs get challenged when neighbors abused the range",
  webrtcLeak: "WebRTC exposed a non-exit address", proxyOn: "Flagged as proxy/VPN", webrtcFix: "Enable leak protection in the proxy client",
  incognitoNote: "Engines sample fingerprint & network layers, unrelated to window mode",
  dohAllNote: "Claude reachable means resolution works, just not via DoH",
  fontsCount: "Detectable fonts", sparseNote: "Normal desktops usually >25",
  gateOn: "Hard gate present", dcEnv: "DC exit plus CN environment signals", cnScore: "CN signal score", score: "Score",
};

en.advice = {
  title: "Action items", note: "Grouped by priority; 'keep' means you're doing it right — avoid frequent environment changes.",
  groups: { fix: "Fix now", improve: "Improve", keep: "Keep as is" },
  a: {
    gateRegion: { title: "Switch to an exit in a supported region", detail: "Current region is hard-blocked by Claude" },
    gateChallenge: { title: "Change exit IP (flagged at the edge)", detail: "Prefer a different range over another IP in the same range" },
    gateUnreachable: { title: "Fix claude.ai reachability first", detail: "Check official status to rule out a service-side outage" },
    preferResidential: { title: "Move to a residential/mobile exit", detail: "If datacenter is a must: native + old prefix + low-share range" },
    v6: { title: "Handle the IPv6 leak", detail: "Enable IPv6 in the proxy client or disable IPv6 system-wide" },
    webrtcGap: { title: "Enable WebRTC leak protection", detail: "Clash/sing-box have switches; or block WebRTC via extension" },
    dnsHijack: { title: "Investigate DNS hijacking", detail: "Check router DNS and local proxy config; use DoH through the proxy" },
    abandonExit: { title: "Abandon this exit", detail: "Fresh pool range or conscripted home IP — switch before touching accounts" },
    stopRotate: { title: "Stop exit rotation", detail: "Pin one exit; rotate fingerprint and exit together if you must" },
    sharedVpn: { title: "Use an ordinary residential exit daily", detail: "Shared VPN/WARP/Mullvad exits are easily flagged" },
    tz: { title: "Align system timezone with the exit", detail: "Set the exit city's timezone; on Claude Code machines also set TZ" },
    cnEnv: { title: "Reduce CN-environment signals", detail: "Drop zh-CN from languages, align timezone, check Intl locale" },
    cookie: { title: "Allow cookies", detail: "Disabled cookies trigger CAPTCHA loops" },
    automation: { title: "Operate manually in a normal browser", detail: "Automation signals are high-risk for account actions" },
    coherence: { title: "Fix profile contradictions layer by layer", detail: "Follow the coherence evidence list in deep assessment" },
    proxyForm: { title: "Confirm proxy topology matches intent", detail: "Keep the exit constant within account sessions" },
    alignIdentity: { title: "Complete or drop the disguise", detail: "Language and timezone pointing at different identities is the loudest tell" },
    unifyDomains: { title: "Put all three Anthropic domains in one proxy group", detail: "Inconsistent exits get correlated at session level" },
    confirmIntent: { title: "Confirm multi-exit is intentional", detail: "Exits must stay constant during account operations" },
    coverDoh: { title: "Add DoH domains to routing rules", detail: "dns.google / cloudflare-dns.com should go through the proxy" },
    changeRange: { title: "Change the range, not the IP", detail: "Flagged neighbors poison the whole subnet" },
    waitMature: { title: "Let fresh prefixes mature before important use", detail: "Newly announced ranges often come from pool expansion" },
    rangeNotIp: { title: "When challenged, change range not IP", detail: "Clean IPs get challenged via range collateral" },
    incognitoNo: { title: "Don't rely on incognito windows", detail: "They change neither fingerprint nor IP" },
    registerNo: { title: "Hold off on new signups", detail: "Clear the red/yellow items first — accounts registered from dirty environments carry the mark" },
    keepStable: { title: "Keep the exit stable", detail: "Fixed/low-share exits help account aging" },
    ready: { title: "Environment ready for normal use/signups", detail: "Keep the current setup; avoid stacking new disguise tools" },
  },
};
