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
  "EP",
  'Single 7"',
  "Compacto",
  "78 RPM",
  "CD",
  "Box Set",
  "Picture Disc",
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

/** Opções do designer de vinil (admin) */
export const DISC_COLORS = [
  { id: "classic", label: "Preto Clássico", ring: "#111111", groove: "#1c1c1c" },
  { id: "midnight", label: "Azul Meia-Noite", ring: "#0f2436", groove: "#16324a" },
  { id: "ocean", label: "Azul Oceano", ring: "#0b3a63", groove: "#125089" },
  { id: "sunset", label: "Laranja Sol", ring: "#7a3d06", groove: "#994c08" },
  { id: "amber", label: "Âmbar", ring: "#5a3a08", groove: "#8a5a10" },
  { id: "teal", label: "Verde Névoa", ring: "#0c342f", groove: "#124a42" },
  { id: "forest", label: "Verde Floresta", ring: "#123a1c", groove: "#1c5a2c" },
  { id: "smoke", label: "Fumê Translúcido", ring: "#2a2a2e", groove: "#3a3a40" },
  { id: "clear", label: "Transparente", ring: "#3a4048", groove: "#565e68" },
  { id: "wine", label: "Vinho", ring: "#3a0f1a", groove: "#511522" },
  { id: "purple", label: "Roxo", ring: "#2a1240", groove: "#3d1c5c" },
  { id: "cream", label: "Marfim", ring: "#c9bfa8", groove: "#ddd4c2" },
  { id: "white", label: "Branco", ring: "#c8ccd0", groove: "#e4e7ea" },
  { id: "red", label: "Vermelho", ring: "#5a0f12", groove: "#8a181c" },
  { id: "gold", label: "Ouro", ring: "#6a5010", groove: "#9a7418" },
  { id: "splatter", label: "Splatter", ring: "#141414", groove: "#1c1c1c" },
] as const;

export const LABEL_STYLES = [
  { id: "photo", label: "Foto da Capa" },
  { id: "photo-ring", label: "Foto + Anel" },
  { id: "solid", label: "Cor Sólida" },
  { id: "logo", label: "Logo Neblina" },
  { id: "vintage", label: "Vintage (creme)" },
  { id: "dark", label: "Preto Fosco" },
] as const;

export const BORDER_STYLES = [
  { id: "none", label: "Sem borda" },
  { id: "brand", label: "Anel Laranja" },
  { id: "mist", label: "Anel Névoa" },
  { id: "gold", label: "Fino Dourado" },
  { id: "double", label: "Duplo" },
  { id: "white", label: "Branco" },
] as const;

export type DiscConfig = {
  color: string;
  label: string;
  border: string;
  labelColor?: string;
};

export const DEFAULT_DISC_CONFIG: DiscConfig = {
  color: "classic",
  label: "photo-ring",
  border: "brand",
};

/** Estilos de etiqueta/tag exibidas em cima do disco na home */
export const TAG_PRESETS = [
  { id: "bestseller", label: "Mais Vendido", bg: "#ff9d2e", fg: "#241304" },
  { id: "popular", label: "Popular", bg: "#26c0d4", fg: "#04222a" },
  { id: "promo", label: "Promoção", bg: "#e0483c", fg: "#ffffff" },
  { id: "new", label: "Novidade", bg: "#3bb36a", fg: "#04220f" },
  { id: "rare", label: "Raridade", bg: "#e8c56d", fg: "#2a2108" },
] as const;
