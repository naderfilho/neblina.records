"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Image as ImageIcon, Music, X, Plus, Trash2, Loader2, Save, Crop,
  Type, Heading, Quote, ListTree, GripVertical, Sparkles, Star, Info, Check, Tag as TagIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/upload";
import {
  QUALITY_GRADES, QUALITY_META, RECORD_FORMATS, PAYMENT_METHODS, DEFAULT_DISC_CONFIG,
  PHOTO_CATEGORIES, NEBLINA_AI, SOUND_MODES, DISC_COUNTS, type DiscConfig,
} from "@/lib/constants";
import type {
  RecordItem, RecordPhoto, ExtraBlock, Tag,
  ConditionInfo, IncludedContent, HistoryInfo, MarketInfo, IdentificationInfo, SaleInfo,
} from "@/lib/types";
import VinylDesigner from "@/components/admin/VinylDesigner";
import AudioTrimmer from "@/components/admin/AudioTrimmer";
import ImageCropper from "@/components/admin/ImageCropper";
import { logAction } from "@/lib/audit";
import { cn } from "@/lib/utils";

type PhotoItem = { id: string; url: string; category: string; file?: File };
type Suggestions = { genres: string[]; nationalities: string[]; artists: string[] };

/**
 * Executa uma etapa do salvamento rotulando o erro, para saber exatamente onde
 * falhou. Erros de RLS quase sempre significam sessão expirada (o token não
 * chega ao Postgres, então `auth.uid()` é nulo e `is_admin()` dá falso).
 */
async function step<T>(label: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/row-level security|violates row-level/i.test(msg)) {
      throw new Error(`Sem permissão ao ${label}. Sua sessão provavelmente expirou — faça login novamente e tente salvar.`);
    }
    throw new Error(`Falha ao ${label}: ${msg}`);
  }
}

/**
 * Lê a resposta de uma rota de IA com segurança. As rotas sempre respondem JSON,
 * mas a plataforma (Vercel) pode devolver uma página de erro em texto puro quando
 * a função estoura o tempo limite (timeout) — aí um `res.json()` direto quebra com
 * "Unexpected token 'A'…". Aqui lemos como texto e só então tentamos o JSON,
 * traduzindo o erro para uma mensagem clara.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function readJsonResponse(res: Response): Promise<any> {
  const raw = await res.text();
  let json: { error?: string; [k: string]: unknown } | null = null;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    // resposta não-JSON: timeout / erro de plataforma / HTML de erro
    if (res.status === 504 || res.status === 408 || /timeout|timed out|FUNCTION_INVOCATION_TIMEOUT/i.test(raw)) {
      throw new Error("A IA demorou demais e a conexão expirou (timeout). Tente de novo — costuma responder na 2ª tentativa.");
    }
    throw new Error(`O servidor respondeu de forma inesperada (${res.status || "sem status"}). Tente novamente em instantes.`);
  }
  if (!res.ok) {
    throw new Error((json?.error as string) || `Erro ${res.status} na IA.`);
  }
  return json ?? {};
}

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
  const [payments, setPayments] = useState<string[]>(record?.payment_methods ?? ["Pix (Brasil)"]);
  const [discConfig, setDiscConfig] = useState<DiscConfig>(record?.disc_config ?? DEFAULT_DISC_CONFIG);

  const [condition, setCondition] = useState<ConditionInfo>(record?.condition ?? {});
  const [content, setContent] = useState<IncludedContent>(record?.included_content ?? {});
  const [history, setHistory] = useState<HistoryInfo>(record?.history ?? {});
  const [market, setMarket] = useState<MarketInfo>(record?.market ?? {});
  const [ident, setIdent] = useState<IdentificationInfo>(record?.identification ?? {});
  const [sale, setSale] = useState<SaleInfo>(record?.sale_info ?? {});
  const [tagIds, setTagIds] = useState<string[]>(record?.tag_ids ?? []);
  const [allTags, setAllTags] = useState<Tag[]>([]);

  // registro de venda
  const [sold, setSold] = useState(record?.sold ?? false);
  const [soldChannel, setSoldChannel] = useState(record?.sold_channel ?? "");
  const [soldToUserId, setSoldToUserId] = useState<string | null>(record?.sold_to_user_id ?? null);
  const [soldToName, setSoldToName] = useState(record?.sold_to_name ?? "");
  const [soldNote, setSoldNote] = useState(record?.sold_note ?? "");
  const [users, setUsers] = useState<{ id: string; first_name: string | null; last_name: string | null; email: string | null }[]>([]);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(record?.cover_image_url ?? null);

  const [isGatefold, setIsGatefold] = useState(record?.is_gatefold ?? false);
  const [gatefoldDir, setGatefoldDir] = useState<"side" | "down">(record?.gatefold_dir ?? "side");
  const [gatefoldFile, setGatefoldFile] = useState<File | null>(null);
  const [gatefoldPreview, setGatefoldPreview] = useState<string | null>(record?.gatefold_image_url ?? null);

  const [photos, setPhotos] = useState<PhotoItem[]>(
    existingPhotos.map((p) => ({ id: p.id, url: p.url, category: p.category ?? "outro" })),
  );

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(record?.audio_url ?? null);
  const [audioStart, setAudioStart] = useState(record?.audio_start ?? 0);
  const [audioEnd, setAudioEnd] = useState<number | null>(record?.audio_end ?? null);

  type TrackItem = { id: string; side: "A" | "B"; title: string; audioUrl: string | null; file?: File };
  const [tracks, setTracks] = useState<TrackItem[]>(
    (record?.tracks ?? []).map((t) => ({ id: t.id, side: t.side, title: t.title, audioUrl: t.audio_url })),
  );
  const [homeTrackId, setHomeTrackId] = useState<string | null>(record?.home_track_id ?? null);

  const [blocks, setBlocks] = useState<ExtraBlock[]>(
    Array.isArray(record?.extra_blocks) ? (record!.extra_blocks as ExtraBlock[]) : [],
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [aiBusy, setAiBusy] = useState<"idle" | "research">("idle");
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiCost, setAiCost] = useState(0);

  const [cropper, setCropper] = useState<{ file: File; onApply: (b: Blob) => void } | null>(null);

  const coverInput = useRef<HTMLInputElement>(null);
  const gatefoldInput = useRef<HTMLInputElement>(null);
  const photosInput = useRef<HTMLInputElement>(null);
  const audioInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("tags").select("*").order("created_at").then(({ data }) => {
      if (data) setAllTags(data as Tag[]);
    });
    supabase.from("profiles").select("id,first_name,last_name,email").order("first_name").then(({ data }) => {
      if (data) setUsers(data as typeof users);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const audioPreviewSrc = useMemo(
    () => (audioFile ? URL.createObjectURL(audioFile) : audioUrl),
    [audioFile, audioUrl],
  );

  const homeTrackObj = tracks.find((t) => t.id === homeTrackId);
  const homeTrackSrc = useMemo(
    () => (homeTrackObj?.file ? URL.createObjectURL(homeTrackObj.file) : homeTrackObj?.audioUrl ?? null),
    [homeTrackObj?.file, homeTrackObj?.audioUrl],
  );

  function addTrack(side: "A" | "B") {
    setTracks((t) => [...t, { id: crypto.randomUUID(), side, title: "", audioUrl: null }]);
  }
  function onTrackAudio(id: string, file: File) {
    setTracks((t) => t.map((x) => (x.id === id ? { ...x, file, audioUrl: URL.createObjectURL(file) } : x)));
  }

  function onCover(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setCropper({
      file: f,
      onApply: (blob) => {
        setCoverFile(new File([blob], "cover.jpg", { type: "image/jpeg" }));
        setCoverPreview(URL.createObjectURL(blob));
      },
    });
    e.target.value = "";
  }

  function onPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setPhotos((prev) => [
      ...prev,
      ...files.map((f) => ({ id: crypto.randomUUID(), url: URL.createObjectURL(f), category: "outro", file: f })),
    ]);
    e.target.value = "";
  }

  async function cropPhoto(p: PhotoItem) {
    let file = p.file;
    if (!file) {
      try { const resp = await fetch(p.url); const blob = await resp.blob(); file = new File([blob], "photo.jpg", { type: blob.type || "image/jpeg" }); }
      catch { return; }
    }
    setCropper({
      file,
      onApply: (blob) => {
        setPhotos((prev) => prev.map((x) => (x.id === p.id ? { ...x, file: new File([blob], "photo.jpg", { type: "image/jpeg" }), url: URL.createObjectURL(blob) } : x)));
      },
    });
  }

  function onAudio(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setAudioFile(f);
    setAudioUrl(null);
    setAudioStart(0);
    setAudioEnd(null);
  }

  function onGatefold(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setGatefoldFile(f);
    setGatefoldPreview(URL.createObjectURL(f));
    e.target.value = "";
  }

  function addBlock(type: ExtraBlock["type"]) {
    setBlocks((b) => [...b, { id: crypto.randomUUID(), type, content: "", title: "", key: "", value: "" }]);
  }

  // ---- Neblina IA ----
  async function coverBase64(): Promise<{ data: string; mediaType: string } | null> {
    const src = coverFile ?? (coverPreview ? await fetch(coverPreview).then((r) => r.blob()).catch(() => null) : null);
    if (!src) return null;
    const dataUrl = await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(src); });
    const [meta, b64] = dataUrl.split(",");
    return { data: b64, mediaType: meta.match(/data:(.*?);/)?.[1] || "image/jpeg" };
  }

  function fill<T>(setter: (v: T) => void, val: T | undefined | null) {
    if (val !== undefined && val !== null && val !== "") setter(val);
  }

  function applyResearch(d: {
    genre?: string; nationality?: string; label_company?: string; format?: string;
    description?: string; year?: number | null;
    history?: HistoryInfo; market?: MarketInfo; identification?: IdentificationInfo;
    tracks?: { side?: string; title?: string }[];
  }) {
    fill(setGenre, d.genre); fill(setNationality, d.nationality); fill(setLabelCompany, d.label_company);
    fill(setFormat, d.format); fill(setDescription, d.description);
    fill(setYear, d.year != null ? String(d.year) : undefined);
    if (d.history) setHistory((h) => ({ ...h, ...d.history }));
    if (d.market) setMarket((m) => ({ ...m, ...d.market }));
    if (d.identification) setIdent((i) => ({ ...i, ...d.identification }));
    if (Array.isArray(d.tracks) && d.tracks.length) {
      setTracks(d.tracks.map((t) => ({
        id: crypto.randomUUID(), side: t.side === "B" ? "B" : "A", title: t.title || "Faixa", audioUrl: null,
      })));
    }
  }

  // Neblina IA — usa a CAPA + nome do disco + artista (informados pelo admin) e
  // pesquisa somente no Discogs. Sem margem de erro: exige os três.
  async function runNeblinaIA() {
    setAiError(null);
    const t = title.trim();
    const a = artist.trim();
    if (!t || !a) { setAiError("Preencha o nome do disco e o nome do artista antes de usar a IA."); return; }
    const b = await coverBase64();
    if (!b) { setAiError("Envie a foto da capa primeiro."); return; }

    setAiBusy("research");
    try {
      const res = await fetch("/api/ai/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t, artist: a, year, imageBase64: b.data, mediaType: b.mediaType }),
      });
      const j = await readJsonResponse(res);
      applyResearch(j.data ?? {});
      if (typeof j.costUsd === "number") setAiCost((c) => c + j.costUsd);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Erro na pesquisa da IA");
    } finally {
      setAiBusy("idle");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !artist.trim()) { setError("Título e artista são obrigatórios."); return; }
    setSaving(true);
    const supabase = createClient();

    try {
      // Revalida a sessão antes de escrever: se o access token tiver expirado
      // (formulário aberto por muito tempo), o refresh acontece aqui. Sem isso a
      // escrita chega sem auth.uid() e a RLS recusa ("new row violates row-level
      // security policy").
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Sua sessão expirou. Faça login novamente e salve de novo (os dados do formulário continuam aqui).");
      }

      let coverUrlFinal = coverPreview;
      if (coverFile) coverUrlFinal = await step("enviar a capa", () => uploadFile("covers", coverFile, "cover-"));

      let gatefoldUrlFinal = gatefoldPreview;
      if (gatefoldFile) gatefoldUrlFinal = await step("enviar a arte do gatefold", () => uploadFile("covers", gatefoldFile, "gatefold-"));

      let audioUrlFinal = audioUrl;
      if (audioFile) audioUrlFinal = await step("enviar o áudio", () => uploadFile("audio", audioFile, "audio-"));

      const finalPhotos: { url: string; category: string }[] = [];
      for (const p of photos) {
        const url = p.file ? await step("enviar uma foto do disco", () => uploadFile("record-photos", p.file!, "photo-")) : p.url;
        finalPhotos.push({ url, category: p.category || "outro" });
      }

      const finalTracks: { id: string; side: "A" | "B"; title: string; audio_url: string | null }[] = [];
      for (const t of tracks) {
        let url = t.audioUrl;
        if (t.file) url = await step(`enviar o áudio da faixa "${t.title || "sem nome"}"`, () => uploadFile("audio", t.file!, "track-"));
        finalTracks.push({ id: t.id, side: t.side, title: t.title.trim() || "Faixa", audio_url: url });
      }
      const homeTrack = finalTracks.find((t) => t.id === homeTrackId);

      const payload = {
        title: title.trim(), artist: artist.trim(),
        genre: genre.trim() || null, nationality: nationality.trim() || null,
        format: format || null, weight_grams: weight ? parseFloat(weight) : null,
        disc_quality: discQuality || null, cover_quality: coverQuality || null,
        price: price ? parseFloat(price) : 0, year: year ? parseInt(year) : null,
        label_company: labelCompany.trim() || null, catalog_number: catalog.trim() || null,
        stock_qty: stock ? parseInt(stock) : 1, description: description.trim() || null,
        is_published: published, is_featured: featured,
        sold,
        sold_channel: sold ? (soldChannel || null) : null,
        sold_to_user_id: sold ? soldToUserId : null,
        sold_to_name: sold ? (soldToName.trim() || null) : null,
        sold_at: sold ? (record?.sold_at ?? new Date().toISOString()) : null,
        sold_note: sold ? (soldNote.trim() || null) : null,
        payment_methods: payments, disc_config: discConfig,
        cover_image_url: coverUrlFinal,
        is_gatefold: isGatefold,
        gatefold_image_url: isGatefold ? gatefoldUrlFinal : null,
        gatefold_dir: gatefoldDir,
        audio_url: homeTrack?.audio_url ?? audioUrlFinal,
        audio_start: audioStart, audio_end: audioEnd,
        tracks: finalTracks, home_track_id: homeTrackId,
        condition, included_content: content, history, market,
        identification: ident, sale_info: sale, tag_ids: tagIds,
        sort_order: record?.sort_order ?? 0,
        extra_blocks: blocks,
      };

      let recordId = record?.id;
      if (isEdit) {
        await step("salvar as alterações do disco", async () => {
          const { error } = await supabase.from("records").update(payload).eq("id", record!.id);
          if (error) throw error;
        });
      } else {
        recordId = await step("criar o disco", async () => {
          const { data, error } = await supabase.from("records").insert(payload).select("id").single();
          if (error) throw error;
          return data.id as string;
        });
      }

      // histórico de ações
      if (isEdit && record) {
        const changes: Record<string, [unknown, unknown]> = {};
        const cmp = (label: string, before: unknown, after: unknown) => {
          if (String(before ?? "") !== String(after ?? "")) changes[label] = [before ?? null, after ?? null];
        };
        cmp("Título", record.title, payload.title);
        cmp("Artista", record.artist, payload.artist);
        cmp("Estilo", record.genre, payload.genre);
        cmp("Preço", record.price, payload.price);
        cmp("Ano", record.year, payload.year);
        cmp("Estoque", record.stock_qty, payload.stock_qty);
        cmp("Publicado", record.is_published, payload.is_published);
        cmp("Destaque", record.is_featured, payload.is_featured);
        cmp("Vendido", record.sold, payload.sold);
        logAction("update", "record", record.id, payload.title, { alteracoes: changes });
      } else if (recordId) {
        logAction("create", "record", recordId, payload.title, {});
      }

      if (recordId) {
        await supabase.from("record_photos").delete().eq("record_id", recordId);
        if (finalPhotos.length) {
          await supabase.from("record_photos").insert(
            finalPhotos.map((p, i) => ({ record_id: recordId, url: p.url, category: p.category, sort_order: i })),
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

  const aiCostLine = `IA ${NEBLINA_AI.fullCost}/disco${aiCost > 0 ? ` · gasto US$ ${aiCost.toFixed(3)}` : ""}`;

  return (
    <form onSubmit={submit} className="space-y-8 pb-24">
      {error && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}

      {/* 1. Capa (com Neblina IA + gatefold) */}
      <Section title="Capa" desc="A capa aparece na Audioteca (na estante e no toca-discos) e pode virar o centro do vinil.">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => coverInput.current?.click()} className="flex items-center gap-2 rounded-xl border border-line bg-panel px-4 py-2.5 text-sm hover:border-brand/50">
            <ImageIcon size={16} /> {coverPreview ? "Trocar foto da capa" : "Enviar foto da capa"}
          </button>
          {coverPreview && (
            <button type="button" onClick={() => { setCoverFile(null); setCoverPreview(null); }} className="text-sm text-faint hover:text-red-400">Remover</button>
          )}
          <input ref={coverInput} type="file" accept="image/*" hidden onChange={onCover} />
        </div>

        {/* Neblina IA — capa + nome do disco + artista (0 margem de erro) */}
        {coverPreview && (
          <div className="mb-3 rounded-xl border border-brand/30 bg-brand/5 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-brand">
              <Sparkles size={13} /> Neblina IA - Agente Discogs
            </p>
            <p className="mb-2.5 text-[11px] text-muted">
              Para máxima precisão, confirme o nome do disco e do artista abaixo. A IA lê a capa com atenção e cruza com o Discogs.
            </p>
            <div className="mb-2.5 grid gap-2 sm:grid-cols-2">
              <input className="ipt" placeholder="Nome do disco *" value={title} onChange={(e) => setTitle(e.target.value)} />
              <input className="ipt" placeholder="Nome do artista *" value={artist} onChange={(e) => setArtist(e.target.value)} />
            </div>
            <button
              type="button"
              onClick={runNeblinaIA}
              disabled={aiBusy !== "idle" || !title.trim() || !artist.trim()}
              title={`Neblina IA · lê a capa e pesquisa ficha, histórico, mercado e faixas no Discogs · ${NEBLINA_AI.fullCost}/disco`}
              className="flex items-center gap-1.5 rounded-lg border border-brand/40 bg-brand/10 px-3 py-2 text-xs font-semibold text-brand hover:bg-brand/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {aiBusy !== "idle" ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {aiBusy === "research" ? "Lendo a capa e pesquisando no Discogs…" : "Pesquisar"}
            </button>
            {(!title.trim() || !artist.trim()) && (
              <p className="mt-2 text-[11px] text-faint">Preencha o nome do disco e do artista para liberar a IA.</p>
            )}
          </div>
        )}
        {aiError && <p className="mb-3 flex items-center gap-1.5 text-xs text-red-400"><Info size={13} /> {aiError}</p>}

        {coverPreview && (
          <div className="mb-2 flex items-start gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverPreview} alt="Prévia da capa" className="h-28 w-28 shrink-0 rounded-lg border border-line object-cover" />
            <p className="text-xs text-faint">Esta é a capa exibida na Audioteca. Para usá-la como centro do vinil, escolha o estilo de centro “Foto da Capa” na seção Vinil.</p>
          </div>
        )}

        {/* Gatefold */}
        <div className="mt-3 rounded-xl border border-line bg-bg-soft p-4">
          <Toggle label="Capa dupla (Gatefold)" checked={isGatefold} onChange={setIsGatefold} />
          {isGatefold && (
            <div className="mt-4 space-y-3">
              <p className="text-xs text-muted">Envie a arte interna completa (aberta). Na Audioteca a capa deste disco abre e fecha revelando essa arte.</p>

              <div>
                <p className="mb-1.5 text-xs uppercase tracking-wider text-muted">Como a capa abre</p>
                <div className="flex gap-2">
                  {([["side", "Para o lado"], ["down", "Para baixo"]] as const).map(([id, label]) => (
                    <button key={id} type="button" onClick={() => setGatefoldDir(id)}
                      className={cn("rounded-lg border px-3 py-1.5 text-xs", gatefoldDir === id ? "border-brand bg-brand/15 text-brand" : "border-line text-muted hover:text-ink")}>
                      {label}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-faint">
                  {gatefoldDir === "side" ? "Envie a arte aberta na horizontal (paisagem — duas metades lado a lado)." : "Envie a arte aberta na vertical (retrato — duas metades uma sobre a outra)."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => gatefoldInput.current?.click()} className="flex items-center gap-2 rounded-xl border border-line bg-panel px-4 py-2.5 text-sm hover:border-brand/50">
                  <ImageIcon size={16} /> {gatefoldPreview ? "Trocar arte interna" : "Enviar arte interna (aberta)"}
                </button>
                {gatefoldPreview && <button type="button" onClick={() => { setGatefoldFile(null); setGatefoldPreview(null); }} className="text-sm text-faint hover:text-red-400">Remover</button>}
                <input ref={gatefoldInput} type="file" accept="image/*" hidden onChange={onGatefold} />
              </div>
              {gatefoldPreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={gatefoldPreview} alt="Arte interna (gatefold)" className="max-h-44 w-full max-w-xl rounded-lg border border-line object-cover" />
              )}
            </div>
          )}
        </div>
      </Section>

      {/* 1b. Vinil */}
      <Section title="Vinil" desc="Personalize o vinil que aparece na home e na Audioteca (cor, estilo, centro e borda).">
        <VinylDesigner coverUrl={coverPreview} config={discConfig} onChange={setDiscConfig} />
      </Section>

      {/* 2. Informações do disco (com formas de pagamento) */}
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
          <Field label="Tipo de disco">
            <select className="ipt" value={format} onChange={(e) => setFormat(e.target.value)}>
              {RECORD_FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </Field>
          <Field label="Canais (Mono/Estéreo)">
            <select className="ipt" value={ident.sound_mode ?? ""} onChange={(e) => setIdent((i) => ({ ...i, sound_mode: e.target.value }))}>
              <option value="">—</option>
              {SOUND_MODES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Discos (Simples/Duplo/Triplo)">
            <select className="ipt" value={ident.disc_count ?? ""} onChange={(e) => setIdent((i) => ({ ...i, disc_count: e.target.value }))}>
              <option value="">—</option>
              {DISC_COUNTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Peso (g)"><input className="ipt" type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} /></Field>
          <Field label="Ano"><input className="ipt" type="number" value={year} onChange={(e) => setYear(e.target.value)} /></Field>
          <Field label="Gravadora"><input className="ipt" value={labelCompany} onChange={(e) => setLabelCompany(e.target.value)} /></Field>
          <Field label="Nº de catálogo"><input className="ipt" value={catalog} onChange={(e) => setCatalog(e.target.value)} /></Field>
          <Field label="Estoque"><input className="ipt" type="number" value={stock} onChange={(e) => setStock(e.target.value)} /></Field>
          <Field label="Qualidade do disco (Goldmine)">
            <select className="ipt" value={discQuality} onChange={(e) => setDiscQuality(e.target.value)}>
              <option value="">—</option>
              {QUALITY_GRADES.map((q) => <option key={q} value={q}>{QUALITY_META[q].label}</option>)}
            </select>
          </Field>
          <Field label="Qualidade da capa (Goldmine)">
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
              <button key={m} type="button"
                onClick={() => setPayments((p) => (p.includes(m) ? p.filter((x) => x !== m) : [...p, m]))}
                className={cn("rounded-lg border px-3 py-1.5 text-xs", payments.includes(m) ? "border-brand bg-brand/15 text-brand" : "border-line text-muted hover:text-ink")}>
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

      {/* 3. Histórico */}
      <Section title="Histórico" desc="Contexto, curiosidades e importância do álbum. A Neblina IA (lá em cima) preenche tudo isto pra você.">
        <div className="grid gap-4">
          {([["context", "Contexto do álbum"], ["curiosities", "Curiosidades"], ["historical_importance", "Importância histórica"], ["career_position", "Posição na carreira"], ["musical_influence", "Influência musical"]] as const).map(([key, label]) => (
            <Field key={key} label={label}>
              <textarea className="ipt" rows={2} value={history[key] ?? ""} onChange={(e) => setHistory((h) => ({ ...h, [key]: e.target.value }))} />
            </Field>
          ))}
        </div>
      </Section>

      {/* 4. Faixas */}
      <Section title="Faixas — Lado A e Lado B" desc="Viram os sulcos do disco na página: hover mostra o nome, clique toca. Marque qual toca na home.">
        <div className="grid gap-6 md:grid-cols-2">
          {(["A", "B"] as const).map((side) => {
            const sideTracks = tracks.filter((t) => t.side === side);
            return (
              <div key={side}>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-display text-lg text-ink">Lado {side}</h3>
                  <button type="button" onClick={() => addTrack(side)} className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:border-brand/50 hover:text-brand">
                    <Plus size={14} /> Faixa
                  </button>
                </div>
                <div className="space-y-2">
                  {sideTracks.length === 0 && <p className="text-xs text-faint">Nenhuma faixa.</p>}
                  {sideTracks.map((t, idx) => (
                    <div key={t.id} className="flex items-center gap-2 rounded-lg border border-line bg-bg-soft p-2">
                      <span className="w-4 text-center text-xs text-faint">{idx + 1}</span>
                      <input className="ipt flex-1" placeholder="Nome da faixa" value={t.title}
                        onChange={(e) => setTracks((ts) => ts.map((x) => (x.id === t.id ? { ...x, title: e.target.value } : x)))} />
                      <label className={`flex cursor-pointer items-center gap-1 rounded-lg border px-2 py-1.5 text-xs ${t.audioUrl ? "border-teal/50 text-teal" : "border-line text-muted hover:text-brand"}`} title={t.audioUrl ? "Áudio enviado" : "Enviar áudio"}>
                        <Music size={13} />
                        <input type="file" accept="audio/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onTrackAudio(t.id, f); }} />
                      </label>
                      <label className="flex items-center gap-1 text-[11px] text-muted" title="Toca na home">
                        <input type="radio" name="hometrack" checked={homeTrackId === t.id} onChange={() => setHomeTrackId(t.id)} className="accent-brand" /> home
                      </label>
                      <button type="button" onClick={() => { setTracks((ts) => ts.filter((x) => x.id !== t.id)); if (homeTrackId === t.id) setHomeTrackId(null); }} className="text-faint hover:text-red-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 5. Áudio da home */}
      <Section title="Áudio da home" desc="Trecho que toca ao passar o mouse no disco na home.">
        {homeTrackId && homeTrackSrc ? (
          <>
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-sm text-ink">
              <Info size={16} className="mt-0.5 shrink-0 text-brand" />
              <span>
                Música escolhida pela área de Faixas: <strong>{homeTrackObj?.title || "faixa"}</strong>{" "}
                (Lado {homeTrackObj?.side}). Recorte abaixo o melhor trecho que vai tocar na home.
              </span>
            </div>
            <AudioTrimmer
              key={homeTrackId}
              url={homeTrackSrc}
              start={audioStart}
              end={audioEnd}
              onChange={({ start, end }) => { setAudioStart(start); setAudioEnd(end); }}
            />
          </>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3">
              <button type="button" onClick={() => audioInput.current?.click()} className="flex items-center gap-2 rounded-xl border border-line bg-panel px-4 py-2.5 text-sm hover:border-brand/50">
                <Music size={16} /> {audioPreviewSrc ? "Trocar áudio" : "Enviar áudio"}
              </button>
              {audioPreviewSrc && <button type="button" onClick={() => { setAudioFile(null); setAudioUrl(null); }} className="text-sm text-faint hover:text-red-400">Remover</button>}
              <input ref={audioInput} type="file" accept="audio/*" hidden onChange={onAudio} />
            </div>
            {audioPreviewSrc ? (
              <AudioTrimmer url={audioPreviewSrc} start={audioStart} end={audioEnd}
                onChange={({ start, end }) => { setAudioStart(start); setAudioEnd(end); }} />
            ) : (
              <p className="text-sm text-faint">Marque uma faixa como <strong className="text-muted">home</strong> na área de Faixas (ela aparece aqui pra recortar) ou envie um áudio avulso.</p>
            )}
          </>
        )}
      </Section>

      {/* 6. Conteúdo incluso */}
      <Section title="Conteúdo incluso" desc="Marque o que acompanha o disco.">
        <div className="flex flex-wrap gap-2">
          {([["booklet", "Livreto"], ["insert", "Encarte"], ["poster", "Pôster"], ["sticker", "Sticker"], ["original_sleeve", "Sleeve original"]] as const).map(([key, label]) => {
            const on = !!content[key];
            return (
              <button key={key} type="button"
                onClick={() => setContent((c) => ({ ...c, [key]: !c[key] }))}
                className={cn("flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm", on ? "border-brand/40 bg-brand/10 text-ink" : "border-line text-muted hover:text-ink")}>
                {on && <Check size={14} className="text-brand" strokeWidth={3} />} {label}
              </button>
            );
          })}
        </div>
      </Section>

      {/* 7. Condição detalhada */}
      <Section title="Condição detalhada">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Riscos"><input className="ipt" value={condition.scratches ?? ""} onChange={(e) => setCondition((c) => ({ ...c, scratches: e.target.value }))} placeholder="Ex: leves na face B" /></Field>
          <Field label="Chiados"><input className="ipt" value={condition.noise ?? ""} onChange={(e) => setCondition((c) => ({ ...c, noise: e.target.value }))} placeholder="Ex: baixo, só no início" /></Field>
          <Field label="Empenamento"><input className="ipt" value={condition.warp ?? ""} onChange={(e) => setCondition((c) => ({ ...c, warp: e.target.value }))} placeholder="Ex: nenhum" /></Field>
          <Field label="Marcas"><input className="ipt" value={condition.marks ?? ""} onChange={(e) => setCondition((c) => ({ ...c, marks: e.target.value }))} placeholder="Ex: escrita na capa" /></Field>
        </div>
      </Section>

      {/* 8. Mercado (preenchido pela Neblina IA) */}
      <Section title="Mercado" desc="A Neblina IA (lá em cima) preenche estes valores automaticamente. Ajuste se precisar.">
        <p className="text-xs text-faint">{aiCostLine}</p>
        {aiError && <p className="flex items-center gap-1.5 text-xs text-red-400"><Info size={13} /> {aiError}</p>}
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Faixa de preço atual"><input className="ipt" value={market.price_range ?? ""} onChange={(e) => setMarket((m) => ({ ...m, price_range: e.target.value }))} /></Field>
          <Field label="Valor médio internacional"><input className="ipt" value={market.avg_international ?? ""} onChange={(e) => setMarket((m) => ({ ...m, avg_international: e.target.value }))} /></Field>
          <Field label="Valor médio no Brasil"><input className="ipt" value={market.avg_brazil ?? ""} onChange={(e) => setMarket((m) => ({ ...m, avg_brazil: e.target.value }))} /></Field>
        </div>
        <div>
          <p className="mb-1.5 text-xs uppercase tracking-wider text-muted">Raridade</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setMarket((m) => ({ ...m, rarity: n }))}>
                <Star size={24} className={n <= (market.rarity ?? 0) ? "fill-brand text-brand" : "text-faint"} />
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* 9. Etiquetas */}
      <Section title="Etiquetas (tags)" desc="Aparecem em cima do disco na home e permitem filtrar (ex: Mais Vendido, Promoção).">
        <div className="flex flex-wrap items-center gap-2">
          {allTags.length === 0 && <p className="text-sm text-faint">Nenhuma tag criada ainda.</p>}
          {allTags.map((t) => {
            const on = tagIds.includes(t.id);
            return (
              <button key={t.id} type="button"
                onClick={() => setTagIds((ids) => (on ? ids.filter((x) => x !== t.id) : [...ids, t.id]))}
                className={cn("rounded-full px-3 py-1.5 text-xs font-bold ring-2 transition", on ? "ring-brand" : "ring-transparent opacity-70 hover:opacity-100")}
                style={{ background: t.bg, color: t.fg }}>
                {t.label}
              </button>
            );
          })}
          <Link href="/admin/tags" className="flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs text-muted hover:text-brand">
            <TagIcon size={13} /> Gerenciar tags
          </Link>
        </div>
      </Section>

      {/* 10. Identificação */}
      <Section title="Identificação">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Matrix Lado A"><input className="ipt" value={ident.matrix_a ?? ""} onChange={(e) => setIdent((i) => ({ ...i, matrix_a: e.target.value }))} /></Field>
          <Field label="Matrix Lado B"><input className="ipt" value={ident.matrix_b ?? ""} onChange={(e) => setIdent((i) => ({ ...i, matrix_b: e.target.value }))} /></Field>
          <Field label="Label Code"><input className="ipt" value={ident.label_code ?? ""} onChange={(e) => setIdent((i) => ({ ...i, label_code: e.target.value }))} /></Field>
          <Field label="Série"><input className="ipt" value={ident.series ?? ""} onChange={(e) => setIdent((i) => ({ ...i, series: e.target.value }))} /></Field>
        </div>
      </Section>

      {/* 10b. Produção (onde foi feito) */}
      <Section title="Produção" desc="Onde o disco foi gravado, mixado, masterizado e prensado. Ex.: “Abbey Road Studios, Londres”.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Gravado em"><input className="ipt" value={ident.recorded_at ?? ""} onChange={(e) => setIdent((i) => ({ ...i, recorded_at: e.target.value }))} /></Field>
          <Field label="Mixado em"><input className="ipt" value={ident.mixed_at ?? ""} onChange={(e) => setIdent((i) => ({ ...i, mixed_at: e.target.value }))} /></Field>
          <Field label="Masterizado em"><input className="ipt" value={ident.mastered_at ?? ""} onChange={(e) => setIdent((i) => ({ ...i, mastered_at: e.target.value }))} /></Field>
          <Field label="Prensado em"><input className="ipt" value={ident.pressed_at ?? ""} onChange={(e) => setIdent((i) => ({ ...i, pressed_at: e.target.value }))} /></Field>
        </div>
      </Section>

      {/* Fotos reais */}
      <Section title="Fotos reais do disco" desc="Aparecem na página do disco. Escolha a categoria de cada foto e ajuste com o recorte.">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((p) => (
            <div key={p.id} className="space-y-1.5">
              <div className="group relative aspect-square overflow-hidden rounded-xl border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => cropPhoto(p)} className="absolute left-1 top-1 rounded-full bg-black/70 p-1.5 text-white opacity-0 group-hover:opacity-100" title="Recortar">
                  <Crop size={13} />
                </button>
                <button type="button" onClick={() => setPhotos((prev) => prev.filter((x) => x.id !== p.id))} className="absolute right-1 top-1 rounded-full bg-black/70 p-1.5 text-white opacity-0 group-hover:opacity-100">
                  <X size={13} />
                </button>
              </div>
              <select className="ipt !py-1.5 text-xs" value={p.category}
                onChange={(e) => setPhotos((prev) => prev.map((x) => (x.id === p.id ? { ...x, category: e.target.value } : x)))}>
                {PHOTO_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          ))}
          <button type="button" onClick={() => photosInput.current?.click()} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line text-faint hover:border-brand/50 hover:text-brand">
            <Plus size={20} /><span className="text-xs">Adicionar</span>
          </button>
          <input ref={photosInput} type="file" accept="image/*" multiple hidden onChange={onPhotos} />
        </div>
      </Section>

      {/* Informações para venda */}
      <Section title="Informações para venda">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Disponibilidade"><input className="ipt" value={sale.availability ?? ""} onChange={(e) => setSale((s) => ({ ...s, availability: e.target.value }))} placeholder="Ex: Pronta entrega" /></Field>
          <Field label="Garantia"><input className="ipt" value={sale.warranty ?? ""} onChange={(e) => setSale((s) => ({ ...s, warranty: e.target.value }))} placeholder="Ex: 7 dias" /></Field>
          <Field label="Política de devolução"><input className="ipt" value={sale.return_policy ?? ""} onChange={(e) => setSale((s) => ({ ...s, return_policy: e.target.value }))} /></Field>
        </div>
      </Section>

      {/* Registro de venda */}
      <Section title="Registro de venda" desc="Marque se este disco já foi vendido e registre para onde/para quem.">
        <Toggle label="Disco vendido" checked={sold} onChange={setSold} />
        {sold && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vendido por onde">
              <select className="ipt" value={soldChannel} onChange={(e) => setSoldChannel(e.target.value)}>
                <option value="">—</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="gateway">Gateway de pagamento</option>
                <option value="loja">Loja física / evento</option>
                <option value="outro">Outro</option>
              </select>
            </Field>
            <Field label="Vendido para (usuário do site)">
              <select className="ipt" value={soldToUserId ?? ""} onChange={(e) => setSoldToUserId(e.target.value || null)}>
                <option value="">— (comprador avulso)</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{`${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email}</option>
                ))}
              </select>
            </Field>
            <Field label="Ou nome do comprador (avulso)">
              <input className="ipt" value={soldToName} onChange={(e) => setSoldToName(e.target.value)} placeholder="Se não for usuário do site" />
            </Field>
            <Field label="Observação da venda">
              <input className="ipt" value={soldNote} onChange={(e) => setSoldNote(e.target.value)} placeholder="Valor final, condições…" />
            </Field>
          </div>
        )}
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
                    <input className="ipt" placeholder="Campo" value={b.key} onChange={(e) => setBlocks((bl) => bl.map((x) => x.id === b.id ? { ...x, key: e.target.value } : x))} />
                    <input className="ipt" placeholder="Valor" value={b.value} onChange={(e) => setBlocks((bl) => bl.map((x) => x.id === b.id ? { ...x, value: e.target.value } : x))} />
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

      {cropper && (
        <ImageCropper
          file={cropper.file}
          onCancel={() => setCropper(null)}
          onDone={(blob) => { cropper.onApply(blob); setCropper(null); }}
        />
      )}

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
