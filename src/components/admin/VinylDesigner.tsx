"use client";

import Vinyl from "@/components/Vinyl";
import { DISC_COLORS, DISC_STYLES, LABEL_STYLES, BORDER_STYLES, type DiscConfig } from "@/lib/constants";
import { cn } from "@/lib/utils";

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
          <div className="flex flex-wrap gap-2">
            {DISC_COLORS.map((c) => (
              <button
                key={c.id} type="button" onClick={() => set({ color: c.id })} title={c.label}
                className={cn("h-9 w-9 rounded-full border-2 transition-transform hover:scale-110", config.color === c.id ? "border-brand" : "border-line")}
                style={{ background: `radial-gradient(circle at 35% 30%, ${c.groove}, ${c.ring})` }}
              />
            ))}
          </div>
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
            <div className="flex flex-wrap gap-2">
              {DISC_COLORS.map((c) => (
                <button key={c.id} type="button" onClick={() => set({ borderColor: c.id })} title={c.label}
                  className={cn("h-8 w-8 rounded-full border-2 transition-transform hover:scale-110", (config.borderColor ?? "sunset") === c.id ? "border-brand" : "border-line")}
                  style={{ background: c.accent }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
