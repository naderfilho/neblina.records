import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Layers, Calendar, Building2, Hash, PenLine, Disc3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import BoxOpener from "@/components/BoxOpener";
import BoxBuyButtons from "@/components/BoxBuyButtons";
import { formatBRL } from "@/lib/utils";
import type { BoxItem, RecordItem, ExtraBlock } from "@/lib/types";

export const revalidate = 0;

const BOX_COLS =
  "id,title,subtitle,box_type,description,cover_image_url,spine_image_url,back_image_url,box_config,year,catalog_number,label_company,price,payment_methods,availability,audioteca_tier,is_published,is_featured,is_autographed,tag_ids,extra_blocks,views_count,created_at,updated_at";

export default async function BoxPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: box } = await supabase.from("boxes").select(BOX_COLS).eq("id", id).single();
  if (!box) notFound();
  const b = box as BoxItem;

  const { data: rows } = await supabase
    .from("box_records")
    .select("position, records(id,title,artist,cover_image_url,disc_config,genre,year,disc_quality,price)")
    .eq("box_id", id)
    .order("position");
  const records = ((rows ?? []) as unknown as { records: RecordItem | null }[])
    .map((r) => r.records)
    .filter((r): r is RecordItem => !!r);

  await supabase.rpc("increment_box_views", { p_box_id: id });

  const available = (b.availability ?? "available") === "available";
  const blocks = Array.isArray(b.extra_blocks) ? (b.extra_blocks as ExtraBlock[]) : [];

  const specs = [
    { icon: Layers, label: "Discos", value: `${records.length}` },
    { icon: Calendar, label: "Ano", value: b.year ? String(b.year) : null },
    { icon: Building2, label: "Gravadora", value: b.label_company },
    { icon: Hash, label: "Nº de catálogo", value: b.catalog_number },
  ].filter((s) => s.value);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-brand">
        <ArrowLeft size={16} /> Voltar ao acervo
      </Link>

      {/* cabeçalho */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {b.box_type && (
          <span className="flex items-center gap-1 rounded-full bg-brand/15 px-2.5 py-1 text-xs font-semibold text-brand">
            <Layers size={12} /> {b.box_type}
          </span>
        )}
        <span className="rounded-full bg-panel px-2.5 py-1 text-xs text-mist">
          {records.length} {records.length === 1 ? "disco" : "discos"}
        </span>
        {b.is_autographed && (
          <span className="flex items-center gap-1 rounded-full border border-brand/40 bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
            <PenLine size={12} /> Autografado
          </span>
        )}
      </div>
      <h1 translate="no" className="notranslate font-display text-4xl leading-tight text-ink md:text-5xl">{b.title}</h1>
      {b.subtitle && <p translate="no" className="notranslate mt-1 text-lg text-muted">{b.subtitle}</p>}

      {/* palco cinematográfico */}
      <section className="my-10">
        {records.length > 0 ? (
          <BoxOpener box={b} records={records} />
        ) : (
          <div className="rounded-2xl border border-dashed border-line py-20 text-center text-muted">
            <Disc3 size={36} className="mx-auto mb-3 text-faint" />
            Este box ainda não tem discos cadastrados.
          </div>
        )}
      </section>

      {/* info + compra */}
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-display text-4xl font-bold" style={{ color: "#ff9d2e", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
              {formatBRL(b.price)}
            </span>
          </div>
          <div className="mt-5">
            <BoxBuyButtons id={b.id} title={b.title} subtitle={b.subtitle} price={b.price} coverUrl={b.cover_image_url} available={available} />
          </div>

          {b.description && (
            <div className="mt-8">
              <h2 className="mb-2 font-display text-lg text-ink">Sobre o box</h2>
              <p className="whitespace-pre-line leading-relaxed text-muted">{b.description}</p>
            </div>
          )}

          {blocks.length > 0 && (
            <div className="mt-8 space-y-4">
              {blocks.map((bl) => (
                <div key={bl.id}>
                  {bl.type === "heading" && <h3 className="font-display text-lg text-ink">{bl.title}</h3>}
                  {bl.type === "spec" ? (
                    <div className="flex gap-2 text-sm"><span className="text-muted">{bl.key}:</span><span className="text-ink">{bl.value}</span></div>
                  ) : bl.type !== "heading" ? (
                    <p className={bl.type === "quote" ? "border-l-2 border-brand/50 pl-4 italic text-muted" : "leading-relaxed text-muted"}>{bl.content}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ficha + lista de discos */}
        <div className="space-y-6">
          {specs.length > 0 && (
            <div className="rounded-2xl border border-line bg-panel p-5">
              <h2 className="mb-3 font-display text-lg text-ink">Ficha do box</h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                {specs.map((s) => (
                  <div key={s.label} className="flex flex-col">
                    <dt className="flex items-center gap-1 text-xs uppercase tracking-wider text-muted"><s.icon size={12} /> {s.label}</dt>
                    <dd className="text-ink">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {records.length > 0 && (
            <div className="rounded-2xl border border-line bg-panel p-5">
              <h2 className="mb-3 font-display text-lg text-ink">Discos deste box</h2>
              <ul className="space-y-1.5">
                {records.map((r, i) => (
                  <li key={r.id}>
                    <Link href={`/disco/${r.id}`} className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-bg-soft">
                      <span className="w-5 text-center text-xs text-faint">{i + 1}</span>
                      {r.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.cover_image_url} alt="" className="h-9 w-9 shrink-0 rounded object-cover" />
                      ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-bg-soft text-faint"><Disc3 size={15} /></span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span translate="no" className="notranslate block truncate text-ink">{r.title}</span>
                        <span translate="no" className="notranslate block truncate text-xs text-muted">{r.artist}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
