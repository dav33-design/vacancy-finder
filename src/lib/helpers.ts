import { supabase } from "@/lib/supabase";

// Rename the public site here
export const SITE_NAME = "Kabarnet House Hunter";

export const PAY_INSTRUCTIONS =
  process.env.NEXT_PUBLIC_PAY_INSTRUCTIONS ??
  "To activate a plan, contact us and we will confirm your payment.";

export const UNIT_TYPES = ["Single room", "Bedsitter", "1 bedroom", "2 bedroom", "3 bedroom", "Other"];
export const AMENITIES = ["Water", "Electricity", "Parking", "Security", "Fenced compound", "WiFi"];

export function siteUrl() {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");
  return base.replace(/\/$/, "");
}

export function photoUrl(path: string) {
  return supabase.storage.from("photos").getPublicUrl(path).data.publicUrl;
}

export function kes(n: number) {
  return "KES " + Number(n).toLocaleString("en-KE");
}

export function whatsappLink(phone: string | null, text: string) {
  if (!phone) return null;
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("0")) d = "254" + d.slice(1);
  else if (d.length === 9) d = "254" + d;
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
}

// Shrinks phone photos to about 1280px wide JPEG so the site stays fast and cheap on mobile data
export async function compressImage(file: File, maxSide = 1280, quality = 0.8): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process the image");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not compress the image"))),
      "image/jpeg",
      quality
    )
  );
}

// The town the site is for. Change it when you expand.
export const TOWN = "Kabarnet";

export type Role = "landlord" | "caretaker" | "client" | null;

// Who is logged in? null = nobody. Landlords have a row in the landlords table, everyone else is a client.
export async function getRole(): Promise<Role> {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;
  const { data: l } = await supabase.from("landlords").select("id").eq("id", user.id).maybeSingle();
  if (l) return "landlord";
  const { data: c } = await supabase.from("caretakers").select("id").eq("user_id", user.id).limit(1);
  return c && c.length > 0 ? "caretaker" : "client";
}

// Where each kind of user lands after logging in
export function homeFor(r: Role) {
  return r === "landlord" ? "/dashboard" : r === "caretaker" ? "/caretaker" : "/account";
}
