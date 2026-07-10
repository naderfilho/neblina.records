"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function usd(v: number) {
  return `US$ ${v.toFixed(v < 1 ? 4 : 2)}`;
}

/** Gasto da Neblina IA em tempo real (soma de ai_usage.cost_usd). */
export default function AiSpendCard() {
  const [total, setTotal] = useState<number | null>(null);
  const [month, setMonth] = useState(0);
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("ai_usage").select("cost_usd,created_at").limit(5000);
    if (!data) return;
    const now = new Date();
    let t = 0, m = 0;
    for (const r of data as { cost_usd: number; created_at: string }[]) {
      const c = Number(r.cost_usd) || 0;
      t += c;
      const d = new Date(r.created_at);
      if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) m += c;
    }
    setTotal(t);
    setMonth(m);
    setCount(data.length);
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
      <p className="font-display text-2xl text-ink">{total == null ? "…" : usd(total)}</p>
      <p className="text-sm text-muted">Gasto Neblina IA</p>
      <p className="mt-0.5 text-xs text-faint">
        {usd(month)} neste mês · {count} pesquisas
      </p>
    </div>
  );
}
