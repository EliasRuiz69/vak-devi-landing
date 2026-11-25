"use client";

import { usePathname } from "next/navigation";
import { waLink } from "@/lib/whatsapp";
import { trackMetaEvent } from "@/lib/meta-pixel";

// Botón flotante para abrir el chat de WhatsApp de Vak Devi con un mensaje
// precargado. No se muestra en el panel ni en el login. Al pulsarlo envía el
// evento estándar Contact de Meta, sin parámetros y solo si hay
// consentimiento de cookies (trackMetaEvent ya lo comprueba).
export default function WhatsAppButton() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/login")) return null;

  return (
    <a
      href={waLink()}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackMetaEvent("Contact")}
      aria-label="Escríbenos por WhatsApp"
      className="fixed bottom-5 right-5 z-[60] inline-flex items-center gap-2 rounded-full bg-purple-1 px-4 py-3 text-sm text-white shadow-[0_6px_24px_rgba(42,18,48,0.25)] transition-colors hover:bg-purple-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-2"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.5L3 21l2-5.4A8.4 8.4 0 1 1 21 11.5z" />
      </svg>
      <span>WhatsApp</span>
    </a>
  );
}
