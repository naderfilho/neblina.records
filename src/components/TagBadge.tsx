import type { Tag } from "@/lib/types";
import type { CSSProperties } from "react";

const FONT_FAMILY: Record<string, string | undefined> = {
  sans: undefined,
  display: "var(--font-display, 'Poppins', system-ui), sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "ui-monospace, 'SFMono-Regular', Menlo, monospace",
};

export default function TagBadge({ tag, size = "sm" }: { tag: Tag; size?: "sm" | "md" }) {
  // o tamanho escolhido na tag manda; o `size` do chamador é só fallback
  const sz = tag.size || size;
  const pad =
    sz === "lg" ? "px-3.5 py-[6px] text-[13px]" :
    sz === "md" ? "px-3 py-[5px] text-[11px]" :
    "px-2.5 py-[3px] text-[10px]";

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

  const fontFamily = FONT_FAMILY[tag.font ?? "sans"];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold uppercase leading-none tracking-[0.08em] ${pad}`}
      style={{ ...style, ...(fontFamily ? { fontFamily } : {}) }}
    >
      {tag.label}
    </span>
  );
}
