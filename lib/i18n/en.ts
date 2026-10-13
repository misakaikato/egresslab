// English
const en: any = {
  meta: { title: "EgressLab · Claude IP Risk Check", desc: "See yourself the way Claude does: egress region, VPN/proxy/datacenter detection, exit consistency, WebRTC leaks and browser environment." },
  nav: { brand: "EgressLab", tag: "Claude egress risk check" },
  hero: {
    badge: "Self-hosted · your data stays on your machine",
    title: "What does Claude see when it sees you?",
    desc: "Check your network from Claude's perspective: whether the egress IP is in an officially supported region, whether it is a VPN/proxy/datacenter/WARP exit, whether Anthropic domains share the same exit, whether WebRTC leaks your real IP, and whether your browser environment carries mainland-China fingerprints.",
    privacy: "Environment signals are computed locally in your browser; intel queries only reach the public data sources listed below. Nothing is uploaded.",
    start: "Start scan",
    testing: "Scanning…",
    rescan: "Rescan",
    officialStatus: "Official status",
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
    { label: "Env var exposure", note: "Relay endpoint / proxy / timezone / language", cmd: "env | grep -iE 'anthropic|proxy|^TZ=|lang|lc_'" },
    { label: "DNS & hosts hijack", note: "Where split-routing configs hide", cmd: "grep -iE 'claude|anthropic' /etc/hosts; dig +short claude.ai; dig @1.1.1.1 +short claude.ai" },
    { label: "Local proxy processes", note: "CLIs often ignore system proxy and honor env vars only", cmd: "scutil --proxy; lsof -iTCP -sTCP:LISTEN -P -n 2>/dev/null | grep -iE 'clash|v2ray|sing|xray|ss-|surge' || true" },
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

en.path.exitsCount = "exits";
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
  title: "Browser fingerprint", hash: "Fingerprint ID", entropy: "Est. entropy", bits: "bits", factors: "factors", more: "more in expert view",
  unavailableNote: "Unavailable factors (browser hardening or extensions)",
  local: "All factors computed locally; the hash is never uploaded. Identical fingerprints enable cross-site linking — isolate fingerprints per environment.",
  pending: "Pending",
  keys: { canvas: "Canvas render", webgl: "WebGL renderer", webgl2: "WebGL2 extensions", audio: "Audio render", audioDetail: "Audio device", fonts: "Detectable fonts", fontWidths: "Font widths", screen: "Screen", geometry: "Window geometry", hardware: "Hardware", timezone: "Timezone", language: "Language", platform: "Platform", codecs: "Codec matrix", voices: "Voice list", uach: "UA-CH entropy", emoji: "Emoji render", keyboard: "Keyboard layout", display: "Display caps", intl: "Intl behavior", webgpu: "WebGPU", storage: "Storage quota", mediaDevices: "Media devices", connection: "Connection", timing: "Timing precision" },
  lies: { title: "Spoofing checks", none: "Factors corroborate each other; no spoofing found",
    keys: { platformFonts: "Platform/font mismatch", emojiPlatform: "Emoji/platform mismatch", webglMismatch: "WebGL1 vs WebGL2 differ", platformClaim: "Platform claims differ", tzSpoof: "Timezone spoofed", langSpoof: "Language spoofed", timingReduced: "Timing reduced (anti-fingerprint)" } },
};
