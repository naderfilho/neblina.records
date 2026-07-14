"use client";

import { useState } from "react";
import { BookOpen, X } from "lucide-react";

/**
 * Capa gatefold (dupla) que abre como um livro na subpágina do disco. Clicar na
 * capa OU no botão abre/fecha, revelando a arte interna. `dir` = "side" abre para
 * o lado, "down" abre para baixo.
 */
export default function GatefoldViewer({ cover, inner, dir }: { cover: string; inner: string; dir: "side" | "down" }) {
  const [open, setOpen] = useState(false);
  const side = dir === "side";
  const CLOSED = "14rem";
  const OPEN = "28rem";
  const toggle = () => setOpen((o) => !o);

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative"
        style={{
          width: side ? (open ? OPEN : CLOSED) : CLOSED,
          height: side ? CLOSED : (open ? OPEN : CLOSED),
          transition: "width .8s cubic-bezier(0.5,0,0.2,1), height .8s cubic-bezier(0.5,0,0.2,1)",
          perspective: "1600px",
        }}
      >
        {/* arte interna revelada */}
        <button
          type="button"
          onClick={toggle}
          aria-label="Fechar capa"
          className="absolute left-0 top-0 block cursor-zoom-out overflow-hidden rounded-lg border border-black/40 shadow-inner"
          style={{ width: side ? OPEN : CLOSED, height: side ? CLOSED : OPEN, opacity: open ? 1 : 0, transition: "opacity .5s .25s", pointerEvents: open ? "auto" : "none" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={inner} alt="Arte interna do gatefold" className="h-full w-full object-cover" draggable={false} />
        </button>

        {/* capa frontal que abre como livro (clicável) */}
        <button
          type="button"
          onClick={toggle}
          aria-label={open ? "Fechar capa" : "Abrir capa dupla"}
          className="group absolute left-0 top-0 block cursor-pointer overflow-hidden rounded-lg border border-black/50 shadow-2xl"
          style={{
            width: CLOSED, height: CLOSED,
            transformOrigin: side ? "left center" : "center top",
            transform: open ? (side ? "rotateY(-155deg)" : "rotateX(-155deg)") : "none",
            transition: "transform .9s cubic-bezier(0.5,0,0.2,1)",
            backfaceVisibility: "hidden",
            zIndex: 2,
          }}
        >
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="Capa" className="h-full w-full object-cover" draggable={false} />
          ) : <div className="h-full w-full bg-panel" />}
          {/* dica de que é clicável */}
          {!open && (
            <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-gradient-to-t from-black/80 to-transparent pb-2 pt-6 text-[11px] font-semibold text-white opacity-90 transition-opacity group-hover:opacity-100">
              <BookOpen size={13} /> Clique para abrir
            </span>
          )}
        </button>
      </div>

      <button
        type="button"
        onClick={toggle}
        className="btn-brand mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg transition-transform hover:scale-[1.03]"
      >
        {open ? <X size={16} /> : <BookOpen size={16} />} {open ? "Fechar capa" : "Abrir capa (gatefold)"}
      </button>
    </div>
  );
}
