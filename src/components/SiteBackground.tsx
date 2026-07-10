"use client";

import { useEffect, useRef } from "react";

/**
 * Fundo global: as montanhas da logo (imagem /montanhas.png) sobre um céu
 * escuro. Fixo atrás de todo o site; escurece suavemente conforme rola.
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
      {/* céu escuro */}
      <div className="site-bg-sky absolute inset-0" />

      {/* montanhas da logo (imagem), ancoradas na base e cobrindo toda a largura */}
      <div className="site-bg-mts" />

      {/* véu que escurece conforme rola (a cena "muda" para a noite) */}
      <div className="site-bg-veil absolute inset-0" />
    </div>
  );
}
