"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Save, Loader2, Disc3, Search, X, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import TagBadge from "@/components/TagBadge";
import { TAG_PRESETS } from "@/lib/constants";
import type { Tag } from "@/lib/types";

type DiscRow = {
  id: string;
  title: string;
  artist: string;
  cover_image_url: string | null;
  tag_ids: string[] | null;
  is_published: boolean;
};

const STYLES = [
  { id: "solid", label: "Sólido" },
  { id: "outline", label: "Contorno" },
  { id: "glow", label: "Brilho" },
];

const FONTS = [
  { id: "sans", label: "Padrão" },
  { id: "display", label: "Display" },
  { id: "serif", label: "Serifada" },
  { id: "mono", label: "Mono" },
];

const SIZES = [
  { id: "sm", label: "Pequena" },
  { id: "md", label: "Média" },
  { id: "lg", label: "Grande" },
];

export default function AdminTagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // atribuição em massa (aplicar uma tag em vários discos)
  const [discs, setDiscs] = useState<DiscRow[]>([]);
  const [assignFor, setAssignFor] = useState<Tag | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [savingAssign, setSavingAssign] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    supabase.from("tags").select("*").order("created_at").then(({ data }) => {
      setTags((data as Tag[]) ?? []);
      setLoading(false);
    });
    supabase
      .from("records")
      .select("id,title,artist,cover_image_url,tag_ids,is_published")
      .order("created_at", { ascending: false })
      .then(({ data }) => setDiscs((data as DiscRow[]) ?? []));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // quantos discos usam cada tag
  const countByTag = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of discs) for (const id of d.tag_ids ?? []) m.set(id, (m.get(id) ?? 0) + 1);
    return m;
  }, [discs]);

  function openAssign(tag: Tag) {
    setAssignFor(tag);
    setSearch("");
    setSelected(new Set(discs.filter((d) => (d.tag_ids ?? []).includes(tag.id)).map((d) => d.id)));
  }

  function toggleDisc(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filteredDiscs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return discs;
    return discs.filter((d) => `${d.title} ${d.artist}`.toLowerCase().includes(q));
  }, [discs, search]);

  async function saveAssign() {
    if (!assignFor) return;
    setSavingAssign(true);
    const tagId = assignFor.id;
    const updates: { id: string; tag_ids: string[] }[] = [];
    const next = discs.map((d) => {
      const has = (d.tag_ids ?? []).includes(tagId);
      const want = selected.has(d.id);
      if (has === want) return d;
      const tag_ids = want ? [...(d.tag_ids ?? []), tagId] : (d.tag_ids ?? []).filter((x) => x !== tagId);
      updates.push({ id: d.id, tag_ids });
      return { ...d, tag_ids };
    });
    // aplica no banco só os discos que mudaram
    const results = await Promise.all(
      updates.map((u) => supabase.from("records").update({ tag_ids: u.tag_ids }).eq("id", u.id)),
    );
    const failed = results.filter((r) => r.error).length;
    setSavingAssign(false);
    if (failed > 0) {
      alert(`Não consegui salvar ${failed} disco(s). Tente de novo.`);
      return;
    }
    setDiscs(next);
    setAssignFor(null);
  }

  async function addTag(preset?: (typeof TAG_PRESETS)[number]) {
    const { data } = await supabase
      .from("tags")
      .insert({
        label: preset?.label ?? "Nova tag",
        bg: preset?.bg ?? "#ff9d2e",
        fg: preset?.fg ?? "#241304",
        style: "solid",
        font: "sans",
        size: "sm",
      })
      .select()
      .single();
    if (data) setTags((t) => [...t, data as Tag]);
  }

  async function saveTag(tag: Tag) {
    setSavingId(tag.id);
    await supabase.from("tags").update({ label: tag.label, bg: tag.bg, fg: tag.fg, style: tag.style, font: tag.font ?? "sans", size: tag.size ?? "sm" }).eq("id", tag.id);
    setSavingId(null);
  }

  async function removeTag(id: string) {
    if (!confirm("Excluir esta tag?")) return;
    await supabase.from("tags").delete().eq("id", id);
    setTags((t) => t.filter((x) => x.id !== id));
  }

  function patch(id: string, p: Partial<Tag>) {
    setTags((t) => t.map((x) => (x.id === id ? { ...x, ...p } : x)));
  }

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Etiquetas (tags)</h1>
          <p className="text-muted">Aparecem em cima dos discos na home e permitem filtrar.</p>
        </div>
        <button onClick={() => addTag()} className="btn-brand inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm">
          <Plus size={17} /> Nova tag
        </button>
      </div>

      {/* presets rápidos */}
      <div className="mb-6 flex flex-wrap gap-2">
        <span className="self-center text-xs text-faint">Sugestões:</span>
        {TAG_PRESETS.map((p) => (
          <button key={p.id} onClick={() => addTag(p)} className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: p.bg, color: p.fg }}>
            + {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted">Carregando…</p>
      ) : tags.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line py-16 text-center text-muted">Nenhuma tag ainda. Crie a primeira.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {tags.map((t) => (
            <div key={t.id} className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              {/* prévia de como fica na home (etiqueta em cima do disco) */}
              <div className="shrink-0 self-center">
                <div className="relative h-28 w-28 rounded-full vinyl-grooves">
                  <div className="absolute left-1/2 top-1/2 h-[42%] w-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand" />
                  <div className="absolute left-1/2 top-1/2 h-[4%] w-[4%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-black" />
                  <div className="absolute left-1/2 top-1 -translate-x-1/2">
                    <TagBadge tag={t} />
                  </div>
                </div>
                <p className="mt-1.5 text-center text-[10px] text-faint">Prévia na home</p>
              </div>

              <div className="flex-1 space-y-3">
                <input
                  className="ipt-tag w-full" value={t.label}
                  onChange={(e) => patch(t.id, { label: e.target.value })}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-muted">
                    Fundo <input type="color" value={t.bg} onChange={(e) => patch(t.id, { bg: e.target.value })} className="h-7 w-9 rounded border border-line bg-transparent" />
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-muted">
                    Texto <input type="color" value={t.fg} onChange={(e) => patch(t.id, { fg: e.target.value })} className="h-7 w-9 rounded border border-line bg-transparent" />
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-muted">
                    Estilo
                    <select value={t.style} onChange={(e) => patch(t.id, { style: e.target.value })} className="rounded-lg border border-line bg-bg-soft px-2 py-1.5 text-xs text-ink">
                      {STYLES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-muted">
                    Fonte
                    <select value={t.font ?? "sans"} onChange={(e) => patch(t.id, { font: e.target.value })} className="rounded-lg border border-line bg-bg-soft px-2 py-1.5 text-xs text-ink">
                      {FONTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-muted">
                    Tamanho
                    <select value={t.size ?? "sm"} onChange={(e) => patch(t.id, { size: e.target.value })} className="rounded-lg border border-line bg-bg-soft px-2 py-1.5 text-xs text-ink">
                      {SIZES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => saveTag(t)} className="btn-brand flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs">
                    {savingId === t.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Salvar
                  </button>
                  <button
                    onClick={() => openAssign(t)}
                    className="flex items-center gap-1.5 rounded-lg border border-brand/40 bg-brand/10 px-3 py-2 text-xs font-medium text-brand hover:bg-brand/20"
                  >
                    <Disc3 size={14} /> Adicionar no disco
                    <span className="ml-0.5 rounded-full bg-brand/20 px-1.5 text-[10px]">{countByTag.get(t.id) ?? 0}</span>
                  </button>
                  <button onClick={() => removeTag(t.id)} className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs text-muted hover:text-red-400">
                    <Trash2 size={14} /> Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* modal: aplicar a tag em vários discos de uma vez */}
      {assignFor && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAssignFor(null)} />
          <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl">
            {/* header */}
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="text-sm text-muted">Aplicar</span>
                <TagBadge tag={assignFor} size="md" />
                <span className="text-sm text-muted">nos discos:</span>
              </div>
              <button onClick={() => setAssignFor(null)} className="rounded-lg p-1 text-muted hover:bg-panel-2 hover:text-ink">
                <X size={20} />
              </button>
            </div>

            {/* busca + ações */}
            <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
              <div className="relative min-w-[180px] flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar disco por título ou artista…"
                  className="w-full rounded-lg border border-line bg-bg-soft py-2 pl-9 pr-3 text-sm text-ink outline-none focus:border-brand/60"
                />
              </div>
              <button
                onClick={() => setSelected((prev) => { const n = new Set(prev); filteredDiscs.forEach((d) => n.add(d.id)); return n; })}
                className="rounded-lg border border-line px-3 py-2 text-xs text-muted hover:text-ink"
              >
                Selecionar todos
              </button>
              <button
                onClick={() => setSelected((prev) => { const n = new Set(prev); filteredDiscs.forEach((d) => n.delete(d.id)); return n; })}
                className="rounded-lg border border-line px-3 py-2 text-xs text-muted hover:text-ink"
              >
                Limpar
              </button>
            </div>

            {/* lista de discos */}
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
              {filteredDiscs.length === 0 ? (
                <p className="py-10 text-center text-sm text-faint">Nenhum disco encontrado.</p>
              ) : (
                <ul className="space-y-1">
                  {filteredDiscs.map((d) => {
                    const on = selected.has(d.id);
                    return (
                      <li key={d.id}>
                        <button
                          onClick={() => toggleDisc(d.id)}
                          className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors ${on ? "border-brand/60 bg-brand/10" : "border-transparent hover:bg-bg-soft"}`}
                        >
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${on ? "border-brand bg-brand text-black" : "border-line"}`}>
                            {on && <Check size={13} />}
                          </span>
                          <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-line bg-black">
                            {d.cover_image_url && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={d.cover_image_url} alt="" className="h-full w-full object-cover" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm text-ink">{d.title}</span>
                            <span className="block truncate text-xs text-muted">{d.artist}</span>
                          </span>
                          {!d.is_published && <span className="shrink-0 rounded-full bg-bg-soft px-2 py-0.5 text-[10px] text-faint">rascunho</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* footer */}
            <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4">
              <span className="text-sm text-muted">{selected.size} disco(s) selecionado(s)</span>
              <div className="flex gap-2">
                <button onClick={() => setAssignFor(null)} className="rounded-lg border border-line px-4 py-2 text-sm text-muted hover:text-ink">
                  Cancelar
                </button>
                <button onClick={saveAssign} disabled={savingAssign} className="btn-brand flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm disabled:opacity-60">
                  {savingAssign ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .ipt-tag {
          border-radius: 0.6rem; border: 1px solid var(--color-line);
          background: var(--color-bg-soft); padding: 0.5rem 0.7rem; font-size: 0.9rem;
          color: var(--color-ink); outline: none;
        }
        .ipt-tag:focus { border-color: color-mix(in srgb, var(--color-brand) 55%, transparent); }
      `}</style>
    </div>
  );
}
