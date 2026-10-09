"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PAY_INSTRUCTIONS, kes } from "@/lib/helpers";

type Plan = {
  id: string;
  name: string;
  monthly_fee: number;
  max_properties: number | null;
  max_units: number | null;
  max_photos_per_unit: number | null;
  qr_enabled: boolean;
  featured: boolean;
};

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [current, setCurrent] = useState("");

  useEffect(() => {
    (async () => {
      const a = await supabase.from("plans").select("*").order("monthly_fee");
      setPlans((a.data as Plan[]) ?? []);
      const b = await supabase.from("landlords").select("plan_id").single();
      setCurrent(b.data?.plan_id ?? "");
    })();
  }, []);

  const lim = (n: number | null) => (n === null ? "Unlimited" : String(n));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Plans</h1>
        <p className="text-bark-soft">Every new account gets 30 days free. Pick the plan that fits your buildings.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.id}
            className={`rounded-2xl border bg-white p-6 shadow-sm ${p.id === current ? "border-terracotta" : "border-sand"}`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{p.name}</h2>
              {p.id === current && (
                <span className="rounded-full bg-sage-light px-3 py-1 text-xs text-sage-dark">Current</span>
              )}
            </div>
            <p className="mt-2 text-3xl font-semibold text-terracotta">
              {kes(p.monthly_fee)} <span className="text-sm font-normal text-bark-soft">/ month</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm text-bark-soft">
              <li>Properties: {lim(p.max_properties)}</li>
              <li>Units: {lim(p.max_units)}</li>
              <li>Photos per room: {lim(p.max_photos_per_unit)}</li>
              <li>QR poster: {p.qr_enabled ? "Yes" : "No"}</li>
              <li>Featured at the top of search: {p.featured ? "Yes" : "No"}</li>
            </ul>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-sand bg-sand-light p-5 text-sm">
        <p className="font-medium">How to pay</p>
        <p className="mt-1 text-bark-soft">{PAY_INSTRUCTIONS}</p>
      </div>
    </div>
  );
}
