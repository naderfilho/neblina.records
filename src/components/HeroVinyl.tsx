"use client";

import Vinyl from "@/components/Vinyl";

// Disco do hero: mesmo componente interativo/mixável, com a logo Neblina.
export default function HeroVinyl() {
  return (
    <div className="relative aspect-square w-full max-w-[440px]">
      {/* glow */}
      <div
        className="absolute inset-0 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(255,157,46,0.22), transparent 62%)" }}
      />

      {/* disco interativo (arraste para mixar) */}
      <div id="hero-vinyl-disc" className="absolute inset-[8%]">
        <Vinyl
          config={{ color: "classic", label: "logo", border: "brand" }}
          interactive
          autoSpin
          noNeedle
          spinDuration={9}
          title="Neblina Records"
        />
      </div>

      {/* braço/agulha decorativo */}
      <svg
        viewBox="0 0 200 200"
        className="pointer-events-none absolute -right-2 -top-2 h-[62%] w-[62%] drop-shadow-xl"
        style={{ transform: "rotate(6deg)" }}
        aria-hidden
      >
        <defs>
          <linearGradient id="harm" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e9edf1" />
            <stop offset="1" stopColor="#5b6772" />
          </linearGradient>
        </defs>
        <circle cx="176" cy="24" r="13" fill="#ff9d2e" stroke="#2a2118" strokeWidth="2" />
        <line x1="176" y1="24" x2="78" y2="128" stroke="url(#harm)" strokeWidth="8" strokeLinecap="round" />
        <g transform="rotate(45 74 130)">
          <rect x="58" y="120" width="32" height="18" rx="4" fill="url(#harm)" stroke="#3a444e" />
        </g>
        <circle cx="76" cy="132" r="4.5" fill="#ff9d2e" />
      </svg>

    </div>
  );
}
