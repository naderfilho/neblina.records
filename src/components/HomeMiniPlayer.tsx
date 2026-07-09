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
    a.addEventListener("pause", onPause);
    a.addEventListener("play", onPlay);
    return () => {
      a.removeEventListener("pause", onPause);
      a.removeEventListener("play", onPlay);
    };
  }, []);

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
    <div className="mb-5 flex flex-col items-center gap-2">
      {song.tag && <TagBadge tag={song.tag} size="md" />}

      <div className="max-w-[260px] text-center">
        <p className="truncate text-sm font-semibold text-ink">{song.trackTitle}</p>
        <Link href={`/disco/${song.recordId}`} className="block truncate text-xs text-muted transition-colors hover:text-brand">
          {song.recordTitle} — {song.artist}
        </Link>
      </div>

      <button
        onClick={toggle}
        aria-label={playing ? "Pausar" : "Tocar"}
        className="btn-brand flex h-12 w-12 items-center justify-center rounded-full"
      >
        {playing ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
      </button>

      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        src={song.audioUrl}
        preload="none"
        loop
        crossOrigin="anonymous"
        onEnded={() => { const a = audioRef.current; if (a) releaseAudio(a); }}
      />
    </div>
  );
}
