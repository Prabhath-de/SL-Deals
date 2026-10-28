import { supabase } from "@/integrations/supabase/client";
import { PAGE_SIZE, type SortKey } from "./constants";
import { cleanSearch, todayLK } from "./format";
import type { Deal, DealInput, DealReport, DealStatus, Profile } from "./types";

// ---------------------------------------------------------------------------
// Public deals
// ---------------------------------------------------------------------------

export interface DealFilters {
  q?: string;
  category?: string;
  city?: string;
  bank?: string;
  minDiscount?: number;
  sort?: SortKey;
  page?: number;
  pageSize?: number;
  featured?: boolean;
  excludeId?: string;
}

/** Live deals: approved, not archived, not expired. RLS also hides non-approved rows. */
export async function fetchDeals(f: DealFilters = {}) {
  const pageSize = f.pageSize ?? PAGE_SIZE;
  const page = Math.max(1, f.page ?? 1);

  let query = supabase
    .from("deals")
    .select("*", { count: "exact" })
    .eq("status", "approved")
    .eq("is_archived", false)
    .gte("expiry_date", todayLK());

  if (f.category) query = query.eq("category", f.category);
  if (f.city) query = query.in("city", [f.city, "Islandwide"]);
  if (f.bank === "any") query = query.not("bank", "is", null);
  else if (f.bank) query = query.eq("bank", f.bank);
  if (f.minDiscount) query = query.gte("discount_percentage", f.minDiscount);
  if (f.featured) query = query.eq("is_featured", true);
  if (f.excludeId) query = query.neq("id", f.excludeId);

  const q = f.q ? cleanSearch(f.q) : "";
  if (q) {
    query = query.or(
      `title.ilike.%${q}%,business_name.ilike.%${q}%,description.ilike.%${q}%,bank.ilike.%${q}%`
    );
  }

  switch (f.sort) {
    case "ending":
      query = query.order("expiry_date", { ascending: true }).order("discount_percentage", { ascending: false });
      break;
    case "discount":
      query = query.order("discount_percentage", { ascending: false }).order("created_at", { ascending: false });
      break;
    case "popular":
      query = query.order("view_count", { ascending: false }).order("created_at", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const from = (page - 1) * pageSize;
  const { data, error, count } = await query.range(from, from + pageSize - 1);
  if (error) throw error;
  return { deals: (data ?? []) as Deal[], total: count ?? 0 };
}

export async function fetchDeal(id: string) {
  const { data, error } = await supabase.from("deals").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Deal | null;
}

/** Number of live deals per category, for the category pages. */
export async function fetchCategoryCounts() {
  const { data, error } = await supabase
    .from("deals")
    .select("category")
    .eq("status", "approved")
    .eq("is_archived", false)
    .gte("expiry_date", todayLK())
    .limit(5000);
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as { category: string }[]) counts[row.category] = (counts[row.category] ?? 0) + 1;
  return counts;
}

/** Banks that currently have live card offers, with counts. */
export async function fetchBankCounts() {
  const { data, error } = await supabase
    .from("deals")
    .select("bank")
    .eq("status", "approved")
    .eq("is_archived", false)
    .gte("expiry_date", todayLK())
    .not("bank", "is", null)
    .limit(5000);
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as { bank: string }[]) counts[row.bank] = (counts[row.bank] ?? 0) + 1;
  return counts;
}

export async function trackView(id: string) {
  try {
    const key = `viewed:${id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    /* storage unavailable — still count */
  }
  await supabase.rpc("increment_deal_view", { deal_id: id });
}

export async function trackClick(id: string) {
  await supabase.rpc("increment_deal_click", { deal_id: id });
}

export async function reportDeal(dealId: string, reason: string, details: string) {
  const { data } = await supabase.auth.getUser();
  const { error } = await supabase.from("deal_reports").insert({
    deal_id: dealId,
    reason,
    details: details.trim() || null,
    user_id: data.user?.id ?? null,
  });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Signed-in users
// ---------------------------------------------------------------------------

export async function fetchSavedIds(userId: string) {
  const { data, error } = await supabase.from("saved_deals").select("deal_id").eq("user_id", userId);
  if (error) throw error;
  return new Set(((data ?? []) as { deal_id: string }[]).map((r) => r.deal_id));
}

export async function fetchSavedDeals(userId: string) {
  const { data, error } = await supabase
    .from("saved_deals")
    .select("created_at, deal:deals(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as { deal: Deal | null }[]).map((r) => r.deal).filter(Boolean) as Deal[];
}

export async function setSaved(userId: string, dealId: string, saved: boolean) {
  if (saved) {
    const { error } = await supabase.from("saved_deals").insert({ user_id: userId, deal_id: dealId });
    if (error && error.code !== "23505") throw error;
  } else {
    const { error } = await supabase.from("saved_deals").delete().eq("user_id", userId).eq("deal_id", dealId);
    if (error) throw error;
  }
}

export async function fetchMySubmissions(userId: string) {
  const { data, error } = await supabase
    .from("deals")
    .select("*")
    .eq("submitted_by", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Deal[];
}

export async function submitDeal(input: DealInput) {
  const { data: auth } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("deals")
    .insert({ ...input, submitted_by: auth.user?.id })
    .select()
    .single();
  if (error) throw error;
  return data as Deal;
}

export async function uploadDealImage(file: File, userId: string) {
  if (file.size > 5 * 1024 * 1024) throw new Error("Image must be smaller than 5 MB.");
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Use a JPG, PNG or WebP image.");
  }
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("deal-images").upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
  });
  if (error) throw error;
  return supabase.storage.from("deal-images").getPublicUrl(path).data.publicUrl;
}

export async function updateProfileName(userId: string, fullName: string) {
  const { error } = await supabase.from("profiles").update({ full_name: fullName.trim() }).eq("id", userId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export type AdminTab = "pending" | "live" | "expired" | "rejected" | "archived" | "all";

export async function adminFetchDeals(tab: AdminTab, q: string, page: number, pageSize = 25) {
  let query = supabase
    .from("deals")
    .select("*, submitter:profiles(full_name, email)", { count: "exact" });
  const today = todayLK();

  switch (tab) {
    case "pending":
      query = query.eq("status", "pending").eq("is_archived", false);
      break;
    case "live":
      query = query.eq("status", "approved").eq("is_archived", false).gte("expiry_date", today);
      break;
    case "expired":
      query = query.eq("status", "approved").eq("is_archived", false).lt("expiry_date", today);
      break;
    case "rejected":
      query = query.eq("status", "rejected").eq("is_archived", false);
      break;
    case "archived":
      query = query.eq("is_archived", true);
      break;
  }

  const s = cleanSearch(q);
  if (s) query = query.or(`title.ilike.%${s}%,business_name.ilike.%${s}%`);

  const from = (page - 1) * pageSize;
  const { data, error, count } = await query
    .order(tab === "pending" ? "created_at" : "updated_at", { ascending: tab === "pending" })
    .range(from, from + pageSize - 1);
  if (error) throw error;
  return { deals: (data ?? []) as Deal[], total: count ?? 0 };
}

export async function adminFetchDeal(id: string) {
  const { data, error } = await supabase
    .from("deals")
    .select("*, submitter:profiles(full_name, email)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Deal | null;
}

export async function adminSaveDeal(id: string | null, input: DealInput) {
  if (id) {
    const { data, error } = await supabase.from("deals").update(input).eq("id", id).select().single();
    if (error) throw error;
    return data as Deal;
  }
  const { data, error } = await supabase.from("deals").insert(input).select().single();
  if (error) throw error;
  return data as Deal;
}

export async function adminSetStatus(ids: string[], status: DealStatus, rejectionReason?: string) {
  const { error } = await supabase
    .from("deals")
    .update({ status, rejection_reason: status === "rejected" ? rejectionReason || null : null })
    .in("id", ids);
  if (error) throw error;
}

export async function adminUpdate(ids: string[], patch: DealInput) {
  const { error } = await supabase.from("deals").update(patch).in("id", ids);
  if (error) throw error;
}

export async function adminDelete(ids: string[]) {
  const { error } = await supabase.from("deals").delete().in("id", ids);
  if (error) throw error;
}

async function countDeals(apply: (q: any) => any) {
  const { count, error } = await apply(supabase.from("deals").select("id", { count: "exact", head: true }));
  if (error) throw error;
  return count ?? 0;
}

export async function adminStats() {
  const today = todayLK();
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const [live, pending, expired, newThisWeek, reports, users, top] = await Promise.all([
    countDeals((q) => q.eq("status", "approved").eq("is_archived", false).gte("expiry_date", today)),
    countDeals((q) => q.eq("status", "pending").eq("is_archived", false)),
    countDeals((q) => q.eq("status", "approved").eq("is_archived", false).lt("expiry_date", today)),
    countDeals((q) => q.gte("created_at", weekAgo)),
    supabase.from("deal_reports").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("deals")
      .select("id, title, business_name, view_count, click_count, expiry_date")
      .eq("status", "approved")
      .order("view_count", { ascending: false })
      .limit(8),
  ]);
  const totals = await supabase.from("deals").select("view_count, click_count").eq("status", "approved").limit(10000);
  const views = ((totals.data ?? []) as { view_count: number; click_count: number }[]).reduce(
    (a, r) => ({ views: a.views + r.view_count, clicks: a.clicks + r.click_count }),
    { views: 0, clicks: 0 }
  );
  return {
    live,
    pending,
    expired,
    newThisWeek,
    openReports: reports.count ?? 0,
    users: users.count ?? 0,
    views: views.views,
    clicks: views.clicks,
    top: (top.data ?? []) as Pick<Deal, "id" | "title" | "business_name" | "view_count" | "click_count" | "expiry_date">[],
  };
}

export async function adminFetchReports(status: "open" | "resolved") {
  const { data, error } = await supabase
    .from("deal_reports")
    .select("*, deal:deals(id, title, business_name, expiry_date, is_archived, status)")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as DealReport[];
}

export async function adminResolveReports(ids: string[], status: "open" | "resolved") {
  const { error } = await supabase.from("deal_reports").update({ status }).in("id", ids);
  if (error) throw error;
}

export async function adminFetchUsers(q: string) {
  let query = supabase
    .from("profiles")
    .select("*, user_roles(role)")
    .order("created_at", { ascending: false })
    .limit(200);
  const s = cleanSearch(q);
  if (s) query = query.or(`full_name.ilike.%${s}%,email.ilike.%${s}%`);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function adminSetAdmin(userId: string, makeAdmin: boolean) {
  if (makeAdmin) {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
    if (error && error.code !== "23505") throw error;
  } else {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
    if (error) throw error;
  }
}

/** All deals as rows, for CSV export. */
export async function adminExportDeals() {
  const all: Deal[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .order("created_at", { ascending: true })
      .range(from, from + 999);
    if (error) throw error;
    all.push(...((data ?? []) as Deal[]));
    if (!data || data.length < 1000) break;
  }
  return all;
}
