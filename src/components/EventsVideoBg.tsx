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
    "radial-gradient(120% 120% at 50% 45%, #000 52%, rgba(0,0,0,0.35) 78%, transparent 100%)";

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <video
        ref={ref}
        className="absolute left-1/2 top-1/2 h-[112%] w-[112%] -translate-x-1/2 -translate-y-1/2 object-cover"
        src="/eventos.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
        style={{
          maskImage: edgeFade,
          WebkitMaskImage: edgeFade,
        }}
      />
      {/* leve escurecida por cima do vídeo, para o texto ficar legível */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(6,9,14,0.55) 0%, rgba(6,9,14,0.30) 42%, rgba(6,9,14,0.72) 100%)",
        }}
      />
      {/* casa as bordas com a cor exata do fundo do site */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(130% 130% at 50% 45%, transparent 60%, var(--color-bg) 100%)",
        }}
      />
    </div>
  );
}
