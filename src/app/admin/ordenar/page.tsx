"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Save, Loader2, Check, Search, X, Hand, CornerDownLeft, ChevronsUp, ChevronsDown,
  ChevronLeft, ChevronRight, Music, Image as ImageIcon, Info,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fetchAllRange } from "@/lib/fetchAllRange";
import { logAction } from "@/lib/audit";
import { formatBRL, cn } from "@/lib/utils";
import Vinyl from "@/components/Vinyl";
import { HOME_COLUMN_OPTIONS, DEFAULT_HOME_COLUMNS, homeGridClass } from "@/lib/constants";
import type { DiscConfig } from "@/lib/constants";
import type { Tag } from "@/lib/types";

type Rec = {
  id: string;
  title: string;
  artist: string;
  price: number | null;
  cover_image_url: string | null;
  disc_config: DiscConfig;
  tag_ids: string[] | null;
};

const PER_PAGE = 60;
type ViewSort = "order" | "price_desc" | "price_asc" | "artist";

function pageList(current: number, total: number): (number | "…")[] {
  const out: (number | "…")[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) out.push(i);
    else if (out[out.length - 1] !== "…") out.push("…");
  }
  return out;
}

export default function AdminOrdenarPage() {
  const supabase = createClient();

  const [items, setItems] = useState<Rec[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [audioIds, setAudioIds] = useState<Set<string>>(new Set());
  const [columns, setColumns] = useState<number>(DEFAULT_HOME_COLUMNS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  // "pegar e soltar": o disco pego fica preso até você escolher onde soltar
  const [picked, setPicked] = useState<string | null>(null);

  // filtros (só para ENCONTRAR discos — a ordem salva continua sendo a manual)
  const [q, setQ] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [audioFilter, setAudioFilter] = useState<"all" | "with" | "without">("all");
  const [coverFilter, setCoverFilter] = useState<"all" | "with" | "without">("all");
  const [viewSort, setViewSort] = useState<ViewSort>("order");
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      const [recs, { data: tg }, { data: settings }, { data: withAudio }] = await Promise.all([
        fetchAllRange<Rec>((from, to) =>
          supabase.from("records")
            .select("id,title,artist,price,cover_image_url,disc_config,tag_ids")
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: false })
            .order("id", { ascending: true })
            .range(from, to),
        ),
        supabase.from("tags").select("*").order("created_at"),
        supabase.from("site_settings").select("home_columns").eq("id", "main").maybeSingle(),
        supabase.rpc("records_with_audio"),
      ]);
      setItems(recs);
      setTags((tg as Tag[]) ?? []);
      setColumns(settings?.home_columns ?? DEFAULT_HOME_COLUMNS);
      setAudioIds(new Set(((withAudio as string[] | null) ?? []).map(String)));
      setLoading(false);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- posição global (independe de filtro/página) ----
  const indexById = useMemo(() => {
    const m = new Map<string, number>();
    items.forEach((r, i) => m.set(r.id, i));
    return m;
  }, [items]);

  function moveTo(id: string, targetIndex: number) {
    setItems((list) => {
      const from = list.findIndex((x) => x.id === id);
      if (from === -1) return list;
      const arr = [...list];
      const [moved] = arr.splice(from, 1);
      arr.splice(Math.max(0, Math.min(arr.length, targetIndex)), 0, moved);
      return arr;
    });
    setDirty(true);
    setSaved(false);
  }

  const dropOn = (targetId: string) => {
    if (!picked || picked === targetId) return setPicked(null);
    moveTo(picked, indexById.get(targetId) ?? 0);
    setPicked(null);
  };

  async function save() {
    setSaving(true);
    setSaved(false);
    // uma única chamada: a função no banco grava a ordem inteira
    const { error } = await supabase.rpc("set_records_order", { p_ids: items.map((r) => r.id) });
    setSaving(false);
    if (error) { alert("Erro ao salvar a ordem: " + error.message); return; }
    logAction("reorder", "order", null, "Ordem dos discos da home", {
      total: items.length, primeiros: items.slice(0, 8).map((r) => r.title),
    });
    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function saveColumns(n: number) {
    setColumns(n);
    await supabase.from("site_settings").update({ home_columns: n }).eq("id", "main");
    logAction("update", "site_settings", null, "Discos por linha na home", { colunas: n });
  }

  // ---- visualização (filtros + ordenação só de tela) ----
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = items.filter((r) => {
      if (term && !`${r.title} ${r.artist}`.toLowerCase().includes(term)) return false;
      if (tagFilter && !(r.tag_ids ?? []).includes(tagFilter)) return false;
      if (audioFilter !== "all") {
        const has = audioIds.has(r.id);
        if (audioFilter === "with" ? !has : has) return false;
      }
      if (coverFilter !== "all") {
        const has = !!r.cover_image_url;
        if (coverFilter === "with" ? !has : has) return false;
      }
      return true;
    });
    if (viewSort === "price_desc") list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (viewSort === "price_asc") list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (viewSort === "artist") list = [...list].sort((a, b) => a.artist.localeCompare(b.artist, "pt-BR"));
    return list;
  }, [items, q, tagFilter, audioFilter, coverFilter, viewSort, audioIds]);

  const sig = `${q}|${tagFilter}|${audioFilter}|${coverFilter}|${viewSort}`;
  const [prevSig, setPrevSig] = useState(sig);
  if (prevSig !== sig) { setPrevSig(sig); setPage(1); }

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const pickedRec = picked ? items.find((r) => r.id === picked) ?? null : null;
  const canDrop = viewSort === "order"; // soltar só faz sentido vendo a ordem real
  const filtersOn = !!(q || tagFilter || audioFilter !== "all" || coverFilter !== "all");

  return (
    <div className="p-6 md:p-10">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Ordenar discos da home</h1>
          <p className="text-muted">
            Use <strong className="text-ink">Mover</strong> para pegar um disco e <strong className="text-ink">Soltar aqui</strong> na posição desejada —
            ou digite a posição direto no campo <strong className="text-ink">#</strong>.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving || loading || !dirty}
          className="btn-brand inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm disabled:opacity-50"
        >
          {saving ? <Loader2 size={17} className="animate-spin" /> : saved ? <Check size={17} /> : <Save size={17} />}
          {saved ? "Ordem salva!" : dirty ? "Salvar ordem" : "Tudo salvo"}
        </button>
      </div>

      {/* discos por linha (vale para a home pública) */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-bg-soft p-3">
        <span className="text-sm text-muted">Discos por linha na home:</span>
        <div className="flex gap-1.5">
          {HOME_COLUMN_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => saveColumns(n)}
              className={cn(
                "h-9 w-9 rounded-lg border text-sm font-medium transition",
                columns === n ? "border-brand bg-brand text-black" : "border-line text-muted hover:border-brand/50 hover:text-brand",
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <span className="text-xs text-faint">(no celular sempre 2 e no tablet 3, para o disco não ficar minúsculo)</span>
      </div>

      {/* filtros — só para achar discos */}
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar disco ou artista…"
            className="w-full rounded-xl border border-line bg-panel py-2.5 pl-10 pr-4 text-sm text-ink outline-none focus:border-brand/50"
          />
        </div>

        {tags.length > 0 && (
          <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}
            className="rounded-xl border border-line bg-panel px-3 py-2.5 text-sm text-ink outline-none focus:border-brand/50" aria-label="Filtrar por etiqueta">
            <option value="">Todas as etiquetas</option>
            {tags.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        )}

        <select value={audioFilter} onChange={(e) => setAudioFilter(e.target.value as typeof audioFilter)}
          className="rounded-xl border border-line bg-panel px-3 py-2.5 text-sm text-ink outline-none focus:border-brand/50" aria-label="Filtrar por áudio">
          <option value="all">Áudio: todos</option>
          <option value="with">Com áudio enviado</option>
          <option value="without">Sem áudio</option>
        </select>

        <select value={coverFilter} onChange={(e) => setCoverFilter(e.target.value as typeof coverFilter)}
          className="rounded-xl border border-line bg-panel px-3 py-2.5 text-sm text-ink outline-none focus:border-brand/50" aria-label="Filtrar por capa">
          <option value="all">Capa: todas</option>
          <option value="with">Com capa</option>
          <option value="without">Sem capa</option>
        </select>

        <select value={viewSort} onChange={(e) => setViewSort(e.target.value as ViewSort)}
          className="rounded-xl border border-line bg-panel px-3 py-2.5 text-sm text-ink outline-none focus:border-brand/50" aria-label="Ordenar visualização">
          <option value="order">Ver na ordem da home</option>
          <option value="price_desc">Ver por maior preço</option>
          <option value="price_asc">Ver por menor preço</option>
          <option value="artist">Ver por artista (A–Z)</option>
        </select>

        {(filtersOn || viewSort !== "order") && (
          <button
            onClick={() => { setQ(""); setTagFilter(""); setAudioFilter("all"); setCoverFilter("all"); setViewSort("order"); }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2.5 text-sm text-muted hover:text-brand"
          >
            <X size={15} /> Limpar
          </button>
        )}
      </div>

      {!canDrop && (
        <p className="mb-4 flex items-start gap-2 rounded-xl border border-brand/25 bg-brand/5 p-3 text-sm text-mist">
          <Info size={16} className="mt-0.5 shrink-0 text-brand" />
          Você está vendo numa ordem diferente da home, então <strong className="text-ink">&ldquo;Soltar aqui&rdquo; fica desativado</strong> (a posição seria enganosa).
          O campo <strong className="text-ink">#</strong> e os botões Topo/Fim continuam funcionando. Volte para
          &ldquo;Ver na ordem da home&rdquo; para arrastar posições.
        </p>
      )}

      <p className="mb-3 text-sm text-muted">
        <span className="font-semibold text-ink">{items.length}</span> discos
        {filtered.length !== items.length && <span className="text-faint"> · {filtered.length} no filtro</span>}
        {pageCount > 1 && <span className="text-faint"> · página {safePage} de {pageCount}</span>}
      </p>

      {loading ? (
        <p className="text-muted">Carregando o acervo…</p>
      ) : (
        <>
          <div className={cn("grid gap-4", homeGridClass(columns))}>
            {pageItems.map((r) => {
              const pos = (indexById.get(r.id) ?? 0) + 1;
              const isPicked = picked === r.id;
              return (
                <div
                  key={r.id}
                  className={cn(
                    "group relative flex flex-col items-center rounded-2xl border bg-panel p-3 transition",
                    isPicked ? "border-brand ring-2 ring-brand" : "border-line",
                  )}
                >
                  <span className="absolute left-2 top-2 z-10 flex h-6 min-w-6 items-center justify-center rounded-full bg-black/70 px-1.5 text-xs font-bold text-brand">
                    {pos}
                  </span>

                  <div className="pointer-events-none aspect-square w-full">
                    <Vinyl config={r.disc_config} coverUrl={r.cover_image_url} interactive={false} noNeedle title={r.title} />
                  </div>

                  <p className="mt-2 line-clamp-1 w-full text-center text-sm text-ink">{r.title}</p>
                  <p className="line-clamp-1 w-full text-center text-xs text-muted">{r.artist}</p>
                  <p className="text-xs text-brand">{formatBRL(r.price ?? 0)}</p>

                  {/* marcadores de áudio/capa */}
                  <div className="mt-1 flex gap-1.5 text-[10px] text-faint">
                    {audioIds.has(r.id) && <span className="inline-flex items-center gap-0.5 text-teal"><Music size={11} /> áudio</span>}
                    {r.cover_image_url && <span className="inline-flex items-center gap-0.5"><ImageIcon size={11} /> capa</span>}
                  </div>

                  {/* ações */}
                  <div className="mt-2 flex w-full flex-wrap items-center justify-center gap-1">
                    {picked && !isPicked ? (
                      <button
                        onClick={() => dropOn(r.id)}
                        disabled={!canDrop}
                        className="inline-flex items-center gap-1 rounded-lg border border-brand bg-brand/15 px-2 py-1.5 text-xs font-medium text-brand disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <CornerDownLeft size={12} /> Soltar aqui
                      </button>
                    ) : (
                      <button
                        onClick={() => setPicked(isPicked ? null : r.id)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs transition",
                          isPicked ? "border-brand bg-brand text-black" : "border-line text-muted hover:border-brand/50 hover:text-brand",
                        )}
                      >
                        <Hand size={12} /> {isPicked ? "Cancelar" : "Mover"}
                      </button>
                    )}

                    <button onClick={() => moveTo(r.id, 0)} title="Mandar para o topo"
                      className="rounded-lg border border-line p-1.5 text-muted hover:border-brand/50 hover:text-brand">
                      <ChevronsUp size={13} />
                    </button>
                    <button onClick={() => moveTo(r.id, items.length - 1)} title="Mandar para o fim"
                      className="rounded-lg border border-line p-1.5 text-muted hover:border-brand/50 hover:text-brand">
                      <ChevronsDown size={13} />
                    </button>

                    <input
                      type="number"
                      min={1}
                      max={items.length}
                      placeholder="#"
                      title="Digite a posição e tecle Enter"
                      onKeyDown={(e) => {
                        if (e.key !== "Enter") return;
                        const n = parseInt((e.target as HTMLInputElement).value, 10);
                        if (!Number.isNaN(n)) moveTo(r.id, n - 1);
                        (e.target as HTMLInputElement).value = "";
                      }}
                      className="h-7 w-14 rounded-lg border border-line bg-bg-soft px-1.5 text-center text-xs text-ink outline-none focus:border-brand/50"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {pageCount > 1 && (
            <nav className="mt-8 flex flex-wrap items-center justify-center gap-1.5" aria-label="Paginação">
              <button onClick={() => setPage(Math.max(1, safePage - 1))} disabled={safePage === 1}
                className="flex h-9 items-center gap-1 rounded-lg border border-line px-3 text-sm text-muted transition hover:border-brand/50 hover:text-brand disabled:cursor-not-allowed disabled:opacity-40">
                <ChevronLeft size={16} /> <span className="hidden sm:inline">Anterior</span>
              </button>
              {pageList(safePage, pageCount).map((p, i) =>
                p === "…" ? (
                  <span key={`gap-${i}`} className="px-1.5 text-faint">…</span>
                ) : (
                  <button key={p} onClick={() => setPage(p)} aria-current={p === safePage ? "page" : undefined}
                    className={cn("h-9 min-w-9 rounded-lg border px-2 text-sm font-medium transition",
                      p === safePage ? "border-brand bg-brand text-black" : "border-line text-muted hover:border-brand/50 hover:text-brand")}>
                    {p}
                  </button>
                ),
              )}
              <button onClick={() => setPage(Math.min(pageCount, safePage + 1))} disabled={safePage === pageCount}
                className="flex h-9 items-center gap-1 rounded-lg border border-line px-3 text-sm text-muted transition hover:border-brand/50 hover:text-brand disabled:cursor-not-allowed disabled:opacity-40">
                <span className="hidden sm:inline">Próxima</span> <ChevronRight size={16} />
              </button>
            </nav>
          )}
        </>
      )}

      {/* barra fixa do disco "na mão" */}
      {pickedRec && (
        <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-brand/50 bg-panel/95 px-4 py-3 shadow-2xl backdrop-blur">
          <Hand size={16} className="text-brand" />
          <span className="max-w-[46vw] truncate text-sm text-ink">
            Movendo <strong>{pickedRec.title}</strong>
            <span className="text-muted"> — {pickedRec.artist}</span>
          </span>
          <button onClick={() => { moveTo(pickedRec.id, 0); setPicked(null); }}
            className="rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:border-brand/50 hover:text-brand">
            Para o topo
          </button>
          <button onClick={() => setPicked(null)} className="rounded-lg p-1.5 text-faint hover:text-red-400" aria-label="Cancelar">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
