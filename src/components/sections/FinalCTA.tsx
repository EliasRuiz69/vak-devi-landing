import Image from "next/image";
import RevealText from "@/components/ui/RevealText";
import Button from "@/components/ui/Button";

export default function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-purple-1 px-6 py-28 text-center sm:px-10 lg:py-36">
      {/* JPEG watermark: multiply makes white bg disappear on purple; emblem shows as darker purple */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[160%] w-auto -translate-x-1/2 -translate-y-[42%] opacity-30"
        style={{ mixBlendMode: "multiply" }}
      >
        <Image
          src="/logo-vak-devi-svg/vak_devi_logo_fondo_transparente.svg"
          alt=""
          width={905}
          height={1280}
          className="h-full w-auto"
        />
      </div>

      <div className="relative mx-auto max-w-2xl">
        <RevealText
          as="p"
          className="font-serif text-2xl leading-relaxed text-white sm:text-3xl lg:text-4xl"
        >
          El camino hacia ti comienza con una conversación.
        </RevealText>
        <RevealText
          as="p"
          delay={0.08}
          className="mt-2 font-serif text-2xl leading-relaxed text-white sm:text-3xl lg:text-4xl"
        >
          No necesitas tenerlo todo claro para dar el primer paso.
        </RevealText>

        <Button href="/agendar" variant="outline" className="mt-10">
          Agenda tu sesión exploratoria gratuita
        </Button>
      </div>
    </section>
  );
}
