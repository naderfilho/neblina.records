"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { DISC_COLORS, type DiscConfig, DEFAULT_DISC_CONFIG } from "@/lib/constants";
import { claimAudio, releaseAudio } from "@/lib/audio-bus";
import { useCoarsePointer } from "@/lib/use-coarse-pointer";
import { cn } from "@/lib/utils";

type VinylProps = {
  coverUrl?: string | null;
  config?: Partial<DiscConfig> | null;
  audioUrl?: string | null;
  audioStart?: number;
  audioEnd?: number | null;
  title?: string;
  className?: string;
  /** hover(desktop)/toque(mobile) para girar + tocar */
  interactive?: boolean;
  /** callback ao clicar/tocar no disco (desktop navega; mobile só quando já ativo) */
  onOpen?: () => void;
  spinDuration?: number;
};

function bodyStyle(colorId: string): CSSProperties {
  const c = DISC_COLORS.find((x) => x.id === colorId) ?? DISC_COLORS[0];
  const splatter = colorId === "splatter";
  return {
    backgroundImage: [
      "repeating-radial-gradient(circle at center, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 3px)",
      "radial-gradient(circle at 30% 26%, rgba(255,255,255,0.12), transparent 42%)",
      splatter
        ? "radial-gradient(circle at 62% 70%, rgba(245,160,40,0.55), transparent 13%)"
        : "",
      splatter
        ? "radial-gradient(circle at 34% 62%, rgba(127,201,221,0.45), transparent 11%)"
        : "",
      `radial-gradient(circle at center, ${c.groove} 0%, ${c.ring} 66%, #050505 100%)`,
    ]
      .filter(Boolean)
      .join(","),
  };
}

function ringColor(border: string): string | undefined {
  switch (border) {
    case "brand":
      return "#f5a028";
    case "mist":
      return "#19b7a6";
    case "gold":
      return "#e7c96a";
    default:
      return undefined;
  }
}

export default function Vinyl({
  coverUrl,
  config,
  audioUrl,
  audioStart = 0,
  audioEnd,
  title,
  className,
  interactive = true,
  onOpen,
  spinDuration = 4,
}: VinylProps) {
  const cfg: DiscConfig = { ...DEFAULT_DISC_CONFIG, ...(config ?? {}) };
  const coarse = useCoarsePointer();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [active, setActive] = useState(false);

  const start = useCallback(() => {
    setActive(true);
    const a = audioRef.current;
    if (a && audioUrl) {
      claimAudio(a);
      try {
        a.currentTime = audioStart || 0;
      } catch {}
      a.play().catch(() => {});
    }
  }, [audioUrl, audioStart]);

  const stop = useCallback(() => {
    setActive(false);
    const a = audioRef.current;
    if (a) {
      a.pause();
      releaseAudio(a);
    }
  }, []);

  // Se outro disco roubar o áudio, para o giro também
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onPause = () => {
      if (!a.ended && a.paused) setActive((prev) => (audioUrl ? false : prev));
    };
    a.addEventListener("pause", onPause);
    return () => a.removeEventListener("pause", onPause);
  }, [audioUrl]);

  const onTimeUpdate = () => {
    const a = audioRef.current;
    if (!a) return;
    if (audioEnd && a.currentTime >= audioEnd) {
      a.currentTime = audioStart || 0;
    }
  };

  // Handlers de interação
  const hoverProps = interactive && !coarse
    ? { onMouseEnter: start, onMouseLeave: stop, onFocus: start, onBlur: stop }
    : {};

  const handleClick = () => {
    if (!interactive) {
      onOpen?.();
      return;
    }
    if (coarse) {
      // mobile: 1º toque toca, 2º toque abre
      if (active) {
        onOpen?.();
      } else {
        start();
      }
    } else {
      onOpen?.();
    }
  };

  const ring = ringColor(cfg.border);
  const showPhoto = cfg.label === "photo" || cfg.label === "photo-ring";
  const isLogo = cfg.label === "logo";

  return (
    <div
      className={cn("relative aspect-square w-full select-none", className)}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      aria-label={title}
      {...hoverProps}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen?.();
        }
      }}
    >
      {/* sombra projetada */}
      <div className="absolute inset-[6%] rounded-full bg-black/60 blur-xl" aria-hidden />

      {/* corpo do vinil */}
      <div
        className={cn(
          "absolute inset-0 rounded-full",
          "transition-[filter] duration-500",
          interactive && "needle-zone",
          active ? "spin" : "spin spin-paused",
        )}
        style={{ ...bodyStyle(cfg.color), animationDuration: `${spinDuration}s` }}
      >
        {/* aro externo brilhante */}
        <div className="absolute inset-0 rounded-full ring-1 ring-white/10" aria-hidden />

        {/* label central */}
        <div className="absolute left-1/2 top-1/2 h-[44%] w-[44%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full">
          {showPhoto && coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt={title ?? "Capa"}
              className="h-full w-full object-cover"
              draggable={false}
            />
          ) : isLogo ? (
            <div className="flex h-full w-full items-center justify-center bg-brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Neblina" className="h-[78%] w-[78%] object-contain" />
            </div>
          ) : (
            <div
              className="h-full w-full"
              style={{ background: cfg.labelColor ?? "#f5a028" }}
            />
          )}
        </div>

        {/* anel do label (borda) */}
        {ring && (
          <div
            className="absolute left-1/2 top-1/2 h-[44%] w-[44%] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ boxShadow: `0 0 0 3px ${ring}, inset 0 0 0 2px rgba(0,0,0,.35)` }}
            aria-hidden
          />
        )}

        {/* furo central (spindle) */}
        <div className="absolute left-1/2 top-1/2 h-[4.5%] w-[4.5%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0b0b0b] shadow-[inset_0_0_3px_rgba(255,255,255,.35)]" />
      </div>

      {/* indicador tocando */}
      {active && audioUrl && (
        <div className="pointer-events-none absolute bottom-[8%] left-1/2 flex -translate-x-1/2 items-end gap-[3px]">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="w-[3px] rounded-full bg-brand"
              style={{
                height: 10,
                animation: `eq 0.7s ${i * 0.12}s ease-in-out infinite alternate`,
              }}
            />
          ))}
        </div>
      )}

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="none"
          onTimeUpdate={onTimeUpdate}
          loop={!audioEnd}
        />
      )}

      <style jsx>{`
        @keyframes eq {
          from {
            transform: scaleY(0.4);
          }
          to {
            transform: scaleY(1.6);
          }
        }
      `}</style>
    </div>
  );
}
