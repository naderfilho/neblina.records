"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, RotateCcw, Eye } from "lucide-react";
import BoxArt from "@/components/BoxArt";
import Vinyl from "@/components/Vinyl";
import { fanPositions } from "@/lib/boxFan";
import type { BoxItem, RecordItem } from "@/lib/types";

/**
 * Abertura cinematográfica do box: a caixa fechada (BoxArt) flutua com uma dica
 * de clique; ao clicar, a caixa recua e os discos SOBEM de dentro dela e se
 * abrem em leque (stagger + spring), cada um girando de leve. Cada disco leva à
 * sua página. Com prefers-reduced-motion, mostra a grade dos discos direto.
 */
export default function BoxOpener({ box, records }: { box: BoxItem; records: RecordItem[] }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const n = records.length;
  const disc = Math.max(110, Math.min(210, w * (n > 4 ? 0.2 : 0.26)));
  const fans = fanPositions(n, w, disc);
  const goToDisc = (id: string) => router.push(`/disco/${id}`);

  // fallback estático (reduced motion): grade simples
  if (reduce) {
    return (
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
        {records.map((r) => (
          <DiscInFan key={r.id} record={r} onOpen={() => goToDisc(r.id)} interactive />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={stageRef}
      className="relative mx-auto w-full max-w-4xl"
      style={{ height: Math.max(420, w * 0.62) }}
    >
      {/* brilho de fundo quando abre */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,157,46,0.22), rgba(38,192,212,0.08) 45%, transparent 72%)" }}
        animate={{ opacity: open ? 1 : 0, scale: open ? 1.1 : 0.7 }}
        transition={{ duration: 0.9 }}
      />

      {/* DISCOS — saem de dentro da caixa e se abrem em leque */}
      {w > 0 &&
        records.map((r, i) => {
          const f = fans[i];
          return (
            <motion.div
              key={r.id}
              className="absolute left-1/2 top-1/2"
              style={{ width: disc, height: disc, marginLeft: -disc / 2, marginTop: -disc / 2, zIndex: 10 + i }}
              initial={false}
              animate={
                open
                  ? { x: f.x, y: f.y, rotate: f.rotate, scale: 1, opacity: 1 }
                  : { x: 0, y: w * 0.06, rotate: 0, scale: 0.5, opacity: 0 }
              }
              transition={{
                type: "spring",
                stiffness: 130,
                damping: 16,
                delay: open ? 0.18 + i * 0.09 : (n - 1 - i) * 0.03,
              }}
            >
              <DiscInFan record={r} onOpen={() => goToDisc(r.id)} interactive={open} />
            </motion.div>
          );
        })}

      {/* A CAIXA */}
      <motion.div
        className="absolute left-1/2 top-1/2"
        style={{ width: Math.min(w * 0.5, 340), marginLeft: -Math.min(w * 0.5, 340) / 2 }}
        animate={{
          y: open ? w * 0.13 : 0,
          marginTop: -Math.min(w * 0.5, 340) / 2,
          scale: open ? 0.72 : 1,
          filter: open ? "brightness(0.82)" : "brightness(1)",
        }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="group block w-full"
          aria-label={open ? "Fechar o box" : "Abrir o box"}
        >
          <motion.div
            animate={reduce ? {} : { y: open ? 0 : [0, -8, 0] }}
            transition={open ? {} : { duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <BoxArt config={box.box_config} coverUrl={box.cover_image_url} spineUrl={box.spine_image_url} title={box.title} count={n} interactive={!open} />
          </motion.div>
        </button>
      </motion.div>

      {/* controle */}
      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        {!open ? (
          <motion.button
            type="button"
            onClick={() => setOpen(true)}
            className="btn-brand inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm shadow-lg"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles size={16} /> Abrir box
          </motion.button>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-panel/80 px-4 py-2 text-sm text-muted backdrop-blur transition hover:text-brand"
          >
            <RotateCcw size={15} /> Fechar o box
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Um disco no leque. Quando o box está aberto o vinil fica interativo: passar o
 * mouse dá uma leve expandida, gira e toca a música (reusa o Vinyl); clicar leva
 * à página do disco. O nome aparece no hover.
 */
function DiscInFan({ record, onOpen, interactive = false }: { record: RecordItem; onOpen: () => void; interactive?: boolean }) {
  return (
    <div className="group/disc relative h-full w-full" title={`${record.title} — ${record.artist}`}>
      <div className="h-full w-full transition-transform duration-200 ease-out group-hover/disc:scale-[1.12]">
        <Vinyl
          config={record.disc_config}
          coverUrl={record.cover_image_url}
          audioUrl={record.audio_url}
          audioStart={record.audio_start}
          audioEnd={record.audio_end}
          interactive={interactive}
          noNeedle
          title=""
          onOpen={onOpen}
        />
      </div>
      <span className="pointer-events-none absolute -bottom-1 left-1/2 z-20 flex -translate-x-1/2 translate-y-full items-center gap-1 whitespace-nowrap rounded-full bg-black/80 px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg backdrop-blur transition-opacity duration-200 group-hover/disc:opacity-100">
        <Eye size={11} className="text-brand" /> {record.title}
      </span>
    </div>
  );
}
