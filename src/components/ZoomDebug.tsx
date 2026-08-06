"use client";

import { useEffect, useState } from "react";

/**
 * TEMPORÁRIO — diagnóstico do bug de zoom no mobile.
 * Além do viewport, mede o TAMANHO REAL do disco (#tv-disc) e procura qualquer
 * escala/zoom escondido em html/body/ancestrais. Remover depois.
 */
export default function ZoomDebug() {
  const [info, setInfo] = useState("carregando…");

  useEffect(() => {
    let maxScale = 1;
    let maxDiscW = 0;
    const short = (s: string | null) => (s && s !== "none" ? s.slice(0, 22) : "-");
    const upd = () => {
      const vv = window.visualViewport;
      const de = document.documentElement;
      const scale = vv ? vv.scale : 1;
      if (scale > maxScale) maxScale = scale;

      const disc = document.getElementById("tv-disc");
      const r = disc?.getBoundingClientRect();
      const dw = r ? Math.round(r.width) : 0;
      if (dw > maxDiscW) maxDiscW = dw;
      const inner = disc?.firstElementChild as HTMLElement | undefined;

      const htmlZoom = getComputedStyle(de).getPropertyValue("zoom");
      const bodyT = getComputedStyle(document.body).transform;

      setInfo(
        `scale=${scale.toFixed(3)} pico=${maxScale.toFixed(3)}  inner=${window.innerWidth}x${window.innerHeight}\n` +
        `disc=${dw}  picoDisc=${maxDiscW}  (normal ~ largura da coluna)\n` +
        `discChildT=${short(inner ? getComputedStyle(inner).transform : null)}\n` +
        `htmlZoom=${htmlZoom || "-"}  bodyT=${short(bodyT)}\n` +
        `docScroll=${de.scrollWidth} client=${de.clientWidth}`,
      );
    };
    upd();
    const iv = setInterval(upd, 200);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", upd);
    vv?.addEventListener("scroll", upd);
    window.addEventListener("resize", upd);
    return () => {
      clearInterval(iv);
      vv?.removeEventListener("resize", upd);
      vv?.removeEventListener("scroll", upd);
      window.removeEventListener("resize", upd);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed", top: 4, left: 4, zIndex: 99999,
        background: "rgba(0,0,0,0.82)", color: "#39ff14",
        font: "10px/1.35 monospace", padding: "5px 7px", borderRadius: 5,
        whiteSpace: "pre", pointerEvents: "none", maxWidth: "92vw",
      }}
    >
      {info}
    </div>
  );
}
