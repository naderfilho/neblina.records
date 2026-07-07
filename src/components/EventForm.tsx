"use client";

import { useState } from "react";
import { Loader2, Send, CheckCircle2, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { STORE } from "@/lib/constants";
import { whatsappLink } from "@/lib/utils";

const TYPES = ["Feira / Festival", "Evento Corporativo", "Festival de Música", "Exposição", "Outro"];

export default function EventForm() {
  const [f, setF] = useState({
    name: "", company: "", email: "", phone: "", city: "", event_type: TYPES[0], event_date: "", message: "",
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!f.name.trim() || !f.phone.trim()) {
      setError("Informe pelo menos nome e telefone.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("event_requests").insert({
      name: f.name.trim(),
      company: f.company.trim() || null,
      email: f.email.trim() || null,
      phone: f.phone.trim() || null,
      city: f.city.trim() || null,
      event_type: f.event_type,
      event_date: f.event_date || null,
      message: f.message.trim() || null,
    });
    setLoading(false);
    if (error) {
      setError("Não foi possível enviar. Tente pelo WhatsApp.");
      return;
    }
    setDone(true);
  }

  const waMsg = `Olá, Neblina Records! Quero contratar para um evento.\n\nNome: ${f.name}\n${
    f.company ? `Empresa/Cidade: ${f.company}\n` : ""
  }Tipo: ${f.event_type}\n${f.city ? `Local: ${f.city}\n` : ""}${
    f.event_date ? `Data: ${f.event_date}\n` : ""
  }${f.message ? `\n${f.message}` : ""}`;

  if (done) {
    return (
      <div className="card p-8 text-center">
        <CheckCircle2 size={48} className="mx-auto mb-3 text-teal" />
        <h3 className="font-display text-2xl text-ink">Pedido enviado!</h3>
        <p className="mt-2 text-muted">Nossa equipe entrará em contato em breve. Quer agilizar?</p>
        <a
          href={whatsappLink(STORE.whatsappPrimary, waMsg)}
          target="_blank"
          className="btn-brand mt-5 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm"
        >
          <MessageCircle size={17} /> Falar agora no WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6 md:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nome *" value={f.name} onChange={(v) => set("name", v)} />
        <Input label="Empresa / Cidade" value={f.company} onChange={(v) => set("company", v)} />
        <Input label="E-mail" type="email" value={f.email} onChange={(v) => set("email", v)} />
        <Input label="Telefone / WhatsApp *" value={f.phone} onChange={(v) => set("phone", v)} />
        <Input label="Local do evento" value={f.city} onChange={(v) => set("city", v)} />
        <label className="block">
          <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">Tipo de evento</span>
          <select className="ipt-ev" value={f.event_type} onChange={(e) => set("event_type", e.target.value)}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">Data prevista</span>
          <input type="date" className="ipt-ev" value={f.event_date} onChange={(e) => set("event_date", e.target.value)} />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">Conte sobre o evento</span>
        <textarea className="ipt-ev min-h-28" rows={4} value={f.message} onChange={(e) => set("message", e.target.value)} />
      </label>

      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

      <button type="submit" disabled={loading} className="btn-brand flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm disabled:opacity-60">
        {loading ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />} Solicitar proposta
      </button>

      <style jsx global>{`
        .ipt-ev {
          width: 100%; border-radius: 0.75rem; border: 1px solid var(--color-line);
          background: var(--color-bg-soft); padding: 0.65rem 0.85rem; font-size: 0.9rem;
          color: var(--color-ink); outline: none;
        }
        .ipt-ev:focus { border-color: color-mix(in srgb, var(--color-brand) 55%, transparent); }
      `}</style>
    </form>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">{label}</span>
      <input type={type} className="ipt-ev" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
