"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import RevealText from "@/components/ui/RevealText";
import ServiceCard from "./ServiceCard";
import { services as staticServices, type Service } from "@/content/services";

export default function Services({ services }: { services?: Service[] }) {
  const items = services ?? staticServices;
  const promoItems = items.filter((s) => s.promo);
  const regularItems = items.filter((s) => !s.promo);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const grids = root.querySelectorAll<HTMLElement>("[data-service-grid]");
    const ctx = gsap.context(() => {
      grids.forEach((grid) => {
        const cards = grid.querySelectorAll("[data-service-card]");
        gsap.from(cards, {
          opacity: 0,
          y: 32,
          duration: 0.8,
          ease: "power2.out",
          stagger: 0.08,
          scrollTrigger: {
            trigger: grid,
            start: "top 85%",
          },
        });
      });
    });

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((st) => st.refresh());
    };
  }, []);

  return (
    <section id="servicios" className="bg-white px-6 py-28 sm:px-10 lg:py-36">
      <div ref={rootRef} className="mx-auto max-w-6xl">
        <div className="mb-16 lg:mb-20">
          <div data-line className="mb-8 h-px w-16 bg-purple-3" />
          <RevealText
            as="h2"
            className="font-serif text-3xl leading-snug text-ink sm:text-4xl lg:text-5xl"
          >
            Servicios
          </RevealText>
        </div>

        <RevealText
          as="p"
          className="max-w-2xl font-serif text-2xl text-ink sm:text-3xl"
        >
          Cada proceso es único. Aquí algunas formas en que podemos caminar juntos en sesiones virtuales:
        </RevealText>

        {promoItems.length > 0 && (
          <div className="mt-14">
            <RevealText
              as="h3"
              className="font-serif text-xl text-ink sm:text-2xl"
            >
              Promociones
            </RevealText>
            <div
              data-service-grid
              className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {promoItems.map((service) => (
                <div key={service.id} data-service-card>
                  <ServiceCard service={service} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          data-service-grid
          className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {regularItems.map((service) => (
            <div key={service.id} data-service-card>
              <ServiceCard service={service} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
