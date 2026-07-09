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
        <div className="pointer-events-auto max-w-[220px] rounded-xl bg-black/50 px-3 py-1.5 text-center backdrop-blur-sm">
          <p className="truncate text-[13px] font-semibold leading-tight text-ink">{song.trackTitle}</p>
          <Link href={`/disco/${song.recordId}`} className="block truncate text-[11px] leading-tight text-mist transition-colors hover:text-brand">
            {song.recordTitle} — {song.artist}
          </Link>
        </div>
      </div>

      {/* play/pause: canto superior direito do disco */}
      <button
        onClick={toggle}
        aria-label={playing ? "Pausar" : "Tocar"}
        className="btn-brand absolute right-[3%] top-[3%] z-20 flex h-9 w-9 items-center justify-center rounded-full shadow-lg"
      >
        {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
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
