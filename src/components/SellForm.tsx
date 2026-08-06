"use client";

import { useState } from "react";
import { Loader2, Send, CheckCircle2, MessageCircle, ImagePlus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/upload";
import { STORE, QUALITY_GRADES, QUALITY_META, RECORD_FORMATS } from "@/lib/constants";
import { whatsappLink } from "@/lib/utils";

export default function SellForm() {
  const [f, setF] = useState({
    name: "", phone: "", email: "", city: "",
    disc_title: "", artist: "", year: "", format: "", disc_quality: "", cover_quality: "", price_wanted: "", description: "",
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("A foto precisa ter até 5 MB."); return; }
    setError(null);
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    e.target.value = "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!f.name.trim() || !f.phone.trim()) { setError("Informe pelo menos seu nome e telefone."); return; }
    if (!f.disc_title.trim()) { setError("Informe o nome do disco."); return; }
    setLoading(true);
    try {
      let photo_url: string | null = null;
      if (photo) photo_url = await uploadFile("proposals", photo, "proposta-");

      const supabase = createClient();
      const { error } = await supabase.from("sale_proposals").insert({
        name: f.name.trim(),
        phone: f.phone.trim() || null,
        email: f.email.trim() || null,
        city: f.city.trim() || null,
        disc_title: f.disc_title.trim(),
        artist: f.artist.trim() || null,
        year: f.year ? parseInt(f.year) : null,
        format: f.format || null,
        disc_quality: f.disc_quality || null,
        cover_quality: f.cover_quality || null,
        price_wanted: f.price_wanted ? parseFloat(f.price_wanted) : null,
        description: f.description.trim() || null,
        photo_url,
      });
      if (error) throw error;
      setDone(true);
    } catch {
      setError("Não foi possível enviar. Tente de novo ou fale pelo WhatsApp.");
    } finally {
      setLoading(false);
    }
  }

  const waMsg = `Olá, Neblina Records! Tenho um disco para vender.\n\nNome: ${f.name}\nDisco: ${f.disc_title}${f.artist ? ` — ${f.artist}` : ""}${f.year ? ` (${f.year})` : ""}\n${f.format ? `Formato: ${f.format}\n` : ""}${f.disc_quality ? `Qualidade do disco: ${f.disc_quality}\n` : ""}${f.price_wanted ? `Valor desejado: R$ ${f.price_wanted}\n` : ""}${f.description ? `\n${f.description}` : ""}`;

  if (done) {
    return (
      <div className="card p-8 text-center">
        <CheckCircle2 size={48} className="mx-auto mb-3 text-teal" />
        <h3 className="font-display text-2xl text-ink">Proposta enviada!</h3>
        <p className="mt-2 text-muted">Recebemos os dados do seu disco. Nossa equipe vai avaliar e entrar em contato. Quer agilizar?</p>
        <a href={whatsappLink(STORE.whatsappPrimary, waMsg)} target="_blank" className="btn-brand mt-5 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm">
          <MessageCircle size={17} /> Falar agora no WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-5 p-6 md:p-8">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand">Seus dados</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nome *" value={f.name} onChange={(v) => set("name", v)} />
          <Input label="Telefone / WhatsApp *" value={f.phone} onChange={(v) => set("phone", v)} />
          <Input label="E-mail" type="email" value={f.email} onChange={(v) => set("email", v)} />
          <Input label="Cidade" value={f.city} onChange={(v) => set("city", v)} />
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand">O disco</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nome do disco *" value={f.disc_title} onChange={(v) => set("disc_title", v)} />
          <Input label="Artista / Banda" value={f.artist} onChange={(v) => set("artist", v)} />
          <Input label="Ano" type="number" value={f.year} onChange={(v) => set("year", v)} />
          <Select label="Formato" value={f.format} onChange={(v) => set("format", v)} options={["", ...RECORD_FORMATS]} render={(o) => o || "—"} />
          <Select label="Qualidade do disco" value={f.disc_quality} onChange={(v) => set("disc_quality", v)} options={["", ...QUALITY_GRADES]} render={(o) => (o ? QUALITY_META[o as keyof typeof QUALITY_META].label : "—")} />
          <Select label="Qualidade da capa" value={f.cover_quality} onChange={(v) => set("cover_quality", v)} options={["", ...QUALITY_GRADES]} render={(o) => (o ? QUALITY_META[o as keyof typeof QUALITY_META].label : "—")} />
          <Input label="Valor que deseja (R$)" type="number" value={f.price_wanted} onChange={(v) => set("price_wanted", v)} />
        </div>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">Estado de conservação / observações</span>
          <textarea className="ipt-sell min-h-24" rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="Riscos, chiados, encarte, edição, etc." />
        </label>
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wider text-muted">Foto da capa (opcional)</p>
        {photoPreview ? (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoPreview} alt="" className="h-32 w-32 rounded-xl border border-line object-cover" />
            <button type="button" onClick={() => { setPhoto(null); setPhotoPreview(null); }} className="absolute -right-2 -top-2 rounded-full bg-black/70 p-1 text-white hover:bg-red-500"><X size={14} /></button>
          </div>
        ) : (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-line px-4 py-3 text-sm text-muted hover:border-brand/50 hover:text-brand">
            <ImagePlus size={16} /> Enviar foto (até 5 MB)
            <input type="file" accept="image/*" hidden onChange={onPhoto} />
          </label>
        )}
      </div>

      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

      <button type="submit" disabled={loading} className="btn-brand flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm disabled:opacity-60">
        {loading ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />} Enviar proposta
      </button>

      <style jsx global>{`
        .ipt-sell { width: 100%; border-radius: 0.75rem; border: 1px solid var(--color-line); background: var(--color-bg-soft); padding: 0.65rem 0.85rem; font-size: 0.9rem; color: var(--color-ink); outline: none; }
        .ipt-sell:focus { border-color: color-mix(in srgb, var(--color-brand) 55%, transparent); }
      `}</style>
    </form>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">{label}</span>
      <input type={type} className="ipt-sell" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Select({ label, value, onChange, options, render }: { label: string; value: string; onChange: (v: string) => void; options: readonly string[]; render: (o: string) => string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">{label}</span>
      <select className="ipt-sell" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o} value={o}>{render(o)}</option>)}
      </select>
    </label>
  );
}
