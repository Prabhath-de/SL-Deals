import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { adminFetchDeal, adminSaveDeal } from "@/lib/api";
import { dealPath, formatDate } from "@/lib/format";
import type { DealStatus } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import DealForm from "@/components/DealForm";
import { Spinner } from "@/components/States";
import NotFound from "@/pages/NotFound";

export default function AdminDealEditor() {
  const { id } = useParams();
  const isNew = !id;
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: deal, isLoading } = useQuery({ queryKey: ["admin", "deal", id], queryFn: () => adminFetchDeal(id!), enabled: !isNew });

  const [status, setStatus] = useState<DealStatus | null>(null);
  const [featured, setFeatured] = useState<boolean | null>(null);
  const [archived, setArchived] = useState<boolean | null>(null);
  const [reason, setReason] = useState<string | null>(null);

  if (!isNew && isLoading) return <Spinner />;
  if (!isNew && !deal) return <NotFound />;

  const st = status ?? deal?.status ?? "approved";
  const ft = featured ?? deal?.is_featured ?? false;
  const ar = archived ?? deal?.is_archived ?? false;
  const rs = reason ?? deal?.rejection_reason ?? "";

  const extra = (
    <section className="grid gap-5 rounded-2xl bg-secondary/60 p-5">
      <h2 className="text-lg font-semibold">Publishing</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="status">Status</label>
          <select id="status" className="field" value={st} onChange={(e) => setStatus(e.target.value as DealStatus)}>
            <option value="approved">Live (approved)</option>
            <option value="pending">Waiting for review</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="grid content-end gap-3">
          <label className="flex items-center gap-3 text-sm font-medium">
            <input type="checkbox" checked={ft} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 accent-[hsl(var(--primary))]" />
            Feature on the home page
          </label>
          <label className="flex items-center gap-3 text-sm font-medium">
            <input type="checkbox" checked={ar} onChange={(e) => setArchived(e.target.checked)} className="h-4 w-4 accent-[hsl(var(--primary))]" />
            Archived (hidden everywhere)
          </label>
        </div>
      </div>
      {st === "rejected" && (
        <div>
          <label className="label" htmlFor="reason">Reason shown to the sender</label>
          <input id="reason" className="field" value={rs} onChange={(e) => setReason(e.target.value)} />
        </div>
      )}
    </section>
  );

  return (
    <div className="max-w-3xl">
      <Link to="/admin/deals" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Deals
      </Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-bold">{isNew ? "Add a deal" : "Edit deal"}</h1>
        {deal && deal.status === "approved" && (
          <Link to={dealPath(deal)} target="_blank" className="btn btn-outline btn-sm">
            View on site <ExternalLink className="h-4 w-4" />
          </Link>
        )}
      </div>
      {deal && (
        <p className="mt-1 text-sm text-muted-foreground">
          {deal.submitter ? `Sent by ${deal.submitter.full_name || "a user"} (${deal.submitter.email})` : "Added by an admin"} on {formatDate(deal.created_at)}
          {deal.status === "approved" && ` · ${deal.view_count} views · ${deal.click_count} clicks`}
        </p>
      )}

      <div className="panel mt-6 p-5 sm:p-8">
        <DealForm
          key={deal?.id ?? "new"}
          initial={deal}
          userId={user!.id}
          allowPastExpiry
          submitLabel={isNew ? "Publish deal" : "Save changes"}
          extra={extra}
          onSubmit={async (input) => {
            const saved = await adminSaveDeal(id ?? null, {
              ...input,
              status: st,
              is_featured: ft,
              is_archived: ar,
              rejection_reason: st === "rejected" ? rs.trim() || null : null,
            });
            qc.invalidateQueries({ queryKey: ["admin"] });
            qc.invalidateQueries({ queryKey: ["deals"] });
            qc.invalidateQueries({ queryKey: ["deal", saved.id] });
            toast.success(isNew ? "Deal published" : "Changes saved");
            if (isNew) navigate(`/admin/deals/${saved.id}`, { replace: true });
          }}
        />
      </div>
    </div>
  );
}
