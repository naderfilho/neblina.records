"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * Volta para a página anterior (history back). Se a pessoa abriu o link direto
 * (sem histórico dentro do site), cai no acervo (/). Substitui o antigo
 * "Voltar ao acervo" fixo — nem sempre veio do acervo.
 */
export default function BackButton({ className = "mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-brand" }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) router.back();
        else router.push("/");
      }}
      className={className}
    >
      <ArrowLeft size={16} /> Voltar
    </button>
  );
}
