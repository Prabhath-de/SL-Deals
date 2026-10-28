import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { RequireAdmin, RequireAuth } from "@/components/Guards";
import { Spinner } from "@/components/States";
import Home from "@/pages/Home";
import Deals from "@/pages/Deals";
import DealDetail from "@/pages/DealDetail";
import Categories from "@/pages/Categories";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import { About, Contact, Privacy, Terms } from "@/pages/InfoPages";

// Pages most visitors never open are loaded on demand.
const Submit = lazy(() => import("@/pages/Submit"));
const Account = lazy(() => import("@/pages/Account"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminDeals = lazy(() => import("@/pages/admin/AdminDeals"));
const AdminDealEditor = lazy(() => import("@/pages/admin/AdminDealEditor"));
const AdminReports = lazy(() => import("@/pages/admin/AdminReports"));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<Spinner />}>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/deals" element={<Deals />} />
                <Route path="/category/:slug" element={<Deals />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/deal/:id/:slug?" element={<DealDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/submit" element={<RequireAuth><Submit /></RequireAuth>} />
                <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="*" element={<NotFound />} />
              </Route>
              <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
                <Route index element={<AdminDashboard />} />
                <Route path="deals" element={<AdminDeals />} />
                <Route path="deals/new" element={<AdminDealEditor />} />
                <Route path="deals/:id" element={<AdminDealEditor />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="users" element={<AdminUsers />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster position="bottom-center" richColors closeButton />
      </AuthProvider>
    </QueryClientProvider>
  );
}
