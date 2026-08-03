"use client";

import { useState } from "react";
import { Disc3, Package } from "lucide-react";
import RecordGrid from "@/components/RecordGrid";
import BoxGrid from "@/components/BoxGrid";
import { cn } from "@/lib/utils";
import type { RecordItem, Tag, BoxSummary } from "@/lib/types";

/**
 * Seletor "Discos | Boxes" no topo do acervo. Mantém o RecordGrid intacto e
 * alterna para a grade de boxes. Só mostra a aba de Boxes se existir algum.
 */
export default function AcervoTabs({
  records,
  tags,
  columns,
  boxes,
}: {
  records: RecordItem[];
  tags: Tag[];
  columns?: number | null;
  boxes: BoxSummary[];
}) {
  const [tab, setTab] = useState<"discos" | "boxes">("discos");
  const hasBoxes = boxes.length > 0;

  return (
    <div>
      {hasBoxes && (
        <div className="mb-7 inline-flex rounded-2xl border border-line bg-bg-soft p-1">
          {([
            ["discos", "Discos", Disc3, records.length],
            ["boxes", "Boxes", Package, boxes.length],
          ] as const).map(([id, label, Icon, n]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                tab === id ? "bg-brand text-black" : "text-muted hover:text-ink",
              )}
            >
              <Icon size={16} /> {label}
              <span className={cn("rounded-full px-1.5 text-[11px]", tab === id ? "bg-black/20" : "bg-panel-2 text-faint")}>{n}</span>
            </button>
          ))}
        </div>
      )}

      {tab === "boxes" && hasBoxes ? (
        <BoxGrid boxes={boxes} columns={columns} />
      ) : (
        <RecordGrid records={records} tags={tags} columns={columns} />
      )}
    </div>
  );
}
