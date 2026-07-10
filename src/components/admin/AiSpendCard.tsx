"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

function usd(v: number) {
  return `US$ ${v.toFixed(v < 1 ? 4 : 2)}`;
}

type Spend = { total: number; month: number; count?: number; source?: string };

/** Gasto da Neblina IA em tempo real (Admin API da Anthropic ou soma local). */
export default function AiSpendCard() {
  const [data, setData] = useState<Spend | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ai-cost", { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } catch { /* mantém o valor anterior */ }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 25000); // atualiza sozinho
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(id); window.removeEventListener("focus", onFocus); };
  }, [load]);

  return (
    <div className="card p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand">
        <Sparkles size={20} />
      </div>
      <p className="font-display text-2xl text-ink">{data == null ? "…" : usd(data.total)}</p>
      <p className="text-sm text-muted">Gasto Neblina IA</p>
      <p className="mt-0.5 text-xs text-faint">
        {data ? `${usd(data.month)} neste mês` : "carregando…"}
        {data?.source === "local" ? " · registrado no app" : data?.source === "anthropic" ? " · via Anthropic" : ""}
      </p>
    </div>
  );
}
