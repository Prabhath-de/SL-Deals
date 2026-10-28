import { Link } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function NotFound() {
  usePageMeta("Page not found");
  return (
    <div className="container flex flex-col items-center py-24 text-center">
      <p className="stamp text-4xl">404</p>
      <h1 className="mt-6 text-3xl font-bold">This page doesn't exist</h1>
      <p className="mt-2 max-w-md text-muted-foreground">The link may be old, or the offer may have been removed.</p>
      <div className="mt-6 flex gap-3">
        <Link to="/" className="btn btn-primary">Go to home</Link>
        <Link to="/deals" className="btn btn-outline">Browse offers</Link>
      </div>
    </div>
  );
}
