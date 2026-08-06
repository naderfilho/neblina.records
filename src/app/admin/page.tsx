import Link from "next/link";
import { Disc3, DollarSign, Users, Eye, CalendarDays, Plus, TrendingUp, Package, Wallet, PiggyBank } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PrivateStat from "@/components/admin/PrivateStat";
import { formatBRL } from "@/lib/utils";
import type { RecordItem } from "@/lib/types";

export const revalidate = 0;

/**
 * Estatísticas do acervo inteiro. O Supabase/PostgREST corta cada resposta em
 * 1000 linhas, então paginamos por `range` para somar/contar TODOS os discos
 * (senão o painel mostra no máximo 1000).
 */
type StatRow = { price: number | null; cost: number | null; availability: string | null; is_published: boolean; box_only: boolean };

async function fetchAllForStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<StatRow[]> {
  const all: StatRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("records")
      .select("price,cost,availability,is_published,box_only")
      .order("id")
      .range(from, from + 999);
    if (error || !data?.length) break;
    all.push(...(data as StatRow[]));
    if (data.length < 1000) break;
  }
  return all;
}

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [statRows, { data: boxRows }, { data: mostVisitedData }, { count: userCount }, { count: eventCount }] = await Promise.all([
    fetchAllForStats(supabase),
    supabase.from("boxes").select("price,cost,availability"),
    supabase
      .from("records")
      .select("id,title,artist,price,availability,views_count,is_published,cover_image_url,disc_config")
      .order("views_count", { ascending: false })
      .limit(6),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("event_requests").select("*", { count: "exact", head: true }).eq("status", "new"),
  ]);

  const num = (v: number | null | undefined) => Number(v) || 0;

  // Catálogo = discos que se vendem sozinhos (exclui os box_only, que fazem parte
  // de um box — o box é a unidade com preço/custo próprios; contá-los aqui
  // duplicaria o investimento).
  const catalog = statRows.filter((r) => !r.box_only);
  const boxes = (boxRows ?? []) as { price: number | null; cost: number | null; availability: string | null }[];

  const inStock = [...catalog, ...boxes].filter((x) => x.availability !== "sold");
  const soldItems = [...catalog, ...boxes].filter((x) => x.availability === "sold");

  const investedStock = inStock.reduce((s, x) => s + num(x.cost), 0); // custo do que está parado
  const stockValue = inStock.reduce((s, x) => s + num(x.price), 0);   // preço de venda do estoque
  const potentialProfit = stockValue - investedStock;                 // lucro se vender tudo
  const realizedProfit = soldItems.reduce((s, x) => s + (num(x.price) - num(x.cost)), 0); // lucro já realizado

  const totalUnits = inStock.length;
  const soldCount = soldItems.length;
  const published = catalog.filter((r) => r.is_published).length;
  const recsCount = catalog.length;
  const mostVisited = (mostVisitedData ?? []) as RecordItem[];

  const stats = [
    { icon: Disc3, label: "Discos cadastrados", value: String(recsCount), sub: `${published} publicados` },
    { icon: Users, label: "Usuários", value: String(userCount ?? 0), sub: "cadastrados" },
    { icon: CalendarDays, label: "Pedidos de evento", value: String(eventCount ?? 0), sub: "novos" },
  ];

  // Financeiro (sensível → atrás do "olhinho"). Inclui discos do catálogo + boxes.
  const finance = [
    { icon: Wallet, label: "Valor investido", value: formatBRL(investedStock), sub: `${totalUnits} itens em estoque` },
    { icon: DollarSign, label: "Valor em estoque", value: formatBRL(stockValue), sub: "a preço de venda" },
    { icon: TrendingUp, label: "Lucro potencial", value: formatBRL(potentialProfit), sub: "se vender o estoque" },
    { icon: PiggyBank, label: "Lucro realizado", value: formatBRL(realizedProfit), sub: `${soldCount} já vendidos` },
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

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="card relative p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand">
              <s.icon size={20} />
            </div>
            <p className="font-display text-2xl text-ink">{s.value}</p>
            <p className="text-sm text-muted">{s.label}</p>
            <p className="mt-0.5 text-xs text-faint">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Financeiro — números sensíveis, cada card abre oculto (olhinho) */}
      <div className="mt-6">
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          <Wallet size={14} className="text-brand" /> Financeiro
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {finance.map((s) => (
            <div key={s.label} className="card relative p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand">
                <s.icon size={20} />
              </div>
              <PrivateStat value={s.value} label={s.label} sub={s.sub} />
            </div>
          ))}
        </div>
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
