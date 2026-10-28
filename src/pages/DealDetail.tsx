import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Check, ChevronRight, Copy, CreditCard, ExternalLink, Flag, Heart, MapPin, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { fetchDeal, fetchDeals, trackClick, trackView } from "@/lib/api";
import { categoryBySlug } from "@/lib/constants";
import { SITE } from "@/lib/site";
import { cn, daysLeft, dealPath, discountText, formatDate, formatLKR, hostOf, safeUrl, todayLK } from "@/lib/format";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useSaved } from "@/hooks/useSaved";
import { useAuth } from "@/hooks/useAuth";
import { DealGrid, DealImage, ExpiryBadge } from "@/components/DealCard";
import ShareButtons from "@/components/ShareButtons";
import ReportDialog from "@/components/ReportDialog";
import { Spinner } from "@/components/States";
import NotFound from "./NotFound";

function PromoCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          toast.success("Promo code copied");
          setTimeout(() => setCopied(false), 2000);
        } catch {
          toast.error("Couldn't copy — select the code and copy it");
        }
      }}
      className="flex w-full items-center justify-between gap-3 rounded-xl border-2 border-dashed border-saffron bg-saffron/10 px-4 py-3 text-left"
    >
      <span>
        <span className="block text-xs font-medium text-muted-foreground">Promo code</span>
        <span className="font-mono text-lg font-bold tracking-wider">{code}</span>
      </span>
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
}

export default function DealDetail() {
  const { id = "" } = useParams();
  const { isSaved, toggle } = useSaved();
  const { isAdmin } = useAuth();
  const [reportOpen, setReportOpen] = useState(false);

  const { data: deal, isLoading, error } = useQuery({ queryKey: ["deal", id], queryFn: () => fetchDeal(id) });
  const related = useQuery({
    queryKey: ["deals", "related", deal?.category, id],
    queryFn: () => fetchDeals({ category: deal!.category, excludeId: id, pageSize: 4, sort: "popular" }),
    enabled: !!deal,
  });

  const cat = deal ? categoryBySlug(deal.category) : undefined;
  usePageMeta(
    deal ? `${deal.title} – ${deal.business_name}` : undefined,
    deal ? (deal.description || `${discountText(deal)} offer from ${deal.business_name}. ${cat?.name ?? ""}`).slice(0, 160) : undefined,
    deal?.image_url
  );

  useEffect(() => {
    if (deal?.status === "approved") trackView(deal.id).catch(() => undefined);
  }, [deal?.id, deal?.status]);

  if (isLoading) return <Spinner label="Loading offer" />;
  if (error || !deal) return <NotFound />;

  const left = daysLeft(deal.expiry_date);
  const ended = left < 0 || deal.is_archived;
  const notStarted = deal.start_date && deal.start_date > todayLK();
  const link = safeUrl(deal.original_url);
  const shareUrl = `${SITE.url}${dealPath(deal)}`;
  const saved = isSaved(deal.id);
  const terms = (deal.terms ?? "").split("\n").map((t) => t.replace(/^[-•*\s]+/, "").trim()).filter(Boolean);

  return (
    <div className="container py-6 sm:py-10">
      <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link to="/deals" className="hover:text-foreground">Offers</Link>
        {cat && (
          <>
            <ChevronRight className="h-4 w-4" />
            <Link to={`/category/${cat.slug}`} className="hover:text-foreground">{cat.name}</Link>
          </>
        )}
      </nav>

      {deal.status !== "approved" && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-saffron/50 bg-saffron/10 p-4 text-sm">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-saffron" />
          <div>
            <p className="font-semibold">{deal.status === "pending" ? "Waiting for review" : "Not published"}</p>
            <p className="text-muted-foreground">
              {deal.status === "pending" ? "Only you and the admins can see this offer until it's approved." : deal.rejection_reason || "This offer was not approved."}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-x-12">
        <div className="order-1 lg:order-none lg:col-start-1 lg:row-start-1">
          <div className={cn("relative aspect-[16/10] overflow-hidden rounded-3xl border border-border bg-muted", ended && "grayscale")}>
            <DealImage deal={deal} />
            <span className="stamp absolute bottom-5 right-0 text-4xl">
              {discountText(deal)}
              {deal.discount_percentage > 0 && <span className="ml-1.5 text-lg">off</span>}
            </span>
          </div>
        </div>

        <div className="order-3 lg:order-none lg:col-start-1 lg:row-start-2">
          {deal.description && (
            <section>
              <h2 className="mb-3 text-xl font-semibold">About this offer</h2>
              <p className="whitespace-pre-line leading-relaxed text-foreground/90">{deal.description}</p>
            </section>
          )}

          {terms.length > 0 && (
            <section className={deal.description ? "mt-8" : ""}>
              <h2 className="mb-3 text-xl font-semibold">Terms and conditions</h2>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-foreground/85 marker:text-muted-foreground">
                {terms.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="order-2 lg:order-none lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          <div className="rounded-3xl border border-border bg-card">
            <div className="p-6">
              <Link to={`/deals?q=${encodeURIComponent(deal.business_name)}`} className="text-sm font-semibold text-primary hover:underline">
                {deal.business_name}
              </Link>
              <h1 className="mt-1.5 text-2xl font-bold leading-tight sm:text-3xl">{deal.title}</h1>

              {deal.deal_price ? (
                <p className="mt-4 text-2xl font-heading font-bold">
                  {formatLKR(deal.deal_price)}
                  {deal.original_price ? <span className="ml-3 text-base font-normal text-muted-foreground line-through">{formatLKR(deal.original_price)}</span> : null}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {deal.is_archived ? <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">Removed</span> : <ExpiryBadge expiry={deal.expiry_date} />}
                {notStarted && <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">Starts {formatDate(deal.start_date)}</span>}
              </div>
            </div>

            <div className="ticket-tear" aria-hidden />

            <div className="space-y-4 p-6">
              {ended ? (
                <div className="rounded-xl bg-muted p-4 text-sm">
                  <p className="font-semibold">This offer has ended</p>
                  <p className="mt-1 text-muted-foreground">See similar live offers below.</p>
                </div>
              ) : (
                <>
                  {deal.promo_code && <PromoCode code={deal.promo_code} />}
                  {link && (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      onClick={() => trackClick(deal.id).catch(() => undefined)}
                      className="btn btn-primary h-12 w-full text-base"
                    >
                      Get this offer on {hostOf(link)} <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </>
              )}
              <button className={cn("btn btn-outline w-full", saved && "border-maroon text-maroon")} onClick={() => toggle(deal.id)} aria-pressed={saved}>
                <Heart className={cn("h-4 w-4", saved && "fill-maroon")} /> {saved ? "Saved" : "Save for later"}
              </button>

              <dl className="grid gap-3 border-t border-border pt-4 text-sm">
                <div className="flex gap-3">
                  <dt className="sr-only">Valid</dt>
                  <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <dd>
                    {deal.start_date ? `${formatDate(deal.start_date)} – ` : "Until "}
                    {formatDate(deal.expiry_date)}
                  </dd>
                </div>
                <div className="flex gap-3">
                  <dt className="sr-only">Where</dt>
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <dd>{[deal.location, deal.city === "Islandwide" ? "All branches islandwide" : deal.city].filter(Boolean).join(", ")}</dd>
                </div>
                {deal.bank && (
                  <div className="flex gap-3">
                    <dt className="sr-only">Card</dt>
                    <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <dd>
                      With <Link to={`/deals?bank=${encodeURIComponent(deal.bank)}`} className="font-semibold text-primary hover:underline">{deal.bank}</Link> cards
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold">Share with friends</p>
            <ShareButtons title={`${deal.title} – ${deal.business_name}`} url={shareUrl} />
          </div>

          <div className="mt-5 flex items-center justify-between text-sm">
            <button onClick={() => setReportOpen(true)} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
              <Flag className="h-4 w-4" /> Report a problem
            </button>
            {isAdmin && (
              <Link to={`/admin/deals/${deal.id}`} className="font-semibold text-primary hover:underline">
                Edit in admin
              </Link>
            )}
          </div>
        </aside>
      </div>

      {(related.data?.deals.length ?? 0) > 0 && (
        <section className="mt-16">
          <h2 className="mb-5 text-2xl font-bold">More {cat ? cat.name.toLowerCase() : "offers"}</h2>
          <DealGrid deals={related.data!.deals} />
        </section>
      )}

      <ReportDialog dealId={deal.id} open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  );
}
