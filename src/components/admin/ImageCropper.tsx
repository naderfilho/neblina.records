"use client";

import { useEffect, useRef, useState } from "react";
import { ZoomIn, Check, X } from "lucide-react";

const BOX = 320; // tamanho do viewport quadrado
const OUT = 900; // resolução de saída

export default function ImageCropper({
  file,
  onDone,
  onCancel,
}: {
  file: File;
  onDone: (blob: Blob) => void;
  onCancel: () => void;
}) {
  const [url] = useState(() => URL.createObjectURL(file));
  const [nat, setNat] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  const baseScale = nat.w && nat.h ? BOX / Math.min(nat.w, nat.h) : 1;
  const eff = baseScale * zoom;
  const dispW = nat.w * eff;
  const dispH = nat.h * eff;

  function clamp(o: { x: number; y: number }) {
    const maxX = Math.max(0, (dispW - BOX) / 2);
    const maxY = Math.max(0, (dispH - BOX) / 2);
    return { x: Math.max(-maxX, Math.min(maxX, o.x)), y: Math.max(-maxY, Math.min(maxY, o.y)) };
  }

  const left = BOX / 2 - dispW / 2 + offset.x;
  const top = BOX / 2 - dispH / 2 + offset.y;

  function apply() {
    const img = imgRef.current;
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const sf = OUT / BOX;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, OUT, OUT);
    ctx.drawImage(img, left * sf, top * sf, dispW * sf, dispH * sf);
    canvas.toBlob((blob) => blob && onDone(blob), "image/jpeg", 0.92);
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 p-4" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-2xl border border-line bg-panel p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg text-ink">Ajustar foto</h3>
          <button onClick={onCancel} className="text-faint hover:text-ink"><X size={18} /></button>
        </div>

        <div
          className="relative mx-auto overflow-hidden rounded-xl border border-line bg-black"
          style={{ width: BOX, height: BOX, touchAction: "none", cursor: "grab" }}
          onPointerDown={(e) => { drag.current = { x: e.clientX, y: e.clientY }; (e.target as HTMLElement).setPointerCapture(e.pointerId); }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            const dx = e.clientX - drag.current.x;
            const dy = e.clientY - drag.current.y;
            drag.current = { x: e.clientX, y: e.clientY };
            setOffset((o) => clamp({ x: o.x + dx, y: o.y + dy }));
          }}
          onPointerUp={() => (drag.current = null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={url}
            alt=""
            draggable={false}
            onLoad={(e) => setNat({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
            style={{ position: "absolute", left, top, width: dispW, height: dispH, maxWidth: "none" }}
          />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <ZoomIn size={16} className="text-muted" />
          <input
            type="range" min={1} max={4} step={0.01} value={zoom}
            onChange={(e) => { setZoom(parseFloat(e.target.value)); setOffset((o) => clamp(o)); }}
            className="flex-1 accent-brand"
          />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg border border-line px-4 py-2 text-sm text-muted hover:text-ink">Cancelar</button>
          <button onClick={apply} className="btn-brand flex items-center gap-2 rounded-lg px-4 py-2 text-sm">
            <Check size={16} /> Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
