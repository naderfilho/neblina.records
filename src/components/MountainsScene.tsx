// Cena de montanhas na névoa inspirada na logo — usada como fundo da home.
export default function MountainsScene({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <svg
        className="h-full w-full"
        viewBox="0 0 1440 720"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0a1622" />
            <stop offset="0.55" stopColor="#0a1420" />
            <stop offset="1" stopColor="#06090e" />
          </linearGradient>
          <radialGradient id="sun" cx="50%" cy="52%" r="50%">
            <stop offset="0" stopColor="#ffd38a" />
            <stop offset="0.35" stopColor="#ff9d2e" />
            <stop offset="0.75" stopColor="#d1701a" stopOpacity="0.35" />
            <stop offset="1" stopColor="#d1701a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="m1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3aa9c4" />
            <stop offset="1" stopColor="#1f6f8a" />
          </linearGradient>
          <linearGradient id="m2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#255a7d" />
            <stop offset="1" stopColor="#1a3f5c" />
          </linearGradient>
          <linearGradient id="m3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#182f47" />
            <stop offset="1" stopColor="#0d1b2a" />
          </linearGradient>
        </defs>

        {/* céu */}
        <rect width="1440" height="720" fill="url(#sky)" />

        {/* sol âmbar */}
        <circle cx="720" cy="430" r="300" fill="url(#sun)" />
        <circle cx="720" cy="430" r="120" fill="#ff9d2e" opacity="0.9" />

        {/* névoa */}
        <rect y="360" width="1440" height="200" fill="#0a1622" opacity="0.35" />

        {/* montanhas de trás (teal) */}
        <path d="M0 470 L180 360 L340 445 L520 330 L700 440 L900 350 L1120 455 L1300 370 L1440 440 L1440 720 L0 720 Z" fill="url(#m1)" opacity="0.55" />
        {/* camada média */}
        <path d="M0 540 L220 420 L430 520 L640 410 L860 520 L1080 430 L1280 525 L1440 470 L1440 720 L0 720 Z" fill="url(#m2)" opacity="0.8" />
        {/* camada da frente (escura) */}
        <path d="M0 620 L260 500 L500 610 L760 490 L1000 600 L1240 505 L1440 590 L1440 720 L0 720 Z" fill="url(#m3)" />

        {/* brilho superior */}
        <rect width="1440" height="220" fill="url(#sky)" opacity="0.6" />
      </svg>

      {/* fade para o conteúdo */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(6,9,14,0.35) 0%, rgba(6,9,14,0.15) 40%, rgba(6,9,14,0.85) 88%, #06090e 100%)" }}
      />
    </div>
  );
}
