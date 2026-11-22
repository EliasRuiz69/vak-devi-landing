"use client";

import { clearConsent } from "@/lib/cookie-consent";

// Pie de página: borra la elección de cookies para que el banner reaparezca
// y el visitante pueda cambiarla o retirar su consentimiento.
export default function CookiePreferencesButton() {
  return (
    <button
      type="button"
      onClick={clearConsent}
      className="hover:text-purple-2 underline underline-offset-2 transition-colors"
    >
      Preferencias de cookies
    </button>
  );
}
