"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { gsap } from "@/lib/gsap";
import RevealText from "@/components/ui/RevealText";
import Button from "@/components/ui/Button";
import { useIsMobile, useReducedMotion } from "@/lib/hooks";

const HeroCanvas = dynamic(() => import("./HeroCanvas"), { ssr: false });

const IMAGE_1 = "/hero/connect-1.jpg";
const IMAGE_2 = "/hero/connect-2.jpg";

export default function Hero() {
  const isMobile = useIsMobile();
  const reducedMotion = useReducedMotion();
  const useStatic = isMobile || reducedMotion;

  const [ready, setReady] = useState(false);
  const subtitleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (useStatic) setReady(true);
  }, [useStatic]);

  useEffect(() => {
    if (!ready) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 1, ease: "power2.out", delay: 0.9 }
      );
    });
    return () => ctx.revert();
  }, [ready]);

  return (
    <section className="relative h-[100svh] w-full overflow-hidden bg-ink">
      <div className="absolute inset-0">
        {useStatic ? (
          <Image
            src={IMAGE_1}
            alt=""
            fill
            priority
            className="object-cover animate-[kenburns_24s_ease-in-out_infinite]"
          />
        ) : (
          <HeroCanvas image1={IMAGE_1} image2={IMAGE_2} onReady={() => setReady(true)} />
        )}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />

      <div className="pointer-events-none relative z-10 flex h-full w-full flex-col justify-end px-6 pb-16 sm:px-10 sm:pb-20 lg:px-16 lg:pb-24">
        <div className="max-w-3xl">
          {ready && (
            <RevealText
              as="h1"
              trigger="load"
              delay={0.2}
              className="font-serif text-4xl leading-[1.15] text-white sm:text-5xl lg:text-6xl"
            >
              Hay un lugar en ti que nadie ha podido romper…
            </RevealText>
          )}

          <div ref={subtitleRef} className="mt-6 max-w-xl opacity-0">
            <p className="font-serif text-lg italic leading-relaxed text-white/90 sm:text-xl">
              Vak Devi es un espacio de acompañamiento terapéutico y desarrollo humano
              donde aprendes a habitar quien realmente eres. No se trata de arreglarte.
              Se trata de encontrarte.
            </p>
            <Button href="/agendar" className="pointer-events-auto mt-8">
              Agenda tu sesión exploratoria gratuita
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
