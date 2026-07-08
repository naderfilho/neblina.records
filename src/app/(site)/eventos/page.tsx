import { Tent, Building2, Music4, Frame, Disc3, Sparkles, ShieldCheck, Truck } from "lucide-react";
import EventForm from "@/components/EventForm";

export const metadata = {
  title: "Eventos & Exposições",
  description:
    "Contrate a Neblina Records para feiras, festivais e eventos. Estande completo, acervo de mais de 3.500 discos e a experiência de garimpar vinil ao vivo.",
};

const STATS = [
  { big: "10", small: "mesas expositoras" },
  { big: "4.000", small: "discos por evento" },
  { big: "3+", small: "anos rodando feiras" },
];

const DIFERENCIAIS = [
  { icon: Sparkles, title: "Curadoria de verdade", desc: "A gente escolhe disco por disco. Tem clássico que todo mundo procura e tem raridade pra quem entende, sempre com aquela peça que puxa conversa." },
  { icon: Disc3, title: "É experiência, não só venda", desc: "Levamos toca-discos, higienização na hora e um cantinho pra ouvir. O público fica, mexe nas caixas e volta pra comprar." },
  { icon: ShieldCheck, title: "Gente que já rodou muito", desc: "Estivemos em feiras grandes pelo Brasil e conversamos com colecionador de fora também. Você contrata quem já tem estrada." },
];

const HISTORICO = [
  { title: "29ª Feira de Discos do Rio de Janeiro", desc: "O maior encontro de vinil do estado. Presença firme e reconhecimento de quem coleciona há anos." },
  { title: "Art & Bier · Jazz & Blues", desc: "Comida boa, arte e música no mesmo lugar. É onde o vinil encontra gente que ainda vai virar colecionadora." },
  { title: "Encontro de Vinil NF", desc: "Nosso evento em casa, feito pra comunidade de colecionadores de Nova Friburgo e da região serrana." },
];

const TIPOS = [
  { icon: Tent, title: "Feiras e festivais", desc: "Estande completo, com acervo, estrutura e gente pra atender bem." },
  { icon: Building2, title: "Eventos corporativos", desc: "Seleção temática e um lounge só pra receber o seu público." },
  { icon: Music4, title: "Festivais de música", desc: "A gente liga o público à música que dá pra pegar na mão." },
  { icon: Frame, title: "Exposições", desc: "Mostras de vinil, capas e memorabilia montadas com capricho." },
];

export default function EventosPage() {
  return (
    <div>
      {/* HERO com vídeo de fundo */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            className="h-full w-full object-cover"
            src="/eventos.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden
          />
          {/* camada que deixa o vídeo visível mas mantém o texto legível */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(180deg, rgba(6,9,14,0.72) 0%, rgba(6,9,14,0.62) 45%, rgba(6,9,14,0.88) 100%)" }}
          />
        </div>

        <div className="relative mx-auto max-w-5xl px-6 py-24 text-center md:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-black/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-brand backdrop-blur">
            <Disc3 size={14} /> Neblina nos eventos
          </span>
          <h1 className="mt-6 font-display text-5xl font-extrabold leading-tight text-ink md:text-6xl">
            Leve a <span className="text-gradient">Neblina</span> para o seu evento
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-mist">
            Feiras, festivais, eventos corporativos e culturais. A gente monta um estande completo, com acervo de
            verdade e aquela experiência de garimpar disco que o público adora. Cada proposta é feita sob medida
            para o perfil e o espaço do seu evento.
          </p>
          <a href="#proposta" className="btn-brand mt-8 inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm">
            Solicitar proposta
          </a>

          <div className="mt-14 grid grid-cols-3 gap-6">
            {STATS.map((s) => (
              <div key={s.small}>
                <p className="font-display text-4xl text-brand md:text-5xl">{s.big}</p>
                <p className="mt-1 text-sm text-mist">{s.small}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ESTRUTURA */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card p-7">
            <Truck size={26} className="mb-3 text-teal" />
            <h3 className="font-display text-xl text-ink">Estrutura que cabe em qualquer espaço</h3>
            <p className="mt-2 text-muted">
              Levamos até <strong className="text-ink">10 mesas expositoras</strong> e transportamos com segurança
              até <strong className="text-ink">4.000 discos</strong> por evento. Tudo organizado, protegido e bem
              apresentado, do galpão grande ao cantinho charmoso.
            </p>
          </div>
          <div className="card p-7">
            <ShieldCheck size={26} className="mb-3 text-teal" />
            <h3 className="font-display text-xl text-ink">Montagem rápida e atendimento na régua</h3>
            <p className="mt-2 text-muted">
              A equipe monta rápido, organiza o acervo do jeito que vende e fica junto do público o evento inteiro.
              É gente que já passou por feira cheia e sabe como conduzir.
            </p>
          </div>
        </div>
      </section>

      {/* DIFERENCIAIS */}
      <section className="mx-auto max-w-6xl px-6 py-6">
        <p className="text-center text-sm uppercase tracking-[0.3em] text-teal">Por que a Neblina</p>
        <h2 className="mt-2 text-center font-display text-3xl text-ink md:text-4xl">O que a gente entrega</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {DIFERENCIAIS.map((d) => (
            <div key={d.title} className="card p-6">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand/15 text-brand">
                <d.icon size={22} />
              </div>
              <h3 className="font-display text-lg text-ink">{d.title}</h3>
              <p className="mt-2 text-sm text-muted">{d.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* QUEM FAZ (donos) */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="card grid items-center gap-8 overflow-hidden p-0 md:grid-cols-2">
          <div className="relative h-72 w-full md:h-full md:min-h-[340px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/donos.jpg" alt="Yuri e Vitor, fundadores da Neblina Records" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 md:bg-gradient-to-r md:from-transparent md:to-panel/80" />
          </div>
          <div className="p-8 md:pl-2">
            <p className="text-sm uppercase tracking-[0.3em] text-teal">Quem faz acontecer</p>
            <h2 className="mt-2 font-display text-3xl text-ink">Yuri e Vitor</h2>
            <p className="mt-3 leading-relaxed text-muted">
              A Neblina nasceu de dois amigos apaixonados por disco. Somos nós dois na estrada, montando estande,
              garimpando raridade e conversando com colecionador em cada feira. Quando você contrata a Neblina, é
              com a gente que você fala, do primeiro papo ao evento montado.
            </p>
            <a href="#proposta" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline">
              Chamar a gente pro seu evento →
            </a>
          </div>
        </div>
      </section>

      {/* HISTÓRICO */}
      <section className="mx-auto max-w-6xl px-6 py-6">
        <p className="text-sm uppercase tracking-[0.3em] text-teal">Onde já estivemos</p>
        <h2 className="mt-2 font-display text-3xl text-ink md:text-4xl">Um pouco da nossa estrada</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {HISTORICO.map((h) => (
            <div key={h.title} className="rounded-2xl border border-line bg-panel p-6">
              <Disc3 size={20} className="mb-3 text-brand" />
              <h3 className="font-display text-lg text-ink">{h.title}</h3>
              <p className="mt-2 text-sm text-muted">{h.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TIPOS */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TIPOS.map((t) => (
            <div key={t.title} className="rounded-2xl border border-line bg-bg-soft p-6">
              <t.icon size={24} className="mb-3 text-teal" />
              <h3 className="font-display text-lg text-ink">{t.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FORM */}
      <section id="proposta" className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-8 text-center">
          <h2 className="font-display text-3xl text-ink md:text-4xl">Bora levar música pro seu evento?</h2>
          <p className="mt-2 text-muted">Conta pra gente o que você imagina e a gente volta com uma proposta feita pra você.</p>
        </div>
        <EventForm />
      </section>
    </div>
  );
}
