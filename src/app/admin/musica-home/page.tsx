"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Save, Search, Plus, Check, Music, Disc3 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAction } from "@/lib/audit";
import TagBadge from "@/components/TagBadge";
import AudioTrimmer from "@/components/admin/AudioTrimmer";
import { cn } from "@/lib/utils";
import type { Tag, Track } from "@/lib/types";

type Rec = {
  id: string;
  title: string;
  artist: string;
  cover_image_url: string | null;
  tracks: Track[];
  audio_url: string | null;
};

export default function MusicaHomePage() {
  const supabase = createClient();

  const [records, setRecords] = useState<Rec[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [homeRecordId, setHomeRecordId] = useState<string | null>(null);
  const [homeTrackId, setHomeTrackId] = useState<string | null>(null);
  const [homeTagId, setHomeTagId] = useState<string | null>(null);
  const [trackStart, setTrackStart] = useState(0);
  const [trackEnd, setTrackEnd] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [newLabel, setNewLabel] = useState("");
  const [newBg, setNewBg] = useState("#ff9d2e");
  const [newFg, setNewFg] = useState("#241304");
  const [creatingTag, setCreatingTag] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: recs }, { data: tg }, { data: settings }] = await Promise.all([
        supabase.from("records").select("id,title,artist,cover_image_url,tracks,audio_url").order("created_at", { ascending: false }),
        supabase.from("tags").select("*").order("created_at"),
        supabase.from("site_settings").select("*").eq("id", "main").single(),
      ]);
      setRecords((recs as Rec[]) ?? []);
      setTags((tg as Tag[]) ?? []);
      if (settings) {
        setHomeRecordId(settings.home_record_id ?? null);
        setHomeTrackId(settings.home_track_id ?? null);
        setHomeTagId(settings.home_tag_id ?? null);
        setTrackStart(Number(settings.home_track_start ?? 0));
        setTrackEnd(settings.home_track_end != null ? Number(settings.home_track_end) : null);
      }
      setLoading(false);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = useMemo(() => {
    const r = records.find((x) => x.id === homeRecordId);
    const t = r?.tracks?.find((x) => x.id === homeTrackId);
    return { r, t };
  }, [records, homeRecordId, homeTrackId]);

  async function save() {
    setSaving(true);
    setSaved(false);
    await supabase
      .from("site_settings")
      .update({ home_record_id: homeRecordId, home_track_id: homeTrackId, home_tag_id: homeTagId, home_track_start: trackStart, home_track_end: trackEnd, updated_at: new Date().toISOString() })
      .eq("id", "main");
    logAction("home_music", "musica_home", homeRecordId, selected.r?.title ?? null, { faixa: selected.t?.title ?? null });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function createTag() {
    if (!newLabel.trim()) return;
    setCreatingTag(true);
    const { data } = await supabase.from("tags").insert({ label: newLabel.trim(), bg: newBg, fg: newFg, style: "solid" }).select().single();
    if (data) {
      setTags((t) => [...t, data as Tag]);
      setNewLabel("");
    }
    setCreatingTag(false);
  }

  const filtered = records.filter((r) => `${r.title} ${r.artist}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Música da home</h1>
          <p className="text-muted">Escolha a faixa que toca no mini-player em cima do disco Neblina, e a etiqueta que aparece nele.</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-brand inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm disabled:opacity-60">
          {saving ? <Loader2 size={17} className="animate-spin" /> : saved ? <Check size={17} /> : <Save size={17} />}
          {saved ? "Salvo!" : "Salvar"}
        </button>
      </div>

      {/* seleção atual */}
      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-brand/30 bg-brand/10 p-4">
        <Music size={18} className="text-brand" />
        {selected.r && selected.t ? (
          <p className="text-sm text-ink">
            Tocando na home: <strong>{selected.t.title}</strong> · {selected.r.title} — {selected.r.artist}
            {!selected.t.audio_url && <span className="ml-2 text-red-400">(essa faixa está sem áudio)</span>}
          </p>
        ) : (
          <p className="text-sm text-muted">Nenhuma música escolhida ainda.</p>
        )}
      </div>

      {/* recorte do trecho da faixa escolhida */}
      {selected.t?.audio_url && (
        <div className="mb-6 max-w-2xl">
          <p className="mb-2 text-sm text-muted">Escolha o trecho da faixa que vai tocar no mini-player da home:</p>
          <AudioTrimmer key={homeTrackId} url={selected.t.audio_url} start={trackStart} end={trackEnd} onChange={({ start, end }) => { setTrackStart(start); setTrackEnd(end); }} />
        </div>
      )}

      {loading ? (
        <p className="text-muted">Carregando…</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* lista de discos + faixas */}
          <div>
            <div className="relative mb-4">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar disco ou artista…"
                className="w-full rounded-xl border border-line bg-panel py-3 pl-11 pr-4 text-sm text-ink outline-none placeholder:text-faint focus:border-brand/60"
              />
            </div>

            <div className="space-y-3">
              {filtered.map((r) => {
                const tracks = r.tracks ?? [];
                return (
                  <div key={r.id} className={cn("rounded-2xl border p-4", homeRecordId === r.id ? "border-brand/50 bg-brand/5" : "border-line bg-panel")}>
                    <div className="mb-3 flex items-center gap-3">
                      {r.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.cover_image_url} alt="" className="h-11 w-11 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-bg-soft text-faint"><Disc3 size={18} /></div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-display text-ink">{r.title}</p>
                        <p className="truncate text-xs text-muted">{r.artist}</p>
                      </div>
                    </div>
                    {tracks.length === 0 ? (
                      <p className="text-xs text-faint">Sem faixas cadastradas.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {tracks.map((t) => {
                          const on = homeRecordId === r.id && homeTrackId === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => { if (homeTrackId !== t.id) { setTrackStart(0); setTrackEnd(null); } setHomeRecordId(r.id); setHomeTrackId(t.id); }}
                              className={cn(
                                "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
                                on ? "border-brand bg-brand/15 text-brand" : "border-line text-muted hover:text-ink",
                                !t.audio_url && "opacity-60",
                              )}
                              title={t.audio_url ? "" : "Sem áudio — envie na edição do disco"}
                            >
                              {on && <Check size={12} />}
                              <span className="font-semibold">{t.side}</span> {t.title}
                              {!t.audio_url && <span className="text-[10px] text-faint">(sem áudio)</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              {filtered.length === 0 && <p className="text-sm text-faint">Nenhum disco encontrado.</p>}
            </div>
          </div>

          {/* etiqueta do mini-player + criar etiqueta */}
          <div className="space-y-6">
            <div className="card p-5">
              <h2 className="mb-1 font-display text-lg text-ink">Etiqueta do mini-player</h2>
              <p className="mb-3 text-xs text-muted">Aparece em cima do mini-player na home.</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setHomeTagId(null)}
                  className={cn("rounded-full border px-3 py-1.5 text-xs", homeTagId === null ? "border-brand bg-brand/15 text-brand" : "border-line text-muted hover:text-ink")}
                >
                  Nenhuma
                </button>
                {tags.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setHomeTagId(t.id)}
                    className={cn("rounded-full transition", homeTagId === t.id ? "ring-2 ring-brand" : "opacity-80 hover:opacity-100")}
                  >
                    <TagBadge tag={t} size="md" />
                  </button>
                ))}
                {tags.length === 0 && <p className="text-xs text-faint">Nenhuma etiqueta criada ainda.</p>}
              </div>
            </div>

            <div className="card p-5">
              <h2 className="mb-1 font-display text-lg text-ink">Criar etiqueta</h2>
              <p className="mb-3 text-xs text-muted">Ex.: 50% OFF, Promoção da Semana.</p>
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Texto da etiqueta"
                className="mb-3 w-full rounded-lg border border-line bg-bg-soft px-3 py-2 text-sm text-ink outline-none focus:border-brand/60"
              />
              <div className="mb-3 flex items-center gap-4">
                <label className="flex items-center gap-1.5 text-xs text-muted">
                  Fundo <input type="color" value={newBg} onChange={(e) => setNewBg(e.target.value)} className="h-7 w-9 rounded border border-line bg-transparent" />
                </label>
                <label className="flex items-center gap-1.5 text-xs text-muted">
                  Texto <input type="color" value={newFg} onChange={(e) => setNewFg(e.target.value)} className="h-7 w-9 rounded border border-line bg-transparent" />
                </label>
                {newLabel.trim() && <TagBadge tag={{ id: "preview", label: newLabel, bg: newBg, fg: newFg, style: "solid" }} size="md" />}
              </div>
              <button
                onClick={createTag}
                disabled={creatingTag || !newLabel.trim()}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-brand/40 bg-brand/10 px-3 py-2 text-sm font-semibold text-brand hover:bg-brand/15 disabled:opacity-50"
              >
                {creatingTag ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Criar etiqueta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
