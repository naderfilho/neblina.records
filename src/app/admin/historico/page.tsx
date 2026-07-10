"use client";

import { useEffect, useState } from "react";
import { PlusCircle, Pencil, Trash2, ArrowUpDown, Headphones, Music, ChevronDown, Clock, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Log = {
  id: string;
  actor_name: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  entity_label: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

function phrase(l: Log): string {
  if (l.entity === "record") {
    if (l.action === "create") return "adicionou o disco";
    if (l.action === "delete") return "removeu o disco";
    return "editou o disco";
  }
  if (l.entity === "order") return "alterou a ordem dos discos da home";
  if (l.entity === "audioteca") return "mudou o acesso na Audioteca do disco";
  if (l.entity === "musica_home") return "definiu a música da home";
  return `${l.action} ${l.entity}`;
}

function ActionIcon({ l }: { l: Log }) {
  const c = "h-4 w-4";
  if (l.action === "create") return <PlusCircle className={cn(c, "text-teal")} />;
  if (l.action === "delete") return <Trash2 className={cn(c, "text-red-400")} />;
  if (l.action === "reorder") return <ArrowUpDown className={cn(c, "text-brand")} />;
  if (l.action === "tier") return <Headphones className={cn(c, "text-brand")} />;
  if (l.action === "home_music") return <Music className={cn(c, "text-brand")} />;
  return <Pencil className={cn(c, "text-mist")} />;
}

function when(iso: string) {
  // Normaliza para ISO estrito: alguns formatos vêm com espaço e offset "+00"
  // (sem ":"), o que faz o new Date() parsear como horário local e mostrar a
  // hora errada. Sem offset, assume UTC. Exibe sempre em horário de Brasília.
  let s = iso.trim().replace(" ", "T");
  const hasTz = /[zZ]$/.test(s) || /[+-]\d{2}(:\d{2})?$/.test(s);
  if (!hasTz) s += "Z";
  s = s.replace(/([+-]\d{2})$/, "$1:00");
  return new Date(s).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function Details({ l }: { l: Log }) {
  const d = l.details ?? {};
  const changes = d.alteracoes as Record<string, [unknown, unknown]> | undefined;
  return (
    <div className="mt-3 space-y-2 rounded-xl border border-line bg-bg-soft p-4 text-sm">
      <p className="flex items-center gap-2 text-xs text-faint"><Clock size={13} /> {when(l.created_at)}</p>
      {l.entity_label && <p className="text-muted">Item: <span className="text-ink">{l.entity_label}</span></p>}
      {changes && Object.keys(changes).length > 0 ? (
        <div>
          <p className="mb-1 text-xs uppercase tracking-wider text-faint">O que mudou</p>
          <ul className="space-y-1">
            {Object.entries(changes).map(([field, [before, after]]) => (
              <li key={field} className="flex flex-wrap items-center gap-2">
                <span className="text-muted">{field}:</span>
                <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-xs text-red-300 line-through">{String(before ?? "—")}</span>
                <span className="text-faint">→</span>
                <span className="rounded bg-teal/10 px-1.5 py-0.5 text-xs text-teal">{String(after ?? "—")}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : changes ? (
        <p className="text-faint">Sem alterações de campos rastreados.</p>
      ) : (
        Object.keys(d).length > 0 && (
          <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-black/30 p-3 text-xs text-muted">{JSON.stringify(d, null, 2)}</pre>
        )
      )}
    </div>
  );
}

export default function HistoricoPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    createClient().from("audit_log").select("*").order("created_at", { ascending: false }).limit(300).then(({ data }) => {
      setLogs((data as Log[]) ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-ink">Histórico de ações</h1>
        <p className="text-muted">Tudo o que os administradores fazem no painel. Clique numa ação para ver os detalhes.</p>
      </div>

      {loading ? (
        <p className="text-muted">Carregando…</p>
      ) : logs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line py-16 text-center text-muted">Nenhuma ação registrada ainda.</p>
      ) : (
        <div className="space-y-2">
          {logs.map((l) => {
            const open = openId === l.id;
            return (
              <div key={l.id} className="rounded-2xl border border-line bg-panel">
                <button onClick={() => setOpenId(open ? null : l.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-soft"><ActionIcon l={l} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="text-sm text-ink">
                      <strong>{l.actor_name || "Alguém"}</strong> {phrase(l)}
                      {l.entity_label && <> <span className="text-muted">“{l.entity_label}”</span></>}
                    </span>
                  </span>
                  <span className="hidden shrink-0 items-center gap-1.5 text-xs text-faint sm:flex"><User size={12} /> {l.actor_name || "—"}</span>
                  <span className="shrink-0 text-xs text-faint">{when(l.created_at)}</span>
                  <ChevronDown size={16} className={cn("shrink-0 text-faint transition-transform", open && "rotate-180")} />
                </button>
                {open && <div className="px-4 pb-4"><Details l={l} /></div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
