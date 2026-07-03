"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import RevealText from "@/components/ui/RevealText";
import ServiceCard from "./ServiceCard";
import { services as staticServices, type Service } from "@/content/services";

export default function Services({ services }: { services?: Service[] }) {
  const items = services ?? staticServices;
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const cards = grid.querySelectorAll(":scope > div");
    const ctx = gsap.context(() => {
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

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((st) => st.refresh());
    };
  }, []);

  return (
    <section id="servicios" className="bg-white px-6 py-28 sm:px-10 lg:py-36">
      <div className="mx-auto max-w-6xl">
        <RevealText
          as="p"
          className="max-w-2xl font-serif text-2xl text-ink sm:text-3xl"
        >
          Cada proceso es único. Aquí algunas formas en que podemos caminar juntos:
        </RevealText>

        <div
          ref={gridRef}
          className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((service) => (
            <div key={service.id}>
              <ServiceCard service={service} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
