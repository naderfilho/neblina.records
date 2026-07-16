"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import TagBadge from "@/components/TagBadge";
import { claimAudio, releaseAudio } from "@/lib/audio-bus";
import type { Tag } from "@/lib/types";

export type HomeSong = {
  recordId: string;
  recordTitle: string;
  artist: string;
  trackTitle: string;
  audioUrl: string;
  audioStart: number;
  audioEnd: number | null;
  tag: Tag | null;
};

export default function HomeMiniPlayer({ song }: { song: HomeSong }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onPause = () => setPlaying(false);
    const onPlay = () => setPlaying(true);
    const onTime = () => {
      if (song.audioEnd && a.currentTime >= song.audioEnd) a.currentTime = song.audioStart;
    };
    a.addEventListener("pause", onPause);
    a.addEventListener("play", onPlay);
    a.addEventListener("timeupdate", onTime);
    return () => {
      a.removeEventListener("pause", onPause);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("timeupdate", onTime);
    };
  }, [song.audioEnd, song.audioStart]);

  // a música "entra" quando o disco da intro chega na home (best-effort: o
  // autoplay com som pode ser bloqueado se a intro terminar sem um clique).
  useEffect(() => {
    const onArrived = () => {
      const a = audioRef.current;
      if (!a) return;
      claimAudio(a);
      if (a.currentTime < song.audioStart) a.currentTime = song.audioStart;
      a.play().catch(() => {});
    };
    window.addEventListener("neblina:disc-arrived", onArrived);
    return () => window.removeEventListener("neblina:disc-arrived", onArrived);
  }, [song.audioStart]);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      return;
    }
    claimAudio(a);
    if (a.currentTime < song.audioStart) a.currentTime = song.audioStart;
    a.play().catch(() => {});
  }

  return (
    <>
      {/* info + etiqueta: em cima do disco (centralizado) */}
      <div className="pointer-events-none absolute left-1/2 top-[11%] z-20 flex -translate-x-1/2 flex-col items-center gap-1.5">
        {song.tag && <TagBadge tag={song.tag} size="sm" />}
        <div translate="no" className="notranslate pointer-events-auto max-w-[220px] rounded-xl bg-black/50 px-3 py-1.5 text-center backdrop-blur-sm">
          <p className="truncate text-[13px] font-semibold leading-tight text-ink">{song.trackTitle}</p>
          <Link href={`/disco/${song.recordId}`} className="block truncate text-[11px] leading-tight text-mist transition-colors hover:text-brand">
            {song.recordTitle} — {song.artist}
          </Link>
        </div>
      </div>

      {/* play/pause: dentro do disco, centralizado sobre a logo — transparente */}
      <button
        onClick={toggle}
        aria-label={playing ? "Pausar" : "Tocar"}
        className="group absolute left-1/2 top-1/2 z-30 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/20 text-white/90 shadow-[0_2px_10px_rgba(0,0,0,0.5)] backdrop-blur-[1px] transition hover:scale-105 hover:border-white/40 hover:bg-black/35"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {playing ? (
          <Pause size={20} className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]" />
        ) : (
          <Play size={20} className="ml-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]" />
        )}
      </button>

      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        src={song.audioUrl}
        preload="none"
        loop
        crossOrigin="anonymous"
        onEnded={() => { const a = audioRef.current; if (!a) return; if (song.audioStart) a.currentTime = song.audioStart; }}
      />
    </>
  );
}
