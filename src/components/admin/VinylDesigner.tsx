"use client";

import Vinyl from "@/components/Vinyl";
import {
  DISC_COLORS, DISC_STYLES, LABEL_STYLES, BORDER_STYLES,
  resolveDiscColor, resolveBorderColor, type DiscConfig,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

function ColorPicker({
  value,
  onChange,
  swatches,
}: {
  value: string;
  onChange: (hex: string) => void;
  swatches: { id: string; label: string; dot: string }[];
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <label className="relative h-10 w-12 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-line">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute -left-2 -top-2 h-14 w-16 cursor-pointer border-0 bg-transparent p-0"
          />
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            let v = e.target.value.trim();
            if (v && !v.startsWith("#")) v = "#" + v;
            onChange(v);
          }}
          placeholder="#000000"
          spellCheck={false}
          className="ipt max-w-[130px] font-mono uppercase"
        />
        <span className="h-8 w-8 shrink-0 rounded-full border border-line" style={{ background: value }} title="Prévia da cor" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {swatches.map((s) => (
          <button
            key={s.id}
            type="button"
            title={s.label}
            onClick={() => onChange(s.dot)}
            className={cn(
              "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
              value.toLowerCase() === s.dot.toLowerCase() ? "border-brand" : "border-line",
            )}
            style={{ background: s.dot }}
          />
        ))}
      </div>
    </div>
  );
}

export default function VinylDesigner({
  coverUrl,
  config,
  onChange,
}: {
  coverUrl?: string | null;
  config: DiscConfig;
  onChange: (c: DiscConfig) => void;
}) {
  const set = (patch: Partial<DiscConfig>) => onChange({ ...config, ...patch });
  const showLabelColor = config.label === "solid" || config.label === "gradient" || config.label === "target";

  // hex atual (resolve preset id → hex para o seletor de cor)
  const discHex = /^#/.test(config.color) ? config.color : resolveDiscColor(config.color).groove;
  const borderHex = /^#/.test(config.borderColor ?? "") ? (config.borderColor as string) : resolveBorderColor(config.borderColor ?? "sunset");

  const discSwatches = DISC_COLORS.map((c) => ({ id: c.id, label: c.label, dot: c.groove }));
  const borderSwatches = DISC_COLORS.map((c) => ({ id: c.id, label: c.label, dot: c.accent }));

  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
      {/* preview */}
      <div>
        <div className="mx-auto max-w-[200px]">
          <Vinyl coverUrl={coverUrl} config={config} interactive={false} title="Prévia" />
        </div>
        <p className="mt-2 text-center text-xs text-faint">Prévia do vinil na home</p>
      </div>

      {/* controles */}
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-muted">Cor do disco</p>
          <ColorPicker value={discHex} onChange={(hex) => set({ color: hex })} swatches={discSwatches} />
        </div>

        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-muted">Estilo do disco</p>
          <div className="flex flex-wrap gap-2">
            {DISC_STYLES.map((s) => (
              <button key={s.id} type="button" onClick={() => set({ style: s.id })}
                className={cn("rounded-lg border px-3 py-1.5 text-xs", (config.style ?? "solid") === s.id ? "border-brand bg-brand/15 text-brand" : "border-line text-muted hover:text-ink")}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-muted">Estilo do centro (label)</p>
          <div className="flex flex-wrap gap-2">
            {LABEL_STYLES.map((l) => (
              <button key={l.id} type="button" onClick={() => set({ label: l.id })}
                className={cn("rounded-lg border px-3 py-1.5 text-xs", config.label === l.id ? "border-brand bg-brand/15 text-brand" : "border-line text-muted hover:text-ink")}>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {showLabelColor && (
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-muted">Cor do label</p>
            <input type="color" value={config.labelColor ?? "#ff9d2e"} onChange={(e) => set({ labelColor: e.target.value })}
              className="h-10 w-16 cursor-pointer rounded-lg border border-line bg-transparent" />
          </div>
        )}

        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-muted">Tipos de borda</p>
          <div className="flex flex-wrap gap-2">
            {BORDER_STYLES.map((b) => (
              <button key={b.id} type="button" onClick={() => set({ border: b.id })}
                className={cn("rounded-lg border px-3 py-1.5 text-xs", config.border === b.id ? "border-brand bg-brand/15 text-brand" : "border-line text-muted hover:text-ink")}>
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {config.border !== "none" && (
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-muted">Cor da borda</p>
            <ColorPicker value={borderHex} onChange={(hex) => set({ borderColor: hex })} swatches={borderSwatches} />
          </div>
        )}
      </div>
    </div>
  );
}
