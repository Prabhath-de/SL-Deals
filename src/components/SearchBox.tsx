import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { cn } from "@/lib/format";

export default function SearchBox({ size = "md", className, autoFocus }: { size?: "md" | "lg"; className?: string; autoFocus?: boolean }) {
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const navigate = useNavigate();

  useEffect(() => {
    setQ(params.get("q") ?? "");
  }, [params]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/deals?q=${encodeURIComponent(term)}` : "/deals");
  };

  return (
    <form onSubmit={submit} role="search" className={cn("relative", className)}>
      <Search
        className={cn(
          "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground",
          size === "lg" ? "h-5 w-5" : "h-4 w-4"
        )}
      />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={size === "lg" ? "Search shops, banks or offers — e.g. Keells, Sampath, pizza" : "Search offers"}
        aria-label="Search offers"
        autoFocus={autoFocus}
        className={cn(
          "w-full rounded-full border border-input bg-card text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30",
          size === "lg" ? "h-14 pl-12 pr-32 text-base shadow-sm" : "h-10 pl-10 pr-4 text-sm"
        )}
      />
      {size === "lg" && (
        <button type="submit" className="btn btn-primary absolute right-1.5 top-1/2 h-11 -translate-y-1/2">
          Search
        </button>
      )}
    </form>
  );
}
