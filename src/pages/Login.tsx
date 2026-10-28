import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePageMeta } from "@/hooks/usePageMeta";
import { LogoMark } from "@/components/Logo";
import { SITE } from "@/lib/site";

type Mode = "signin" | "signup" | "forgot";

function friendly(msg: string) {
  if (/invalid login credentials/i.test(msg)) return "That email and password don't match. Check them and try again.";
  if (/email not confirmed/i.test(msg)) return "Confirm your email first — open the link we sent you.";
  if (/already registered/i.test(msg)) return "An account with this email already exists. Sign in instead.";
  if (/password should be at least/i.test(msg)) return "Use a password of at least 8 characters.";
  if (/rate limit/i.test(msg)) return "Too many attempts. Wait a minute and try again.";
  return msg;
}

/** Only allow redirects back into this site. */
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export default function Login() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState<Mode>(params.get("mode") === "signup" ? "signup" : "signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const next = safeNext(params.get("next"));

  usePageMeta(mode === "signup" ? "Create an account" : mode === "forgot" ? "Reset your password" : "Sign in");

  useEffect(() => {
    if (user) navigate(next, { replace: true });
  }, [user, next, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        toast.success("Signed in");
      } else if (mode === "signup") {
        if (password.length < 8) throw new Error("Use a password of at least 8 characters.");
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: `${window.location.origin}${next}`,
          },
        });
        if (error) throw error;
        if (!data.session) setSentTo(email.trim());
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSentTo(email.trim());
      }
    } catch (err) {
      toast.error(friendly(err instanceof Error ? err.message : String(err)));
    } finally {
      setBusy(false);
    }
  };

  if (sentTo) {
    return (
      <div className="container max-w-md py-20 text-center">
        <MailCheck className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-5 text-2xl font-bold">Check your email</h1>
        <p className="mt-2 text-muted-foreground">
          We sent a link to <span className="font-semibold text-foreground">{sentTo}</span>.{" "}
          {mode === "forgot" ? "Open it to choose a new password." : "Open it to confirm your account, then come back and sign in."}
        </p>
        <button className="btn btn-outline mt-6" onClick={() => { setSentTo(null); setMode("signin"); }}>
          Back to sign in
        </button>
      </div>
    );
  }

  const titles: Record<Mode, string> = {
    signin: "Sign in",
    signup: "Create your account",
    forgot: "Reset your password",
  };

  return (
    <div className="container max-w-md py-14">
      <div className="mb-8 text-center">
        <LogoMark className="mx-auto h-12 w-12" />
        <h1 className="mt-4 text-2xl font-bold">{titles[mode]}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {mode === "signup"
            ? `Save offers and share deals on ${SITE.name}.`
            : mode === "forgot"
              ? "Enter your email and we'll send you a reset link."
              : "Welcome back."}
        </p>
      </div>

      <form onSubmit={submit} className="panel grid gap-4 p-6 sm:p-8">
        {mode === "signup" && (
          <div>
            <label className="label" htmlFor="name">Your name</label>
            <input id="name" className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required maxLength={80} />
          </div>
        )}
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </div>
        {mode !== "forgot" && (
          <div>
            <div className="flex items-baseline justify-between">
              <label className="label" htmlFor="password">Password</label>
              {mode === "signin" && (
                <button type="button" onClick={() => setMode("forgot")} className="text-xs font-semibold text-primary hover:underline">
                  Forgot password?
                </button>
              )}
            </div>
            <input
              id="password"
              type="password"
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              minLength={mode === "signup" ? 8 : undefined}
              required
            />
            {mode === "signup" && <p className="mt-1.5 text-xs text-muted-foreground">At least 8 characters.</p>}
          </div>
        )}
        <button type="submit" className="btn btn-primary mt-2 w-full" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
        </button>
        {mode === "signup" && (
          <p className="text-center text-xs text-muted-foreground">
            By creating an account you agree to our <Link to="/terms" className="underline">terms</Link> and{" "}
            <Link to="/privacy" className="underline">privacy policy</Link>.
          </p>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "signin" ? (
          <>New here? <button onClick={() => setMode("signup")} className="font-semibold text-primary hover:underline">Create an account</button></>
        ) : (
          <>Already have an account? <button onClick={() => setMode("signin")} className="font-semibold text-primary hover:underline">Sign in</button></>
        )}
      </p>
    </div>
  );
}
