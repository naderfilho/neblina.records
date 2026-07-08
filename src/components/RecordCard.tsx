"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Check } from "lucide-react";
import Vinyl from "@/components/Vinyl";
import TagBadge from "@/components/TagBadge";
import { useCart } from "@/lib/cart";
import { QUALITY_META } from "@/lib/constants";
import { formatBRL } from "@/lib/utils";
import type { RecordItem, Tag } from "@/lib/types";

export default function RecordCard({ record, tags = [] }: { record: RecordItem; tags?: Tag[] }) {
  const router = useRouter();
  const cart = useCart();
  const inCart = cart.has(record.id);
  const quality = record.disc_quality ? QUALITY_META[record.disc_quality] : null;

  return (
    <div className="group flex flex-col items-center">
      <div className="relative w-full transition-transform duration-300 group-hover:-translate-y-1">
        <Vinyl
          coverUrl={record.cover_image_url}
          config={record.disc_config}
          audioUrl={record.audio_url}
          audioStart={record.audio_start}
          audioEnd={record.audio_end}
          title={`${record.title} — ${record.artist}`}
          onOpen={() => router.push(`/disco/${record.id}`)}
        />

        {/* botão adicionar */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (inCart) {
              cart.setOpen(true);
            } else {
              cart.add({
                id: record.id,
                title: record.title,
                artist: record.artist,
                price: record.price,
                coverUrl: record.cover_image_url,
              });
            }
          }}
          className={`absolute right-1 top-1 z-10 flex h-9 w-9 items-center justify-center rounded-full border shadow-lg transition-all ${
            inCart
              ? "border-teal/60 bg-teal text-black"
              : "border-line bg-panel/90 text-brand opacity-0 group-hover:opacity-100 hover:bg-brand hover:text-black"
          }`}
          aria-label={inCart ? "No carrinho" : "Adicionar ao carrinho"}
        >
          {inCart ? <Check size={16} /> : <Plus size={18} />}
        </button>

        {/* etiquetas */}
        {tags.length > 0 && (
          <div className="pointer-events-none absolute left-1 top-1 z-10 flex flex-col items-start gap-1">
            {tags.slice(0, 2).map((t) => (
              <TagBadge key={t.id} tag={t} size="sm" />
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 w-full px-1 text-center">
        <Link
          href={`/disco/${record.id}`}
          className="line-clamp-1 font-display text-[15px] leading-tight text-ink transition-colors hover:text-brand"
        >
          {record.title}
        </Link>
        <p className="line-clamp-1 text-xs text-muted">{record.artist}</p>
        <div className="mt-1.5 flex items-center justify-center gap-2">
          <span className="font-semibold text-brand">{formatBRL(record.price)}</span>
          {quality && (
            <span
              className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: `${quality.color}22`, color: quality.color }}
            >
              {quality.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
