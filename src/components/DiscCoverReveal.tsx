"use client";

import { useState, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * "Ver capa" na subpágina: a capa (quadrada) SOBE e o disco DESCE, como um vinil
 * saindo/entrando na capa — animação suave nos dois sentidos. O botão fica acima.
 *
 * `discOffset` (rem) desloca a capa para baixo quando o disco não está no topo do
 * bloco (ex.: TrackVinyl tem uma legenda acima do disco).
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

  const ease = "cubic-bezier(0.22, 1, 0.36, 1)";

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
        {/* capa quadrada: sobe ao mostrar, desce/some ao ocultar */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 z-0 aspect-square w-full overflow-hidden rounded-2xl border border-line shadow-2xl"
          style={{
            top: `${discOffset}rem`,
            transform: show ? "translateY(-3.5rem) scale(1)" : "translateY(1.5rem) scale(0.94)",
            opacity: show ? 1 : 0,
            transition: `transform 0.85s ${ease}, opacity 0.5s ease`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverUrl} alt="Capa do disco" className="h-full w-full object-cover" style={{ filter: show ? "brightness(0.72) saturate(1.05)" : "brightness(0.4)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 42%, transparent 48%, rgba(0,0,0,0.5))" }} />
        </div>

        {/* disco na frente: desce ao mostrar a capa, volta ao ocultar */}
        <div
          className="relative z-10"
          style={{
            transform: show ? "translateY(4rem)" : "translateY(0)",
            transition: `transform 0.85s ${ease}`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
