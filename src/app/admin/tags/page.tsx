"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import TagBadge from "@/components/TagBadge";
import { TAG_PRESETS } from "@/lib/constants";
import type { Tag } from "@/lib/types";

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

  const supabase = createClient();

  useEffect(() => {
    supabase.from("tags").select("*").order("created_at").then(({ data }) => {
      setTags((data as Tag[]) ?? []);
      setLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
                <div className="flex gap-2">
                  <button onClick={() => saveTag(t)} className="btn-brand flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs">
                    {savingId === t.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Salvar
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
