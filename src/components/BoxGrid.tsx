"use client";

import { useMemo, useState } from "react";
import { Package } from "lucide-react";
import BoxCard from "@/components/BoxCard";
import { homeGridClass } from "@/lib/constants";
import type { BoxSummary } from "@/lib/types";

export default function BoxGrid({ boxes, columns }: { boxes: BoxSummary[]; columns?: number | null }) {
  const [type, setType] = useState("");

  // só os tipos que existem em algum box publicado
  const types = useMemo(
    () => Array.from(new Set(boxes.map((b) => b.box_type).filter((t): t is string => !!t))).sort(),
    [boxes],
  );

  const filtered = useMemo(
    () => (type ? boxes.filter((b) => b.box_type === type) : boxes),
    [boxes, type],
  );

  if (boxes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line py-24 text-center">
        <Package size={40} className="mx-auto mb-3 text-faint" />
        <p className="text-lg text-muted">Nenhum box publicado ainda.</p>
        <p className="mt-1 text-sm text-faint">Em breve os boxes aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <div>
      {types.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setType("")}
            className={`rounded-full border px-3 py-1.5 text-xs ${type === "" ? "border-brand bg-brand/15 text-brand" : "border-line text-muted hover:text-ink"}`}
          >
            Todos os tipos
          </button>
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setType((cur) => (cur === t ? "" : t))}
              className={`rounded-full border px-3 py-1.5 text-xs ${type === t ? "border-brand bg-brand/15 text-brand" : "border-line text-muted hover:text-ink"}`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <p className="mb-5 text-sm text-muted">
        {filtered.length} {filtered.length === 1 ? "box" : "boxes"}
      </p>

      <div className={`grid gap-x-5 gap-y-9 ${homeGridClass(columns)}`}>
        {filtered.map((b) => (
          <BoxCard key={b.id} box={b} />
        ))}
      </div>
    </div>
  );
}
