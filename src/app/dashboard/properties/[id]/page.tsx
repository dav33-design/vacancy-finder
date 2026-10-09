"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PhotoManager from "@/components/PhotoManager";
import { AMENITIES, UNIT_TYPES, kes } from "@/lib/helpers";

type Unit = {
  id: string;
  unit_number: string;
  unit_type: string | null;
  rent_amount: number;
  status: "vacant" | "occupied";
  is_listed: boolean;
};

type PlanInfo = { name: string; max_photos_per_unit: number | null; qr_enabled: boolean };

function PropertyPage() {
  const { id } = useParams<{ id: string }>();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);

  // details form
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [saved, setSaved] = useState("");

  // unit form
  const [unitNumber, setUnitNumber] = useState("");
  const [unitType, setUnitType] = useState(UNIT_TYPES[0]);
  const [rent, setRent] = useState("");
  const [vacantOnly, setVacantOnly] = useState(false);
  const [openUnit, setOpenUnit] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadUnits() {
    const { data } = await supabase.from("units").select("*").eq("property_id", id).order("unit_number");
    setUnits((data as Unit[]) ?? []);
  }

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase
        .from("properties")
        .select("name, slug, area, description, latitude, longitude, amenities")
        .eq("id", id)
        .single();
      if (p) {
        setName(p.name);
        setSlug(p.slug);
        setArea(p.area ?? "");
        setDescription(p.description ?? "");
        setAmenities(p.amenities ?? []);
        setLat(p.latitude != null ? String(p.latitude) : "");
        setLng(p.longitude != null ? String(p.longitude) : "");
      }
      const { data: l } = await supabase
        .from("landlords")
        .select("plans(name, max_photos_per_unit, qr_enabled)")
        .single();
      setPlan((l as unknown as { plans: PlanInfo | null } | null)?.plans ?? null);
      loadUnits();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function saveDetails(e: React.FormEvent) {
    e.preventDefault();
    setSaved("");
    const { error } = await supabase
      .from("properties")
      .update({
        area: area.trim() || null,
        description: description.trim() || null,
        amenities,
        latitude: lat ? Number(lat) : null,
        longitude: lng ? Number(lng) : null,
      })
      .eq("id", id);
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

  async function addUnit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const { error } = await supabase
      .from("units")
      .insert({ property_id: id, unit_number: unitNumber, unit_type: unitType, rent_amount: Number(rent) });
    if (error) {
      setError(error.message.includes("duplicate") ? "That unit number already exists in this property." : error.message);
    } else {
      setUnitNumber("");
      setRent("");
      loadUnits();
    }
  }

  async function toggleListed(u: Unit) {
    await supabase.from("units").update({ is_listed: !u.is_listed }).eq("id", u.id);
    loadUnits();
  }

  const shown = vacantOnly ? units.filter((u) => u.status === "vacant") : units;
  const vacantCount = units.filter((u) => u.status === "vacant").length;
  const input =
    "rounded-xl border border-sand-dark bg-white px-3 py-2 text-bark outline-none focus:border-terracotta";
  const card = "rounded-2xl border border-sand bg-white p-5 shadow-sm";

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/properties" className="text-sm text-bark-soft hover:text-terracotta">
          &larr; Properties
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{name}</h1>
        <p className="text-bark-soft">
          {units.length === 0
            ? "No units yet"
            : vacantCount > 0
            ? `${vacantCount} vacant of ${units.length} units`
            : "No vacant units - fully occupied"}
        </p>
        {slug && (
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <Link href={`/p/${slug}`} target="_blank" className="rounded-xl border border-sand-dark bg-white px-4 py-2 hover:border-terracotta">
              View public page
            </Link>
            <Link href={`/dashboard/properties/${id}/poster`} className="rounded-xl border border-sand-dark bg-white px-4 py-2 hover:border-terracotta">
              Link and QR poster
            </Link>
          </div>
        )}
      </div>

      {/* details and location */}
      <form onSubmit={saveDetails} className={`${card} space-y-4`}>
        <h2 className="text-lg font-medium">Details and location</h2>
        <input className={`${input} w-full`} placeholder="Area (e.g. Kabarnet town, Kapropita)" value={area} onChange={(e) => setArea(e.target.value)} />
        <textarea className={`${input} w-full`} rows={3} placeholder="Short description (water, security, how far from the road...)" value={description} onChange={(e) => setDescription(e.target.value)} />
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

      {/* building photos */}
      <section className={`${card} space-y-3`}>
        <h2 className="text-lg font-medium">Building photos</h2>
        <p className="text-sm text-bark-soft">Outside view, gate, compound. The first photo is the cover.</p>
        <PhotoManager propertyId={id} />
      </section>

      {/* units */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Rooms and units</h2>
        <form onSubmit={addUnit} className="flex flex-wrap gap-3">
          <input className={input} placeholder="Unit / room no. (e.g. A1)" value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} required />
          <select className={input} value={unitType} onChange={(e) => setUnitType(e.target.value)}>
            {UNIT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <input className={input} type="number" min="0" placeholder="Monthly rent (KES)" value={rent} onChange={(e) => setRent(e.target.value)} required />
          <button className="rounded-xl bg-terracotta px-4 py-2 font-medium text-white hover:bg-terracotta-dark">Add unit</button>
        </form>
        {error && <p className="text-sm text-rose-700">{error}</p>}

        <label className="flex items-center gap-2 text-sm text-bark-soft">
          <input type="checkbox" checked={vacantOnly} onChange={(e) => setVacantOnly(e.target.checked)} />
          Show vacant rooms only
        </label>

        <ul className="divide-y divide-sand rounded-2xl border border-sand bg-white shadow-sm">
          {shown.map((u) => (
            <li key={u.id} className="space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">
                    Unit {u.unit_number} <span className="text-sm font-normal text-bark-soft">{u.unit_type}</span>
                  </p>
                  <p className="text-sm text-bark-soft">{kes(u.rent_amount)} / month</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  {u.status === "vacant" && (
                    <label className="flex items-center gap-2 text-sm text-bark-soft">
                      <input type="checkbox" checked={u.is_listed} onChange={() => toggleListed(u)} />
                      Show on public site
                    </label>
                  )}
                  <button
                    onClick={() => setOpenUnit(openUnit === u.id ? null : u.id)}
                    className="text-sm text-terracotta hover:underline"
                  >
                    {openUnit === u.id ? "Hide photos" : "Photos"}
                  </button>
                  <span className={`rounded-full px-3 py-1 text-sm ${u.status === "vacant" ? "bg-sage-light text-sage-dark" : "bg-rose-100 text-rose-800"}`}>
                    {u.status === "vacant" ? "Vacant" : "Occupied"}
                  </span>
                </div>
              </div>
              {openUnit === u.id && (
                <PhotoManager propertyId={id} unitId={u.id} max={plan?.max_photos_per_unit} />
              )}
            </li>
          ))}
          {shown.length === 0 && (
            <li className="p-4 text-bark-soft">{vacantOnly ? "No vacant rooms." : "No units yet. Add one above."}</li>
          )}
        </ul>
      </section>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="p-6 text-bark-soft">Loading...</p>}>
      <PropertyPage />
    </Suspense>
  );
}
