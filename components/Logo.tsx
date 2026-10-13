// 站点 Logo:带缺口的边界 + 出口箭头(与 icon.svg 同源)
export default function Logo({ size = 22 }: { size?: number }) {
  const accent = "var(--accent)";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      <path
        d="M52 20 V26 M52 38 V44 A8 8 0 0 1 44 52 H20 A8 8 0 0 1 12 44 V20 A8 8 0 0 1 20 12 H44 A8 8 0 0 1 52 20"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="23" cy="32" r="4.5" fill={accent} />
      <path d="M30 32 H50" stroke={accent} strokeWidth="5" strokeLinecap="round" />
      <path d="M44 24.5 L55 32 L44 39.5" stroke={accent} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
