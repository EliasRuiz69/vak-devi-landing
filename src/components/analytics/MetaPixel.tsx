"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { getConsent, subscribeConsent } from "@/lib/cookie-consent";
import { loadMetaPixel } from "@/lib/meta-pixel";

// Se fija en el build (Dockerfile → ARG). Sin ID, el componente no hace nada.
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

// El panel de administración y el login no se rastrean nunca.
const EXCLUDED_PREFIXES = ["/admin", "/login"];

export default function MetaPixel() {
  const consent = useSyncExternalStore(subscribeConsent, getConsent, () => null);
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);

  const excluded = EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p));
  const active = Boolean(PIXEL_ID) && consent === "accepted" && !excluded;

  useEffect(() => {
    if (!active || !PIXEL_ID) return;
    loadMetaPixel(PIXEL_ID);
    // La navegación del App Router no recarga la página: un PageView por ruta.
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;
    window.fbq?.("track", "PageView");
  }, [active, pathname]);

  return null;
}
