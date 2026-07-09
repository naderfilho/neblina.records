"use client";

import { useEffect, useRef } from "react";

/**
 * Vídeo de fundo da área de eventos, com as bordas esmaecendo para a cor do
 * fundo do site (blend premium) e autoplay garantido no mobile.
 */
export default function EventsVideoBg() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    // iOS/Android só fazem autoplay com o vídeo mudo E via propriedade (não só atributo)
    v.muted = true;
    v.defaultMuted = true;
    const tryPlay = () => v.play().catch(() => {});
    tryPlay();
    // alguns navegadores mobile só liberam após o vídeo estar pronto
    v.addEventListener("loadeddata", tryPlay, { once: true });
    // e após o primeiro toque, como fallback
    const onTouch = () => { tryPlay(); window.removeEventListener("touchstart", onTouch); };
    window.addEventListener("touchstart", onTouch, { once: true });
    return () => {
      v.removeEventListener("loadeddata", tryPlay);
      window.removeEventListener("touchstart", onTouch);
    };
  }, []);

  // máscara que faz as 4 bordas do vídeo desaparecerem suavemente (blend no fundo)
  const edgeFade =
    "radial-gradient(115% 125% at 50% 42%, #000 46%, rgba(0,0,0,0.4) 74%, transparent 100%)";

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <video
        ref={ref}
        className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 object-cover"
        src="/eventos.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
        style={{
          // sem upscale (evita blur); leve realce cinematográfico
          filter: "contrast(1.06) saturate(1.08) brightness(0.94)",
          maskImage: edgeFade,
          WebkitMaskImage: edgeFade,
        }}
      />
      {/* color-grade: harmoniza o vídeo com a paleta âmbar/teal do site */}
      <div
        className="absolute inset-0 mix-blend-soft-light"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,157,46,0.28), transparent 45%, rgba(38,192,212,0.22))",
        }}
      />
      {/* escurecida para o texto ficar legível */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(6,9,14,0.58) 0%, rgba(6,9,14,0.34) 42%, rgba(6,9,14,0.78) 100%)",
        }}
      />
      {/* vinheta: casa as bordas com a cor exata do fundo do site */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 120% at 50% 44%, transparent 52%, rgba(6,9,14,0.85) 82%, var(--color-bg) 100%)",
        }}
      />
    </div>
  );
}
