"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cursor personalizado: sobre qualquer elemento com a classe `.needle-zone`
 * (os vinis), o ponteiro do mouse vira uma agulha de toca-discos.
 * Só age em dispositivos com mouse (pointer: fine).
 */
export default function CursorNeedle() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const pos = useRef({ x: 0, y: 0 });
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const render = () => {
      if (ref.current) {
        ref.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
      }
      raf.current = null;
    };

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      const overNeedle = !!(e.target as HTMLElement)?.closest?.(".needle-zone");
      setVisible(overNeedle);
      if (raf.current == null) raf.current = requestAnimationFrame(render);
    };

    const onLeave = () => setVisible(false);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[9999] hidden md:block"
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity .18s ease",
        willChange: "transform",
      }}
    >
      {/* a ponta da agulha fica no ponto (0,0) = posição do mouse */}
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        style={{ transform: "translate(-8px, -8px) rotate(0deg)" }}
        fill="none"
      >
        <defs>
          <linearGradient id="arm" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e9edf1" />
            <stop offset="0.5" stopColor="#9aa7b2" />
            <stop offset="1" stopColor="#5b6772" />
          </linearGradient>
          <radialGradient id="pivot" cx="0.4" cy="0.35" r="0.7">
            <stop offset="0" stopColor="#f5a028" />
            <stop offset="1" stopColor="#8f560c" />
          </radialGradient>
        </defs>

        {/* braço do toca-discos indo da ponta (canto sup-esq) ao pivô */}
        <line x1="10" y1="10" x2="96" y2="96" stroke="#0b0f14" strokeWidth="9" strokeLinecap="round" opacity="0.35" />
        <line x1="10" y1="10" x2="96" y2="96" stroke="url(#arm)" strokeWidth="6" strokeLinecap="round" />

        {/* headshell / cápsula perto da ponta */}
        <g transform="rotate(45 18 18)">
          <rect x="6" y="12" width="26" height="14" rx="3" fill="url(#arm)" stroke="#3a444e" strokeWidth="1" />
          <rect x="9" y="24" width="8" height="7" rx="1.5" fill="#1b2129" />
        </g>

        {/* ponta da agulha exatamente no (8,8) */}
        <circle cx="10" cy="10" r="3.2" fill="#f5a028" />
        <circle cx="10" cy="10" r="6.5" fill="none" stroke="#f5a028" strokeWidth="1" opacity="0.5" />

        {/* pivô do braço */}
        <circle cx="98" cy="98" r="9" fill="url(#pivot)" stroke="#2a2118" strokeWidth="1.5" />
      </svg>
    </div>
  );
}
