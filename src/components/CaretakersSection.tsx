"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SITE_NAME, siteUrl } from "@/lib/helpers";

type Row = {
  id: string;
  name: string;
  invite_code: string | null;
  invite_expires_at: string | null;
  user_id: string | null;
};

export default function CaretakersSection({ propertyId }: { propertyId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const { data } = await supabase
      .from("caretakers")
      .select("id, name, invite_code, invite_expires_at, user_id")
      .eq("property_id", propertyId)
      .order("created_at");
    setRows((data as Row[]) ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const { error } = await supabase.from("caretakers").insert({ property_id: propertyId, name: name.trim() });
    if (error) setError(error.message);
    else {
      setName("");
      load();
    }
  }

  async function remove(id: string) {
    await supabase.from("caretakers").delete().eq("id", id);
    load();
  }

  function whatsappInvite(r: Row) {
    const text =
      `Hi ${r.name}, you have been added as a caretaker on ${SITE_NAME}. ` +
      `Sign up here: ${siteUrl()}/login?mode=signup&role=caretaker ` +
      `then enter this invite code: ${r.invite_code} (valid for 14 days).`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  return (
    <section className="space-y-4 rounded-2xl border border-sand bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-medium">Caretakers</h2>
        <p className="text-sm text-bark-soft">
          A caretaker can add photos, set the location and mark rooms as taken or vacant. They never see rent or payments.
        </p>
      </div>

      <form onSubmit={add} className="flex flex-wrap gap-3">
        <input
          className="rounded-xl border border-sand-dark bg-white px-3 py-2 text-bark outline-none focus:border-terracotta"
          placeholder="Caretaker name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <button className="rounded-xl bg-terracotta px-4 py-2 font-medium text-white hover:bg-terracotta-dark">
          Create invite code
        </button>
      </form>
      {error && <p className="text-sm text-rose-700">{error}</p>}

      <ul className="divide-y divide-sand">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="font-medium">{r.name}</p>
              {r.user_id ? (
                <span className="rounded-full bg-sage-light px-3 py-1 text-xs text-sage-dark">Active</span>
              ) : (
                <p className="text-sm text-bark-soft">
                  Invite code <span className="font-mono font-semibold text-bark">{r.invite_code}</span>
                  {r.invite_expires_at && <> (expires {new Date(r.invite_expires_at).toLocaleDateString()})</>}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm">
              {!r.user_id && r.invite_code && (
                <a href={whatsappInvite(r)} target="_blank" rel="noreferrer" className="text-terracotta hover:underline">
                  Send on WhatsApp
                </a>
              )}
              <button onClick={() => remove(r.id)} className="text-rose-700 hover:underline">
                Remove
              </button>
            </div>
          </li>
        ))}
        {rows.length === 0 && <li className="py-3 text-sm text-bark-soft">No caretakers yet.</li>}
      </ul>
    </section>
  );
}
