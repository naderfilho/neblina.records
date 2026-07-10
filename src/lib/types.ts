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
  is_gatefold: boolean;
  gatefold_image_url: string | null;
  gatefold_dir: "side" | "down";
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
