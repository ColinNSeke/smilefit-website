"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const PILLARS = [
  { n: "01", title: "Kraft", body: "Schweres Eisen, Hammer Strength und Free Weights für echte Progression." },
  { n: "02", title: "Conditioning", body: "Sled-Tracks, Functional- und Hardcore-Area für Leistung unter Last." },
  { n: "03", title: "Coaching", body: "Persönliche Trainerbetreuung, die deinen Plan zur Disziplin macht." },
  { n: "04", title: "Atmosphäre", body: "Licht, Sound und Raum, die mittrainieren — Fokus by design." },
];

export default function ManifestoSection() {
  const root = useRef<HTMLElement | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      if (reduce) {
        gsap.set("[data-line], [data-pillar], [data-mfimg]", { opacity: 1, clipPath: "inset(0% 0%)", y: 0 });
        return;
      }

      gsap.set("[data-line]", { clipPath: "inset(0% 0% 100% 0%)" });
      gsap.to("[data-line]", {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.14,
        scrollTrigger: { trigger: "[data-statement]", start: "top 76%" },
      });
      gsap.from("[data-line]", {
        yPercent: 110,
        filter: "blur(10px)",
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.14,
        scrollTrigger: { trigger: "[data-statement]", start: "top 76%" },
        onComplete: () => gsap.set("[data-line]", { clearProps: "filter" }),
      });

      gsap.from("[data-pillar]", {
        y: 32,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: { trigger: "[data-pillars]", start: "top 82%" },
      });

      // Image: clip reveal + parallax
      gsap.fromTo(
        "[data-mfimg]",
        { clipPath: "inset(0% 0% 100% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1.3,
          ease: "expo.out",
          scrollTrigger: { trigger: "[data-mfimgwrap]", start: "top 84%" },
        }
      );
      gsap.to("[data-mfimg] > div", {
        yPercent: 14,
        ease: "none",
        scrollTrigger: { trigger: "[data-mfimgwrap]", start: "top bottom", end: "bottom top", scrub: true },
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      id="system"
      className="relative w-full overflow-hidden bg-[#050308] py-24 text-[#f4f1f7] md:py-40"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{ background: "radial-gradient(50% 50% at 80% 10%, rgba(95,48,195,0.10) 0%, transparent 60%)" }}
      />

      <div className="relative mx-auto max-w-[1320px] px-6 md:px-12">
        {/* Eyebrow */}
        <p
          className="mb-8 flex items-center gap-3"
          style={{
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            fontSize: "11px",
            letterSpacing: "0.32em",
            fontWeight: 600,
            color: "rgba(244,241,247,0.55)",
          }}
        >
          <span className="inline-block h-px w-8" style={{ background: "rgba(122,76,255,0.6)" }} />
          DAS SYSTEM · BUILT DIFFERENT
        </p>

        {/* Major editorial statement */}
        <h2 data-statement className="max-w-[1100px]">
          <span
            className="font-serif-editorial block"
            style={{ fontSize: "clamp(34px, 5.4vw, 92px)", lineHeight: 1.02, fontWeight: 300, color: "#efeaf6" }}
          >
            <span className="block overflow-hidden">
              <span data-line className="block" style={{ willChange: "transform, filter" }}>
                Training ohne Zufall.
              </span>
            </span>
            <span className="block overflow-hidden">
              <span data-line className="block italic" style={{ willChange: "transform, filter", color: "#c9b8ff" }}>
                Gebaut für deine Prime.
              </span>
            </span>
          </span>
        </h2>

        {/* Image + pillars */}
        <div className="mt-16 grid grid-cols-1 gap-12 md:mt-24 md:grid-cols-2 md:gap-16">
          {/* Image */}
          <div data-mfimgwrap className="order-2 md:order-1">
            <div data-mfimg className="relative aspect-[4/5] w-full overflow-hidden bg-[#0d0b12]" style={{ willChange: "clip-path" }}>
              <div
                className="absolute inset-[-7%] bg-cover bg-center"
                style={{ backgroundImage: "url('/media/gym-01.jpg')", willChange: "transform" }}
              />
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: "linear-gradient(180deg, transparent 50%, rgba(5,3,8,0.78) 100%)" }}
              />
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                <p
                  className="font-display"
                  style={{ fontSize: "clamp(20px, 2vw, 30px)", color: "#f7f4fb", letterSpacing: "-0.01em" }}
                >
                  Discipline
                </p>
                <p
                  style={{
                    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                    fontSize: "12px",
                    letterSpacing: "0.22em",
                    fontWeight: 600,
                    color: "rgba(244,241,247,0.55)",
                    marginTop: "6px",
                  }}
                >
                  ONE MORE TIME.
                </p>
              </div>
            </div>
          </div>

          {/* Pillars */}
          <div data-pillars className="order-1 flex flex-col justify-center md:order-2">
            {PILLARS.map((p, i) => (
              <div
                key={p.title}
                data-pillar
                className="group flex gap-6 border-t py-7 transition-colors md:py-8"
                style={{ borderColor: i === 0 ? "rgba(244,241,247,0.14)" : "rgba(244,241,247,0.10)" }}
              >
                <span
                  style={{
                    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                    fontSize: "12px",
                    letterSpacing: "0.2em",
                    fontWeight: 600,
                    color: "rgba(122,76,255,0.85)",
                    paddingTop: "8px",
                  }}
                >
                  {p.n}
                </span>
                <div>
                  <h3
                    className="font-display mb-2"
                    style={{ fontSize: "clamp(24px, 2.6vw, 40px)", letterSpacing: "-0.01em", color: "#f4f1f7" }}
                  >
                    {p.title}
                  </h3>
                  <p
                    className="max-w-[420px]"
                    style={{
                      fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                      fontSize: "14px",
                      lineHeight: 1.65,
                      color: "rgba(244,241,247,0.58)",
                    }}
                  >
                    {p.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
