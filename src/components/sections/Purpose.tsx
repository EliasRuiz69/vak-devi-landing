import RevealText from "@/components/ui/RevealText";

export default function Purpose() {
  return (
    <section id="proposito" className="bg-lavender px-6 py-28 sm:px-10 lg:py-36">
      <div className="mx-auto max-w-3xl">
        <div className="mb-16 lg:mb-20">
          <div data-line className="mb-8 h-px w-16 bg-purple-3" />
          <RevealText
            as="h2"
            className="font-serif text-3xl leading-snug text-ink sm:text-4xl lg:text-5xl"
          >
            Propósito
          </RevealText>
        </div>

        <RevealText
          as="p"
          className="font-serif text-2xl leading-relaxed text-ink sm:text-3xl lg:text-4xl"
        >
          Vivimos corriendo de nosotros mismos. Buscamos respuestas en el trabajo, en
          las relaciones, en las pantallas. Y aun así, algo sigue faltando.
        </RevealText>

        <RevealText
          as="p"
          delay={0.1}
          className="mt-8 font-serif text-xl leading-relaxed text-purple-2 sm:text-2xl"
        >
          Vak Devi nació para ofrecer algo distinto: un camino hacia adentro. Un
          proceso honesto, profundo y humano para que puedas conocerte, sanar lo que
          duele y construir una vida que tenga sentido para ti.
        </RevealText>
      </div>
    </section>
  );
}
