"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import BoxArt from "@/components/BoxArt";
import Vinyl from "@/components/Vinyl";
import { fanPositions } from "@/lib/boxFan";
import { useCoarsePointer } from "@/lib/use-coarse-pointer";
import type { BoxConfig } from "@/lib/constants";
import type { DiscMini } from "@/lib/types";

/**
 * O box com os discos saindo em LEQUE no hover (estilo dock) — mesma animação da
 * abertura da página do box, em versão pequena. Usado nos cards da home e na
 * estante de boxes da Audioteca. Os discos são só visuais (pointer-events none),
 * então o card/link em volta continua clicável.
 */
export default function BoxHoverFan({
  config,
  coverUrl,
  spineUrl,
  title,
  discs,
}: {
  config?: Partial<BoxConfig> | null;
  coverUrl?: string | null;
  spineUrl?: string | null;
  title?: string;
  discs: DiscMini[];
}) {
  const reduce = useReducedMotion();
  const coarse = useCoarsePointer();
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const n = discs.length;
  const disc = Math.max(38, Math.min(120, w * 0.4));
  const fans = fanPositions(n, w, disc);
  const active = open && !reduce && n > 0;

  return (
    <div
      ref={ref}
      className="relative aspect-square w-full"
      style={{ zIndex: active ? 30 : undefined }}
      // desktop: abre no hover. Touch: o toque só ABRE/FECHA o leque (nunca
      // navega — a navegação fica no link do título, abaixo do card). Assim o
      // usuário vê os discos no mobile igual ao hover do desktop.
      onPointerEnter={() => { if (!coarse) setOpen(true); }}
      onPointerLeave={() => { if (!coarse) setOpen(false); }}
      onClick={(e) => {
        if (!coarse || reduce || n === 0) return;
        e.preventDefault();
        e.stopPropagation();
        setOpen((o) => !o);
      }}
    >
      {/* discos (só visuais) */}
      {w > 0 && !reduce &&
        discs.map((d, i) => (
          <motion.div
            key={d.id}
            className="pointer-events-none absolute left-1/2 top-1/2"
            style={{ width: disc, height: disc, marginLeft: -disc / 2, marginTop: -disc / 2, zIndex: 20 + i }}
            initial={false}
            animate={
              active
                ? { x: fans[i].x, y: fans[i].y, rotate: fans[i].rotate, scale: 1, opacity: 1 }
                : { x: 0, y: w * 0.05, rotate: 0, scale: 0.4, opacity: 0 }
            }
            transition={{ type: "spring", stiffness: 210, damping: 19, delay: active ? i * 0.05 : (n - 1 - i) * 0.02 }}
          >
            <Vinyl config={d.disc_config} coverUrl={d.cover_image_url} interactive={false} noNeedle title="" />
          </motion.div>
        ))}

      {/* a caixa */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 10 }}
        animate={{ scale: active ? 0.85 : 1, filter: active ? "brightness(0.82)" : "brightness(1)" }}
        transition={{ type: "spring", stiffness: 210, damping: 19 }}
      >
        <BoxArt config={config} coverUrl={coverUrl} spineUrl={spineUrl} title={title} count={n || 3} interactive={false} />
      </motion.div>
    </div>
  );
}
