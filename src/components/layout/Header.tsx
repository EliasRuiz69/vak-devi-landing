"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const NAV_LINKS = [
  { href: "#proposito", label: "Propósito" },
  { href: "#servicios", label: "Servicios" },
  { href: "#para-quien", label: "Para quién" },
  { href: "#quien-te-acompana", label: "Quién te acompaña" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        scrolled ? "bg-lavender/90 backdrop-blur-sm shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-10">
        <Link href="/" className="flex items-center gap-3">
          <div
            className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 overflow-hidden rounded-full"
            style={scrolled ? { mixBlendMode: "multiply" } : undefined}
          >
            <Image
              src="/logo-vak-devi-svg/vak_devi_logo_fondo_transparente.svg"
              alt="Vāk Devi"
              width={200}
              height={200}
              className="h-full w-full object-cover scale-[1.12]"
              style={{ objectPosition: "50% 22%" }}
              priority
            />
          </div>
          <span
            className={`font-serif text-lg tracking-wide sm:text-xl ${
              scrolled ? "text-purple-2" : "text-white"
            }`}
          >
            VĀK DEVI
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm tracking-wide transition-colors ${
                scrolled
                  ? "text-ink/80 hover:text-purple-1"
                  : "text-white/85 hover:text-white"
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <Link
          href="/agendar"
          className={`hidden rounded-full px-5 py-2 text-sm transition-colors sm:inline-flex ${
            scrolled
              ? "bg-purple-1 text-white hover:bg-purple-2"
              : "border border-white/70 text-white hover:bg-white hover:text-purple-1"
          }`}
        >
          Agenda tu sesión
        </Link>
      </div>
    </header>
  );
}
