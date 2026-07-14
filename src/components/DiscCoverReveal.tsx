"use client";

import { useState, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * "Ver capa" na subpágina: ao clicar, a CAPA sobe e fica POR CIMA do disco (bem
 * visível), enquanto o disco desce um pouco e vai para trás — como tirar o vinil
 * da capa. Animação suave nos dois sentidos. O botão fica acima.
 *
 * `discOffset` (rem) alinha a capa ao disco quando ele não está no topo do bloco
 * (ex.: TrackVinyl tem uma legenda acima do disco).
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
        {/* Só o DISCO fica atrás da capa (via z-index). Não apagamos/encolhemos o
            bloco inteiro: os botões Lado A/Lado B e a lista de faixas ficam abaixo
            do disco e devem continuar visíveis e clicáveis com a capa aberta —
            dá pra tocar as faixas mesmo sem os sulcos aparentes. */}
        <div className="relative" style={{ zIndex: show ? 0 : 10 }}>
          {children}
        </div>

        {/* capa: sobe e fica POR CIMA do disco; ao mostrar cresce (scale) do centro
            para cobrir o disco por completo (sem sobrar disco embaixo) */}
        <button
          type="button"
          onClick={() => setShow(false)}
          aria-label="Ocultar capa"
          className="absolute left-0 aspect-square w-full cursor-zoom-out overflow-hidden rounded-2xl border border-line shadow-2xl"
          style={{
            top: `${discOffset}rem`,
            transformOrigin: "center center",
            zIndex: show ? 30 : 0,
            transform: show ? "translateY(0) scale(1.1)" : "translateY(2.5rem) scale(0.9)",
            opacity: show ? 1 : 0,
            pointerEvents: show ? "auto" : "none",
            transition: `transform 0.85s ${ease}, opacity 0.5s ease`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverUrl} alt="Capa do disco" className="h-full w-full object-cover" draggable={false} />
        </button>
      </div>
    </div>
  );
}
