"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * Números sensíveis do painel (valor do inventário + quantidade).
 * Abre SEMPRE oculto e não guarda a preferência: assim o valor nunca aparece
 * sozinho ao abrir o painel numa tela que outra pessoa possa ver.
 */
export default function PrivateStat({
  value,
  label,
  sub,
}: {
  value: string;
  label: string;
  sub: string;
}) {
  const [show, setShow] = useState(false);

  // "12 disponíveis" -> "•• disponíveis" (esconde o número, mantém o contexto)
  const maskedSub = sub.replace(/\d/g, "•");

  return (
    <>
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-pressed={show}
        aria-label={show ? "Ocultar valores" : "Mostrar valores"}
        title={show ? "Ocultar valores" : "Mostrar valores"}
        className="absolute right-3 top-3 rounded-lg p-2 text-muted transition-colors hover:bg-panel-2 hover:text-brand"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>

      <p className={`font-display text-2xl text-ink ${show ? "" : "select-none tracking-widest"}`}>
        {show ? value : "••••••"}
      </p>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-0.5 text-xs text-faint">{show ? sub : maskedSub}</p>
    </>
  );
}
