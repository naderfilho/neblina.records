"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Eye, EyeOff, Search, Copy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAction } from "@/lib/audit";
import { formatBRL } from "@/lib/utils";
import { AVAILABILITY } from "@/lib/constants";
import type { RecordItem, Tag } from "@/lib/types";

type SortKey = "recent" | "artist" | "price_desc" | "price_asc";

export default function AdminRecordsTable({ records, tags = [] }: { records: RecordItem[]; tags?: Tag[] }) {
  const router = useRouter();
  const [items, setItems] = useState(records);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [tagFilter, setTagFilter] = useState("");
  const [artistFilter, setArtistFilter] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  // só mostra no filtro as tags realmente usadas em algum disco
  const usedTags = useMemo(() => {
    const ids = new Set(items.flatMap((r) => r.tag_ids ?? []));
    return tags.filter((t) => ids.has(t.id));
  }, [items, tags]);

  // artistas que existem no acervo (com quantos discos cada um tem)
  const artists = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of items) {
      const a = (r.artist ?? "").trim();
      if (a) m.set(a, (m.get(a) ?? 0) + 1);
    }
    return [...m.entries()]
      .sort((a, b) => a[0].localeCompare(b[0], "pt-BR"))
      .map(([name, count]) => ({ name, count }));
  }, [items]);

  const filtered = useMemo(() => {
    const query = q.toLowerCase();
    const list = items.filter((r) => {
      if (tagFilter && !(r.tag_ids ?? []).includes(tagFilter)) return false;
      if (artistFilter && (r.artist ?? "").trim() !== artistFilter) return false;
      return `${r.title} ${r.artist} ${r.genre ?? ""}`.toLowerCase().includes(query);
    });
    if (sort === "artist") list.sort((a, b) => (a.artist || "").localeCompare(b.artist || "", "pt-BR"));
    else if (sort === "price_desc") list.sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (sort === "price_asc") list.sort((a, b) => (a.price || 0) - (b.price || 0));
    return list;
  }, [items, q, sort, tagFilter, artistFilter]);

  async function togglePublish(r: RecordItem) {
    setBusy(r.id);
    const supabase = createClient();
    await supabase.from("records").update({ is_published: !r.is_published }).eq("id", r.id);
    logAction("update", "record", r.id, r.title, { alteracoes: { Publicado: [r.is_published, !r.is_published] } });
    setItems((prev) => prev.map((x) => (x.id === r.id ? { ...x, is_published: !x.is_published } : x)));
    setBusy(null);
  }

  async function remove(r: RecordItem) {
    if (!confirm(`Excluir "${r.title}"? Esta ação não pode ser desfeita.`)) return;
    setBusy(r.id);
    const supabase = createClient();
    const { error } = await supabase.from("records").delete().eq("id", r.id);
    setBusy(null);
    if (!error) {
      logAction("delete", "record", r.id, r.title, {});
      setItems((prev) => prev.filter((x) => x.id !== r.id));
      router.refresh();
    } else {
      alert("Erro ao excluir: " + error.message);
    }
  }

  return (
    <div>
      {/* contagem */}
      <p className="mb-3 text-sm text-muted">
        <span className="font-semibold text-ink">{items.length}</span> disco{items.length === 1 ? "" : "s"} cadastrado{items.length === 1 ? "" : "s"}
        {filtered.length !== items.length && <span className="text-faint"> · {filtered.length} no filtro</span>}
      </p>

      {/* controles: busca, ordenar, filtrar por tag */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1 sm:max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar disco…"
            className="w-full rounded-xl border border-line bg-panel py-2.5 pl-10 pr-4 text-sm text-ink outline-none focus:border-brand/50"
          />
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-xl border border-line bg-panel px-3 py-2.5 text-sm text-ink outline-none focus:border-brand/50"
          aria-label="Ordenar"
        >
          <option value="recent">Mais recentes</option>
          <option value="artist">Artista (A–Z)</option>
          <option value="price_desc">Mais caros</option>
          <option value="price_asc">Mais baratos</option>
        </select>

        {artists.length > 0 && (
          <select
            value={artistFilter}
            onChange={(e) => setArtistFilter(e.target.value)}
            className="max-w-[220px] rounded-xl border border-line bg-panel px-3 py-2.5 text-sm text-ink outline-none focus:border-brand/50"
            aria-label="Filtrar por artista"
          >
            <option value="">Todos os artistas</option>
            {artists.map((a) => (
              <option key={a.name} value={a.name}>{a.name} ({a.count})</option>
            ))}
          </select>
        )}

        {usedTags.length > 0 && (
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="rounded-xl border border-line bg-panel px-3 py-2.5 text-sm text-ink outline-none focus:border-brand/50"
            aria-label="Filtrar por tag"
          >
            <option value="">Todas as tags</option>
            {usedTags.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-bg-soft text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">Disco</th>
              <th className="px-4 py-3">Estilo</th>
              <th className="px-4 py-3">Preço</th>
              <th className="px-4 py-3">Disponibilidade</th>
              <th className="px-4 py-3">Visitas</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-panel/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-line bg-black">
                      {r.cover_image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.cover_image_url} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{r.title}</p>
                      <p className="truncate text-xs text-muted">{r.artist}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{r.genre ?? "—"}</td>
                <td className="px-4 py-3 text-brand">{formatBRL(r.price)}</td>
                <td className="px-4 py-3">
                  {(() => {
                    const a = AVAILABILITY.find((x) => x.id === (r.availability ?? "available")) ?? AVAILABILITY[0];
                    return <span className="inline-flex items-center gap-1.5 text-xs text-muted"><span className="h-2 w-2 rounded-full" style={{ background: a.color }} /> {a.label}</span>;
                  })()}
                </td>
                <td className="px-4 py-3 text-muted">{r.views_count}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => togglePublish(r)}
                    disabled={busy === r.id}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${
                      r.is_published ? "bg-teal/15 text-teal" : "bg-panel-2 text-faint"
                    }`}
                  >
                    {r.is_published ? <Eye size={12} /> : <EyeOff size={12} />}
                    {r.is_published ? "Publicado" : "Oculto"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/admin/discos/${r.id}`} className="rounded-lg p-2 text-muted hover:bg-panel-2 hover:text-brand" aria-label="Editar" title="Editar">
                      <Pencil size={15} />
                    </Link>
                    <Link
                      href={`/admin/discos/novo?clone=${r.id}`}
                      className="rounded-lg p-2 text-muted hover:bg-panel-2 hover:text-brand"
                      aria-label="Clonar disco"
                      title="Clonar disco"
                    >
                      <Copy size={15} />
                    </Link>
                    <button onClick={() => remove(r)} disabled={busy === r.id} className="rounded-lg p-2 text-muted hover:bg-panel-2 hover:text-red-400" aria-label="Excluir" title="Excluir">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-muted">Nenhum disco encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
