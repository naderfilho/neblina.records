import { notFound } from "next/navigation";
import Link from "next/link";
import { Disc3, Music2, Check, PenLine } from "lucide-react";
import BackButton from "@/components/BackButton";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";
import { QUALITY_META, rpmLabel } from "@/lib/constants";
import { formatBRL } from "@/lib/utils";
import Vinyl from "@/components/Vinyl";
import TrackVinyl from "@/components/TrackVinyl";
import BuyButtons from "@/components/BuyButtons";
import DiscCoverReveal from "@/components/DiscCoverReveal";
import GatefoldViewer from "@/components/GatefoldViewer";
import FavoriteButton from "@/components/FavoriteButton";
import ShareButton from "@/components/ShareButton";
import GradingHelp from "@/components/GradingHelp";
import ShippingCalculator from "@/components/ShippingCalculator";
import PhotoGallery from "@/components/PhotoGallery";
import Comments from "@/components/Comments";
import type { RecordItem, RecordPhoto, Comment, ExtraBlock } from "@/lib/types";

export const revalidate = 0;

export default async function DiscoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // colunas seguras (sem dados internos: mercado/comprador). O papel `anon` nem
  // tem permissão de ler as internas — por isso NÃO usamos "*" aqui.
  const PUBLIC_COLS =
    "id,title,artist,genre,nationality,format,weight_grams,disc_quality,cover_quality,price,payment_methods,description,cover_image_url,cover_image_url_b,is_gatefold,gatefold_image_url,gatefold_dir,is_autographed,autograph_photo_url,audioteca_tier,disc_config,audio_url,audio_start,audio_end,tracks,home_track_id,condition,included_content,history,identification,sale_info,tag_ids,sort_order,extra_blocks,year,catalog_number,label_company,views_count,stock_qty,availability,is_published,is_featured,sold,created_at,updated_at";
  const { data: record } = await supabase.from("records").select(PUBLIC_COLS).eq("id", id).single();
  if (!record) notFound();
  const r = record as RecordItem;

  const [{ data: photos }, { data: comments }, { profile }] = await Promise.all([
    supabase.from("record_photos").select("*").eq("record_id", id).order("sort_order"),
    supabase.from("comments").select("*").eq("record_id", id).order("created_at", { ascending: false }),
    getSessionProfile(),
  ]);

  let isFav = false;
  if (profile) {
    const { data: favRow } = await supabase.from("favorites").select("record_id").eq("record_id", id).eq("user_id", profile.id).maybeSingle();
    isFav = !!favRow;
  }

  // conta visita
  await supabase.rpc("increment_record_views", { p_record_id: id });

  const dq = r.disc_quality ? QUALITY_META[r.disc_quality] : null;
  const cq = r.cover_quality ? QUALITY_META[r.cover_quality] : null;

  const specs: { label: string; value: string | null }[] = [
    { label: "Artista", value: r.artist },
    { label: "Nacionalidade", value: r.nationality },
    { label: "Estilo", value: r.genre },
    { label: "Formato", value: r.format },
    { label: "Rotação", value: rpmLabel(r.identification?.rpm) },
    { label: "Canais", value: r.identification?.sound_mode || null },
    { label: "Discos", value: r.identification?.disc_count || null },
    { label: "Ano", value: r.year ? String(r.year) : null },
    { label: "Gravadora", value: r.label_company },
    { label: "Nº de catálogo", value: r.catalog_number },
    { label: "Peso", value: r.weight_grams ? `${r.weight_grams} g` : null },
    { label: "Gravado em", value: r.identification?.recorded_at || null },
    { label: "Mixado em", value: r.identification?.mixed_at || null },
    { label: "Masterizado em", value: r.identification?.mastered_at || null },
    { label: "Prensado em", value: r.identification?.pressed_at || null },
    { label: "Matrix Lado A", value: r.identification?.matrix_a || null },
    { label: "Matrix Lado B", value: r.identification?.matrix_b || null },
    { label: "Label Code", value: r.identification?.label_code || null },
    { label: "Série", value: r.identification?.series || null },
  ];

  const condition = r.condition ?? {};
  const content = r.included_content ?? {};
  const history = r.history ?? {};
  const sale = r.sale_info ?? {};

  const conditionRows = [
    { label: "Riscos", value: condition.scratches },
    { label: "Chiados", value: condition.noise },
    { label: "Empenamento", value: condition.warp },
    { label: "Marcas", value: condition.marks },
  ].filter((x) => x.value);

  const contentItems = [
    { label: "Livreto", on: content.booklet },
    { label: "Encarte", on: content.insert },
    { label: "Pôster", on: content.poster },
    { label: "Sticker", on: content.sticker },
    { label: "Sleeve original", on: content.original_sleeve },
  ].filter((x) => x.on !== undefined);

  const historyRows = [
    { label: "Contexto", value: history.context },
    { label: "Curiosidades", value: history.curiosities },
    { label: "Importância histórica", value: history.historical_importance },
    { label: "Posição na carreira", value: history.career_position },
    { label: "Influência musical", value: history.musical_influence },
  ].filter((x) => x.value);

  const saleRows = [
    { label: "Disponibilidade", value: sale.availability },
    { label: "Garantia", value: sale.warranty },
    { label: "Devolução", value: sale.return_policy },
  ].filter((x) => x.value);

  return (
    <div className="mx-auto max-w-6xl overflow-x-clip px-6 py-10">
      <BackButton />

      <div className="grid gap-10 md:grid-cols-2">
        {/* Vinil. min-w-0 é ESSENCIAL: grid item tem min-width:auto e, sem isso, um
            título de faixa longo estica a coluna além da tela e o disco (w-full) cresce
            junto — era o "zoom" do Lado B no mobile. */}
        <div className="min-w-0 md:sticky md:top-24 md:self-start">
          <DiscCoverReveal coverUrl={r.cover_image_url} discOffset={r.tracks?.length ? 2 : 0}>
            {r.tracks && r.tracks.length > 0 ? (
              <TrackVinyl tracks={r.tracks} coverUrl={r.cover_image_url} coverUrlB={r.cover_image_url_b} config={r.disc_config} title={r.title} />
            ) : (
              <Vinyl
                coverUrl={r.cover_image_url}
                config={r.disc_config}
                audioUrl={r.audio_url}
                audioStart={r.audio_start}
                audioEnd={r.audio_end}
                title={r.title}
              />
            )}
          </DiscCoverReveal>
          {!r.tracks?.length && r.audio_url && (
            <p className="mt-4 flex items-center justify-center gap-4 text-xs text-faint">
              <span className="flex items-center gap-1"><Music2 size={13} /> Passe o mouse para ouvir</span>
            </p>
          )}

          {r.is_gatefold && r.gatefold_image_url && (
            <div className="mt-8 flex flex-col items-center">
              <p className="mb-3 text-xs uppercase tracking-[0.3em] text-teal">Capa dupla</p>
              <GatefoldViewer cover={r.cover_image_url || ""} inner={r.gatefold_image_url} dir={r.gatefold_dir === "down" ? "down" : "side"} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {r.format && (
              <span className="flex items-center gap-1 rounded-full bg-panel px-2.5 py-1 text-xs text-mist">
                <Disc3 size={12} /> {r.format}
              </span>
            )}
            {r.genre && <span className="rounded-full bg-panel px-2.5 py-1 text-xs text-muted">{r.genre}</span>}
            {r.is_autographed && (
              <span className="flex items-center gap-1 rounded-full border border-brand/40 bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
                <PenLine size={12} /> Autografado
              </span>
            )}
          </div>

          <h1 translate="no" className="notranslate font-display text-4xl leading-tight text-ink">{r.title}</h1>
          <p translate="no" className="notranslate mt-1 text-lg text-muted">{r.artist}</p>

          <div className="mt-5 flex items-center gap-3">
            <span
              className="font-display text-4xl font-bold"
              style={{ color: "#ff9d2e", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
            >
              {formatBRL(r.price)}
            </span>
            {r.availability === "sold" ? (
              <span className="rounded-full border border-red-500/25 px-3 py-1 text-xs font-medium text-red-300" style={{ background: "#2e0f0f" }}>Vendido</span>
            ) : r.availability === "reserved" ? (
              <span className="rounded-full border border-amber-500/25 px-3 py-1 text-xs font-medium text-[#e0a63a]" style={{ background: "#2e2408" }}>Reservado</span>
            ) : r.availability === "unavailable" ? (
              <span className="rounded-full border border-line px-3 py-1 text-xs font-medium text-faint" style={{ background: "#1a1a1a" }}>Indisponível</span>
            ) : (
              <span className="rounded-full border border-teal/25 px-3 py-1 text-xs font-medium text-[#3aa7b4]" style={{ background: "#0c2e2b" }}>Disponível</span>
            )}
          </div>

          {/* qualidade */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {dq && (
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel px-2.5 py-1">
                <span className="text-[9px] uppercase tracking-wider text-faint">Disco</span>
                <span className="text-xs font-semibold" style={{ color: dq.color }}>{dq.label}</span>
              </div>
            )}
            {cq && (
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel px-2.5 py-1">
                <span className="text-[9px] uppercase tracking-wider text-faint">Capa</span>
                <span className="text-xs font-semibold" style={{ color: cq.color }}>{cq.label}</span>
              </div>
            )}
            {(dq || cq) && <GradingHelp />}
          </div>

          <div className="mt-6 space-y-3">
            <BuyButtons id={r.id} title={r.title} artist={r.artist} price={r.price} coverUrl={r.cover_image_url} available={r.availability === "available"} />
            <div className="flex flex-wrap items-center gap-2">
              <FavoriteButton recordId={r.id} initialFav={isFav} userId={profile?.id ?? null} />
              <ShareButton id={r.id} title={r.title} artist={r.artist} />
            </div>
          </div>

          {r.payment_methods.length > 0 && (
            <div className="mt-4">
              <p className="mb-1.5 text-xs uppercase tracking-wider text-faint">Formas de pagamento</p>
              <div className="flex flex-wrap gap-2">
                {r.payment_methods.map((m) => (
                  <span key={m} className="rounded-lg border border-line bg-bg-soft px-2.5 py-1 text-xs text-muted">{m}</span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <ShippingCalculator weightGrams={r.weight_grams} />
          </div>

          {r.description && (
            <div className="mt-6">
              <h2 className="mb-2 font-display text-lg text-ink">Sobre o disco</h2>
              <p className="whitespace-pre-wrap leading-relaxed text-muted">{r.description}</p>
            </div>
          )}

          {/* autógrafo */}
          {r.is_autographed && r.autograph_photo_url && (
            <div className="mt-6">
              <h2 className="mb-2 flex items-center gap-2 font-display text-lg text-ink"><PenLine size={16} className="text-brand" /> Autógrafo</h2>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.autograph_photo_url} alt="Autógrafo do disco" className="max-h-72 w-full rounded-2xl border border-line object-cover" />
            </div>
          )}

          {/* ficha técnica */}
          <div className="mt-6 rounded-2xl border border-line bg-panel p-5">
            <h2 className="mb-3 font-display text-lg text-ink">Ficha técnica</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              {specs.filter((s) => s.value).map((s) => (
                <div key={s.label} className="flex flex-col">
                  <dt className="text-[11px] uppercase tracking-wider text-faint">{s.label}</dt>
                  <dd className={`text-sm text-ink ${["Artista", "Gravadora"].includes(s.label) ? "notranslate" : ""}`}>{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* condição detalhada */}
          {conditionRows.length > 0 && (
            <div className="mt-6 rounded-2xl border border-line bg-panel p-5">
              <h2 className="mb-3 font-display text-lg text-ink">Condição detalhada</h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                {conditionRows.map((s) => (
                  <div key={s.label} className="flex flex-col">
                    <dt className="text-[11px] uppercase tracking-wider text-faint">{s.label}</dt>
                    <dd className="text-sm text-ink">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* conteúdo incluso */}
          {contentItems.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs uppercase tracking-wider text-faint">Conteúdo incluso</p>
              <div className="flex flex-wrap gap-2">
                {contentItems.map((c) => (
                  <span
                    key={c.label}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs ${
                      c.on ? "border-brand/30 bg-brand/10 text-ink" : "border-line text-faint line-through"
                    }`}
                  >
                    {c.on && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand/20 text-brand">
                        <Check size={11} strokeWidth={3} />
                      </span>
                    )}
                    {c.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* informações para venda */}
          {saleRows.length > 0 && (
            <div className="mt-6 rounded-2xl border border-line bg-panel p-5">
              <h2 className="mb-3 font-display text-lg text-ink">Informações para venda</h2>
              <dl className="space-y-2">
                {saleRows.map((s) => (
                  <div key={s.label} className="flex justify-between gap-4 text-sm">
                    <dt className="text-faint">{s.label}</dt>
                    <dd className="text-right text-ink">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* blocos livres do admin */}
          {Array.isArray(r.extra_blocks) && r.extra_blocks.length > 0 && (
            <div className="mt-6 space-y-4">
              {(r.extra_blocks as ExtraBlock[]).map((b) => (
                <ExtraBlockView key={b.id} block={b} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* A seção "Mercado" (faixa de preço, médias, raridade) é INTERNA: fica só
          no painel do admin. O público precisa saber apenas o preço de venda. */}

      {/* histórico — apresentação editorial premium */}
      {historyRows.length > 0 && (
        <section className="mt-14">
          <div className="mb-7 flex items-center gap-3">
            <span className="h-px w-10 bg-gradient-to-r from-brand to-transparent" />
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand">A história</p>
          </div>
          <h2 className="mb-8 max-w-2xl font-display text-3xl leading-tight text-ink md:text-4xl">
            O que faz deste disco uma peça especial
          </h2>
          <div className="overflow-hidden rounded-3xl border border-line bg-gradient-to-b from-panel/70 via-panel/40 to-transparent">
            <div className="divide-y divide-line/70">
              {historyRows.map((h, i) => (
                <div key={h.label} className="grid gap-3 px-6 py-7 md:grid-cols-[240px_1fr] md:gap-10 md:px-9">
                  <div className="flex items-start gap-3">
                    <span className="font-display text-2xl leading-none text-brand/40">{String(i + 1).padStart(2, "0")}</span>
                    <p className="pt-1 text-xs font-semibold uppercase tracking-[0.18em] text-mist">{h.label}</p>
                  </div>
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-muted md:text-base">{h.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* fotos reais */}
      {photos && photos.length > 0 && (
        <div className="mt-16">
          <PhotoGallery photos={photos as RecordPhoto[]} />
        </div>
      )}

      {/* comentários */}
      <Comments
        recordId={r.id}
        initial={(comments as Comment[]) ?? []}
        userId={profile?.id ?? null}
        userName={profile ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() : null}
        isAdmin={profile?.role === "admin"}
      />
    </div>
  );
}

function ExtraBlockView({ block }: { block: ExtraBlock }) {
  if (block.type === "heading") return <h3 className="font-display text-xl text-ink">{block.title}</h3>;
  if (block.type === "quote")
    return (
      <blockquote className="border-l-2 border-brand pl-4 italic text-muted">{block.content}</blockquote>
    );
  if (block.type === "spec")
    return (
      <div className="flex justify-between rounded-lg border border-line bg-panel px-4 py-2 text-sm">
        <span className="text-faint">{block.key}</span>
        <span className="text-ink">{block.value}</span>
      </div>
    );
  return <p className="whitespace-pre-wrap leading-relaxed text-muted">{block.content}</p>;
}
