import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { isSupabaseConfigured } from "@/integrations/supabase/client";

export default function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-card focus:px-4 focus:py-2">
        Skip to content
      </a>
      {!isSupabaseConfigured && (
        <div className="bg-maroon px-4 py-2 text-center text-sm text-maroon-foreground">
          The database isn't connected yet. Add your Supabase keys — see SETUP.md.
        </div>
      )}
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
