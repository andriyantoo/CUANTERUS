export type UserRole = "member" | "admin";

export type SubscriptionStatus = "active" | "expired" | "cancelled" | "pending";

export type PaymentStatus = "pending" | "paid" | "expired" | "failed";

export type SignalDirection = "long" | "short";

export type SignalStatus =
  | "active"
  | "tp1_hit"
  | "tp2_hit"
  | "tp3_hit"
  | "sl_hit"
  | "closed"
  | "cancelled";

export type OutlookCategory = "daily" | "weekly" | "special";

export type ProductSlug = "forex" | "crypto" | "cuantroopers";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  slug: ProductSlug;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Plan {
  id: string;
  product_id: string;
  name: string;
  duration_months: number;
  price_idr: number;
  original_price_idr: number | null;
  is_active: boolean;
  created_at: string;
  product?: Product;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  product_id: string;
  status: SubscriptionStatus;
  starts_at: string;
  expires_at: string;
  created_at: string;
  plan?: Plan;
  product?: Product;
}

export interface Payment {
  id: string;
  user_id: string;
  subscription_id: string | null;
  xendit_invoice_id: string | null;
  xendit_external_id: string | null;
  amount_idr: number;
  status: PaymentStatus;
  payment_method: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface Course {
  id: string;
  product_id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  product?: Product;
  lessons?: Lesson[];
  lesson_count?: number;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  slug: string;
  description: string | null;
  video_url: string | null;
  duration_seconds: number | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  last_position_seconds: number;
  completed_at: string | null;
  updated_at: string;
}

export interface MarketOutlook {
  id: string;
  product_id: string;
  title: string;
  slug: string;
  content: string;
  cover_image_url: string | null;
  category: OutlookCategory;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface Signal {
  id: string;
  product_id: string;
  pair: string;
  direction: SignalDirection;
  entry_price: number | null;
  stop_loss: number | null;
  take_profit_1: number | null;
  take_profit_2: number | null;
  take_profit_3: number | null;
  status: SignalStatus;
  notes: string | null;
  is_published: boolean;
  published_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export type InsightCategory = "daily" | "weekly" | "monthly" | "special";

export interface MarketInsight {
  id: string;
  product_id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  category: InsightCategory;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  product?: Product;
}

// Forum types
export type ChannelType = "text" | "forum" | "announcement";
export type ReactionType = "upvote" | "helpful" | "fire" | "eyes";

export interface ForumChannel {
  id: string;
  product_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  channel_type: ChannelType;
  is_pinned: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  product?: Product;
  thread_count?: number;
}

export interface ForumThread {
  id: string;
  channel_id: string;
  author_id: string;
  title: string;
  body: string;
  tags: string[];
  is_pinned: boolean;
  is_solved: boolean;
  is_locked: boolean;
  upvote_count: number;
  reply_count: number;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
  author?: Profile;
  channel?: ForumChannel;
}

export interface ForumReply {
  id: string;
  thread_id: string;
  author_id: string;
  body: string;
  is_best_answer: boolean;
  upvote_count: number;
  created_at: string;
  updated_at: string;
  author?: Profile;
}

export interface ForumReaction {
  id: string;
  user_id: string;
  thread_id: string | null;
  reply_id: string | null;
  reaction_type: ReactionType;
  created_at: string;
}
