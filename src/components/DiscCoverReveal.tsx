"use client";

import { useState, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * Envolve o disco na subpágina: a capa (quadrada, esmaecida) fica escondida e
 * "sobe" como fundo alinhada ao disco ao clicar em Ver capa. O disco continua
 * na frente, girando/tocando. O botão fica ACIMA do disco.
 *
 * `discOffset` desloca o fundo para baixo (rem) quando o disco não está no topo
 * do bloco (ex.: TrackVinyl tem uma legenda acima do disco).
 */
export default function DiscCoverReveal({
  coverUrl,
  children,
  discOffset = 0,
}: {
  coverUrl: string | null;
  children: ReactNode;
  discOffset?: number;
}) {
  const [show, setShow] = useState(false);
  if (!coverUrl) return <>{children}</>;

  return (
    <div className="mx-auto max-w-md">
      {/* botão acima do disco */}
      <div className="mb-3 flex justify-center">
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="flex items-center gap-2 rounded-xl border border-line bg-panel px-4 py-2 text-sm text-muted transition-colors hover:border-brand/50 hover:text-brand"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />} {show ? "Ocultar capa" : "Ver capa"}
        </button>
      </div>

      <div className="relative">
        {/* fundo: capa quadrada alinhada ao disco, que sobe suavemente */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 z-0 aspect-square w-full overflow-hidden rounded-2xl border border-line shadow-2xl"
          style={{
            top: `${discOffset}rem`,
            transform: show ? "translateY(-5%) scale(1)" : "translateY(10%) scale(0.98)",
            opacity: show ? 1 : 0,
            transition: "transform 0.8s cubic-bezier(0.22,1,0.36,1), opacity 0.55s ease",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverUrl} alt="Capa do disco" className="h-full w-full object-cover" style={{ filter: show ? "brightness(0.66) saturate(1.05)" : "brightness(0.4)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 44%, transparent 46%, rgba(0,0,0,0.5))" }} />
        </div>

        {/* disco na frente */}
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}
