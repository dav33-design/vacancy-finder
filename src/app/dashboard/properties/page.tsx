"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type PropertyVacancy = {
  property_id: string;
  name: string;
  location: string | null;
  total_units: number;
  vacant_units: number;
};

export default function PropertiesPage() {
  const [items, setItems] = useState<PropertyVacancy[]>([]);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const { data } = await supabase.from("property_vacancy").select("*").order("name");
    setItems((data as PropertyVacancy[]) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function addProperty(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const { error } = await supabase.from("properties").insert({ name, location });
    if (error) setError(error.message);
    else {
      setName("");
      setLocation("");
      load();
    }
  }

  const input = "rounded-xl border border-sand-dark bg-white px-3 py-2 text-bark outline-none focus:border-terracotta";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Properties</h1>

      <form onSubmit={addProperty} className="flex flex-wrap gap-3">
        <input className={input} placeholder="Property name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className={input} placeholder="Location (e.g. Kabarnet)" value={location} onChange={(e) => setLocation(e.target.value)} />
        <button className="rounded-xl bg-terracotta text-white px-4 py-2 font-medium hover:bg-terracotta-dark">Add property</button>
      </form>
      {error && <p className="text-sm text-rose-700">{error}</p>}

      <ul className="divide-y divide-sand rounded-xl border border-sand bg-white shadow-sm">
        {items.map((p) => (
          <li key={p.property_id}>
            <Link href={`/dashboard/properties/${p.property_id}`} className="flex items-center justify-between p-4 hover:bg-sand-light">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-bark-soft">{p.location || "No location"}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm ${p.vacant_units > 0 ? "bg-sage-light text-sage-dark" : "bg-sand text-bark-soft"}`}>
                {p.vacant_units > 0 ? `${p.vacant_units} vacant` : "Full"} / {p.total_units} units
              </span>
            </Link>
          </li>
        ))}
        {items.length === 0 && <li className="p-4 text-bark-soft">No properties yet. Add your first one above.</li>}
      </ul>
    </div>
  );
}
