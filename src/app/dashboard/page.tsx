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
  occupied_units: number;
};

type VacantUnit = {
  unit_id: string;
  property_id: string;
  property_name: string;
  unit_number: string;
  rent_amount: number;
};

export default function DashboardPage() {
  const [props, setProps] = useState<PropertyVacancy[]>([]);
  const [vacant, setVacant] = useState<VacantUnit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [a, b] = await Promise.all([
        supabase.from("property_vacancy").select("*").order("name"),
        supabase.from("vacant_units").select("*").order("property_name"),
      ]);
      setProps((a.data as PropertyVacancy[]) ?? []);
      setVacant((b.data as VacantUnit[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const totalUnits = props.reduce((s, p) => s + p.total_units, 0);
  const totalVacant = props.reduce((s, p) => s + p.vacant_units, 0);

  if (loading) return <p className="text-bark-soft">Loading...</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total units" value={totalUnits} />
        <Stat label="Occupied" value={totalUnits - totalVacant} />
        <Stat label="Vacant" value={totalVacant} highlight={totalVacant > 0} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium">Vacant rooms</h2>
        {vacant.length === 0 ? (
          <p className="rounded-xl border border-sand bg-white shadow-sm p-4 text-bark-soft">
            {totalUnits === 0
              ? "No units yet. Add a property and its units first."
              : "No vacant rooms right now. Everything is occupied."}
          </p>
        ) : (
          <ul className="divide-y divide-sand rounded-xl border border-sand bg-white shadow-sm">
            {vacant.map((u) => (
              <li key={u.unit_id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{u.property_name} - Unit {u.unit_number}</p>
                  <p className="text-sm text-bark-soft">KES {Number(u.rent_amount).toLocaleString()} / month</p>
                </div>
                <Link href={`/dashboard/properties/${u.property_id}`} className="text-sm text-sage-dark hover:underline">
                  Open property
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">By property</h2>
        <ul className="divide-y divide-sand rounded-xl border border-sand bg-white shadow-sm">
          {props.map((p) => (
            <li key={p.property_id} className="flex items-center justify-between p-4">
              <Link href={`/dashboard/properties/${p.property_id}`} className="font-medium hover:underline">
                {p.name}
              </Link>
              <span className="text-sm text-bark-soft">
                {p.vacant_units} of {p.total_units} vacant
              </span>
            </li>
          ))}
          {props.length === 0 && <li className="p-4 text-bark-soft">No properties yet.</li>}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-sand bg-white shadow-sm p-4">
      <p className="text-sm text-bark-soft">{label}</p>
      <p className={`text-3xl font-semibold ${highlight ? "text-sage-dark" : ""}`}>{value}</p>
    </div>
  );
}
