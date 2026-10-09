"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { UNIT_TYPES } from "@/lib/helpers";
import AuthGuard from "@/components/AuthGuard";
import SiteHeader from "@/components/SiteHeader";
import ListingCard from "@/components/ListingCard";
import type { Listing } from "@/components/ListingCard";
import { useFavorites } from "@/lib/useFavorites";

export default function AccountPage() {
  return (
    <AuthGuard role="client">
      <AccountInner />
    </AuthGuard>
  );
}

function AccountInner() {
  const fav = useFavorites();
  const [area, setArea] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [type, setType] = useState("");
  const [msg, setMsg] = useState("");
  const [matches, setMatches] = useState<Listing[]>([]);
  const [saved, setSaved] = useState<Listing[]>([]);
  const [hasPrefs, setHasPrefs] = useState(false);

  async function loadMatches(a: string, m: string, t: string) {
    const { data } = await supabase.rpc("public_listings", {
      p_area: a.trim() || null,
      p_min: null,
      p_max: m ? Number(m) : null,
      p_type: t || null,
    });
    setMatches((data as Listing[]) ?? []);
    setHasPrefs(Boolean(a.trim() || m || t));
  }

  async function loadSaved() {
    const { data } = await supabase.rpc("my_favorites");
    setSaved((data as Listing[]) ?? []);
  }

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("clients").select("pref_area, pref_max_rent, pref_type").maybeSingle();
      const a = data?.pref_area ?? "";
      const m = data?.pref_max_rent != null ? String(data.pref_max_rent) : "";
      const t = data?.pref_type ?? "";
      setArea(a);
      setMaxRent(m);
      setType(t);
      loadMatches(a, m, t);
      loadSaved();
    })();
  }, []);

  async function savePrefs(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("clients")
      .update({
        pref_area: area.trim() || null,
        pref_max_rent: maxRent ? Number(maxRent) : null,
        pref_type: type || null,
      })
      .eq("id", auth.user?.id ?? "");
    setMsg(error ? error.message : "Preferences saved");
    loadMatches(area, maxRent, type);
  }

  async function toggleSaved(unitId: string) {
    await fav.toggle(unitId);
    loadSaved();
  }

  const field =
    "rounded-xl border border-sand-dark bg-white px-3 py-2 text-bark outline-none focus:border-terracotta";

  return (
    <div className="min-h-screen bg-cream text-bark">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-10 p-6">
        <section className="space-y-4 rounded-2xl border border-sand bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">What are you looking for?</h1>
          <form onSubmit={savePrefs} className="flex flex-wrap items-center gap-3">
            <input className={`${field} w-56`} placeholder="Preferred area" value={area} onChange={(e) => setArea(e.target.value)} />
            <select className={field} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Any type</option>
              {UNIT_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <input className={`${field} w-44`} type="number" min="0" placeholder="Max rent (KES)" value={maxRent} onChange={(e) => setMaxRent(e.target.value)} />
            <button className="rounded-xl bg-terracotta px-4 py-2 font-medium text-white hover:bg-terracotta-dark">
              Save preferences
            </button>
            {msg && <span className="text-sm text-bark-soft">{msg}</span>}
          </form>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">{hasPrefs ? "Rooms that match your preferences" : "Latest vacant rooms"}</h2>
          {matches.length === 0 ? (
            <p className="rounded-2xl border border-sand bg-white p-5 text-bark-soft">
              Nothing matches right now. Try a higher budget or a wider area, and check back soon.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {matches.map((x) => (
                <ListingCard key={x.unit_id} x={x} saved={fav.ids.has(x.unit_id)} onToggle={toggleSaved} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Your saved rooms</h2>
          {saved.length === 0 ? (
            <p className="rounded-2xl border border-sand bg-white p-5 text-bark-soft">
              Tap Save on any room and it will show up here.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {saved.map((x) => (
                <ListingCard key={x.unit_id} x={x} saved onToggle={toggleSaved} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
