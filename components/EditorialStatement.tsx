"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const LINES = ["KEIN STANDARD-GYM.", "EIN RAUM FÜR DISZIPLIN,", "KRAFT UND FORTSCHRITT."];

export default function EditorialStatement() {
  const root = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const lines = gsap.utils.toArray<HTMLElement>("[data-line]");

      gsap.from(lines, {
        yPercent: 110,
        duration: 1.1,
        stagger: 0.12,
        ease: "expo.out",
        scrollTrigger: {
          trigger: root.current,
          start: "top 70%",
        },
      });

      gsap.from("[data-blueprint]", {
        scaleX: 0,
        transformOrigin: "left center",
        duration: 1.4,
        ease: "power3.out",
        scrollTrigger: {
          trigger: root.current,
          start: "top 60%",
        },
      });

      gsap.from("[data-statement-meta]", {
        opacity: 0,
        y: 16,
        duration: 0.9,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: root.current,
          start: "top 60%",
        },
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      className="relative w-full overflow-hidden bg-[#08080a] px-6 py-32 text-[#f2efe6] md:px-10 md:py-48"
    >
      {/* blueprint thin lines */}
      <div className="pointer-events-none absolute inset-0">
        <div
          data-blueprint
          className="absolute left-0 right-0 top-[18%] h-px bg-[#f2efe6]/15"
        />
        <div
          data-blueprint
          className="absolute left-0 right-0 top-[82%] h-px bg-[#f2efe6]/15"
        />
        <div className="absolute right-10 top-[18%] hidden font-mono-label text-[#f2efe6]/40 md:block">
          ⟶ SYSTEM / 2026
        </div>
        <div className="absolute left-10 top-[82%] hidden font-mono-label text-[#f2efe6]/40 md:block">
          MANIFEST / SMILEFIT
        </div>
      </div>

      <div className="relative">
        <span
          data-statement-meta
          className="font-mono-label text-[#f2efe6]/60"
        >
          MANIFEST — 02
        </span>

        <h2 className="mt-10 font-display text-[12vw] leading-[0.86] tracking-[-0.045em] md:mt-16 md:text-[clamp(80px,10vw,200px)]">
          {LINES.map((line, i) => (
            <span key={i} className="block overflow-hidden">
              <span data-line className="block">
                {line}
              </span>
            </span>
          ))}
        </h2>

        <div className="mt-16 flex flex-col items-start justify-between gap-6 md:mt-24 md:flex-row md:items-end">
          <div data-statement-meta className="font-mono-label text-[#f2efe6]/70">
            BUILT DIFFERENT.
            <br />
            NO SOFT REPS.
          </div>
          <a
            data-statement-meta
            href="#kontakt"
            className="group inline-flex items-center gap-3 border-b border-[#f2efe6] pb-1 font-mono-label"
          >
            <span>Enter Different. Leave Stronger.</span>
            <span aria-hidden className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
