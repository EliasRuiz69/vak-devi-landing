import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-lavender border-t border-ink/8 px-6 py-20 sm:px-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 text-center">
        <Image
          src="/logo-vak-devi-svg/vak_devi_logo_fondo_transparente.svg"
          alt="Vāk Devi — Encuentra tu ser, habita tu vida"
          width={905}
          height={1280}
          className="h-auto w-44 sm:w-56"
          priority={false}
        />

        <p className="max-w-md font-serif text-base text-ink/60">
          Consultoría de psicoterapia y desarrollo humano.
          <br />
          Mérida, México.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-ink/40">
          <Link
            href="/politica-de-privacidad"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-purple-2 underline underline-offset-2 transition-colors"
          >
            Política de Privacidad
          </Link>
          <span aria-hidden>|</span>
          <Link
            href="/politica-de-cookies"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-purple-2 underline underline-offset-2 transition-colors"
          >
            Política de Cookies
          </Link>
          <span aria-hidden>|</span>
          <span>© {new Date().getFullYear()} Vāk Devi. Todos los derechos reservados.</span>
        </div>
      </div>
    </footer>
  );
}
