"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Image as ImageIcon, Loader2, Save, Plus, Trash2, Search, ArrowUp, ArrowDown, GripVertical,
  Type, Heading, Quote, ListTree, Disc3,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/upload";
import { logAction } from "@/lib/audit";
import ImageCropper from "@/components/admin/ImageCropper";
import BoxArt from "@/components/BoxArt";
import {
  BOX_TYPES, BOX_FINISHES, BOX_COLORS, DEFAULT_BOX_CONFIG, PAYMENT_METHODS, AVAILABILITY,
  AUDIOTECA_TIERS, type BoxConfig, type Availability,
} from "@/lib/constants";
import type { BoxItem, ExtraBlock } from "@/lib/types";
import { cn } from "@/lib/utils";

export type RecordOption = { id: string; title: string; artist: string; cover_image_url: string | null };

export default function BoxForm({
  box,
  initialRecordIds = [],
  allRecords,
}: {
  box?: BoxItem;
  initialRecordIds?: string[];
  allRecords: RecordOption[];
}) {
  const router = useRouter();
  const isEdit = !!box;

  const [title, setTitle] = useState(box?.title ?? "");
  const [subtitle, setSubtitle] = useState(box?.subtitle ?? "");
  const [boxType, setBoxType] = useState(box?.box_type ?? BOX_TYPES[0]);
  const [year, setYear] = useState(box?.year?.toString() ?? "");
  const [catalog, setCatalog] = useState(box?.catalog_number ?? "");
  const [label, setLabel] = useState(box?.label_company ?? "");
  const [price, setPrice] = useState(box?.price?.toString() ?? "");
  const [description, setDescription] = useState(box?.description ?? "");
  const [payments, setPayments] = useState<string[]>(box?.payment_methods ?? ["Pix (Brasil)"]);
  const [availability, setAvailability] = useState<Availability>(box?.availability ?? "available");
  const [tier, setTier] = useState(box?.audioteca_tier ?? "public");
  const [published, setPublished] = useState(box?.is_published ?? true);
  const [featured, setFeatured] = useState(box?.is_featured ?? false);
  const [cfg, setCfg] = useState<BoxConfig>({ ...DEFAULT_BOX_CONFIG, ...(box?.box_config ?? {}) });
  const [blocks, setBlocks] = useState<ExtraBlock[]>(Array.isArray(box?.extra_blocks) ? (box!.extra_blocks as ExtraBlock[]) : []);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(box?.cover_image_url ?? null);
  const [spineFile, setSpineFile] = useState<File | null>(null);
  const [spinePreview, setSpinePreview] = useState<string | null>(box?.spine_image_url ?? null);

  const [selectedIds, setSelectedIds] = useState<string[]>(initialRecordIds);
  const [discSearch, setDiscSearch] = useState("");

  const [cropper, setCropper] = useState<{ file: File; onApply: (b: Blob) => void } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const coverInput = useRef<HTMLInputElement>(null);
  const spineInput = useRef<HTMLInputElement>(null);

  const recById = useMemo(() => new Map(allRecords.map((r) => [r.id, r])), [allRecords]);
  const selected = selectedIds.map((id) => recById.get(id)).filter((r): r is RecordOption => !!r);

  const searchResults = useMemo(() => {
    const q = discSearch.trim().toLowerCase();
    if (!q) return [];
    return allRecords
      .filter((r) => !selectedIds.includes(r.id))
      .filter((r) => `${r.title} ${r.artist}`.toLowerCase().includes(q))
      .slice(0, 12);
  }, [discSearch, allRecords, selectedIds]);

  function onCover(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setCropper({
      file: f,
      onApply: (blob) => {
        setCoverFile(new File([blob], "box-cover.jpg", { type: "image/jpeg" }));
        setCoverPreview(URL.createObjectURL(blob));
      },
    });
    e.target.value = "";
  }
  function onSpine(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setSpineFile(f);
    setSpinePreview(URL.createObjectURL(f));
    e.target.value = "";
  }

  function move(idx: number, dir: -1 | 1) {
    setSelectedIds((ids) => {
      const j = idx + dir;
      if (j < 0 || j >= ids.length) return ids;
      const copy = [...ids];
      [copy[idx], copy[j]] = [copy[j], copy[idx]];
      return copy;
    });
  }
  function addBlock(type: ExtraBlock["type"]) {
    setBlocks((b) => [...b, { id: crypto.randomUUID(), type, content: "", title: "", key: "", value: "" }]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) { setError("O título do box é obrigatório."); return; }
    setSaving(true);
    const supabase = createClient();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sua sessão expirou. Faça login novamente e salve de novo.");

      let coverUrl = coverPreview;
      if (coverFile) coverUrl = await uploadFile("covers", coverFile, "box-cover-");
      let spineUrl = spinePreview;
      if (spineFile) spineUrl = await uploadFile("covers", spineFile, "box-spine-");

      const payload = {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        box_type: boxType || null,
        description: description.trim() || null,
        cover_image_url: coverUrl,
        spine_image_url: spineUrl,
        box_config: cfg,
        year: year ? parseInt(year) : null,
        catalog_number: catalog.trim() || null,
        label_company: label.trim() || null,
        price: price ? parseFloat(price) : 0,
        payment_methods: payments,
        availability,
        audioteca_tier: tier,
        is_published: published,
        is_featured: featured,
        sort_order: box?.sort_order ?? 0,
        extra_blocks: blocks,
      };

      let boxId = box?.id;
      if (isEdit) {
        const { error: e1 } = await supabase.from("boxes").update(payload).eq("id", box!.id);
        if (e1) throw e1;
      } else {
        const { data, error: e1 } = await supabase.from("boxes").insert(payload).select("id").single();
        if (e1) throw e1;
        boxId = data.id as string;
      }

      // sincroniza os discos vinculados (apaga e reinsere com a ordem atual)
      if (boxId) {
        await supabase.from("box_records").delete().eq("box_id", boxId);
        if (selectedIds.length) {
          const { error: e2 } = await supabase
            .from("box_records")
            .insert(selectedIds.map((rid, i) => ({ box_id: boxId, record_id: rid, position: i })));
          if (e2) throw e2;
        }
        logAction(isEdit ? "update" : "create", "box", boxId, payload.title, { discos: selectedIds.length });
      }

      router.push("/admin/boxes");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar o box.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-8 pb-24">
      {error && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}

      {/* Capa + prévia 3D */}
      <Section title="Capa e visual do box" desc="A capa vira a frente da caixa 3D. Escolha o material e a cor — a prévia atualiza ao vivo.">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => coverInput.current?.click()} className="flex items-center gap-2 rounded-xl border border-line bg-panel px-4 py-2.5 text-sm hover:border-brand/50">
                <ImageIcon size={16} /> {coverPreview ? "Trocar capa" : "Enviar capa"}
              </button>
              {coverPreview && <button type="button" onClick={() => { setCoverFile(null); setCoverPreview(null); }} className="text-sm text-faint hover:text-red-400">Remover</button>}
              <input ref={coverInput} type="file" accept="image/*" hidden onChange={onCover} />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => spineInput.current?.click()} className="flex items-center gap-2 rounded-xl border border-line bg-panel px-4 py-2.5 text-sm hover:border-brand/50">
                <ImageIcon size={16} /> {spinePreview ? "Trocar lombada" : "Enviar lombada (opcional)"}
              </button>
              {spinePreview && <button type="button" onClick={() => { setSpineFile(null); setSpinePreview(null); }} className="text-sm text-faint hover:text-red-400">Remover</button>}
              <input ref={spineInput} type="file" accept="image/*" hidden onChange={onSpine} />
            </div>

            {/* Designer: acabamento + cor */}
            <div>
              <p className="mb-1.5 text-xs uppercase tracking-wider text-muted">Acabamento</p>
              <div className="flex flex-wrap gap-2">
                {BOX_FINISHES.map((f) => (
                  <button key={f.id} type="button" onClick={() => setCfg((c) => ({ ...c, finish: f.id }))}
                    className={cn("rounded-lg border px-3 py-1.5 text-xs", cfg.finish === f.id ? "border-brand bg-brand/15 text-brand" : "border-line text-muted hover:text-ink")}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs uppercase tracking-wider text-muted">Cor do material</p>
              <div className="flex flex-wrap gap-2">
                {BOX_COLORS.map((c) => (
                  <button key={c.id} type="button" onClick={() => setCfg((cc) => ({ ...cc, color: c.id, accent: c.accent }))}
                    title={c.label}
                    className={cn("h-8 w-8 rounded-full border-2 transition", cfg.color === c.id ? "border-brand" : "border-transparent")}
                    style={{ background: `linear-gradient(135deg, ${c.base}, ${c.accent})` }} />
                ))}
              </div>
            </div>
          </div>

          {/* prévia 3D */}
          <div className="flex items-center justify-center rounded-2xl border border-line bg-bg-soft p-6">
            <div className="w-full max-w-[220px]">
              <BoxArt config={cfg} coverUrl={coverPreview} spineUrl={spinePreview} title={title || "Box"} count={selectedIds.length || 3} />
            </div>
          </div>
        </div>
      </Section>

      {/* Informações */}
      <Section title="Informações do box">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Título *"><input className="ipt" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
          <Field label="Subtítulo"><input className="ipt" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Ex: Edição comemorativa" /></Field>
          <Field label="Tipo de box">
            <select className="ipt" value={boxType} onChange={(e) => setBoxType(e.target.value)}>
              {BOX_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Ano"><input className="ipt" type="number" value={year} onChange={(e) => setYear(e.target.value)} /></Field>
          <Field label="Gravadora"><input className="ipt" value={label} onChange={(e) => setLabel(e.target.value)} /></Field>
          <Field label="Nº de catálogo"><input className="ipt" value={catalog} onChange={(e) => setCatalog(e.target.value)} /></Field>
          <Field label="Preço (R$)"><input className="ipt" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
          <Field label="Nível na Audioteca">
            <select className="ipt" value={tier} onChange={(e) => setTier(e.target.value as typeof tier)}>
              {AUDIOTECA_TIERS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Descrição"><textarea className="ipt min-h-24" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>

        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-muted">Formas de pagamento</p>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_METHODS.map((m) => (
              <button key={m} type="button" onClick={() => setPayments((p) => (p.includes(m) ? p.filter((x) => x !== m) : [...p, m]))}
                className={cn("rounded-lg border px-3 py-1.5 text-xs", payments.includes(m) ? "border-brand bg-brand/15 text-brand" : "border-line text-muted hover:text-ink")}>
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-muted">Disponibilidade</p>
          <div className="flex flex-wrap gap-2">
            {AVAILABILITY.map((a) => (
              <button key={a.id} type="button" onClick={() => setAvailability(a.id)}
                className={cn("flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors", availability === a.id ? "border-brand bg-brand/15 text-brand" : "border-line text-muted hover:text-ink")}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }} /> {a.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <Toggle label="Publicado na loja" checked={published} onChange={setPublished} />
          <Toggle label="Destaque" checked={featured} onChange={setFeatured} />
        </div>
      </Section>

      {/* Discos do box */}
      <Section title="Discos do box" desc="Vincule discos já cadastrados. A ordem define a sequência na abertura cinematográfica e na Audioteca.">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input className="ipt !pl-10" value={discSearch} onChange={(e) => setDiscSearch(e.target.value)} placeholder="Buscar disco por título ou artista…" />
          {searchResults.length > 0 && (
            <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-line bg-panel shadow-xl">
              {searchResults.map((r) => (
                <button key={r.id} type="button"
                  onClick={() => { setSelectedIds((ids) => [...ids, r.id]); setDiscSearch(""); }}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-bg-soft">
                  {r.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.cover_image_url} alt="" className="h-9 w-9 rounded object-cover" />
                  ) : <span className="flex h-9 w-9 items-center justify-center rounded bg-bg-soft text-faint"><Disc3 size={15} /></span>}
                  <span className="min-w-0"><span className="block truncate text-ink">{r.title}</span><span className="block truncate text-xs text-muted">{r.artist}</span></span>
                  <Plus size={15} className="ml-auto text-brand" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 space-y-2">
          {selected.length === 0 && <p className="text-sm text-faint">Nenhum disco vinculado ainda. Busque acima para adicionar.</p>}
          {selected.map((r, i) => (
            <div key={r.id} className="flex items-center gap-3 rounded-xl border border-line bg-bg-soft p-2">
              <GripVertical size={15} className="text-faint" />
              <span className="w-5 text-center text-xs text-faint">{i + 1}</span>
              {r.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.cover_image_url} alt="" className="h-10 w-10 rounded object-cover" />
              ) : <span className="flex h-10 w-10 items-center justify-center rounded bg-panel text-faint"><Disc3 size={16} /></span>}
              <span className="min-w-0 flex-1"><span className="block truncate text-sm text-ink">{r.title}</span><span className="block truncate text-xs text-muted">{r.artist}</span></span>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1.5 text-faint hover:text-brand disabled:opacity-30"><ArrowUp size={15} /></button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === selected.length - 1} className="rounded p-1.5 text-faint hover:text-brand disabled:opacity-30"><ArrowDown size={15} /></button>
              <button type="button" onClick={() => setSelectedIds((ids) => ids.filter((x) => x !== r.id))} className="rounded p-1.5 text-faint hover:text-red-400"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      </Section>

      {/* Blocos extras */}
      <Section title="Blocos extras da página" desc="Informações livres na página do box.">
        <div className="mb-4 flex flex-wrap gap-2">
          <AddBlockBtn icon={Type} label="Texto" onClick={() => addBlock("text")} />
          <AddBlockBtn icon={Heading} label="Título" onClick={() => addBlock("heading")} />
          <AddBlockBtn icon={Quote} label="Citação" onClick={() => addBlock("quote")} />
          <AddBlockBtn icon={ListTree} label="Especificação" onClick={() => addBlock("spec")} />
        </div>
        <div className="space-y-3">
          {blocks.map((b) => (
            <div key={b.id} className="flex gap-2 rounded-xl border border-line bg-bg-soft p-3">
              <div className="flex-1">
                {b.type === "heading" && <input className="ipt" placeholder="Título da seção" value={b.title} onChange={(e) => setBlocks((bl) => bl.map((x) => x.id === b.id ? { ...x, title: e.target.value } : x))} />}
                {b.type === "spec" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <input className="ipt" placeholder="Campo" value={b.key} onChange={(e) => setBlocks((bl) => bl.map((x) => x.id === b.id ? { ...x, key: e.target.value } : x))} />
                    <input className="ipt" placeholder="Valor" value={b.value} onChange={(e) => setBlocks((bl) => bl.map((x) => x.id === b.id ? { ...x, value: e.target.value } : x))} />
                  </div>
                ) : b.type !== "heading" ? (
                  <textarea className="ipt" rows={2} placeholder={b.type === "quote" ? "Citação…" : "Texto…"} value={b.content} onChange={(e) => setBlocks((bl) => bl.map((x) => x.id === b.id ? { ...x, content: e.target.value } : x))} />
                ) : null}
              </div>
              <button type="button" onClick={() => setBlocks((bl) => bl.filter((x) => x.id !== b.id))} className="mt-1 h-8 rounded-lg p-1.5 text-faint hover:text-red-400"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      </Section>

      {/* salvar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-panel/95 backdrop-blur md:left-64">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-3">
          <button type="button" onClick={() => router.back()} className="text-sm text-muted hover:text-ink">Cancelar</button>
          <button type="submit" disabled={saving} className="btn-brand flex items-center gap-2 rounded-xl px-6 py-3 text-sm disabled:opacity-60">
            {saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
            {isEdit ? "Salvar alterações" : "Publicar box"}
          </button>
        </div>
      </div>

      {cropper && (
        <ImageCropper file={cropper.file} onCancel={() => setCropper(null)} onDone={(blob) => { cropper.onApply(blob); setCropper(null); }} />
      )}

      <style jsx global>{`
        .ipt { width: 100%; border-radius: 0.75rem; border: 1px solid var(--color-line); background: var(--color-bg-soft); padding: 0.6rem 0.8rem; font-size: 0.9rem; color: var(--color-ink); outline: none; }
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
      <span className={cn("inline-flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors", checked ? "bg-brand" : "bg-panel-2")}>
        <span className={cn("h-5 w-5 rounded-full bg-white shadow transition-transform duration-200", checked ? "translate-x-5" : "translate-x-0")} />
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
