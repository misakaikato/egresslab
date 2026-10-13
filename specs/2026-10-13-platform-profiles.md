# 规格:平台策略架构(Platform Profiles)——从单平台检测到多平台检测框架

## 背景与目标
现状是"Claude 检测器":探测层已模块化(trace/echo/webrtc/dns/fingerprint/intel/...),
但评分权重、门控、结论文案、知识卡均以 Claude 为中心硬编码。
目标:重构为「探测注册表 + 信号库 + 平台策略(Profile) + 通用引擎」四层架构,
使新增一个目标平台(OpenAI/TikTok/流媒体…)的成本从"改引擎"降为"写一份声明式策略文件",
同时保证:Claude 检测的行为与分数在迁移前后完全一致(回归基线)。

成功标准:同一份引擎与探测代码,加载不同 profile 得出各自平台口径的评分/结论/建议;
claude profile 的输出与重构前逐字段一致(由测试锁定)。

## 非目标
- 不做通用"任意网站检测器"(不做让终端用户自定义 profile 的 UI——profile 仍由开发者以代码文件提供)
- 不改变现有探测模块本身的行为/新增检测项(纯架构迁移,第一批不新增任何 probe)
- 不做账号系统/社区功能
- 第一批不做流媒体"解锁测试"探测(留作第二个真实 profile 验证模型时再评估)

## 假设
1. 六个评分维度(network/exposure/reputation/consistency/browser/automation)平台无关,
   平台差异只体现在:权重、门控集合、维度内阈值、结论文案、建议映射、知识卡。
2. profile 以 TypeScript 文件形式置于 `lib/profiles/`(类型约束+编译期校验,不做运行时 JSON 加载)。
3. UI 上现有的"平台预设"选择器(v0.6)升级为一等公民:profile 切换即整套口径切换,选择持久化。
4. 分数跨 profile 不可比:UI 评分旁始终标注 profile 名,导出(MD/JSON/分享)携带 profile 字段。
5. i18n 采用「通用短语库 + 平台覆盖层」合并(dict 深合并,平台层只覆盖差异键),避免文案三语×N 平台爆炸。

## 现状(迁移基线)
- lib/score.ts:WEIGHTS 常量 + 三门控(unsupported/unreachable/challenged)+ geoConflict,全 Claude 语义。
- lib/verdicts.ts / lib/advice.ts:文案键引用 dict,多数短语平台无关,少数(gates.unsupported、a.tor 等)含 Anthropic 语义。
- components/detector.tsx:run() 手工编排 probes(全并行),平台相关点仅 ANTHROPIC_HOSTS 与出口国判定。
- lib/inference.ts:44 条规则,其中约 8 条强平台绑定(sniBlock/relayApac 用 claude probe;mullvad/icloud 通用;apiOnlyChallenge 用 anthropic 域名)。
- lib/i18n/{zh,en,ja}.ts:单一 dict,platform 子键已有 4 平台要点文案(可复用为 profile 元数据雏形)。

## 设计

### 1. Probe Registry(lib/probes/registry.ts)
```ts
export interface ProbeDef {
  id: string;                       // "trace" | "echo" | "webrtc" | "dns" | ...
  provides: string[];               // 产出的信号键:"exits","webrtcIps","intel","fingerprint"...
  platformScoped?: boolean;         // true=行为随 profile 变(如 trace 的域名表、account 仅 claude)
  cost: "light" | "medium" | "heavy";
  run(ctx: ProbeContext): Promise<Partial<Signals>>;  // ctx 含 profile 注入的目标域名等参数
}
export const REGISTRY: ProbeDef[];  // 第一批 = 现有 10 个模块的原位注册
```
注册表只做声明与调度,不改变探测实现;detector.run() 改为按 profile.probes 遍历注册表拉起。

### 2. 信号库(Signals)
`lib/probes/signals.ts` 定义归一化事实类型(即现有各 state 的并集,类型化):
probes/traceList/direct/dual/webrtc/env/auto/dnsCheck/dnsLeak/fp/aiPack/intel/history/rep。
规则:信号只由 probe 写入,引擎与规则只读;序列化(本地持久化/导出/分享)以 Signals 为准。

### 3. Profile(lib/profiles/*.ts)
```ts
export interface PlatformProfile {
  id: "claude" | "openai" | "tiktok" | "streaming" | string;
  nameKey: string;                          // i18n 键
  targets: { web: string[]; api?: string[] }; // trace 域名表(platformScoped probe 的参数)
  probes: string[];                          // 启用的 probe id 子集(如 openai 不含 account)
  weights: Record<DimensionId, number>;      // 六维权重(和不必为 100,引擎归一)
  gates: GateDef[];                          // 见下
  regionGate?: { countries: Set<string> | null };  // null=无地区门控(tiktok 流媒体差异点)
  inferenceFilter?: string[];                // 排除不适用的推理规则 id(可选)
  i18nOverlay?: DeepPartial<Dict>;           // 文案覆盖层
}
export interface GateDef {
  id: string;                                // 展示与导出用标识
  when: (s: Signals, score: number) => boolean;
  action: { cap?: number; zero?: boolean };  // cap=封顶分;zero=清零
  labelKey: string;                          // i18n 键(提示文案)
}
```
第一批交付 claude(从现状参数反推)与 openai(同 CF 门控、无地区 KYC 语义差异标注)两个 profile;
tiktok/streaming 占位(权重表先给,文案覆盖层后补)。

### 4. 通用引擎改造(lib/score.ts)
- WEIGHTS → 参数注入;computeScore(signals, profile) 输出不变结构。
- 门控执行器:按 profile.gates 依序评估,首个命中者生效(action 应用 + gate id 记录),保持现三分支语义等价。
- 维度求值器不变(六维函数平台无关)。

### 5. 推理规则适用性(lib/inference.ts)
每条规则加 `platforms?: string[]`(缺省=全部适用);detector 按当前 profile 过滤。
强绑定规则标注:apiOnlyChallenge/sniBlock→[claude,openai](按 targets 泛化:改读 targets.web/api 命中,而非硬编码域名)。

### 6. i18n 覆盖层
dict(locale) 之后按 profile 深合并 overlay;覆盖层只允许覆盖既有键,禁止新增键(编译期约束为 DeepPartial)。

### 7. UI 变更
- 平台选择器升为一等:简明视图 headline 横幅内嵌 profile 徽标(如「Claude 口径 82」),专业视图选择器移至评分卡上方常驻;选择写 localStorage。
- 切换 profile:不重跑探测,仅重算 score/verdicts/conclusions/advice(信号不变,纯本地重算,秒切)。
- IP 查询页/scoring 页/分享页/导出快照均携带 profileId。

## 边界情况
- profile 引用的 probe 在本环境不可用(如 dnsleak 未部署)→ 信号缺省,维度 pending(现状行为,不变)
- 切换 profile 时 Signals 已持久化 → 恢复后默认按上次 profile 重算
- gates 空数组 → 无门控,纯加权(为 streaming 预留)
- 同一 probe 被 profile 声明但 platformScoped 且 profile 未提供 targets → 启动期 console.error 并跳过该 probe
- 导出/分享跨 profile 打开 → 页面按快照内 profileId 渲染,不使用打开者当前选择

## 实施步骤(每步独立可验证,顺序执行)
1. Profile 类型 + claude/openai 两份定义 + score.ts 参数化;测试:同输入下新旧评分逐字段一致(金测)
2. verdicts/advice 文案接入 overlay 合并;UI 平台徽标 + 切换重算;持久化带 profileId
3. detector.run() 改注册表驱动;probe 全并行语义与现状一致(耗时回归 ≤ 现状 +5%)
4. inference 规则 platform 标注 + 过滤;IP/scoring/分享页携带 profile;README 架构节更新

## 验收标准
1. `npx vitest run` 全绿,含新增金测:claude profile 下,20 组历史输入快照的 score/dimensions/gate 与 git 基线一致
2. 切换 openai profile 后:network 维度权重生效(如 30)、无 Anthropic 专属文案(全局 grep 'Anthropic' 在该 profile 渲染输出中为 0)、API/导出含 profileId
3. 简明/专业视图均显示当前 profile 徽标;切换不触发网络请求(DevTools Network 零新增)
4. 断网状态下切换 profile → 重算成功(纯本地)
5. `npx tsc --noEmit` 0 错误;`npm run build` 通过

## 明确禁止
- 禁止在迁移中修改任何探测模块的行为/阈值(回归基线优先)
- 禁止 profile 运行时从网络加载;禁止 UI 生成 profile
- 禁止删除或改写既有 i18n 通用键(只允许覆盖层)
- 禁止在覆盖层新增通用层不存在的键
