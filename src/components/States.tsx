import type { ReactNode } from "react";
import { Loader2, SearchX, TriangleAlert } from "lucide-react";

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground" role="status">
      <Loader2 className="h-5 w-5 animate-spin" /> {label}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="panel flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 rounded-full bg-accent p-3 text-accent-foreground">{icon ?? <SearchX className="h-6 w-6" />}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {body && <p className="mt-1.5 max-w-md text-sm text-muted-foreground">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const msg = error && typeof error === "object" && "message" in error ? String((error as { message: string }).message) : "";
  return (
    <EmptyState
      icon={<TriangleAlert className="h-6 w-6" />}
      title="Offers couldn't be loaded"
      body={msg ? `The server said: ${msg}` : "Check your connection and try again."}
      action={
        onRetry && (
          <button className="btn btn-outline" onClick={onRetry}>
            Try again
          </button>
        )
      }
    />
  );
}
