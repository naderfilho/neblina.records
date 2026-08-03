"use client";

import Link from "next/link";
import { Layers, ArrowRight } from "lucide-react";
import BoxHoverFan from "@/components/BoxHoverFan";
import { formatBRL } from "@/lib/utils";
import { AVAILABILITY } from "@/lib/constants";
import type { BoxSummary } from "@/lib/types";

export default function BoxCard({ box }: { box: BoxSummary }) {
  const available = (box.availability ?? "available") === "available";
  return (
    <div className="group flex flex-col items-center">
      <Link
        href={`/box/${box.id}`}
        className="relative block w-full transition-transform duration-300 group-hover:-translate-y-1"
        aria-label={`Abrir box ${box.title}`}
      >
        <BoxHoverFan
          config={box.box_config}
          coverUrl={box.cover_image_url}
          spineUrl={box.spine_image_url}
          title={box.title}
          discs={box.discs ?? []}
        />
        {/* nº de discos */}
        <span className="absolute right-1 top-1 z-40 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[11px] font-bold text-brand backdrop-blur">
          <Layers size={12} /> {box.disc_count} {box.disc_count === 1 ? "disco" : "discos"}
        </span>
        {box.box_type && (
          <span className="absolute left-1 top-1 z-40 rounded-full bg-brand/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
            {box.box_type}
          </span>
        )}
        {/* dica de abrir */}
        <span className="pointer-events-none absolute inset-x-0 -bottom-1 z-40 flex justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <span className="flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
            Abrir o box <ArrowRight size={12} />
          </span>
        </span>
      </Link>

      <div className="mt-3 w-full px-1 text-center">
        <Link
          href={`/box/${box.id}`}
          translate="no"
          className="notranslate line-clamp-1 font-display text-[15px] leading-tight text-ink transition-colors hover:text-brand"
        >
          {box.title}
        </Link>
        {box.subtitle && <p translate="no" className="notranslate line-clamp-1 text-xs text-muted">{box.subtitle}</p>}
        <div className="mt-1.5 flex items-center justify-center gap-2">
          {available ? (
            <span className="font-semibold text-brand">{formatBRL(box.price)}</span>
          ) : (
            <span className="rounded-full border border-line px-2 py-0.5 text-xs font-medium text-faint">
              {AVAILABILITY.find((a) => a.id === box.availability)?.label ?? "Indisponível"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
