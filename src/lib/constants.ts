export const STORE = {
  name: "Neblina Records",
  tagline: "Records",
  city: "Nova Friburgo, RJ",
  whatsappPrimary: process.env.NEXT_PUBLIC_WHATSAPP_PRIMARY ?? "5522992657509",
  whatsappSecondary: process.env.NEXT_PUBLIC_WHATSAPP_SECONDARY ?? "5522998382007",
  telegram: process.env.NEXT_PUBLIC_TELEGRAM_USERNAME ?? "neblinarecords",
  email: process.env.NEXT_PUBLIC_STORE_EMAIL ?? "neblinarecordnf@gmail.com",
  instagram: process.env.NEXT_PUBLIC_STORE_INSTAGRAM ?? "Neblinarecord",
} as const;

/** Padrão internacional Goldmine Grading */
export const QUALITY_GRADES = ["M", "NM", "VG+", "VG", "G", "F", "P"] as const;
export type QualityGrade = (typeof QUALITY_GRADES)[number];

export const QUALITY_META: Record<QualityGrade, { label: string; color: string }> = {
  M: { label: "Mint (M)", color: "#22c39c" },
  NM: { label: "Near Mint (NM)", color: "#3bb36a" },
  "VG+": { label: "Very Good Plus (VG+)", color: "#8fb843" },
  VG: { label: "Very Good (VG)", color: "#c9b03d" },
  G: { label: "Good (G)", color: "#d19a3a" },
  F: { label: "Fair (F)", color: "#cf7e3a" },
  P: { label: "Poor (P)", color: "#c65a4c" },
};

export const RECORD_FORMATS = [
  "LP",
  "LP Duplo",
  "EP",
  'Single 7"',
  "Compacto",
  "Promo de Rádio",
  "78 RPM",
  "CD",
  "Box Set",
  "Picture Disc",
  "Coletânea",
] as const;

/** Formas de pagamento (com região) */
export const PAYMENT_METHODS = [
  "Pix (Brasil)",
  "Boleto (Brasil)",
  "Credit Card (All Countries)",
  "Paypal (All Countries)",
  "Cripto (All Countries)",
] as const;

/** 30+ estilos musicais mais populares (sugestões de filtro) */
export const POPULAR_GENRES = [
  "Rock", "Pop", "MPB", "Samba", "Bossa Nova", "Jazz", "Blues", "Soul", "Funk",
  "R&B", "Hip Hop", "Rap", "Reggae", "Ska", "Punk", "Heavy Metal", "Hard Rock",
  "Rock Progressivo", "Psicodelia", "Indie", "Alternativo", "Grunge", "New Wave",
  "Post-Punk", "Eletrônica", "Disco", "House", "Techno", "Country", "Folk",
  "Gospel", "Clássica", "Trilha Sonora", "Forró", "Pagode", "Sertanejo", "Axé",
  "Bolero", "Salsa", "World Music",
] as const;

/** 30+ nacionalidades mais populares */
export const POPULAR_NATIONALITIES = [
  "Brasil", "Estados Unidos", "Reino Unido", "Jamaica", "Argentina", "México",
  "Cuba", "França", "Alemanha", "Itália", "Espanha", "Portugal", "Canadá",
  "Austrália", "Japão", "Coreia do Sul", "Nigéria", "África do Sul", "Índia",
  "Holanda", "Suécia", "Noruega", "Irlanda", "Colômbia", "Chile", "Uruguai",
  "Peru", "Angola", "Cabo Verde", "Rússia", "China", "Grécia",
] as const;

/** Cores do disco (e da borda). `accent` = versão vívida p/ borda e detalhes. */
export const DISC_COLORS = [
  { id: "classic", label: "Preto Clássico", ring: "#111111", groove: "#1c1c1c", accent: "#e8ecef" },
  { id: "midnight", label: "Azul Meia-Noite", ring: "#0f2436", groove: "#16324a", accent: "#2f83b4" },
  { id: "ocean", label: "Azul Oceano", ring: "#0b3a63", groove: "#125089", accent: "#2f9fd6" },
  { id: "sunset", label: "Laranja Sol", ring: "#7a3d06", groove: "#994c08", accent: "#ff9d2e" },
  { id: "amber", label: "Âmbar", ring: "#5a3a08", groove: "#8a5a10", accent: "#e0a63a" },
  { id: "teal", label: "Verde Névoa", ring: "#0c342f", groove: "#124a42", accent: "#26c0d4" },
  { id: "forest", label: "Verde Floresta", ring: "#123a1c", groove: "#1c5a2c", accent: "#3bb36a" },
  { id: "smoke", label: "Fumê", ring: "#2a2a2e", groove: "#3a3a40", accent: "#9aa3ad" },
  { id: "clear", label: "Transparente", ring: "#3a4048", groove: "#565e68", accent: "#cfd6dd" },
  { id: "wine", label: "Vinho", ring: "#3a0f1a", groove: "#511522", accent: "#b13a52" },
  { id: "purple", label: "Roxo", ring: "#2a1240", groove: "#3d1c5c", accent: "#9a6cff" },
  { id: "cream", label: "Marfim", ring: "#c9bfa8", groove: "#ddd4c2", accent: "#d9cca8" },
  { id: "white", label: "Branco", ring: "#c8ccd0", groove: "#e4e7ea", accent: "#ffffff" },
  { id: "red", label: "Vermelho", ring: "#5a0f12", groove: "#8a181c", accent: "#e0483c" },
  { id: "gold", label: "Ouro", ring: "#6a5010", groove: "#9a7418", accent: "#e8c56d" },
] as const;

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function clamp255(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

/** Escurece (amt<0) ou clareia (amt>0) uma cor hex. amt em -1..1 */
export function shadeHex(hex: string, amt: number): string {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(f.slice(0, 2), 16);
  const g = parseInt(f.slice(2, 4), 16);
  const b = parseInt(f.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return hex;
  const t = amt < 0 ? 0 : 255;
  const p = Math.abs(amt);
  const to = (v: number) => clamp255((t - v) * p + v).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** Resolve a cor do disco a partir de um id de preset OU de um hex custom (#rrggbb). */
export function resolveDiscColor(color?: string): { ring: string; groove: string; accent: string } {
  if (color && HEX_RE.test(color)) {
    return { ring: shadeHex(color, -0.5), groove: shadeHex(color, -0.05), accent: shadeHex(color, 0.15) };
  }
  const c = DISC_COLORS.find((x) => x.id === color) ?? DISC_COLORS[0];
  return { ring: c.ring, groove: c.groove, accent: c.accent };
}

/** Resolve a cor da borda a partir de um id de preset OU de um hex custom. */
export function resolveBorderColor(color?: string): string {
  if (color && HEX_RE.test(color)) return color;
  const c = DISC_COLORS.find((x) => x.id === color);
  if (c) return c.accent;
  const legacy: Record<string, string> = { brand: "#ff9d2e", mist: "#26c0d4", gold: "#e8c56d", white: "#e8ecef", sunset: "#ff9d2e" };
  return legacy[color ?? ""] ?? "#ff9d2e";
}

/** Estilo/acabamento da superfície do disco */
export const DISC_STYLES = [
  { id: "solid", label: "Sólido" },
  { id: "splatter", label: "Splatter" },
  { id: "marble", label: "Marmorizado" },
  { id: "halfhalf", label: "Bicolor" },
  { id: "galaxy", label: "Galáxia" },
  { id: "haze", label: "Fumê translúcido" },
] as const;

export const LABEL_STYLES = [
  { id: "photo", label: "Foto da Capa" },
  { id: "photo-ring", label: "Foto + Anel" },
  { id: "solid", label: "Cor Sólida" },
  { id: "gradient", label: "Degradê" },
  { id: "logo", label: "Logo Neblina" },
  { id: "vintage", label: "Vintage (creme)" },
  { id: "dark", label: "Preto Fosco" },
  { id: "target", label: "Alvo (anéis)" },
] as const;

/** Tipos de borda do label */
export const BORDER_STYLES = [
  { id: "none", label: "Sem borda" },
  { id: "thin", label: "Fina" },
  { id: "thick", label: "Grossa" },
  { id: "double", label: "Dupla" },
  { id: "dashed", label: "Tracejada" },
] as const;

export type DiscConfig = {
  color: string;
  style?: string;
  label: string;
  labelColor?: string;
  border: string;
  borderColor?: string;
};

export const DEFAULT_DISC_CONFIG: DiscConfig = {
  color: "classic",
  style: "solid",
  label: "photo-ring",
  border: "thin",
  borderColor: "sunset",
};

/** Categorias das fotos reais do disco */
export const PHOTO_CATEGORIES = [
  { id: "frente", label: "Frente (capa)" },
  { id: "contracapa", label: "Contracapa" },
  { id: "disco_a", label: "Disco lado A" },
  { id: "disco_b", label: "Disco lado B" },
  { id: "livreto", label: "Livreto" },
  { id: "encarte", label: "Encarte" },
  { id: "runout", label: "Runout (matriz)" },
  { id: "lombada", label: "Lombada" },
  { id: "danos", label: "Detalhes de danos" },
  { id: "outro", label: "Outro" },
] as const;

/** Neblina IA — estimativa de custo por disco (mostrada no admin) */
export const NEBLINA_AI = {
  identifyCost: "~US$ 0,02",
  fullCost: "~US$ 0,12",
} as const;

/** Níveis de acesso do disco na Audioteca */
export const AUDIOTECA_TIERS = [
  { id: "public", label: "Público", short: "Público", desc: "Disponível para todos, mesmo sem conta." },
  { id: "members", label: "Membros", short: "Membros", desc: "Disponível para usuários cadastrados." },
  { id: "signature", label: "Neblina Signature", short: "Signature", desc: "Nosso clube de assinaturas, em breve." },
] as const;
export type AudiotecaTier = (typeof AUDIOTECA_TIERS)[number]["id"];

/** Estilos de etiqueta/tag exibidas em cima do disco na home */
export const TAG_PRESETS = [
  { id: "bestseller", label: "Mais Vendido", bg: "#ff9d2e", fg: "#241304" },
  { id: "popular", label: "Popular", bg: "#26c0d4", fg: "#04222a" },
  { id: "promo", label: "Promoção", bg: "#e0483c", fg: "#ffffff" },
  { id: "new", label: "Novidade", bg: "#3bb36a", fg: "#04220f" },
  { id: "rare", label: "Raridade", bg: "#e8c56d", fg: "#2a2108" },
] as const;
