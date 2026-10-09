"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { kes, photoUrl, whatsappLink } from "@/lib/helpers";
import SiteHeader from "@/components/SiteHeader";
import { useFavorites } from "@/lib/useFavorites";

type Detail = {
  name: string;
  slug: string;
  area: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  amenities: string[];
  contact_phone: string | null;
  contact_name: string | null;
  photos: string[];
  units: {
    id: string;
    unit_number: string;
    unit_type: string | null;
    rent_amount: number;
    description: string | null;
    photos: string[];
  }[];
};

function PublicPropertyPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);
  const fav = useFavorites();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("public_property", { p_slug: slug });
      setData((data as Detail | null) ?? null);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream text-bark">
        <SiteHeader />
        <p className="p-6 text-bark-soft">Loading...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-cream text-bark">
        <SiteHeader />
        <p className="mx-auto mt-10 max-w-md rounded-2xl border border-sand bg-white p-6 text-center text-bark-soft">
          This listing is temporarily unavailable.{" "}
          <Link href="/" className="text-terracotta hover:underline">See other vacant rooms</Link>
        </p>
      </div>
    );
  }

  const call = data.contact_phone ? `tel:${data.contact_phone}` : null;
  const mapQuery = data.latitude != null && data.longitude != null ? `${data.latitude},${data.longitude}` : null;

  return (
    <div className="min-h-screen bg-cream text-bark">
      <SiteHeader />
      <main className="mx-auto max-w-4xl space-y-8 p-6">
        <div>
          <h1 className="text-3xl font-semibold">{data.name}</h1>
          {data.area && <p className="text-bark-soft">{data.area}</p>}
        </div>

        {data.photos.length > 0 && (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl(data.photos[active] ?? data.photos[0])} alt={data.name} className="h-72 w-full rounded-2xl object-cover sm:h-96" />
            {data.photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {data.photos.map((p, i) => (
                  <button key={p} onClick={() => setActive(i)} className={`h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 ${i === active ? "border-terracotta" : "border-transparent"}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoUrl(p)} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {(data.description || data.amenities.length > 0) && (
          <section className="space-y-3">
            {data.description && <p className="text-bark-soft">{data.description}</p>}
            <div className="flex flex-wrap gap-2">
              {data.amenities.map((a) => (
                <span key={a} className="rounded-full bg-sage-light px-3 py-1 text-sm text-sage-dark">{a}</span>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Vacant rooms</h2>
          {data.units.length === 0 && (
            <p className="rounded-2xl border border-sand bg-white p-5 text-bark-soft">
              No vacant rooms in this building right now. Check back soon.
            </p>
          )}
          {data.units.map((u) => {
            const wa = whatsappLink(
              data.contact_phone,
              `Hi, I am interested in ${u.unit_type ?? "the room"} (Unit ${u.unit_number}) at ${data.name} for ${kes(u.rent_amount)}. Is it still available?`
            );
            return (
              <div key={u.id} className="space-y-3 rounded-2xl border border-sand bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">
                      {u.unit_type ?? "Room"} - Unit {u.unit_number}
                    </p>
                    <p className="text-xl font-semibold text-terracotta">
                      {kes(u.rent_amount)} <span className="text-sm font-normal text-bark-soft">/ month</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {fav.canSave && (
                      <button
                        onClick={() => fav.toggle(u.id)}
                        className="rounded-xl border border-sand-dark px-4 py-2 text-sm hover:border-terracotta"
                      >
                        {fav.ids.has(u.id) ? "\u2665 Saved" : "\u2661 Save"}
                      </button>
                    )}
                    {wa && (
                      <a href={wa} target="_blank" rel="noreferrer" className="rounded-xl bg-sage-dark px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                        WhatsApp
                      </a>
                    )}
                    {call && (
                      <a href={call} className="rounded-xl border border-sand-dark px-4 py-2 text-sm hover:border-terracotta">
                        Call
                      </a>
                    )}
                  </div>
                </div>
                {u.description && <p className="text-sm text-bark-soft">{u.description}</p>}
                {u.photos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {u.photos.map((p) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={p} src={photoUrl(p)} alt={`Unit ${u.unit_number}`} className="h-36 w-52 shrink-0 rounded-xl object-cover" />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {mapQuery && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Location</h2>
            <iframe
              title="Map"
              className="h-64 w-full rounded-2xl border border-sand"
              src={`https://maps.google.com/maps?q=${mapQuery}&z=16&output=embed`}
              loading="lazy"
            />
            <a href={`https://www.google.com/maps?q=${mapQuery}`} target="_blank" rel="noreferrer" className="text-sm text-terracotta hover:underline">
              Open in Google Maps
            </a>
          </section>
        )}

        {data.contact_name && <p className="text-sm text-bark-soft">Listed by {data.contact_name}</p>}
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="p-6 text-bark-soft">Loading...</p>}>
      <PublicPropertyPage />
    </Suspense>
  );
}
