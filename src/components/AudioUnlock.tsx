"use client";

import { useEffect } from "react";

/**
 * Navegadores bloqueiam áudio até a primeira interação do usuário.
 * Aqui "desbloqueamos" no primeiro gesto (clique/toque/tecla), para que
 * passar o mouse nos discos já toque a música em seguida.
 */
export default function AudioUnlock() {
  useEffect(() => {
    let done = false;
    const unlock = () => {
      if (done) return;
      done = true;
      try {
        const a = new Audio();
        a.muted = true;
        const p = a.play();
        if (p) p.then(() => a.pause()).catch(() => {});
      } catch {}
      remove();
    };
    const remove = () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("touchstart", unlock);
      document.removeEventListener("keydown", unlock);
    };
    document.addEventListener("pointerdown", unlock);
    document.addEventListener("touchstart", unlock);
    document.addEventListener("keydown", unlock);
    return remove;
  }, []);

  return null;
}
