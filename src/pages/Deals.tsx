import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, X } from "lucide-react";
import { fetchDeals } from "@/lib/api";
import { BANKS, CATEGORIES, CITIES, PAGE_SIZE, SORTS, categoryBySlug, type SortKey } from "@/lib/constants";
import { cn } from "@/lib/format";
import { usePageMeta } from "@/hooks/usePageMeta";
import { DealGrid } from "@/components/DealCard";
import { EmptyState, ErrorState } from "@/components/States";
import Pagination from "@/components/Pagination";
import CategoryIcon from "@/components/CategoryIcon";
import NotFound from "./NotFound";

const DISCOUNTS = [0, 10, 25, 50];

export default function Deals() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const category = slug ?? params.get("category") ?? "";
  const cat = categoryBySlug(category);
  const q = params.get("q") ?? "";
  const city = params.get("city") ?? "";
  const bank = params.get("bank") ?? "";
  const minDiscount = Number(params.get("min") ?? 0) || 0;
  const sort = (params.get("sort") as SortKey) || "newest";
  const page = Math.max(1, Number(params.get("page") ?? 1) || 1);

  const heading = q
    ? `Results for “${q}”`
    : cat
      ? cat.name
      : bank === "any"
        ? "Bank card offers"
        : bank
          ? `${bank} card offers`
          : sort === "ending"
            ? "Offers ending soon"
            : "All offers";

  usePageMeta(heading, cat ? `${cat.name} offers and discounts in Sri Lanka — ${cat.blurb.toLowerCase()}.` : undefined);

  const query = useQuery({
    queryKey: ["deals", "browse", { q, category, city, bank, minDiscount, sort, page }],
    queryFn: () => fetchDeals({ q, category, city, bank, minDiscount, sort, page }),
    placeholderData: keepPreviousData,
  });

  if (slug && !cat) return <NotFound />;

  const update = (patch: Record<string, string | number | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, val] of Object.entries(patch)) {
      if (val === null || val === "" || val === 0) next.delete(k);
      else next.set(k, String(val));
    }
    if (!("page" in patch)) next.delete("page");
    setParams(next);
  };

  const activeFilters = [
    q && { key: "q", label: `“${q}”` },
    !slug && category && { key: "category", label: cat?.name ?? category },
    city && { key: "city", label: city },
    bank && { key: "bank", label: bank === "any" ? "Any bank card" : bank },
    minDiscount && { key: "min", label: `${minDiscount}%+ off` },
  ].filter(Boolean) as { key: string; label: string }[];

  const total = query.data?.total ?? 0;

  return (
    <div className="container py-8 sm:py-10">
      <header className="mb-6">
        {cat && (
          <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <CategoryIcon slug={cat.slug} className="h-5 w-5" />
          </span>
        )}
        <h1 className="text-3xl font-bold sm:text-4xl">{heading}</h1>
        <p className="mt-2 text-muted-foreground">
          {query.isLoading ? "Finding offers…" : `${total.toLocaleString()} live ${total === 1 ? "offer" : "offers"}`}
          {cat && !query.isLoading && ` · ${cat.blurb}`}
        </p>
      </header>

      {/* Filter bar */}
      <div className="sticky top-16 z-30 -mx-4 mb-6 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <button className="btn btn-outline btn-sm md:hidden" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
            <SlidersHorizontal className="h-4 w-4" /> Filters{activeFilters.length ? ` (${activeFilters.length})` : ""}
          </button>
          <div className={cn("w-full flex-wrap items-center gap-2 md:flex", showFilters ? "flex" : "hidden")}>
            {!slug && (
              <select className="field h-9 w-auto rounded-full text-sm" value={category} onChange={(e) => update({ category: e.target.value })} aria-label="Category">
                <option value="">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            )}
            <select className="field h-9 w-auto rounded-full text-sm" value={bank} onChange={(e) => update({ bank: e.target.value })} aria-label="Bank card">
              <option value="">Any payment</option>
              <option value="any">Any bank card offer</option>
              {BANKS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <select className="field h-9 w-auto rounded-full text-sm" value={city} onChange={(e) => update({ city: e.target.value })} aria-label="City">
              <option value="">All of Sri Lanka</option>
              {CITIES.filter((c) => c !== "Islandwide").map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="flex gap-1.5" role="group" aria-label="Minimum discount">
              {DISCOUNTS.map((d) => (
                <button key={d} className={cn("chip h-9", minDiscount === d && "chip-active")} onClick={() => update({ min: d })}>
                  {d === 0 ? "Any %" : `${d}%+`}
                </button>
              ))}
            </div>
          </div>
          <select
            className="field ml-auto h-9 w-auto shrink-0 rounded-full text-sm"
            value={sort}
            onChange={(e) => update({ sort: e.target.value === "newest" ? null : e.target.value })}
            aria-label="Sort by"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {activeFilters.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeFilters.map((f) => (
              <button key={f.key} onClick={() => update({ [f.key]: null })} className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                {f.label} <X className="h-3.5 w-3.5" aria-label="Remove filter" />
              </button>
            ))}
            <button onClick={() => setParams(new URLSearchParams(sort !== "newest" ? { sort } : {}))} className="text-xs font-semibold text-muted-foreground underline-offset-2 hover:underline">
              Clear all
            </button>
          </div>
        )}
      </div>

      {query.error ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <div className={cn(query.isFetching && !query.isLoading && "opacity-60 transition-opacity")}>
          <DealGrid
            deals={query.data?.deals}
            loading={query.isLoading}
            empty={
              <EmptyState
                title="No live offers match"
                body={activeFilters.length ? "Try removing a filter, or search for the shop name only." : "New offers are added every day. Check back soon, or share one you've seen."}
                action={
                  activeFilters.length ? (
                    <button className="btn btn-outline" onClick={() => setParams(new URLSearchParams())}>Clear filters</button>
                  ) : (
                    <Link to="/submit" className="btn btn-primary">Share a deal</Link>
                  )
                }
              />
            }
          />
        </div>
      )}

      <Pagination
        page={page}
        total={total}
        pageSize={PAGE_SIZE}
        onChange={(p) => {
          update({ page: p === 1 ? null : p });
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </div>
  );
}
