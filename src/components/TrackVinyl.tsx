"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { type DiscConfig, DEFAULT_DISC_CONFIG, resolveDiscColor } from "@/lib/constants";
import { claimAudio, releaseAudio } from "@/lib/audio-bus";
import { playScratch } from "@/lib/scratch";
import type { Track } from "@/lib/types";
import { cn } from "@/lib/utils";

function ring(colorId: string) {
  return resolveDiscColor(colorId);
}

function Face({
  tracks,
  coverUrl,
  cfg,
  side,
  hoverId,
  playingId,
  onHover,
  onPlay,
}: {
  tracks: Track[];
  coverUrl?: string | null;
  cfg: DiscConfig;
  side: "A" | "B";
  hoverId: string | null;
  playingId: string | null;
  onHover: (id: string | null) => void;
  onPlay: (t: Track) => void;
}) {
  const c = ring(cfg.color);
  const N = Math.max(tracks.length, 1);
  const R_OUT = 47.5;
  const R_IN = 23;
  const bw = (R_OUT - R_IN) / N;
  const showPhoto = (cfg.label === "photo" || cfg.label === "photo-ring") && coverUrl;

  return (
    <div className="absolute inset-0">
      {/* corpo do vinil girando */}
      <div
        className="spin absolute inset-0 rounded-full"
        style={{
          backgroundImage: `repeating-radial-gradient(circle at center, rgba(255,255,255,0.045) 0px, rgba(255,255,255,0.045) 1px, transparent 1px, transparent 3px), radial-gradient(circle at 30% 26%, rgba(255,255,255,0.10), transparent 42%), radial-gradient(circle at center, ${c.groove} 0%, ${c.ring} 66%, #050505 100%)`,
        }}
      >
        {/* sulcos = faixas (SVG) */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          {tracks.map((t, i) => {
            const rC = R_OUT - (i + 0.5) * bw;
            const isHover = hoverId === t.id;
            const isPlay = playingId === t.id;
            return (
              <g key={t.id}>
                {/* área clicável (transparente) */}
                <circle
                  cx="50" cy="50" r={rC}
                  fill="none"
                  stroke="rgba(0,0,0,0.001)"
                  strokeWidth={bw}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => onHover(t.id)}
                  onMouseLeave={() => onHover(null)}
                  onClick={() => onPlay(t)}
                />
                {/* linha visível do sulco */}
                <circle
                  cx="50" cy="50" r={rC}
                  fill="none"
                  pointerEvents="none"
                  stroke={isPlay ? "#ff9d2e" : isHover ? "#26c0d4" : "rgba(255,255,255,0.16)"}
                  strokeWidth={isPlay ? 2.4 : isHover ? 2 : 0.7}
                  opacity={isPlay || isHover ? 1 : 0.9}
                />
              </g>
            );
          })}
        </svg>

        {/* label central */}
        <div className="absolute left-1/2 top-1/2 h-[42%] w-[42%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full">
          {showPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl!} alt="" className="h-full w-full object-cover" draggable={false} />
          ) : cfg.label === "logo" ? (
            <div className="flex h-full w-full items-center justify-center bg-[#0b0b0b]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Neblina" className="h-[86%] w-[86%] object-contain" />
            </div>
          ) : (
            <div className="h-full w-full" style={{ background: cfg.labelColor ?? "#ff9d2e" }} />
          )}
          <div className="absolute inset-0 flex items-end justify-center pb-[10%]">
            <span className="rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-white">
              LADO {side}
            </span>
          </div>
        </div>
        {/* furo */}
        <div className="absolute left-1/2 top-1/2 h-[4%] w-[4%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0b0b0b] shadow-[inset_0_0_3px_rgba(255,255,255,.4)]" />
      </div>
    </div>
  );
}

export default function TrackVinyl({
  tracks,
  coverUrl,
  config,
  title,
}: {
  tracks: Track[];
  coverUrl?: string | null;
  config?: Partial<DiscConfig> | null;
  title?: string;
}) {
  const cfg: DiscConfig = { ...DEFAULT_DISC_CONFIG, ...(config ?? {}) };
  const [side, setSide] = useState<"A" | "B">("A");
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const discRef = useRef<HTMLDivElement | null>(null);

  const [armDrag, setArmDrag] = useState(false);
  const [armAngle, setArmAngle] = useState<number | null>(null);

  const sideA = useMemo(() => tracks.filter((t) => t.side === "A"), [tracks]);
  const sideB = useMemo(() => tracks.filter((t) => t.side === "B"), [tracks]);

  function play(t: Track) {
    const a = audioRef.current;
    if (!a) return;
    if (playingId === t.id) {
      a.pause();
      setPlayingId(null);
      return;
    }
    if (!t.audio_url) return;
    claimAudio(a);
    a.src = t.audio_url;
    a.currentTime = 0;
    playScratch(); // agulha riscando a cada troca de faixa
    a.play().then(() => setPlayingId(t.id)).catch(() => {});
  }

  /* ---------- agulha arrastável ---------- */
  function cueFromPointer(clientX: number, clientY: number): { track: Track | null; angle: number } | null {
    const el = discRef.current?.getBoundingClientRect();
    if (!el) return null;
    const cx = el.left + el.width / 2;
    const cy = el.top + el.height / 2;
    const dist = Math.hypot(clientX - cx, clientY - cy);
    const rNorm = (dist / (el.width / 2)) * 50;
    const list = side === "A" ? sideA : sideB;
    const N = list.length;
    const R_OUT = 47.5, R_IN = 23;
    if (!N) return { track: null, angle: 6 };
    const bw = (R_OUT - R_IN) / N;
    if (rNorm < R_IN - 2 || rNorm > R_OUT + 4) return { track: null, angle: rNorm > R_OUT ? 4 : 34 };
    let i = Math.floor((R_OUT - rNorm) / bw);
    i = Math.max(0, Math.min(N - 1, i));
    const angle = 10 + ((R_OUT - rNorm) / (R_OUT - R_IN)) * 24;
    return { track: list[i], angle: Math.max(8, Math.min(34, angle)) };
  }

  useEffect(() => {
    if (!armDrag) return;
    const move = (e: PointerEvent) => {
      const c = cueFromPointer(e.clientX, e.clientY);
      if (c) { setArmAngle(c.angle); setHoverId(c.track?.id ?? null); }
    };
    const up = (e: PointerEvent) => {
      const c = cueFromPointer(e.clientX, e.clientY);
      setArmDrag(false);
      setArmAngle(null);
      setHoverId(null);
      if (c?.track) play(c.track);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    document.body.style.userSelect = "none";
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      document.body.style.userSelect = "";
    };
  }, [armDrag, side, sideA, sideB]); // eslint-disable-line react-hooks/exhaustive-deps

  function flipTo(s: "A" | "B") {
    if (s === side) return;
    const a = audioRef.current;
    if (a) a.pause();
    setPlayingId(null);
    setHoverId(null);
    setSide(s);
  }

  const current = tracks.find((t) => t.id === (hoverId ?? playingId));
  const caption = hoverId
    ? tracks.find((t) => t.id === hoverId)?.title
    : playingId
      ? tracks.find((t) => t.id === playingId)?.title
      : "Arraste a agulha até um sulco (ou clique) para tocar";

  return (
    <div className="mx-auto max-w-md">
      {/* caption */}
      <div className="mb-3 flex items-center justify-center gap-2 text-sm">
        {playingId && !hoverId ? <Play size={14} className="text-brand" /> : null}
        <span className={cn("truncate", current ? "text-ink" : "text-faint")}>{caption}</span>
      </div>

      {/* disco com flip 3D */}
      <div ref={discRef} className="relative aspect-square w-full" style={{ perspective: "1400px" }}>
        <div
          className="relative h-full w-full transition-transform duration-[2100ms]"
          style={{ transformStyle: "preserve-3d", transform: side === "B" ? "rotateY(180deg)" : "rotateY(0deg)", transitionTimingFunction: "cubic-bezier(0.45,0,0.15,1)" }}
        >
          {/* sombra */}
          <div className="absolute inset-[5%] rounded-full bg-black/60 blur-xl" style={{ backfaceVisibility: "hidden" }} aria-hidden />

          {/* Lado A (frente) */}
          <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
            <Face tracks={sideA} coverUrl={coverUrl} cfg={cfg} side="A" hoverId={hoverId} playingId={playingId} onHover={setHoverId} onPlay={play} />
          </div>

          {/* Lado B (verso) */}
          <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
            <Face tracks={sideB} coverUrl={coverUrl} cfg={cfg} side="B" hoverId={hoverId} playingId={playingId} onHover={setHoverId} onPlay={play} />
          </div>
        </div>

        {/* braço/agulha — arraste até o sulco pra tocar */}
        <svg viewBox="0 0 200 200" className="pointer-events-none absolute -right-3 -top-3 z-30 h-[54%] w-[54%] touch-none drop-shadow-xl">
          <defs>
            <linearGradient id="tv-arm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#eef1f4" /><stop offset="1" stopColor="#59636e" /></linearGradient>
          </defs>
          <g
            style={{
              transformOrigin: "176px 24px",
              transform: `rotate(${armDrag && armAngle != null ? armAngle : (playingId ? 31 : 6)}deg)`,
              transition: armDrag ? "none" : "transform 1s cubic-bezier(0.5,0,0.2,1)",
              pointerEvents: "auto",
              cursor: armDrag ? "grabbing" : "grab",
            }}
            onPointerDown={(e) => { e.preventDefault(); setArmDrag(true); }}
          >
            <line x1="176" y1="24" x2="76" y2="132" stroke="transparent" strokeWidth="46" strokeLinecap="round" />
            <circle cx="76" cy="132" r="30" fill="transparent" />
            <circle cx="176" cy="24" r="14" fill="#2a2118" stroke="#3a444e" strokeWidth="2" />
            <circle cx="176" cy="24" r="6" fill="#ff9d2e" />
            <line x1="176" y1="24" x2="78" y2="128" stroke="url(#tv-arm)" strokeWidth="8" strokeLinecap="round" />
            <g transform="rotate(45 74 130)"><rect x="56" y="118" width="34" height="20" rx="4" fill="url(#tv-arm)" stroke="#3a444e" /></g>
            <circle cx="76" cy="132" r="4.5" fill="#ff9d2e" />
          </g>
        </svg>
        {armDrag && (
          <span className="pointer-events-none absolute -bottom-2 left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/75 px-2 py-0.5 text-[10px] text-brand">
            {hoverId ? "solte pra tocar" : "leve até um sulco"}
          </span>
        )}
      </div>

      {/* botões de lado */}
      <div className="mt-6 flex justify-center gap-2">
        {(["A", "B"] as const).map((s) => (
          <button
            key={s}
            onClick={() => flipTo(s)}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors",
              side === s ? "border-brand bg-brand/15 text-brand" : "border-line bg-panel text-muted hover:text-ink",
            )}
          >
            Lado {s}
            <span className="text-xs text-faint">{s === "A" ? sideA.length : sideB.length} faixas</span>
          </button>
        ))}
      </div>

      {/* lista de faixas do lado atual */}
      <ul className="mt-5 space-y-1">
        {(side === "A" ? sideA : sideB).map((t, i) => (
          <li key={t.id}>
            <button
              onClick={() => play(t)}
              onMouseEnter={() => setHoverId(t.id)}
              onMouseLeave={() => setHoverId(null)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                playingId === t.id ? "bg-brand/15 text-brand" : "text-muted hover:bg-panel",
              )}
            >
              <span className="w-5 text-center text-xs text-faint">{i + 1}</span>
              {playingId === t.id ? <Pause size={14} /> : <Play size={14} />}
              <span className="flex-1 truncate">{t.title}</span>
              {!t.audio_url && <span className="text-[10px] text-faint">sem áudio</span>}
            </button>
          </li>
        ))}
        {(side === "A" ? sideA : sideB).length === 0 && (
          <li className="py-4 text-center text-sm text-faint">Nenhuma faixa cadastrada neste lado.</li>
        )}
      </ul>

      <audio ref={audioRef} onEnded={() => setPlayingId(null)} preload="none" crossOrigin="anonymous" />
    </div>
  );
}
