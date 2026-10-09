"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function UnitStatusButton({
  unitId,
  status,
  onDone,
  caretaker,
}: {
  unitId: string;
  status: "vacant" | "occupied";
  onDone: () => void;
  caretaker?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function flip() {
    setBusy(true);
    setError("");
    const next = status === "vacant" ? "occupied" : "vacant";
    const res = caretaker
      ? await supabase.rpc("caretaker_set_unit_status", { p_unit: unitId, p_status: next })
      : await supabase.from("units").update({ status: next }).eq("id", unitId);
    setBusy(false);
    if (res.error) setError(res.error.message);
    else onDone();
  }

  return (
    <span className="flex items-center gap-2">
      <button
        onClick={flip}
        disabled={busy}
        className="rounded-xl border border-sand-dark bg-white px-3 py-1 text-sm hover:border-terracotta disabled:opacity-50"
      >
        {status === "vacant" ? "Mark as taken" : "Mark as vacant"}
      </button>
      {error && <span className="text-sm text-rose-700">{error}</span>}
    </span>
  );
}
