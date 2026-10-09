"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AuthGuard from "@/components/AuthGuard";
import SiteHeader from "@/components/SiteHeader";

type Item = {
  property_id: string;
  property_name: string;
  area: string | null;
  landlord_name: string | null;
};

export default function CaretakerHome() {
  return (
    <AuthGuard role="caretaker">
      <Inner />
    </AuthGuard>
  );
}

function Inner() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("my_caretaker_properties");
      setItems((data as Item[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-cream text-bark">
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-6 p-6">
        <h1 className="text-2xl font-semibold">My properties</h1>
        {loading ? (
          <p className="text-bark-soft">Loading...</p>
        ) : items.length === 0 ? (
          <p className="rounded-2xl border border-sand bg-white p-5 text-bark-soft">
            No properties yet.{" "}
            <Link href="/caretaker/join" className="text-terracotta hover:underline">
              Enter an invite code
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-sand rounded-2xl border border-sand bg-white shadow-sm">
            {items.map((p) => (
              <li key={p.property_id}>
                <Link href={`/caretaker/${p.property_id}`} className="flex items-center justify-between p-4 hover:bg-sand-light">
                  <div>
                    <p className="font-medium">{p.property_name}</p>
                    <p className="text-sm text-bark-soft">
                      {p.area || "No area yet"}
                      {p.landlord_name ? ` - landlord: ${p.landlord_name}` : ""}
                    </p>
                  </div>
                  <span className="text-sm text-terracotta">Open</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
