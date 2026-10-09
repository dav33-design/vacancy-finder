"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import { supabase } from "@/lib/supabase";
import { siteUrl } from "@/lib/helpers";

function PosterPage() {
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [phone, setPhone] = useState("");
  const [qrEnabled, setQrEnabled] = useState(true);
  const [qr, setQr] = useState("");

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from("properties").select("name, slug").eq("id", id).single();
      if (p) {
        setName(p.name);
        setSlug(p.slug);
      }
      const { data: l } = await supabase.from("landlords").select("phone, plans(qr_enabled)").single();
      const row = l as unknown as { phone: string | null; plans: { qr_enabled: boolean } | null } | null;
      setPhone(row?.phone ?? "");
      setQrEnabled(row?.plans?.qr_enabled ?? false);
    })();
  }, [id]);

  const url = slug ? `${siteUrl()}/p/${slug}` : "";

  useEffect(() => {
    if (url && qrEnabled) {
      QRCode.toDataURL(url, { width: 700, margin: 1, color: { dark: "#3e2f26", light: "#ffffff" } }).then(setQr);
    }
  }, [url, qrEnabled]);

  return (
    <div className="space-y-6">
      <div className="print:hidden space-y-3">
        <Link href={`/dashboard/properties/${id}`} className="text-sm text-bark-soft hover:text-terracotta">
          &larr; Back to property
        </Link>
        {url.includes("localhost") && (
          <p className="rounded-xl bg-amber-100 p-3 text-sm text-amber-900">
            This QR code points to localhost, so it only works on your own computer. Deploy the site to Vercel first,
            then print the poster from the live site.
          </p>
        )}
        {!qrEnabled && (
          <p className="rounded-xl bg-sand-light p-3 text-sm">
            QR posters are included in the Standard and Premium plans. You can still share the link below.
          </p>
        )}
        <button
          onClick={() => window.print()}
          className="rounded-xl bg-terracotta px-4 py-2 font-medium text-white hover:bg-terracotta-dark"
        >
          Print poster
        </button>
      </div>

      <div className="mx-auto max-w-xl rounded-3xl border-4 border-terracotta bg-white p-10 text-center shadow-sm print:shadow-none">
        <p className="text-sm uppercase tracking-widest text-bark-soft">{name}</p>
        <h1 className="mt-2 text-5xl font-bold text-terracotta">Rooms Available</h1>
        <p className="mt-3 text-lg">Scan to see vacant rooms, prices and photos</p>
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt="QR code" className="mx-auto my-6 h-72 w-72" />
        ) : (
          <div className="mx-auto my-6 flex h-72 w-72 items-center justify-center rounded-2xl bg-sand-light text-bark-soft">
            {qrEnabled ? "Preparing QR..." : "QR not on your plan"}
          </div>
        )}
        <p className="break-all text-sm text-bark-soft">{url}</p>
        {phone && <p className="mt-4 text-xl font-semibold">Call: {phone}</p>}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="p-6 text-bark-soft">Loading...</p>}>
      <PosterPage />
    </Suspense>
  );
}
