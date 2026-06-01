"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function FooterCTA() {
  const root = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-cta]", {
        opacity: 0,
        y: 24,
        duration: 0.9,
        stagger: 0.08,
        ease: "power3.out",
        scrollTrigger: {
          trigger: root.current,
          start: "top 70%",
        },
      });

      gsap.to("[data-wordmark]", {
        yPercent: -8,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.from("[data-wordmark]", {
        opacity: 0,
        y: 80,
        duration: 1.4,
        ease: "expo.out",
        scrollTrigger: {
          trigger: root.current,
          start: "top 60%",
        },
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <footer
      ref={root}
      id="kontakt"
      className="relative w-full overflow-hidden bg-[#050505] text-[#f2efe6]"
    >
      {/* Top CTA */}
      <div className="px-6 pb-24 pt-32 md:px-10 md:pb-40 md:pt-48">
        <div className="flex flex-col items-start justify-between gap-12 md:flex-row md:items-end">
          <div>
            <span data-cta className="font-mono-label text-[#f2efe6]/60">
              CTA — 04
            </span>
            <h2
              data-cta
              className="mt-6 font-display text-[12vw] leading-[0.86] md:text-[clamp(64px,7vw,140px)]"
            >
              BEREIT FÜR EIN
              <br />
              ANDERES LEVEL?
            </h2>
          </div>
          <a
            data-cta
            href="#"
            className="group inline-flex items-center gap-3 border border-[#f2efe6] px-6 py-4 font-mono-label"
          >
            <span>Probetraining sichern</span>
            <span aria-hidden className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </a>
        </div>
      </div>

      {/* Footer nav */}
      <div className="grid grid-cols-2 gap-8 border-t border-[#f2efe6]/15 px-6 py-12 md:grid-cols-4 md:px-10">
        {[
          { label: "TRAINING", href: "#training" },
          { label: "RÄUME", href: "#raume" },
          { label: "MITGLIEDSCHAFT", href: "#mitgliedschaft" },
          { label: "KONTAKT", href: "#kontakt" },
        ].map((l) => (
          <a
            key={l.label}
            href={l.href}
            data-cta
            className="font-mono-label text-[#f2efe6]/80 hover:text-[#f2efe6]"
          >
            {l.label}
          </a>
        ))}
      </div>

      {/* Giant outlined wordmark */}
      <div className="relative -mb-[4vw] flex w-full items-end justify-center overflow-hidden">
        <h3
          data-wordmark
          className="font-display text-stroke whitespace-nowrap text-[28vw] leading-[0.8] tracking-[-0.06em]"
        >
          SMILEFIT
        </h3>
      </div>

      {/* Bottom microcopy */}
      <div className="flex items-center justify-between border-t border-[#f2efe6]/15 px-6 py-6 md:px-10">
        <span data-cta className="font-mono-label text-[#f2efe6]/60">
          Built Different. Since 2026.
        </span>
        <span data-cta className="font-mono-label text-[#f2efe6]/60">
          © SMILEFIT
        </span>
      </div>
    </footer>
  );
}
