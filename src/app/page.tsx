"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { TOWN, UNIT_TYPES } from "@/lib/helpers";
import SiteHeader from "@/components/SiteHeader";
import ListingCard from "@/components/ListingCard";
import type { Listing } from "@/components/ListingCard";
import { useFavorites } from "@/lib/useFavorites";

export default function HomePage() {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [max, setMax] = useState("");
  const fav = useFavorites();

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase.rpc("public_listings", {
        p_area: q.trim() || null,
        p_min: null,
        p_max: max ? Number(max) : null,
        p_type: type || null,
      });
      setItems((data as Listing[]) ?? []);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [q, type, max]);

  const field =
    "rounded-xl border border-sand-dark bg-white px-4 py-3 text-bark outline-none focus:border-terracotta";

  return (
    <div className="min-h-screen bg-cream text-bark">
      <SiteHeader />

      <section className="bg-sand-light px-6 py-12 text-center">
        <h1 className="text-4xl font-semibold">Find your next home in {TOWN}</h1>
        <p className="mt-2 text-bark-soft">
          Vacant houses and rooms with real photos, prices and locations. No account needed to browse.
        </p>
        <div className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-3">
          <input className={`${field} w-full sm:w-64`} placeholder="Area or building" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className={field} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Any type</option>
            {UNIT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <input className={`${field} w-44`} type="number" min="0" placeholder="Max rent (KES)" value={max} onChange={(e) => setMax(e.target.value)} />
        </div>
      </section>

      <main className="mx-auto max-w-6xl p-6">
        {loading ? (
          <p className="text-bark-soft">Looking for rooms...</p>
        ) : items.length === 0 ? (
          <p className="rounded-2xl border border-sand bg-white p-6 text-bark-soft">
            No vacant rooms match your search right now. Try a different area or a higher budget.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((x) => (
              <ListingCard
                key={x.unit_id}
                x={x}
                saved={fav.ids.has(x.unit_id)}
                onToggle={fav.canSave ? fav.toggle : undefined}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-sand px-6 py-6 text-center text-sm text-bark-soft">
        Own or manage a rental building?{" "}
        <Link href="/login?mode=signup&role=landlord" className="text-terracotta hover:underline">
          List your vacant rooms free for 30 days
        </Link>
      </footer>
    </div>
  );
}
