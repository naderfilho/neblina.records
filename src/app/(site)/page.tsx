import { ArrowRight, Disc3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import IntroCurtain from "@/components/IntroCurtain";
import AcervoTabs from "@/components/AcervoTabs";
import HeroVinyl from "@/components/HeroVinyl";
import HomeMiniPlayer, { type HomeSong } from "@/components/HomeMiniPlayer";
import type { RecordItem, Tag, Track, BoxSummary, DiscMini } from "@/lib/types";

export const revalidate = 0;

// Colunas que a vitrine (grade + filtros) usa — evita baixar os campos pesados
// (tracks, history, extra_blocks…) de milhares de discos à toa.
const GRID_COLS =
  "id,title,artist,genre,nationality,format,disc_quality,tag_ids,tag_expiries,label_company,price,availability,cover_image_url,disc_config,audio_url,audio_start,audio_end";

/**
 * Busca TODOS os discos publicados. O Supabase/PostgREST limita cada resposta a
 * 1000 linhas, então paginamos por `range` até esgotar. `id` entra na ordenação
 * como desempate para o fatiamento entre páginas ser determinístico.
 */
async function fetchAllPublished(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<RecordItem[]> {
  const SIZE = 1000;
  const all: RecordItem[] = [];
  for (let from = 0; ; from += SIZE) {
    const { data, error } = await supabase
      .from("records")
      .select(GRID_COLS)
      .eq("is_published", true)
      .neq("availability", "unavailable") // discos indisponíveis não aparecem na home
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, from + SIZE - 1);
    if (error || !data?.length) break;
    all.push(...(data as unknown as RecordItem[]));
    if (data.length < SIZE) break;
  }
  return all;
}

export default async function HomePage() {
  const supabase = await createClient();
  const [records, { data: tagData }, { data: settings }, { data: boxData }] = await Promise.all([
    fetchAllPublished(supabase),
    supabase.from("tags").select("*"),
    supabase.from("site_settings").select("*").eq("id", "main").maybeSingle(),
    supabase
      .from("boxes")
      .select("*, box_records(position, records(id,cover_image_url,disc_config))")
      .eq("is_published", true)
      .neq("availability", "unavailable")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
  ]);

  const tags = (tagData ?? []) as Tag[];

  // boxes da vitrine: contagem + discos (capa/config) na ordem, p/ o leque do hover
  const boxes: BoxSummary[] = ((boxData ?? []) as unknown as (BoxSummary & {
    box_records?: { position: number; records: DiscMini | null }[];
  })[]).map((b) => {
    const discs = [...(b.box_records ?? [])]
      .sort((x, y) => x.position - y.position)
      .map((br) => br.records)
      .filter((r): r is DiscMini => !!r);
    return { ...b, disc_count: discs.length, discs };
  });

  // música da home (mini-player sobre o disco Neblina)
  let homeSong: HomeSong | null = null;
  if (settings?.home_record_id) {
    const { data: hr } = await supabase
      .from("records")
      .select("id,title,artist,tracks,audio_url,audio_start,home_track_id")
      .eq("id", settings.home_record_id)
      .maybeSingle();
    if (hr) {
      const track = ((hr.tracks ?? []) as Track[]).find((t) => t.id === settings.home_track_id) ?? null;
      const audioUrl = track?.audio_url ?? hr.audio_url;
      if (audioUrl) {
        homeSong = {
          recordId: hr.id,
          recordTitle: hr.title,
          artist: hr.artist,
          trackTitle: track?.title ?? "Faixa da home",
          audioUrl,
          audioStart: Number(settings.home_track_start ?? 0),
          audioEnd: settings.home_track_end != null ? Number(settings.home_track_end) : null,
          tag: settings.home_tag_id ? tags.find((t) => t.id === settings.home_tag_id) ?? null : null,
        };
      }
    }
  }

  return (
    <>
      <IntroCurtain />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 pb-16 pt-14 md:grid-cols-2 md:pb-24 md:pt-20">
          <div className="fade-up">
            <h1 className="font-display text-5xl font-extrabold leading-[0.98] text-ink md:text-6xl lg:text-7xl">
              Onde o passado <span className="text-gradient">continua girando</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Explore uma seleção cuidadosamente escolhida de discos de vinil, dos grandes clássicos que
              marcaram gerações às edições mais raras.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#acervo" className="btn-brand inline-flex items-center gap-2 rounded-xl px-7 py-4 text-sm">
                Explorar o acervo <ArrowRight size={16} />
              </a>
            </div>

            <div className="mt-12 grid max-w-sm grid-cols-2 gap-6">
              {[
                { big: "3.500+", small: "itens no acervo" },
                { big: "70 anos", small: "de música, de 1950 até hoje" },
              ].map((s, i) => (
                <div key={i}>
                  <p className="font-display text-3xl font-bold text-gradient">{s.big}</p>
                  <p className="mt-0.5 text-xs text-muted">{s.small}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex justify-center">
            <div className="relative w-full max-w-[440px]">
              <HeroVinyl />
              {homeSong && <HomeMiniPlayer song={homeSong} />}
            </div>
          </div>
        </div>
      </section>

      {/* ACERVO */}
      <section id="acervo" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-12">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-teal">O acervo</p>
          <h2 className="mt-1 font-display text-4xl font-bold text-ink md:text-5xl">Nossos discos</h2>
        </div>

        {records.length === 0 && boxes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line py-24 text-center">
            <Disc3 size={40} className="mx-auto mb-3 text-faint" />
            <p className="text-lg text-muted">O acervo está sendo preparado.</p>
            <p className="mt-1 text-sm text-faint">
              Em breve os discos aparecerão aqui.
            </p>
          </div>
        ) : (
          <AcervoTabs records={records} tags={tags} columns={settings?.home_columns} boxes={boxes} />
        )}
      </section>
    </>
  );
}
