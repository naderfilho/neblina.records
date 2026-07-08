import type { Tag } from "@/lib/types";
import type { CSSProperties } from "react";

export default function TagBadge({ tag, size = "sm" }: { tag: Tag; size?: "sm" | "md" }) {
  const pad = size === "md" ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[10px]";
  let style: CSSProperties;
  if (tag.style === "outline") {
    style = { background: "transparent", color: tag.bg, border: `1.5px solid ${tag.bg}` };
  } else if (tag.style === "glow") {
    style = { background: tag.bg, color: tag.fg, boxShadow: `0 4px 14px -2px ${tag.bg}aa` };
  } else {
    style = { background: tag.bg, color: tag.fg };
  }
  return (
    <span className={`inline-block rounded-full font-bold uppercase tracking-wide ${pad}`} style={style}>
      {tag.label}
    </span>
  );
}
