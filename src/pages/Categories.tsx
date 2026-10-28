import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCategoryCounts } from "@/lib/api";
import { CATEGORIES } from "@/lib/constants";
import { usePageMeta } from "@/hooks/usePageMeta";
import CategoryIcon from "@/components/CategoryIcon";

export default function Categories() {
  usePageMeta("All categories", "Browse offers in Sri Lanka by category — bank cards, supermarkets, dining, fashion, electronics, travel and more.");
  const { data: counts } = useQuery({ queryKey: ["category-counts"], queryFn: fetchCategoryCounts });

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">Categories</h1>
      <p className="mt-2 text-muted-foreground">Pick a category to see every live offer in it.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c) => (
          <Link key={c.slug} to={`/category/${c.slug}`} className="panel flex items-center gap-4 p-5 hover:border-primary/50">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <CategoryIcon slug={c.slug} className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{c.name}</span>
              <span className="block truncate text-sm text-muted-foreground">{c.blurb}</span>
            </span>
            <span className="font-heading text-lg font-bold text-primary">{counts?.[c.slug] ?? 0}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
