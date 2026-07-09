"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Play, Pause, RotateCcw, Hand, Disc3, ArrowDownToLine } from "lucide-react";
import { resolveDiscColor, DEFAULT_DISC_CONFIG, type DiscConfig } from "@/lib/constants";
import { claimAudio, releaseAudio } from "@/lib/audio-bus";
import { cn } from "@/lib/utils";
import type { RecordItem, Track } from "@/lib/types";

/* ---------- disco no prato (sulcos reativos + flip A/B) ---------- */
function PlatterFace({
  tracks, coverUrl, cfg, side, hoverId, playingId, spinning, onHover, onPlay,
}: {
  tracks: Track[];
  coverUrl?: string | null;
  cfg: DiscConfig;
  side: "A" | "B";
  hoverId: string | null;
  playingId: string | null;
  spinning: boolean;
  onHover: (id: string | null) => void;
  onPlay: (t: Track) => void;
}) {
  const c = resolveDiscColor(cfg.color);
  const N = Math.max(tracks.length, 1);
  const R_OUT = 47;
  const R_IN = 24;
  const bw = (R_OUT - R_IN) / N;

  return (
    <div className="absolute inset-0">
      <div
        className={cn("absolute inset-0 rounded-full spin-slow", !spinning && "spin-paused")}
        style={{
          backgroundImage: `repeating-radial-gradient(circle at center, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 3px), radial-gradient(circle at 30% 26%, rgba(255,255,255,0.12), transparent 42%), radial-gradient(circle at center, ${c.groove} 0%, ${c.ring} 66%, #050505 100%)`,
        }}
      >
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

        <div className="absolute left-1/2 top-1/2 h-[42%] w-[42%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="" className="h-full w-full object-cover" draggable={false} />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#0b0b0b]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="" className="h-[80%] w-[80%] object-contain" draggable={false} />
            </div>
          )}
          <div className="absolute inset-0 flex items-end justify-center pb-[10%]">
            <span className="rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-white">LADO {side}</span>
          </div>
        </div>
        <div className="absolute left-1/2 top-1/2 h-[4%] w-[4%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0b0b0b] shadow-[inset_0_0_3px_rgba(255,255,255,.4)]" />
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

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);
  const acRef = useRef<AudioContext | null>(null);
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
        : "Arraste um disco da prateleira até o prato";

  // ---------- arrastar da prateleira ----------
  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
      const dz = dropRef.current?.getBoundingClientRect();
      setOverDrop(!!dz && e.clientX >= dz.left && e.clientX <= dz.right && e.clientY >= dz.top && e.clientY <= dz.bottom);
    };
    const up = (e: PointerEvent) => {
      const dz = dropRef.current?.getBoundingClientRect();
      if (dz && e.clientX >= dz.left && e.clientX <= dz.right && e.clientY >= dz.top && e.clientY <= dz.bottom) {
        place(drag.rec);
      }
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
    if (crackleTimer.current) { clearTimeout(crackleTimer.current); crackleTimer.current = null; }
    setPlayingId(null);
    setArmDown(false);
    setCrackling(false);
  }

  function place(rec: RecordItem) {
    stopAudio();
    crackledForRef.current = null; // disco novo -> xiado no 1º play
    setOnPlatter(rec);
    setSide("A");
    setHoverId(null);
  }

  // ---------- xiado (needle drop) via Web Audio ----------
  function playCrackle(durationSec = 2.5) {
    try {
      let ctx = acRef.current;
      if (!ctx) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        ctx = new AC();
        acRef.current = ctx;
      }
      if (ctx.state === "suspended") ctx.resume();
      const n = Math.floor(ctx.sampleRate * durationSec);
      const buf = ctx.createBuffer(1, n, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) {
        let s = (Math.random() * 2 - 1) * 0.05; // chiado de base
        if (Math.random() < 0.0011) s += (Math.random() * 2 - 1) * 0.7; // estalos
        data[i] = s;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 500;
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 9500;
      const g = ctx.createGain();
      const t0 = ctx.currentTime;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.9, t0 + 0.18);
      g.gain.setValueAtTime(0.9, t0 + durationSec - 0.7);
      g.gain.linearRampToValueAtTime(0.0, t0 + durationSec);
      src.connect(hp); hp.connect(lp); lp.connect(g); g.connect(ctx.destination);
      src.start();
      src.stop(t0 + durationSec);
    } catch { /* silencioso */ }
  }

  function play(t: Track) {
    const a = audioRef.current;
    if (!a) return;
    if (playingId === t.id && !crackling) { a.pause(); setPlayingId(null); setArmDown(false); return; }
    if (!t.audio_url) return;
    claimAudio(a);
    a.src = t.audio_url;
    a.currentTime = 0;
    setArmDown(true);

    const first = crackledForRef.current !== onPlatter?.id;
    if (first) {
      crackledForRef.current = onPlatter?.id ?? null;
      setCrackling(true);
      playCrackle(2.5);
      if (crackleTimer.current) clearTimeout(crackleTimer.current);
      crackleTimer.current = window.setTimeout(() => {
        setCrackling(false);
        a.play().then(() => setPlayingId(t.id)).catch(() => {});
      }, 2300); // a música entra sob a cauda do xiado
    } else {
      a.play().then(() => setPlayingId(t.id)).catch(() => {});
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
      {/* ---------- TOCA-DISCOS ---------- */}
      <div className="mx-auto max-w-3xl">
        <div
          className="relative overflow-hidden rounded-[28px] border border-line p-6 md:p-9"
          style={{
            background: "linear-gradient(160deg, #241a12 0%, #17110c 45%, #0d0a07 100%)",
            boxShadow: "0 40px 80px -40px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* textura de madeira sutil */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "repeating-linear-gradient(92deg, #fff 0 1px, transparent 1px 7px)" }} />

          <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {/* prato + dropzone */}
            <div className="relative w-full max-w-[340px]">
              <div
                ref={dropRef}
                className={cn(
                  "relative aspect-square w-full rounded-full transition-shadow",
                  overDrop && "ring-4 ring-brand/70",
                )}
                style={{
                  background: "radial-gradient(circle at center, #2a2a2e 0%, #1a1a1d 60%, #0b0b0c 100%)",
                  boxShadow: "inset 0 0 40px rgba(0,0,0,0.8), 0 10px 30px -10px rgba(0,0,0,0.8)",
                }}
              >
                {/* eixo central do prato */}
                <div className="absolute left-1/2 top-1/2 z-10 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#c9ccd0]" />

                {onPlatter ? (
                  <div className="absolute inset-[7%]" style={{ perspective: "1400px" }}>
                    <div
                      className="relative h-full w-full transition-transform duration-[2100ms]"
                      style={{ transformStyle: "preserve-3d", transform: side === "B" ? "rotateY(180deg)" : "rotateY(0deg)", transitionTimingFunction: "cubic-bezier(0.45,0,0.15,1)" }}
                    >
                      <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
                        <PlatterFace tracks={sideA} coverUrl={onPlatter.cover_image_url} cfg={cfg} side="A" hoverId={hoverId} playingId={playingId} spinning={spinning} onHover={setHoverId} onPlay={play} />
                      </div>
                      <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                        <PlatterFace tracks={sideB} coverUrl={onPlatter.cover_image_url} cfg={cfg} side="B" hoverId={hoverId} playingId={playingId} spinning={spinning} onHover={setHoverId} onPlay={play} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-faint">
                    <ArrowDownToLine size={26} className={cn(overDrop && "text-brand")} />
                    <p className="px-6 text-xs">{overDrop ? "Solte o disco aqui" : "Arraste um disco da prateleira"}</p>
                  </div>
                )}
              </div>

              {/* braço / agulha */}
              <svg viewBox="0 0 200 200" className="pointer-events-none absolute -right-3 -top-3 h-[52%] w-[52%] drop-shadow-xl">
                <defs>
                  <linearGradient id="ata-arm" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#e9edf1" />
                    <stop offset="1" stopColor="#5b6772" />
                  </linearGradient>
                </defs>
                <g style={{ transformOrigin: "176px 24px", transform: `rotate(${armDown ? 30 : 6}deg)`, transition: "transform 0.9s cubic-bezier(0.5,0,0.2,1)" }}>
                  <circle cx="176" cy="24" r="13" fill="#ff9d2e" stroke="#2a2118" strokeWidth="2" />
                  <line x1="176" y1="24" x2="78" y2="128" stroke="url(#ata-arm)" strokeWidth="8" strokeLinecap="round" />
                  <g transform="rotate(45 74 130)">
                    <rect x="58" y="120" width="32" height="18" rx="4" fill="url(#ata-arm)" stroke="#3a444e" />
                  </g>
                  <circle cx="76" cy="132" r="4.5" fill="#ff9d2e" />
                </g>
              </svg>
            </div>

            {/* controles */}
            <div className="w-full flex-1">
              <div className="mb-3 flex min-h-[2.5rem] items-center gap-2 text-sm">
                {crackling ? (
                  <span className="flex items-center gap-2 text-mist">
                    <span className="h-2 w-2 animate-ping rounded-full bg-brand" /> a agulha desceu…
                  </span>
                ) : (
                  <span className={cn("truncate", current ? "text-ink" : "text-faint")}>{caption}</span>
                )}
              </div>

              {onPlatter && (
                <>
                  <p className="font-display text-xl text-ink">{onPlatter.title}</p>
                  <Link href={`/disco/${onPlatter.id}`} className="text-sm text-muted hover:text-brand">{onPlatter.artist}</Link>

                  <div className="mt-4 flex gap-2">
                    {(["A", "B"] as const).map((s) => (
                      <button key={s} onClick={() => flipTo(s)}
                        className={cn("flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
                          side === s ? "border-brand bg-brand/15 text-brand" : "border-line bg-panel text-muted hover:text-ink")}>
                        {side === s ? <span /> : <RotateCcw size={13} />} Lado {s}
                        <span className="text-xs text-faint">{s === "A" ? sideA.length : sideB.length}</span>
                      </button>
                    ))}
                  </div>

                  <ul className="mt-4 max-h-52 space-y-1 overflow-y-auto pr-1">
                    {(side === "A" ? sideA : sideB).map((t, i) => (
                      <li key={t.id}>
                        <button onClick={() => play(t)} onMouseEnter={() => setHoverId(t.id)} onMouseLeave={() => setHoverId(null)}
                          className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                            playingId === t.id ? "bg-brand/15 text-brand" : "text-muted hover:bg-panel")}>
                          <span className="w-5 text-center text-xs text-faint">{i + 1}</span>
                          {playingId === t.id ? <Pause size={14} /> : <Play size={14} />}
                          <span className="flex-1 truncate">{t.title}</span>
                          {!t.audio_url && <span className="text-[10px] text-faint">sem áudio</span>}
                        </button>
                      </li>
                    ))}
                    {(side === "A" ? sideA : sideB).length === 0 && (
                      <li className="py-3 text-center text-sm text-faint">Nenhuma faixa neste lado.</li>
                    )}
                  </ul>
                </>
              )}
            </div>
          </div>

          <audio ref={audioRef} onEnded={() => { setPlayingId(null); setArmDown(false); }} preload="none" crossOrigin="anonymous" />
        </div>
      </div>

      {/* ---------- PRATELEIRAS ---------- */}
      <div className="mt-12">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted">
          <Hand size={16} className="text-brand" /> Pegue um disco e leve até o prato
        </div>
        <Shelves records={records} onGrab={startDrag} activeId={onPlatter?.id ?? null} />
      </div>

      {/* ---------- disco fantasma sendo arrastado ---------- */}
      {drag && (
        <div
          className="pointer-events-none fixed z-[200] h-28 w-28 -translate-x-1/2 -translate-y-1/2"
          style={{ left: drag.x, top: drag.y }}
        >
          <div className="relative h-full w-full rounded-full vinyl-grooves shadow-2xl">
            <div className="absolute left-1/2 top-1/2 h-[42%] w-[42%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full">
              {drag.rec.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={drag.rec.cover_image_url} alt="" className="h-full w-full object-cover" draggable={false} />
              ) : (
                <div className="h-full w-full bg-brand" />
              )}
            </div>
            <div className="absolute left-1/2 top-1/2 h-[4%] w-[4%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-black" />
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- prateleiras com efeito dock ---------- */
function Shelves({ records, onGrab, activeId }: { records: RecordItem[]; onGrab: (r: RecordItem, e: React.PointerEvent) => void; activeId: string | null }) {
  const rowRef = useRef<HTMLDivElement | null>(null);

  function onMove(e: React.PointerEvent) {
    const row = rowRef.current;
    if (!row) return;
    const items = Array.from(row.querySelectorAll<HTMLElement>("[data-disc]"));
    for (const el of items) {
      const r = el.getBoundingClientRect();
      const center = r.left + r.width / 2;
      const d = Math.abs(e.clientX - center);
      const scale = 1 + 0.55 * Math.exp(-((d / 120) ** 2));
      el.style.transform = `translateY(${-(scale - 1) * 34}px) scale(${scale})`;
      el.style.zIndex = String(Math.round(scale * 10));
    }
  }
  function onLeave() {
    const row = rowRef.current;
    if (!row) return;
    row.querySelectorAll<HTMLElement>("[data-disc]").forEach((el) => {
      el.style.transform = "translateY(0) scale(1)";
      el.style.zIndex = "1";
    });
  }

  if (records.length === 0) {
    return <p className="rounded-2xl border border-dashed border-line py-14 text-center text-muted">Nenhum disco no acervo ainda.</p>;
  }

  return (
    <div className="relative">
      <div
        ref={rowRef}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className="flex items-end gap-4 overflow-x-auto pb-6 pt-10"
        style={{ scrollbarWidth: "thin" }}
      >
        {records.map((r) => (
          <button
            key={r.id}
            data-disc
            onPointerDown={(e) => onGrab(r, e)}
            className={cn(
              "group relative flex shrink-0 origin-bottom cursor-grab flex-col items-center transition-transform duration-150 ease-out active:cursor-grabbing",
              activeId === r.id && "opacity-40",
            )}
            style={{ willChange: "transform" }}
            title={`${r.title} — ${r.artist}`}
          >
            {/* capa (sleeve) */}
            <div className="relative h-24 w-24 overflow-hidden rounded-md border border-line shadow-lg md:h-28 md:w-28">
              {r.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.cover_image_url} alt="" className="h-full w-full object-cover" draggable={false} />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-panel text-faint"><Disc3 size={22} /></div>
              )}
            </div>
            <span className="mt-2 line-clamp-1 max-w-[7rem] text-[11px] text-muted">{r.title}</span>
          </button>
        ))}
      </div>
      {/* tábua da prateleira */}
      <div className="h-3 rounded-b-xl" style={{ background: "linear-gradient(180deg, #3a2a1c, #1c140d)", boxShadow: "0 8px 18px -8px rgba(0,0,0,0.8)" }} />
    </div>
  );
}
