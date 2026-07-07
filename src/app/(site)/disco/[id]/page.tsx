import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Disc3, Eye, Music2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";
import { QUALITY_META } from "@/lib/constants";
import { formatBRL } from "@/lib/utils";
import Vinyl from "@/components/Vinyl";
import TrackVinyl from "@/components/TrackVinyl";
import BuyButtons from "@/components/BuyButtons";
import ShippingCalculator from "@/components/ShippingCalculator";
import PhotoGallery from "@/components/PhotoGallery";
import Comments from "@/components/Comments";
import type { RecordItem, RecordPhoto, Comment, ExtraBlock } from "@/lib/types";

export const revalidate = 0;

export default async function DiscoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: record } = await supabase.from("records").select("*").eq("id", id).single();
  if (!record) notFound();
  const r = record as RecordItem;

  const [{ data: photos }, { data: comments }, { profile }] = await Promise.all([
    supabase.from("record_photos").select("*").eq("record_id", id).order("sort_order"),
    supabase.from("comments").select("*").eq("record_id", id).order("created_at", { ascending: false }),
    getSessionProfile(),
  ]);

  // conta visita
  await supabase.rpc("increment_record_views", { p_record_id: id });

  const dq = r.disc_quality ? QUALITY_META[r.disc_quality] : null;
  const cq = r.cover_quality ? QUALITY_META[r.cover_quality] : null;

  const specs: { label: string; value: string | null }[] = [
    { label: "Artista", value: r.artist },
    { label: "Estilo", value: r.genre },
    { label: "Nacionalidade", value: r.nationality },
    { label: "Formato", value: r.format },
    { label: "Ano", value: r.year ? String(r.year) : null },
    { label: "Gravadora", value: r.label_company },
    { label: "Nº de catálogo", value: r.catalog_number },
    { label: "Peso", value: r.weight_grams ? `${r.weight_grams} g` : null },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-brand">
        <ArrowLeft size={16} /> Voltar ao acervo
      </Link>

      <div className="grid gap-10 md:grid-cols-2">
        {/* Vinil */}
        <div className="md:sticky md:top-24 md:self-start">
          {r.tracks && r.tracks.length > 0 ? (
            <TrackVinyl tracks={r.tracks} coverUrl={r.cover_image_url} config={r.disc_config} title={r.title} />
          ) : (
            <>
              <div className="mx-auto max-w-md">
                <Vinyl
                  coverUrl={r.cover_image_url}
                  config={r.disc_config}
                  audioUrl={r.audio_url}
                  audioStart={r.audio_start}
                  audioEnd={r.audio_end}
                  title={r.title}
                />
              </div>
              <p className="mt-4 flex items-center justify-center gap-4 text-xs text-faint">
                <span className="flex items-center gap-1"><Eye size={13} /> {r.views_count} visitas</span>
                {r.audio_url && <span className="flex items-center gap-1"><Music2 size={13} /> Passe o mouse para ouvir</span>}
              </p>
            </>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {r.format && (
              <span className="flex items-center gap-1 rounded-full bg-panel px-2.5 py-1 text-xs text-mist">
                <Disc3 size={12} /> {r.format}
              </span>
            )}
            {r.genre && <span className="rounded-full bg-panel px-2.5 py-1 text-xs text-muted">{r.genre}</span>}
          </div>

          <h1 className="font-display text-4xl leading-tight text-ink">{r.title}</h1>
          <p className="mt-1 text-lg text-muted">{r.artist}</p>

          <div className="mt-5 flex items-center gap-3">
            <span className="font-display text-4xl text-brand">{formatBRL(r.price)}</span>
            {r.stock_qty > 0 ? (
              <span className="rounded-full bg-teal/15 px-3 py-1 text-xs text-teal">Disponível</span>
            ) : (
              <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs text-red-400">Esgotado</span>
            )}
          </div>

          {/* qualidade */}
          <div className="mt-5 flex flex-wrap gap-3">
            {dq && (
              <div className="rounded-xl border border-line bg-panel px-4 py-2">
                <p className="text-[10px] uppercase tracking-wider text-faint">Qualidade do disco</p>
                <p className="font-semibold" style={{ color: dq.color }}>{dq.label}</p>
              </div>
            )}
            {cq && (
              <div className="rounded-xl border border-line bg-panel px-4 py-2">
                <p className="text-[10px] uppercase tracking-wider text-faint">Qualidade da capa</p>
                <p className="font-semibold" style={{ color: cq.color }}>{cq.label}</p>
              </div>
            )}
          </div>

          <div className="mt-6">
            <BuyButtons id={r.id} title={r.title} artist={r.artist} price={r.price} coverUrl={r.cover_image_url} />
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

          {/* ficha técnica */}
          <div className="mt-6 rounded-2xl border border-line bg-panel p-5">
            <h2 className="mb-3 font-display text-lg text-ink">Ficha técnica</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              {specs.filter((s) => s.value).map((s) => (
                <div key={s.label} className="flex flex-col">
                  <dt className="text-[11px] uppercase tracking-wider text-faint">{s.label}</dt>
                  <dd className="text-sm text-ink">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>

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
