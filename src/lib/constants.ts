export const STORE = {
  name: "Neblina Records",
  tagline: "Records Store",
  city: "Nova Friburgo, RJ",
  whatsappPrimary: process.env.NEXT_PUBLIC_WHATSAPP_PRIMARY ?? "5522992657509",
  whatsappSecondary: process.env.NEXT_PUBLIC_WHATSAPP_SECONDARY ?? "5522998382007",
  email: process.env.NEXT_PUBLIC_STORE_EMAIL ?? "neblinarecordnf@gmail.com",
  instagram: process.env.NEXT_PUBLIC_STORE_INSTAGRAM ?? "Neblinarecord",
} as const;

export const QUALITY_GRADES = [
  "Poor",
  "Fair",
  "Good",
  "Very Good",
  "Excellent",
] as const;
export type QualityGrade = (typeof QUALITY_GRADES)[number];

/** Cor/ícone por nota de qualidade (Goldmine-style) */
export const QUALITY_META: Record<QualityGrade, { label: string; color: string }> = {
  Poor: { label: "Poor", color: "#b45252" },
  Fair: { label: "Fair", color: "#c98a3d" },
  Good: { label: "Good", color: "#c9b03d" },
  "Very Good": { label: "Very Good", color: "#6fb84a" },
  Excellent: { label: "Excellent", color: "#19b7a6" },
};

export const RECORD_FORMATS = [
  "LP",
  "EP",
  "Single 7\"",
  "Compacto",
  "78 RPM",
  "CD",
  "Box Set",
  "Picture Disc",
] as const;

export const PAYMENT_METHODS = [
  "Pix",
  "Dinheiro",
  "Cartão de Crédito",
  "Cartão de Débito",
  "Boleto",
  "Transferência",
] as const;

/** Opções do designer de vinil (admin) */
export const DISC_COLORS = [
  { id: "classic", label: "Preto Clássico", ring: "#111111", groove: "#1c1c1c" },
  { id: "midnight", label: "Azul Meia-Noite", ring: "#0f2436", groove: "#16324a" },
  { id: "sunset", label: "Laranja Sol", ring: "#7a3d06", groove: "#994c08" },
  { id: "teal", label: "Verde Névoa", ring: "#0c342f", groove: "#124a42" },
  { id: "smoke", label: "Fumê Translúcido", ring: "#2a2a2e", groove: "#3a3a40" },
  { id: "wine", label: "Vinho", ring: "#3a0f1a", groove: "#511522" },
  { id: "cream", label: "Marfim", ring: "#c9bfa8", groove: "#ddd4c2" },
  { id: "splatter", label: "Splatter Laranja", ring: "#141414", groove: "#1c1c1c" },
] as const;

export const LABEL_STYLES = [
  { id: "photo", label: "Foto da Capa" },
  { id: "photo-ring", label: "Foto + Anel Laranja" },
  { id: "solid", label: "Cor Sólida" },
  { id: "logo", label: "Logo Neblina" },
] as const;

export const BORDER_STYLES = [
  { id: "none", label: "Sem borda" },
  { id: "brand", label: "Anel Laranja" },
  { id: "mist", label: "Anel Névoa" },
  { id: "gold", label: "Fino Dourado" },
] as const;

export type DiscConfig = {
  color: string; // id de DISC_COLORS
  label: string; // id de LABEL_STYLES
  border: string; // id de BORDER_STYLES
  labelColor?: string; // usado quando label = solid
};

export const DEFAULT_DISC_CONFIG: DiscConfig = {
  color: "classic",
  label: "photo-ring",
  border: "brand",
};
