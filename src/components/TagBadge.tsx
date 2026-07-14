import type { Tag } from "@/lib/types";
import type { CSSProperties } from "react";

const FONT_FAMILY: Record<string, string | undefined> = {
  sans: undefined,
  display: "var(--font-display, 'Poppins', system-ui), sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "ui-monospace, 'SFMono-Regular', Menlo, monospace",
};

// ---- contraste: garante texto legível mesmo se a cor escolhida ficar ruim ----
function relLuminance(hex: string): number | null {
  const c = hex.replace("#", "").trim();
  const n = c.length === 3 ? c.split("").map((x) => x + x).join("") : c;
  if (!/^[0-9a-fA-F]{6}$/.test(n)) return null;
  const chan = (i: number) => {
    const u = parseInt(n.slice(i, i + 2), 16) / 255;
    return u <= 0.03928 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(0) + 0.7152 * chan(2) + 0.0722 * chan(4);
}

function contrast(a: string, b: string): number {
  const la = relLuminance(a);
  const lb = relLuminance(b);
  if (la == null || lb == null) return 21; // hex inválido → não mexe
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

/** Devolve a cor de texto escolhida se der contraste ok; senão troca por preto/branco. */
function readableText(bg: string, fg: string): string {
  if (contrast(fg, bg) >= 3) return fg;
  return contrast("#ffffff", bg) >= contrast("#000000", bg) ? "#ffffff" : "#000000";
}

export default function TagBadge({ tag, size = "sm" }: { tag: Tag; size?: "sm" | "md" }) {
  // o tamanho escolhido na tag manda; o `size` do chamador é só fallback
  const sz = tag.size || size;
  const pad =
    sz === "lg" ? "px-3.5 py-[6px] text-[13px]" :
    sz === "md" ? "px-3 py-[5px] text-[11px]" :
    "px-2.5 py-[3px] text-[10px]";

  // texto sempre legível sobre o fundo sólido (corrige tags como preto sobre marrom escuro)
  const textColor = readableText(tag.bg, tag.fg);

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
      color: textColor,
      boxShadow: `0 4px 14px -4px ${tag.bg}, inset 0 1px 0 rgba(255,255,255,0.3)`,
    };
  } else {
    style = {
      background: `linear-gradient(180deg, ${tag.bg}, ${tag.bg}dd)`,
      color: textColor,
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
