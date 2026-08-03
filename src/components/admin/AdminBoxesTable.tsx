"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Eye, EyeOff, Layers, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAction } from "@/lib/audit";
import { formatBRL } from "@/lib/utils";
import type { BoxSummary } from "@/lib/types";

export default function AdminBoxesTable({ boxes }: { boxes: BoxSummary[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = boxes.filter((b) => `${b.title} ${b.subtitle ?? ""} ${b.box_type ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  async function togglePublish(b: BoxSummary) {
    setBusy(b.id);
    const supabase = createClient();
    await supabase.from("boxes").update({ is_published: !b.is_published }).eq("id", b.id);
    logAction("update", "box", b.id, b.title, { publicado: !b.is_published });
    setBusy(null);
    router.refresh();
  }

  async function remove(b: BoxSummary) {
    if (!confirm(`Excluir o box "${b.title}"? Os discos vinculados NÃO são apagados.`)) return;
    setBusy(b.id);
    const supabase = createClient();
    await supabase.from("boxes").delete().eq("id", b.id);
    logAction("delete", "box", b.id, b.title, {});
    setBusy(null);
    router.refresh();
  }

  if (boxes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line py-20 text-center">
        <Package size={36} className="mx-auto mb-3 text-faint" />
        <p className="text-muted">Nenhum box cadastrado ainda.</p>
      </div>
    );
  }

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar box…"
        className="mb-4 w-full max-w-sm rounded-xl border border-line bg-panel px-4 py-2.5 text-sm text-ink outline-none focus:border-brand/60"
      />
      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full text-sm">
          <thead className="bg-bg-soft text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">Box</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Discos</th>
              <th className="px-4 py-3">Preço</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {b.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.cover_image_url} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-bg-soft text-faint"><Package size={16} /></span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{b.title}</p>
                      {b.subtitle && <p className="truncate text-xs text-muted">{b.subtitle}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{b.box_type ?? "—"}</td>
                <td className="px-4 py-3"><span className="flex items-center gap-1 text-muted"><Layers size={13} /> {b.disc_count}</span></td>
                <td className="px-4 py-3 text-brand">{formatBRL(b.price)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${b.is_published ? "bg-teal/15 text-teal" : "bg-panel-2 text-faint"}`}>
                    {b.is_published ? "Publicado" : "Rascunho"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/box/${b.id}`} target="_blank" className="rounded-lg p-2 text-muted hover:text-brand" title="Ver no site"><Eye size={15} /></Link>
                    <button onClick={() => togglePublish(b)} disabled={busy === b.id} className="rounded-lg p-2 text-muted hover:text-brand disabled:opacity-40" title={b.is_published ? "Despublicar" : "Publicar"}>
                      {b.is_published ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <Link href={`/admin/boxes/${b.id}`} className="rounded-lg p-2 text-muted hover:text-brand" title="Editar"><Pencil size={15} /></Link>
                    <button onClick={() => remove(b)} disabled={busy === b.id} className="rounded-lg p-2 text-muted hover:text-red-400 disabled:opacity-40" title="Excluir"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
