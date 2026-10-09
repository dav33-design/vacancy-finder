"use client";

import Link from "next/link";
import { kes, photoUrl } from "@/lib/helpers";

export type Listing = {
  unit_id: string;
  property_slug: string;
  property_name: string;
  area: string | null;
  unit_number: string;
  unit_type: string | null;
  rent_amount: number;
  cover_photo: string | null;
  contact_phone: string | null;
  featured?: boolean;
  available?: boolean;
};

export default function ListingCard({
  x,
  saved,
  onToggle,
}: {
  x: Listing;
  saved?: boolean;
  onToggle?: (unitId: string) => void;
}) {
  const unavailable = x.available === false;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-sand bg-white shadow-sm transition hover:shadow-md ${
        unavailable ? "opacity-60" : ""
      }`}
    >
      <Link href={`/p/${x.property_slug}`} className="block">
        <div className="relative h-48 bg-sand">
          {x.cover_photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl(x.cover_photo)}
              alt={`${x.property_name} unit ${x.unit_number}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-bark-soft">No photo yet</div>
          )}
          {x.featured && (
            <span className="absolute left-3 top-3 rounded-full bg-terracotta px-3 py-1 text-xs font-medium text-white">
              Featured
            </span>
          )}
        </div>
        <div className="p-4">
          <p className="text-lg font-semibold text-terracotta">
            {kes(x.rent_amount)} <span className="text-sm font-normal text-bark-soft">/ month</span>
          </p>
          <p className="font-medium">
            {x.unit_type ?? "Room"} - Unit {x.unit_number}
          </p>
          <p className="text-sm text-bark-soft">
            {x.property_name}
            {x.area ? `, ${x.area}` : ""}
          </p>
          {unavailable && <p className="mt-2 text-sm font-medium text-rose-700">No longer available</p>}
        </div>
      </Link>

      {onToggle && (
        <button
          type="button"
          onClick={() => onToggle(x.unit_id)}
          aria-label={saved ? "Remove from saved rooms" : "Save this room"}
          className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-sm shadow hover:bg-white"
        >
          {saved ? "\u2665 Saved" : "\u2661 Save"}
        </button>
      )}
    </div>
  );
}
