"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import RevealText from "@/components/ui/RevealText";

const CREDENTIALS = [
  "Maestría en Psicoterapia Ericksoniana — Centro Ericksoniano de México (CEM)",
  "Diplomada en Constelaciones Familiares Ericksonianas",
  "Evaluadora certificada EQ-i 2.0 · EQ-360",
  "Capacitadora y tallerista en educación y crecimiento humano",
];

export default function AboutTherapist() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      // Decorative lines: width reveal (scoped to section)
      section.querySelectorAll<HTMLElement>("[data-line]").forEach((el) => {
        gsap.from(el, {
          scaleX: 0,
          transformOrigin: "left",
          duration: 0.9,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 90%" },
        });
      });

      // Generic fade+slide: photo placeholder, h3 labels
      section.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 28,
          duration: 0.9,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });

      // Credential list items: stagger reveal
      const list = section.querySelector<HTMLUListElement>("[data-list]");
      if (list) {
        gsap.from(list.querySelectorAll("li"), {
          opacity: 0,
          x: -18,
          duration: 0.7,
          ease: "expo.out",
          stagger: 0.1,
          scrollTrigger: { trigger: list, start: "top 85%" },
        });
      }

      // CTAs: fade+slide
      const cta = section.querySelector<HTMLDivElement>("[data-cta]");
      if (cta) {
        gsap.from(cta, {
          opacity: 0,
          y: 20,
          duration: 0.8,
          ease: "expo.out",
          scrollTrigger: { trigger: cta, start: "top 90%" },
        });
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="quien-te-acompana"
      className="bg-lavender px-6 py-28 sm:px-10 lg:py-40"
    >
      <div className="mx-auto max-w-5xl">

        {/* ── Section title ── */}
        <div className="mb-16 lg:mb-20">
          <div data-line className="mb-8 h-px w-16 bg-purple-3" />
          <RevealText
            as="h2"
            className="font-serif text-3xl leading-snug text-ink sm:text-4xl lg:text-5xl"
          >
            Quién te acompaña
          </RevealText>
        </div>

        {/* ── Two-column: photo + opening bio ── */}
        <div className="grid gap-16 lg:grid-cols-[2fr_3fr] lg:gap-24">

          {/* Photo placeholder */}
          <div data-reveal className="flex items-start justify-center lg:justify-start">
            <div className="aspect-[3/4] w-full max-w-[280px] overflow-hidden rounded-2xl border border-purple-3/25 bg-white shadow-sm lg:max-w-full">
              <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-purple-3/40">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-8 w-8 text-purple-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="text-center text-sm text-purple-2/50">Foto de Ámbar</p>
              </div>
            </div>
          </div>

          {/* Opening bio */}
          <div className="flex flex-col gap-7">
            <RevealText
              as="p"
              className="font-serif text-xl font-bold italic text-purple-1 sm:text-2xl"
            >
              Mi nombre es Ámbar Escalante.
            </RevealText>

            <RevealText
              as="p"
              className="font-serif text-lg italic leading-relaxed text-ink/75 sm:text-xl"
            >
              Hubo un momento en mi vida en que tuve que detenerme y preguntarme quién era yo realmente, más allá de los roles que había aprendido a habitar.
            </RevealText>

            <RevealText
              as="p"
              className="font-serif text-lg italic leading-relaxed text-ink/75 sm:text-xl"
            >
              Esa pregunta lo cambió todo. Y desde entonces, acompañar a otras personas en ese mismo camino se convirtió en mi vocación más honesta.
            </RevealText>

            <RevealText
              as="p"
              className="text-base leading-relaxed text-ink/70 sm:text-lg"
            >
              Soy psicoterapeuta Ericksoniana y educadora en temas de crecimiento personal y de apreciación por la naturaleza y la cultura que nos rodea — dimensiones que entiendo como aspectos integrales del ser humano. Esa diversidad no es casualidad: es la base de un enfoque verdaderamente holístico.
            </RevealText>

            <RevealText
              as="p"
              className="text-base leading-relaxed text-ink/70 sm:text-lg"
            >
              A lo largo de mi experiencia he acompañado a personas en momentos de crisis, transición y búsqueda: seres que sienten que algo adentro pide ser atendido, y que están listos para mirarlo con honestidad.
            </RevealText>
          </div>
        </div>

        {/* ── Mi forma de trabajar ── */}
        <div className="mt-24 max-w-3xl lg:mt-32">
          <div data-line className="mb-8 h-px w-16 bg-purple-3" />
          <h3
            data-reveal
            className="mb-8 font-sans text-xs font-bold uppercase tracking-[0.22em] text-purple-1"
          >
            MI FORMA DE TRABAJAR
          </h3>

          <div className="flex flex-col gap-6">
            <RevealText
              as="p"
              className="text-base leading-relaxed text-ink/70 sm:text-lg"
            >
              Creo en procesos profundos, no en soluciones rápidas. En la escucha antes que en el consejo. En que cada persona lleva dentro los recursos que necesita — y que a veces solo hace falta un espacio seguro para encontrarlos.
            </RevealText>

            <RevealText
              as="p"
              className="text-base leading-relaxed text-ink/70 sm:text-lg"
            >
              Trabajo desde la presencia, la honestidad y el respeto profundo por el ritmo de cada proceso.
            </RevealText>
          </div>
        </div>

        {/* ── Formación y práctica ── */}
        <div className="mt-24 lg:mt-32">
          <div data-line className="mb-8 h-px w-16 bg-purple-3" />
          <h3
            data-reveal
            className="mb-10 font-sans text-xs font-bold uppercase tracking-[0.22em] text-purple-1"
          >
            FORMACIÓN Y PRÁCTICA
          </h3>

          <div className="max-w-3xl">
            <p
              data-reveal
              className="mb-7 font-sans text-xs font-bold uppercase tracking-widest text-ink/60"
            >
              Psicoterapia y acompañamiento
            </p>

            <ul data-list className="mb-12 space-y-5">
              {CREDENTIALS.map((item) => (
                <li key={item} className="flex items-start gap-4">
                  <span
                    aria-hidden
                    className="mt-2.5 block h-1.5 w-1.5 flex-none rounded-full bg-purple-1"
                  />
                  <span className="text-base leading-relaxed text-ink/70 sm:text-lg">
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            <RevealText
              as="p"
              className="font-serif text-base italic leading-relaxed text-ink/65 sm:text-lg"
            >
              Mi camino ha sido diverso y profundo: la Danza, la Educación Ambiental, la Inteligencia Emocional y la Inteligencia Espiritual, formaciones que nutren mi mirada sobre el ser humano en su relación con el cuerpo, la naturaleza y el entorno. A esto se suman años de estudio y práctica del Budismo, el Tantra de Sri Vidya y la Ontogonía, caminos que han profundizado mi comprensión de la dimensión trascendental como parte esencial de quienes somos.
            </RevealText>

            <RevealText
              as="p"
              delay={0.1}
              className="mt-7 font-serif text-base italic leading-relaxed text-purple-2 sm:text-lg"
            >
              Si algo en estas palabras resuena contigo, me alegra que hayas llegado hasta aquí.
            </RevealText>

            <RevealText
              as="p"
              delay={0.18}
              className="mt-4 font-serif text-base italic leading-relaxed text-purple-2 sm:text-lg"
            >
              Este puede ser el comienzo de algo importante.
            </RevealText>
          </div>
        </div>

        {/* ── CTAs ── */}
        <div
          data-cta
          className="mt-14 flex flex-col items-start gap-4 sm:flex-row sm:items-center"
        >
          <a
            href="/agendar"
            className="inline-flex items-center justify-center rounded-full bg-purple-1 px-8 py-4 text-sm tracking-wide text-white transition-colors duration-300 hover:bg-purple-2 sm:text-base"
          >
            Agenda tu sesión exploratoria gratuita
          </a>
          <a
            href="mailto:ambarescalantediaz@gmail.com"
            className="inline-flex items-center justify-center rounded-full border border-purple-1 px-8 py-4 text-sm tracking-wide text-purple-1 transition-colors duration-300 hover:bg-purple-1 hover:text-white sm:text-base"
          >
            Escríbeme
          </a>
        </div>

      </div>
    </section>
  );
}
