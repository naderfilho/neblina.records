import type { QualityGrade, DiscConfig } from "./constants";

export type UserRole = "customer" | "admin";

export type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  birth_date: string | null;
  created_at: string;
  last_login_at: string | null;
};

export type ExtraBlock = {
  id: string;
  type: "text" | "heading" | "quote" | "spec";
  title?: string;
  content?: string;
  key?: string;
  value?: string;
};

export type Track = {
  id: string;
  side: "A" | "B";
  title: string;
  audio_url: string | null;
  /** número do disco (1, 2, 3…) para álbuns duplos/triplos. Ausente = disco 1. */
  disc?: number;
};

export type ConditionInfo = {
  scratches?: string;
  noise?: string;
  warp?: string;
  marks?: string;
};

export type IncludedContent = {
  booklet?: boolean;
  insert?: boolean;
  poster?: boolean;
  sticker?: boolean;
  original_sleeve?: boolean;
};

export type HistoryInfo = {
  context?: string;
  curiosities?: string;
  historical_importance?: string;
  career_position?: string;
  musical_influence?: string;
};

export type MarketInfo = {
  price_range?: string;
  avg_international?: string;
  avg_brazil?: string;
  rarity?: number; // 0-5
};

export type IdentificationInfo = {
  matrix_a?: string;
  matrix_b?: string;
  label_code?: string;
  series?: string;
  sound_mode?: string; // "Mono" | "Estéreo"
  disc_count?: string; // "Simples" | "Duplo" | "Triplo"
  rpm?: string;        // rotação: "33" | "45" | "78"
  recorded_at?: string;  // Gravado em (estúdio/cidade/país)
  mixed_at?: string;     // Mixado em
  mastered_at?: string;  // Masterizado em
  pressed_at?: string;   // Prensado em (país/cidade)
};

export type SaleInfo = {
  availability?: string;
  warranty?: string;
  return_policy?: string;
};

export type Tag = {
  id: string;
  label: string;
  bg: string;
  fg: string;
  style: string;
  font?: string; // "sans" | "display" | "serif" | "mono"
  size?: string; // "sm" | "md" | "lg"
  created_at?: string;
};

export type RecordItem = {
  id: string;
  title: string;
  artist: string;
  genre: string | null;
  nationality: string | null;
  format: string | null;
  weight_grams: number | null;
  disc_quality: QualityGrade | null;
  cover_quality: QualityGrade | null;
  price: number;
  payment_methods: string[];
  description: string | null;
  cover_image_url: string | null;
  cover_image_url_b: string | null;
  is_gatefold: boolean;
  gatefold_image_url: string | null;
  gatefold_dir: "side" | "down";
  is_autographed: boolean;
  autograph_photo_url: string | null;
  audioteca_tier: "public" | "members" | "signature";
  disc_config: DiscConfig;
  audio_url: string | null;
  audio_start: number;
  audio_end: number | null;
  tracks: Track[];
  home_track_id: string | null;
  condition: ConditionInfo;
  included_content: IncludedContent;
  history: HistoryInfo;
  market: MarketInfo;
  identification: IdentificationInfo;
  sale_info: SaleInfo;
  tag_ids: string[];
  sort_order: number;
  extra_blocks: ExtraBlock[];
  year: number | null;
  catalog_number: string | null;
  label_company: string | null;
  views_count: number;
  stock_qty: number;
  availability: "available" | "reserved" | "unavailable" | "sold";
  is_published: boolean;
  is_featured: boolean;
  sold: boolean;
  sold_channel: string | null;
  sold_to_user_id: string | null;
  sold_to_name: string | null;
  sold_at: string | null;
  sold_note: string | null;
  created_at: string;
  updated_at: string;
};

export type RecordPhoto = {
  id: string;
  record_id: string;
  url: string;
  category: string;
  sort_order: number;
  created_at: string;
};

export type Comment = {
  id: string;
  record_id: string;
  user_id: string | null;
  author_name: string | null;
  body: string;
  is_question: boolean;
  parent_id: string | null;
  created_at: string;
};

export type StoreEvent = {
  id: string;
  title: string;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  description: string | null;
  url: string | null;
  is_published: boolean;
  created_at: string;
};

export type NotificationType = "event_presence" | "disc_promo" | "weekly_promo" | "custom";

export type UserNotification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  record_id: string | null;
  read_at: string | null;
  created_at: string;
};

export type EventRequest = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  event_type: string | null;
  event_date: string | null;
  message: string | null;
  status: string;
  created_at: string;
};
