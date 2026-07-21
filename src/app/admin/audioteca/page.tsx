"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Disc3, Check, HelpCircle, Loader2, Info, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fetchAllRange } from "@/lib/fetchAllRange";
import { logAction } from "@/lib/audit";
import { AUDIOTECA_TIERS, type AudiotecaTier } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Rec = {
  id: string;
  title: string;
  artist: string;
  cover_image_url: string | null;
  audioteca_tier: AudiotecaTier;
  audioCount: number; // nº de faixas COM áudio
};

const PER_PAGE = 100;
function pageList(current: number, total: number): (number | "…")[] {
  const out: (number | "…")[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) out.push(i);
    else if (out[out.length - 1] !== "…") out.push("…");
  }
  return out;
}

export default function AdminAudiotecaPage() {
  const supabase = createClient();
  const [records, setRecords] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [audioFilter, setAudioFilter] = useState<"all" | "with" | "without">("all");

  useEffect(() => {
    (async () => {
      // busca TODO o acervo (paginado — o PostgREST corta em 1000)
      const data = await fetchAllRange<Omit<Rec, "audioCount"> & { tracks: { audio_url?: string | null }[] | null }>(
        (from, to) =>
          supabase.from("records").select("id,title,artist,cover_image_url,audioteca_tier,tracks")
            .order("created_at", { ascending: false }).order("id").range(from, to),
      );
      const rows = data.map((r) => ({
        id: r.id, title: r.title, artist: r.artist, cover_image_url: r.cover_image_url,
        audioteca_tier: r.audioteca_tier,
        audioCount: Array.isArray(r.tracks) ? r.tracks.filter((t) => t.audio_url).length : 0,
      }));
      setRecords(rows);
      setLoading(false);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function setTier(id: string, tier: AudiotecaTier) {
    const rec = records.find((r) => r.id === id);
    setRecords((rs) => rs.map((r) => (r.id === id ? { ...r, audioteca_tier: tier } : r)));
    setSavingId(id);
    await supabase.from("records").update({ audioteca_tier: tier }).eq("id", id);
    logAction("tier", "audioteca", id, rec?.title ?? null, { nivel: tier });
    setSavingId(null);
  }

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return records
      .filter((r) => `${r.title} ${r.artist}`.toLowerCase().includes(term))
      .filter((r) => audioFilter === "all" || (audioFilter === "with" ? r.audioCount > 0 : r.audioCount === 0))
      // sempre os com áudio primeiro
      .sort((a, b) => (a.audioCount > 0 ? 0 : 1) - (b.audioCount > 0 ? 0 : 1));
  }, [records, q, audioFilter]);

  const withCount = records.filter((r) => r.audioCount > 0).length;
  const withoutCount = records.length - withCount;

  // paginação (100 por página) sobre o resultado filtrado
  const topRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const sig = `${q}|${audioFilter}`;
  const [prevSig, setPrevSig] = useState(sig);
  if (prevSig !== sig) { setPrevSig(sig); setPage(1); }
  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);
  function goTo(p: number) {
    setPage(Math.min(Math.max(1, p), pageCount));
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div ref={topRef} className="p-6 md:p-10">
      <div className="mb-2">
        <h1 className="font-display text-3xl text-ink">Audioteca</h1>
        <p className="text-muted">Defina o nível de acesso de cada disco na Audioteca. Os discos com áudio aparecem na estante, mas só ficam coloridos/tocáveis para quem tem acesso.</p>
      </div>

      {/* regra: só aparecem discos com faixas COM áudio */}
      <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-brand/25 bg-brand/5 p-3 text-sm text-mist">
        <Info size={16} className="mt-0.5 shrink-0 text-brand" />
        <p>
          <strong className="text-ink">Só aparecem na Audioteca discos com pelo menos uma faixa com áudio.</strong>{" "}
          Discos sem faixas ou com faixas ainda sem o áudio enviado não aparecem na estante. Envie o áudio das faixas na página de edição do disco para ele aparecer aqui.
        </p>
      </div>

      {/* legenda */}
      <div className="mb-6 flex flex-wrap gap-4 text-xs text-muted">
        {AUDIOTECA_TIERS.map((t) => (
          <span key={t.id} className="flex items-center gap-1.5">
            <span className={cn("h-2.5 w-2.5 rounded-full", t.id === "public" ? "bg-teal" : t.id === "members" ? "bg-brand" : "bg-purple-400")} />
            <strong className="text-ink">{t.label}</strong> — {t.desc}
          </span>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar disco…"
            className="w-full rounded-xl border border-line bg-panel py-2.5 pl-11 pr-4 text-sm text-ink outline-none placeholder:text-faint focus:border-brand/60" />
        </div>
        <div className="flex gap-1.5">
          {([
            ["all", `Todos (${records.length})`],
            ["with", `Com áudio (${withCount})`],
            ["without", `Sem áudio (${withoutCount})`],
          ] as const).map(([id, label]) => (
            <button key={id} type="button" onClick={() => setAudioFilter(id)}
              className={cn("rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                audioFilter === id ? "border-brand bg-brand/15 text-brand" : "border-line text-muted hover:text-ink")}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-muted">Carregando…</p>
      ) : (
        <div className="space-y-2">
          {pageCount > 1 && (
            <p className="pb-1 text-xs text-faint">{filtered.length} discos · página {safePage} de {pageCount}</p>
          )}
          {pageItems.map((r) => (
            <div key={r.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-3 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {r.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.cover_image_url} alt="" className="h-11 w-11 rounded-lg object-cover" />
                ) : <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-bg-soft text-faint"><Disc3 size={18} /></div>}
                <div className="min-w-0">
                  <p className="truncate font-display text-ink">{r.title}</p>
                  <p className="truncate text-xs text-muted">{r.artist}</p>
                  {r.audioCount === 0 && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-bg-soft px-1.5 py-0.5 text-[10px] font-medium text-faint">
                      <EyeOff size={11} /> sem áudio — não aparece na estante
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {AUDIOTECA_TIERS.map((t) => {
                  const on = r.audioteca_tier === t.id;
                  return (
                    <button key={t.id} onClick={() => setTier(r.id, t.id)}
                      title={t.desc}
                      className={cn("flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs transition-colors",
                        on ? "border-brand bg-brand/15 text-brand" : "border-line text-muted hover:text-ink")}>
                      {on && (savingId === r.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />)}
                      {t.short}
                      {t.id === "signature" && <HelpCircle size={12} className="text-faint" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-faint">Nenhum disco encontrado.</p>}

          {pageCount > 1 && (
            <nav className="mt-4 flex flex-wrap items-center justify-center gap-1.5" aria-label="Paginação">
              <button onClick={() => goTo(safePage - 1)} disabled={safePage === 1}
                className="flex h-9 items-center gap-1 rounded-lg border border-line px-3 text-sm text-muted transition hover:border-brand/50 hover:text-brand disabled:cursor-not-allowed disabled:opacity-40">
                <ChevronLeft size={16} /> <span className="hidden sm:inline">Anterior</span>
              </button>
              {pageList(safePage, pageCount).map((p, i) =>
                p === "…" ? (
                  <span key={`gap-${i}`} className="px-1.5 text-faint">…</span>
                ) : (
                  <button key={p} onClick={() => goTo(p)} aria-current={p === safePage ? "page" : undefined}
                    className={cn("h-9 min-w-9 rounded-lg border px-2 text-sm font-medium transition",
                      p === safePage ? "border-brand bg-brand text-black" : "border-line text-muted hover:border-brand/50 hover:text-brand")}>
                    {p}
                  </button>
                ),
              )}
              <button onClick={() => goTo(safePage + 1)} disabled={safePage === pageCount}
                className="flex h-9 items-center gap-1 rounded-lg border border-line px-3 text-sm text-muted transition hover:border-brand/50 hover:text-brand disabled:cursor-not-allowed disabled:opacity-40">
                <span className="hidden sm:inline">Próxima</span> <ChevronRight size={16} />
              </button>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}
