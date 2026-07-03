"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import Logo from "@/components/ui/Logo";
import { signOut } from "@/app/actions/auth";

const NAV = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    d: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
  },
  {
    href: "/admin/citas",
    label: "Citas",
    d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  {
    href: "/admin/servicios",
    label: "Servicios",
    d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  },
  {
    href: "/admin/disponibilidad",
    label: "Disponibilidad",
    d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    href: "/admin/clientes",
    label: "Clientes",
    d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  },
];

function NavIcon({ d }: { d: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}

export default function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  function active(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 h-screen bg-white border-r border-ink/8 overflow-y-auto">
        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-3 border-b border-ink/6">
          <Logo className="h-9 w-9 shrink-0" variant="purple" />
          <div>
            <p className="font-serif text-sm tracking-widest text-ink leading-tight">VĀK DEVI</p>
            <p className="text-[10px] text-ink/40 tracking-wider uppercase mt-0.5">Administración</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 flex flex-col gap-0.5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active(item.href)
                  ? "bg-purple-1/8 text-purple-1"
                  : "text-ink/50 hover:bg-ink/4 hover:text-ink"
              }`}
            >
              <NavIcon d={item.d} />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-ink/6">
          <p className="text-xs text-ink/60 truncate px-2 mb-2">{userEmail}</p>
          <button
            type="button"
            onClick={() => startTransition(() => signOut())}
            data-lpignore="true"
            data-form-type="other"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-ink/65 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Mobile top nav ───────────────────────────────── */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-b border-ink/8 px-3 py-2 flex items-center gap-2 overflow-x-auto">
        <Link href="/" className="shrink-0 mr-1">
          <Logo className="h-7 w-7" variant="purple" />
        </Link>
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
              active(item.href)
                ? "bg-purple-1 text-white"
                : "border border-ink/15 text-ink/60 hover:border-purple-3 hover:text-ink"
            }`}
          >
            <NavIcon d={item.d} />
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
