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
        gsap.set("[data-line], [data-pillar], [data-mfimg], [data-stat], [data-statval]", {
          opacity: 1,
          clipPath: "inset(0% 0%)",
          y: 0,
        });
        gsap.utils.toArray<HTMLElement>("[data-statval]").forEach((el) => {
          el.textContent = (el.dataset.target ?? "") + (el.dataset.suffix ?? "");
        });
        return;
      }

      // Section gradient reveal — dark-to-purple sweep
      gsap.fromTo(
        "[data-grad-reveal]",
        { opacity: 0 },
        {
          opacity: 1,
          duration: 1.4,
          ease: "power2.out",
          scrollTrigger: { trigger: root.current, start: "top 70%" },
        }
      );

      gsap.set("[data-line]", { clipPath: "inset(0% 0% 100% 0%)" });
      gsap.to("[data-line]", {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 1.3,
        ease: "expo.out",
        stagger: 0.16,
        scrollTrigger: { trigger: "[data-statement]", start: "top 78%" },
      });
      gsap.from("[data-line]", {
        yPercent: 120,
        scale: 1.12,
        filter: "blur(16px)",
        duration: 1.3,
        ease: "expo.out",
        stagger: 0.16,
        scrollTrigger: { trigger: "[data-statement]", start: "top 78%" },
        onComplete: () => gsap.set("[data-line]", { clearProps: "filter" }),
      });

      // Stats count-up
      gsap.utils.toArray<HTMLElement>("[data-statval]").forEach((el) => {
        const target = parseFloat(el.dataset.target ?? "0");
        const suffix = el.dataset.suffix ?? "";
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 1.8,
          ease: "power2.out",
          scrollTrigger: { trigger: "[data-stats]", start: "top 82%" },
          onUpdate: () => {
            const val = target % 1 === 0 ? Math.round(obj.v) : obj.v.toFixed(1);
            el.textContent = `${val}${suffix}`;
          },
        });
      });
      gsap.from("[data-stat]", {
        y: 40,
        opacity: 0,
        duration: 1.0,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: { trigger: "[data-stats]", start: "top 82%" },
      });

      gsap.from("[data-pillar]", {
        y: 32,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: { trigger: "[data-pillars]", start: "top 82%" },
        onComplete() {
          gsap.utils.toArray<HTMLElement>("[data-pillar-title]").forEach((el, i) => {
            gsap.fromTo(
              el,
              { textShadow: "0 0 0px rgba(122,76,255,0)" },
              {
                textShadow: "0 0 28px rgba(122,76,255,0.60)",
                duration: 0.6,
                delay: i * 0.1,
                ease: "power2.out",
                yoyo: true,
                repeat: 1,
                repeatDelay: 0.3,
                onComplete: () => gsap.set(el, { clearProps: "textShadow" }),
              }
            );
          });
        },
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

    const refreshT = window.setTimeout(() => ScrollTrigger.refresh(), 600);
    if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    return () => {
      window.clearTimeout(refreshT);
      ctx.revert();
    };
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
      {/* Dark-to-purple gradient reveal */}
      <div
        data-grad-reveal
        className="pointer-events-none absolute inset-0 opacity-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(95,48,195,0.14) 0%, transparent 30%, transparent 70%, rgba(95,48,195,0.10) 100%)",
          willChange: "opacity",
        }}
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
                    data-pillar-title
                    className="font-display mb-2"
                    style={{ fontSize: "clamp(24px, 2.6vw, 40px)", letterSpacing: "-0.01em", color: "#f4f1f7", willChange: "text-shadow" }}
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

        {/* ===== Results / stats band (count-up) ===== */}
        <div
          data-stats
          className="mt-20 grid grid-cols-2 gap-px overflow-hidden border md:mt-28 md:grid-cols-4"
          style={{ borderColor: "rgba(244,241,247,0.10)", background: "rgba(244,241,247,0.06)" }}
        >
          {[
            { target: "2200", suffix: "m²", label: "Trainingsfläche" },
            { target: "24", suffix: "/7", label: "Premium Zugang" },
            { target: "40", suffix: "+", label: "Geräte & Stationen" },
            { target: "100", suffix: "%", label: "Trainerbetreuung" },
          ].map((s) => (
            <div
              key={s.label}
              data-stat
              className="flex flex-col items-start justify-center bg-[#07060b] p-7 md:p-9"
            >
              <span
                data-statval
                data-target={s.target}
                data-suffix={s.suffix}
                className="font-display"
                style={{
                  fontSize: "clamp(34px, 4.4vw, 62px)",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  color: "#f7f4fb",
                  textShadow: "0 0 30px rgba(122,76,255,0.25)",
                }}
              >
                0{s.suffix}
              </span>
              <span
                className="mt-3"
                style={{
                  fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                  fontSize: "11px",
                  letterSpacing: "0.22em",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  color: "rgba(244,241,247,0.52)",
                }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
