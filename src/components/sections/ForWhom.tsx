import RevealText from "@/components/ui/RevealText";

const LINES = [
  "Para quien siente que algo adentro necesita atención.",
  "Para quien está cansado de sobrevivir y quiere empezar a vivir.",
  "Para quien lleva mucho tiempo siendo quien los demás esperan.",
  "Para quien sabe que hay más, y quiere encontrarlo.",
];

export default function ForWhom() {
  return (
    <section id="para-quien" className="bg-lavender px-6 py-28 sm:px-10 lg:py-40">
      <div className="mx-auto max-w-4xl text-center">
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
    </section>
  );
}
