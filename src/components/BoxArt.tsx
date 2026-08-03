"use client";

import { useState, type CSSProperties } from "react";
import { Disc3 } from "lucide-react";
import { resolveBoxColor, DEFAULT_BOX_CONFIG, type BoxConfig } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Render 3D profissional de um box (caixa de discos). Cubóide em CSS 3D com três
 * faces visíveis — frente (capa), lombada (direita) e tampa (topo) — com
 * profundidade proporcional ao nº de discos e material (cor/acabamento) do
 * `box_config`. Interativo: leve parallax acompanhando o cursor.
 *
 * Toda a geometria usa unidades de container query (`cqw` = 1% da largura do
 * container) em vez de medir em JS — assim renderiza na hora, sem flash, e é
 * totalmente responsivo. O container é o wrapper quadrado (`container-type`).
 */
export default function BoxArt({
  config,
  coverUrl,
  spineUrl,
  title,
  count = 3,
  interactive = true,
  className,
}: {
  config?: Partial<BoxConfig> | null;
  coverUrl?: string | null;
  spineUrl?: string | null;
  title?: string;
  count?: number;
  interactive?: boolean;
  className?: string;
}) {
  const cfg: BoxConfig = { ...DEFAULT_BOX_CONFIG, ...(config ?? {}) };
  const col = resolveBoxColor(cfg.color, cfg.accent);
  const [tilt, setTilt] = useState({ rx: -9, ry: -26 });

  // geometria em cqw (1% da largura do container quadrado)
  const S = 78;
  const D = Math.round(Math.min(46, 12 + Math.min(20, Math.max(1, count)) * 2.2));
  const q = (n: number) => `${n}cqw`;

  function onMove(e: React.PointerEvent) {
    if (!interactive) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ rx: -9 - py * 12, ry: -26 + px * 16 });
  }
  function onLeave() {
    if (interactive) setTilt({ rx: -9, ry: -26 });
  }

  const finishSheen =
    cfg.finish === "gloss"
      ? "linear-gradient(135deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.05) 30%, transparent 55%)"
      : cfg.finish === "foil"
        ? `linear-gradient(120deg, ${col.light} 0%, ${col.accent}66 26%, ${col.dark} 52%, ${col.accent}55 78%, ${col.light} 100%)`
        : cfg.finish === "kraft"
          ? "repeating-linear-gradient(92deg, rgba(0,0,0,0.05) 0 3px, rgba(255,255,255,0.03) 3px 6px)"
          : "linear-gradient(135deg, rgba(255,255,255,0.10), transparent 46%)";

  const faceBase: CSSProperties = {
    position: "absolute",
    left: "50%",
    top: "50%",
    background: `linear-gradient(160deg, ${col.light}, ${col.base} 55%, ${col.dark})`,
  };

  return (
    <div
      className={cn("relative aspect-square w-full select-none", className)}
      style={{ containerType: "inline-size" }}
    >
      <div
        className="absolute inset-0"
        style={{ perspective: "260cqw" }}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        <div
          className="absolute inset-0"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
            transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          {/* sombra no chão */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: q(S * 1.05),
              height: q(S * 0.5),
              marginLeft: q(-S * 0.525),
              marginTop: q(-S * 0.25),
              transform: `translateY(${q(S * 0.55)}) rotateX(90deg)`,
              background: "radial-gradient(ellipse at center, rgba(0,0,0,0.55), transparent 68%)",
              filter: "blur(6px)",
            }}
          />

          {/* TOPO / tampa */}
          <div
            style={{
              ...faceBase,
              width: q(S),
              height: q(D),
              marginLeft: q(-S / 2),
              marginTop: q(-D / 2),
              transform: `translateY(${q(-S / 2 + D / 2)}) rotateX(90deg)`,
              background: `linear-gradient(180deg, ${col.light}, ${col.base})`,
              boxShadow: "inset 0 0 30px rgba(0,0,0,0.4)",
            }}
          >
            <span
              className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-bold uppercase"
              style={{ color: col.accent, opacity: 0.7, fontSize: "3.4cqw", letterSpacing: "0.3em" }}
            >
              NEBLINA
            </span>
          </div>

          {/* LOMBADA / direita */}
          <div
            style={{
              ...faceBase,
              width: q(D),
              height: q(S),
              marginLeft: q(-D / 2),
              marginTop: q(-S / 2),
              transform: `translateX(${q(S / 2 - D / 2)}) rotateY(90deg)`,
              overflow: "hidden",
            }}
          >
            {spineUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={spineUrl} alt="" className="h-full w-full object-cover" draggable={false} />
            ) : (
              <span
                className="absolute left-1/2 top-1/2 whitespace-nowrap font-bold uppercase"
                style={{ color: col.accent, transform: "translate(-50%,-50%) rotate(90deg)", fontSize: "3.6cqw", letterSpacing: "0.12em" }}
              >
                {title ? title.slice(0, 22) : "NEBLINA RECORDS"}
              </span>
            )}
            <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.5), transparent 40%, rgba(0,0,0,0.35))" }} />
          </div>

          {/* FRENTE / capa */}
          <div
            style={{
              ...faceBase,
              width: q(S),
              height: q(S),
              marginLeft: q(-S / 2),
              marginTop: q(-S / 2),
              transform: `translateZ(${q(D / 2)})`,
              borderRadius: "1.5cqw",
              overflow: "hidden",
              boxShadow: `inset 0 0 0 1px ${col.accent}44, inset 0 0 60px rgba(0,0,0,0.35)`,
            }}
          >
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt={title ?? ""} className="h-full w-full object-cover" draggable={false} />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2" style={{ background: `linear-gradient(160deg, ${col.light}, ${col.dark})` }}>
                <Disc3 style={{ color: col.accent, opacity: 0.85, width: "24cqw", height: "24cqw" }} />
                <span className="px-3 text-center font-semibold uppercase" style={{ color: col.accent, fontSize: "4cqw", letterSpacing: "0.12em" }}>
                  {title ?? "Box"}
                </span>
              </div>
            )}
            {/* acabamento / verniz */}
            <div className="pointer-events-none absolute inset-0" style={{ background: finishSheen, mixBlendMode: cfg.finish === "foil" ? "overlay" : "screen", opacity: cfg.finish === "gloss" ? 0.5 : cfg.finish === "foil" ? 0.55 : 0.3 }} />
            {/* aro da marca */}
            <div className="pointer-events-none absolute inset-0" style={{ boxShadow: `inset 0 0 0 2px ${col.accent}55` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
