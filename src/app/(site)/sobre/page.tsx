import Link from "next/link";
import { Disc3, Globe, Award, Heart, ArrowRight } from "lucide-react";
import { STORE } from "@/lib/constants";

export const metadata = {
  title: "Sobre",
  description: "Três anos de história, paixão e curadoria. Conheça a Neblina Records — loja de vinis em Nova Friburgo, RJ.",
};

const PILARES = [
  { icon: Disc3, title: "LPs & EPs", desc: "O coração da coleção — álbuns completos e edições especiais de artistas nacionais e internacionais." },
  { icon: Award, title: "CDs & Pôsteres", desc: "Edições físicas raras e material gráfico que complementam a experiência do colecionador." },
  { icon: Heart, title: "1950 — 2026", desc: "Do clássico ao contemporâneo: cobertura de mais de sete décadas de história musical." },
  { icon: Globe, title: "Garimpo a Raridades", desc: "De lançamentos acessíveis a peças raras de colecionador avaliadas em até U$ 10.000,00." },
];

const PAISES = ["Reino Unido", "Austrália", "Itália", "Uruguai"];

export default function SobrePage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-sm uppercase tracking-[0.3em] text-teal">Quem somos</p>
      <h1 className="mt-2 max-w-3xl font-display text-4xl leading-tight text-ink md:text-5xl">
        Três anos de história, paixão e curadoria
      </h1>
      <div className="mt-6 grid gap-6 text-lg leading-relaxed text-muted md:grid-cols-2">
        <p>
          Nascida em <strong className="text-ink">Nova Friburgo, RJ</strong>, a Neblina Records é uma loja
          especializada em vinis, CDs e cultura musical. Em apenas três anos, construímos uma reputação sólida
          baseada em curadoria criteriosa, atendimento personalizado e presença ativa nos principais eventos do
          circuito cultural.
        </p>
        <p>
          Mais do que uma loja, somos um ponto de encontro para colecionadores, amantes da música e novos ouvintes
          que buscam experiências autênticas, onde cada disco carrega uma história para contar.
        </p>
      </div>

      {/* acervo */}
      <div className="mt-16">
        <h2 className="font-display text-3xl text-ink">Mais de 3.500 itens cuidadosamente selecionados</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PILARES.map((p) => (
            <div key={p.title} className="card p-6">
              <p.icon size={24} className="mb-3 text-brand" />
              <h3 className="font-display text-lg text-ink">{p.title}</h3>
              <p className="mt-2 text-sm text-muted">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* alcance */}
      <div className="mt-16 card p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-teal">Alcance global</p>
        <h2 className="mt-2 font-display text-3xl text-ink">Presença nacional e internacional via Discogs</h2>
        <p className="mt-4 max-w-3xl text-muted">
          A Neblina Records opera ativamente no marketplace global Discogs, uma das maiores plataformas de música
          física do mundo. Nossa reputação é construída sobre avaliações positivas, envios seguros e curadoria
          confiável. Exportamos regularmente para colecionadores em diversos países.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {PAISES.map((p) => (
            <span key={p} className="flex items-center gap-2 rounded-full border border-line bg-bg-soft px-4 py-2 text-sm text-ink">
              <Globe size={14} className="text-teal" /> {p}
            </span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-16 flex flex-col items-center gap-5 rounded-3xl border border-brand/30 bg-brand/5 p-10 text-center">
        <h2 className="font-display text-3xl text-ink">Venha garimpar com a gente</h2>
        <p className="max-w-xl text-muted">
          Explore o acervo online ou fale conosco pelo WhatsApp. {STORE.city}.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-brand inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm">
            Ver os discos <ArrowRight size={16} />
          </Link>
          <Link href="/eventos" className="inline-flex items-center gap-2 rounded-xl border border-line bg-panel px-6 py-3 text-sm text-ink hover:border-brand/50">
            Contratar para evento
          </Link>
        </div>
      </div>
    </div>
  );
}
