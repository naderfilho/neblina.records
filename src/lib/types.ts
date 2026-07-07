import type { QualityGrade, DiscConfig } from "./constants";

export type UserRole = "customer" | "admin";

export type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
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
  disc_config: DiscConfig;
  audio_url: string | null;
  audio_start: number;
  audio_end: number | null;
  extra_blocks: ExtraBlock[];
  year: number | null;
  catalog_number: string | null;
  label_company: string | null;
  views_count: number;
  stock_qty: number;
  is_published: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
};

export type RecordPhoto = {
  id: string;
  record_id: string;
  url: string;
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
