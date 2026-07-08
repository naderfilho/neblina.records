// Ícones em SVG (emoji de bandeira não renderiza no Windows).

export function BrazilFlag({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round((size * 20) / 28)} viewBox="0 0 28 20" aria-hidden className="inline-block rounded-[2px]">
      <rect width="28" height="20" fill="#009c3b" />
      <polygon points="14,2 26,10 14,18 2,10" fill="#ffdf00" />
      <circle cx="14" cy="10" r="4.2" fill="#002776" />
      <path d="M10 9.2 A5 5 0 0 1 18 9.2" fill="none" stroke="#fff" strokeWidth="0.9" />
    </svg>
  );
}

export function GlobeIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="inline-block">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}
