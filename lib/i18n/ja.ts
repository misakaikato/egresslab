// 日本語
const ja: any = {
  meta: { title: "ExitLens · Claude IP リスクチェック", desc: "Claude から見たあなたのネットワークを検査:出口地域、VPN/プロキシ/データセンター判定、出口一致性、WebRTC リーク、ブラウザ環境。" },
  nav: { brand: "ExitLens", tag: "Claude 出口リスク検査" },
  hero: {
    badge: "セルフホスト · データはローカルから出ません",
    title: "Claude が見ている「あなた」とは?",
    desc: "Claude の視点でネットワークを検査:出口 IP が公式サポート地域か、VPN/プロキシ/データセンター/WARP 出口か、Anthropic 各ドメインが同じ出口か、WebRTC で実 IP が漏れているか、ブラウザ環境に中国大陸の特徴があるか。",
    privacy: "環境特徴はすべてブラウザ内でローカル計算。情報照会は下記の公開データソースのみ。検査結果は送信されません。",
    start: "検査開始",
    testing: "検査中…",
    rescan: "再検査",
    officialStatus: "Claude 公式サービス",
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
    { label: "環境変数の漏洩面", note: "中継/プロキシ/TZ/言語;テレメトリ env ブロックは arch/shell/terminal も送信", cmd: "env | grep -iE 'anthropic|proxy|^TZ=|lang|lc_'; uname -m; echo $SHELL / $TERM_PROGRAM" },
    { label: "DNS と hosts 乗っ取り", note: "分流設定の隠れ場所", cmd: "grep -iE 'claude|anthropic' /etc/hosts; dig +short claude.ai; dig @1.1.1.1 +short claude.ai" },
    { label: "ローカルプロキシ", note: "CLI はシステムプロキシを無視し env 変数のみ従うことが多い", cmd: "scutil --proxy; lsof -iTCP -sTCP:LISTEN -P -n 2>/dev/null | grep -iE 'clash|v2ray|sing|xray|ss-|surge' || true" },
    { label: "Claude Code 端末露出面", note: "~/.claude の保存(コマンド履歴/スナップショット/ transcript)はテレメトリ設定の影響を受けない;ID は先頭 8 文字のみ", cmd: "jq '{userID: .userID[0:8], numStartups, oauth: (.oauthAccount != null)}' ~/.claude.json 2>/dev/null; ls ~/.claude/bash-commands.log ~/.claude/shell-snapshots 2>/dev/null; echo DISABLE_TELEMETRY=$DISABLE_TELEMETRY" },
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
    { src: "実測", name: "行動テレメトリ", ep: "event_logging/v2 · rum", check: "入力遅延・貼付長バケット・api_repeated_paths(重複=スクリプト特徴)・daily-visible-ms", dim: "本ページでは測定不可——UI を使い API 直叩きを避け通常の利用を" },
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

ja.path.netClass = "ネット分類";
ja.path.native = "ネイティブ性";
ja.path.nativeYes = "ネイティブ(登録国=位置)";
ja.path.nativeNo = "ブロードキャスト/外地";
ja.path.h24 = "24h 国切替";
ja.path.h7d = "7日間切替";
ja.path.trail = "国の軌跡";
ja.path.times = "回";
ja.export = { md: "MD コピー", json: "JSON コピー", copied: "コピー済み" };
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

ja.history = { title: "検査履歴", count: "この端末で {n} 回", empty: "2 回検査すると傾向が表示されます", local: "このブラウザのみに保存(localStorage)。送信されません。" };
ja.fp = {
  title: "ブラウザフィンガープリント", hash: "FP ID", entropy: "推定エントロピー", bits: "ビット", factors: "因子", more: "詳細ビューに残り", claudeMark: "Claude 収集面", claudeNote: "claude.ai フロントエンドビーコンの公開観測に基づく:C マークの因子はその収集範囲",
  unavailableNote: "利用不可の因子(ブラウザ強化・拡張機能)",
  local: "全因子ローカル計算・ハッシュ非送信。同一 FP は横断的な関連付けを可能にします——マルチアカウントでは環境ごとに分離を。",
  pending: "待機",
  keys: { canvas: "Canvas 描画", webgl: "WebGL レンダラー", webgl2: "WebGL2 拡張", audio: "オーディオ描画", audioDetail: "オーディオ機器", fonts: "検出フォント", fontWidths: "フォント幅", screen: "画面", geometry: "ウィンドウ寸法", hardware: "ハードウェア", timezone: "タイムゾーン", language: "言語", platform: "プラットフォーム", codecs: "コーデック行列", voices: "音声リスト", uach: "UA-CH 高エントロピー", emoji: "Emoji 描画", keyboard: "キーボード配列", display: "ディスプレイ能力", intl: "Intl 挙動", webgpu: "WebGPU", storage: "ストレージ割当", mediaDevices: "メディアデバイス", connection: "ネットワーク種別", timing: "タイミング精度", apiSurface: "API 存在面", permissions: "権限状態", refresh: "リフレッシュレート", topology: "ディスプレイ構成", textMetrics: "テキスト計測", scrollbar: "スクロールバー幅", math: "数値エンジン", webcodecs: "HW コーデック", wasm: "WASM 特性", sdp: "SDP 構造", clockSkew: "時計ずれ", headerOrder: "HTTP ヘッダ順", incognito: "シークレット兆候", privacySet: "プライバシー設定" },
  lies: { title: "偽装矛盾検出", none: "各因子が相互に整合・偽装の兆候なし",
    keys: { platformFonts: "プラットフォームとフォントの矛盾", emojiPlatform: "Emoji と端末の矛盾", webglMismatch: "WebGL1/2 不一致", platformClaim: "プラットフォーム主張の相違", tzSpoof: "TZ 偽装", langSpoof: "言語偽装", timingReduced: "計時精度低下(抗指紋措置)", clockSkew: "時計ずれ異常" } },
};

ja.statusLevels = { none: "全正常", minor: "軽微な障害", major: "部分的障害", critical: "重大障害", maintenance: "メンテナンス", unknown: "不明" };

ja.compStatus = { operational: "正常稼働", degraded_performance: "性能低下", partial_outage: "部分障害", major_outage: "重大障害", maintenance: "メンテナンス", offline: "オフライン" };
ja.compUpdated = "更新 {t}";

ja.inference = {
  title: "深層評估", note: "証拠チェーンから導いた二階結論(ヒューリスティック・直接測定ではない)。信頼度:高=複数の独立兆候。",
  conf: { high: "高", medium: "中", low: "低" },
  globalVpn: { title: "グローバル VPN——全トラフィックが同一海外出口", sub: "国内エコーも海外 IP:分流ではなく全トンネル" },
  splitProxy: { title: "分流プロキシ——海外トラフィックのみ", sub: "国内直結・Claude は海外出口;ルール漏れに注意" },
  cnDirect: { title: "中国本土直結で Claude に到達", sub: "出口が CN——稀。地域制限に注意" },
  abroad: { title: "実際に海外所在(高整合)", sub: "TZ と出口一致・国内端点も同一出口" },
  tzDisguise: { title: "国内所在で TZ を出口に偽装", sub: "国内端点≠出口 だが TZ=出口——意図的偽装" },
  warp: { title: "Cloudflare WARP 使用中", sub: "WARP トラフィックは直接識別される" },
  mullvad: { title: "Mullvad VPN 出口", sub: "公式サーバーレンジ" },
  icloud: { title: "iCloud プライベートリレー", sub: "Apple 中継・地域別出口" },
  v6LeakCn: { title: "IPv6 が国内に漏洩", sub: "プロキシは IPv4 のみ;IPv6 が実位置を露出" },
  v6Leak: { title: "IPv6 が別出口", sub: "デュアルスタックの国不一致——関連面が拡大" },
  sniBlock: { title: "SNI ブロックの疑い(IP は未封鎖)", sub: "ミリ秒失敗=リセット特徴;IP ではなく SNI/経路を" },
  pool: { title: "新規プロキシプール IP の疑い", sub: "新規プレフィックス+隣接ブラックリスト" },
  antidetect: { title: "抗指紋ブラウザ環境", sub: "複数の偽装矛盾+プロキシ出口(風控側も導出可能)" },
  hardened: { title: "プライバシー強化ブラウザ", sub: "計時/canvas/フォント制限——Brave・RFP・拡張" },
  rotation: { title: "出口の高頻度入れ替え", sub: "7 日で複数回国切替——プール輪替か一時的ネットワーク" },
  ideal: { title: "ネイティブ住宅環境——ほぼ最適", sub: "住宅+ネイティブ+旧プレフィックス+クリーン+矛盾なし" },
  ev: {
    tz: "TZ", ipTz: "IP TZ", cnEcho: "国内エコー", claudeExit: "Claude 出口", colo: "コロ",
    globalVpnNote: "全エコー源が同一 IP", splitNote: "国内と海外エンド点が異なる",
    orgMatch: "組織が {v} に一致", v6Note: "デュアルスタック国不一致", fastFail: "{ms}ms で失敗(リセット特徴)",
    dnsOk: "DNS 正常", checkOfficial: "公式ステータス正常", prefix: "プレフィックス初見", neighbors: "隣接 BL",
    dcFlag: "DC フラグ", lies: "偽装矛盾 {n} 件", timing: "計時精度低下", blocked: "ブロック因子",
    sw7: "7 日で {n} 回国切替", trail: "軌跡", residential: "住宅 ASN", native: "登録国=位置(ネイティブ)",
    clean: "濫用/BL クリーン", noLies: "偽装矛盾なし",
  },
};

Object.assign(ja.inference, {
  domainSplitGeo: { title: "Anthropic ドメインが国単位で分流", sub: "ドメインごとに出口国が異なる——複数プロキシグループ構成" },
  claudeOnlyExit: { title: "Claude 専用出口", sub: "Anthropic トラフィックのみ別出口に固定" },
  smartRouting: { title: "宛先別ルーティング", sub: "probe 源ごとに IP が異なる——宛先分流" },
  relayApac: { title: "中継構造:アジア太平洋入口+海外登録出口", sub: "CF 入口がアジア太平洋で IP 登録地が別——典型的中継" },
  coloMismatch: { title: "入口と IP 地理の不一致", sub: "CF 入口と登録国が不一致——中継/anycast 特徴" },
  fastPath: { title: "異常に良い回線品質", sub: "国内 TZ+海外出口+超低遅延——プレミアム回線か出口付近に実在" },
  longChain: { title: "多段プロキシの疑い", sub: "遅延 1.2 秒超——複数ホップ" },
  traceBlocked: { title: "trace が選択的ブロック", sub: "到達可能だが cdn-cgi/trace がフィルタ——結論は参考程度に" },
  apiOnlyChallenge: { title: "API 端点のみマーク", sub: "api.anthropic.com のみ挑戦——API Key 用途は出口変更を" },
  webrtcOff: { title: "WebRTC 無効化済み", sub: "公網候補なし——漏洩面は解消" },
  dohSplit: { title: "DoH プロバイダ遮断", sub: "一部のみ到達——分流ルールの未カバー" },
  dnsMitm: { title: "DNS 応答の乗っ取り", sub: "DoH 結果が範囲外——中間者/透過プロキシの偽造" },
  cloudExit: { title: "クラウド事業者出口", sub: "ISP/ASN がクラウドに一致——DC 確定" },
  ptrProxy: { title: "PTR にプロキシ特徴", sub: "逆引きに vpn/proxy/tunnel 等を含む" },
  hijackedHome: { title: "徴用された住宅 IP の疑い", sub: "住宅 ASN+濫用記録——住宅プロキシノード" },
  fpRotating: { title: "指紋と出口が同時輪替", sub: "抗指紋+プール——関連リスク高" },
  fpDrift: { title: "指紋ドリフト", sub: "ハッシュ変化——輪替設定か更新" },
  fpStableExitRotate: { title: "指紋固定+出口輪替", sub: "同一ブラウザで出口変更——指紋でクラスタ化可能" },
  trendUp: { title: "スコア上昇傾向", sub: "調整が効いている" },
  trendDown: { title: "スコア下降傾向", sub: "環境悪化——最近の変更を確認" },
  stickyExit: { title: "出口の粘着性", sub: "48 時間同一出口——固定 IP,アカウント安定に有利" },
  redial: { title: "同国 IP 変化(再ダイヤル)", sub: "IP 変化・国不変——PPPoE/モバイルの正常挙動" },
  mobileEnv: { title: "モバイルネット環境", sub: "端末と ASN がモバイル——セルラー出口は天然安定" },
  headlessFarm: { title: "ヘッドレス農場の疑い", sub: "低エントロピー+多数不可+偽装兆候——大量自動化" },
});
ja.inference.ev = { ...ja.inference.ev,
  echo: "エコー源", regGeo: "IP 地理", latency: "遅延", claudeOnlyNote: "他トラフィックは別出口",
  coloNote: "colo=CF 入口位置", fastNote: "国内→欧米直結は通常 >150ms",
  chainNote: "ホップが遅延を積む", fallbackOk: "到達可能(favicon)", traceBlockedNote: "cdn-cgi/trace がフィルタ",
  apiChallengeNote: "API と web は政策が独立しうる", webrtcNoCandidate: "STUN 公網候補なし",
  dohReachable: "到達可能な DoH", dohNote: "未カバー域名は直結", outOfRange: "範囲外応答",
  dnsMitmNote: "本来 DoH 応答は権威範囲内", org: "ISP/ASN", cloudNote: "クラウドキーワード一致",
  ptrNote: "PTR に「{kw}」", hijackNote: "徴用住宅網で常见",
  fpChanged: "指紋ハッシュ変化", fpDriftNote: "更新でも変化する",
  fpStable: "指紋安定", stableRotateNote: "指紋と出口は同時交換を", scores: "直近 4 スコア",
  sameExit48: "48h 出口", stickyNote: "固定出口は育成に有利", redialNote: "PPPoE/ハンドオーバ",
  uaMobile: "UA がモバイル", unavailable: "不可因子", entropy: "推定エントロピー",
};
ja.inference.coherence = {
  title: "層間整合性 {ok}/{n}", subOk: "各層が一貫——プロファイルに整合性", subBad: "層間矛盾あり——証拠に沿って修正を",
  allOk: "TZ/指紋/DNS/出口/コロが相互整合",
  items: { tzGeo: "TZ(国内)と IP 地理の矛盾", spoof: "偽装矛盾 {n} 件", dns: "DNS 応答異常", domainSplit: "ドメイン出口不一致", family: "双栈国不一致", multiExit: "複数出口併存", colo: "入口≠地理" },
};

ja.account = {
  title: "アカウント検査(手動同意)",
  consent: "ここでの操作はすべてあなたの明示的な実行が必要:キーとアカウントデータはこのページのメモリ内のみで処理され、Anthropic へ直接、当サーバー経由なし。保存・記録なし。",
  key: {
    title: "A · API Key 検査",
    run: "検査", valid: "有効", invalidShort: "異常",
    ok: "Key 有効・組織は {n} モデルにアクセス可",
    invalid: "Key 無効(認証失敗)",
    blocked: "拒否(403)——地域ブロックまたは権限不足",
    ratelimit: "レート制限(429)——高使用または制限中",
    other: "HTTP {s}——ドキュメント参照",
    network: "リクエスト失敗(出口が api.anthropic.com に届かない?)",
    privacy: "制限付き Key を推奨。入力欄はマスク表示、検査後に消去。",
  },
  login: {
    title: "B · ログイン状態取得(claude.ai)",
    steps: "claude.ai で F12 → Console にスニペットを貼り付け実行 → 出力は自動コピー → ここに貼り付け解析。スニペットは完全透明:org/KYC/状態/デバイス ID のみ読み取り、外部送信なし。",
    copy: "スニペットをコピー", copied: "コピー済み", pasteHere: "コンソール出力(JSON)をここに貼り付け…",
    parse: "解析", org: "組織", kyc: "KYC 状態", device: "デバイス ID( truncated)", gates: "機能ゲート", standing: "ステータス",
  },
};

ja.statusSource = "出典 status.anthropic.com(Anthropic 公式)· 5 分キャッシュ · 当サイトとは無関係";

ja.account.login.email = "メール(マスク)";
ja.account.login.displayName = "表示名";
ja.account.login.trial = "トライアル";
ja.account.login.trustedDevices = "信頼デバイス";
ja.account.login.members = "メンバー数";
ja.account.login.convs = "会話総数";
ja.account.login.anonId = "匿名 ID(切り詰め)";
ja.account.login.banners = "公式バナー";
ja.account.login.statuses = "各端点ステータス";
ja.account.login.steps = "claude.ai で F12 → Console に貼り付け実行 → 出力自動コピー → ここに貼り付け。メタデータのみ:org/アカウント/KYC/トライアル/信頼デバイス/メンバーと会話数/バナー/デバイス ID。メールはマスク、会話内容は読まない。";

ja.testingDone = "検査完了";

Object.assign(ja.inference, {
  patchworkEnv: { title: "不完全な環境パッチ", sub: "言語は英語だが TZ は国内——中途半端な偽装は目立つ" },
  lowShare: { title: "低共有出口の兆候", sub: "隣接クリーン+記録クリーン——専用/低共有出口" },
  selfHosted: { title: "自前サーバー中継の疑い(専用)", sub: "DC 属性だが清潔+ネイティブ——プールではなく自前 VPS" },
  asnCollateral: { title: "ASN 範囲の連坐の疑い", sub: "クリーンなのに挑戦——範囲全体がマーク,IP ではなく範囲を変える" },
  webrtcProxyGap: { title: "プロキシが WebRTC 未カバー", sub: "プロキシ稼働中に WebRTC が実 IP 漏洩——漏洩防止を有効化" },
  incognitoMyth: { title: "シークレットは風控に無効", sub: "ローカル分離のみ——指紋と IP は変わらない" },
  dohAllFail: { title: "DoH 全滅(出口は到達可)", sub: "DNS はプロキシ経由か DoH 全面遮断——確認を" },
  sparseFonts: { title: "フォント異常に少ない", sub: "検出数過少——抗指紋ツールか極小システム" },
  registerNo: { title: "新規登録に不適な環境", sub: "ハードブロック残存——先に修正を" },
  registerOk: { title: "登録可能な環境", sub: "住宅+高スコア+矛盾なし——登録に使用可" },
});
ja.inference.ev = { ...ja.inference.ev,
  lang: "言語", patchNote: "TZ と言語が別の身分を指す",
  neighbors0: "隣接 BL 0", oldPrefix: "プレフィックスに履歴",
  asnCollateralNote: "クリーン IP が挑戦されるのは範囲内濫用の連坐",
  webrtcLeak: "WebRTC が非出口アドレスを露出", proxyOn: "プロキシ/VPN フラグ", webrtcFix: "クライアントで漏洩防止を有効化",
  incognitoNote: "採集されるのは指紋とネットワーク層",
  dohAllNote: "Claude 到達可=解決経路はある(DoH 経由でないだけ)",
  fontsCount: "検出フォント", sparseNote: "通常デスクトップは >25",
  gateOn: "ハードゲートあり", dcEnv: "DC 出口+中国環境信号", cnScore: "中国特徴スコア", score: "スコア",
};

ja.advice = {
  title: "対応アドバイス", note: "優先度順。「維持」は現状が正しいという意味——頻繁な変更を避けて。",
  groups: { fix: "即時対応", improve: "改善推奨", keep: "現状維持" },
  a: {
    gateRegion: { title: "対応地域の出口へ変更", detail: "現出口は Claude に硬性制限" },
    gateChallenge: { title: "出口 IP を変更(エッジマーク済)", detail: "同段の IP ではなく別の範囲へ" },
    gateUnreachable: { title: "まず claude.ai 到達性を修復", detail: "公式ステータスでサーバー側故障を排除" },
    preferResidential: { title: "住宅/モバイル出口へ", detail: "DC 必須なら ネイティブ+旧プレフィックス+低共有" },
    v6: { title: "IPv6 漏洩に対処", detail: "プロキシで IPv6 有効化 or システムで無効化" },
    webrtcGap: { title: "WebRTC 漏洩防止を有効化", detail: "Clash/sing-box のスイッチ、または拡張でブロック" },
    dnsHijack: { title: "DNS 乗っ取りを調査", detail: "ルーター DNS とローカル設定を確認、プロキシ経由 DoH へ" },
    abandonExit: { title: "この出口を放棄", detail: "新規プール/徴用住宅——先に乗り換え" },
    stopRotate: { title: "出口輪替を停止", detail: "単一出口に固定;変えるなら指紋と同時" },
    sharedVpn: { title: "日常は通常の住宅出口を", detail: "共有 VPN/WARP/Mullvad は識別されやすい" },
    tz: { title: "システム TZ を出口に合わせる", detail: "出口都市の TZ へ;Claude Code 機は TZ 変数も" },
    cnEnv: { title: "中国環境特徴を低減", detail: "言語リストの zh-CN 削除・TZ 整合・Intl 確認" },
    cookie: { title: "Cookie を許可", detail: "無効化は CAPTCHA ループを誘発" },
    automation: { title: "通常ブラウザで手動操作へ", detail: "自動化兆候は高危険" },
    coherence: { title: "層ごとに矛盾を修復", detail: "深層評估の整合性証拠リストに従う" },
    proxyForm: { title: "プロキシ形態が意図通りか確認", detail: "アカウントセッション中は出口一定に" },
    alignIdentity: { title: "偽装を完成させるか止めるか", detail: "言語と TZ の不一致は最大の破綻" },
    unifyDomains: { title: "Anthropic 3 ドメインを同一グループへ", detail: "出口不一致はセッション層で関連付けられる" },
    confirmIntent: { title: "複数出口が意図的か確認", detail: "操作中の出口は一定を" },
    coverDoh: { title: "DoH ドメインをルールに追加", detail: "dns.google / cloudflare-dns.com をプロキシ経由に" },
    changeRange: { title: "IP ではなく範囲を変更", detail: "隣接 BL はサブネット全体を汚染" },
    waitMature: { title: "新規プレフィックスは成熟を待つ", detail: "直近宣告範囲はプール拡張が多い" },
    rangeNotIp: { title: "挑戦されたら IP でなく範囲を", detail: "クリーン IP の挑戦は範囲連坐" },
    incognitoNo: { title: "シークレットに頼らない", detail: "指紋も IP も変わらない" },
    registerNo: { title: "新規登録を保留", detail: "赤/黄項目を解消してから——汚い環境の登録は残る" },
    keepStable: { title: "出口の安定を維持", detail: "固定/低共有は育成に有利" },
    ready: { title: "環境ready、通常利用/登録可", detail: "現構成を維持、新ツールの重畳を避ける" },
  },
};

ja.path.dnsleak = "実 DNS 出口";
ja.path.dnsleakNone = "照会なし";
Object.assign(ja.inference, {
  dnsLeakCn: { title: "DNS が国内再帰(真の漏洩)", sub: "出口は海外なのにリゾルバが国内から——DNS がプロキシ外で実位置を露出" },
  dnsLeakForeign: { title: "DNS 再帰と出口国が不一致", sub: "解決経路と出口不一致——DNS 分流か漏洩" },
});


ja.netTypes = { isp: "住宅接入", mobile: "モバイル", hosting: "ホスティング/DC", transit: "バックボーン中継", cdn: "CDN/コンテンツ", business: "法人回線", education: "教育網", government: "政府網", unknown: "不明" };
ja.pdbTypes = { NSP: "ネットワーク事業者(中継)", ISP: "アクセス ISP", Content: "コンテンツ", "Cable/MSO": "ケーブル", Enterprise: "企業", "Educational/Research": "教育研究", "Non-Profit": "非営利", "Network Facility": "施設" };
ja.kycMap = { not_required: "不要", created: "開始", verified: "承認済", denied: "拒否", failed: "失敗", expired: "期限切れ", pending: "待機", unknown: "不明" };
ja.trialMap = { eligible: "対象", ineligible: "非対象", active: "進行中", active_trial: "トライアル中" };
ja.billingMap = { individual_consumption_v2: "個人", claude_pro: "Pro", consumer: "コンシューマ", team: "チーム", enterprise: "エンタープライズ" };

ja.account.kycMap = ja.kycMap;
ja.account.trialMap = ja.trialMap;
ja.account.billingMap = ja.billingMap;

ja.turnstile = { title: "Cloudflare Turnstile 信頼", desc: "Claude は CF 背後にあり——Turnstile を無感覚で通過できるかは CF の直接評価。", run: "検査実行", running: "検査中…", silent: "無感覚通過(高信頼)", interactive: "操作必要(要注意)", failed: "未通過", notConfigured: "TURNSTILE_SITEKEY 未設定:CF パネルで無料登録して env に設定すると有効化。" };
ja.speed = { title: "Cloudflare スピードテスト", desc: "公式 speed.cloudflare.com;全球遅延は出口 IP へのインバウンド視点。", runSpeed: "測定", runPing: "全球遅延", down: "下り", up: "上り", latency: "エッジ RTT", note: "1 回約 24MB 消費;インバウンド遅延は出口まで。" };
ja.headers = { title: "リクエストヘッダ(サーバー視点)", desc: "任意サイトが読めるヘッダ;順序はビルド級指紋。", expand: "展開", collapse: "折りたたみ", loading: "読込中…", order: "順序" };

ja.cardPage = { title: "署名カード", desc: "ホームページ・フォーラム署名・README に埋め込むと、訪問者は自分の IP とスコアを見られます。", refresh: "更新", theme: "テーマ", size: "幅", ipMode: { title: "表示 IP", visitor: "訪問者自身の IP", specified: "指定 IP" }, embed: "埋め込みコード", crawlerNote: "GitHub/Discord/Telegram はサーバー経由で画像を取得するため訪問者 IP 不可——プレースホルダー表示。それらの平台では「指定 IP」を。" };

ja.echoMatrix = { title: "出口マトリクス", desc: "7 サイトのエコーを出口 IP ごとに grouping、3 回サンプルの中央値遅延。", run: "実行", running: "探査中…", sites: "サイト" };
ja.recaptcha = { title: "reCAPTCHA v3 スコア", desc: "Google 行動スコア(1.0=完全信頼)。クリック時のみ読込。", run: "スコア実行", failed: "評価失敗(token 無効か secret 未設定)", privacy: "クリックで Google への行動データ送信に同意;RECAPTCHA_V3_SITEKEY/SECRET の 2 変数が必要。" };
ja.platform = { title: "プラットフォーム presets", names: { claude: "Claude", openai: "OpenAI", media: "ストリーミング", tiktok: "TikTok" }, notes: { claude: "地域ゲートと CF 信頼に注目;web と Code は同一档案", openai: "同じく CF 背後;DC 出口と登録 profile に注意", media: "解除は住宅・ネイティブ性次第", tiktok: "DC 許容度最低;登録時に地域固定——IP/TZ/言語の整合を" } };

ja.toolsBox = { title: "検査ツールボックス", desc: "手動ツール:スピードテスト / Turnstile / 出口マトリクス / ヘッダー" };

ja.speed.unreachable = "到達不可";
ja.speed.blockedNote = "測速端点が全滅:分流ルールで speed.cloudflare.com が直結になり破棄された場合が多い——プロキシルールに追加を";
ja.speed.pingFailed = "全球遅延失敗:Globalping 制限または出口到達不可。" ;
ja.restored = "前回の検査結果を復元({t})——再検査で更新";

ja.ipPage = { queryBtn: "IP 検索", unsupported: "地域非対応", intelTitle: "IP インテリ", asnHistory: "ルーティング履歴", now: "現在", queryFailed: "検索失敗:IP 無効かソース到達不可" };

ja.share = { btn: "共有リンク", copied: "リンク复制済", readonly: "読み取り専用", title: "ExitLens レポート" };

ja.scoringPage = { title: "スコアリング説明", intro: "総合スコアは 6 次元の加重平均(0-100・高いほど安全)。重みとゲートは本プロジェクトの独自設計。この訪問で露呈したネットワークとブラウザ環境を反映し、アカウント自体や公式判定ではない。", dimsTitle: "次元の重み", gatesTitle: "ハードゲート(加重より優先)", g1: "出口地域が Anthropic 対象外 → 0 点", g2: "claude.ai 到達不可 → 上限 30", g3: "CF エッジ挑戦 / 地域矛盾 → 上限 60 / 45", levelsTitle: "レベル閾値", coverageNote: "未測定次元は分母から除外。カバー 85% 未満は最高 watch。", srcTitle: "データソース" };
