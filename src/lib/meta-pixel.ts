// Meta Pixel — carga del script base de Meta (equivalente al snippet oficial).
// Solo se llama desde MetaPixel.tsx, que comprueba antes el consentimiento.
// Nunca enviar datos personales ni de salud (nombre, email, teléfono, servicio).

import { getConsent } from "@/lib/cookie-consent";

interface Fbq {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: Fbq;
  loaded: boolean;
  version: string;
}

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

export function loadMetaPixel(pixelId: string): void {
  if (typeof window === "undefined" || window.fbq) return;

  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) {
      fbq.callMethod(...args);
    } else {
      fbq.queue.push(args);
    }
  } as Fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];

  window.fbq = fbq;
  if (!window._fbq) window._fbq = fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  // Desactiva los eventos automáticos de Meta (clics en botones con su texto,
  // metadatos de la página): podrían enviar nombres de servicios terapéuticos.
  // Debe ir antes de "init".
  fbq("set", "autoConfig", false, pixelId);
  fbq("init", pixelId);
}

// Eventos estándar de Meta que usa el sitio. Se envían SIN parámetros:
// ni datos personales ni el nombre del servicio (información de salud).
export type MetaStandardEvent = "Schedule";

// No-op si el pixel no está cargado (sin ID) o si no hay consentimiento
// vigente (también cubre retirarlo con el pixel ya cargado).
export function trackMetaEvent(event: MetaStandardEvent): void {
  if (typeof window === "undefined" || getConsent() !== "accepted") return;
  window.fbq?.("track", event);
}
