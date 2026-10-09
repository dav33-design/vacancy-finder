"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getRole } from "@/lib/helpers";
import type { Role } from "@/lib/helpers";

// role: undefined = still checking, null = not logged in
export function useFavorites() {
  const router = useRouter();
  const [role, setRole] = useState<Role | undefined>(undefined);
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const r = await getRole();
      setRole(r);
      if (r === "client") {
        const { data } = await supabase.from("favorites").select("unit_id");
        setIds(new Set((data ?? []).map((x: { unit_id: string }) => x.unit_id)));
      }
    })();
  }, []);

  async function toggle(unitId: string) {
    if (role === null) {
      router.push("/login?mode=signup&role=client");
      return;
    }
    if (role !== "client") return;

    const next = new Set(ids);
    if (ids.has(unitId)) {
      await supabase.from("favorites").delete().eq("unit_id", unitId);
      next.delete(unitId);
    } else {
      await supabase.from("favorites").insert({ unit_id: unitId });
      next.add(unitId);
    }
    setIds(next);
  }

  // landlords cannot save rooms, everyone else can (logged out visitors are sent to sign up)
  return { role, ids, toggle, canSave: role !== "landlord" && role !== undefined };
}
