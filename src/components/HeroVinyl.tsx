"use client";

import { useEffect, useState } from "react";
import Vinyl from "@/components/Vinyl";

// Disco do hero: mesmo componente interativo/mixável, com a logo Neblina.
// Nasce invisível (CSS); só aparece quando o disco da intro "chega" — ou de
// imediato em visitas seguintes (quando a intro não roda).
export default function HeroVinyl() {
  // agulha: durante a intro fica LEVANTADA (esperando o disco chegar); quando a
  // cortina sai e o disco assenta, ela DESCE sobre o disco, como pousar a agulha.
  const [armDown, setArmDown] = useState(false);

  useEffect(() => {
    let armTimer = 0;
    const reveal = () => document.documentElement.classList.add("disc-ready");
    // intro já vista nesta sessão -> mostra já e agulha já em repouso
    if (typeof window !== "undefined" && sessionStorage.getItem("neblina_intro_seen")) {
      reveal();
      setArmDown(true);
      return;
    }
    // Quando o disco CHEGA no hero (evento de timer direto, confiável no mobile),
    // revela e baixa a agulha logo em seguida. Antes a agulha dependia do fim da
    // saída da cortina (onExitComplete), que no mobile às vezes não dispara — e a
    // agulha ficava pra sempre no ar.
    const onArrived = () => {
      reveal();
      armTimer = window.setTimeout(() => setArmDown(true), 500);
    };
    window.addEventListener("neblina:disc-arrived", onArrived);
    // reforço: se a cortina terminar antes, garante a agulha embaixo
    const onFinished = () => setArmDown(true);
    window.addEventListener("neblina:intro-finished", onFinished);
    // rede de segurança: nunca deixa preso invisível / agulha pra sempre no ar
    const fallback = window.setTimeout(() => { reveal(); setArmDown(true); }, 5000);
    return () => {
      window.removeEventListener("neblina:disc-arrived", onArrived);
      window.removeEventListener("neblina:intro-finished", onFinished);
      clearTimeout(fallback);
      clearTimeout(armTimer);
    };
  }, []);

  return (
    <div className="relative aspect-square w-full max-w-[440px]">
      {/* glow */}
      <div
        className="absolute inset-0 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(255,157,46,0.22), transparent 62%)" }}
      />

      {/* disco interativo (arraste para mixar) */}
      <div id="hero-vinyl-disc" className="absolute inset-[8%]">
        <Vinyl
          config={{ color: "classic", label: "logo", border: "brand" }}
          interactive
          autoSpin
          noNeedle
          spinDuration={6}
          title="Neblina Records"
        />
      </div>

      {/* braço/agulha decorativo — pivô no canto sup-direito (176,24 do viewBox) */}
      <svg
        viewBox="0 0 200 200"
        className="pointer-events-none absolute -right-2 -top-2 h-[62%] w-[62%] drop-shadow-xl"
        style={{
          transformOrigin: "88% 12%",
          // esperando: -52° estaciona a cabeça à DIREITA, fora do disco (como o
          // descanso do braço), sem tocar o disco em nenhum momento; repouso: 6°
          transform: `rotate(${armDown ? 6 : -52}deg)`,
          transition: "transform 1s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        aria-hidden
      >
        <defs>
          <linearGradient id="harm" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e9edf1" />
            <stop offset="1" stopColor="#5b6772" />
          </linearGradient>
        </defs>
        <circle cx="176" cy="24" r="13" fill="#ff9d2e" stroke="#2a2118" strokeWidth="2" />
        <line x1="176" y1="24" x2="78" y2="128" stroke="url(#harm)" strokeWidth="8" strokeLinecap="round" />
        <g transform="rotate(45 74 130)">
          <rect x="58" y="120" width="32" height="18" rx="4" fill="url(#harm)" stroke="#3a444e" />
        </g>
        <circle cx="76" cy="132" r="4.5" fill="#ff9d2e" />
      </svg>

    </div>
  );
}
