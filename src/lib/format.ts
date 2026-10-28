import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Deal } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Today's date in Sri Lanka as YYYY-MM-DD (deals expire at the end of this day). */
export function todayLK(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo" }).format(new Date());
}

function dayDiff(from: string, to: string) {
  const a = Date.UTC(+from.slice(0, 4), +from.slice(5, 7) - 1, +from.slice(8, 10));
  const b = Date.UTC(+to.slice(0, 4), +to.slice(5, 7) - 1, +to.slice(8, 10));
  return Math.round((b - a) / 86400000);
}

/** Days left including today: 0 = ends today, negative = ended. */
export function daysLeft(expiry: string) {
  return dayDiff(todayLK(), expiry);
}

export function isExpired(deal: Pick<Deal, "expiry_date">) {
  return daysLeft(deal.expiry_date) < 0;
}

export function expiryLabel(expiry: string) {
  const d = daysLeft(expiry);
  if (d < 0) return "Ended";
  if (d === 0) return "Ends today";
  if (d === 1) return "Ends tomorrow";
  if (d <= 7) return `${d} days left`;
  return `Until ${formatDate(expiry)}`;
}

export function formatDate(date: string | null | undefined) {
  if (!date) return "";
  const d = new Date(date.length === 10 ? `${date}T00:00:00` : date);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function timeAgo(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days} d ago`;
  return formatDate(iso);
}

export function formatLKR(n: number | null | undefined) {
  if (n === null || n === undefined) return "";
  return `Rs. ${Number(n).toLocaleString("en-LK", { maximumFractionDigits: 2 })}`;
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function dealPath(deal: Pick<Deal, "id" | "title">) {
  return `/deal/${deal.id}/${slugify(deal.title)}`;
}

/** Discount as shown on the stamp: "40%" or "Rs. 500 off" or "Offer". */
export function discountText(deal: Pick<Deal, "discount_percentage" | "original_price" | "deal_price">) {
  if (deal.discount_percentage > 0) return `${deal.discount_percentage}%`;
  if (deal.original_price && deal.deal_price && deal.original_price > deal.deal_price) {
    return `Rs. ${Math.round(deal.original_price - deal.deal_price).toLocaleString("en-LK")}`;
  }
  return "Offer";
}

export function safeUrl(url: string | null | undefined) {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export function hostOf(url: string | null | undefined) {
  const u = safeUrl(url);
  return u ? new URL(u).hostname.replace(/^www\./, "") : "";
}

/** Strip characters that would break a PostgREST `or()` filter. */
export function cleanSearch(q: string) {
  return q.replace(/[,()*%\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function errorMessage(e: unknown) {
  if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message);
  return "Something went wrong. Please try again.";
}
