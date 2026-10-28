import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { BANKS, CATEGORIES, CITIES } from "@/lib/constants";
import { uploadDealImage } from "@/lib/api";
import { errorMessage, safeUrl, todayLK } from "@/lib/format";
import type { Deal, DealInput } from "@/lib/types";

export interface DealFormValues {
  title: string;
  business_name: string;
  category: string;
  bank: string;
  discount_percentage: string;
  original_price: string;
  deal_price: string;
  promo_code: string;
  city: string;
  location: string;
  start_date: string;
  expiry_date: string;
  original_url: string;
  description: string;
  terms: string;
  image_url: string;
}

export function toFormValues(d?: Partial<Deal> | null): DealFormValues {
  return {
    title: d?.title ?? "",
    business_name: d?.business_name ?? "",
    category: d?.category ?? "",
    bank: d?.bank ?? "",
    discount_percentage: d?.discount_percentage ? String(d.discount_percentage) : "",
    original_price: d?.original_price != null ? String(d.original_price) : "",
    deal_price: d?.deal_price != null ? String(d.deal_price) : "",
    promo_code: d?.promo_code ?? "",
    city: d?.city ?? "Islandwide",
    location: d?.location ?? "",
    start_date: d?.start_date ?? "",
    expiry_date: d?.expiry_date ?? "",
    original_url: d?.original_url ?? "",
    description: d?.description ?? "",
    terms: d?.terms ?? "",
    image_url: d?.image_url ?? "",
  };
}

const num = (s: string) => (s.trim() === "" ? null : Number(s));

export function toDealInput(v: DealFormValues): DealInput {
  return {
    title: v.title.trim(),
    business_name: v.business_name.trim(),
    category: v.category,
    bank: v.bank || null,
    discount_percentage: Math.round(Number(v.discount_percentage) || 0),
    original_price: num(v.original_price),
    deal_price: num(v.deal_price),
    promo_code: v.promo_code.trim() || null,
    city: v.city || "Islandwide",
    location: v.location.trim() || null,
    start_date: v.start_date || null,
    expiry_date: v.expiry_date,
    original_url: safeUrl(v.original_url),
    description: v.description.trim() || null,
    terms: v.terms.trim() || null,
    image_url: v.image_url || null,
  };
}

function validate(v: DealFormValues, allowPastExpiry: boolean) {
  const e: Partial<Record<keyof DealFormValues, string>> = {};
  if (v.title.trim().length < 5) e.title = "Write a short title of at least 5 characters.";
  if (v.title.trim().length > 140) e.title = "Keep the title under 140 characters.";
  if (!v.business_name.trim()) e.business_name = "Add the shop, brand or bank name.";
  if (!v.category) e.category = "Choose a category.";
  const pct = Number(v.discount_percentage || 0);
  if (Number.isNaN(pct) || pct < 0 || pct > 100) e.discount_percentage = "Use a number from 0 to 100.";
  for (const k of ["original_price", "deal_price"] as const) {
    if (v[k].trim() && (Number.isNaN(Number(v[k])) || Number(v[k]) < 0)) e[k] = "Use a price in rupees, numbers only.";
  }
  if (!v.expiry_date) e.expiry_date = "Add the last day of the offer.";
  else if (!allowPastExpiry && v.expiry_date < todayLK()) e.expiry_date = "This date has already passed.";
  if (v.start_date && v.expiry_date && v.start_date > v.expiry_date) e.start_date = "Start date must be before the end date.";
  if (v.original_url.trim() && !safeUrl(v.original_url)) e.original_url = "Paste a full link, like https://example.lk/offer";
  if (!pct && !v.deal_price.trim() && !v.description.trim()) {
    e.discount_percentage = "Add a discount, a deal price or a short description of the offer.";
  }
  return e;
}

function Field({ label, error, hint, children, className }: { label: string; error?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
      {error ? <p className="mt-1.5 text-xs font-medium text-destructive">{error}</p> : hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export default function DealForm({
  initial,
  userId,
  submitLabel,
  onSubmit,
  allowPastExpiry = false,
  extra,
}: {
  initial?: Partial<Deal> | null;
  userId: string;
  submitLabel: string;
  onSubmit: (input: DealInput) => Promise<void>;
  allowPastExpiry?: boolean;
  /** Extra admin-only controls rendered above the submit button. */
  extra?: ReactNode;
}) {
  const [v, setV] = useState<DealFormValues>(() => toFormValues(initial));
  const [errors, setErrors] = useState<Partial<Record<keyof DealFormValues, string>>>({});
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof DealFormValues) => (e: { target: { value: string } }) => setV((p) => ({ ...p, [k]: e.target.value }));

  const upload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadDealImage(file, userId);
      setV((p) => ({ ...p, image_url: url }));
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(v, allowPastExpiry);
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error("Please fix the highlighted fields.");
      document.querySelector("[data-invalid='true']")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSaving(true);
    try {
      await onSubmit(toDealInput(v));
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const inv = (k: keyof DealFormValues) => ({ "data-invalid": errors[k] ? "true" : undefined, "aria-invalid": !!errors[k] });

  return (
    <form onSubmit={submit} noValidate className="grid gap-8">
      <section className="grid gap-5">
        <h2 className="text-lg font-semibold">The offer</h2>
        <Field label="Title" error={errors.title} hint="What the offer is, in one line. E.g. 25% off all pizzas with Sampath cards">
          <input className="field" value={v.title} onChange={set("title")} maxLength={140} {...inv("title")} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Shop, brand or business" error={errors.business_name}>
            <input className="field" value={v.business_name} onChange={set("business_name")} maxLength={100} placeholder="E.g. Keells, Pizza Hut, Daraz" {...inv("business_name")} />
          </Field>
          <Field label="Category" error={errors.category}>
            <select className="field" value={v.category} onChange={set("category")} {...inv("category")}>
              <option value="">Choose a category</option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Discount %" error={errors.discount_percentage}>
            <input className="field" inputMode="numeric" value={v.discount_percentage} onChange={set("discount_percentage")} placeholder="E.g. 30" {...inv("discount_percentage")} />
          </Field>
          <Field label="Usual price (Rs.)" error={errors.original_price} hint="Optional">
            <input className="field" inputMode="decimal" value={v.original_price} onChange={set("original_price")} {...inv("original_price")} />
          </Field>
          <Field label="Offer price (Rs.)" error={errors.deal_price} hint="Optional">
            <input className="field" inputMode="decimal" value={v.deal_price} onChange={set("deal_price")} {...inv("deal_price")} />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Bank or card" hint="Only if the offer needs a specific bank card">
            <select className="field" value={v.bank} onChange={set("bank")}>
              <option value="">No card needed</option>
              {BANKS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </Field>
          <Field label="Promo code" hint="Optional">
            <input className="field font-mono uppercase" value={v.promo_code} onChange={(e) => setV((p) => ({ ...p, promo_code: e.target.value.toUpperCase() }))} maxLength={40} />
          </Field>
        </div>
      </section>

      <section className="grid gap-5">
        <h2 className="text-lg font-semibold">When and where</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Starts" error={errors.start_date} hint="Leave empty if it has already started">
            <input type="date" className="field" value={v.start_date} onChange={set("start_date")} {...inv("start_date")} />
          </Field>
          <Field label="Last day" error={errors.expiry_date}>
            <input type="date" className="field" value={v.expiry_date} onChange={set("expiry_date")} min={allowPastExpiry ? undefined : todayLK()} {...inv("expiry_date")} />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="City">
            <select className="field" value={v.city} onChange={set("city")}>
              {CITIES.map((c) => (
                <option key={c} value={c}>{c === "Islandwide" ? "Islandwide (all branches)" : c}</option>
              ))}
            </select>
          </Field>
          <Field label="Branch or address" hint="Optional">
            <input className="field" value={v.location} onChange={set("location")} maxLength={200} placeholder="E.g. Keells Super, Union Place" />
          </Field>
        </div>
        <Field label="Link to the offer" error={errors.original_url} hint="The shop's page or Facebook post where people can check the offer">
          <input className="field" type="url" value={v.original_url} onChange={set("original_url")} placeholder="https://" {...inv("original_url")} />
        </Field>
      </section>

      <section className="grid gap-5">
        <h2 className="text-lg font-semibold">Details</h2>
        <Field label="Description" hint="What do people get? Any minimum spend?">
          <textarea className="field" rows={4} value={v.description} onChange={set("description")} maxLength={3000} />
        </Field>
        <Field label="Terms and conditions" hint="Optional. One per line works best">
          <textarea className="field" rows={4} value={v.terms} onChange={set("terms")} maxLength={3000} />
        </Field>
        <div>
          <span className="label">Image</span>
          {v.image_url ? (
            <div className="relative w-full max-w-sm overflow-hidden rounded-xl border border-border">
              <img src={v.image_url} alt="Offer" className="aspect-[16/10] w-full object-cover" />
              <button type="button" onClick={() => setV((p) => ({ ...p, image_url: "" }))} className="absolute right-2 top-2 rounded-full bg-card/90 p-1.5 shadow" aria-label="Remove image">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex w-full max-w-sm flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input px-6 py-8 text-sm text-muted-foreground hover:border-primary hover:text-foreground"
            >
              {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
              {uploading ? "Uploading…" : "Add the offer poster or a photo"}
              <span className="text-xs">JPG, PNG or WebP, up to 5 MB</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
        </div>
      </section>

      {extra}

      <div className="flex justify-end border-t border-border pt-6">
        <button type="submit" className="btn btn-primary min-w-40" disabled={saving || uploading}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
