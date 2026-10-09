"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AuthGuard from "@/components/AuthGuard";
import SiteHeader from "@/components/SiteHeader";
import PhotoManager from "@/components/PhotoManager";
import UnitStatusButton from "@/components/UnitStatusButton";
import { AMENITIES } from "@/lib/helpers";

type Prop = {
  property_id: string;
  property_name: string;
  landlord_id: string;
  max_photos_per_unit: number | null;
};

type Unit = {
  id: string;
  unit_number: string;
  unit_type: string | null;
  status: "vacant" | "occupied";
};

function Inner() {
  const { id } = useParams<{ id: string }>();
  const [prop, setProp] = useState<Prop | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [slug, setSlug] = useState("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [openUnit, setOpenUnit] = useState<string | null>(null);

  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [saved, setSaved] = useState("");

  async function loadUnits() {
    const { data } = await supabase
      .from("units")
      .select("id, unit_number, unit_type, status")
      .eq("property_id", id)
      .order("unit_number");
    setUnits((data as Unit[]) ?? []);
  }

  useEffect(() => {
    (async () => {
      const { data: list } = await supabase.rpc("my_caretaker_properties");
      const p = ((list as Prop[]) ?? []).find((x) => x.property_id === id) ?? null;
      setProp(p);
      if (p) {
        const { data: d } = await supabase
          .from("properties")
          .select("slug, area, description, latitude, longitude, amenities")
          .eq("id", id)
          .maybeSingle();
        if (d) {
          setSlug(d.slug);
          setArea(d.area ?? "");
          setDescription(d.description ?? "");
          setAmenities(d.amenities ?? []);
          setLat(d.latitude != null ? String(d.latitude) : "");
          setLng(d.longitude != null ? String(d.longitude) : "");
        }
        loadUnits();
      }
      setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function saveDetails(e: React.FormEvent) {
    e.preventDefault();
    setSaved("");
    const { error } = await supabase.rpc("caretaker_update_property", {
      p_property: id,
      p_area: area.trim() || null,
      p_description: description.trim() || null,
      p_latitude: lat ? Number(lat) : null,
      p_longitude: lng ? Number(lng) : null,
      p_amenities: amenities,
    });
    setSaved(error ? error.message : "Saved");
  }

  function fillCurrentLocation() {
    setSaved("");
    if (!navigator.geolocation) {
      setSaved("Your browser cannot get your location. Enter it manually.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setSaved("Location captured. Press Save details to keep it.");
      },
      () => setSaved("Could not get your location. Allow location access, or enter it manually."),
      { enableHighAccuracy: true }
    );
  }

  function toggleAmenity(a: string) {
    setAmenities((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]));
  }

  const input =
    "rounded-xl border border-sand-dark bg-white px-3 py-2 text-bark outline-none focus:border-terracotta";
  const card = "rounded-2xl border border-sand bg-white p-5 shadow-sm";

  return (
    <div className="min-h-screen bg-cream text-bark">
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-6 p-6">
        <Link href="/caretaker" className="text-sm text-bark-soft hover:text-terracotta">
          &larr; My properties
        </Link>

        {!loaded ? (
          <p className="text-bark-soft">Loading...</p>
        ) : !prop ? (
          <p className="rounded-2xl border border-sand bg-white p-5 text-bark-soft">
            You are not assigned to this property.
          </p>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-semibold">{prop.property_name}</h1>
              {slug && (
                <Link href={`/p/${slug}`} target="_blank" className="text-sm text-terracotta hover:underline">
                  View public page
                </Link>
              )}
            </div>

            <form onSubmit={saveDetails} className={`${card} space-y-4`}>
              <h2 className="text-lg font-medium">Details and location</h2>
              <input className={`${input} w-full`} placeholder="Area (e.g. Kabarnet town, Kapropita)" value={area} onChange={(e) => setArea(e.target.value)} />
              <textarea className={`${input} w-full`} rows={3} placeholder="Short description" value={description} onChange={(e) => setDescription(e.target.value)} />
              <div className="flex flex-wrap gap-3">
                {AMENITIES.map((a) => (
                  <label key={a} className="flex items-center gap-2 text-sm text-bark-soft">
                    <input type="checkbox" checked={amenities.includes(a)} onChange={() => toggleAmenity(a)} />
                    {a}
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <input className={`${input} w-40`} placeholder="Latitude" value={lat} onChange={(e) => setLat(e.target.value)} />
                <input className={`${input} w-40`} placeholder="Longitude" value={lng} onChange={(e) => setLng(e.target.value)} />
                <button type="button" onClick={fillCurrentLocation} className="rounded-xl border border-sand-dark bg-white px-4 py-2 text-sm hover:border-terracotta">
                  Use my current location
                </button>
              </div>
              <p className="text-xs text-bark-soft">Tip: stand at the building gate and tap the location button for an exact pin.</p>
              <div className="flex items-center gap-3">
                <button className="rounded-xl bg-terracotta px-4 py-2 font-medium text-white hover:bg-terracotta-dark">Save details</button>
                {saved && <span className="text-sm text-bark-soft">{saved}</span>}
              </div>
            </form>

            <section className={`${card} space-y-3`}>
              <h2 className="text-lg font-medium">Building photos</h2>
              <p className="text-sm text-bark-soft">Outside view, gate, compound. The first photo is the cover.</p>
              <PhotoManager propertyId={id} landlordId={prop.landlord_id} />
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-medium">Rooms</h2>
              <ul className="divide-y divide-sand rounded-2xl border border-sand bg-white shadow-sm">
                {units.map((u) => (
                  <li key={u.id} className="space-y-3 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          Unit {u.unit_number} <span className="text-sm font-normal text-bark-soft">{u.unit_type}</span>
                        </p>
                        <span className={`rounded-full px-3 py-1 text-xs ${u.status === "vacant" ? "bg-sage-light text-sage-dark" : "bg-rose-100 text-rose-800"}`}>
                          {u.status === "vacant" ? "Vacant" : "Taken"}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        <UnitStatusButton unitId={u.id} status={u.status} onDone={loadUnits} caretaker />
                        <button
                          onClick={() => setOpenUnit(openUnit === u.id ? null : u.id)}
                          className="text-sm text-terracotta hover:underline"
                        >
                          {openUnit === u.id ? "Hide photos" : "Photos"}
                        </button>
                      </div>
                    </div>
                    {openUnit === u.id && (
                      <PhotoManager propertyId={id} unitId={u.id} landlordId={prop.landlord_id} max={prop.max_photos_per_unit} />
                    )}
                  </li>
                ))}
                {units.length === 0 && <li className="p-4 text-bark-soft">The landlord has not added rooms yet.</li>}
              </ul>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default function CaretakerPropertyPage() {
  return (
    <AuthGuard role="caretaker">
      <Suspense fallback={<p className="p-6 text-bark-soft">Loading...</p>}>
        <Inner />
      </Suspense>
    </AuthGuard>
  );
}
