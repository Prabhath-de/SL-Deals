import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Check, Download, Pencil, Plus, Search, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  adminDelete,
  adminExportDeals,
  adminFetchDeals,
  adminSetStatus,
  adminUpdate,
  type AdminTab,
} from "@/lib/api";
import { cn, dealPath, discountText, errorMessage, formatDate, isExpired, timeAgo } from "@/lib/format";
import type { Deal } from "@/lib/types";
import { categoryName } from "@/components/CategoryIcon";
import { DealImage, ExpiryBadge } from "@/components/DealCard";
import { EmptyState, ErrorState, Spinner } from "@/components/States";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";
import { StatusPill } from "@/pages/Account";

const TABS: { id: AdminTab; label: string }[] = [
  { id: "pending", label: "Waiting for review" },
  { id: "live", label: "Live" },
  { id: "expired", label: "Expired" },
  { id: "rejected", label: "Rejected" },
  { id: "archived", label: "Archived" },
  { id: "all", label: "All" },
];

const PAGE = 25;

const REJECT_PRESETS = [
  "Couldn't verify this offer — please add a link or photo of the poster.",
  "This offer has already ended.",
  "This offer is already listed.",
  "Not a public offer.",
];

function toCsv(rows: Deal[]) {
  const cols: (keyof Deal)[] = [
    "id", "title", "business_name", "category", "bank", "discount_percentage", "original_price", "deal_price", "promo_code",
    "city", "location", "start_date", "expiry_date", "original_url", "image_url", "description", "terms", "status",
    "is_featured", "is_archived", "view_count", "click_count", "created_at",
  ];
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

export default function AdminDeals() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as AdminTab) || "pending";
  const page = Number(params.get("page") ?? 1) || 1;
  const [search, setSearch] = useState(params.get("q") ?? "");
  const q = params.get("q") ?? "";
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rejecting, setRejecting] = useState<string[] | null>(null);
  const [reason, setReason] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    setSelected(new Set());
  }, [tab, page, q]);

  const list = useQuery({
    queryKey: ["admin", "deals", tab, q, page],
    queryFn: () => adminFetchDeals(tab, q, page, PAGE),
    placeholderData: keepPreviousData,
  });

  const run = useMutation({
    mutationFn: async (fn: () => Promise<void>) => fn(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      qc.invalidateQueries({ queryKey: ["deals"] });
      setSelected(new Set());
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const act = (fn: () => Promise<void>, msg: string) => run.mutate(fn, { onSuccess: () => toast.success(msg) });

  const setTab = (t: AdminTab) => setParams(t === "pending" ? {} : { tab: t });
  const deals = list.data?.deals ?? [];
  const allChecked = deals.length > 0 && deals.every((d) => selected.has(d.id));
  const ids = [...selected];

  const exportCsv = async () => {
    try {
      const rows = await adminExportDeals();
      const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `deals-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Deals</h1>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="btn btn-outline btn-sm"><Download className="h-4 w-4" /> Export CSV</button>
          <Link to="/admin/deals/new" className="btn btn-primary btn-sm"><Plus className="h-4 w-4" /> Add a deal</Link>
        </div>
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-border" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-semibold",
              tab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form
        className="relative mt-4 max-w-sm"
        onSubmit={(e) => {
          e.preventDefault();
          const next = new URLSearchParams(params);
          if (search.trim()) next.set("q", search.trim());
          else next.delete("q");
          next.delete("page");
          setParams(next);
        }}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input className="field h-10 pl-9" placeholder="Search title or business" value={search} onChange={(e) => setSearch(e.target.value)} />
      </form>

      {selected.size > 0 && (
        <div className="sticky top-14 z-20 mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-background lg:top-2">
          <span className="mr-2 text-sm font-semibold">{selected.size} selected</span>
          <BulkBtn onClick={() => act(() => adminSetStatus(ids, "approved"), "Approved")}><Check className="h-4 w-4" /> Approve</BulkBtn>
          <BulkBtn onClick={() => { setReason(""); setRejecting(ids); }}><X className="h-4 w-4" /> Reject</BulkBtn>
          <BulkBtn onClick={() => act(() => adminUpdate(ids, { is_featured: true }), "Featured")}><Star className="h-4 w-4" /> Feature</BulkBtn>
          <BulkBtn onClick={() => act(() => adminUpdate(ids, { is_archived: tab !== "archived" }), tab === "archived" ? "Restored" : "Archived")}>
            <Archive className="h-4 w-4" /> {tab === "archived" ? "Restore" : "Archive"}
          </BulkBtn>
          <BulkBtn onClick={() => setConfirmDelete(ids)}><Trash2 className="h-4 w-4" /> Delete</BulkBtn>
          <button className="ml-auto text-sm underline" onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      <div className="mt-4">
        {list.isLoading ? (
          <Spinner />
        ) : list.error ? (
          <ErrorState error={list.error} onRetry={() => list.refetch()} />
        ) : deals.length === 0 ? (
          <EmptyState title={tab === "pending" ? "Nothing to review" : "No deals here"} body={tab === "pending" ? "New submissions from users will appear here." : undefined} />
        ) : (
          <div className="panel overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border px-4 py-2.5 text-xs text-muted-foreground">
              <input
                type="checkbox"
                aria-label="Select all"
                checked={allChecked}
                onChange={() => setSelected(allChecked ? new Set() : new Set(deals.map((d) => d.id)))}
                className="h-4 w-4 accent-[hsl(var(--primary))]"
              />
              {list.data?.total.toLocaleString()} deals
            </div>
            <ul className="divide-y divide-border">
              {deals.map((d) => (
                <li key={d.id} className={cn("flex gap-3 px-4 py-4", selected.has(d.id) && "bg-accent/50")}>
                  <input
                    type="checkbox"
                    aria-label={`Select ${d.title}`}
                    checked={selected.has(d.id)}
                    onChange={() =>
                      setSelected((s) => {
                        const n = new Set(s);
                        if (n.has(d.id)) n.delete(d.id);
                        else n.add(d.id);
                        return n;
                      })
                    }
                    className="mt-1 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
                  />
                  <div className="hidden h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted sm:block">
                    <DealImage deal={d} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill status={d.status} expired={isExpired(d)} />
                      {d.is_featured && <span className="inline-flex items-center gap-1 rounded-full bg-saffron/20 px-2 py-0.5 text-xs font-semibold"><Star className="h-3 w-3" /> Featured</span>}
                      {d.is_archived && <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">Archived</span>}
                      <span className="font-heading text-sm font-bold">{discountText(d)}</span>
                    </div>
                    <Link to={`/admin/deals/${d.id}`} className="mt-1 block font-semibold hover:underline">{d.title}</Link>
                    <p className="text-sm text-muted-foreground">
                      {d.business_name} · {categoryName(d.category)}{d.bank ? ` · ${d.bank}` : ""} · ends {formatDate(d.expiry_date)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {d.submitter ? `Sent by ${d.submitter.full_name || d.submitter.email} (${d.submitter.email}) · ` : "Added by admin · "}
                      {timeAgo(d.created_at)}
                      {d.status === "approved" && ` · ${d.view_count} views · ${d.click_count} clicks`}
                    </p>
                    {d.status === "rejected" && d.rejection_reason && <p className="mt-1 text-xs text-destructive">Reason: {d.rejection_reason}</p>}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-start">
                    {d.status !== "approved" && (
                      <button className="btn btn-primary btn-sm" onClick={() => act(() => adminSetStatus([d.id], "approved"), "Approved — it's live")}>
                        <Check className="h-4 w-4" /> Approve
                      </button>
                    )}
                    {d.status === "pending" && (
                      <button className="btn btn-outline btn-sm" onClick={() => { setReason(""); setRejecting([d.id]); }}>Reject</button>
                    )}
                    <Link to={`/admin/deals/${d.id}`} className="btn btn-ghost btn-sm px-2.5" aria-label="Edit"><Pencil className="h-4 w-4" /></Link>
                    {d.status === "approved" && !d.is_archived && (
                      <Link to={dealPath(d)} target="_blank" className="hidden text-xs font-semibold text-primary hover:underline sm:inline sm:pt-2.5">View</Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <Pagination
        page={page}
        total={list.data?.total ?? 0}
        pageSize={PAGE}
        onChange={(p) => {
          const next = new URLSearchParams(params);
          next.set("page", String(p));
          setParams(next);
        }}
      />

      <Modal
        open={!!rejecting}
        onClose={() => setRejecting(null)}
        title={rejecting && rejecting.length > 1 ? `Reject ${rejecting.length} deals` : "Reject this deal"}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setRejecting(null)}>Cancel</button>
            <button
              className="btn btn-danger"
              onClick={() => {
                const target = rejecting!;
                setRejecting(null);
                act(() => adminSetStatus(target, "rejected", reason.trim()), "Rejected");
              }}
            >
              Reject
            </button>
          </>
        }
      >
        <p className="mb-3 text-sm text-muted-foreground">The person who sent it will see this reason in their account.</p>
        <div className="mb-3 flex flex-wrap gap-2">
          {REJECT_PRESETS.map((p) => (
            <button key={p} className={cn("chip h-auto py-1.5 text-left text-xs", reason === p && "chip-active")} onClick={() => setReason(p)}>
              {p}
            </button>
          ))}
        </div>
        <textarea className="field" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Or write your own reason" />
      </Modal>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete permanently?"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
            <button
              className="btn btn-danger"
              onClick={() => {
                const target = confirmDelete!;
                setConfirmDelete(null);
                act(() => adminDelete(target), "Deleted");
              }}
            >
              Delete {confirmDelete?.length === 1 ? "deal" : `${confirmDelete?.length} deals`}
            </button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          This can't be undone, and it removes the deal from everyone's saved list. To hide a deal but keep its history, archive it instead.
        </p>
      </Modal>
    </div>
  );
}

function BulkBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 rounded-full bg-background/15 px-3 py-1.5 text-xs font-semibold hover:bg-background/25">
      {children}
    </button>
  );
}
