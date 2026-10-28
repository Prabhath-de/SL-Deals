import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Clock, CreditCard } from "lucide-react";
import { fetchBankCounts, fetchCategoryCounts, fetchDeals } from "@/lib/api";
import { CATEGORIES } from "@/lib/constants";
import { dealPath, discountText, expiryLabel } from "@/lib/format";
import type { Deal } from "@/lib/types";
import { usePageMeta } from "@/hooks/usePageMeta";
import SearchBox from "@/components/SearchBox";
import CategoryIcon from "@/components/CategoryIcon";
import { DealGrid, DealImage, ExpiryBadge } from "@/components/DealCard";
import { EmptyState, ErrorState } from "@/components/States";

function SectionHead({ title, to, linkText = "See all" }: { title: string; to?: string; linkText?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="text-2xl font-bold sm:text-[1.7rem]">{title}</h2>
      {to && (
        <Link to={to} className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-primary hover:underline">
          {linkText} <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

/** The big featured ticket in the hero. */
function HeroTicket({ deal }: { deal: Deal }) {
  return (
    <Link to={dealPath(deal)} className="group block rounded-3xl border border-border bg-card shadow-[0_24px_60px_-30px_rgba(10,20,40,0.45)]">
      <div className="relative aspect-[16/10] overflow-hidden rounded-t-3xl bg-muted">
        <DealImage deal={deal} className="transition-transform duration-700 group-hover:scale-[1.03]" />
        <span className="stamp absolute bottom-4 right-0 text-3xl">
          {discountText(deal)}
          {deal.discount_percentage > 0 && <span className="ml-1.5 text-base">off</span>}
        </span>
      </div>
      <div className="ticket-tear" aria-hidden />
      <div className="p-5 pt-4">
        <p className="text-sm font-semibold text-primary">{deal.business_name}</p>
        <h3 className="mt-1 line-clamp-2 text-xl font-semibold leading-snug">{deal.title}</h3>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <ExpiryBadge expiry={deal.expiry_date} />
          {deal.bank && <span className="inline-flex items-center gap-1"><CreditCard className="h-4 w-4" />{deal.bank}</span>}
        </div>
      </div>
    </Link>
  );
}

function EndingSoonStrip({ deals }: { deals: Deal[] }) {
  return (
    <div className="scrollbar-none -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
      {deals.map((d) => (
        <Link
          key={d.id}
          to={dealPath(d)}
          className="flex w-[300px] shrink-0 snap-start items-stretch overflow-hidden rounded-2xl border border-border bg-card hover:border-maroon/50"
        >
          <div className="w-24 shrink-0 bg-muted">
            <DealImage deal={d} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 border-l-2 border-dashed border-border p-3.5">
            <div>
              <p className="truncate text-xs font-semibold text-primary">{d.business_name}</p>
              <p className="line-clamp-2 text-sm font-semibold leading-snug">{d.title}</p>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-maroon">
                <Clock className="h-3.5 w-3.5" /> {expiryLabel(d.expiry_date)}
              </span>
              <span className="font-heading text-sm font-bold">{discountText(d)}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function Home() {
  usePageMeta();

  const featured = useQuery({ queryKey: ["deals", "featured"], queryFn: () => fetchDeals({ featured: true, pageSize: 6, sort: "discount" }) });
  const top = useQuery({ queryKey: ["deals", "top"], queryFn: () => fetchDeals({ sort: "discount", pageSize: 1 }) });
  const ending = useQuery({ queryKey: ["deals", "ending"], queryFn: () => fetchDeals({ sort: "ending", pageSize: 10 }) });
  const latest = useQuery({ queryKey: ["deals", "latest"], queryFn: () => fetchDeals({ sort: "newest", pageSize: 12 }) });
  const banks = useQuery({ queryKey: ["bank-counts"], queryFn: fetchBankCounts });
  const cats = useQuery({ queryKey: ["category-counts"], queryFn: fetchCategoryCounts });

  const heroDeal = featured.data?.deals[0] ?? top.data?.deals[0];
  const totalLive = latest.data?.total ?? 0;
  const bankList = Object.entries(banks.data ?? {}).sort((a, b) => b[1] - a[1]);

  return (
    <>
      {/* Hero: search first — that's what people come for */}
      <section className="border-b border-border bg-card">
        <div className="container grid items-center gap-10 py-10 lg:grid-cols-[1.15fr_1fr] lg:py-16">
          <div className="min-w-0">
            <h1 className="max-w-xl text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-[3.4rem]">
              Every offer in Sri Lanka, in one place.
            </h1>
            <p className="mt-4 max-w-lg text-lg text-muted-foreground">
              Bank card discounts, supermarket promos, restaurant deals and online sales — checked before they go live, and gone when they end.
            </p>
            <SearchBox size="lg" className="mt-7 max-w-xl" />
            <div className="scrollbar-none -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1">
              {CATEGORIES.slice(0, 7).map((c) => (
                <Link key={c.slug} to={`/category/${c.slug}`} className="chip">
                  <CategoryIcon slug={c.slug} className="h-4 w-4 text-primary" />
                  {c.name}
                </Link>
              ))}
            </div>
            {totalLive > 0 && (
              <p className="mt-6 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{totalLive.toLocaleString()}</span> live offers right now
              </p>
            )}
          </div>
          <div className="mx-auto w-full max-w-md lg:max-w-none">
            {heroDeal ? (
              <>
                <p className="mb-3 text-sm font-semibold text-muted-foreground">{featured.data?.deals.length ? "Featured offer" : "Biggest discount today"}</p>
                <HeroTicket deal={heroDeal} />
              </>
            ) : (
              <div className="aspect-[4/3] animate-pulse rounded-3xl bg-muted" />
            )}
          </div>
        </div>
      </section>

      <div className="container space-y-16 pt-12">
        {(ending.data?.deals.length ?? 0) > 0 && (
          <section>
            <SectionHead title="Ending soon" to="/deals?sort=ending" />
            <EndingSoonStrip deals={ending.data!.deals} />
          </section>
        )}

        {bankList.length > 0 && (
          <section>
            <SectionHead title="Offers by bank card" to="/deals?bank=any" linkText="All card offers" />
            <div className="flex flex-wrap gap-2.5">
              {bankList.map(([bank, n]) => (
                <Link key={bank} to={`/deals?bank=${encodeURIComponent(bank)}`} className="chip h-11 pl-3 pr-4">
                  <CreditCard className="h-4 w-4 text-primary" />
                  {bank}
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{n}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {(featured.data?.deals.length ?? 0) >= 4 && (
          <section>
            <SectionHead title="Featured offers" />
            <DealGrid deals={featured.data!.deals.slice(1, 5)} />
          </section>
        )}

        <section>
          <SectionHead title="Just added" to="/deals" linkText="Browse all offers" />
          {latest.error ? (
            <ErrorState error={latest.error} onRetry={() => latest.refetch()} />
          ) : (
            <DealGrid
              deals={latest.data?.deals}
              loading={latest.isLoading}
              empty={
                <EmptyState
                  title="No offers yet"
                  body="Be the first to share an offer you've seen in a shop, on Facebook or from your bank."
                  action={<Link to="/submit" className="btn btn-primary">Share a deal</Link>}
                />
              }
            />
          )}
        </section>

        <section>
          <SectionHead title="Browse by category" to="/categories" linkText="All categories" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {CATEGORIES.map((c) => (
              <Link key={c.slug} to={`/category/${c.slug}`} className="panel flex flex-col gap-3 p-4 hover:border-primary/50">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <CategoryIcon slug={c.slug} className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold leading-tight">{c.name}</span>
                <span className="text-xs text-muted-foreground">{cats.data?.[c.slug] ?? 0} live</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl bg-primary px-6 py-10 text-primary-foreground sm:px-10">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-xl">
              <h2 className="text-2xl font-bold sm:text-3xl">Saw a good offer? Share it.</h2>
              <p className="mt-2 text-primary-foreground/85">
                Post a deal from a shop, a bank SMS or a Facebook page. We check it and publish it so everyone can save.
              </p>
            </div>
            <Link to="/submit" className="btn shrink-0 bg-saffron text-saffron-foreground hover:bg-saffron/90">
              Share a deal
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
