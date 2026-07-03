"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, SplitText } from "@/lib/gsap";

type AllowedTag = "div" | "p" | "h1" | "h2" | "span";

type RevealTextProps = {
  as?: AllowedTag;
  className?: string;
  children: string;
  trigger?: "load" | "scroll";
  delay?: number;
  stagger?: number;
};

export default function RevealText({
  as: Tag = "div",
  className,
  children,
  trigger = "scroll",
  delay = 0,
  stagger = 0.09,
}: RevealTextProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduced) {
      gsap.set(el, { opacity: 1 });
      return;
    }

    const split = new SplitText(el, { type: "lines", linesClass: "reveal-line" });

    gsap.set(split.lines, { overflow: "hidden" });
    const inner = split.lines.map((line) => {
      const wrapper = document.createElement("span");
      wrapper.style.display = "block";
      wrapper.style.willChange = "transform";
      while (line.firstChild) wrapper.appendChild(line.firstChild);
      line.appendChild(wrapper);
      return wrapper;
    });

    const anim = gsap.from(inner, {
      yPercent: 110,
      opacity: 0,
      duration: 1.1,
      ease: "expo.out",
      stagger,
      delay,
      paused: trigger === "scroll",
    });

    let st: ScrollTrigger | undefined;
    if (trigger === "scroll") {
      st = ScrollTrigger.create({
        trigger: el,
        start: "top 85%",
        onEnter: () => anim.play(),
      });
    }

    return () => {
      st?.kill();
      anim.kill();
      split.revert();
    };
  }, [children, trigger, delay, stagger]);

  return (
    <Tag ref={ref as React.Ref<never>} className={className}>
      {children}
    </Tag>
  );
}
