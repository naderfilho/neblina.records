import Link from "next/link";
import { ArrowRight, Disc3, Globe, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import IntroCurtain from "@/components/IntroCurtain";
import RecordGrid from "@/components/RecordGrid";
import HeroVinyl from "@/components/HeroVinyl";
import type { RecordItem } from "@/lib/types";

export const revalidate = 0;

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("records")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  const records = (data ?? []) as RecordItem[];

  return (
    <>
      <IntroCurtain />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
          <div className="fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1 text-xs tracking-wide text-mist">
              <Sparkles size={13} className="text-brand" /> Curadoria desde 2023 · Nova Friburgo, RJ
            </span>
            <h1 className="mt-5 font-display text-5xl leading-[1.05] text-ink md:text-6xl lg:text-7xl">
              Onde a música <span className="text-brand">ganha forma</span>.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted">
              Vinis, CDs e raridades garimpadas com carinho. Passe o mouse — ou toque — em cada disco
              e ele gira e toca. Do clássico ao contemporâneo, mais de sete décadas de história musical.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#acervo" className="btn-brand inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm">
                Explorar acervo <ArrowRight size={16} />
              </Link>
              <Link
                href="/eventos"
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-panel px-6 py-3.5 text-sm text-ink hover:border-brand/50"
              >
                Contratar para evento
              </Link>
            </div>

            <div className="mt-12 grid max-w-md grid-cols-3 gap-6">
              {[
                { icon: Disc3, big: "3.500+", small: "itens no acervo" },
                { icon: Sparkles, big: "1950—2026", small: "sete décadas" },
                { icon: Globe, big: "4 países", small: "exportações" },
              ].map((s, i) => (
                <div key={i}>
                  <s.icon size={18} className="mb-1.5 text-teal" />
                  <p className="font-display text-xl text-ink">{s.big}</p>
                  <p className="text-xs text-muted">{s.small}</p>
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
      <section id="acervo" className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-teal">O acervo</p>
            <h2 className="mt-1 font-display text-3xl text-ink md:text-4xl">Nossos discos</h2>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line py-24 text-center">
            <Disc3 size={40} className="mx-auto mb-3 text-faint" />
            <p className="text-lg text-muted">O acervo está sendo preparado.</p>
            <p className="mt-1 text-sm text-faint">
              Em breve os discos aparecerão aqui. (Admin: adicione discos pelo painel.)
            </p>
          </div>
        ) : (
          <RecordGrid records={records} />
        )}
      </section>
    </>
  );
}
