"use client";

import { useState } from "react";
import { CalendarClock, Tag, Sparkles, Bell, Send, Loader2, Search, Check, X, Disc3 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logAction } from "@/lib/audit";
import type { NotificationType } from "@/lib/types";

type TemplateId = NotificationType;
const TEMPLATES: { id: TemplateId; label: string; icon: typeof Bell; needsDisc?: boolean; defaults: { title: string; body: string; link: string } }[] = [
  { id: "event_presence", label: "Presença confirmada em evento", icon: CalendarClock,
    defaults: { title: "Presença confirmada!", body: "Vamos estar presentes num evento em breve. Passa lá pra garimpar com a gente!", link: "/eventos" } },
  { id: "disc_promo", label: "Disco em promoção", icon: Tag, needsDisc: true,
    defaults: { title: "Disco em promoção 🔥", body: "Um disco entrou em promoção. Corre que é peça única!", link: "" } },
  { id: "weekly_promo", label: "Promoção da Semana", icon: Sparkles,
    defaults: { title: "Promoção da Semana 🎉", body: "Separamos discos com preço especial nesta semana. Confere no acervo!", link: "/#acervo" } },
  { id: "custom", label: "Personalizada", icon: Bell,
    defaults: { title: "", body: "", link: "" } },
];

type DiscHit = { id: string; title: string; artist: string };

export default function BroadcastComposer() {
  const supabase = createClient();
  const [tpl, setTpl] = useState<TemplateId>("event_presence");
  const [title, setTitle] = useState(TEMPLATES[0].defaults.title);
  const [body, setBody] = useState(TEMPLATES[0].defaults.body);
  const [link, setLink] = useState(TEMPLATES[0].defaults.link);
  const [disc, setDisc] = useState<DiscHit | null>(null);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<DiscHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const current = TEMPLATES.find((t) => t.id === tpl)!;

  function chooseTemplate(id: TemplateId) {
    const t = TEMPLATES.find((x) => x.id === id)!;
    setTpl(id);
    setTitle(t.defaults.title);
    setBody(t.defaults.body);
    setLink(t.defaults.link);
    setDisc(null);
    setResult(null);
  }

  async function search(term: string) {
    setQ(term);
    if (term.trim().length < 2) { setHits([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from("records")
      .select("id,title,artist")
      .or(`title.ilike.%${term}%,artist.ilike.%${term}%`)
      .limit(8);
    setHits((data as DiscHit[]) ?? []);
    setSearching(false);
  }

  function pickDisc(d: DiscHit) {
    setDisc(d);
    setHits([]);
    setQ("");
    setLink(`/disco/${d.id}`);
    if (!body || body === current.defaults.body) setBody(`${d.artist} — ${d.title} entrou em promoção. Corre que é peça única!`);
  }

  async function send() {
    if (!title.trim()) { setResult("Escreva um título."); return; }
    if (current.needsDisc && !disc) { setResult("Escolha o disco da promoção."); return; }
    if (!window.confirm("Enviar esta notificação para TODOS os clientes cadastrados?")) return;
    setSending(true);
    setResult(null);
    const { data, error } = await supabase.rpc("broadcast_notification", {
      p_type: tpl,
      p_title: title.trim(),
      p_body: body.trim() || null,
      p_link: link.trim() || null,
      p_record_id: disc?.id ?? null,
    });
    setSending(false);
    if (error) { setResult("Erro: " + error.message); return; }
    logAction("notify", "notification", disc?.id ?? null, title.trim(), { tipo: tpl, enviados: data });
    setResult(`✓ Enviada para ${data ?? 0} cliente(s).`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-4">
        {/* escolher tipo */}
        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-muted">Tipo de notificação</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {TEMPLATES.map((t) => {
              const on = tpl === t.id;
              return (
                <button key={t.id} onClick={() => chooseTemplate(t.id)}
                  className={`flex items-center gap-2.5 rounded-xl border p-3 text-left text-sm transition ${on ? "border-brand bg-brand/10 text-ink" : "border-line text-muted hover:border-brand/40"}`}>
                  <t.icon size={18} className={on ? "text-brand" : "text-faint"} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* seleção de disco (promoção de disco) */}
        {current.needsDisc && (
          <div>
            <p className="mb-1.5 text-xs uppercase tracking-wider text-muted">Disco da promoção</p>
            {disc ? (
              <div className="flex items-center justify-between rounded-xl border border-brand/40 bg-brand/5 px-3 py-2.5 text-sm">
                <span className="flex items-center gap-2 text-ink"><Disc3 size={15} className="text-brand" /> {disc.artist} — {disc.title}</span>
                <button onClick={() => { setDisc(null); setLink(""); }} className="text-faint hover:text-red-400"><X size={15} /></button>
              </div>
            ) : (
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                <input value={q} onChange={(e) => search(e.target.value)} placeholder="Buscar disco por título ou artista…"
                  className="w-full rounded-xl border border-line bg-bg-soft py-2.5 pl-9 pr-3 text-sm text-ink outline-none focus:border-brand/50" />
                {searching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-faint" />}
                {hits.length > 0 && (
                  <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-line bg-panel shadow-2xl">
                    {hits.map((h) => (
                      <button key={h.id} onClick={() => pickDisc(h)} className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-panel-2">
                        {h.artist} — {h.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* editar */}
        <label className="block text-sm">
          <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Título *</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-line bg-bg-soft px-3 py-2.5 text-sm text-ink outline-none focus:border-brand/50" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Mensagem</span>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3}
            className="w-full rounded-xl border border-line bg-bg-soft px-3 py-2.5 text-sm text-ink outline-none focus:border-brand/50" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Link ao clicar (opcional)</span>
          <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Ex.: /eventos, /#acervo, /disco/…"
            className="w-full rounded-xl border border-line bg-bg-soft px-3 py-2.5 text-sm text-ink outline-none focus:border-brand/50" />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button onClick={send} disabled={sending} className="btn-brand inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm disabled:opacity-60">
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Enviar para todos os clientes
          </button>
          {result && <span className={`text-sm ${result.startsWith("✓") ? "text-teal" : "text-red-400"}`}>{result}</span>}
        </div>
      </div>

      {/* prévia (como o cliente vê) */}
      <div>
        <p className="mb-2 text-xs uppercase tracking-wider text-muted">Prévia</p>
        <div className="rounded-2xl border border-brand/30 bg-brand/5 p-3.5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-bg-soft text-brand">
              <current.icon size={17} />
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-2 font-medium text-ink">{title || "Título da notificação"} <span className="h-1.5 w-1.5 rounded-full bg-brand" /></p>
              {body && <p className="mt-0.5 text-sm text-muted">{body}</p>}
              <p className="mt-1 text-[11px] text-faint">agora mesmo</p>
            </div>
          </div>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-faint">
          <Check size={13} /> Aparece no sino e na caixa de entrada de cada cliente.
        </p>
      </div>
    </div>
  );
}
