"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SITE_NAME, getRole } from "@/lib/helpers";
import type { Role } from "@/lib/helpers";

export default function SiteHeader() {
  const router = useRouter();
  const [role, setRole] = useState<Role | undefined>(undefined);

  useEffect(() => {
    getRole().then(setRole);
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      getRole().then(setRole);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setRole(null);
    router.push("/");
  }

  const link = "text-sm text-bark-soft hover:text-terracotta";

  return (
    <header className="flex items-center justify-between border-b border-sand bg-white px-6 py-4">
      <Link href="/" className="font-serif text-xl font-semibold text-terracotta">
        {SITE_NAME}
      </Link>
      <div className="flex items-center gap-5">
        {role === null && (
          <>
            <Link href="/login" className={link}>Log in</Link>
            <Link
              href="/login?mode=signup&role=client"
              className="rounded-xl bg-terracotta px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-dark"
            >
              Sign up
            </Link>
          </>
        )}
        {role === "client" && (
          <>
            <Link href="/account" className={link}>My account</Link>
            <button onClick={signOut} className={link}>Sign out</button>
          </>
        )}
        {role === "landlord" && (
          <>
            <Link href="/dashboard" className={link}>Dashboard</Link>
            <button onClick={signOut} className={link}>Sign out</button>
          </>
        )}
      </div>
    </header>
  );
}
