"use client";

import { useState } from "react";
import { HelpCircle, X } from "lucide-react";

const GRADES = [
  { sigla: "Mint (M)", nome: "Perfeito / Novo", desc: "Estado impecável. Nunca foi tocado ou não apresenta qualquer sinal de uso. Praticamente igual a um disco recém-saído da fábrica." },
  { sigla: "Near Mint (NM)", nome: "Quase Perfeito", desc: "Quase sem sinais de uso. Pode ter sido reproduzido poucas vezes, mas tanto o disco quanto a capa estão em excelente estado." },
  { sigla: "Very Good Plus (VG+)", nome: "Muito Bem Conservado", desc: "Pequenos sinais de uso, como marcas superficiais, mas toca muito bem, sem comprometer a experiência de audição. Uma das classificações mais procuradas por colecionadores." },
  { sigla: "Very Good (VG)", nome: "Bom Estado", desc: "Apresenta sinais visíveis de uso. Pode haver alguns estalos ou ruídos ocasionais durante a reprodução, mas o disco continua plenamente utilizável." },
  { sigla: "Good (G)", nome: "Bastante Usado", desc: "Desgaste evidente, com riscos e ruídos frequentes. Ainda toca do início ao fim, porém a qualidade sonora já é bastante afetada." },
  { sigla: "Fair (F)", nome: "Condição Regular", desc: "Muito desgastado. Pode apresentar falhas, pulos ou defeitos na reprodução. Indicado apenas para quem busca uma peça rara ou de coleção." },
  { sigla: "Poor (P)", nome: "Estado Ruim", desc: "Extremamente danificado. Pode não reproduzir corretamente e costuma ter valor apenas como item de coleção, decoração ou para reposição de capa." },
];

export default function GradingHelp() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center p-0.5 text-muted transition-colors hover:text-brand"
        title="O que significam as siglas?"
        aria-label="Explicar classificação de qualidade"
      >
        <HelpCircle size={18} />
      </button>

      {open && (
        <div onClick={() => setOpen(false)} className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 p-4">
          <div onClick={(e) => e.stopPropagation()} className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-panel p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl text-ink">Classificação de qualidade (Goldmine)</h3>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-muted hover:bg-panel-2 hover:text-ink"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              {GRADES.map((g) => (
                <div key={g.sigla} className="rounded-xl border border-line bg-bg-soft p-4">
                  <p className="font-semibold text-brand">{g.sigla} <span className="text-muted">— {g.nome}</span></p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{g.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
