import type { Tag } from "@/lib/types";
import type { CSSProperties } from "react";

export default function TagBadge({ tag, size = "sm" }: { tag: Tag; size?: "sm" | "md" }) {
  const pad = size === "md" ? "px-3 py-[5px] text-[11px]" : "px-2.5 py-[3px] text-[10px]";

  let style: CSSProperties;
  if (tag.style === "outline") {
    style = {
      background: `${tag.bg}1f`,
      color: tag.bg,
      border: `1px solid ${tag.bg}`,
      backdropFilter: "blur(4px)",
    };
  } else if (tag.style === "glow") {
    style = {
      background: `linear-gradient(180deg, ${tag.bg}, ${tag.bg}cc)`,
      color: tag.fg,
      boxShadow: `0 4px 14px -4px ${tag.bg}, inset 0 1px 0 rgba(255,255,255,0.3)`,
    };
  } else {
    style = {
      background: `linear-gradient(180deg, ${tag.bg}, ${tag.bg}dd)`,
      color: tag.fg,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 2px 8px -3px rgba(0,0,0,0.5)",
    };
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold uppercase leading-none tracking-[0.08em] ${pad}`}
      style={style}
    >
      {tag.label}
    </span>
  );
}
