import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;

  const nums = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
  const list = [...nums].sort((a, b) => a - b);

  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Pages">
      <button className="btn btn-outline btn-sm px-3" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
        <ChevronLeft className="h-4 w-4" />
      </button>
      {list.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && n - list[i - 1] > 1 && <span className="px-1 text-muted-foreground">…</span>}
          <button
            className={n === page ? "btn btn-primary btn-sm w-9 px-0" : "btn btn-ghost btn-sm w-9 px-0"}
            onClick={() => onChange(n)}
            aria-current={n === page ? "page" : undefined}
          >
            {n}
          </button>
        </span>
      ))}
      <button className="btn btn-outline btn-sm px-3" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page">
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
