import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { adminStats } from "@/lib/api";
import { dealPath } from "@/lib/format";
import { ErrorState, Spinner } from "@/components/States";
import { ExpiryBadge } from "@/components/DealCard";

function Stat({ label, value, to, tone }: { label: string; value: number; to?: string; tone?: "alert" }) {
  const body = (
    <>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-1 font-heading text-3xl font-bold ${tone === "alert" && value > 0 ? "text-maroon" : ""}`}>{value.toLocaleString()}</p>
    </>
  );
  return to ? (
    <Link to={to} className="panel p-5 hover:border-primary/50">{body}</Link>
  ) : (
    <div className="panel p-5">{body}</div>
  );
}

export default function AdminDashboard() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["admin", "stats"], queryFn: adminStats });

  if (isLoading) return <Spinner />;
  if (error || !data) return <ErrorState error={error} onRetry={() => refetch()} />;

  const ctr = data.views ? ((data.clicks / data.views) * 100).toFixed(1) : "0";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Overview</h1>
        <Link to="/admin/deals/new" className="btn btn-primary btn-sm">
          <Plus className="h-4 w-4" /> Add a deal
        </Link>
      </div>

      {data.pending > 0 && (
        <Link to="/admin/deals?tab=pending" className="mt-6 flex items-center justify-between rounded-2xl bg-maroon px-5 py-4 text-maroon-foreground">
          <span className="font-semibold">
            {data.pending} {data.pending === 1 ? "deal is" : "deals are"} waiting for review
          </span>
          <span className="text-sm font-semibold underline">Review now</span>
        </Link>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Live deals" value={data.live} to="/admin/deals?tab=live" />
        <Stat label="Waiting for review" value={data.pending} to="/admin/deals?tab=pending" tone="alert" />
        <Stat label="Open reports" value={data.openReports} to="/admin/reports" tone="alert" />
        <Stat label="Expired, not archived" value={data.expired} to="/admin/deals?tab=expired" />
        <Stat label="Added this week" value={data.newThisWeek} />
        <Stat label="Registered users" value={data.users} to="/admin/users" />
        <Stat label="Offer views" value={data.views} />
        <div className="panel p-5">
          <p className="text-sm text-muted-foreground">Clicks to shops</p>
          <p className="mt-1 font-heading text-3xl font-bold">{data.clicks.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{ctr}% of views</p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Most viewed deals</h2>
        {data.top.length === 0 ? (
          <p className="text-sm text-muted-foreground">No views yet.</p>
        ) : (
          <div className="panel overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Deal</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Views</th>
                  <th className="px-4 py-3 text-right font-medium">Clicks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.top.map((d) => (
                  <tr key={d.id}>
                    <td className="max-w-xs px-4 py-3">
                      <Link to={dealPath(d)} className="block truncate font-medium hover:underline">{d.title}</Link>
                      <span className="text-xs text-muted-foreground">{d.business_name}</span>
                    </td>
                    <td className="px-4 py-3"><ExpiryBadge expiry={d.expiry_date} /></td>
                    <td className="px-4 py-3 text-right tabular-nums">{d.view_count.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{d.click_count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
