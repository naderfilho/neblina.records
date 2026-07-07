"use client";

import Vinyl from "@/components/Vinyl";
import { DISC_COLORS, LABEL_STYLES, BORDER_STYLES, type DiscConfig } from "@/lib/constants";
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
                key={c.id}
                type="button"
                onClick={() => set({ color: c.id })}
                title={c.label}
                className={cn(
                  "h-9 w-9 rounded-full border-2 transition-transform hover:scale-110",
                  config.color === c.id ? "border-brand" : "border-line",
                )}
                style={{ background: `radial-gradient(circle at 35% 30%, ${c.groove}, ${c.ring})` }}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-muted">Estilo do centro (label)</p>
          <div className="flex flex-wrap gap-2">
            {LABEL_STYLES.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => set({ label: l.id })}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs",
                  config.label === l.id ? "border-brand bg-brand/15 text-brand" : "border-line text-muted hover:text-ink",
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {config.label === "solid" && (
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-muted">Cor do label</p>
            <input
              type="color"
              value={config.labelColor ?? "#f5a028"}
              onChange={(e) => set({ labelColor: e.target.value })}
              className="h-10 w-16 cursor-pointer rounded-lg border border-line bg-transparent"
            />
          </div>
        )}

        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-muted">Borda do label</p>
          <div className="flex flex-wrap gap-2">
            {BORDER_STYLES.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => set({ border: b.id })}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs",
                  config.border === b.id ? "border-brand bg-brand/15 text-brand" : "border-line text-muted hover:text-ink",
                )}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
