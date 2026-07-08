import Link from "next/link";
import { ArrowRight, Disc3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import IntroCurtain from "@/components/IntroCurtain";
import RecordGrid from "@/components/RecordGrid";
import HeroVinyl from "@/components/HeroVinyl";
import type { RecordItem, Tag } from "@/lib/types";

export const revalidate = 0;

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data }, { data: tagData }] = await Promise.all([
    supabase
      .from("records")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase.from("tags").select("*"),
  ]);

  const records = (data ?? []) as RecordItem[];
  const tags = (tagData ?? []) as Tag[];

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
              <Link href="#acervo" className="btn-brand inline-flex items-center gap-2 rounded-xl px-7 py-4 text-sm">
                Explorar o acervo <ArrowRight size={16} />
              </Link>
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
            <HeroVinyl />
          </div>
        </div>
      </section>

      {/* ACERVO */}
      <section id="acervo" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-12">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-teal">O acervo</p>
          <h2 className="mt-1 font-display text-4xl font-bold text-ink md:text-5xl">Nossos discos</h2>
        </div>

        {records.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line py-24 text-center">
            <Disc3 size={40} className="mx-auto mb-3 text-faint" />
            <p className="text-lg text-muted">O acervo está sendo preparado.</p>
            <p className="mt-1 text-sm text-faint">
              Em breve os discos aparecerão aqui.
            </p>
          </div>
        ) : (
          <RecordGrid records={records} tags={tags} />
        )}
      </section>
    </>
  );
}
