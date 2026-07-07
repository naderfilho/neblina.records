"use client";

export default function HeroVinyl() {
  return (
    <div className="relative aspect-square w-full max-w-[440px]">
      {/* glow */}
      <div
        className="absolute inset-0 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(245,160,40,0.22), transparent 62%)" }}
      />

      {/* disco */}
      <div className="absolute inset-[8%] rounded-full vinyl-grooves spin-slow shadow-[0_40px_90px_-25px_rgba(0,0,0,0.9)]">
        <div className="absolute inset-0 rounded-full ring-1 ring-white/10" />
        <div className="absolute left-1/2 top-1/2 flex h-[42%] w-[42%] -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full bg-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Neblina Records" className="h-[82%] w-[82%] object-contain" />
        </div>
        <div className="absolute left-1/2 top-1/2 h-[4%] w-[4%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-black shadow-[inset_0_0_4px_rgba(255,255,255,.4)]" />
      </div>

      {/* braço/agulha decorativo */}
      <svg
        viewBox="0 0 200 200"
        className="absolute -right-2 -top-2 h-[62%] w-[62%] drop-shadow-xl"
        style={{ transform: "rotate(6deg)" }}
        aria-hidden
      >
        <defs>
          <linearGradient id="harm" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e9edf1" />
            <stop offset="1" stopColor="#5b6772" />
          </linearGradient>
        </defs>
        <circle cx="176" cy="24" r="13" fill="#f5a028" stroke="#2a2118" strokeWidth="2" />
        <line x1="176" y1="24" x2="78" y2="128" stroke="url(#harm)" strokeWidth="8" strokeLinecap="round" />
        <g transform="rotate(45 74 130)">
          <rect x="58" y="120" width="32" height="18" rx="4" fill="url(#harm)" stroke="#3a444e" />
        </g>
        <circle cx="76" cy="132" r="4.5" fill="#f5a028" />
      </svg>
    </div>
  );
}
