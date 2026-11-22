// Consentimiento de cookies del visitante.
// El valor vive en localStorage (lo escribe CookieBanner) y se notifica con un
// evento propio, para que los scripts que dependen de él (MetaPixel) reaccionen
// sin recargar la página.

export const CONSENT_KEY = "vakdevi_cookie_consent";
export const CONSENT_EVENT = "vakdevi:consent";

export type ConsentValue = "accepted" | "rejected";

export function getConsent(): ConsentValue | null {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === "accepted" || value === "rejected" ? value : null;
  } catch {
    return null;
  }
}

export function setConsent(value: ConsentValue): void {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // Almacenamiento no disponible (modo privado estricto): la elección
    // solo dura esta visita, pero el evento sigue notificando.
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
