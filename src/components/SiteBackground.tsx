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
        {/* montanhas angulares e recortadas, replicando a geometria da logo
            (cume dominante à esquerda + serra irregular ao fundo) */}
        {/* serra do fundo (teal claro) — muitos picos afiados e irregulares */}
        <g className="sbg-layer sbg-layer-back">
          <path
            d="M0 560 L118 476 L206 540 L300 452 L392 520 L470 430 L560 512 L648 372 L742 486 L836 424 L946 520 L1052 452 L1168 536 L1288 470 L1382 512 L1440 486 L1440 900 L0 900 Z"
            fill="url(#sbg-m1)"
            opacity="0.5"
          />
        </g>
        {/* serra média (azul) — picos afiados um pouco à frente */}
        <g className="sbg-layer sbg-layer-mid">
          <path
            d="M0 648 L172 560 L292 632 L470 512 L610 604 L742 528 L904 620 L1058 540 L1214 626 L1330 568 L1440 616 L1440 900 L0 900 Z"
            fill="url(#sbg-m2)"
            opacity="0.85"
          />
        </g>
        {/* cume dominante à frente (navy) — grande pico afiado à esquerda, como na logo */}
        <g className="sbg-layer sbg-layer-front">
          <path
            d="M0 726 L96 690 L360 548 L556 706 L690 636 L900 726 L1060 654 L1210 720 L1332 664 L1440 704 L1440 900 L0 900 Z"
            fill="url(#sbg-m3)"
          />
        </g>
      </svg>

      {/* véu que escurece conforme rola (a cena "muda" para a noite) */}
      <div className="site-bg-veil absolute inset-0" />
    </div>
  );
}
