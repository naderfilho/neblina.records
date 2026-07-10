import { MapPin, Navigation, Clock } from "lucide-react";

const ADDRESS = "Rua Helena Coutinho, 25, Fundos - Braunes, Nova Friburgo - RJ";
const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent("Rua Helena Coutinho, 25, Braunes, Nova Friburgo, RJ");

/**
 * Mapa premium da loja física — não é um embed genérico de tiles, e sim uma
 * carta topográfica estilizada (Nova Friburgo é cidade de montanha), com curvas
 * de nível, ruas, rio e um pino âmbar pulsante marcando a loja.
 */
export default function StoreMap() {
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-panel">
      <div className="grid md:grid-cols-[1.35fr_1fr]">
        {/* mapa estilizado */}
        <div className="relative min-h-[300px] md:min-h-[380px]">
          <svg viewBox="0 0 800 520" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
            <defs>
              <linearGradient id="map-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#0a1622" />
                <stop offset="1" stopColor="#070d16" />
              </linearGradient>
              <radialGradient id="map-glow" cx="50%" cy="46%" r="42%">
                <stop offset="0" stopColor="#ff9d2e" stopOpacity="0.22" />
                <stop offset="0.6" stopColor="#26c0d4" stopOpacity="0.06" />
                <stop offset="1" stopColor="#26c0d4" stopOpacity="0" />
              </radialGradient>
            </defs>

            <rect width="800" height="520" fill="url(#map-sky)" />

            {/* malha sutil de blocos */}
            <g stroke="#26c0d4" strokeOpacity="0.06" strokeWidth="1">
              {Array.from({ length: 9 }).map((_, i) => (
                <line key={`v${i}`} x1={i * 100} y1="0" x2={i * 100} y2="520" />
              ))}
              {Array.from({ length: 6 }).map((_, i) => (
                <line key={`h${i}`} x1="0" y1={i * 100} x2="800" y2={i * 100} />
              ))}
            </g>

            {/* curvas de nível (topografia) em torno da loja */}
            <g fill="none" stroke="#3aa9c4" strokeOpacity="0.5">
              <path strokeWidth="1.4" d="M120 300 C 240 230 420 236 560 300 C 660 346 720 300 760 340" />
              <path strokeWidth="1.4" d="M60 250 C 220 150 480 156 640 236 C 720 276 780 236 800 268" />
              <path strokeWidth="1.4" d="M160 360 C 300 300 480 306 600 360 C 680 396 740 366 800 396" />
              <path strokeWidth="1.1" strokeOpacity="0.3" d="M40 200 C 240 90 520 96 700 190" />
              <path strokeWidth="1.1" strokeOpacity="0.3" d="M200 420 C 340 372 500 378 620 420" />
            </g>

            {/* rio serpenteando */}
            <path d="M-20 120 C 160 200 120 320 280 380 C 420 432 380 520 520 540" fill="none" stroke="#2f83b4" strokeOpacity="0.55" strokeWidth="7" strokeLinecap="round" />

            {/* avenidas principais */}
            <g stroke="#e9edf1" strokeOpacity="0.16" strokeLinecap="round">
              <path d="M0 380 C 220 330 520 470 800 300" fill="none" strokeWidth="4" />
              <path d="M120 0 C 300 180 340 360 300 520" fill="none" strokeWidth="3.5" />
              <path d="M520 0 C 470 200 560 340 760 520" fill="none" strokeWidth="3" />
            </g>

            {/* brilho central */}
            <rect width="800" height="520" fill="url(#map-glow)" />
          </svg>

          {/* brilho + pino da loja */}
          <div className="pointer-events-none absolute left-1/2 top-[46%] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,157,46,0.28), transparent 66%)" }} />
          <div className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-full">
            <div className="store-pin relative flex flex-col items-center">
              <span className="store-pulse absolute bottom-1 h-8 w-8 rounded-full bg-brand/50" />
              <span className="relative z-10 mb-1 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-brand backdrop-blur-sm">NEBLINA RECORDS</span>
              <MapPin size={44} className="relative z-10 text-brand drop-shadow-[0_6px_14px_rgba(0,0,0,0.7)]" fill="#ff9d2e" strokeWidth={1.4} />
            </div>
          </div>

          <span className="absolute left-4 top-4 rounded-full bg-black/45 px-3 py-1 text-[11px] font-semibold tracking-wider text-mist backdrop-blur-sm">
            NOVA FRIBURGO · RJ
          </span>
        </div>

        {/* informações */}
        <div className="flex flex-col justify-center gap-4 p-7 md:p-9">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-teal">Onde estamos</p>
            <h2 className="mt-2 font-display text-2xl text-ink md:text-3xl">Nossa loja física</h2>
          </div>
          <p className="flex items-start gap-3 text-muted">
            <MapPin size={18} className="mt-0.5 shrink-0 text-brand" />
            <span className="leading-relaxed text-ink">{ADDRESS}</span>
          </p>
          <p className="flex items-center gap-3 text-sm text-muted">
            <Clock size={16} className="shrink-0 text-teal" />
            Visitas com hora marcada — combine pelo WhatsApp.
          </p>
          <a
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-brand mt-1 inline-flex w-fit items-center gap-2 rounded-xl px-5 py-3 text-sm"
          >
            <Navigation size={16} /> Como chegar
          </a>
        </div>
      </div>

      <style>{`
        @keyframes store-pulse { 0% { transform: scale(0.6); opacity: 0.7; } 70% { transform: scale(2.4); opacity: 0; } 100% { opacity: 0; } }
        .store-pulse { animation: store-pulse 2.4s ease-out infinite; }
        @keyframes store-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        .store-pin { animation: store-bob 3s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .store-pulse, .store-pin { animation: none; } }
      `}</style>
    </div>
  );
}
