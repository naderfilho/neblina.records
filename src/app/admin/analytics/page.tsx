import Link from "next/link";
import { BarChart3, Eye, CalendarDays, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const revalidate = 0;

type Bucket = { bucket: string | number; visits: number };
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function Bars({ data, label }: { data: { key: string; value: number }[]; label: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="card p-6">
      <h2 className="mb-4 font-display text-lg text-ink">{label}</h2>
      <div className="flex items-end gap-1.5 overflow-x-auto" style={{ height: 180 }}>
        {data.map((d, i) => (
          <div key={i} className="flex min-w-[14px] flex-1 flex-col items-center justify-end gap-1" title={`${d.key}: ${d.value}`}>
            <span className="text-[10px] text-faint">{d.value || ""}</span>
            <div className="w-full rounded-t bg-brand/70" style={{ height: `${(d.value / max) * 140}px`, minHeight: d.value ? 2 : 0 }} />
            <span className="whitespace-nowrap text-[9px] text-faint">{d.key}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { days: daysRaw } = await searchParams;
  const days = [7, 30, 90].includes(Number(daysRaw)) ? Number(daysRaw) : 30;
  const supabase = await createClient();

  const [{ data: daily }, { data: hourly }, { data: weekday }, { count: allTime }] = await Promise.all([
    supabase.rpc("visit_stats_daily", { p_days: days }),
    supabase.rpc("visit_stats_hourly", { p_days: days }),
    supabase.rpc("visit_stats_weekday", { p_days: days }),
    supabase.from("site_visits").select("*", { count: "exact", head: true }),
  ]);

  // mapa dia -> visitas (para preencher dias sem acesso com 0)
  const dailyMap = new Map<string, number>();
  for (const r of (daily ?? []) as Bucket[]) dailyMap.set(String(r.bucket), Number(r.visits));

  // gera os últimos `days` dias (rótulo dd/mm) em ordem
  const dayBars: { key: string; value: number }[] = [];
  let periodTotal = 0;
  let todayCount = 0;
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const v = dailyMap.get(iso) ?? 0;
    periodTotal += v;
    if (i === 0) todayCount = v;
    dayBars.push({ key: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`, value: v });
  }
  // no gráfico diário, com 90 dias fica denso — mostra rótulo a cada N
  const dayBarsThinned = dayBars.map((b, i) => ({ ...b, key: days > 31 && i % 5 !== 0 ? "" : b.key }));

  const hourMap = new Map<number, number>();
  for (const r of (hourly ?? []) as Bucket[]) hourMap.set(Number(r.bucket), Number(r.visits));
  const hourBars = Array.from({ length: 24 }, (_, h) => ({ key: `${h}h`, value: hourMap.get(h) ?? 0 }));

  const wdMap = new Map<number, number>();
  for (const r of (weekday ?? []) as Bucket[]) wdMap.set(Number(r.bucket), Number(r.visits));
  const wdBars = WEEKDAYS.map((name, i) => ({ key: name, value: wdMap.get(i) ?? 0 }));

  const avgPerDay = Math.round(periodTotal / days);

  const cards = [
    { icon: Eye, label: "Acessos no período", value: periodTotal.toLocaleString("pt-BR"), sub: `últimos ${days} dias` },
    { icon: CalendarDays, label: "Média por dia", value: avgPerDay.toLocaleString("pt-BR"), sub: "no período" },
    { icon: Clock, label: "Hoje", value: todayCount.toLocaleString("pt-BR"), sub: "acessos" },
    { icon: BarChart3, label: "Total geral", value: (allTime ?? 0).toLocaleString("pt-BR"), sub: "desde o início" },
  ];

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Acessos ao site</h1>
          <p className="text-muted">Quantas pessoas visitaram o site (horário de Brasília).</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <Link key={d} href={`/admin/analytics?days=${d}`} className={cn("rounded-xl border px-4 py-2 text-sm font-medium transition-colors", days === d ? "border-brand bg-brand/15 text-brand" : "border-line text-muted hover:text-ink")}>
              {d} dias
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand"><c.icon size={20} /></div>
            <p className="font-display text-2xl text-ink">{c.value}</p>
            <p className="text-sm text-muted">{c.label}</p>
            <p className="mt-0.5 text-xs text-faint">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <Bars data={dayBarsThinned} label="Acessos por dia" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Bars data={wdBars} label="Por dia da semana" />
          <Bars data={hourBars} label="Por horário (0–23h)" />
        </div>
      </div>

      {periodTotal === 0 && (
        <p className="mt-6 rounded-2xl border border-dashed border-line py-8 text-center text-sm text-faint">
          Ainda não há acessos registrados neste período. Os acessos começam a contar a partir de agora.
        </p>
      )}
    </div>
  );
}
