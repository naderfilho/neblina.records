"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Eye, EyeOff, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAction } from "@/lib/audit";
import { formatBRL } from "@/lib/utils";
import { AVAILABILITY } from "@/lib/constants";
import type { RecordItem } from "@/lib/types";

export default function AdminRecordsTable({ records }: { records: RecordItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(records);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = items.filter((r) =>
    `${r.title} ${r.artist} ${r.genre ?? ""}`.toLowerCase().includes(q.toLowerCase()),
  );

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
      <div className="relative mb-4 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar disco…"
          className="w-full rounded-xl border border-line bg-panel py-2.5 pl-10 pr-4 text-sm text-ink outline-none focus:border-brand/50"
        />
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
                    <Link href={`/admin/discos/${r.id}`} className="rounded-lg p-2 text-muted hover:bg-panel-2 hover:text-brand" aria-label="Editar">
                      <Pencil size={15} />
                    </Link>
                    <button onClick={() => remove(r)} disabled={busy === r.id} className="rounded-lg p-2 text-muted hover:bg-panel-2 hover:text-red-400" aria-label="Excluir">
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
