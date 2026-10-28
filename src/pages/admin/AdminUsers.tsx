import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { adminFetchUsers, adminSetAdmin } from "@/lib/api";
import { errorMessage, formatDate } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import { EmptyState, ErrorState, Spinner } from "@/components/States";
import Modal from "@/components/Modal";
import type { Profile } from "@/lib/types";

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [confirm, setConfirm] = useState<{ user: Profile; makeAdmin: boolean } | null>(null);
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["admin", "users", q], queryFn: () => adminFetchUsers(q) });

  const m = useMutation({
    mutationFn: ({ id, makeAdmin }: { id: string; makeAdmin: boolean }) => adminSetAdmin(id, makeAdmin),
    onSuccess: (_d, v) => {
      toast.success(v.makeAdmin ? "Admin access given" : "Admin access removed");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Users</h1>
      <p className="mt-1 text-sm text-muted-foreground">People with an account. Admins can review deals and manage the site.</p>

      <form className="relative mt-6 max-w-sm" onSubmit={(e) => { e.preventDefault(); setQ(search); }}>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input className="field h-10 pl-9" placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
      </form>

      <div className="mt-5">
        {list.isLoading ? (
          <Spinner />
        ) : list.error ? (
          <ErrorState error={list.error} onRetry={() => list.refetch()} />
        ) : !list.data?.length ? (
          <EmptyState title="No users found" />
        ) : (
          <div className="panel overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.data.map((u) => {
                  const isAdmin = !!u.user_roles?.some((r) => r.role === "admin");
                  const isMe = u.id === me?.id;
                  return (
                    <tr key={u.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{u.full_name || "—"}{isMe && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDate(u.created_at)}</td>
                      <td className="px-4 py-3">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                            <ShieldCheck className="h-3.5 w-3.5" /> Admin
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">User</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isMe && (
                          <button className="btn btn-outline btn-sm" onClick={() => setConfirm({ user: u, makeAdmin: !isAdmin })}>
                            {isAdmin ? "Remove admin" : "Make admin"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.makeAdmin ? "Give admin access?" : "Remove admin access?"}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirm(null)}>Cancel</button>
            <button
              className={confirm?.makeAdmin ? "btn btn-primary" : "btn btn-danger"}
              onClick={() => {
                m.mutate({ id: confirm!.user.id, makeAdmin: confirm!.makeAdmin });
                setConfirm(null);
              }}
            >
              {confirm?.makeAdmin ? "Make admin" : "Remove admin"}
            </button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          {confirm?.makeAdmin
            ? `${confirm.user.full_name || confirm.user.email} will be able to approve, edit and delete deals, and manage users.`
            : `${confirm?.user.full_name || confirm?.user.email} will no longer be able to open the admin panel.`}
        </p>
      </Modal>
    </div>
  );
}
