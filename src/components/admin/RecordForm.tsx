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
  PHOTO_CATEGORIES, NEBLINA_AI, SOUND_MODES, DISC_COUNTS, RPM_OPTIONS, POPULAR_NATIONALITIES,
  AVAILABILITY, type Availability, type DiscConfig,
} from "@/lib/constants";
import type {
  RecordItem, RecordPhoto, ExtraBlock, Tag,
  ConditionInfo, IncludedContent, HistoryInfo, MarketInfo, IdentificationInfo, SaleInfo,
} from "@/lib/types";
import VinylDesigner from "@/components/admin/VinylDesigner";
import Vinyl from "@/components/Vinyl";
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
  clone = false,
  boxId,
}: {
  record?: RecordItem;
  existingPhotos?: RecordPhoto[];
  suggestions: Suggestions;
  /** Clonar: usa o `record` só para PREENCHER o formulário, mas cria um disco
   *  novo (não edita o original). */
  clone?: boolean;
  /** Modo box: o disco é EXCLUSIVO deste box (box_only). Ao salvar, força
   *  box_only/is_published=false/availability=unavailable e vincula ao box.
   *  A navegação volta para a página do box. */
  boxId?: string;
}) {
  const router = useRouter();
  const isEdit = !!record && !clone;
  const inBox = !!boxId;

  const [title, setTitle] = useState(record?.title ?? "");
  const [artist, setArtist] = useState(record?.artist ?? "");
  const [genre, setGenre] = useState(record?.genre ?? "");
  const [nationality, setNationality] = useState(record?.nationality ?? "");
  const [format, setFormat] = useState(record?.format ?? "LP");
  const [weight, setWeight] = useState(record?.weight_grams?.toString() ?? "");
  const [discQuality, setDiscQuality] = useState(record?.disc_quality ?? "");
  const [coverQuality, setCoverQuality] = useState(record?.cover_quality ?? "");
  const [price, setPrice] = useState(record?.price?.toString() ?? "");
  const [cost, setCost] = useState(record?.cost?.toString() ?? "");
  const [year, setYear] = useState(record?.year?.toString() ?? "");
  const [labelCompany, setLabelCompany] = useState(record?.label_company ?? "");
  const [catalog, setCatalog] = useState(record?.catalog_number ?? "");
  const [description, setDescription] = useState(record?.description ?? "");
  const [published, setPublished] = useState(record?.is_published ?? true);
  const [featured, setFeatured] = useState(record?.is_featured ?? false);
  const [payments, setPayments] = useState<string[]>(record?.payment_methods ?? ["Pix (Brasil)"]);
  const [discConfig, setDiscConfig] = useState<DiscConfig>(record?.disc_config ?? DEFAULT_DISC_CONFIG);
  // estampa/arte custom do corpo do disco
  const [discArtFile, setDiscArtFile] = useState<File | null>(null);
  const [discArtPreview, setDiscArtPreview] = useState<string | null>(record?.disc_config?.bodyImageUrl ?? null);

  const [condition, setCondition] = useState<ConditionInfo>(record?.condition ?? {});
  const [content, setContent] = useState<IncludedContent>(record?.included_content ?? {});
  const [history, setHistory] = useState<HistoryInfo>(record?.history ?? {});
  const [market, setMarket] = useState<MarketInfo>(record?.market ?? {});
  const [ident, setIdent] = useState<IdentificationInfo>(record?.identification ?? {});
  const [sale, setSale] = useState<SaleInfo>(record?.sale_info ?? {});
  const [tagIds, setTagIds] = useState<string[]>(record?.tag_ids ?? []);
  const [allTags, setAllTags] = useState<Tag[]>([]);

  // registro de venda
  const [availability, setAvailability] = useState<Availability>(record?.availability ?? (record?.sold ? "sold" : "available"));
  const sold = availability === "sold";
  const [soldChannel, setSoldChannel] = useState(record?.sold_channel ?? "");
  const [soldToUserId, setSoldToUserId] = useState<string | null>(record?.sold_to_user_id ?? null);
  const [soldToName, setSoldToName] = useState(record?.sold_to_name ?? "");
  const [soldNote, setSoldNote] = useState(record?.sold_note ?? "");
  const [users, setUsers] = useState<{ id: string; first_name: string | null; last_name: string | null; email: string | null }[]>([]);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(record?.cover_image_url ?? null);
  const [coverBFile, setCoverBFile] = useState<File | null>(null);
  const [coverBPreview, setCoverBPreview] = useState<string | null>(record?.cover_image_url_b ?? null);
  const [isAutographed, setIsAutographed] = useState(record?.is_autographed ?? false);
  const [autographFile, setAutographFile] = useState<File | null>(null);
  const [autographPreview, setAutographPreview] = useState<string | null>(record?.autograph_photo_url ?? null);

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

  type TrackItem = { id: string; side: "A" | "B"; title: string; audioUrl: string | null; file?: File; disc: number };
  const [tracks, setTracks] = useState<TrackItem[]>(
    (record?.tracks ?? []).map((t) => ({ id: t.id, side: t.side, title: t.title, audioUrl: t.audio_url, disc: t.disc ?? 1 })),
  );
  const [homeTrackId, setHomeTrackId] = useState<string | null>(record?.home_track_id ?? null);
  // número de discos do álbum (duplo/triplo/quádruplo)
  const [discCount, setDiscCount] = useState<number>(() =>
    Math.min(4, Math.max(1, ...(record?.tracks ?? []).map((t) => t.disc ?? 1))),
  );
  function changeDiscCount(n: number) {
    // ao reduzir, traz as faixas dos discos removidos para o último disco (não some com elas)
    setTracks((ts) => ts.map((t) => ((t.disc ?? 1) > n ? { ...t, disc: n } : t)));
    setDiscCount(n);
  }

  const [blocks, setBlocks] = useState<ExtraBlock[]>(
    Array.isArray(record?.extra_blocks) ? (record!.extra_blocks as ExtraBlock[]) : [],
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [aiBusy, setAiBusy] = useState<"idle" | "research">("idle");
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiCost, setAiCost] = useState(0);
  const [aiProgress, setAiProgress] = useState(0);
  const [lastCost, setLastCost] = useState<number | null>(null);

  const [cropper, setCropper] = useState<{ file: File; onApply: (b: Blob) => void; round?: boolean } | null>(null);

  const coverInput = useRef<HTMLInputElement>(null);
  const labelAInput = useRef<HTMLInputElement>(null);
  const coverBInput = useRef<HTMLInputElement>(null);
  const autographInput = useRef<HTMLInputElement>(null);
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

  // sugestões de nacionalidade: as já cadastradas no acervo + a lista popular
  const nationalityOptions = useMemo(
    () => Array.from(new Set([...suggestions.nationalities, ...POPULAR_NATIONALITIES])),
    [suggestions.nationalities],
  );

  const homeTrackObj = tracks.find((t) => t.id === homeTrackId);
  const homeTrackSrc = useMemo(
    () => (homeTrackObj?.file ? URL.createObjectURL(homeTrackObj.file) : homeTrackObj?.audioUrl ?? null),
    [homeTrackObj?.file, homeTrackObj?.audioUrl],
  );

  function addTrack(side: "A" | "B", disc = 1) {
    setTracks((t) => [...t, { id: crypto.randomUUID(), side, title: "", audioUrl: null, disc }]);
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

  // Lado A do centro (label) — recorte redondo, escreve na capa principal
  function onLabelA(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setCropper({
      file: f,
      round: true,
      onApply: (blob) => {
        setCoverFile(new File([blob], "cover.jpg", { type: "image/jpeg" }));
        setCoverPreview(URL.createObjectURL(blob));
      },
    });
    e.target.value = "";
  }

  function onCoverB(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setCropper({
      file: f,
      round: true,
      onApply: (blob) => {
        setCoverBFile(new File([blob], "cover-b.jpg", { type: "image/jpeg" }));
        setCoverBPreview(URL.createObjectURL(blob));
      },
    });
    e.target.value = "";
  }

  function onAutograph(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setAutographFile(f);
    setAutographPreview(URL.createObjectURL(f));
    setIsAutographed(true);
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

  function onDiscArt(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setDiscArtFile(f);
    setDiscArtPreview(url);
    setDiscConfig((c) => ({ ...c, bodyImageUrl: url })); // prévia ao vivo no VinylDesigner
    e.target.value = "";
  }
  function removeDiscArt() {
    setDiscArtFile(null);
    setDiscArtPreview(null);
    setDiscConfig((c) => ({ ...c, bodyImageUrl: null }));
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
    title?: string; genre?: string; nationality?: string; label_company?: string; format?: string;
    description?: string; year?: number | null;
    history?: HistoryInfo; market?: MarketInfo; identification?: IdentificationInfo;
    tracks?: { side?: string; title?: string }[];
  }) {
    // NÃO sobrescreve o que o admin preencheu manualmente (título, ano, formato,
    // nacionalidade) — só completa se estiver vazio.
    if (!title.trim()) fill(setTitle, d.title);
    if (!year.trim()) fill(setYear, d.year != null ? String(d.year) : undefined);
    if (!format) fill(setFormat, d.format);
    if (!nationality.trim()) fill(setNationality, d.nationality);
    // campos que a IA é responsável por trazer
    fill(setGenre, d.genre); fill(setLabelCompany, d.label_company); fill(setDescription, d.description);
    if (d.history) setHistory((h) => ({ ...h, ...d.history }));
    if (d.market) setMarket((m) => ({ ...m, ...d.market }));
    if (d.identification) setIdent((i) => ({ ...i, ...d.identification }));
    if (Array.isArray(d.tracks) && d.tracks.length) {
      setTracks(d.tracks.map((t) => ({
        id: crypto.randomUUID(), side: t.side === "B" ? "B" : "A", title: t.title || "Faixa", audioUrl: null, disc: 1,
      })));
    }
  }

  // Neblina IA — usa a CAPA + nº de catálogo (Selo) + artista para achar a versão
  // EXATA no Discogs. Exige os três (0 margem de erro).
  async function runNeblinaIA() {
    setAiError(null);
    const a = artist.trim();
    const cat = catalog.trim();
    if (!a || !cat) { setAiError("Preencha o nome do artista e o número de catálogo (Selo) antes de usar a IA."); return; }
    const b = await coverBase64();
    if (!b) { setAiError("Envie a foto da capa primeiro."); return; }

    setAiBusy("research");
    setLastCost(null);
    setAiProgress(4);
    // barra simulada: é uma única chamada (sem progresso real), então subimos de
    // forma assintótica até ~95% e completamos 100% quando a resposta chega.
    const started = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = (Date.now() - started) / 1000;
      const p = 95 * (1 - Math.exp(-elapsed / 40));
      setAiProgress((cur) => Math.max(cur, Math.min(95, p)));
    }, 400);
    try {
      const res = await fetch("/api/ai/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(), artist: a, catalog: cat, year,
          nationality: nationality.trim(), format,
          imageBase64: b.data, mediaType: b.mediaType,
        }),
      });
      const j = await readJsonResponse(res);
      applyResearch(j.data ?? {});
      if (typeof j.costUsd === "number") { setAiCost((c) => c + j.costUsd); setLastCost(j.costUsd); }
      setAiProgress(100);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Erro na pesquisa da IA");
    } finally {
      clearInterval(timer);
      setAiBusy("idle");
      window.setTimeout(() => setAiProgress(0), 1400);
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

      let coverBUrlFinal = coverBPreview;
      if (coverBFile) coverBUrlFinal = await step("enviar a capa do Lado B", () => uploadFile("covers", coverBFile, "cover-b-"));

      let autographUrlFinal = autographPreview;
      if (autographFile) autographUrlFinal = await step("enviar a foto do autógrafo", () => uploadFile("record-photos", autographFile, "autograph-"));

      let gatefoldUrlFinal = gatefoldPreview;
      if (gatefoldFile) gatefoldUrlFinal = await step("enviar a arte do gatefold", () => uploadFile("covers", gatefoldFile, "gatefold-"));

      // estampa do disco: sobe o arquivo novo, mantém o existente, ou limpa se removida
      let discArtUrlFinal: string | null = discArtPreview && !discArtPreview.startsWith("blob:") ? discArtPreview : null;
      if (discArtFile) discArtUrlFinal = await step("enviar a estampa do disco", () => uploadFile("covers", discArtFile, "discart-"));

      let audioUrlFinal = audioUrl;
      if (audioFile) audioUrlFinal = await step("enviar o áudio", () => uploadFile("audio", audioFile, "audio-"));

      const finalPhotos: { url: string; category: string }[] = [];
      for (const p of photos) {
        const url = p.file ? await step("enviar uma foto do disco", () => uploadFile("record-photos", p.file!, "photo-")) : p.url;
        finalPhotos.push({ url, category: p.category || "outro" });
      }

      const finalTracks: { id: string; side: "A" | "B"; title: string; audio_url: string | null; disc: number }[] = [];
      for (const t of tracks) {
        let url = t.audioUrl;
        if (t.file) url = await step(`enviar o áudio da faixa "${t.title || "sem nome"}"`, () => uploadFile("audio", t.file!, "track-"));
        finalTracks.push({ id: t.id, side: t.side, title: t.title.trim() || "Faixa", audio_url: url, disc: t.disc ?? 1 });
      }
      const homeTrack = finalTracks.find((t) => t.id === homeTrackId);

      const payload = {
        title: title.trim(), artist: artist.trim(),
        genre: genre.trim() || null, nationality: nationality.trim() || null,
        format: format || null, weight_grams: weight ? parseFloat(weight) : null,
        disc_quality: discQuality || null, cover_quality: coverQuality || null,
        price: price ? parseFloat(price) : 0, cost: cost ? parseFloat(cost) : null,
        year: year ? parseInt(year) : null,
        label_company: labelCompany.trim() || null, catalog_number: catalog.trim() || null,
        stock_qty: sold ? 0 : 1, description: description.trim() || null,
        is_published: published, is_featured: featured,
        availability,
        sold,
        sold_channel: sold ? (soldChannel || null) : null,
        sold_to_user_id: sold ? soldToUserId : null,
        sold_to_name: sold ? (soldToName.trim() || null) : null,
        sold_at: sold ? (record?.sold_at ?? new Date().toISOString()) : null,
        sold_note: sold ? (soldNote.trim() || null) : null,
        payment_methods: payments, disc_config: { ...discConfig, bodyImageUrl: discArtUrlFinal },
        cover_image_url: coverUrlFinal,
        cover_image_url_b: coverBUrlFinal,
        is_autographed: isAutographed,
        autograph_photo_url: isAutographed ? autographUrlFinal : null,
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

      // Modo box: disco exclusivo do box (fora do catálogo/home, não vendido solto).
      // Forçamos aqui, independente do que o form mostra.
      if (inBox) {
        Object.assign(payload, {
          box_only: true,
          is_published: false,
          availability: "unavailable" as const,
          sold: false,
          stock_qty: 0,
        });
      }

      // No clone, `record` é só a fonte dos dados — nunca o alvo. Sem isso, o
      // id do original vazaria para o bloco de fotos abaixo (que apaga as fotos
      // do record_id) antes do insert devolver o id novo.
      let recordId = isEdit ? record?.id : undefined;
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

      // Modo box: ao CRIAR um disco novo, vincula ao box no fim da ordem. Ao editar,
      // o vínculo já existe (a página do box gerencia ordem/remoção).
      if (inBox && !isEdit && recordId) {
        const { data: last } = await supabase
          .from("box_records").select("position").eq("box_id", boxId)
          .order("position", { ascending: false }).limit(1).maybeSingle();
        const nextPos = last ? (Number(last.position) || 0) + 1 : 0;
        await supabase.from("box_records").insert({ box_id: boxId, record_id: recordId, position: nextPos });
      }

      router.push(inBox ? `/admin/boxes/${boxId}` : "/admin/discos");
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

        {/* Neblina IA — capa + artista + nº de catálogo (versão exata, 0 erro) */}
        {coverPreview && (
          <div className="mb-3 rounded-xl border border-brand/30 bg-brand/5 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-brand">
              <Sparkles size={13} /> Neblina IA - Agente Discogs
            </p>
            <p className="mb-2.5 text-[11px] text-muted">
              Preencha o máximo possível abaixo — <strong className="text-mist">quanto mais completo, mais rápida e barata a pesquisa</strong> (a IA busca menos no Discogs e evita timeout). O nº de catálogo aparece como “Selo” no Discogs (ex.: <span className="text-mist">EMI - 31C 164 422831/2</span>).
            </p>
            <div className="mb-2.5 grid gap-2 sm:grid-cols-2">
              <input className="ipt" placeholder="Nome do disco" value={title} onChange={(e) => setTitle(e.target.value)} />
              <input className="ipt" placeholder="Artista *" value={artist} onChange={(e) => setArtist(e.target.value)} />
              <input className="ipt" placeholder="Nº de catálogo / Selo *" value={catalog} onChange={(e) => setCatalog(e.target.value)} />
              <input className="ipt" type="number" placeholder="Ano" value={year} onChange={(e) => setYear(e.target.value)} />
              <input className="ipt" placeholder="Nacionalidade do artista (ex.: Brasil)" value={nationality} onChange={(e) => setNationality(e.target.value)} />
              <select className="ipt" value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="">Tipo de disco</option>
                {RECORD_FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={runNeblinaIA}
                disabled={aiBusy !== "idle" || !artist.trim() || !catalog.trim()}
                title={`Neblina IA · lê a capa e pesquisa a versão exata no Discogs · ${NEBLINA_AI.fullCost}/disco`}
                className="flex items-center gap-1.5 rounded-lg border border-brand/40 bg-brand/10 px-3 py-2 text-xs font-semibold text-brand hover:bg-brand/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {aiBusy !== "idle" ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {aiBusy === "research" ? "Pesquisando no Discogs…" : "Pesquisar"}
              </button>
              <span className="text-[11px] text-faint">Custo por pesquisa: <span className="font-semibold text-mist">{NEBLINA_AI.fullCost}</span></span>
            </div>

            {/* barra de progresso */}
            {(aiBusy !== "idle" || aiProgress > 0) && (
              <div className="mt-2.5">
                <div className="h-2 w-full overflow-hidden rounded-full bg-panel-2">
                  <div className="h-full rounded-full bg-brand transition-[width] duration-300 ease-out" style={{ width: `${Math.round(aiProgress)}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-faint">{aiBusy === "research" ? `Pesquisando… ${Math.round(aiProgress)}%` : "Concluído"}</p>
              </div>
            )}

            {lastCost != null && (
              <p className="mt-2 text-[11px] text-teal">Custo desta pesquisa: <span className="font-semibold">US$ {lastCost.toFixed(4)}</span></p>
            )}
            {(!artist.trim() || !catalog.trim()) && (
              <p className="mt-2 text-[11px] text-faint">Preencha o artista e o nº de catálogo para liberar a IA.</p>
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

        {/* estampa/arte custom do corpo do disco (quando as cores/estilos não bastam) */}
        <div className="mt-4 rounded-xl border border-line bg-bg-soft p-4">
          <p className="mb-1 text-sm font-medium text-ink">Estampa do disco (arte do vinil)</p>
          <p className="mb-3 text-[11px] text-faint">
            Opcional. Envie uma imagem pra virar o <strong className="text-mist">corpo inteiro do disco</strong> — útil quando as
            cores e estilos acima não chegam perto da arte real do vinil. Ideal: imagem quadrada.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-panel px-4 py-2.5 text-sm hover:border-brand/50">
              <ImageIcon size={16} /> {discArtPreview ? "Trocar estampa" : "Enviar estampa"}
              <input type="file" accept="image/*" hidden onChange={onDiscArt} />
            </label>
            {discArtPreview && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={discArtPreview} alt="Estampa do disco" className="h-16 w-16 rounded-full border border-line object-cover" />
                <button type="button" onClick={removeDiscArt} className="text-sm text-faint hover:text-red-400">Remover (volta pra cor/estilo)</button>
              </>
            )}
          </div>
        </div>

        {/* Capa do centro (label) por lado — o disco fica realista ao virar */}
        <div className="mt-5 rounded-xl border border-line bg-bg-soft p-4">
          <p className="mb-1 text-sm font-medium text-ink">Foto do centro (label) por lado</p>
          <p className="mb-3 text-[11px] text-faint">Use com o estilo de centro “Foto da capa” ou “Foto da capa + Anel”. Ao virar o disco, cada lado mostra a sua foto.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-muted">Capa Lado A</p>
              <div className="flex items-center gap-3">
                <div className="h-24 w-24 shrink-0">
                  <Vinyl config={discConfig} coverUrl={coverPreview} interactive={false} noNeedle title="Prévia Lado A" />
                </div>
                <input ref={labelAInput} type="file" accept="image/*" hidden onChange={onLabelA} />
                <button type="button" onClick={() => labelAInput.current?.click()} className="rounded-lg border border-line bg-panel px-3 py-2 text-xs hover:border-brand/50">
                  {coverPreview ? "Trocar / ajustar" : "Enviar e ajustar"}
                </button>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-muted">Capa Lado B (verso)</p>
              <div className="flex items-center gap-3">
                <div className="h-24 w-24 shrink-0">
                  <Vinyl config={discConfig} coverUrl={coverBPreview ?? coverPreview} interactive={false} noNeedle title="Prévia Lado B" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <button type="button" onClick={() => coverBInput.current?.click()} className="rounded-lg border border-line bg-panel px-3 py-2 text-xs hover:border-brand/50">
                    {coverBPreview ? "Trocar / ajustar" : "Enviar e ajustar"}
                  </button>
                  {coverBPreview && <button type="button" onClick={() => { setCoverBFile(null); setCoverBPreview(null); }} className="text-[11px] text-faint hover:text-red-400">Remover (usa a do Lado A)</button>}
                </div>
              </div>
            </div>
          </div>
          <input ref={coverBInput} type="file" accept="image/*" hidden onChange={onCoverB} />
        </div>
      </Section>

      {/* 1c. Autógrafo */}
      <Section title="Autógrafo" desc="Marque se o disco é autografado e envie a foto do autógrafo.">
        <Toggle label="Disco autografado" checked={isAutographed} onChange={setIsAutographed} />
        {isAutographed && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => autographInput.current?.click()} className="flex items-center gap-2 rounded-xl border border-line bg-panel px-4 py-2.5 text-sm hover:border-brand/50">
              <ImageIcon size={16} /> {autographPreview ? "Trocar foto do autógrafo" : "Enviar foto do autógrafo"}
            </button>
            {autographPreview && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={autographPreview} alt="Autógrafo" className="h-20 w-20 rounded-lg border border-line object-cover" />
                <button type="button" onClick={() => { setAutographFile(null); setAutographPreview(null); }} className="text-sm text-faint hover:text-red-400">Remover</button>
              </>
            )}
            <input ref={autographInput} type="file" accept="image/*" hidden onChange={onAutograph} />
          </div>
        )}
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
          <Field label="Nacionalidade do Artista/Banda">
            <input className="ipt" list="s-nats" value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="Ex: Brasil, Reino Unido…" />
            <datalist id="s-nats">{nationalityOptions.map((n) => <option key={n} value={n} />)}</datalist>
          </Field>
          <Field label="Tipo de disco">
            <select className="ipt" value={format} onChange={(e) => setFormat(e.target.value)}>
              {RECORD_FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </Field>
          <Field label="Rotação (RPM)">
            <select className="ipt" value={ident.rpm ?? ""} onChange={(e) => setIdent((i) => ({ ...i, rpm: e.target.value }))}>
              <option value="">—</option>
              {RPM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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
          <Field label="Custo / valor pago (R$) — privado" hint="Só o admin vê. Usado para calcular o lucro. Não aparece na loja.">
            <input className="ipt" type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Quanto você pagou" />
          </Field>
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

        {inBox ? (
          <p className="rounded-xl border border-line bg-bg-soft px-4 py-3 text-xs text-faint">
            Este disco é <strong className="text-mist">exclusivo do box</strong> — não vai para o catálogo, nem para a home, e não é vendido separado. O box é vendido completo.
          </p>
        ) : (
          <div className="flex flex-wrap gap-6">
            <Toggle label="Publicado na loja" checked={published} onChange={setPublished} />
            <Toggle label="Destaque" checked={featured} onChange={setFeatured} />
          </div>
        )}
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
      <Section title="Faixas — por disco e lado" desc="Viram os sulcos do disco na página: hover mostra o nome, clique toca. Marque qual toca na home. Para álbuns duplos/triplos, escolha quantos discos e cadastre as faixas de cada um.">
        {/* quantos discos (1 = simples, 2 = duplo, 3 = triplo, 4 = quádruplo) */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-muted">Discos no álbum:</span>
          {[1, 2, 3, 4].map((n) => (
            <button key={n} type="button" onClick={() => changeDiscCount(n)}
              className={cn("h-8 w-8 rounded-lg border text-sm font-medium transition",
                discCount === n ? "border-brand bg-brand text-black" : "border-line text-muted hover:border-brand/50 hover:text-brand")}>
              {n}
            </button>
          ))}
          <span className="text-xs text-faint">{discCount === 1 ? "simples" : discCount === 2 ? "duplo" : discCount === 3 ? "triplo" : "quádruplo"}</span>
        </div>

        <div className="space-y-6">
          {Array.from({ length: discCount }, (_, i) => i + 1).map((discNo) => (
            <div key={discNo} className={cn(discCount > 1 && "rounded-2xl border border-line bg-bg-soft/40 p-4")}>
              {discCount > 1 && <h3 className="mb-3 font-display text-lg text-brand">Disco {discNo}</h3>}
              <div className="grid gap-6 md:grid-cols-2">
                {(["A", "B"] as const).map((side) => {
                  const sideTracks = tracks.filter((t) => (t.disc ?? 1) === discNo && t.side === side);
                  return (
                    <div key={side}>
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="font-display text-base text-ink">Lado {side}</h4>
                        <button type="button" onClick={() => addTrack(side, discNo)} className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:border-brand/50 hover:text-brand">
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
            </div>
          ))}
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

      {/* Disponibilidade / venda — não se aplica a disco de box (o box é a unidade de venda) */}
      {!inBox && (
      <Section title="Disponibilidade" desc="Cada disco é uma peça única. Defina o status; ao marcar como Vendido, registre para onde/para quem.">
        <div className="mb-4 flex flex-wrap gap-2">
          {AVAILABILITY.map((a) => (
            <button key={a.id} type="button" onClick={() => setAvailability(a.id)}
              className={cn("flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                availability === a.id ? "border-brand bg-brand/15 text-brand" : "border-line text-muted hover:text-ink")}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }} /> {a.label}
            </button>
          ))}
        </div>
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
      )}

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
            {inBox ? (isEdit ? "Salvar disco do box" : "Adicionar disco ao box") : (isEdit ? "Salvar alterações" : "Publicar disco")}
          </button>
        </div>
      </div>

      {cropper && (
        <ImageCropper
          file={cropper.file}
          round={cropper.round}
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

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-faint">{hint}</span>}
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
