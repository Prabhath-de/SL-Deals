import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Spinner } from "@/components/States";

export default function ResetPassword() {
  usePageMeta("Choose a new password");
  const { user, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  if (loading) return <Spinner />;

  if (!user) {
    return (
      <div className="container max-w-md py-20 text-center">
        <h1 className="text-2xl font-bold">This reset link has expired</h1>
        <p className="mt-2 text-muted-foreground">Reset links work once and only for a short time. Ask for a new one.</p>
        <Link to="/login" className="btn btn-primary mt-6">Get a new link</Link>
      </div>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Use a password of at least 8 characters.");
    if (password !== confirm) return toast.error("The two passwords don't match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password changed");
    navigate("/account");
  };

  return (
    <div className="container max-w-md py-14">
      <h1 className="mb-6 text-center text-2xl font-bold">Choose a new password</h1>
      <form onSubmit={submit} className="panel grid gap-4 p-6 sm:p-8">
        <div>
          <label className="label" htmlFor="pw">New password</label>
          <input id="pw" type="password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
        </div>
        <div>
          <label className="label" htmlFor="pw2">Type it again</label>
          <input id="pw2" type="password" className="field" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
        </div>
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Saving…" : "Save new password"}</button>
      </form>
    </div>
  );
}
