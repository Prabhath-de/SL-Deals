import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Heart, Plus } from "lucide-react";
import { toast } from "sonner";
import { fetchMySubmissions, fetchSavedDeals, updateProfileName } from "@/lib/api";
import { cn, dealPath, errorMessage, formatDate, isExpired } from "@/lib/format";
import type { DealStatus } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePageMeta } from "@/hooks/usePageMeta";
import { DealGrid, DealImage } from "@/components/DealCard";
import { EmptyState, ErrorState, Spinner } from "@/components/States";

const TABS = [
  { id: "saved", label: "Saved offers" },
  { id: "submissions", label: "My submissions" },
  { id: "profile", label: "Profile" },
] as const;

export function StatusPill({ status, expired }: { status: DealStatus; expired?: boolean }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "In review", cls: "bg-saffron/20 text-foreground" },
    approved: { label: "Live", cls: "bg-success/15 text-success" },
    rejected: { label: "Not approved", cls: "bg-destructive/10 text-destructive" },
    expired: { label: "Ended", cls: "bg-muted text-muted-foreground" },
  };
  const s = map[status === "approved" && expired ? "expired" : status];
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", s.cls)}>{s.label}</span>;
}

function Saved({ userId }: { userId: string }) {
  const q = useQuery({ queryKey: ["saved-deals", userId], queryFn: () => fetchSavedDeals(userId) });
  if (q.error) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  return (
    <DealGrid
      deals={q.data}
      loading={q.isLoading}
      skeletons={4}
      empty={
        <EmptyState
          icon={<Heart className="h-6 w-6" />}
          title="No saved offers yet"
          body="Tap the heart on any offer to keep it here. Saved offers stay on all your devices."
          action={<Link to="/deals" className="btn btn-primary">Browse offers</Link>}
        />
      }
    />
  );
}

function Submissions({ userId }: { userId: string }) {
  const q = useQuery({ queryKey: ["my-submissions", userId], queryFn: () => fetchMySubmissions(userId) });
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  if (!q.data?.length) {
    return (
      <EmptyState
        icon={<Plus className="h-6 w-6" />}
        title="You haven't shared a deal yet"
        body="Seen a good offer in a shop or from your bank? Share it and help everyone save."
        action={<Link to="/submit" className="btn btn-primary">Share a deal</Link>}
      />
    );
  }
  return (
    <div className="panel divide-y divide-border">
      {q.data.map((d) => (
        <div key={d.id} className="flex gap-4 p-4">
          <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
            <DealImage deal={d} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={d.status} expired={isExpired(d)} />
              <span className="text-xs text-muted-foreground">Sent {formatDate(d.created_at)}</span>
            </div>
            <Link to={dealPath(d)} className="mt-1 block truncate font-semibold hover:underline">{d.title}</Link>
            <p className="text-sm text-muted-foreground">{d.business_name}</p>
            {d.status === "rejected" && d.rejection_reason && (
              <p className="mt-1 text-sm text-destructive">Reason: {d.rejection_reason}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProfileTab() {
  const { user, displayName, signOut } = useAuth();
  const [name, setName] = useState(displayName);
  const [busy, setBusy] = useState(false);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await updateProfileName(user!.id, name);
      await supabase.auth.updateUser({ data: { full_name: name.trim() } });
      toast.success("Profile saved");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid max-w-lg gap-6">
      <form onSubmit={save} className="panel grid gap-4 p-6">
        <div>
          <label className="label" htmlFor="pname">Name</label>
          <input id="pname" className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        </div>
        <div>
          <span className="label">Email</span>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <button className="btn btn-primary w-fit" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button>
      </form>
      <div className="panel flex flex-wrap items-center justify-between gap-3 p-6">
        <div>
          <p className="font-semibold">Password</p>
          <p className="text-sm text-muted-foreground">We'll email you a link to set a new one.</p>
        </div>
        <button
          className="btn btn-outline"
          onClick={async () => {
            const { error } = await supabase.auth.resetPasswordForEmail(user!.email!, { redirectTo: `${window.location.origin}/reset-password` });
            if (error) toast.error(error.message);
            else toast.success(`Reset link sent to ${user!.email}`);
          }}
        >
          Change password
        </button>
      </div>
      <button className="btn btn-ghost w-fit text-destructive" onClick={() => signOut()}>Sign out</button>
    </div>
  );
}

export default function Account() {
  usePageMeta("My account");
  const { user, displayName } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as (typeof TABS)[number]["id"]) || "saved";

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold">Hi, {displayName}</h1>
      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-border" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setParams(t.id === "saved" ? {} : { tab: t.id })}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold",
              tab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-8">
        {tab === "saved" && <Saved userId={user!.id} />}
        {tab === "submissions" && <Submissions userId={user!.id} />}
        {tab === "profile" && <ProfileTab />}
      </div>
    </div>
  );
}
