"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";

/**
 * Capa gatefold que abre/fecha como um livro (animação realista), para a
 * subpágina do disco. `dir` = "side" abre para o lado, "down" abre para baixo.
 */
export default function GatefoldViewer({ cover, inner, dir }: { cover: string; inner: string; dir: "side" | "down" }) {
  const [open, setOpen] = useState(false);
  const side = dir === "side";
  const CLOSED = "13rem";
  const OPEN = "26rem";

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative"
        style={{
          width: side ? (open ? OPEN : CLOSED) : CLOSED,
          height: side ? CLOSED : (open ? OPEN : CLOSED),
          transition: "width .9s cubic-bezier(0.5,0,0.2,1), height .9s cubic-bezier(0.5,0,0.2,1)",
          perspective: "1800px",
        }}
      >
        {/* arte interna revelada */}
        <div
          className="absolute left-0 top-0 overflow-hidden rounded-lg border border-black/40 shadow-inner"
          style={{ width: side ? OPEN : CLOSED, height: side ? CLOSED : OPEN, opacity: open ? 1 : 0, transition: "opacity .6s .2s" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={inner} alt="Arte interna (gatefold)" className="h-full w-full object-cover" />
        </div>
        {/* capa frontal que abre como um livro */}
        <button
          type="button" onClick={() => setOpen((o) => !o)} aria-label={open ? "Fechar capa" : "Abrir capa gatefold"}
          className="absolute left-0 top-0 overflow-hidden rounded-lg border border-black/50 shadow-2xl"
          style={{
            width: CLOSED, height: CLOSED,
            transformOrigin: side ? "left center" : "center top",
            transform: open ? (side ? "rotateY(-158deg)" : "rotateX(-160deg)") : "none",
            transition: "transform .9s cubic-bezier(0.5,0,0.2,1)",
            backfaceVisibility: "hidden",
          }}
        >
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="Capa" className="h-full w-full object-cover" />
          ) : <div className="h-full w-full bg-panel" />}
        </button>
      </div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="btn-brand mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg transition-transform hover:scale-[1.03]"
      >
        <BookOpen size={16} /> {open ? "Fechar capa" : "Abrir capa (gatefold)"}
      </button>
    </div>
  );
}
