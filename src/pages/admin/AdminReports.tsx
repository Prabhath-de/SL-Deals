import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { adminFetchReports, adminResolveReports, adminUpdate } from "@/lib/api";
import { REPORT_REASONS } from "@/lib/constants";
import { cn, errorMessage, formatDate, timeAgo } from "@/lib/format";
import { EmptyState, ErrorState, Spinner } from "@/components/States";

const reasonLabel = (r: string) => REPORT_REASONS.find((x) => x.value === r)?.label ?? r;

export default function AdminReports() {
  const [status, setStatus] = useState<"open" | "resolved">("open");
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin", "reports", status], queryFn: () => adminFetchReports(status) });

  const m = useMutation({
    mutationFn: async (fn: () => Promise<void>) => fn(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }),
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Reports</h1>
      <p className="mt-1 text-sm text-muted-foreground">Problems visitors flagged on offers.</p>

      <div className="mt-6 flex gap-2">
        {(["open", "resolved"] as const).map((s) => (
          <button key={s} className={cn("chip", status === s && "chip-active")} onClick={() => setStatus(s)}>
            {s === "open" ? "Open" : "Resolved"}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {q.isLoading ? (
          <Spinner />
        ) : q.error ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : !q.data?.length ? (
          <EmptyState icon={<Flag className="h-6 w-6" />} title={status === "open" ? "No open reports" : "No resolved reports yet"} />
        ) : (
          <ul className="panel divide-y divide-border">
            {q.data.map((r) => (
              <li key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{reasonLabel(r.reason)}</p>
                  {r.details && <p className="mt-1 text-sm text-foreground/85">“{r.details}”</p>}
                  {r.deal ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      On <Link to={`/admin/deals/${r.deal.id}`} className="font-medium text-primary hover:underline">{r.deal.title}</Link> ({r.deal.business_name}, ends{" "}
                      {formatDate(r.deal.expiry_date)}){r.deal.is_archived && " — archived"}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">The deal was deleted.</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">{timeAgo(r.created_at)}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {status === "open" && r.deal && !r.deal.is_archived && (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() =>
                        m.mutate(async () => {
                          await adminUpdate([r.deal!.id], { is_archived: true });
                          await adminResolveReports([r.id], "resolved");
                          toast.success("Deal archived and report resolved");
                        })
                      }
                    >
                      Archive deal
                    </button>
                  )}
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() =>
                      m.mutate(async () => {
                        await adminResolveReports([r.id], status === "open" ? "resolved" : "open");
                        toast.success(status === "open" ? "Marked as resolved" : "Reopened");
                      })
                    }
                  >
                    {status === "open" ? "Mark resolved" : "Reopen"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
