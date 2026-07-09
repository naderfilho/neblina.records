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
            <stop offset="0" stopColor="#3aa9c4" />
            <stop offset="1" stopColor="#1f6f8a" />
          </linearGradient>
          <linearGradient id="sbg-m2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#255a7d" />
            <stop offset="1" stopColor="#1a3f5c" />
          </linearGradient>
          <linearGradient id="sbg-m3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#182f47" />
            <stop offset="1" stopColor="#0d1b2a" />
          </linearGradient>
        </defs>
        {/* montanhas arredondadas (colinas), como na logo — não pontiagudas */}
        <g className="sbg-layer sbg-layer-back">
          <path d="M0 600 C 160 540 320 540 460 600 C 620 668 760 668 920 600 C 1080 540 1240 540 1440 608 L1440 900 L0 900 Z" fill="url(#sbg-m1)" opacity="0.55" />
        </g>
        <g className="sbg-layer sbg-layer-mid">
          <path d="M0 682 C 200 620 380 620 540 682 C 720 748 880 748 1060 682 C 1220 632 1340 632 1440 676 L1440 900 L0 900 Z" fill="url(#sbg-m2)" opacity="0.85" />
        </g>
        <g className="sbg-layer sbg-layer-front">
          <path d="M0 762 C 220 700 420 700 600 762 C 800 822 980 822 1180 762 C 1320 720 1400 720 1440 752 L1440 900 L0 900 Z" fill="url(#sbg-m3)" />
        </g>
      </svg>

      {/* véu que escurece conforme rola (a cena "muda" para a noite) */}
      <div className="site-bg-veil absolute inset-0" />
    </div>
  );
}
