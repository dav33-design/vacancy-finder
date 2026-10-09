"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { compressImage, photoUrl } from "@/lib/helpers";

type Photo = { id: string; path: string };

export default function PhotoManager({
  propertyId,
  unitId,
  max,
}: {
  propertyId: string;
  unitId?: string;
  max?: number | null;
}) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    let q = supabase
      .from("photos")
      .select("id, path")
      .eq("property_id", propertyId)
      .order("sort_order")
      .order("created_at");
    q = unitId ? q.eq("unit_id", unitId) : q.is("unit_id", null);
    const { data } = await q;
    setPhotos((data as Photo[]) ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, unitId]);

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    setBusy(true);
    setError("");
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;

    for (const file of files) {
      try {
        const blob = await compressImage(file);
        const path = `${uid}/${propertyId}/${crypto.randomUUID()}.jpg`;
        const up = await supabase.storage.from("photos").upload(path, blob, { contentType: "image/jpeg" });
        if (up.error) throw up.error;

        const ins = await supabase
          .from("photos")
          .insert({ property_id: propertyId, unit_id: unitId ?? null, path });
        if (ins.error) {
          await supabase.storage.from("photos").remove([path]);
          throw ins.error;
        }
      } catch (err) {
        setError((err as { message?: string }).message ?? String(err));
        break;
      }
    }
    setBusy(false);
    load();
  }

  async function remove(p: Photo) {
    await supabase.from("photos").delete().eq("id", p.id);
    await supabase.storage.from("photos").remove([p.path]);
    load();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {photos.map((p) => (
          <div key={p.id} className="relative h-24 w-24 overflow-hidden rounded-xl border border-sand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl(p.path)} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(p)}
              className="absolute right-1 top-1 rounded-full bg-white/90 px-2 text-sm text-rose-700 hover:bg-white"
              aria-label="Delete photo"
            >
              &times;
            </button>
          </div>
        ))}
        {photos.length === 0 && <p className="text-sm text-bark-soft">No photos yet.</p>}
      </div>

      <div className="flex items-center gap-3">
        <label className="cursor-pointer rounded-xl bg-terracotta px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-dark">
          {busy ? "Uploading..." : "Add photos"}
          <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} disabled={busy} />
        </label>
        {max != null && (
          <span className="text-sm text-bark-soft">
            {photos.length} / {max} on your plan
          </span>
        )}
      </div>
      {error && <p className="text-sm text-rose-700">{error}</p>}
    </div>
  );
}
