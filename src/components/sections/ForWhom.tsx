import RevealText from "@/components/ui/RevealText";

const LINES = [
  "Para quien siente que algo de adentro necesita atención.",
  "Para quien está cansado de sobrevivir y quiere empezar a vivir.",
  "Para quien lleva mucho tiempo siendo lo que los demás esperan.",
  "Para quien sabe que hay más y quiere encontrarlo...",
];

export default function ForWhom() {
  return (
    <section id="para-quien" className="bg-lavender px-6 py-28 sm:px-10 lg:py-40">
      <div className="mx-auto max-w-4xl">
        <div className="mb-16 lg:mb-20">
          <div data-line className="mb-8 h-px w-16 bg-purple-3" />
          <RevealText
            as="h2"
            className="font-serif text-3xl leading-snug text-ink sm:text-4xl lg:text-5xl"
          >
            ¿Para quién?
          </RevealText>
        </div>
        <div className="text-center">
          {LINES.map((line, i) => (
            <RevealText
              key={line}
              as="p"
              delay={i * 0.05}
              className="font-serif text-2xl leading-relaxed text-purple-2 sm:text-3xl lg:text-4xl"
            >
              {line}
            </RevealText>
          ))}
        </div>
      </div>
    </section>
  );
}
