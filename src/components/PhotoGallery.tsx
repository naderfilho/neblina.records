"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { RecordPhoto } from "@/lib/types";

export default function PhotoGallery({ photos }: { photos: RecordPhoto[] }) {
  const [active, setActive] = useState<string | null>(null);
  if (photos.length === 0) return null;

  return (
    <div>
      <h2 className="mb-4 font-display text-2xl text-ink">Fotos reais do disco</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((p) => (
          <button
            key={p.id}
            onClick={() => setActive(p.url)}
            className="group relative aspect-square overflow-hidden rounded-xl border border-line bg-bg-soft"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.url}
              alt="Foto do disco"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {active && (
        <div
          onClick={() => setActive(null)}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-6"
        >
          <button className="absolute right-5 top-5 rounded-full bg-panel p-2 text-ink" aria-label="Fechar">
            <X size={22} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={active} alt="Foto do disco" className="max-h-full max-w-full rounded-xl object-contain" />
        </div>
      )}
    </div>
  );
}
