"use client";

import { useEffect, useState } from "react";
import { Save, Loader2, Check, GripVertical } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAction } from "@/lib/audit";
import { formatBRL } from "@/lib/utils";
import Vinyl from "@/components/Vinyl";
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
      if (fi === -1 || ti === -1 || fi === ti) return arr;
      const [moved] = arr.splice(fi, 1);
      arr.splice(ti, 0, moved);
      return arr;
    });
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    await Promise.all(items.map((r, i) => supabase.from("records").update({ sort_order: i }).eq("id", r.id)));
    logAction("reorder", "order", null, "Ordem dos discos da home", { total: items.length, ordem: items.slice(0, 8).map((r) => r.title) });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Ordenar discos da home</h1>
          <p className="text-muted">Arraste os discos para reposicionar (como aparecem na home) e salve.</p>
        </div>
        <button onClick={save} disabled={saving || loading} className="btn-brand inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm disabled:opacity-60">
          {saving ? <Loader2 size={17} className="animate-spin" /> : saved ? <Check size={17} /> : <Save size={17} />}
          {saved ? "Ordem salva!" : "Salvar ordem"}
        </button>
      </div>

      {loading ? (
        <p className="text-muted">Carregando…</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((r, i) => (
            <div
              key={r.id}
              draggable
              onDragStart={() => setDragId(r.id)}
              onDragOver={(e) => { e.preventDefault(); if (dragId && dragId !== r.id) reorder(dragId, r.id); }}
              onDragEnd={() => setDragId(null)}
              className={`group relative flex cursor-grab flex-col items-center rounded-2xl border border-line bg-panel p-3 active:cursor-grabbing ${dragId === r.id ? "opacity-40 ring-2 ring-brand" : ""}`}
            >
              <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs font-bold text-brand">{i + 1}</span>
              <GripVertical size={16} className="absolute right-2 top-2 text-faint opacity-0 group-hover:opacity-100" />
              <div className="pointer-events-none aspect-square w-full">
                <Vinyl config={r.disc_config} coverUrl={r.cover_image_url} interactive={false} noNeedle title={r.title} />
              </div>
              <p className="mt-2 line-clamp-1 w-full text-center text-sm text-ink">{r.title}</p>
              <p className="line-clamp-1 w-full text-center text-xs text-muted">{r.artist}</p>
              <p className="text-xs text-brand">{formatBRL(r.price)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
