"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getRole, homeFor } from "@/lib/helpers";

export default function AuthGuard({
  children,
  role,
}: {
  children: ReactNode;
  role?: "landlord" | "caretaker" | "client";
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/login");
        return;
      }
      if (role) {
        const r = await getRole();
        if (r !== role) {
          router.replace(homeFor(r));
          return;
        }
      }
      setReady(true);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
    });
    return () => sub.subscription.unsubscribe();
  }, [router, role]);

  if (!ready) return <p className="p-6 text-bark-soft">Loading...</p>;
  return <>{children}</>;
}
