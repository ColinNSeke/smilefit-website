"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function ScrollProgressRail() {
  const fill = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !fill.current) return;

    const tween = gsap.fromTo(
      fill.current,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: "none",
        scrollTrigger: {
          trigger: document.body,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      }
    );

    return () => tween.scrollTrigger?.kill();
  }, []);

  return (
    <div
      className="pointer-events-none fixed right-0 top-0 z-[9998] hidden h-full w-px md:block"
      style={{ background: "rgba(122,76,255,0.18)" }}
      aria-hidden
    >
      <div
        ref={fill}
        className="absolute inset-x-0 top-0 origin-top"
        style={{ height: "100%", background: "#7a4cff" }}
      />
    </div>
  );
}
