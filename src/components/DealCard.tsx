import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { CreditCard, Heart, MapPin } from "lucide-react";
import type { Deal } from "@/lib/types";
import { cn, daysLeft, dealPath, discountText, expiryLabel, formatLKR } from "@/lib/format";
import { useSaved } from "@/hooks/useSaved";
import CategoryIcon from "./CategoryIcon";

export function DealImage({ deal, className }: { deal: Pick<Deal, "image_url" | "title" | "category">; className?: string }) {
  if (deal.image_url) {
    return (
      <img
        src={deal.image_url}
        alt={deal.title}
        loading="lazy"
        className={cn("h-full w-full object-cover", className)}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }
  return (
    <div className={cn("flex h-full w-full items-center justify-center bg-accent text-accent-foreground", className)}>
      <CategoryIcon slug={deal.category} className="h-10 w-10 opacity-70" strokeWidth={1.5} />
    </div>
  );
}

export function ExpiryBadge({ expiry, className }: { expiry: string; className?: string }) {
  const d = daysLeft(expiry);
  const urgent = d >= 0 && d <= 2;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        d < 0 && "bg-muted text-muted-foreground",
        urgent && "bg-maroon text-maroon-foreground",
        !urgent && d >= 0 && "bg-secondary text-secondary-foreground",
        className
      )}
    >
      {expiryLabel(expiry)}
    </span>
  );
}

export default function DealCard({ deal, className }: { deal: Deal; className?: string }) {
  const { isSaved, toggle } = useSaved();
  const saved = isSaved(deal.id);

  return (
    <article className={cn("group relative flex flex-col rounded-2xl border border-border bg-card", className)}>
      <Link to={dealPath(deal)} className="absolute inset-0 z-[1] rounded-2xl" aria-label={deal.title} />

      <div className="relative aspect-[16/10] overflow-hidden rounded-t-2xl bg-muted">
        <DealImage deal={deal} className="transition-transform duration-500 group-hover:scale-[1.03]" />
        <span className="stamp absolute bottom-3 right-0 text-lg">{discountText(deal)}{deal.discount_percentage > 0 && <span className="ml-1 text-xs font-semibold">off</span>}</span>
      </div>

      <div className="ticket-tear" aria-hidden />

      <div className="flex flex-1 flex-col gap-2 p-4 pt-3.5">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-primary">{deal.business_name}</p>
          <button
            type="button"
            onClick={() => toggle(deal.id)}
            className="relative z-[2] -mr-1.5 rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-maroon"
            aria-label={saved ? "Remove from saved" : "Save offer"}
            aria-pressed={saved}
          >
            <Heart className={cn("h-[18px] w-[18px]", saved && "fill-maroon text-maroon")} />
          </button>
        </div>

        <h3 className="line-clamp-2 font-heading text-[1.05rem] font-semibold leading-snug text-foreground">{deal.title}</h3>

        {deal.deal_price ? (
          <p className="text-sm">
            <span className="font-semibold text-foreground">{formatLKR(deal.deal_price)}</span>
            {deal.original_price ? (
              <span className="ml-2 text-muted-foreground line-through">{formatLKR(deal.original_price)}</span>
            ) : null}
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-2 text-xs text-muted-foreground">
          <ExpiryBadge expiry={deal.expiry_date} />
          {deal.bank ? (
            <span className="inline-flex items-center gap-1">
              <CreditCard className="h-3.5 w-3.5" /> {deal.bank}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {deal.city}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export function DealCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col rounded-2xl border border-border bg-card">
      <div className="aspect-[16/10] rounded-t-2xl bg-muted" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-1/3 rounded bg-muted" />
        <div className="h-4 w-5/6 rounded bg-muted" />
        <div className="h-4 w-2/3 rounded bg-muted" />
        <div className="h-6 w-24 rounded-full bg-muted" />
      </div>
    </div>
  );
}

export function DealGrid({
  deals,
  loading,
  skeletons = 8,
  empty,
}: {
  deals?: Deal[];
  loading?: boolean;
  skeletons?: number;
  empty?: ReactNode;
}) {
  if (loading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: skeletons }).map((_, i) => (
          <DealCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  if (!deals?.length) return <>{empty}</>;
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {deals.map((d) => (
        <DealCard key={d.id} deal={d} />
      ))}
    </div>
  );
}
