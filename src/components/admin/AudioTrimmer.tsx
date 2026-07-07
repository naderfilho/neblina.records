"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Scissors } from "lucide-react";

function fmt(s: number) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function AudioTrimmer({
  url,
  start,
  end,
  onChange,
}: {
  url: string;
  start: number;
  end: number | null;
  onChange: (v: { start: number; end: number | null }) => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);

  const effEnd = end ?? duration;

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onMeta = () => setDuration(a.duration || 0);
    const onTime = () => {
      setCurrent(a.currentTime);
      if (effEnd && a.currentTime >= effEnd) {
        a.pause();
        setPlaying(false);
      }
    };
    const onEnded = () => setPlaying(false);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnded);
    return () => {
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnded);
    };
  }, [effEnd]);

  function playSnippet() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.currentTime = start;
      a.play();
      setPlaying(true);
    }
  }

  const pct = (v: number) => (duration ? (v / duration) * 100 : 0);

  return (
    <div className="rounded-2xl border border-line bg-bg-soft p-4">
      <audio ref={audioRef} src={url} preload="metadata" />

      <div className="mb-3 flex items-center gap-3">
        <button
          type="button"
          onClick={playSnippet}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-black"
        >
          {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </button>
        <div className="flex-1">
          <p className="text-sm text-ink">Ouvir prévia do trecho</p>
          <p className="text-xs text-faint">
            {fmt(start)} → {fmt(effEnd)} ({fmt(Math.max(0, effEnd - start))})
          </p>
        </div>
      </div>

      {/* timeline visual */}
      <div className="relative mb-4 h-2 w-full rounded-full bg-panel-2">
        <div
          className="absolute h-full rounded-full bg-brand/40"
          style={{ left: `${pct(start)}%`, width: `${Math.max(0, pct(effEnd) - pct(start))}%` }}
        />
        <div className="absolute top-1/2 h-3.5 w-1 -translate-y-1/2 rounded bg-teal" style={{ left: `${pct(current)}%` }} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="mb-1 flex items-center justify-between text-xs text-muted">
            <span>Início</span>
            <span className="text-brand">{fmt(start)}</span>
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={start}
            onChange={(e) => {
              const v = Math.min(parseFloat(e.target.value), effEnd - 1);
              onChange({ start: Math.max(0, v), end });
            }}
            className="w-full accent-brand"
          />
        </label>
        <label className="block">
          <span className="mb-1 flex items-center justify-between text-xs text-muted">
            <span>Fim</span>
            <span className="text-brand">{fmt(effEnd)}</span>
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={effEnd}
            onChange={(e) => {
              const v = Math.max(parseFloat(e.target.value), start + 1);
              onChange({ start, end: Math.min(duration, v) });
            }}
            className="w-full accent-brand"
          />
        </label>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-faint">
        <Scissors size={12} /> Ajuste o trecho que tocará quando passarem o mouse no disco.
      </p>
    </div>
  );
}
