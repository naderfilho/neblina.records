"use client";

import { useEffect, useState } from "react";

/**
 * TEMPORÁRIO — medidor de diagnóstico do bug de zoom no mobile.
 * Mostra ao vivo: escala do viewport visual (o "zoom" do navegador), tamanho do
 * viewport visual, innerWidth/Height e a largura de rolagem do documento.
 * Remover assim que o bug for entendido.
 */
export default function ZoomDebug() {
  const [info, setInfo] = useState("carregando…");

  useEffect(() => {
    let maxScale = 1;
    const upd = () => {
      const vv = window.visualViewport;
      const de = document.documentElement;
      const scale = vv ? vv.scale : 1;
      if (scale > maxScale) maxScale = scale;
      setInfo(
        `zoom(scale)=${scale.toFixed(3)}  pico=${maxScale.toFixed(3)}\n` +
        `vv=${vv ? Math.round(vv.width) : "?"}x${vv ? Math.round(vv.height) : "?"} off=${vv ? Math.round(vv.offsetLeft) : "?"},${vv ? Math.round(vv.offsetTop) : "?"}\n` +
        `inner=${window.innerWidth}x${window.innerHeight}\n` +
        `docScroll=${de.scrollWidth}  client=${de.clientWidth}  body=${document.body.scrollWidth}`,
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
        whiteSpace: "pre", pointerEvents: "none", maxWidth: "78vw",
      }}
    >
      {info}
    </div>
  );
}
