"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Play, Pause, RotateCcw, Hand, Disc3, ArrowDownToLine, Volume2, Waves } from "lucide-react";
import Vinyl from "@/components/Vinyl";
import { resolveDiscColor, resolveBorderColor, DEFAULT_DISC_CONFIG, type DiscConfig } from "@/lib/constants";
import { claimAudio, releaseAudio } from "@/lib/audio-bus";
import { cn } from "@/lib/utils";
import type { RecordItem, Track } from "@/lib/types";

/* ============================================================
   Disco no prato — estilizado conforme o disc_config do disco
   (mesma cor/estilo do site) + sulcos reativos por faixa
   ============================================================ */
function PlatterFace({
  tracks, coverUrl, cfg, side, hoverId, playingId, onHover, onPlay,
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
  const c = resolveDiscColor(cfg.color);
  const ring = cfg.border !== "none" ? resolveBorderColor(cfg.borderColor ?? cfg.border) : undefined;
  const showPhoto = (cfg.label === "photo" || cfg.label === "photo-ring") && coverUrl;
  const isLogo = cfg.label === "logo";
  const labelColor = cfg.labelColor ?? "#ff9d2e";
  const N = Math.max(tracks.length, 1);
  const R_OUT = 47;
  const R_IN = 24.5;
  const bw = (R_OUT - R_IN) / N;

  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          backgroundImage: `repeating-radial-gradient(circle at center, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 3px), radial-gradient(circle at 30% 26%, rgba(255,255,255,0.12), transparent 42%), radial-gradient(circle at center, ${c.groove} 0%, ${c.ring} 66%, #050505 100%)`,
        }}
      >
        {/* sulcos = faixas */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          {tracks.map((t, i) => {
            const rC = R_OUT - (i + 0.5) * bw;
            const isHover = hoverId === t.id;
            const isPlay = playingId === t.id;
            return (
              <g key={t.id}>
                <circle cx="50" cy="50" r={rC} fill="none" stroke="rgba(0,0,0,0.001)" strokeWidth={bw}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => onHover(t.id)} onMouseLeave={() => onHover(null)} onClick={() => onPlay(t)} />
                <circle cx="50" cy="50" r={rC} fill="none" pointerEvents="none"
                  stroke={isPlay ? "#ff9d2e" : isHover ? "#26c0d4" : "rgba(255,255,255,0.16)"}
                  strokeWidth={isPlay ? 2.4 : isHover ? 2 : 0.7} opacity={isPlay || isHover ? 1 : 0.9} />
              </g>
            );
          })}
        </svg>

        {/* label central conforme config */}
        <div className="absolute left-1/2 top-1/2 h-[42%] w-[42%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full">
          {showPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl!} alt="" className="h-full w-full object-cover" draggable={false} />
          ) : isLogo ? (
            <div className="flex h-full w-full items-center justify-center bg-[#0b0b0b]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="" className="h-[82%] w-[82%] object-contain" draggable={false} />
            </div>
          ) : cfg.label === "gradient" ? (
            <div className="h-full w-full" style={{ background: `radial-gradient(circle at 34% 28%, ${labelColor}, rgba(10,10,10,0.9) 130%)` }} />
          ) : cfg.label === "target" ? (
            <div className="h-full w-full" style={{ background: `repeating-radial-gradient(circle at center, ${labelColor} 0 6%, #0b0b0b 6% 12%)` }} />
          ) : (
            <div className="h-full w-full" style={{ background: cfg.label === "vintage" ? "#e9e0c8" : cfg.label === "dark" ? "#0b0b0b" : labelColor }} />
          )}
          <div className="absolute inset-0 flex items-end justify-center pb-[10%]">
            <span className="rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-white">LADO {side}</span>
          </div>
        </div>

        {ring && (
          <div className="absolute left-1/2 top-1/2 h-[42%] w-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ boxShadow: `0 0 0 2px ${ring}, inset 0 0 0 2px rgba(0,0,0,.35)` }} />
        )}

        <div className="absolute left-1/2 top-1/2 h-[3.6%] w-[3.6%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0b0b0b] shadow-[inset_0_0_3px_rgba(255,255,255,.4)]" />
      </div>
    </div>
  );
}

/* ============================================================
   Caixa de som Neblina — cone reage ao áudio (via analyser)
   ============================================================ */
function Speaker({ side, coneRef, className }: { side: "L" | "R"; coneRef: React.RefObject<HTMLDivElement | null>; className?: string }) {
  return (
    <div className={cn("relative w-28 shrink-0 select-none sm:w-32 lg:w-36", className)}>
      <div
        className="relative overflow-hidden rounded-2xl border border-black/60 p-3"
        style={{
          background: "linear-gradient(150deg, #1a1a1d 0%, #101012 55%, #0a0a0b 100%)",
          boxShadow: "0 30px 50px -30px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.06)",
          transform: `perspective(700px) rotateY(${side === "L" ? 10 : -10}deg)`,
        }}
      >
        {/* tweeter */}
        <div className="mx-auto mb-3 h-8 w-8 rounded-full" style={{ background: "radial-gradient(circle at 40% 35%, #3a3a40, #0c0c0d 70%)", boxShadow: "inset 0 0 6px rgba(0,0,0,0.8)" }} />
        {/* woofer */}
        <div className="relative mx-auto aspect-square w-full rounded-full" style={{ background: "radial-gradient(circle at 42% 38%, #2a2a2e, #0a0a0b 72%)", boxShadow: "inset 0 0 14px rgba(0,0,0,0.9)" }}>
          <div ref={coneRef} className="absolute inset-[18%] rounded-full transition-transform duration-75 will-change-transform"
            style={{ background: "radial-gradient(circle at 42% 38%, #4a4a52, #141416 70%)", boxShadow: "inset 0 3px 8px rgba(0,0,0,0.8), 0 2px 6px rgba(0,0,0,0.6)" }}>
            <div className="absolute left-1/2 top-1/2 h-[30%] w-[30%] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(circle at 40% 35%, #ff9d2e, #7a3d06)" }} />
          </div>
        </div>
        {/* marca */}
        <p className="mt-3 text-center font-display text-[11px] tracking-[0.2em] text-brand/80">NEBLINA</p>
      </div>
    </div>
  );
}

export default function Audioteca({ records }: { records: RecordItem[] }) {
  const [onPlatter, setOnPlatter] = useState<RecordItem | null>(null);
  const [side, setSide] = useState<"A" | "B">("A");
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [armDown, setArmDown] = useState(false);
  const [crackling, setCrackling] = useState(false);
  const [drag, setDrag] = useState<{ rec: RecordItem; x: number; y: number } | null>(null);
  const [overDrop, setOverDrop] = useState(false);

  // controles de som
  const [volume, setVolume] = useState(0.9);
  const [bass, setBass] = useState(0);      // dB -12..+12
  const [treble, setTreble] = useState(0);  // dB -12..+12
  const [fade, setFade] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const crackleRef = useRef<HTMLAudioElement | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);
  const leftCone = useRef<HTMLDivElement | null>(null);
  const rightCone = useRef<HTMLDivElement | null>(null);

  const acRef = useRef<AudioContext | null>(null);
  const srcRef = useRef<MediaElementAudioSourceNode | null>(null);
  const bassRef = useRef<BiquadFilterNode | null>(null);
  const trebleRef = useRef<BiquadFilterNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const crackledForRef = useRef<string | null>(null);
  const crackleTimer = useRef<number | null>(null);

  const tracks = onPlatter?.tracks ?? [];
  const sideA = useMemo(() => tracks.filter((t) => t.side === "A"), [tracks]);
  const sideB = useMemo(() => tracks.filter((t) => t.side === "B"), [tracks]);
  const cfg: DiscConfig = { ...DEFAULT_DISC_CONFIG, ...(onPlatter?.disc_config ?? {}) };

  const current = tracks.find((t) => t.id === (hoverId ?? playingId));
  const caption = hoverId
    ? tracks.find((t) => t.id === hoverId)?.title
    : playingId
      ? tracks.find((t) => t.id === playingId)?.title
      : onPlatter
        ? "Passe o mouse nos sulcos e clique para tocar"
        : "Arraste um disco da estante até o prato";

  /* ---------- Web Audio: EQ + volume + analyser ---------- */
  function ensureGraph() {
    if (acRef.current || !audioRef.current) return;
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      const src = ctx.createMediaElementSource(audioRef.current);
      const b = ctx.createBiquadFilter(); b.type = "lowshelf"; b.frequency.value = 180; b.gain.value = bass;
      const t = ctx.createBiquadFilter(); t.type = "highshelf"; t.frequency.value = 3400; t.gain.value = treble;
      const g = ctx.createGain(); g.gain.value = volume;
      const an = ctx.createAnalyser(); an.fftSize = 256;
      src.connect(b); b.connect(t); t.connect(g); g.connect(an); an.connect(ctx.destination);
      acRef.current = ctx; srcRef.current = src; bassRef.current = b; trebleRef.current = t; gainRef.current = g; analyserRef.current = an;
    } catch { /* sem web audio -> toca direto */ }
  }

  useEffect(() => { if (bassRef.current) bassRef.current.gain.value = bass; }, [bass]);
  useEffect(() => { if (trebleRef.current) trebleRef.current.gain.value = treble; }, [treble]);
  useEffect(() => {
    const g = gainRef.current, ctx = acRef.current;
    if (g && ctx) g.gain.setTargetAtTime(volume, ctx.currentTime, 0.05);
  }, [volume]);

  /* ---------- caixas de som reagindo ao áudio (só enquanto toca) ---------- */
  useEffect(() => {
    if (!playingId) {
      if (leftCone.current) leftCone.current.style.transform = "scale(1)";
      if (rightCone.current) rightCone.current.style.transform = "scale(1)";
      return;
    }
    let raf = 0;
    const buf = new Uint8Array(128);
    const loop = () => {
      let level = 0;
      const an = analyserRef.current;
      if (an) {
        an.getByteFrequencyData(buf);
        let bsum = 0; for (let i = 0; i < 10; i++) bsum += buf[i];
        let msum = 0; for (let i = 0; i < buf.length; i++) msum += buf[i];
        level = Math.max(bsum / (10 * 255), msum / (buf.length * 255));
      }
      if (level < 0.03) level = 0.1 + 0.07 * Math.abs(Math.sin(performance.now() / 280));
      const s = 1 + level * 0.3;
      if (leftCone.current) leftCone.current.style.transform = `scale(${s})`;
      if (rightCone.current) rightCone.current.style.transform = `scale(${s})`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playingId]);

  /* ---------- arrastar da estante ---------- */
  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
      const dz = dropRef.current?.getBoundingClientRect();
      setOverDrop(!!dz && e.clientX >= dz.left && e.clientX <= dz.right && e.clientY >= dz.top && e.clientY <= dz.bottom);
    };
    const up = (e: PointerEvent) => {
      const dz = dropRef.current?.getBoundingClientRect();
      if (dz && e.clientX >= dz.left && e.clientX <= dz.right && e.clientY >= dz.top && e.clientY <= dz.bottom) place(drag.rec);
      setDrag(null);
      setOverDrop(false);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    document.body.style.userSelect = "none";
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      document.body.style.userSelect = "";
    };
  }, [drag]); // eslint-disable-line react-hooks/exhaustive-deps

  function startDrag(rec: RecordItem, e: React.PointerEvent) {
    e.preventDefault();
    setDrag({ rec, x: e.clientX, y: e.clientY });
  }

  function stopAudio() {
    const a = audioRef.current;
    if (a) { a.pause(); releaseAudio(a); }
    const c = crackleRef.current;
    if (c) c.pause();
    if (crackleTimer.current) { clearTimeout(crackleTimer.current); crackleTimer.current = null; }
    setPlayingId(null); setArmDown(false); setCrackling(false);
  }

  function place(rec: RecordItem) {
    stopAudio();
    crackledForRef.current = null;
    setOnPlatter(rec);
    setSide("A");
    setHoverId(null);
  }

  function playNeedle() {
    const c = crackleRef.current;
    if (!c) return;
    try { c.currentTime = 4; } catch { /* metadata ainda não pronta */ }
    c.volume = 0.85;
    c.play().catch(() => {});
  }

  function startTrack(t: Track) {
    const a = audioRef.current;
    if (!a) return;
    claimAudio(a);
    a.src = t.audio_url!;
    a.currentTime = 0;
    ensureGraph();
    const ctx = acRef.current;
    if (ctx && ctx.state === "suspended") ctx.resume();
    a.play().then(() => {
      setPlayingId(t.id);
      if (fade && gainRef.current && ctx) {
        const g = gainRef.current.gain;
        g.cancelScheduledValues(ctx.currentTime);
        g.setValueAtTime(0.0001, ctx.currentTime);
        g.exponentialRampToValueAtTime(Math.max(volume, 0.0001), ctx.currentTime + 1.3);
      }
    }).catch(() => {});
  }

  function pauseTrack() {
    const a = audioRef.current;
    if (!a) return;
    const ctx = acRef.current, g = gainRef.current;
    if (fade && ctx && g) {
      g.gain.cancelScheduledValues(ctx.currentTime);
      g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      window.setTimeout(() => { a.pause(); if (gainRef.current) gainRef.current.gain.value = volume; }, 520);
    } else {
      a.pause();
    }
    setPlayingId(null);
    setArmDown(false);
  }

  function play(t: Track) {
    if (!t.audio_url) return;
    if (playingId === t.id && !crackling) { pauseTrack(); return; }
    setArmDown(true);
    const first = crackledForRef.current !== onPlatter?.id;
    if (first) {
      crackledForRef.current = onPlatter?.id ?? null;
      setCrackling(true);
      playNeedle();
      if (crackleTimer.current) clearTimeout(crackleTimer.current);
      crackleTimer.current = window.setTimeout(() => { setCrackling(false); startTrack(t); }, 3500);
    } else {
      startTrack(t);
    }
  }

  function flipTo(s: "A" | "B") {
    if (s === side) return;
    const a = audioRef.current;
    if (a) a.pause();
    setPlayingId(null);
    setArmDown(false);
    setHoverId(null);
    setSide(s);
  }

  const spinning = !!playingId || crackling;

  return (
    <div>
      {/* ================= DECK + CAIXAS ================= */}
      <div className="flex flex-wrap items-center justify-center gap-5 lg:gap-8">
        <Speaker side="L" coneRef={leftCone} className="order-2 lg:order-1" />

        {/* mesa / toca-discos 3D */}
        <div
          className="relative order-1 w-full max-w-xl overflow-hidden rounded-[30px] border border-black/60 p-6 md:p-8 lg:order-2"
          style={{
            background: "linear-gradient(155deg, #2a2018 0%, #1a130d 46%, #0c0906 100%)",
            boxShadow: "0 60px 100px -50px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <div className="pointer-events-none absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "repeating-linear-gradient(93deg, #fff 0 1px, transparent 1px 8px)" }} />

          {/* leve inclinação 3D */}
          <div className="relative" style={{ perspective: "1100px" }}>
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start" style={{ transform: "rotateX(7deg)", transformStyle: "preserve-3d" }}>
              {/* prato */}
              <div className="relative w-full max-w-[320px]">
                <div
                  ref={dropRef}
                  className={cn("relative aspect-square w-full rounded-full transition-all", overDrop && "ring-4 ring-brand/70")}
                  style={{
                    background: "radial-gradient(circle at 50% 42%, #37373c 0%, #202024 46%, #0c0c0e 100%)",
                    boxShadow: "inset 0 0 50px rgba(0,0,0,0.85), 0 20px 40px -18px rgba(0,0,0,0.9)",
                  }}
                >
                  {/* slipmat (feltro) com aro metálico */}
                  <div className="absolute inset-[3%] rounded-full" style={{ background: "repeating-radial-gradient(circle at center, #17171a 0 2px, #131315 2px 4px)", boxShadow: "0 0 0 3px #45454b, inset 0 0 30px rgba(0,0,0,0.8)" }} />
                  {/* eixo */}
                  <div className="absolute left-1/2 top-1/2 z-20 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d6d9dd] shadow" />

                  {onPlatter ? (
                    <div className="absolute inset-[10%] z-10" style={{ perspective: "1400px" }}>
                      <div className={cn("relative h-full w-full", spinning && "ata-spin")}
                        style={{ transformStyle: "preserve-3d" }}>
                        <div
                          className="relative h-full w-full transition-transform duration-[2100ms]"
                          style={{ transformStyle: "preserve-3d", transform: side === "B" ? "rotateY(180deg)" : "rotateY(0deg)", transitionTimingFunction: "cubic-bezier(0.45,0,0.15,1)" }}
                        >
                          <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
                            <PlatterFace tracks={sideA} coverUrl={onPlatter.cover_image_url} cfg={cfg} side="A" hoverId={hoverId} playingId={playingId} onHover={setHoverId} onPlay={play} />
                          </div>
                          <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                            <PlatterFace tracks={sideB} coverUrl={onPlatter.cover_image_url} cfg={cfg} side="B" hoverId={hoverId} playingId={playingId} onHover={setHoverId} onPlay={play} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 text-center text-faint">
                      <ArrowDownToLine size={26} className={cn(overDrop && "text-brand")} />
                      <p className="px-8 text-xs">{overDrop ? "Solte o disco aqui" : "Arraste um disco até o prato"}</p>
                    </div>
                  )}
                </div>

                {/* braço / agulha */}
                <svg viewBox="0 0 200 200" className="pointer-events-none absolute -right-2 -top-2 z-30 h-[54%] w-[54%] drop-shadow-xl">
                  <defs>
                    <linearGradient id="ata-arm" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#eef1f4" />
                      <stop offset="1" stopColor="#59636e" />
                    </linearGradient>
                  </defs>
                  <g style={{ transformOrigin: "176px 24px", transform: `rotate(${armDown ? 31 : 4}deg)`, transition: "transform 1s cubic-bezier(0.5,0,0.2,1)" }}>
                    <circle cx="176" cy="24" r="14" fill="#2a2118" stroke="#3a444e" strokeWidth="2" />
                    <circle cx="176" cy="24" r="6" fill="#ff9d2e" />
                    <line x1="176" y1="24" x2="78" y2="128" stroke="url(#ata-arm)" strokeWidth="8" strokeLinecap="round" />
                    <g transform="rotate(45 74 130)">
                      <rect x="56" y="118" width="34" height="20" rx="4" fill="url(#ata-arm)" stroke="#3a444e" />
                    </g>
                    <circle cx="76" cy="132" r="4.5" fill="#ff9d2e" />
                  </g>
                </svg>
              </div>

              {/* faixas + lado */}
              <div className="w-full flex-1" style={{ transform: "rotateX(-7deg)" }}>
                <div className="mb-2 flex min-h-[2rem] items-center gap-2 text-sm">
                  {crackling ? (
                    <span className="flex items-center gap-2 text-mist"><span className="h-2 w-2 animate-ping rounded-full bg-brand" /> a agulha desceu…</span>
                  ) : (
                    <span className={cn("truncate", current ? "text-ink" : "text-faint")}>{caption}</span>
                  )}
                </div>

                {onPlatter ? (
                  <>
                    <p className="font-display text-lg leading-tight text-ink">{onPlatter.title}</p>
                    <Link href={`/disco/${onPlatter.id}`} className="text-sm text-muted hover:text-brand">{onPlatter.artist}</Link>

                    <div className="mt-3 flex gap-2">
                      {(["A", "B"] as const).map((s) => (
                        <button key={s} onClick={() => flipTo(s)}
                          className={cn("flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors",
                            side === s ? "border-brand bg-brand/15 text-brand" : "border-line bg-panel text-muted hover:text-ink")}>
                          {side === s ? <span className="h-3.5 w-px" /> : <RotateCcw size={13} />} Lado {s}
                          <span className="text-xs text-faint">{s === "A" ? sideA.length : sideB.length}</span>
                        </button>
                      ))}
                    </div>

                    <ul className="mt-3 max-h-44 space-y-1 overflow-y-auto pr-1">
                      {(side === "A" ? sideA : sideB).map((t, i) => (
                        <li key={t.id}>
                          <button onClick={() => play(t)} onMouseEnter={() => setHoverId(t.id)} onMouseLeave={() => setHoverId(null)}
                            className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-left text-sm transition-colors",
                              playingId === t.id ? "bg-brand/15 text-brand" : "text-muted hover:bg-panel")}>
                            <span className="w-5 text-center text-xs text-faint">{i + 1}</span>
                            {playingId === t.id ? <Pause size={14} /> : <Play size={14} />}
                            <span className="flex-1 truncate">{t.title}</span>
                            {!t.audio_url && <span className="text-[10px] text-faint">sem áudio</span>}
                          </button>
                        </li>
                      ))}
                      {(side === "A" ? sideA : sideB).length === 0 && <li className="py-3 text-center text-sm text-faint">Nenhuma faixa neste lado.</li>}
                    </ul>
                  </>
                ) : (
                  <p className="text-sm text-faint">Escolha um disco na estante abaixo e arraste até o prato para ouvir.</p>
                )}
              </div>
            </div>
          </div>

          {/* ---- mesa de som (controles) ---- */}
          <div className="relative mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-line/60 bg-black/30 p-4 sm:grid-cols-4">
            <Knob label="Volume" icon={<Volume2 size={13} />} value={volume} min={0} max={1} step={0.01} onChange={setVolume} fmt={(v) => `${Math.round(v * 100)}%`} />
            <Knob label="Graves" value={bass} min={-12} max={12} step={1} onChange={setBass} fmt={(v) => `${v > 0 ? "+" : ""}${v} dB`} />
            <Knob label="Agudos" value={treble} min={-12} max={12} step={1} onChange={setTreble} fmt={(v) => `${v > 0 ? "+" : ""}${v} dB`} />
            <button type="button" onClick={() => setFade((f) => !f)} className="flex flex-col items-start gap-1 rounded-xl border border-line bg-panel/60 px-3 py-2 text-left">
              <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted"><Waves size={13} /> Fade</span>
              <span className={cn("text-sm font-semibold", fade ? "text-brand" : "text-faint")}>{fade ? "Ligado" : "Desligado"}</span>
            </button>
          </div>
        </div>

        <Speaker side="R" coneRef={rightCone} className="order-3" />
      </div>

      {/* ================= ESTANTE ================= */}
      <div className="mt-12">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted">
          <Hand size={16} className="text-brand" /> Passe o mouse para o disco sair da capa. Segure e leve até o prato.
        </div>
        <Shelf records={records} onGrab={startDrag} activeId={onPlatter?.id ?? null} />
      </div>

      {/* ================= disco fantasma (arrastando) ================= */}
      {drag && (
        <div className="pointer-events-none fixed z-[200] h-32 w-32 -translate-x-1/2 -translate-y-1/2" style={{ left: drag.x, top: drag.y }}>
          <div className="drop-shadow-2xl">
            <Vinyl config={drag.rec.disc_config} coverUrl={drag.rec.cover_image_url} interactive={false} noNeedle title="" />
          </div>
        </div>
      )}

      {/* áudio da música (via Web Audio) + chiado da agulha */}
      <audio ref={audioRef} onEnded={() => { setPlayingId(null); setArmDown(false); }} preload="none" crossOrigin="anonymous" />
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={crackleRef} src="/needle.mp3" preload="auto" />

      <style jsx>{`
        .ata-spin { animation: ata-rot 3.2s linear infinite; }
        @keyframes ata-rot { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .ata-spin { animation: none; } }
      `}</style>
    </div>
  );
}

/* ---------- knob/slider de som ---------- */
function Knob({ label, icon, value, min, max, step, onChange, fmt }: {
  label: string; icon?: React.ReactNode; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt: (v: number) => string;
}) {
  return (
    <label className="flex flex-col gap-1 rounded-xl border border-line bg-panel/60 px-3 py-2">
      <span className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted">
        <span className="flex items-center gap-1.5">{icon} {label}</span>
        <span className="text-brand">{fmt(value)}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full accent-brand" />
    </label>
  );
}

/* ============================================================
   Estante — disco sai da capa (redondo, no estilo do site)
   + dock magnification
   ============================================================ */
function Shelf({ records, onGrab, activeId }: { records: RecordItem[]; onGrab: (r: RecordItem, e: React.PointerEvent) => void; activeId: string | null }) {
  const rowRef = useRef<HTMLDivElement | null>(null);

  function onMove(e: React.PointerEvent) {
    const row = rowRef.current;
    if (!row) return;
    row.querySelectorAll<HTMLElement>("[data-disc]").forEach((el) => {
      const r = el.getBoundingClientRect();
      const d = Math.abs(e.clientX - (r.left + r.width / 2));
      const scale = 1 + 0.5 * Math.exp(-((d / 130) ** 2));
      el.style.transform = `translateY(${-(scale - 1) * 30}px) scale(${scale})`;
      el.style.zIndex = String(Math.round(scale * 10));
    });
  }
  function onLeave() {
    rowRef.current?.querySelectorAll<HTMLElement>("[data-disc]").forEach((el) => {
      el.style.transform = "translateY(0) scale(1)";
      el.style.zIndex = "1";
    });
  }

  if (records.length === 0) {
    return <p className="rounded-2xl border border-dashed border-line py-14 text-center text-muted">Nenhum disco no acervo ainda.</p>;
  }

  return (
    <div className="relative">
      <div ref={rowRef} onPointerMove={onMove} onPointerLeave={onLeave} className="flex items-end gap-5 overflow-x-auto px-2 pb-6 pt-14" style={{ scrollbarWidth: "thin" }}>
        {records.map((r) => (
          <button
            key={r.id}
            data-disc
            onPointerDown={(e) => onGrab(r, e)}
            title={`${r.title} — ${r.artist}`}
            className={cn("group relative flex shrink-0 origin-bottom cursor-grab flex-col items-center transition-transform duration-150 ease-out active:cursor-grabbing", activeId === r.id && "opacity-40")}
            style={{ willChange: "transform" }}
          >
            <div className="relative h-28 w-28">
              {/* disco redondo (mesmo estilo do site) saindo por trás da capa */}
              <div className="absolute inset-0 translate-x-1 transition-transform duration-500 ease-out group-hover:translate-x-[46%] group-hover:rotate-6">
                <Vinyl config={r.disc_config} coverUrl={r.cover_image_url} interactive={false} noNeedle title="" />
              </div>
              {/* capa (sleeve) na frente */}
              <div className="absolute inset-0 overflow-hidden rounded-md border border-black/50 shadow-xl">
                {r.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.cover_image_url} alt="" className="h-full w-full object-cover" draggable={false} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-panel text-faint"><Disc3 size={24} /></div>
                )}
                {/* boca da capa (abertura por onde o disco sai) */}
                <div className="absolute inset-y-0 right-0 w-2 bg-gradient-to-l from-black/50 to-transparent" />
              </div>
            </div>
            <span className="mt-2 line-clamp-1 max-w-[7rem] text-[11px] text-muted">{r.title}</span>
          </button>
        ))}
      </div>
      {/* tábua da estante */}
      <div className="h-3 rounded-b-xl" style={{ background: "linear-gradient(180deg, #3a2a1c, #1c140d)", boxShadow: "0 10px 22px -8px rgba(0,0,0,0.85)" }} />
    </div>
  );
}
