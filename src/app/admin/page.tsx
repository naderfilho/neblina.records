import Link from "next/link";
import { Disc3, DollarSign, Users, Eye, CalendarDays, Plus, TrendingUp, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatBRL } from "@/lib/utils";
import AiSpendCard from "@/components/admin/AiSpendCard";
import type { RecordItem } from "@/lib/types";

export const revalidate = 0;

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [{ data: records }, { count: userCount }, { count: eventCount }] = await Promise.all([
    supabase.from("records").select("id,title,artist,price,availability,views_count,is_published,cover_image_url,disc_config"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("event_requests").select("*", { count: "exact", head: true }).eq("status", "new"),
  ]);

  const recs = (records ?? []) as RecordItem[];
  const available = recs.filter((r) => r.availability !== "sold");
  const inventoryValue = available.reduce((s, r) => s + (r.price || 0), 0);
  const totalUnits = available.length;
  const published = recs.filter((r) => r.is_published).length;
  const mostVisited = [...recs].sort((a, b) => b.views_count - a.views_count).slice(0, 6);

  const stats = [
    { icon: Disc3, label: "Discos cadastrados", value: String(recs.length), sub: `${published} publicados` },
    { icon: DollarSign, label: "Valor do inventário", value: formatBRL(inventoryValue), sub: `${totalUnits} disponíveis` },
    { icon: Users, label: "Usuários", value: String(userCount ?? 0), sub: "cadastrados" },
    { icon: CalendarDays, label: "Pedidos de evento", value: String(eventCount ?? 0), sub: "novos" },
  ];

  return (
    <div className="p-6 md:p-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Visão geral</h1>
          <p className="text-muted">Resumo do acervo e da loja.</p>
        </div>
        <Link href="/admin/discos/novo" className="btn-brand inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm">
          <Plus size={17} /> Novo disco
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand">
              <s.icon size={20} />
            </div>
            <p className="font-display text-2xl text-ink">{s.value}</p>
            <p className="text-sm text-muted">{s.label}</p>
            <p className="mt-0.5 text-xs text-faint">{s.sub}</p>
          </div>
        ))}
        <AiSpendCard />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* mais visitados */}
        <div className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl text-ink">
            <TrendingUp size={19} className="text-teal" /> Discos mais visitados
          </h2>
          {mostVisited.length === 0 ? (
            <p className="text-sm text-muted">Nenhum disco ainda.</p>
          ) : (
            <ul className="space-y-2">
              {mostVisited.map((r, i) => (
                <li key={r.id}>
                  <Link href={`/admin/discos/${r.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-panel-2">
                    <span className="w-5 text-center font-display text-lg text-faint">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink">{r.title}</p>
                      <p className="truncate text-xs text-muted">{r.artist}</p>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-mist">
                      <Eye size={13} /> {r.views_count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* atalhos */}
        <div className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl text-ink">
            <Package size={19} className="text-teal" /> Ações rápidas
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/admin/discos/novo" className="rounded-xl border border-line bg-bg-soft p-4 hover:border-brand/50">
              <Plus size={20} className="mb-2 text-brand" />
              <p className="text-sm text-ink">Adicionar disco</p>
            </Link>
            <Link href="/admin/discos" className="rounded-xl border border-line bg-bg-soft p-4 hover:border-brand/50">
              <Disc3 size={20} className="mb-2 text-brand" />
              <p className="text-sm text-ink">Gerenciar acervo</p>
            </Link>
            <Link href="/admin/usuarios" className="rounded-xl border border-line bg-bg-soft p-4 hover:border-brand/50">
              <Users size={20} className="mb-2 text-brand" />
              <p className="text-sm text-ink">Ver usuários</p>
            </Link>
            <Link href="/admin/eventos" className="rounded-xl border border-line bg-bg-soft p-4 hover:border-brand/50">
              <CalendarDays size={20} className="mb-2 text-brand" />
              <p className="text-sm text-ink">Pedidos de evento</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
