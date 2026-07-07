"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload, Image as ImageIcon, Music, X, Plus, Trash2, Loader2, Save,
  Type, Heading, Quote, ListTree, GripVertical,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/upload";
import {
  QUALITY_GRADES, QUALITY_META, RECORD_FORMATS, PAYMENT_METHODS, DEFAULT_DISC_CONFIG,
  type DiscConfig,
} from "@/lib/constants";
import type { RecordItem, RecordPhoto, ExtraBlock } from "@/lib/types";
import VinylDesigner from "@/components/admin/VinylDesigner";
import AudioTrimmer from "@/components/admin/AudioTrimmer";
import { cn } from "@/lib/utils";

type PhotoItem = { id: string; url: string; file?: File };

type Suggestions = { genres: string[]; nationalities: string[]; artists: string[] };

export default function RecordForm({
  record,
  existingPhotos = [],
  suggestions,
}: {
  record?: RecordItem;
  existingPhotos?: RecordPhoto[];
  suggestions: Suggestions;
}) {
  const router = useRouter();
  const isEdit = !!record;

  const [title, setTitle] = useState(record?.title ?? "");
  const [artist, setArtist] = useState(record?.artist ?? "");
  const [genre, setGenre] = useState(record?.genre ?? "");
  const [nationality, setNationality] = useState(record?.nationality ?? "");
  const [format, setFormat] = useState(record?.format ?? "LP");
  const [weight, setWeight] = useState(record?.weight_grams?.toString() ?? "");
  const [discQuality, setDiscQuality] = useState(record?.disc_quality ?? "");
  const [coverQuality, setCoverQuality] = useState(record?.cover_quality ?? "");
  const [price, setPrice] = useState(record?.price?.toString() ?? "");
  const [year, setYear] = useState(record?.year?.toString() ?? "");
  const [labelCompany, setLabelCompany] = useState(record?.label_company ?? "");
  const [catalog, setCatalog] = useState(record?.catalog_number ?? "");
  const [stock, setStock] = useState(record?.stock_qty?.toString() ?? "1");
  const [description, setDescription] = useState(record?.description ?? "");
  const [published, setPublished] = useState(record?.is_published ?? true);
  const [featured, setFeatured] = useState(record?.is_featured ?? false);
  const [payments, setPayments] = useState<string[]>(record?.payment_methods ?? ["Pix", "Dinheiro"]);
  const [discConfig, setDiscConfig] = useState<DiscConfig>(record?.disc_config ?? DEFAULT_DISC_CONFIG);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(record?.cover_image_url ?? null);

  const [photos, setPhotos] = useState<PhotoItem[]>(
    existingPhotos.map((p) => ({ id: p.id, url: p.url })),
  );

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(record?.audio_url ?? null);
  const [audioStart, setAudioStart] = useState(record?.audio_start ?? 0);
  const [audioEnd, setAudioEnd] = useState<number | null>(record?.audio_end ?? null);

  const [blocks, setBlocks] = useState<ExtraBlock[]>(
    Array.isArray(record?.extra_blocks) ? (record!.extra_blocks as ExtraBlock[]) : [],
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const coverInput = useRef<HTMLInputElement>(null);
  const photosInput = useRef<HTMLInputElement>(null);
  const audioInput = useRef<HTMLInputElement>(null);

  const audioPreviewSrc = useMemo(
    () => (audioFile ? URL.createObjectURL(audioFile) : audioUrl),
    [audioFile, audioUrl],
  );

  function onCover(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setCoverFile(f);
    setCoverPreview(URL.createObjectURL(f));
  }

  function onPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setPhotos((prev) => [
      ...prev,
      ...files.map((f) => ({ id: crypto.randomUUID(), url: URL.createObjectURL(f), file: f })),
    ]);
    e.target.value = "";
  }

  function onAudio(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setAudioFile(f);
    setAudioUrl(null);
    setAudioStart(0);
    setAudioEnd(null);
  }

  function addBlock(type: ExtraBlock["type"]) {
    setBlocks((b) => [...b, { id: crypto.randomUUID(), type, content: "", title: "", key: "", value: "" }]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !artist.trim()) {
      setError("Título e artista são obrigatórios.");
      return;
    }
    setSaving(true);
    const supabase = createClient();

    try {
      // uploads
      let coverUrlFinal = coverPreview;
      if (coverFile) coverUrlFinal = await uploadFile("covers", coverFile, "cover-");

      let audioUrlFinal = audioUrl;
      if (audioFile) audioUrlFinal = await uploadFile("audio", audioFile, "audio-");

      const photoUrls: string[] = [];
      for (const p of photos) {
        if (p.file) photoUrls.push(await uploadFile("record-photos", p.file, "photo-"));
        else photoUrls.push(p.url);
      }

      const payload = {
        title: title.trim(),
        artist: artist.trim(),
        genre: genre.trim() || null,
        nationality: nationality.trim() || null,
        format: format || null,
        weight_grams: weight ? parseFloat(weight) : null,
        disc_quality: discQuality || null,
        cover_quality: coverQuality || null,
        price: price ? parseFloat(price) : 0,
        year: year ? parseInt(year) : null,
        label_company: labelCompany.trim() || null,
        catalog_number: catalog.trim() || null,
        stock_qty: stock ? parseInt(stock) : 1,
        description: description.trim() || null,
        is_published: published,
        is_featured: featured,
        payment_methods: payments,
        disc_config: discConfig,
        cover_image_url: coverUrlFinal,
        audio_url: audioUrlFinal,
        audio_start: audioStart,
        audio_end: audioEnd,
        extra_blocks: blocks,
      };

      let recordId = record?.id;
      if (isEdit) {
        const { error } = await supabase.from("records").update(payload).eq("id", record!.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("records").insert(payload).select("id").single();
        if (error) throw error;
        recordId = data.id;
      }

      // sincroniza fotos (apaga e recria)
      if (recordId) {
        await supabase.from("record_photos").delete().eq("record_id", recordId);
        if (photoUrls.length) {
          await supabase.from("record_photos").insert(
            photoUrls.map((url, i) => ({ record_id: recordId, url, sort_order: i })),
          );
        }
      }

      router.push("/admin/discos");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-8 pb-24">
      {error && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}

      {/* Dados principais */}
      <Section title="Informações do disco">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Título *"><input className="ipt" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
          <Field label="Artista / Banda *">
            <input className="ipt" list="s-artists" value={artist} onChange={(e) => setArtist(e.target.value)} />
            <datalist id="s-artists">{suggestions.artists.map((a) => <option key={a} value={a} />)}</datalist>
          </Field>
          <Field label="Estilo musical">
            <input className="ipt" list="s-genres" value={genre} onChange={(e) => setGenre(e.target.value)} />
            <datalist id="s-genres">{suggestions.genres.map((g) => <option key={g} value={g} />)}</datalist>
          </Field>
          <Field label="Nacionalidade">
            <input className="ipt" list="s-nats" value={nationality} onChange={(e) => setNationality(e.target.value)} />
            <datalist id="s-nats">{suggestions.nationalities.map((n) => <option key={n} value={n} />)}</datalist>
          </Field>
          <Field label="Tipo de disco">
            <select className="ipt" value={format} onChange={(e) => setFormat(e.target.value)}>
              {RECORD_FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </Field>
          <Field label="Peso (g)"><input className="ipt" type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} /></Field>
          <Field label="Ano"><input className="ipt" type="number" value={year} onChange={(e) => setYear(e.target.value)} /></Field>
          <Field label="Gravadora"><input className="ipt" value={labelCompany} onChange={(e) => setLabelCompany(e.target.value)} /></Field>
          <Field label="Nº de catálogo"><input className="ipt" value={catalog} onChange={(e) => setCatalog(e.target.value)} /></Field>
          <Field label="Estoque"><input className="ipt" type="number" value={stock} onChange={(e) => setStock(e.target.value)} /></Field>
          <Field label="Qualidade do disco">
            <select className="ipt" value={discQuality} onChange={(e) => setDiscQuality(e.target.value)}>
              <option value="">—</option>
              {QUALITY_GRADES.map((q) => <option key={q} value={q}>{QUALITY_META[q].label}</option>)}
            </select>
          </Field>
          <Field label="Qualidade da capa">
            <select className="ipt" value={coverQuality} onChange={(e) => setCoverQuality(e.target.value)}>
              <option value="">—</option>
              {QUALITY_GRADES.map((q) => <option key={q} value={q}>{QUALITY_META[q].label}</option>)}
            </select>
          </Field>
          <Field label="Preço (R$)"><input className="ipt" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
        </div>

        <Field label="Descrição">
          <textarea className="ipt min-h-24" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
        </Field>

        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-muted">Formas de pagamento</p>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPayments((p) => (p.includes(m) ? p.filter((x) => x !== m) : [...p, m]))}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs",
                  payments.includes(m) ? "border-brand bg-brand/15 text-brand" : "border-line text-muted hover:text-ink",
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <Toggle label="Publicado na loja" checked={published} onChange={setPublished} />
          <Toggle label="Destaque" checked={featured} onChange={setFeatured} />
        </div>
      </Section>

      {/* Capa + designer */}
      <Section title="Capa & Vinil" desc="Envie a foto da capa e transforme-a num vinil padronizado para a home.">
        <div className="mb-5 flex items-center gap-3">
          <button type="button" onClick={() => coverInput.current?.click()} className="flex items-center gap-2 rounded-xl border border-line bg-panel px-4 py-2.5 text-sm hover:border-brand/50">
            <ImageIcon size={16} /> {coverPreview ? "Trocar foto da capa" : "Enviar foto da capa"}
          </button>
          {coverPreview && (
            <button type="button" onClick={() => { setCoverFile(null); setCoverPreview(null); }} className="text-sm text-faint hover:text-red-400">
              Remover
            </button>
          )}
          <input ref={coverInput} type="file" accept="image/*" hidden onChange={onCover} />
        </div>
        <VinylDesigner coverUrl={coverPreview} config={discConfig} onChange={setDiscConfig} />
      </Section>

      {/* Áudio */}
      <Section title="Áudio da música" desc="O trecho toca quando passam o mouse (ou tocam) no disco.">
        <div className="mb-4 flex items-center gap-3">
          <button type="button" onClick={() => audioInput.current?.click()} className="flex items-center gap-2 rounded-xl border border-line bg-panel px-4 py-2.5 text-sm hover:border-brand/50">
            <Music size={16} /> {audioPreviewSrc ? "Trocar áudio" : "Enviar áudio"}
          </button>
          {audioPreviewSrc && (
            <button type="button" onClick={() => { setAudioFile(null); setAudioUrl(null); }} className="text-sm text-faint hover:text-red-400">
              Remover
            </button>
          )}
          <input ref={audioInput} type="file" accept="audio/*" hidden onChange={onAudio} />
        </div>
        {audioPreviewSrc && (
          <AudioTrimmer
            url={audioPreviewSrc}
            start={audioStart}
            end={audioEnd}
            onChange={({ start, end }) => { setAudioStart(start); setAudioEnd(end); }}
          />
        )}
      </Section>

      {/* Fotos reais */}
      <Section title="Fotos reais do disco" desc="Aparecem apenas na página do disco, não na home.">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {photos.map((p) => (
            <div key={p.id} className="group relative aspect-square overflow-hidden rounded-xl border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setPhotos((prev) => prev.filter((x) => x.id !== p.id))}
                className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white opacity-0 group-hover:opacity-100"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => photosInput.current?.click()} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line text-faint hover:border-brand/50 hover:text-brand">
            <Plus size={20} />
            <span className="text-xs">Adicionar</span>
          </button>
          <input ref={photosInput} type="file" accept="image/*" multiple hidden onChange={onPhotos} />
        </div>
      </Section>

      {/* Blocos livres */}
      <Section title="Blocos extras da página" desc="Monte a página do disco com informações livres.">
        <div className="mb-4 flex flex-wrap gap-2">
          <AddBlockBtn icon={Type} label="Texto" onClick={() => addBlock("text")} />
          <AddBlockBtn icon={Heading} label="Título" onClick={() => addBlock("heading")} />
          <AddBlockBtn icon={Quote} label="Citação" onClick={() => addBlock("quote")} />
          <AddBlockBtn icon={ListTree} label="Especificação" onClick={() => addBlock("spec")} />
        </div>
        <div className="space-y-3">
          {blocks.map((b) => (
            <div key={b.id} className="flex gap-2 rounded-xl border border-line bg-bg-soft p-3">
              <GripVertical size={16} className="mt-2 shrink-0 text-faint" />
              <div className="flex-1">
                {b.type === "heading" && (
                  <input className="ipt" placeholder="Título da seção" value={b.title}
                    onChange={(e) => setBlocks((bl) => bl.map((x) => x.id === b.id ? { ...x, title: e.target.value } : x))} />
                )}
                {b.type === "spec" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <input className="ipt" placeholder="Campo (ex: Prensagem)" value={b.key}
                      onChange={(e) => setBlocks((bl) => bl.map((x) => x.id === b.id ? { ...x, key: e.target.value } : x))} />
                    <input className="ipt" placeholder="Valor (ex: Alemanha, 2020)" value={b.value}
                      onChange={(e) => setBlocks((bl) => bl.map((x) => x.id === b.id ? { ...x, value: e.target.value } : x))} />
                  </div>
                ) : b.type !== "heading" ? (
                  <textarea className="ipt" rows={2} placeholder={b.type === "quote" ? "Citação…" : "Texto…"} value={b.content}
                    onChange={(e) => setBlocks((bl) => bl.map((x) => x.id === b.id ? { ...x, content: e.target.value } : x))} />
                ) : null}
              </div>
              <button type="button" onClick={() => setBlocks((bl) => bl.filter((x) => x.id !== b.id))} className="mt-1 h-8 shrink-0 rounded-lg p-1.5 text-faint hover:text-red-400">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* barra de salvar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-panel/95 backdrop-blur md:left-64">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-3">
          <button type="button" onClick={() => router.back()} className="text-sm text-muted hover:text-ink">Cancelar</button>
          <button type="submit" disabled={saving} className="btn-brand flex items-center gap-2 rounded-xl px-6 py-3 text-sm disabled:opacity-60">
            {saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
            {isEdit ? "Salvar alterações" : "Publicar disco"}
          </button>
        </div>
      </div>

      <style jsx global>{`
        .ipt {
          width: 100%; border-radius: 0.75rem; border: 1px solid var(--color-line);
          background: var(--color-bg-soft); padding: 0.6rem 0.8rem; font-size: 0.9rem;
          color: var(--color-ink); outline: none;
        }
        .ipt:focus { border-color: color-mix(in srgb, var(--color-brand) 55%, transparent); }
      `}</style>
    </form>
  );
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="card p-6">
      <h2 className="font-display text-xl text-ink">{title}</h2>
      {desc && <p className="mb-4 mt-0.5 text-sm text-muted">{desc}</p>}
      <div className={desc ? "space-y-5" : "mt-4 space-y-5"}>{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-2.5">
      <span className={cn("relative h-6 w-11 rounded-full transition-colors", checked ? "bg-brand" : "bg-panel-2")}>
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform", checked ? "translate-x-[22px]" : "translate-x-0.5")} />
      </span>
      <span className="text-sm text-ink">{label}</span>
    </button>
  );
}

function AddBlockBtn({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-1.5 rounded-lg border border-line bg-panel px-3 py-1.5 text-xs text-muted hover:border-brand/50 hover:text-brand">
      <Icon size={14} /> {label}
    </button>
  );
}
