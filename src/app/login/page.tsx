"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SITE_NAME, getRole } from "@/lib/helpers";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [role, setRole] = useState<"client" | "landlord">("client");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // links like /login?mode=signup&role=landlord pre-select the right form
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("mode") === "signup") setMode("signup");
    if (sp.get("role") === "landlord") setRole("landlord");
  }, []);

  async function goHome() {
    const r = await getRole();
    router.replace(r === "landlord" ? "/dashboard" : "/account");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else await goHome();
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, phone, role } },
      });
      if (error) setError(error.message);
      else if (data.session) await goHome();
      else setMessage("Account created. Check your email to confirm, then log in.");
    }
    setLoading(false);
  }

  const input =
    "w-full rounded-xl border border-sand-dark bg-white px-3 py-2 text-bark outline-none focus:border-terracotta";
  const choice = (active: boolean) =>
    `flex-1 rounded-xl border px-3 py-3 text-sm ${
      active ? "border-terracotta bg-sand-light font-medium" : "border-sand-dark bg-white text-bark-soft"
    }`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream p-6 text-bark">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <Link href="/" className="font-serif text-2xl font-semibold text-terracotta">
          {SITE_NAME}
        </Link>
        <p className="text-sm text-bark-soft">
          {mode === "login" ? "Log in to your account" : "Create your free account"}
        </p>

        {mode === "signup" && (
          <>
            <div className="flex gap-3">
              <button type="button" className={choice(role === "client")} onClick={() => setRole("client")}>
                I am looking for a house
              </button>
              <button type="button" className={choice(role === "landlord")} onClick={() => setRole("landlord")}>
                I am a landlord or agent
              </button>
            </div>
            <input className={input} placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            <input className={input} placeholder="Phone (e.g. 0712345678)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </>
        )}
        <input className={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className={input} type="password" placeholder="Password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />

        {error && <p className="text-sm text-rose-700">{error}</p>}
        {message && <p className="text-sm text-sage-dark">{message}</p>}

        <button
          disabled={loading}
          className="w-full rounded-xl bg-terracotta py-2 font-medium text-white hover:bg-terracotta-dark disabled:opacity-50"
        >
          {loading ? "Please wait..." : mode === "login" ? "Log in" : "Sign up"}
        </button>

        <button
          type="button"
          className="w-full text-sm text-bark-soft hover:text-terracotta"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
        >
          {mode === "login" ? "No account? Sign up" : "Already have an account? Log in"}
        </button>
      </form>
    </div>
  );
}
