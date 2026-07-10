"use client";

import { useEffect, useRef } from "react";

/**
 * Fundo global inspirado na logo (sol âmbar sobre montanhas na névoa).
 * Fixo atrás de todo o site e reage ao scroll: o sol se põe e a cena
 * escurece conforme o usuário rola para baixo (parallax suave).
 */
export default function SiteBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const el = ref.current;
      if (!el) return;
      // progresso 0→1 ao longo dos primeiros ~1.4 telas
      const span = Math.min(
        Math.max(document.documentElement.scrollHeight - window.innerHeight, 1),
        window.innerHeight * 1.4,
      );
      const p = Math.min(1, Math.max(0, window.scrollY / span));
      el.style.setProperty("--scroll", p.toFixed(4));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden className="site-bg pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* céu */}
      <div className="site-bg-sky absolute inset-0" />

      {/* sol âmbar (se põe ao rolar) */}
      <div className="site-bg-sun" />

      {/* montanhas ancoradas na base — cobrem toda a largura em qualquer tela.
          Picos com folga no topo (nenhum encosta na borda -> sem topo cortado). */}
      <svg
        className="site-bg-mts"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMax slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="sbg-m1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3fc0dc" />
            <stop offset="1" stopColor="#1f83a0" />
          </linearGradient>
          <linearGradient id="sbg-m2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1f6f92" />
            <stop offset="1" stopColor="#194a68" />
          </linearGradient>
          <linearGradient id="sbg-m3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1a2a4a" />
            <stop offset="1" stopColor="#0c1626" />
          </linearGradient>
        </defs>
        {/* montanhas clonando a logo: crista de picos afiados e irregulares ao
            centro (cyan claro), massa teal média, e cume navy dominante à frente */}
        {/* fundo (cyan) — crista serrilhada com bumps ARREDONDADOS e menores (como na logo) */}
        <g className="sbg-layer sbg-layer-back">
          <path
            d="M0 596 L120 566 L250 566 Q300 516 350 548 Q396 508 442 544 Q486 500 528 540 Q566 506 606 542 Q648 512 700 548 L820 560 L950 532 L1090 574 L1230 544 L1360 578 L1440 560 L1440 900 L0 900 Z"
            fill="url(#sbg-m1)"
            stroke="url(#sbg-m1)"
            strokeWidth="8"
            strokeLinejoin="round"
            opacity="0.5"
          />
        </g>
        {/* massa média (teal) — formas mais largas e arredondadas */}
        <g className="sbg-layer sbg-layer-mid">
          <path
            d="M0 672 L180 620 L360 656 L520 596 L680 646 L860 606 L1040 654 L1220 618 L1380 650 L1440 636 L1440 900 L0 900 Z"
            fill="url(#sbg-m2)"
            stroke="url(#sbg-m2)"
            strokeWidth="14"
            strokeLinejoin="round"
            opacity="0.9"
          />
        </g>
        {/* frente (navy) — grande cume dominante à esquerda + colina à direita, como na logo */}
        <g className="sbg-layer sbg-layer-front">
          <path
            d="M0 726 L130 708 L300 654 L440 576 L590 698 L720 688 L900 704 L1010 636 L1180 700 L1340 668 L1440 700 L1440 900 L0 900 Z"
            fill="url(#sbg-m3)"
            stroke="url(#sbg-m3)"
            strokeWidth="14"
            strokeLinejoin="round"
          />
        </g>
      </svg>

      {/* véu que escurece conforme rola (a cena "muda" para a noite) */}
      <div className="site-bg-veil absolute inset-0" />
    </div>
  );
}
