"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Play, Pause, SkipBack, SkipForward, Hand, Disc3, ArrowDownToLine,
  Volume2, Waves, X, ListMusic, BookOpen, Plus, Lock, Eye,
} from "lucide-react";
import Vinyl from "@/components/Vinyl";
import BoxArt from "@/components/BoxArt";
import BoxHoverFan from "@/components/BoxHoverFan";
import { resolveDiscColor, resolveBorderColor, DEFAULT_DISC_CONFIG, type DiscConfig, type BoxConfig } from "@/lib/constants";
import { claimAudio, releaseAudio } from "@/lib/audio-bus";
import { useCoarsePointer } from "@/lib/use-coarse-pointer";
import { playScratch } from "@/lib/scratch";
import { cn } from "@/lib/utils";
import type { RecordItem, Track } from "@/lib/types";

/** Um box na Audioteca: os discos (já filtrados para os que têm áudio, na ordem). */
export type BoxAudio = {
  id: string;
  title: string;
  cover_image_url: string | null;
  spine_image_url: string | null;
  box_config: BoxConfig;
  audioteca_tier: string;
  records: RecordItem[];
};

type Entry = { di: number; side: "A" | "B"; track: Track };

function fmt(s: number) {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/* ---------- disco no prato: estilo do disc_config + sulcos reativos ---------- */
function PlatterFace({
  tracks, coverUrl, cfg, side, hoverId, playingId, onHover, onPlay, grooveDisabled,
}: {
  tracks: Track[]; coverUrl?: string | null; cfg: DiscConfig; side: "A" | "B";
  hoverId: string | null; playingId: string | null;
  onHover: (id: string | null) => void; onPlay: (t: Track) => void; grooveDisabled?: boolean;
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
        className="absolute inset-0 rounded-full bg-cover bg-center"
        style={
          cfg.bodyImageUrl
            ? { backgroundImage: `url(${cfg.bodyImageUrl})` }
            : {
                backgroundImage: `repeating-radial-gradient(circle at center, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 3px), radial-gradient(circle at 30% 26%, rgba(255,255,255,0.12), transparent 42%), radial-gradient(circle at center, ${c.groove} 0%, ${c.ring} 66%, #050505 100%)`,
              }
        }
      >
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" style={{ pointerEvents: grooveDisabled ? "none" : undefined }}>
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

export default function Audioteca({ records, boxes = [], isLoggedIn }: { records: RecordItem[]; boxes?: BoxAudio[]; isLoggedIn: boolean }) {
  const coarse = useCoarsePointer();

  // acesso por nível: público (todos), membros (logado), signature (em breve)
  const canAccess = (rec: RecordItem) =>
    rec.audioteca_tier === "public" || (rec.audioteca_tier === "members" && isLoggedIn);

  const [queue, setQueue] = useState<RecordItem[]>([]);
  const [pos, setPos] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [crackling, setCrackling] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [curTime, setCurTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [drag, setDrag] = useState<{ rec: RecordItem } | null>(null);
  const [overDrop, setOverDrop] = useState(false);
  // posição do fantasma via ref (DOM direto). NÃO usar state por movimento: cada
  // pointermove re-renderizaria a Audioteca inteira (28 discos + boxes) e o
  // arraste travava. Agora o movimento só mexe no style do fantasma.
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const dragPosRef = useRef({ x: 0, y: 0 });
  const [openId, setOpenId] = useState<string | null>(null);

  // disco no prato (independe da reproducao — mostra mesmo sem faixas com audio)
  const [platterDi, setPlatterDi] = useState(-1);
  const [platterSide, setPlatterSide] = useState<"A" | "B">("A");

  // agulha arrastável
  const [armDrag, setArmDrag] = useState(false);
  const [armAngle, setArmAngle] = useState<number | null>(null);
  const [restAngle, setRestAngle] = useState<number | null>(null);

  // controles de som
  const [volume, setVolume] = useState(0.9);
  const [bass, setBass] = useState(0);
  const [treble, setTreble] = useState(0);
  const [fade, setFade] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const crackleRef = useRef<HTMLAudioElement | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);
  const armSvgRef = useRef<SVGSVGElement | null>(null);
  const acRef = useRef<AudioContext | null>(null);
  const bassRef = useRef<BiquadFilterNode | null>(null);
  const trebleRef = useRef<BiquadFilterNode | null>(null);
  const lastDiscRef = useRef<number | null>(null);
  const crackleTimer = useRef<number | null>(null);
  const fadeTimer = useRef<number | null>(null);

  // playlist plana: por disco -> lado A (na ordem) depois lado B
  const playlist = useMemo<Entry[]>(() => {
    const list: Entry[] = [];
    queue.forEach((rec, di) => {
      const ts = rec.tracks ?? [];
      [...ts.filter((t) => t.side === "A"), ...ts.filter((t) => t.side === "B")]
        .filter((t) => t.audio_url)
        .forEach((track) => list.push({ di, side: track.side, track }));
    });
    return list;
  }, [queue]);

  const entry = pos >= 0 && pos < playlist.length ? playlist[pos] : null;
  const disc = platterDi >= 0 && platterDi < queue.length ? queue[platterDi] : null;
  const side = platterSide;
  const cfg: DiscConfig = { ...DEFAULT_DISC_CONFIG, ...(disc?.disc_config ?? {}) };
  const tracks = disc?.tracks ?? [];
  const sideA = useMemo(() => tracks.filter((t) => t.side === "A"), [tracks]);
  const sideB = useMemo(() => tracks.filter((t) => t.side === "B"), [tracks]);
  const playingId = playing || crackling ? entry?.track.id ?? null : null;

  const caption = hoverId
    ? tracks.find((t) => t.id === hoverId)?.title
    : disc
      ? crackling
        ? "a agulha desceu…"
        : entry && entry.di === platterDi
          ? entry.track.title
          : "Passe o mouse nos sulcos e clique para tocar"
      : coarse
        ? "Toque num disco na estante para começar"
        : "Arraste um disco até o prato para começar";

  /* ---------- Web Audio (só EQ; volume/fade ficam no elemento p/ 2º plano) ---------- */
  const ensureEqGraph = useCallback(() => {
    if (acRef.current || !audioRef.current) return;
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      const src = ctx.createMediaElementSource(audioRef.current);
      const b = ctx.createBiquadFilter(); b.type = "lowshelf"; b.frequency.value = 180; b.gain.value = bass;
      const t = ctx.createBiquadFilter(); t.type = "highshelf"; t.frequency.value = 3400; t.gain.value = treble;
      src.connect(b); b.connect(t); t.connect(ctx.destination);
      acRef.current = ctx; bassRef.current = b; trebleRef.current = t;
    } catch { /* sem web audio */ }
  }, [bass, treble]);

  useEffect(() => { if (bass !== 0 || treble !== 0) ensureEqGraph(); }, [bass, treble, ensureEqGraph]);
  useEffect(() => { if (bassRef.current) bassRef.current.gain.value = bass; }, [bass]);
  useEffect(() => { if (trebleRef.current) trebleRef.current.gain.value = treble; }, [treble]);

  // volume no elemento (funciona em segundo plano)
  useEffect(() => { if (audioRef.current && !fadeTimer.current) audioRef.current.volume = volume; }, [volume]);

  function rampVolume(to: number, ms: number, then?: () => void) {
    const a = audioRef.current;
    if (!a) return;
    if (fadeTimer.current) { clearInterval(fadeTimer.current); fadeTimer.current = null; }
    const from = a.volume;
    const steps = Math.max(1, Math.round(ms / 40));
    let i = 0;
    fadeTimer.current = window.setInterval(() => {
      i++;
      a.volume = Math.max(0, Math.min(1, from + (to - from) * (i / steps)));
      if (i >= steps) { if (fadeTimer.current) clearInterval(fadeTimer.current); fadeTimer.current = null; then?.(); }
    }, 40);
  }

  /* ---------- xiado (needle) ---------- */
  function playNeedle() {
    const c = crackleRef.current;
    if (!c) return;
    try { c.currentTime = 4; } catch { /* metadata ainda não pronta */ }
    c.volume = 0.85;
    c.play().catch(() => {});
  }

  /* ---------- tocar posição ---------- */
  const playAt = useCallback((newPos: number) => {
    const a = audioRef.current;
    if (!a || newPos < 0 || newPos >= playlist.length) return;
    const e = playlist[newPos];
    claimAudio(a);
    a.src = e.track.audio_url!;
    a.currentTime = 0;
    if (bass !== 0 || treble !== 0) ensureEqGraph();
    if (acRef.current?.state === "suspended") acRef.current.resume();
    setPos(newPos);
    setPlatterDi(e.di);
    setPlatterSide(e.side);

    const newDisc = e.di !== lastDiscRef.current;
    lastDiscRef.current = e.di;

    const start = () => {
      a.volume = fade ? 0 : volume;
      a.play().then(() => {
        setPlaying(true);
        if (fade) rampVolume(volume, 1200);
      }).catch(() => {});
    };

    if (newDisc) {
      setCrackling(true);
      playNeedle();
      if (crackleTimer.current) clearTimeout(crackleTimer.current);
      crackleTimer.current = window.setTimeout(() => { setCrackling(false); start(); }, 3500);
    } else {
      setCrackling(false);
      playScratch(); // agulha riscando a cada troca de faixa
      start();
    }
  }, [playlist, bass, treble, fade, volume, ensureEqGraph]);

  function togglePlay() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      if (fade) rampVolume(0, 400, () => a.pause());
      else a.pause();
      setPlaying(false);
      return;
    }
    if (crackling) return;
    // precisa carregar? (nada tocando ainda, ou o áudio nunca recebeu fonte)
    if (pos < 0 || !a.currentSrc) {
      let start = pos;
      if (start < 0) start = platterDi >= 0 ? playlist.findIndex((e) => e.di === platterDi) : -1;
      if (start < 0 && playlist.length) start = 0;
      if (start >= 0) playAt(start);
      return;
    }
    // retoma
    if (acRef.current?.state === "suspended") acRef.current.resume();
    a.play().then(() => { setPlaying(true); if (fade) rampVolume(volume, 400); }).catch(() => {});
  }

  function next() { if (playlist.length) playAt((pos + 1 + playlist.length) % playlist.length); }
  function prev() {
    const a = audioRef.current;
    if (a && a.currentTime > 3) { a.currentTime = 0; return; }
    if (playlist.length) playAt((pos - 1 + playlist.length) % playlist.length);
  }
  function selectTrack(t: Track) {
    const i = playlist.findIndex((e) => e.track.id === t.id && e.di === platterDi);
    if (i >= 0) playAt(i);
  }
  function flipTo(s: "A" | "B") {
    if (!disc || s === platterSide) return;
    setPlatterSide(s);
    if (playing || crackling) {
      const i = playlist.findIndex((e) => e.di === platterDi && e.side === s);
      if (i >= 0) playAt(i);
    }
  }

  // tira o disco do prato: para tudo e volta o prato pro estado vazio
  function clearPlatter() {
    const a = audioRef.current;
    if (a) { a.pause(); releaseAudio(a); }
    if (crackleTimer.current) { clearTimeout(crackleTimer.current); crackleTimer.current = null; }
    setPlaying(false);
    setCrackling(false);
    setPos(-1);
    setPlatterDi(-1);
    setPlatterSide("A");
    setArmDrag(false);
    setRestAngle(null);
    setHoverId(null);
  }

  /* ---------- agulha arrastável (geometria real do braço) ----------
     Um único modelo geométrico serve tanto para arrastar quanto para pousar:
     `angleForRadius` é o INVERSO exato do arco do braço — dado o raio de um sulco,
     devolve o ângulo em que o estilete pousa nele. Assim, clicar num sulco e
     arrastar a agulha até ele levam ao MESMO lugar (o sulco certo). No arrasto, o
     braço acompanha a distância do dedo/cursor ao centro (radial), fluido no
     desktop e no touch. */
  const R_OUT = 47, R_IN = 24.5;
  const ARM_MIN = 2, ARM_MAX = 44;

  // centro do sulco (escala 0..50) da faixa 'id' dentro da lista do lado
  function grooveCenter(list: Track[], id: string | null): number | null {
    if (!id) return null;
    const N = list.length;
    const i = list.findIndex((t) => t.id === id);
    if (i < 0 || N === 0) return null;
    const bw = (R_OUT - R_IN) / N;
    return R_OUT - (i + 0.5) * bw;
  }

  // inverso do arco do braço: raio-alvo (0..50) -> ângulo do braço (graus)
  function angleForRadius(rNorm: number): number | null {
    const svg = armSvgRef.current?.getBoundingClientRect();
    const dz = dropRef.current?.getBoundingClientRect();
    if (!svg || !dz) return null;
    const pivotX = svg.left + (176 / 200) * svg.width;
    const pivotY = svg.top + (24 / 200) * svg.height;
    const ox = ((78 - 176) / 200) * svg.width; // offset do estilete no ângulo 0
    const oy = ((128 - 24) / 200) * svg.height;
    const cx = dz.left + dz.width / 2;
    const cy = dz.top + dz.height / 2;
    const vinylR = (dz.width / 2) * 0.8; // vinil = inset-[10%] do prato
    const d = (rNorm / 50) * vinylR; // raio-alvo em px
    const Vx = pivotX - cx, Vy = pivotY - cy;
    const A = Vx * ox + Vy * oy;
    const B = Vy * ox - Vx * oy;
    const Rr = Math.hypot(A, B);
    if (Rr === 0) return null;
    // |V + R(θ)O|² = d²  ->  A cosθ + B sinθ = k·Rr
    let k = (d * d - (Vx * Vx + Vy * Vy) - (ox * ox + oy * oy)) / 2 / Rr;
    k = Math.max(-1, Math.min(1, k));
    const phi = Math.atan2(B, A);
    const ac = Math.acos(k);
    let best: number | null = null, bestPen = Infinity;
    for (const r of [phi + ac, phi - ac]) {
      let deg = (r * 180) / Math.PI;
      deg = ((((deg + 180) % 360) + 360) % 360) - 180; // normaliza [-180,180]
      const clamped = Math.max(ARM_MIN, Math.min(ARM_MAX, deg));
      const pen = Math.abs(deg - clamped);
      if (pen < bestPen) { bestPen = pen; best = clamped; }
    }
    return best;
  }

  // raio (0..50) do cursor/dedo a partir do centro do disco
  function pointerRadius(clientX: number, clientY: number): number | null {
    const dz = dropRef.current?.getBoundingClientRect();
    if (!dz) return null;
    const cx = dz.left + dz.width / 2;
    const cy = dz.top + dz.height / 2;
    const vinylR = (dz.width / 2) * 0.8;
    return (Math.hypot(clientX - cx, clientY - cy) / vinylR) * 50;
  }

  function trackAtRadius(rNorm: number): Track | null {
    const list = platterSide === "A" ? sideA : sideB;
    const N = list.length;
    if (!N || rNorm < R_IN - 4 || rNorm > R_OUT + 5) return null;
    const bw = (R_OUT - R_IN) / N;
    let i = Math.floor((R_OUT - rNorm) / bw);
    i = Math.max(0, Math.min(N - 1, i));
    return list[i];
  }

  useEffect(() => {
    if (!armDrag) return;
    const move = (e: PointerEvent) => {
      e.preventDefault();
      const rNorm = pointerRadius(e.clientX, e.clientY);
      if (rNorm == null) return;
      const a = angleForRadius(Math.max(R_IN, Math.min(R_OUT, rNorm)));
      if (a != null) setArmAngle(a);
      setHoverId(trackAtRadius(rNorm)?.id ?? null);
    };
    const up = (e: PointerEvent) => {
      const rNorm = pointerRadius(e.clientX, e.clientY);
      setArmDrag(false);
      setArmAngle(null);
      setHoverId(null);
      const t = rNorm != null ? trackAtRadius(rNorm) : null;
      if (t) selectTrack(t); // pousa e toca; o descanso vai pro sulco certo
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    document.body.style.userSelect = "none";
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      document.body.style.userSelect = "";
    };
  }, [armDrag, platterSide, sideA, sideB]); // eslint-disable-line react-hooks/exhaustive-deps

  // descanso do braço = sulco da faixa carregada no prato (mesmo cálculo do arrasto)
  useLayoutEffect(() => {
    const apply = () => {
      if (armDrag) return;
      const id = entry && entry.di === platterDi ? entry.track.id : null;
      const list = platterSide === "A" ? sideA : sideB;
      const rC = grooveCenter(list, id);
      setRestAngle(rC == null ? null : angleForRadius(rC));
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, [entry, platterDi, platterSide, sideA, sideB, armDrag]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- fila ---------- */
  function place(rec: RecordItem) {
    if (!canAccess(rec)) return;
    setQueue((q) => {
      const newIdx = q.length;
      // se nada estiver tocando, o disco recém-colocado vai pro prato
      if (pos < 0) {
        setPlatterDi(newIdx);
        setPlatterSide("A");
        lastDiscRef.current = null;
      }
      return [...q, rec];
    });
  }
  // enfileira TODOS os discos de um box de uma vez (na ordem), respeitando o acesso
  function placeBox(recs: RecordItem[]) {
    const accessible = recs.filter(canAccess);
    if (!accessible.length) return;
    setQueue((q) => {
      const startIdx = q.length;
      if (pos < 0) {
        setPlatterDi(startIdx);
        setPlatterSide("A");
        lastDiscRef.current = null;
      }
      return [...q, ...accessible];
    });
  }
  function removeFromQueue(di: number) {
    const curTrackId = entry?.track.id ?? null;
    setQueue((q) => q.filter((_, i) => i !== di));
    setPlatterDi((p) => (di === p ? -1 : di < p ? p - 1 : p));
    // re-sincroniza a posição pela faixa atual
    setTimeout(() => {
      setPos((p) => {
        const pl: Entry[] = [];
        queue.filter((_, i) => i !== di).forEach((rec, ndi) => {
          const ts = rec.tracks ?? [];
          [...ts.filter((t) => t.side === "A"), ...ts.filter((t) => t.side === "B")].filter((t) => t.audio_url)
            .forEach((track) => pl.push({ di: ndi, side: track.side, track }));
        });
        const idx = pl.findIndex((e) => e.track.id === curTrackId);
        return idx >= 0 ? idx : pl.length ? 0 : -1;
      });
    }, 0);
  }

  /* ---------- eventos do <audio> ---------- */
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCurTime(a.currentTime);
    const onMeta = () => setDuration(a.duration || 0);
    const onEnded = () => next();
    const onPlayEv = () => setPlaying(true);
    const onPauseEv = () => { if (!fadeTimer.current) setPlaying(false); };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnded);
    a.addEventListener("play", onPlayEv);
    a.addEventListener("pause", onPauseEv);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("play", onPlayEv);
      a.removeEventListener("pause", onPauseEv);
    };
  }, [playAt, pos, playlist.length]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- MediaSession (controles no 2º plano / tela de bloqueio) ---------- */
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    if (disc && entry) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: entry.track.title,
        artist: disc.artist,
        album: `${disc.title} · Lado ${side}`,
        artwork: disc.cover_image_url ? [{ src: disc.cover_image_url, sizes: "512x512", type: "image/jpeg" }] : [],
      });
      navigator.mediaSession.playbackState = playing ? "playing" : "paused";
    }
    try {
      navigator.mediaSession.setActionHandler("play", () => togglePlay());
      navigator.mediaSession.setActionHandler("pause", () => togglePlay());
      navigator.mediaSession.setActionHandler("previoustrack", () => prev());
      navigator.mediaSession.setActionHandler("nexttrack", () => next());
    } catch { /* nem todo navegador suporta todas as ações */ }
  }, [disc, entry, side, playing]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- arrastar da estante ----------
     Os listeners são anexados na JANELA de forma SÍNCRONA no pointerdown (sem o
     gap de um useEffect, que perdia os primeiros movimentos). E NÃO usamos
     setPointerCapture: no desktop ele disparava um `pointerleave` na estante ->
     setOpenId(null) -> o disco voltava pra dentro da capa assim que era pego
     ("travava e não saía do lugar"). O disco tem `touch-none` quando aberto, o
     que já mantém os eventos chegando no toque. */
  const dragRecRef = useRef<RecordItem | null>(null);
  const dragCleanupRef = useRef<(() => void) | null>(null);

  // se o componente desmontar no meio de um arraste, remove os listeners
  useEffect(() => () => { dragCleanupRef.current?.(); }, []);

  function startDrag(rec: RecordItem, e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragRecRef.current = rec;
    dragPosRef.current = { x: e.clientX, y: e.clientY };
    setDrag({ rec });

    const inDrop = (ev: PointerEvent) => {
      const dz = dropRef.current?.getBoundingClientRect();
      return !!dz && ev.clientX >= dz.left && ev.clientX <= dz.right && ev.clientY >= dz.top && ev.clientY <= dz.bottom;
    };
    let over = false;
    const move = (ev: PointerEvent) => {
      ev.preventDefault();
      dragPosRef.current = { x: ev.clientX, y: ev.clientY };
      const g = ghostRef.current;
      if (g) { g.style.left = `${ev.clientX}px`; g.style.top = `${ev.clientY}px`; }
      // só re-renderiza ao CRUZAR a borda do prato (não a cada pixel)
      const now = inDrop(ev);
      if (now !== over) { over = now; setOverDrop(now); }
    };
    const cleanup = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      document.body.style.userSelect = "";
      dragCleanupRef.current = null;
    };
    const end = (ev: PointerEvent, cancelled: boolean) => {
      cleanup();
      const r = dragRecRef.current;
      if (!cancelled && r && inDrop(ev)) place(r);
      dragRecRef.current = null;
      setDrag(null); setOverDrop(false); setOpenId(null);
    };
    const up = (ev: PointerEvent) => end(ev, false);
    // pointercancel: se o navegador assume o gesto (scroll/sistema), só vem cancel
    const cancel = (ev: PointerEvent) => end(ev, true);

    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    document.body.style.userSelect = "none";
    dragCleanupRef.current = cleanup;
  }

  return (
    <div>
      {/* ================= DECK ================= */}
      {/* sticky no desktop: o prato fica sempre visível enquanto se arrasta um
          disco da estante (que fica mais abaixo) até ele. */}
      <div className="mx-auto max-w-3xl md:sticky md:top-3 md:z-30">
        <div
          className="jb-cabinet relative overflow-hidden border border-black/70 px-6 pb-6 pt-6 md:px-10 md:pb-8"
          style={{
            borderRadius: "78px 78px 26px 26px",
            background:
              "radial-gradient(140% 80% at 50% -10%, #5a3f24 0%, #3a2818 34%, #241811 60%, #130d08 100%)",
            boxShadow:
              "0 70px 120px -55px rgba(0,0,0,0.95), inset 0 2px 0 rgba(255,220,170,0.12), inset 0 0 60px rgba(0,0,0,0.55)",
          }}
        >
          {/* moldura cromada dourada */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ borderRadius: "78px 78px 26px 26px", boxShadow: "inset 0 0 0 2px rgba(226,192,128,0.45), inset 0 0 0 6px rgba(0,0,0,0.55), inset 0 0 0 7px rgba(226,192,128,0.15)" }}
          />
          {/* veios de madeira sutis */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.10]" style={{ background: "repeating-linear-gradient(97deg, rgba(0,0,0,0.6) 0 2px, transparent 2px 11px)" }} />
          {/* brilho quente da coroa */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32" style={{ background: "radial-gradient(120% 100% at 50% -8%, rgba(255,184,96,0.30), rgba(38,192,212,0.08) 46%, transparent 74%)" }} />

          {/* tubos de neon (bubbler) laterais — clássico de jukebox */}
          <div className="jb-tube jb-tube-l" aria-hidden />
          <div className="jb-tube jb-tube-r" aria-hidden />

          {/* coroa / cabeçalho iluminado */}
          <div className="relative z-10 mb-6 flex flex-col items-center">
            <span
              className="font-display text-lg leading-none tracking-[0.5em] sm:text-xl"
              style={{
                background: "linear-gradient(180deg,#ffe6b8 0%,#ff9d2e 55%,#c56f17 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                filter: "drop-shadow(0 1px 8px rgba(255,157,46,0.5))",
              }}
            >
              NEBLINA
            </span>
            <span className="mt-1 text-[10px] font-semibold tracking-[0.44em] text-mist/70">JUKEBOX</span>
            <span className="mt-3 h-px w-44 max-w-[70%]" style={{ background: "linear-gradient(90deg, transparent, rgba(255,157,46,0.55), rgba(38,192,212,0.4), transparent)" }} />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {/* prato */}
            <div className="relative w-full max-w-[250px]">
              <div
                ref={dropRef}
                className={cn("relative aspect-square w-full rounded-full transition-all", overDrop && "ring-4 ring-brand/70")}
                style={{
                  background: "radial-gradient(circle at 50% 42%, #37373c 0%, #202024 46%, #0c0c0e 100%)",
                  boxShadow: "inset 0 0 50px rgba(0,0,0,0.85), 0 20px 40px -18px rgba(0,0,0,0.9)",
                }}
              >
                <div className="absolute inset-[3%] rounded-full" style={{ background: "repeating-radial-gradient(circle at center, #17171a 0 2px, #131315 2px 4px)", boxShadow: "0 0 0 3px #45454b, inset 0 0 30px rgba(0,0,0,0.8)" }} />
                <div className="absolute left-1/2 top-1/2 z-20 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d6d9dd] shadow" />

                {disc ? (
                  <div className="absolute inset-[10%] z-10" style={{ perspective: "1400px" }}>
                    <div className={cn("relative h-full w-full", (playing || crackling) && "ata-spin")}>
                      <div
                        className="relative h-full w-full transition-transform duration-[2100ms]"
                        style={{ transformStyle: "preserve-3d", transform: side === "B" ? "rotateY(180deg)" : "rotateY(0deg)", transitionTimingFunction: "cubic-bezier(0.45,0,0.15,1)" }}
                      >
                        <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
                          <PlatterFace tracks={sideA} coverUrl={disc.cover_image_url} cfg={cfg} side="A" hoverId={hoverId} playingId={playingId} onHover={setHoverId} onPlay={selectTrack} grooveDisabled={armDrag} />
                        </div>
                        <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                          <PlatterFace tracks={sideB} coverUrl={disc.cover_image_url_b ?? disc.cover_image_url} cfg={cfg} side="B" hoverId={hoverId} playingId={playingId} onHover={setHoverId} onPlay={selectTrack} grooveDisabled={armDrag} />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 text-center text-faint">
                    <ArrowDownToLine size={26} className={cn(overDrop && "text-brand")} />
                    <p className="px-8 text-xs">{overDrop ? "Solte o disco aqui" : coarse ? "Toque num disco na estante" : "Arraste um disco até o prato"}</p>
                  </div>
                )}
              </div>

              {/* braço / agulha — arraste até o sulco pra tocar */}
              <svg ref={armSvgRef} viewBox="0 0 200 200" className="pointer-events-none absolute -right-3 -top-3 z-30 h-[60%] w-[60%] touch-none drop-shadow-xl">
                <defs>
                  <linearGradient id="ata-arm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#eef1f4" /><stop offset="1" stopColor="#59636e" /></linearGradient>
                </defs>
                <g
                  style={{
                    transformOrigin: "176px 24px",
                    transform: `rotate(${armDrag && armAngle != null ? armAngle : (restAngle ?? 3)}deg)`,
                    transition: armDrag ? "none" : "transform 0.9s cubic-bezier(0.5,0,0.2,1)",
                    pointerEvents: disc ? "auto" : "none",
                    cursor: armDrag ? "grabbing" : "grab",
                    touchAction: "none",
                  }}
                  onPointerDown={(e) => {
                    if (!disc) return;
                    e.preventDefault();
                    (e.target as Element).setPointerCapture?.(e.pointerId);
                    setArmDrag(true);
                  }}
                >
                  {/* área de pega bem larga (transparente) — fácil de agarrar no touch/mouse */}
                  <line x1="176" y1="24" x2="66" y2="142" stroke="transparent" strokeWidth="86" strokeLinecap="round" />
                  <circle cx="76" cy="132" r="56" fill="transparent" />
                  <circle cx="176" cy="24" r="14" fill="#2a2118" stroke="#3a444e" strokeWidth="2" />
                  <circle cx="176" cy="24" r="6" fill="#ff9d2e" />
                  <line x1="176" y1="24" x2="78" y2="128" stroke="url(#ata-arm)" strokeWidth="8" strokeLinecap="round" />
                  <g transform="rotate(45 74 130)"><rect x="56" y="118" width="34" height="20" rx="4" fill="url(#ata-arm)" stroke="#3a444e" /></g>
                  <circle cx="76" cy="132" r="4.5" fill="#ff9d2e" />
                </g>
              </svg>
              {armDrag && (
                <span className="pointer-events-none absolute -bottom-1 left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/75 px-2 py-0.5 text-[10px] text-brand">
                  {hoverId ? "solte pra tocar" : "leve até um sulco"}
                </span>
              )}
            </div>

            {/* player + faixas */}
            <div className="w-full flex-1">
              <div className="mb-1 flex min-h-[1.5rem] items-center gap-2 text-sm">
                {crackling ? (
                  <span className="flex items-center gap-2 text-mist"><span className="h-2 w-2 animate-ping rounded-full bg-brand" /> a agulha desceu…</span>
                ) : (
                  <span className={cn("truncate", hoverId ? "text-ink" : "text-faint")}>{caption}</span>
                )}
              </div>

              {disc ? (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-display text-lg leading-tight text-ink">{entry?.track.title}</p>
                      <Link href={`/disco/${disc.id}`} className="text-sm text-muted hover:text-brand">{disc.title} — {disc.artist}</Link>
                    </div>
                    <button
                      onClick={clearPlatter}
                      className="flex shrink-0 items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted transition hover:border-red-400/50 hover:text-red-400"
                      title="Tirar o disco do prato"
                    >
                      <X size={13} /> Tirar do prato
                    </button>
                  </div>

                  {/* barra de tempo */}
                  <div className="mt-3">
                    <div
                      className="relative h-1.5 w-full cursor-pointer rounded-full bg-panel-2"
                      onClick={(e) => {
                        const a = audioRef.current; if (!a || !duration) return;
                        const r = e.currentTarget.getBoundingClientRect();
                        a.currentTime = ((e.clientX - r.left) / r.width) * duration;
                      }}
                    >
                      <div className="absolute h-full rounded-full bg-brand" style={{ width: `${duration ? (curTime / duration) * 100 : 0}%` }} />
                    </div>
                    <div className="mt-1 flex justify-between text-[11px] text-faint"><span>{fmt(curTime)}</span><span>{fmt(duration)}</span></div>
                  </div>

                  {/* transport */}
                  <div className="mt-2 flex items-center gap-2">
                    <button onClick={prev} className="rounded-lg p-2 text-muted hover:text-ink" aria-label="Anterior"><SkipBack size={18} /></button>
                    <button onClick={togglePlay} className="btn-brand flex h-11 w-11 items-center justify-center rounded-full" aria-label={playing ? "Pausar" : "Tocar"}>
                      {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                    </button>
                    <button onClick={next} className="rounded-lg p-2 text-muted hover:text-ink" aria-label="Próxima"><SkipForward size={18} /></button>
                    <div className="ml-auto flex gap-1.5">
                      {(["A", "B"] as const).map((s) => (
                        <button key={s} onClick={() => flipTo(s)}
                          className={cn("rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors", side === s ? "border-brand bg-brand/15 text-brand" : "border-line text-muted hover:text-ink")}>
                          Lado {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* faixas do lado atual */}
                  <ul className="mt-3 max-h-36 space-y-0.5 overflow-y-auto pr-1">
                    {(side === "A" ? sideA : sideB).map((t, i) => (
                      <li key={t.id}>
                        <button onClick={() => selectTrack(t)} onMouseEnter={() => setHoverId(t.id)} onMouseLeave={() => setHoverId(null)}
                          disabled={!t.audio_url}
                          className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-left text-sm transition-colors",
                            playingId === t.id ? "bg-brand/15 text-brand" : "text-muted hover:bg-panel", !t.audio_url && "opacity-50")}>
                          <span className="w-5 text-center text-xs text-faint">{i + 1}</span>
                          {playingId === t.id && playing ? <Pause size={14} /> : <Play size={14} />}
                          <span className="flex-1 truncate">{t.title}</span>
                          {!t.audio_url && <span className="text-[10px] text-faint">sem áudio</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-sm text-faint">
                  {coarse ? "Toque num disco na estante para o vinil sair da capa e leve-o até o prato." : "Escolha um disco na estante, deixe o vinil sair da capa e arraste até o prato."}
                </p>
              )}
            </div>
          </div>

          {/* ---- controles de som (premium) ---- */}
          <div className="relative z-10 mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SoundControl label="Volume" icon={<Volume2 size={14} />} value={volume} min={0} max={1} step={0.01} onChange={setVolume} display={`${Math.round(volume * 100)}%`} />
            <SoundControl label="Graves" value={bass} min={-12} max={12} step={1} onChange={setBass} display={`${bass > 0 ? "+" : ""}${bass} dB`} />
            <SoundControl label="Agudos" value={treble} min={-12} max={12} step={1} onChange={setTreble} display={`${treble > 0 ? "+" : ""}${treble} dB`} />
            <button type="button" onClick={() => setFade((f) => !f)}
              className="group flex flex-col justify-between rounded-2xl border border-line/70 bg-black/25 p-3 text-left transition-colors hover:border-brand/40">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted"><Waves size={13} /> Fade</span>
              <span className="mt-2 flex items-center gap-2">
                <span className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", fade ? "bg-brand" : "bg-panel-2")}>
                  <span className={cn("h-4 w-4 rounded-full bg-white shadow transition-transform", fade ? "translate-x-4" : "translate-x-0.5")} />
                </span>
                <span className={cn("text-sm font-semibold", fade ? "text-brand" : "text-faint")}>{fade ? "Ligado" : "Desligado"}</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= FILA ================= */}
      {queue.length > 0 && (
        <div className="mx-auto mt-6 max-w-3xl">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted"><ListMusic size={16} className="text-brand" /> Fila de reprodução</div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {queue.map((r, di) => (
              <div key={`${r.id}-${di}`} className={cn("group relative shrink-0", entry?.di === di && "")}>
                <button onClick={() => { const i = playlist.findIndex((e) => e.di === di); if (i >= 0) playAt(i); }}
                  className={cn("block h-16 w-16 overflow-hidden rounded-md border transition", entry?.di === di ? "border-brand ring-2 ring-brand/50" : "border-line opacity-80 hover:opacity-100")}>
                  {r.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.cover_image_url} alt="" className="h-full w-full object-cover" />
                  ) : <div className="flex h-full w-full items-center justify-center bg-panel text-faint"><Disc3 size={18} /></div>}
                </button>
                <span className="absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-[9px] font-bold text-brand">{di + 1}</span>
                <button onClick={() => removeFromQueue(di)} className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/80 text-faint opacity-0 transition group-hover:opacity-100 hover:text-red-400" aria-label="Remover da fila"><X size={11} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= BOXES ================= */}
      {boxes.length > 0 && (
        <div className="mt-12">
          <div className="mb-4 flex items-center gap-2 text-sm text-muted">
            <ListMusic size={16} className="text-brand" /> Ouça um box inteiro — todos os discos entram na fila de uma vez.
          </div>
          <div className="flex gap-5 overflow-x-auto px-2 pb-4 pt-1" style={{ scrollbarWidth: "thin" }}>
            {boxes.map((b) => {
              const locked = b.audioteca_tier === "signature" || (b.audioteca_tier === "members" && !isLoggedIn);
              return (
                <div key={b.id} className="relative w-40 shrink-0">
                  <div className={cn("w-40", locked && "opacity-70 grayscale")}>
                    {locked ? (
                      <BoxArt config={b.box_config} coverUrl={b.cover_image_url} spineUrl={b.spine_image_url} title={b.title} count={b.records.length} interactive={false} />
                    ) : (
                      <BoxHoverFan
                        config={b.box_config}
                        coverUrl={b.cover_image_url}
                        spineUrl={b.spine_image_url}
                        title={b.title}
                        discs={b.records.map((r) => ({ id: r.id, cover_image_url: r.cover_image_url, disc_config: r.disc_config }))}
                      />
                    )}
                  </div>
                  <p className="mt-1 line-clamp-1 text-[12px] font-medium text-ink">{b.title}</p>
                  <p className="text-[11px] text-faint">{b.records.length} {b.records.length === 1 ? "disco" : "discos"}</p>
                  {locked ? (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold text-white">
                      <Lock size={11} /> {b.audioteca_tier === "signature" ? "Neblina Signature" : "Entre para ouvir"}
                    </span>
                  ) : (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <button onClick={() => placeBox(b.records)} className="flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[11px] font-bold text-black transition hover:brightness-95">
                        <Plus size={12} /> Ouvir o box
                      </button>
                      <Link href={`/box/${b.id}`} className="flex items-center gap-1 rounded-full border border-line px-2 py-1 text-[11px] text-muted hover:text-brand">
                        <Eye size={11} /> Ver
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= ESTANTE ================= */}
      <div className="mt-12">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted">
          <Hand size={16} className="text-brand" />
          {coarse ? "Clique para o disco sair da capa. Arraste o disco até o prato." : "Passe o mouse para o disco sair da capa. Segure e leve até o prato."}
        </div>
        <Shelf records={records} coarse={coarse} openId={openId} setOpenId={setOpenId} onGrab={startDrag} onQueue={place} canAccess={canAccess} queuedIds={queue.map((q) => q.id)} />
      </div>

      {/* disco fantasma sendo arrastado */}
      {drag && (
        <div
          ref={(el) => { ghostRef.current = el; if (el) { el.style.left = `${dragPosRef.current.x}px`; el.style.top = `${dragPosRef.current.y}px`; } }}
          className="pointer-events-none fixed z-[200] h-32 w-32 -translate-x-1/2 -translate-y-1/2"
        >
          <div className="drop-shadow-2xl"><Vinyl config={drag.rec.disc_config} coverUrl={drag.rec.cover_image_url} interactive={false} noNeedle title="" /></div>
        </div>
      )}

      {/* áudio (segundo plano) + xiado */}
      <audio ref={audioRef} preload="none" crossOrigin="anonymous" />
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={crackleRef} src="/needle.mp3" preload="auto" />

      <style jsx>{`
        .ata-spin { animation: ata-rot 3.2s linear infinite; }
        @keyframes ata-rot { to { transform: rotate(360deg); } }

        /* tubos de neon (bubbler) laterais */
        .jb-tube {
          position: absolute;
          top: 88px;
          bottom: 96px;
          width: 8px;
          border-radius: 999px;
          background: linear-gradient(180deg,
            rgba(255,206,140,0.95) 0%,
            rgba(255,140,70,0.65) 34%,
            rgba(120,205,225,0.6) 70%,
            rgba(150,225,240,0.92) 100%);
          box-shadow:
            0 0 10px rgba(255,168,86,0.55),
            0 0 22px rgba(80,200,230,0.35),
            inset 0 0 6px rgba(255,255,255,0.75);
          opacity: 0.9;
        }
        .jb-tube-l { left: 16px; }
        .jb-tube-r { right: 16px; }
        .jb-tube::after {
          content: "";
          position: absolute;
          left: -3px;
          right: -3px;
          height: 22px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(255,255,255,0.95), transparent 68%);
          animation: jb-bubble 5.5s ease-in-out infinite;
        }
        .jb-tube-r::after { animation-delay: 2.6s; }
        @keyframes jb-bubble {
          0% { top: 86%; opacity: 0; }
          12% { opacity: 0.9; }
          88% { opacity: 0.9; }
          100% { top: -4%; opacity: 0; }
        }
        @media (min-width: 640px) { .jb-tube { width: 10px; } .jb-tube-l { left: 22px; } .jb-tube-r { right: 22px; } }
        @media (max-width: 520px) { .jb-tube { display: none; } }
        @media (prefers-reduced-motion: reduce) {
          .ata-spin { animation: none; }
          .jb-tube::after { animation: none; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ---------- controle de som (card premium) ---------- */
function SoundControl({ label, icon, value, min, max, step, onChange, display }: {
  label: string; icon?: React.ReactNode; value: number; min: number; max: number; step: number; onChange: (v: number) => void; display: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-line/70 bg-black/25 p-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">{icon} {label}</span>
        <span className="text-xs font-semibold text-brand">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full accent-brand" />
    </div>
  );
}

/* ============================================================
   Estante — hover/toque: o disco sai da capa; arrasta pela ponta
   ============================================================ */
function Shelf({
  records, coarse, openId, setOpenId, onGrab, onQueue, canAccess, queuedIds,
}: {
  records: RecordItem[]; coarse: boolean; openId: string | null;
  setOpenId: (id: string | null) => void; onGrab: (r: RecordItem, e: React.PointerEvent) => void;
  onQueue: (r: RecordItem) => void; canAccess: (r: RecordItem) => boolean; queuedIds: string[];
}) {
  if (records.length === 0) {
    return <p className="rounded-2xl border border-dashed border-line py-14 text-center text-muted">Nenhum disco no acervo ainda.</p>;
  }
  const tierOrder: Record<string, number> = { public: 0, members: 1, signature: 2 };
  const ordered = [...records].sort((a, b) => (tierOrder[a.audioteca_tier] ?? 3) - (tierOrder[b.audioteca_tier] ?? 3));

  return (
    <div className="relative">
      <div className="flex items-end gap-4 overflow-x-auto px-2 pb-6 pt-4" style={{ scrollbarWidth: "thin" }}>
        {ordered.map((r) => {
          const locked = !canAccess(r);
          const open = openId === r.id && !locked;
          const queuedN = queuedIds.filter((id) => id === r.id).length;
          const lockReason = r.audioteca_tier === "signature" ? "Neblina Signature" : "Entre para ouvir";
          return (
            <div
              key={r.id}
              className="relative shrink-0"
              onPointerEnter={() => { if (!coarse && !locked) setOpenId(r.id); }}
              onPointerLeave={() => { if (!coarse) setOpenId(null); }}
            >
              <div className={cn("relative h-40 w-56 transition", locked && "opacity-70 grayscale")}>
                {/* disco atrás — sai da capa; a ponta (à direita) é a alça de arraste */}
                <div
                  className={cn(
                    "absolute left-0 top-0 h-40 w-40 transition-transform duration-500 ease-out",
                    // touch-none só quando o disco está pra fora (arrastável): sem isso, no
                    // mobile a estante (overflow-x auto) rouba o gesto pra rolar, dispara
                    // pointercancel e o arraste morre no meio. Fechado, deixa rolar normal.
                    open && !locked ? "cursor-grab touch-none active:cursor-grabbing" : "",
                  )}
                  style={{ transform: open ? "translateX(46%) rotate(5deg)" : "translateX(4%)" }}
                  onPointerDown={(e) => { if (open && !locked) onGrab(r, e); }}
                >
                  <Vinyl config={r.disc_config} coverUrl={r.cover_image_url} interactive={false} noNeedle title="" />
                </div>
                {/* capa (sleeve) na frente */}
                <button
                  type="button"
                  onClick={() => { if (coarse && !locked) setOpenId(open ? null : r.id); }}
                  className="absolute left-0 top-0 h-40 w-40 overflow-hidden rounded-md border border-black/50 shadow-xl"
                >
                  {r.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.cover_image_url} alt="" className="h-full w-full object-cover" draggable={false} />
                  ) : <div className="flex h-full w-full items-center justify-center bg-panel text-faint"><Disc3 size={30} /></div>}
                  <div className="absolute inset-y-0 right-0 w-2 bg-gradient-to-l from-black/50 to-transparent" />
                  {locked && <div className="absolute inset-0 bg-black/45" />}
                  {r.is_gatefold && !locked && (
                    <span className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded bg-black/70 px-1 py-0.5 text-[8px] font-bold tracking-wide text-brand">
                      <BookOpen size={9} /> GATEFOLD
                    </span>
                  )}
                </button>

                {locked ? (
                  <div className="pointer-events-none absolute left-0 top-0 z-20 flex h-40 w-40 flex-col items-center justify-center gap-1 px-1 text-center">
                    <Lock size={20} className="text-white/90" />
                    <span className="rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">{lockReason}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); onQueue(r); }}
                    aria-label="Adicionar à fila"
                    title="Adicionar à fila"
                    className="absolute left-1 top-1 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-brand text-black shadow-lg transition-transform hover:scale-110"
                  >
                    <Plus size={15} />
                  </button>
                )}
                {/* Ver disco -> subpágina */}
                <Link
                  href={`/disco/${r.id}`}
                  onPointerDown={(e) => e.stopPropagation()}
                  title="Ver página do disco"
                  className="absolute left-1 top-9 z-20 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-semibold text-white shadow-lg transition-colors hover:bg-black/85 hover:text-brand"
                >
                  <Eye size={12} /> Ver disco
                </Link>
                {queuedN > 0 && <span className="absolute -right-1 -top-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-black">{queuedN}</span>}
              </div>
              <span className="mt-1 line-clamp-1 w-40 text-[11px] text-muted">{r.title}</span>
            </div>
          );
        })}
      </div>
      <div className="h-3 rounded-b-xl" style={{ background: "linear-gradient(180deg, #3a2a1c, #1c140d)", boxShadow: "0 10px 22px -8px rgba(0,0,0,0.85)" }} />
    </div>
  );
}
