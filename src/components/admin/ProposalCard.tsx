"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone, MapPin, MessageCircle, Trash2, Loader2, Calendar, Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime, formatBRL, whatsappLink } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { SaleProposal } from "@/lib/types";

const STATUS: Record<string, { label: string; cls: string }> = {
  new: { label: "Nova", cls: "bg-brand/15 text-brand" },
  contacted: { label: "Em contato", cls: "bg-teal/15 text-teal" },
  done: { label: "Fechada", cls: "bg-emerald-500/15 text-emerald-300" },
  rejected: { label: "Recusada", cls: "bg-panel-2 text-faint" },
};

export default function ProposalCard({ p }: { p: SaleProposal }) {
  const router = useRouter();
  const [status, setStatus] = useState(p.status);
  const [busy, setBusy] = useState(false);

  async function changeStatus(s: string) {
    setBusy(true);
    const supabase = createClient();
    await supabase.from("sale_proposals").update({ status: s }).eq("id", p.id);
    setStatus(s);
    setBusy(false);
    router.refresh();
  }
  async function remove() {
    if (!confirm(`Excluir a proposta de "${p.disc_title}"?`)) return;
    setBusy(true);
    const supabase = createClient();
    await supabase.from("sale_proposals").delete().eq("id", p.id);
    setBusy(false);
    router.refresh();
  }

  const st = STATUS[status] ?? STATUS.new;
  const quality = [p.disc_quality && `disco ${p.disc_quality}`, p.cover_quality && `capa ${p.cover_quality}`].filter(Boolean).join(" · ");

  return (
    <div className="card p-5">
      <div className="flex gap-4">
        {p.photo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.photo_url} alt="" className="h-20 w-20 shrink-0 rounded-xl border border-line object-cover" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-display text-lg text-ink">{p.disc_title}</h3>
              <p className="truncate text-sm text-muted">{[p.artist, p.year].filter(Boolean).join(" · ") || "—"}</p>
            </div>
            <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs", st.cls)}>{st.label}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            {p.format && <span className="flex items-center gap-1"><Tag size={12} className="text-teal" /> {p.format}</span>}
            {quality && <span>{quality}</span>}
            {p.price_wanted != null && <span className="text-brand">quer {formatBRL(p.price_wanted)}</span>}
          </div>
        </div>
      </div>

      {p.description && <p className="mt-3 rounded-lg bg-bg-soft p-3 text-sm text-muted">{p.description}</p>}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
        <span className="font-medium text-ink">{p.name}</span>
        {p.phone && <span className="flex items-center gap-1"><Phone size={13} className="text-teal" /> {p.phone}</span>}
        {p.email && <span className="flex items-center gap-1"><Mail size={13} className="text-teal" /> {p.email}</span>}
        {p.city && <span className="flex items-center gap-1"><MapPin size={13} className="text-teal" /> {p.city}</span>}
        <span className="flex items-center gap-1 text-faint"><Calendar size={12} /> {formatDateTime(p.created_at)}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {p.phone && (
          <a href={whatsappLink(p.phone, `Olá ${p.name}! Recebemos sua proposta de venda do disco "${p.disc_title}" na Neblina Records.`)} target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg border border-teal/40 bg-teal/10 px-3 py-1.5 text-xs text-teal hover:bg-teal/15">
            <MessageCircle size={14} /> WhatsApp
          </a>
        )}
        <select value={status} onChange={(e) => changeStatus(e.target.value)} disabled={busy}
          className="rounded-lg border border-line bg-bg-soft px-2.5 py-1.5 text-xs text-ink outline-none focus:border-brand/50 disabled:opacity-50">
          <option value="new">Nova</option>
          <option value="contacted">Em contato</option>
          <option value="done">Fechada</option>
          <option value="rejected">Recusada</option>
        </select>
        <button type="button" onClick={remove} disabled={busy} className="ml-auto inline-flex items-center gap-1 rounded-lg p-2 text-muted hover:text-red-400 disabled:opacity-40">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
      </div>
    </div>
  );
}
