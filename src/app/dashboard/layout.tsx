"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import PlanBanner from "@/components/PlanBanner";
import { supabase } from "@/lib/supabase";
import { SITE_NAME } from "@/lib/helpers";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <AuthGuard role="landlord">
      <div className="min-h-screen bg-cream text-bark">
        <nav className="print:hidden flex flex-wrap items-center gap-6 border-b border-sand bg-white px-6 py-4">
          <Link href="/" className="font-serif text-lg font-semibold text-terracotta">{SITE_NAME}</Link>
          <Link href="/dashboard" className="text-bark-soft hover:text-terracotta">Dashboard</Link>
          <Link href="/dashboard/properties" className="text-bark-soft hover:text-terracotta">Properties</Link>
          <Link href="/dashboard/plans" className="text-bark-soft hover:text-terracotta">Plans</Link>
          <button onClick={signOut} className="ml-auto text-sm text-bark-soft hover:text-terracotta">
            Sign out
          </button>
        </nav>
        <PlanBanner />
        <main className="mx-auto max-w-5xl p-6">{children}</main>
      </div>
    </AuthGuard>
  );
}
