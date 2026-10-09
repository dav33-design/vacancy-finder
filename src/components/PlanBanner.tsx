"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Banner = { tone: "ok" | "trial" | "warn" | "bad"; text: string };

const DAY = 24 * 60 * 60 * 1000;

const toneClass: Record<Banner["tone"], string> = {
  ok: "bg-sage-light text-sage-dark",
  trial: "bg-sand-light text-bark",
  warn: "bg-amber-100 text-amber-900",
  bad: "bg-rose-100 text-rose-800",
};

export default function PlanBanner() {
  const [banner, setBanner] = useState<Banner | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("landlords")
        .select("trial_ends_at, paid_until, plans(name)")
        .single();
      if (!data) return;

      const row = data as unknown as {
        trial_ends_at: string;
        paid_until: string | null;
        plans: { name: string } | null;
      };
      const now = Date.now();
      const trialEnd = new Date(row.trial_ends_at).getTime();
      const paidEnd = row.paid_until ? new Date(row.paid_until).getTime() : 0;
      const planName = row.plans?.name ?? "Basic";

      if (paidEnd > now) {
        setBanner({ tone: "ok", text: `${planName} plan active until ${new Date(paidEnd).toLocaleDateString()}.` });
      } else if (trialEnd > now) {
        const d = Math.ceil((trialEnd - now) / DAY);
        setBanner({
          tone: "trial",
          text: `Free trial: ${d} day${d === 1 ? "" : "s"} left. Your vacant rooms are visible to the public.`,
        });
      } else if (Math.max(trialEnd, paidEnd) + 5 * DAY > now) {
        const d = Math.ceil((Math.max(trialEnd, paidEnd) + 5 * DAY - now) / DAY);
        setBanner({
          tone: "warn",
          text: `Your plan has expired. Your listings will be hidden in ${d} day${d === 1 ? "" : "s"} unless you renew.`,
        });
      } else {
        setBanner({ tone: "bad", text: "Your listings are hidden from the public. Activate a plan to show them again." });
      }
    })();
  }, []);

  if (!banner) return null;
  return (
    <div className={`print:hidden px-6 py-2 text-center text-sm ${toneClass[banner.tone]}`}>
      {banner.text}{" "}
      <Link href="/dashboard/plans" className="font-medium underline">
        View plans
      </Link>
    </div>
  );
}
