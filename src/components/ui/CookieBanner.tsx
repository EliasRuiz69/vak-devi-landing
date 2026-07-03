"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const CONSENT_KEY = "vakdevi_cookie_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem(CONSENT_KEY, "rejected");
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Consentimiento de cookies"
      className="fixed bottom-0 inset-x-0 z-[9999] bg-lavender border-t border-ink/10 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-5 py-4 sm:px-8"
    >
      <div className="mx-auto max-w-5xl flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
        <p className="flex-1 text-sm text-ink/80 leading-relaxed">
          Utilizamos cookies propias y de terceros para analizar el uso del sitio y mejorar tu experiencia. Puedes aceptarlas o gestionarlas.{" "}
          <Link
            href="/politica-de-cookies"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-2 underline underline-offset-2 hover:text-purple-1 transition-colors"
          >
            Política de Cookies
          </Link>
        </p>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            onClick={handleReject}
            className="rounded-full border border-purple-3/50 px-5 py-2 text-sm text-purple-2 hover:border-purple-2 transition-colors"
          >
            Solo necesarias
          </button>
          <button
            onClick={handleAccept}
            className="rounded-full bg-purple-1 px-5 py-2 text-sm text-white hover:bg-purple-2 transition-colors"
          >
            Aceptar todas
          </button>
        </div>
      </div>
    </div>
  );
}
