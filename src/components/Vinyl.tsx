"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { type DiscConfig, DEFAULT_DISC_CONFIG, resolveDiscColor, resolveBorderColor } from "@/lib/constants";
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
  interactive?: boolean;
  onOpen?: () => void;
  spinDuration?: number;
  /** gira sozinho continuamente (usado no disco do hero) */
  autoSpin?: boolean;
  /** desativa o cursor-agulha (ex.: hero, que já tem agulha própria) */
  noNeedle?: boolean;
};

function bodyStyle(colorId: string, styleId?: string): CSSProperties {
  const c = resolveDiscColor(colorId);
  const grooves =
    "repeating-radial-gradient(circle at center, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 3px)";
  const sheen = "radial-gradient(circle at 30% 26%, rgba(255,255,255,0.12), transparent 42%)";
  const base = `radial-gradient(circle at center, ${c.groove} 0%, ${c.ring} 66%, #050505 100%)`;

  if (styleId === "halfhalf") {
    return { backgroundImage: [grooves, sheen, `linear-gradient(125deg, ${c.groove} 0 50%, ${c.accent} 50% 100%)`].join(",") };
  }

  const layers: string[] = [grooves, sheen];
  if (styleId === "splatter") {
    layers.push(
      `radial-gradient(circle at 62% 70%, ${c.accent}cc, transparent 12%)`,
      "radial-gradient(circle at 34% 62%, rgba(127,201,221,0.55), transparent 10%)",
      "radial-gradient(circle at 72% 32%, rgba(255,255,255,0.4), transparent 8%)",
      `radial-gradient(circle at 26% 38%, ${c.accent}aa, transparent 9%)`,
    );
  } else if (styleId === "marble") {
    layers.push(
      `radial-gradient(ellipse at 40% 35%, ${c.accent}55, transparent 45%)`,
      "radial-gradient(ellipse at 68% 72%, rgba(255,255,255,0.18), transparent 40%)",
    );
  } else if (styleId === "galaxy") {
    layers.push(
      "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.8), transparent 1.5%)",
      "radial-gradient(circle at 75% 25%, rgba(255,255,255,0.7), transparent 1.5%)",
      "radial-gradient(circle at 60% 72%, rgba(255,255,255,0.7), transparent 1.5%)",
      "radial-gradient(circle at 35% 78%, rgba(255,255,255,0.6), transparent 1.5%)",
      "radial-gradient(circle at 82% 62%, rgba(154,108,255,0.45), transparent 32%)",
    );
  } else if (styleId === "haze") {
    layers.push("radial-gradient(circle at 50% 50%, rgba(255,255,255,0.16), transparent 62%)");
  }
  layers.push(base);
  return { backgroundImage: layers.join(",") };
}

function ringColor(cfg: DiscConfig): string | undefined {
  if (cfg.border === "none") return undefined;
  return resolveBorderColor(cfg.borderColor ?? cfg.border);
}

function borderType(border: string): string {
  if (["thin", "thick", "double", "dashed"].includes(border)) return border;
  return border === "double" ? "double" : "thin"; // legacy
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
  autoSpin = false,
  noNeedle = false,
}: VinylProps) {
  const cfg: DiscConfig = { ...DEFAULT_DISC_CONFIG, ...(config ?? {}) };
  const coarse = useCoarsePointer();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [active, setActive] = useState(false);
  const [dragging, setDragging] = useState(false);

  const activeRef = useRef(false);
  const draggingRef = useRef(false);
  const rotationRef = useRef(0);
  const lastAngleRef = useRef(0);
  const movedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const wasActiveOnDownRef = useRef(false);

  const degPerSec = 360 / spinDuration;
  const SEC_PER_ROTATION = 1.6; // sensibilidade do scratch

  const applyRotation = () => {
    if (bodyRef.current) bodyRef.current.style.transform = `rotate(${rotationRef.current}deg)`;
  };

  const stopRaf = () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastTsRef.current = null;
  };

  const tick = useCallback((ts: number) => {
    const last = lastTsRef.current ?? ts;
    lastTsRef.current = ts;
    const dt = (ts - last) / 1000;
    if (activeRef.current && !draggingRef.current) {
      rotationRef.current += degPerSec * dt;
      applyRotation();
    }
    if (activeRef.current || draggingRef.current) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      stopRaf();
    }
  }, [degPerSec]);

  const ensureRaf = useCallback(() => {
    if (rafRef.current == null) rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const playAudio = useCallback(() => {
    const a = audioRef.current;
    if (!a || !audioUrl) return;
    claimAudio(a);
    const doPlay = () => {
      try {
        if (a.currentTime < (audioStart || 0) || (audioEnd && a.currentTime > audioEnd)) {
          a.currentTime = audioStart || 0;
        }
      } catch {}
      a.play().catch(() => {});
    };
    if (a.readyState >= 2) doPlay();
    else {
      a.load();
      const onReady = () => {
        a.removeEventListener("loadeddata", onReady);
        if (activeRef.current) doPlay();
      };
      a.addEventListener("loadeddata", onReady);
    }
  }, [audioUrl, audioStart, audioEnd]);

  const start = useCallback(() => {
    activeRef.current = true;
    setActive(true);
    ensureRaf();
    playAudio();
  }, [ensureRaf, playAudio]);

  const stop = useCallback(() => {
    activeRef.current = false;
    setActive(false);
    const a = audioRef.current;
    if (a) { a.pause(); releaseAudio(a); }
  }, []);

  // se outro disco roubar o áudio, para o giro
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onPause = () => {
      if (!draggingRef.current && a.paused && audioUrl) { activeRef.current = false; setActive(false); }
    };
    a.addEventListener("pause", onPause);
    return () => a.removeEventListener("pause", onPause);
  }, [audioUrl]);

  // giro contínuo (hero)
  useEffect(() => {
    if (autoSpin) {
      activeRef.current = true;
      setActive(true);
      ensureRaf();
    }
    return () => stopRaf();
  }, [autoSpin, ensureRaf]);

  const onTimeUpdate = () => {
    const a = audioRef.current;
    if (!a || draggingRef.current) return;
    if (audioEnd && a.currentTime >= audioEnd) a.currentTime = audioStart || 0;
  };

  // ---- Interação: arrastar para mixar/scratch ----
  const angleFromEvent = (clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    return Math.atan2(clientY - (r.top + r.height / 2), clientX - (r.left + r.width / 2)) * (180 / Math.PI);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!interactive) return;
    // No toque, NÃO capturamos o ponteiro: com touch-action pan-y o navegador
    // ainda faz o scroll vertical (rolar a página passando o dedo sobre o disco)
    // e manda pointercancel; o toque tem captura implícita pro scratch horizontal.
    // No mouse/caneta capturamos normalmente pra arrastar/mixar.
    if (e.pointerType !== "touch") (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    draggingRef.current = true;
    setDragging(true);
    movedRef.current = false;
    wasActiveOnDownRef.current = activeRef.current;
    lastAngleRef.current = angleFromEvent(e.clientX, e.clientY);
    if (!activeRef.current) start();
    ensureRaf();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const ang = angleFromEvent(e.clientX, e.clientY);
    let delta = ang - lastAngleRef.current;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    lastAngleRef.current = ang;
    if (Math.abs(delta) > 1.5) movedRef.current = true;

    rotationRef.current += delta;
    applyRotation();

    // scratch: mapeia rotação em tempo de áudio
    const a = audioRef.current;
    if (a && audioUrl) {
      const lo = audioStart || 0;
      const hi = audioEnd || a.duration || lo + 30;
      let t = a.currentTime + (delta / 360) * SEC_PER_ROTATION;
      t = Math.max(lo, Math.min(hi, t));
      try { a.currentTime = t; } catch {}
    }
  };

  const endDrag = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);

    if (!movedRef.current) {
      // toque/clique sem arrastar
      if (coarse) {
        if (wasActiveOnDownRef.current) onOpen?.(); // 2º toque abre
      } else {
        onOpen?.(); // desktop: clique abre
      }
    } else {
      // terminou de mixar: retoma a reprodução normal
      if (activeRef.current) playAudio();
    }
  };

  // hover no desktop
  const hoverProps = interactive && !coarse
    ? {
        onMouseEnter: () => start(),
        onMouseLeave: () => { if (!draggingRef.current && !autoSpin) stop(); },
      }
    : {};

  const ring = ringColor(cfg);
  const bType = borderType(cfg.border);
  const showPhoto = cfg.label === "photo" || cfg.label === "photo-ring";
  const isLogo = cfg.label === "logo";
  const labelColor = cfg.labelColor ?? "#ff9d2e";

  return (
    <div
      ref={containerRef}
      className={cn("relative aspect-square w-full select-none touch-pan-y", interactive && !noNeedle && "needle-zone", dragging && "dragging", className)}
      aria-label={title}
      {...hoverProps}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div className="absolute inset-[6%] rounded-full bg-black/60 blur-xl" aria-hidden />

      <div
        ref={bodyRef}
        className="absolute inset-0 rounded-full"
        style={bodyStyle(cfg.color, cfg.style)}
      >
        <div className="absolute inset-0 rounded-full ring-1 ring-white/10" aria-hidden />

        <div className="absolute left-1/2 top-1/2 h-[44%] w-[44%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full">
          {showPhoto && coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt={title ?? "Capa"} className="h-full w-full object-cover" draggable={false} />
          ) : isLogo ? (
            <div className="flex h-full w-full items-center justify-center bg-[#0b0b0b]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Neblina" className="h-[86%] w-[86%] object-contain" draggable={false} />
            </div>
          ) : cfg.label === "gradient" ? (
            <div className="h-full w-full" style={{ background: `radial-gradient(circle at 34% 28%, ${labelColor}, rgba(10,10,10,0.9) 130%)` }} />
          ) : cfg.label === "target" ? (
            <div className="h-full w-full" style={{ background: `repeating-radial-gradient(circle at center, ${labelColor} 0 6%, #0b0b0b 6% 12%)` }} />
          ) : (
            <div className="h-full w-full" style={{ background: cfg.label === "vintage" ? "#e9e0c8" : cfg.label === "dark" ? "#0b0b0b" : labelColor }} />
          )}
        </div>

        {ring && (
          <div
            className="absolute left-1/2 top-1/2 h-[44%] w-[44%] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={
              bType === "dashed"
                ? { border: `3px dashed ${ring}` }
                : {
                    boxShadow:
                      bType === "double"
                        ? `0 0 0 2px ${ring}, 0 0 0 5px rgba(0,0,0,.5), 0 0 0 7px ${ring}`
                        : bType === "thick"
                          ? `0 0 0 5px ${ring}, inset 0 0 0 2px rgba(0,0,0,.35)`
                          : `0 0 0 3px ${ring}, inset 0 0 0 2px rgba(0,0,0,.35)`,
                  }
            }
            aria-hidden
          />
        )}

        <div className="absolute left-1/2 top-1/2 h-[4.5%] w-[4.5%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0b0b0b] shadow-[inset_0_0_3px_rgba(255,255,255,.35)]" />
      </div>

      {active && audioUrl && !dragging && (
        <div className="pointer-events-none absolute bottom-[8%] left-1/2 flex -translate-x-1/2 items-end gap-[3px]">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="w-[3px] rounded-full bg-brand" style={{ height: 10, animation: `eq 0.7s ${i * 0.12}s ease-in-out infinite alternate` }} />
          ))}
        </div>
      )}

      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} preload="metadata" onTimeUpdate={onTimeUpdate} loop={!audioEnd} crossOrigin="anonymous" />
      )}

      <style jsx>{`
        @keyframes eq { from { transform: scaleY(0.4); } to { transform: scaleY(1.6); } }
      `}</style>
    </div>
  );
}
