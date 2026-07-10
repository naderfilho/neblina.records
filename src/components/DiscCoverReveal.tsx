"use client";

import { useState, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * Envolve o disco na subpágina: a capa (quadrada, esmaecida) fica escondida
 * atrás/embaixo do disco e "sobe" como fundo ao clicar em Ver capa. O disco
 * continua na frente, girando/tocando normalmente.
 */
export default function DiscCoverReveal({ coverUrl, children }: { coverUrl: string | null; children: ReactNode }) {
  const [show, setShow] = useState(false);
  if (!coverUrl) return <>{children}</>;

  return (
    <div className="mx-auto max-w-md">
      <div className="relative">
        {/* fundo: capa que sobe */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 aspect-square w-[88%] -translate-x-1/2 overflow-hidden rounded-2xl border border-line shadow-2xl"
          style={{
            transform: show ? "translate(-50%, -54%)" : "translate(-50%, -12%)",
            opacity: show ? 1 : 0,
            transition: "transform 0.8s cubic-bezier(0.22,1,0.36,1), opacity 0.6s ease",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverUrl} alt="Capa do disco" className="h-full w-full object-cover" style={{ filter: show ? "brightness(0.68) saturate(1.05)" : "brightness(0.4)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 42%, transparent 45%, rgba(0,0,0,0.45))" }} />
        </div>

        {/* disco na frente */}
        <div className="relative z-10">{children}</div>
      </div>

      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="flex items-center gap-2 rounded-xl border border-line bg-panel px-4 py-2 text-sm text-muted transition-colors hover:border-brand/50 hover:text-brand"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />} {show ? "Ocultar capa" : "Ver capa"}
        </button>
      </div>
    </div>
  );
}
