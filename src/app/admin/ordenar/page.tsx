"use client";

import { useEffect, useState } from "react";
import { GripVertical, Save, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatBRL } from "@/lib/utils";
import type { RecordItem } from "@/lib/types";

export default function AdminOrdenarPage() {
  const [items, setItems] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("records")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems((data as RecordItem[]) ?? []);
        setLoading(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function reorder(from: string, to: string) {
    setItems((list) => {
      const arr = [...list];
      const fi = arr.findIndex((x) => x.id === from);
      const ti = arr.findIndex((x) => x.id === to);
      if (fi === -1 || ti === -1) return arr;
      const [moved] = arr.splice(fi, 1);
      arr.splice(ti, 0, moved);
      return arr;
    });
  }

  function move(id: string, dir: -1 | 1) {
    setItems((list) => {
      const arr = [...list];
      const i = arr.findIndex((x) => x.id === id);
      const j = i + dir;
      if (j < 0 || j >= arr.length) return arr;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr;
    });
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    // grava sort_order = posição
    await Promise.all(
      items.map((r, i) => supabase.from("records").update({ sort_order: i }).eq("id", r.id)),
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Ordenar discos da home</h1>
          <p className="text-muted">Arraste (ou use as setas) e salve. O topo aparece primeiro na loja.</p>
        </div>
        <button onClick={save} disabled={saving || loading} className="btn-brand inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm disabled:opacity-60">
          {saving ? <Loader2 size={17} className="animate-spin" /> : saved ? <Check size={17} /> : <Save size={17} />}
          {saved ? "Ordem salva!" : "Salvar ordem"}
        </button>
      </div>

      {loading ? (
        <p className="text-muted">Carregando…</p>
      ) : (
        <ul className="space-y-2">
          {items.map((r, i) => (
            <li
              key={r.id}
              draggable
              onDragStart={() => setDragId(r.id)}
              onDragOver={(e) => { e.preventDefault(); if (dragId && dragId !== r.id) reorder(dragId, r.id); }}
              onDragEnd={() => setDragId(null)}
              className={`flex items-center gap-3 rounded-xl border border-line bg-panel p-3 ${dragId === r.id ? "opacity-50" : ""}`}
            >
              <GripVertical size={18} className="cursor-grab text-faint" />
              <span className="w-6 text-center font-display text-lg text-faint">{i + 1}</span>
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-line bg-black">
                {r.cover_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.cover_image_url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{r.title}</p>
                <p className="truncate text-xs text-muted">{r.artist}</p>
              </div>
              <span className="hidden text-sm text-brand sm:block">{formatBRL(r.price)}</span>
              <div className="flex flex-col">
                <button onClick={() => move(r.id, -1)} className="px-2 text-muted hover:text-brand" aria-label="Subir">▲</button>
                <button onClick={() => move(r.id, 1)} className="px-2 text-muted hover:text-brand" aria-label="Descer">▼</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
