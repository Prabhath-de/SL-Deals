import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { fetchSavedIds, setSaved } from "@/lib/api";
import { errorMessage } from "@/lib/format";
import { useAuth } from "./useAuth";

/** Saved-deal ids for the signed-in user, plus a toggle that sends guests to sign in. */
export function useSaved() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: ids } = useQuery({
    queryKey: ["saved-ids", user?.id],
    queryFn: () => fetchSavedIds(user!.id),
    enabled: !!user,
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: ({ dealId, save }: { dealId: string; save: boolean }) => setSaved(user!.id, dealId, save),
    onMutate: async ({ dealId, save }) => {
      const key = ["saved-ids", user?.id];
      const prev = qc.getQueryData<Set<string>>(key);
      const next = new Set(prev ?? []);
      if (save) next.add(dealId);
      else next.delete(dealId);
      qc.setQueryData(key, next);
      return { prev };
    },
    onError: (e, _v, ctx) => {
      qc.setQueryData(["saved-ids", user?.id], ctx?.prev);
      toast.error(errorMessage(e));
    },
    onSuccess: (_d, { save }) => {
      toast.success(save ? "Saved to your list" : "Removed from your list");
      qc.invalidateQueries({ queryKey: ["saved-deals"] });
    },
  });

  const toggle = (dealId: string) => {
    if (!user) {
      toast("Sign in to save offers", { description: "Your saved offers stay on all your devices." });
      navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    mutation.mutate({ dealId, save: !ids?.has(dealId) });
  };

  return { isSaved: (id: string) => !!ids?.has(id), toggle };
}
