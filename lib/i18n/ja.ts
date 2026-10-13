// 日本語
const ja: any = {
  meta: { title: "EgressLab · Claude IP リスクチェック", desc: "Claude から見たあなたのネットワークを検査:出口地域、VPN/プロキシ/データセンター判定、出口一致性、WebRTC リーク、ブラウザ環境。" },
  nav: { brand: "EgressLab", tag: "Claude 出口リスク検査" },
  hero: {
    badge: "セルフホスト · データはローカルから出ません",
    title: "Claude が見ている「あなた」とは?",
    desc: "Claude の視点でネットワークを検査:出口 IP が公式サポート地域か、VPN/プロキシ/データセンター/WARP 出口か、Anthropic 各ドメインが同じ出口か、WebRTC で実 IP が漏れているか、ブラウザ環境に中国大陸の特徴があるか。",
    privacy: "環境特徴はすべてブラウザ内でローカル計算。情報照会は下記の公開データソースのみ。検査結果は送信されません。",
    start: "検査開始",
    testing: "検査中…",
    rescan: "再検査",
    officialStatus: "公式ステータス",
    officialUnknown: "不明",
  },
  steps: { intel: "IP 情報", path: "出口経路", reach: "到達性", leakEnv: "リークと環境" },
  score: {
    title: "環境スコア",
    hint: "100 点満点 · 高いほど安全",
    levels: { low: "低リスク", watch: "要注意", high: "高リスク", severe: "重大", blocked: "地域制限", unreachable: "接続不可" },
    coverage: "測定率 {n}%",
    gates: {
      unsupported: "出口地域が Anthropic 公式サポート対象外 — 登録と利用が制限されます",
      unreachable: "claude.ai に到達できません — まず接続性を確認してください",
      geoConflict: "Cloudflare と情報 DB の地域判定が矛盾しています",
    },
    region: "出口地域",
    supported: { yes: "サポート対象", no: "対象外" },
  },
  dims: {
    network: { t: "回線タイプ", d: "住宅/モバイルが最良。データセンター・WARP・VPN・プロキシの順に減点" },
    exposure: { t: "実 IP 露出", d: "WebRTC で露出した公網 IP と Claude 出口の一致" },
    reputation: { t: "IP 評判", d: "不正利用通報とブラックリスト記録" },
    consistency: { t: "出口一致性", d: "Anthropic 3 ドメイン・デュアルスタック・geo 判定の一致" },
    browser: { t: "ブラウザ環境", d: "タイムゾーンと IP 地域の矛盾、中国大陸特徴" },
    automation: { t: "自動化と Cookie", d: "自動化ブラウザや Cookie 無効は CAPTCHA ループを誘発" },
  },
};
export default ja;
ja.dimCodes = {
  tor: "Tor 出口", resproxy: "住宅プロキシ", vpn: "VPN", warp: "WARP", datacenter: "データセンター",
  icloudRelay: "iCloud プライベートリレー", business: "法人回線", residential: "住宅/モバイル", unknownType: "不明",
  leakVsClaude: "Claude 外 IP が露出", match: "出口と一致", otherFamily: "別ファミリ", noCandidate: "候補なし", localOnly: "ローカルのみ", unsupported: "測定不可",
  clean: "記録クリーン", flagged: "通報記録あり", domainsSame: "同一出口", domainsSplit: "出口不一致",
  geoAgree: "geo 一致", geoDisagree: "geo 矛盾", familySame: "同国", familySplit: "別国",
  tzMatch: "TZ 一致", tzSameOffset: "TZ 差小", tzMismatch: "TZ 矛盾", cnLow: "中国特徴 低", cnHigh: "中国特徴 高",
  webdriver: "自動化検出", cookieOff: "Cookie 無効", ok: "正常", pending: "待機",
};
ja.path = {
  title: "出口経路", browserV4: "ブラウザ IPv4", browserV6: "ブラウザ IPv6", direct: "直接出口", anthropic: "Anthropic 出口",
  ipGeo: "geo 照合", family: "IPv4 / IPv6", webrtc: "WebRTC", timezone: "TZ ↔ IP", route: "Claude ルーティング",
  pending: "待機", none: "なし", same: "一致", diff: "不一致", via: "経由", only4: "IPv4 のみ", only6: "IPv6 のみ",
};
ja.probes = {
  title: "Anthropic 到達性", web: "claude.ai ウェブ", api: "api.anthropic.com · API/Code", console: "platform.claude.com コンソール",
  latency: "遅延", colo: "コロ", warpOn: "WARP オン", warpOff: "WARP オフ", reachable: "到達可", unreachable: "到達不可", pending: "待機",
};
ja.env = {
  title: "中国大陸環境特徴", desc: "7 信号の加重推定(タイムゾーン/言語/フォント/ベンダーフォント/中国製ブラウザ/中国製デバイス/Intl)。すべてローカル計算。",
  scoreLabel: "特徴スコア", level: { high: "高", medium: "中", low: "低" },
  signals: { timezone: "システム TZ", language: "言語", fonts: "中国語フォント", vendorFonts: "ベンダーフォント", cnBrowser: "中国製ブラウザ", deviceVendor: "中国製デバイス", locale: "Intl ロケール" },
  detected: "検出", notDetected: "クリーン", privacy: "送信されません。",
};
ja.auto = { title: "自動化と Cookie", webdriver: "webdriver", cookie: "Cookie", on: "オン", off: "オフ", ok: "正常", warn: "要注意" };
ja.rep = {
  title: "履歴レピュテーション(自前)", desc: "ローカル SQLite に照会履歴とフィードバックを記録。使うほど賢くなります。",
  firstSeen: "初回照会", lastSeen: "最終照会", checks: "照会回数", lastScore: "前回スコア", none: "この IP のローカル記録はまだありません",
  feedbackTitle: "フィードバック", feedbackPlaceholder: "例:登録でBAN / 普通に使えている…", submit: "送信", thanks: "記録しました",
};
ja.cli = {
  title: "ターミナル確認", desc: "Claude Code 動作マシンはウェブから読めません。以下 6 項をターミナルで確認:",
  items: [
    { label: "出口 IP / 地域 / WARP", note: "Anthropic が実際に見る出口", cmd: "curl -s https://api.anthropic.com/cdn-cgi/trace | grep -E '^(ip|loc|warp|colo)='" },
    { label: "デュアルスタック分流", note: "v4/v6 出口の不一致はリーク", cmd: "curl -4 -s https://api.anthropic.com/cdn-cgi/trace | grep '^ip=' && curl -6 -s https://api.anthropic.com/cdn-cgi/trace | grep '^ip='" },
    { label: "システムタイムゾーン", note: "Claude Code が読み取る項目;TZ 変数で上書き可", cmd: "date +%Z%z; readlink /etc/localtime; env | grep '^TZ='" },
    { label: "環境変数の漏洩面", note: "中継エンドポイント / プロキシ / TZ / 言語", cmd: "env | grep -iE 'anthropic|proxy|^TZ=|lang|lc_'" },
    { label: "DNS と hosts 乗っ取り", note: "分流設定の隠れ場所", cmd: "grep -iE 'claude|anthropic' /etc/hosts; dig +short claude.ai; dig @1.1.1.1 +short claude.ai" },
    { label: "ローカルプロキシ", note: "CLI はシステムプロキシを無視し env 変数のみ従うことが多い", cmd: "scutil --proxy; lsof -iTCP -sTCP:LISTEN -P -n 2>/dev/null | grep -iE 'clash|v2ray|sing|xray|ss-|surge' || true" },
  ],
  copy: "コピー", copied: "コピー済み",
};
ja.sources = { title: "データソース", geo: "geo/ネットワーク: ipwho.is · ip-api.com · rdap.org", risk: "リスク: Tor 出口リスト · DNSBL · ThreatFox · StopForumSpam · FireHOL · 任意 proxycheck / AbuseIPDB (env)", cache: "結果は 1 時間キャッシュ" };
ja.err = { intelFailed: "情報照会失敗 — レピュテーション次元はスキップ" };
ja.footer = { privacy: "環境特徴はローカル計算 · 結果は非送信", selfhost: "セルフホスト実装" };

ja.chain = {
  title: "Claude リスク管理チェーン(参考)",
  note: "出典:コミュニティ逆引きクライアント + ローカルキャプチャ + フロントエンド文字列抽出(3 層:実測/ OSS/静的)。全端点はセッションと client-sha ヘッダ必須。本ツールは呼ばない・参照用。",
  stages: [
    { src: "実測", name: "登録前", ep: "/api/signups/lookup · yoti/age-verification", check: "メール/電話事前チェック、Yoti 年齢認証", dim: "出口地域 + IP 評判(ネットワーク/評判次元)" },
    { src: "OSS", name: "ログイン/セッション", ep: "auth/mfa · session_reattest · trusted_devices", check: "SMS 因子、WebAuthn 再認証、信頼デバイス", dim: "TZ/言語矛盾(ブラウザ次元)" },
    { src: "実測", name: "KYC", ep: "organizations/{org}/kyc_status", check: "Persona KYC 状態機械(not_required→created→verified/denied)", dim: "出口一致性 + デバイス指紋" },
    { src: "静的", name: "決済", ep: "billing/gift/purchase_eligibility · overage/checkout", check: "購入資格、ギフトカード経路、アップグレード step-up", dim: "IP 評判 + 請求地域(評判次元)" },
    { src: "実測", name: "ランタイム", ep: "account/standing · banners · challenge_redirect", check: "BAN/制限状態、リスクバナー、CAPTCHA リダイレクト", dim: "自動化/Cookie(自動化次元)" },
  ],
  errorsTitle: "エラーコード逆引き",
  errors: [
    { code: "phone_verification_required", meaning: "アップグレード時に電話認証を要求", action: "先に本ページの検査を通してから再試行" },
    { code: "phone_number_temp_blocked", meaning: "電話番号が焼かれた(直近の濫用)", action: "番号変更;同一出口で繰り返すと IP 評判も汚染" },
    { code: "kyc_pending", meaning: "org レベル Persona KYC 保留中", action: "完了を待つ;期間は機能制限" },
    { code: "challenge_redirect ループ", meaning: "CAPTCHA 検証の無限ループ", action: "典型原因:自動化ブラウザ/Cookie 無効/DC IP(自動化+ネットワーク次元)" },
  ],
  deviceId: "ウェブの全リクエストは anthropic-device-id と client-sha/build ヘッダを携帯:デバイス ID は IP と独立だが、1 デバイスで複数アカウントを使うと関連付けられる——本ツールの IP/環境レイヤーと併せて。",
};

ja.score.gates.challenged = "Cloudflare エッジが claude.ai に CAPTCHA を表示——IP がエッジでマーク済み";
ja.dimCodes.swiftShader = "ソフトウェアレンダリング(ヘッドレス疑い)";
ja.dimCodes.platformSpoof = "プラットフォーム偽装の矛盾(フォント vs UA)";
ja.dimCodes.coloMatch = "コロと地域一致";
ja.dimCodes.coloMismatch = "コロと地域不一致";
ja.path.dns = "DNS 解決";
ja.path.dnsOk = "2 プロバイダとも正常";
ja.path.dnsPolluted = "範囲外応答(汚染/乗っ取り)";
ja.path.dnsPartial = "1 プロバイダのみ";
ja.path.dnsFailed = "測定不可";
ja.path.ptr = "PTR 一致性";
ja.path.ptrNone = "PTR なし";
ja.path.prefix = "プレフィックス年齢";
ja.path.prefixNew = "新生プレフィックス";
ja.path.neighbors = "隣接評判";
ja.path.safety = { title: "プラットフォーム予測", ai: "AI 登録", media: "ストリーミング", signup: "登録", safe: "可", caution: "注意", risk: "危険", note: "出口タイプと評判からの概算予測・公式データではない" };
ja.auto.spoof = "プラットフォーム偽装の矛盾";

ja.path.exitsCount = "出口";
ja.path.native = "ネイティブ性";
ja.path.nativeYes = "ネイティブ(登録国=位置)";
ja.path.nativeNo = "ブロードキャスト/外地";
ja.path.h24 = "24h 国切替";
ja.path.h7d = "7日間切替";
ja.path.trail = "国の軌跡";
ja.path.times = "回";
ja.export = { md: "MD 出力", json: "JSON 出力" };
ja.ai = { title: "AI サービス接続パック", desc: "主要 AI プラットフォームの到達性——全部緑なら出口は AI 業界全体でブラックリスト化されていません:", reachable: "到達可" };

ja.mode = { simple: "かんたん", pro: "詳細" };
ja.expand = { open: "詳細", close: "閉じる" };
ja.verdicts = {
  headline: {
    blocked: "出口地域は非対応・ノード変更が必要",
    unreachable: "claude.ai に接続不可・ネットワークを確認",
    challenged: "出口が Cloudflare にマーク済み・変更を推奨",
    low: "環境は正常・安心して利用可",
    watch: "おおむね正常・一部調整を推奨",
    high: "リスク高・下記指標に沿って調整を",
    severe: "高リスク多数・ネット環境の変更を",
  },
  nativeYes: "属地ネイティブ", nativeNo: "非ネイティブ",
  a: {
    unsupported: "地域非対応", unsupportedSub: "出口は {r}・Anthropic 公式対象外",
    unreachable: "claude.ai 到達不可", unreachableSub: "ウェブ接続失敗・先にネットワークを確認",
    challenged: "出口マーク済み", challengedSub: "Cloudflare が CAPTCHA を表示・変更を推奨",
    tor: "Tor 出口", torSub: "極めて高リスク・ログイン登録はほぼ拒否",
    resproxy: "住宅プロキシ", resproxySub: "プールアドレス・高リスク",
    vpn: "VPN 出口", vpnSub: "共有出口・追加認証が発生しやすい",
    warp: "Cloudflare WARP", warpSub: "WARP トラフィックは直接識別される",
    datacenter: "データセンター IP", datacenterSub: "登録・ログインで認証が出やすい",
    icloud: "iCloud プライベートリレー", icloudSub: "Apple 中継出口・中程度のリスク",
    business: "法人回線", businessSub: "一般的なオフィス回線・低リスク",
    residential: "住宅回線", residentialSub: "一般的な家庭回線・最も低リスク",
    unknown: "通常のネットワーク", unknownSub: "VPN・DC としてのフラグなし",
  },
  b: {
    leak: "WebRTC で実 IP が漏洩", leakSub: "出口と別のアドレスが露出・ブラウザで無効化を",
    dnsPolluted: "DNS 応答が異常", dnsPollutedSub: "範囲外の結果・汚染または乗っ取りの疑い",
    split: "ドメインで出口が不一致", splitSub: "claude.ai と API が別出口",
    family: "デュアルスタックが別国", familySub: "IPv4 と IPv6 の所属国が異なる",
    colo: "エッジ节点と属地不一致", coloSub: "接続地点と IP 登録地が異なる",
    geo: "位置判定が不一致", geoSub: "2 つのソースで国が異なる",
    multiExit: "複数の出口を検出", multiExitSub: " probe ごとに異なる公網 IP",
    clean: "出口一致・漏洩なし", cleanSub: "すべての入口が同じアドレスを確認",
    partial: "一部未測定", partialSub: "データ不足・詳細ビューで確認を",
  },
  c: {
    automation: "自動化を検出", automationSub: "ヘッドレスまたは偽装の兆候",
    cookie: "Cookie 無効", cookieSub: "CAPTCHA が発生しやすい",
    tz: "タイムゾーン不一致", tzSub: "TZ が実際の所在地を示している",
    cnHigh: "中国語環境の特徴が強い", cnHighSub: "TZ・言語などが中国語環境を指す",
    clean: "ブラウザ環境は正常", cleanSub: "自動化なし・TZ 一致",
    partial: "一部未測定", partialSub: "詳細ビューで確認を",
  },
  d: {
    flagged: "IP に濫用記録", flaggedSub: "ブラックリスト或いは通報記録あり",
    switched: "24 時間以内に国切替", switchedSub: "出口国の変動はリスク判定を引き起こす",
    neighbors: "同セグメントに BL 記録", neighborsSub: "隣接 IP がマーク・セグメント評価が低い",
    freshPrefix: "新しいプレフィックス", freshPrefixSub: "この出口範囲は最近宣告開始",
    aiBlocked: "複数 AI サービス到達不可", aiBlockedSub: "出口が関連サービスに制限されている可能性",
    clean: "記録はクリーン", cleanSub: "濫用記録なし・異常履歴なし",
    partial: "履歴データ不足", partialSub: "照会回数が少ない・利用で蓄積される",
  },
};
