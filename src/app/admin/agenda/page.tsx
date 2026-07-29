"use client";

import { useEffect, useState } from "react";
import { CalendarDays, MapPin, Plus, Loader2, Trash2, Pencil, X, Check, Link2, Bell, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAction } from "@/lib/audit";
import { formatDateTime } from "@/lib/utils";
import type { StoreEvent } from "@/lib/types";

const EMPTY = { title: "", location: "", starts_at: "", ends_at: "", description: "", url: "", is_published: true };
type Draft = typeof EMPTY;

/** timestamptz do banco -> valor de <input type="datetime-local"> (hora local) */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminAgendaPage() {
  const supabase = createClient();
  const [events, setEvents] = useState<StoreEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase.from("store_events").select("*").order("starts_at", { ascending: false });
    setEvents((data as StoreEvent[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function startEdit(e: StoreEvent) {
    setEditId(e.id);
    setDraft({
      title: e.title, location: e.location ?? "", starts_at: toLocalInput(e.starts_at),
      ends_at: toLocalInput(e.ends_at), description: e.description ?? "", url: e.url ?? "", is_published: e.is_published,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function reset() { setEditId(null); setDraft(EMPTY); setError(null); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!draft.title.trim() || !draft.starts_at) { setError("Preencha ao menos o nome do evento e a data de início."); return; }
    setSaving(true);
    const payload = {
      title: draft.title.trim(),
      location: draft.location.trim() || null,
      starts_at: new Date(draft.starts_at).toISOString(),
      ends_at: draft.ends_at ? new Date(draft.ends_at).toISOString() : null,
      description: draft.description.trim() || null,
      url: draft.url.trim() || null,
      is_published: draft.is_published,
    };

    if (editId) {
      const { error } = await supabase.from("store_events").update(payload).eq("id", editId);
      setSaving(false);
      if (error) return setError(error.message);
      logAction("update", "store_event", editId, payload.title, {});
    } else {
      const { data, error } = await supabase.from("store_events").insert(payload).select("id").single();
      setSaving(false);
      if (error) return setError(error.message);
      logAction("create", "store_event", data.id, payload.title, {});
      // item 5: oferecer disparo de notificação para os clientes
      await maybeNotify(payload);
    }
    reset();
    load();
  }

  async function maybeNotify(ev: { title: string; location: string | null; starts_at: string }) {
    if (!window.confirm(`Deseja notificar os clientes do site sobre essa presença confirmada?\n\n“${ev.title}”`)) return;
    const quando = formatDateTime(ev.starts_at);
    const body = `Vamos estar presentes${ev.location ? ` em ${ev.location}` : ""} — ${quando}. Passa lá pra garimpar com a gente!`;
    const { data, error } = await supabase.rpc("broadcast_notification", {
      p_type: "event_presence",
      p_title: `Presença confirmada: ${ev.title}`,
      p_body: body,
      p_link: "/eventos",
      p_record_id: null,
    });
    if (error) { alert("Evento salvo, mas falhou ao notificar: " + error.message); return; }
    logAction("notify", "notification", null, ev.title, { tipo: "event_presence", enviados: data });
    alert(`Notificação enviada para ${data ?? 0} cliente(s).`);
  }

  async function remove(ev: StoreEvent) {
    if (!window.confirm(`Excluir a presença em “${ev.title}”?`)) return;
    const { error } = await supabase.from("store_events").delete().eq("id", ev.id);
    if (error) return alert("Erro ao excluir: " + error.message);
    logAction("delete", "store_event", ev.id, ev.title, {});
    if (editId === ev.id) reset();
    load();
  }

  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.ends_at ?? e.starts_at).getTime() >= now);
  const past = events.filter((e) => new Date(e.ends_at ?? e.starts_at).getTime() < now);

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-ink">Agenda — presença em eventos</h1>
        <p className="text-muted">Registre onde a Neblina vai estar. Aparece no calendário da página de Eventos.</p>
      </div>

      {/* formulário */}
      <form onSubmit={save} className="mb-8 rounded-2xl border border-line bg-panel p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg text-ink">{editId ? "Editar presença" : "Nova presença"}</h2>
          {editId && (
            <button type="button" onClick={reset} className="flex items-center gap-1 text-xs text-muted hover:text-brand">
              <X size={13} /> cancelar edição
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Nome do evento *</span>
            <input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="Ex.: 30ª Feira de Discos do Rio de Janeiro"
              className="w-full rounded-xl border border-line bg-bg-soft px-3 py-2.5 text-sm text-ink outline-none focus:border-brand/50" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Local / cidade</span>
            <input value={draft.location} onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
              placeholder="Ex.: Rio de Janeiro, RJ"
              className="w-full rounded-xl border border-line bg-bg-soft px-3 py-2.5 text-sm text-ink outline-none focus:border-brand/50" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Link do evento (opcional)</span>
            <input value={draft.url} onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))}
              placeholder="https://…"
              className="w-full rounded-xl border border-line bg-bg-soft px-3 py-2.5 text-sm text-ink outline-none focus:border-brand/50" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Início *</span>
            <input type="datetime-local" value={draft.starts_at} onChange={(e) => setDraft((d) => ({ ...d, starts_at: e.target.value }))}
              className="w-full rounded-xl border border-line bg-bg-soft px-3 py-2.5 text-sm text-ink outline-none focus:border-brand/50" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Fim (opcional)</span>
            <input type="datetime-local" value={draft.ends_at} onChange={(e) => setDraft((d) => ({ ...d, ends_at: e.target.value }))}
              className="w-full rounded-xl border border-line bg-bg-soft px-3 py-2.5 text-sm text-ink outline-none focus:border-brand/50" />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Descrição (opcional)</span>
            <textarea value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} rows={2}
              placeholder="Detalhes que o público vê no calendário."
              className="w-full rounded-xl border border-line bg-bg-soft px-3 py-2.5 text-sm text-ink outline-none focus:border-brand/50" />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={draft.is_published} onChange={(e) => setDraft((d) => ({ ...d, is_published: e.target.checked }))} className="accent-brand" />
            Publicado (visível no site)
          </label>
          {error && <span className="text-sm text-red-400">{error}</span>}
          <button type="submit" disabled={saving} className="btn-brand inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : editId ? <Check size={16} /> : <Plus size={16} />}
            {editId ? "Salvar alterações" : "Registrar presença"}
          </button>
        </div>
        {!editId && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-faint">
            <Bell size={12} /> Ao registrar, o site pergunta se você quer notificar os clientes cadastrados.
          </p>
        )}
      </form>

      {loading ? (
        <p className="text-muted">Carregando…</p>
      ) : (
        <>
          <Section title="Próximos eventos" items={upcoming} onEdit={startEdit} onRemove={remove} empty="Nenhuma presença futura registrada." />
          {past.length > 0 && <Section title="Já aconteceram" items={past} onEdit={startEdit} onRemove={remove} muted />}
        </>
      )}
    </div>
  );
}

function Section({
  title, items, onEdit, onRemove, empty, muted,
}: {
  title: string; items: StoreEvent[]; onEdit: (e: StoreEvent) => void; onRemove: (e: StoreEvent) => void; empty?: string; muted?: boolean;
}) {
  return (
    <div className="mb-8">
      <h2 className="mb-3 font-display text-lg text-ink">{title}</h2>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">{empty}</p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {items.map((e) => (
            <div key={e.id} className={`card p-4 ${muted ? "opacity-70" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-display text-ink">
                    {e.title}
                    {!e.is_published && <span className="inline-flex items-center gap-1 rounded-md bg-bg-soft px-1.5 py-0.5 text-[10px] text-faint"><EyeOff size={10} /> oculto</span>}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    <span className="flex items-center gap-1"><CalendarDays size={12} className="text-teal" /> {formatDateTime(e.starts_at)}</span>
                    {e.location && <span className="flex items-center gap-1"><MapPin size={12} className="text-teal" /> {e.location}</span>}
                    {e.url && <a href={e.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-brand hover:underline"><Link2 size={12} /> link</a>}
                  </p>
                  {e.description && <p className="mt-2 line-clamp-2 text-sm text-muted">{e.description}</p>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => onEdit(e)} className="rounded-lg p-2 text-muted hover:bg-panel-2 hover:text-brand" title="Editar"><Pencil size={14} /></button>
                  <button onClick={() => onRemove(e)} className="rounded-lg p-2 text-muted hover:bg-panel-2 hover:text-red-400" title="Excluir"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
