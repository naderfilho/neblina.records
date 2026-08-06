import { Disc3, HandCoins, Search, ShieldCheck } from "lucide-react";
import SellForm from "@/components/SellForm";

export const metadata = {
  title: "Venda seu disco",
  description: "Tem um disco de vinil para vender? Envie os detalhes e a Neblina Records faz uma proposta.",
};
export const revalidate = 0;

const STEPS = [
  { icon: Disc3, title: "Conte sobre o disco", desc: "Nome, artista, ano, estado de conservação e uma foto (se quiser)." },
  { icon: Search, title: "A gente avalia", desc: "Nossa curadoria analisa a raridade e a condição do disco." },
  { icon: HandCoins, title: "Você recebe a proposta", desc: "Entramos em contato com um valor. Sem compromisso." },
];

export default function VenderPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <div className="mb-10 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-brand">Compramos seu disco</p>
        <h1 className="font-display text-4xl leading-tight text-ink md:text-5xl">Venda seu vinil para a Neblina</h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted">
          Tem discos parados em casa? A gente compra. Preencha os dados do disco que você quer vender — é rápido, e
          nossa equipe faz uma proposta justa pela sua peça.
        </p>
      </div>

      <div className="mb-12 grid gap-4 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <div key={s.title} className="card p-6">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand/15 text-brand"><s.icon size={22} /></div>
            <p className="mb-1 text-xs font-semibold text-faint">Passo {i + 1}</p>
            <h3 className="font-display text-lg text-ink">{s.title}</h3>
            <p className="mt-1 text-sm text-muted">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-2xl">
        <SellForm />
        <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-faint">
          <ShieldCheck size={14} /> Seus dados são usados só para avaliar a proposta e entrar em contato.
        </p>
      </div>
    </div>
  );
}
