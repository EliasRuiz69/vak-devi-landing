// Consentimiento de cookies del visitante.
// El valor vive en localStorage (lo escriben CookieBanner y el botón
// "Preferencias de cookies") y se notifica con un evento propio, para que lo
// que depende de él (banner, MetaPixel) reaccione sin recargar la página.

export const CONSENT_KEY = "vakdevi_cookie_consent";
export const CONSENT_EVENT = "vakdevi:consent";

export type ConsentValue = "accepted" | "rejected";

// Cookies que crea el Meta Pixel; se borran al rechazar o retirar el consentimiento.
const MARKETING_COOKIES = ["_fbp", "_fbc"];

// Respaldo si localStorage no está disponible (modo privado estricto):
// la elección dura esta visita en lugar de dejar el banner atascado.
let memoryConsent: ConsentValue | null = null;

export function getConsent(): ConsentValue | null {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === "accepted" || value === "rejected" ? value : null;
  } catch {
    return memoryConsent;
  }
}

export function setConsent(value: ConsentValue): void {
  memoryConsent = value;
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // Sin almacenamiento: se usa memoryConsent.
  }
  if (value === "rejected") {
    removeMarketingCookies();
    // Si el pixel ya estaba cargado (el visitante retira un consentimiento
    // previo), recargar es la única forma de descargar su script.
    if (typeof window.fbq === "function") {
      window.location.reload();
      return;
    }
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

// "Preferencias de cookies": olvida la elección para que el banner reaparezca.
export function clearConsent(): void {
  memoryConsent = null;
  try {
    localStorage.removeItem(CONSENT_KEY);
  } catch {
    // Sin almacenamiento: basta con memoryConsent.
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

// Para useSyncExternalStore: escucha cambios en esta pestaña (CONSENT_EVENT)
// y en otras pestañas del mismo sitio (storage).
export function subscribeConsent(onChange: () => void): () => void {
  window.addEventListener(CONSENT_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CONSENT_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function removeMarketingCookies(): void {
  const host = window.location.hostname;
  // Meta las crea en el dominio raíz (.vakdevi-psicoterapia.com); se prueban
  // también el host exacto y sin dominio para cubrir cualquier variante.
  const domains = ["", host, `.${host.replace(/^www\./, "")}`];
  for (const name of MARKETING_COOKIES) {
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ""}`;
    }
  }
}
