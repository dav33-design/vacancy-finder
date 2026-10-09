"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AuthGuard from "@/components/AuthGuard";
import SiteHeader from "@/components/SiteHeader";

export default function JoinPage() {
  return (
    <AuthGuard>
      <JoinInner />
    </AuthGuard>
  );
}

function JoinInner() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabase.rpc("redeem_caretaker_code", { p_code: code });
    setBusy(false);
    if (error) setError(error.message);
    else router.replace("/caretaker");
  }

  return (
    <div className="min-h-screen bg-cream text-bark">
      <SiteHeader />
      <main className="mx-auto max-w-sm space-y-4 p-6">
        <h1 className="text-2xl font-semibold">Enter your invite code</h1>
        <p className="text-sm text-bark-soft">
          Your landlord sent you a code by WhatsApp or SMS. Type it here to get access to the property.
        </p>
        <form onSubmit={submit} className="space-y-3">
          <input
            className="w-full rounded-xl border border-sand-dark bg-white px-3 py-2 font-mono uppercase tracking-widest outline-none focus:border-terracotta"
            placeholder="ABCD1234"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          {error && <p className="text-sm text-rose-700">{error}</p>}
          <button
            disabled={busy}
            className="w-full rounded-xl bg-terracotta py-2 font-medium text-white hover:bg-terracotta-dark disabled:opacity-50"
          >
            {busy ? "Checking..." : "Join property"}
          </button>
        </form>
      </main>
    </div>
  );
}
