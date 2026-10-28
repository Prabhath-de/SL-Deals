export type DealStatus = "pending" | "approved" | "rejected";

export interface Deal {
  id: string;
  title: string;
  business_name: string;
  description: string | null;
  terms: string | null;
  category: string;
  city: string;
  location: string | null;
  bank: string | null;
  discount_percentage: number;
  original_price: number | null;
  deal_price: number | null;
  promo_code: string | null;
  image_url: string | null;
  original_url: string | null;
  start_date: string | null;
  expiry_date: string;
  status: DealStatus;
  rejection_reason: string | null;
  is_featured: boolean;
  is_archived: boolean;
  view_count: number;
  click_count: number;
  submitted_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  submitter?: { full_name: string | null; email: string | null } | null;
}

export type DealInput = Partial<Omit<Deal, "id" | "created_at" | "updated_at" | "submitter">>;

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  user_roles?: { role: "admin" | "user" }[];
}

export interface DealReport {
  id: string;
  deal_id: string;
  user_id: string | null;
  reason: "expired" | "wrong_info" | "spam" | "other";
  details: string | null;
  status: "open" | "resolved";
  created_at: string;
  deal?: Pick<Deal, "id" | "title" | "business_name" | "expiry_date" | "is_archived" | "status"> | null;
}
