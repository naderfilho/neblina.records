"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Disc3, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/** Disco de um box (o que carregamos do banco para listar). */
export type BoxDiscInit = { id: string; title: string; artist: string; cover_image_url: string | null; audio_url: string | null };

/**
 * Gerencia os discos de um box JÁ SALVO. Os discos são registros box_only e usam
 * o cadastro COMPLETO (RecordForm) em páginas próprias — aqui é só a lista, a
 * ordem (position no box_records), adicionar/editar (links) e remover.
 */
export default function BoxDiscsManager({ boxId, discs: initial }: { boxId: string; discs: BoxDiscInit[] }) {
  const router = useRouter();
  const [discs, setDiscs] = useState<BoxDiscInit[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);

  async function persistOrder(next: BoxDiscInit[]) {
    const supabase = createClient();
    await Promise.all(
      next.map((d, i) => supabase.from("box_records").update({ position: i }).eq("box_id", boxId).eq("record_id", d.id)),
    );
  }

  async function move(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= discs.length || busy) return;
    const next = [...discs];
    [next[idx], next[j]] = [next[j], next[idx]];
    setDiscs(next);
    setBusy("order");
    await persistOrder(next);
    setBusy(null);
    router.refresh();
  }

  async function remove(d: BoxDiscInit) {
    if (!confirm(`Remover o disco "${d.title}" do box? Ele será apagado (é exclusivo do box).`)) return;
    setBusy(d.id);
    const supabase = createClient();
    // box_records cai por ON DELETE CASCADE ao apagar o registro do disco
    await supabase.from("records").delete().eq("id", d.id);
    const next = discs.filter((x) => x.id !== d.id);
    setDiscs(next);
    await persistOrder(next);
    setBusy(null);
    router.refresh();
  }

  return (
    <section className="card p-6">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl text-ink">
          Discos do box <span className="text-sm font-normal text-faint">({discs.length})</span>
        </h2>
        <Link href={`/admin/boxes/${boxId}/discos/novo`} className="btn-brand inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm">
          <Plus size={16} /> Adicionar disco
        </Link>
      </div>
      <p className="mb-4 text-sm text-muted">
        Cada disco é exclusivo do box e usa o <strong className="text-ink">cadastro completo</strong> (mesmos campos, tipos e
        personalização de um disco normal). A ordem define a sequência na abertura e na Audioteca.
      </p>

      {discs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line py-8 text-center text-sm text-faint">
          Nenhum disco ainda. Clique em “Adicionar disco”.
        </p>
      ) : (
        <div className="space-y-2">
          {discs.map((d, i) => (
            <div key={d.id} className="flex items-center gap-3 rounded-2xl border border-line bg-bg-soft p-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-line bg-panel">
                {d.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.cover_image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-faint"><Disc3 size={20} /></span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{d.title || "Sem título"}</p>
                <p className="truncate text-xs text-muted">{d.artist}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0 || !!busy} className="rounded-lg p-2 text-faint hover:text-brand disabled:opacity-30" title="Subir"><ArrowUp size={15} /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === discs.length - 1 || !!busy} className="rounded-lg p-2 text-faint hover:text-brand disabled:opacity-30" title="Descer"><ArrowDown size={15} /></button>
                <Link href={`/admin/boxes/${boxId}/discos/${d.id}`} className="rounded-lg p-2 text-muted hover:text-brand" title="Editar"><Pencil size={15} /></Link>
                <button type="button" onClick={() => remove(d)} disabled={busy === d.id} className="rounded-lg p-2 text-muted hover:text-red-400 disabled:opacity-40" title="Remover">
                  {busy === d.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
