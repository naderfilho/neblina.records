import { Tent, Building2, Music4, Frame, Disc3, Sparkles, ShieldCheck, Truck } from "lucide-react";
import EventForm from "@/components/EventForm";

export const metadata = {
  title: "Eventos & Exposições",
  description:
    "Contrate a Neblina Records para feiras, festivais e eventos corporativos. Estande completo, acervo de mais de 3.500 itens e experiência interativa com vinil.",
};

const STATS = [
  { big: "10", small: "Mesas expositoras" },
  { big: "4.000", small: "Discos por evento" },
  { big: "3+", small: "Anos de experiência" },
];

const DIFERENCIAIS = [
  { icon: Sparkles, title: "Curadoria com Identidade", desc: "Acervo selecionado com critério — do clássico ao contemporâneo, com peças que geram conversa e engajamento." },
  { icon: Disc3, title: "Experiência, Não Apenas Venda", desc: "Toca-discos, higienização e lounge criam um ambiente memorável que valoriza o seu evento." },
  { icon: ShieldCheck, title: "Confiabilidade Comprovada", desc: "Histórico em eventos de grande porte e reputação sólida no mercado nacional e internacional." },
];

const HISTORICO = [
  { title: "29ª Feira de Discos do Rio de Janeiro", desc: "O maior evento de vinil do estado — presença consolidada e reconhecimento do público colecionador." },
  { title: "Art & Bier · Jazz & Blues", desc: "Eventos que unem gastronomia, arte e música — onde o vinil encontra novos públicos." },
  { title: "Encontro de Vinil NF", desc: "Evento local dedicado à comunidade de colecionadores de Nova Friburgo e região." },
];

const TIPOS = [
  { icon: Tent, title: "Feiras & Festivais", desc: "Estande completo com acervo, estrutura e experiência interativa." },
  { icon: Building2, title: "Eventos Corporativos", desc: "Curadoria temática e lounge exclusivo para o seu público." },
  { icon: Music4, title: "Festivais de Música", desc: "Presença que conecta o público à cultura física da música." },
  { icon: Frame, title: "Exposições", desc: "Mostras de vinil, capas e memorabilia com montagem impecável." },
];

export default function EventosPage() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <h1 className="font-display text-5xl font-extrabold leading-tight text-ink md:text-6xl">
            Leve a <span className="text-gradient">Neblina</span> para o seu evento
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
            Feiras, festivais, eventos corporativos e culturais. Oferecemos propostas personalizadas de acordo com
            o perfil e o espaço do seu evento — com curadoria musical autêntica e experiência interativa.
          </p>
          <a href="#proposta" className="btn-brand mt-8 inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm">
            Solicitar proposta
          </a>

          <div className="mt-14 grid grid-cols-3 gap-6">
            {STATS.map((s) => (
              <div key={s.small}>
                <p className="font-display text-4xl text-brand md:text-5xl">{s.big}</p>
                <p className="mt-1 text-sm text-muted">{s.small}</p>
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
            <h3 className="font-display text-xl text-ink">Infraestrutura Completa</h3>
            <p className="mt-2 text-muted">
              Levamos até <strong className="text-ink">10 mesas expositoras</strong>, com capacidade segura para
              até <strong className="text-ink">4.000 discos</strong> por evento. Organização, proteção e apresentação
              impecável do acervo em qualquer espaço.
            </p>
          </div>
          <div className="card p-7">
            <ShieldCheck size={26} className="mb-3 text-teal" />
            <h3 className="font-display text-xl text-ink">Montagem e Operação</h3>
            <p className="mt-2 text-muted">
              Equipe treinada para montagem ágil, disposição estratégica do acervo e atendimento personalizado durante
              todo o evento. Experiência comprovada em feiras de alta circulação.
            </p>
          </div>
        </div>
      </section>

      {/* DIFERENCIAIS */}
      <section className="mx-auto max-w-6xl px-6 py-6">
        <p className="text-center text-sm uppercase tracking-[0.3em] text-teal">Diferenciais</p>
        <h2 className="mt-2 text-center font-display text-3xl text-ink md:text-4xl">Por que escolher a Neblina?</h2>
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

      {/* HISTÓRICO */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm uppercase tracking-[0.3em] text-teal">Histórico de eventos</p>
        <h2 className="mt-2 font-display text-3xl text-ink md:text-4xl">Onde já estivemos</h2>
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
      <section className="mx-auto max-w-6xl px-6 pb-6">
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
          <h2 className="font-display text-3xl text-ink md:text-4xl">Vamos levar música ao seu evento?</h2>
          <p className="mt-2 text-muted">Preencha e retornaremos com uma proposta personalizada.</p>
        </div>
        <EventForm />
      </section>
    </div>
  );
}
