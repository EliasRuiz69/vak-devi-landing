import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Acceso — Vāk Devi",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-lavender px-6 py-16">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center gap-4">
          <Link href="/">
            <Logo className="h-16 w-16" variant="purple" />
          </Link>
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-purple-3">Panel de administración</p>
            <h1 className="font-serif text-2xl text-ink">Vāk Devi</h1>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-ink/8 bg-white px-8 py-10 shadow-sm">
          <LoginForm />
        </div>

        <p className="mt-8 text-center text-xs text-ink/40">
          Acceso exclusivo para la terapeuta.
        </p>
      </div>
    </div>
  );
}
