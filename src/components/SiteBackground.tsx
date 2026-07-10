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
            <stop offset="0" stopColor="#2ec6e0" />
            <stop offset="1" stopColor="#1f9ec2" />
          </linearGradient>
          <linearGradient id="sbg-m2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1e82a6" />
            <stop offset="1" stopColor="#186b8c" />
          </linearGradient>
          <linearGradient id="sbg-m3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1e2a52" />
            <stop offset="1" stopColor="#131c38" />
          </linearGradient>
        </defs>
        {/* montanhas clonando a logo: crista de picos afiados e irregulares ao
            centro (cyan claro), massa teal média, e cume navy dominante à frente */}
        {/* fundo (cyan) — domo com crista serrilhada fina e irregular (como na logo) */}
        <g className="sbg-layer sbg-layer-back">
          <path
            d="M0 662 L200 644 L336 566 L372 512 L398 486 L420 500 L446 470 L470 484 L498 462 L524 478 L552 458 L580 474 L610 456 L640 470 L674 452 L714 446 L754 462 L794 452 L834 470 L874 460 L918 500 L1010 542 L1120 586 L1230 610 L1330 600 L1440 636 L1440 900 L0 900 Z"
            fill="url(#sbg-m1)"
            stroke="url(#sbg-m1)"
            strokeWidth="6"
            strokeLinejoin="round"
            opacity="0.82"
          />
        </g>
        {/* massa média (teal) — pico arredondado à esquerda + colinas à direita */}
        <g className="sbg-layer sbg-layer-mid">
          <path
            d="M0 690 L100 640 L210 544 L330 650 L480 700 L640 690 L770 656 L880 600 L1000 646 L1110 606 L1210 636 L1330 618 L1440 648 L1440 900 L0 900 Z"
            fill="url(#sbg-m2)"
            opacity="0.92"
          />
        </g>
        {/* frente (navy) — colina esq + grande pico afiado + montanha larga à direita, como na logo */}
        <g className="sbg-layer sbg-layer-front">
          <path
            d="M0 762 L120 732 L250 700 L360 724 L480 570 L600 722 L740 704 L900 672 L1060 606 L1210 690 L1330 668 L1440 706 L1440 900 L0 900 Z"
            fill="url(#sbg-m3)"
          />
        </g>
      </svg>

      {/* véu que escurece conforme rola (a cena "muda" para a noite) */}
      <div className="site-bg-veil absolute inset-0" />
    </div>
  );
}
