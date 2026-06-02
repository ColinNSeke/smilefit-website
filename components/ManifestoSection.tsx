"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const PILLARS = [
  { n: "01", title: "Kraft",        body: "Schweres Eisen, Hammer Strength und Free Weights für echte Progression." },
  { n: "02", title: "Conditioning", body: "Sled-Tracks, Functional- und Hardcore-Area für Leistung unter Last." },
  { n: "03", title: "Coaching",     body: "Persönliche Trainerbetreuung, die deinen Plan zur Disziplin macht." },
  { n: "04", title: "Atmosphäre",   body: "Licht, Sound und Raum, die mittrainieren — Fokus by design." },
];

const STATS = [
  { target: 2200, suffix: "m²",   label: "Trainingsfläche" },
  { target: 24,   suffix: "/7",   label: "Premium Zugang" },
  { target: 40,   suffix: "+",    label: "Geräte & Stationen" },
  { target: 100,  suffix: "%",    label: "Trainerbetreuung" },
];

export default function ManifestoSection() {
  const root = useRef<HTMLElement | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 768;

    const ctx = gsap.context(() => {
      if (reduce) {
        gsap.set("[data-line],[data-pillar],[data-mfimg],[data-stat],[data-statval],[data-eyebrow-mf]",
          { clearProps: "all" });
        STATS.forEach((s, i) => {
          const el = document.querySelectorAll<HTMLElement>("[data-statval]")[i];
          if (el) el.textContent = `${s.target}${s.suffix}`;
        });
        return;
      }

      /* =============================================
         PINNED SCRUBBED SEQUENCE — the whole section
         stays in place for 200vh of scroll, content
         choreographed across that distance.
         (Skip pin on mobile for performance)
      ============================================= */
      const pinDuration = isMobile ? "0" : "+=200vh";

      // Eyebrow
      gsap.set("[data-eyebrow-mf]", { opacity: 0, y: 30, filter: "blur(8px)" });

      // Statement lines
      gsap.set("[data-line]", {
        clipPath: "inset(0% 0% 100% 0%)",
        yPercent: 140,
        scale: 1.22,
        filter: "blur(32px)",
      });

      // Pillars
      gsap.set("[data-pillar]", { opacity: 0, x: -80, filter: "blur(12px)" });

      // Image
      gsap.set("[data-mfimg]", { clipPath: "inset(0% 100% 0% 0%)", scale: 1.18 });

      if (!isMobile) {
        /* PINNED MASTER TIMELINE */
        const pin = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "+=210vh",
            pin: true,
            scrub: 0.9,
            anticipatePin: 1,
          },
        });

        pin
          // 0–15%: section background + eyebrow
          .to("[data-eyebrow-mf]", {
            opacity: 1, y: 0, filter: "blur(0px)", duration: 0.12,
          }, 0)

          // 10–45%: headline bursts in line by line
          .to("[data-line]", {
            clipPath: "inset(0% 0% 0% 0%)",
            yPercent: 0,
            scale: 1,
            filter: "blur(0px)",
            stagger: 0.1,
            duration: 0.25,
            onComplete: () => gsap.set("[data-line]", { clearProps: "filter" }),
          }, 0.08)

          // 40–65%: image wipes in from right
          .to("[data-mfimg]", {
            clipPath: "inset(0% 0% 0% 0%)",
            scale: 1.0,
            duration: 0.22,
          }, 0.38)

          // 55–80%: pillars sweep in from left
          .to("[data-pillar]", {
            opacity: 1, x: 0, filter: "blur(0px)",
            stagger: 0.06, duration: 0.18,
            onComplete: () => gsap.set("[data-pillar]", { clearProps: "filter" }),
          }, 0.52)

          // 78–100%: stats rise
          .from("[data-stat]", {
            opacity: 0, y: 50, stagger: 0.04, duration: 0.16,
          }, 0.76);

        // Count-up happens in sync with the stats entering
        STATS.forEach((s, i) => {
          const els = document.querySelectorAll<HTMLElement>("[data-statval]");
          const el  = els[i];
          if (!el) return;
          const obj = { v: 0 };
          pin.to(obj, {
            v: s.target,
            duration: 0.18,
            ease: "power1.out",
            onUpdate: () => { el.textContent = `${Math.round(obj.v)}${s.suffix}`; },
          }, 0.78);
        });

        // Image inner parallax during scroll-through
        gsap.to("[data-mfimg] > div", {
          yPercent: 14,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });

      } else {
        /* MOBILE — no pin, strong scroll-triggered animations */
        gsap.to("[data-eyebrow-mf]", {
          opacity: 1, y: 0, filter: "blur(0px)", duration: 1.0, ease: "power3.out",
          scrollTrigger: { trigger: root.current, start: "top 85%" },
        });

        gsap.to("[data-line]", {
          clipPath: "inset(0% 0% 0% 0%)",
          yPercent: 0,
          scale: 1,
          filter: "blur(0px)",
          stagger: 0.18,
          duration: 1.3,
          ease: "expo.out",
          scrollTrigger: { trigger: "[data-statement]", start: "top 88%" },
          onComplete: () => gsap.set("[data-line]", { clearProps: "filter" }),
        });

        gsap.to("[data-mfimg]", {
          clipPath: "inset(0% 0% 0% 0%)",
          scale: 1.0,
          duration: 1.3,
          ease: "expo.out",
          scrollTrigger: { trigger: "[data-mfimgwrap]", start: "top 88%" },
        });

        gsap.to("[data-pillar]", {
          opacity: 1, x: 0, filter: "blur(0px)", stagger: 0.12, duration: 1.0, ease: "power3.out",
          scrollTrigger: { trigger: "[data-pillars]", start: "top 85%" },
          onComplete: () => gsap.set("[data-pillar]", { clearProps: "filter" }),
        });

        STATS.forEach((s, i) => {
          const el = document.querySelectorAll<HTMLElement>("[data-statval]")[i];
          if (!el) return;
          const obj = { v: 0 };
          gsap.to(obj, {
            v: s.target, duration: 1.8, ease: "power2.out",
            scrollTrigger: { trigger: "[data-stats]", start: "top 85%" },
            onUpdate: () => { el.textContent = `${Math.round(obj.v)}${s.suffix}`; },
          });
        });
        gsap.from("[data-stat]", {
          opacity: 0, y: 50, stagger: 0.1, duration: 1.0, ease: "power3.out",
          scrollTrigger: { trigger: "[data-stats]", start: "top 85%" },
        });
      }
    }, root);

    const t = setTimeout(() => ScrollTrigger.refresh(), 700);
    if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    return () => { clearTimeout(t); ctx.revert(); };
  }, []);

  return (
    <section
      ref={root}
      id="system"
      className="relative w-full overflow-hidden bg-[#050308] py-24 text-[#f4f1f7] md:py-40"
    >
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(55% 55% at 80% 10%, rgba(122,76,255,0.16) 0%, transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-[1320px] px-6 md:px-12">
        {/* Eyebrow */}
        <p
          data-eyebrow-mf
          className="mb-10 flex items-center gap-3"
          style={{
            fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
            fontSize: "11px",
            letterSpacing: "0.32em",
            fontWeight: 600,
            color: "rgba(244,241,247,0.55)",
          }}
        >
          <span className="inline-block h-px w-8" style={{ background: "rgba(122,76,255,0.8)" }} />
          DAS SYSTEM · BUILT DIFFERENT
        </p>

        {/* STATEMENT — each line is a masked reveal */}
        <h2 data-statement className="max-w-[1100px]">
          <span
            className="font-serif-editorial block"
            style={{ fontSize: "clamp(38px,5.8vw,96px)", lineHeight: 1.0, fontWeight: 300, color: "#efeaf6" }}
          >
            <span className="block overflow-hidden">
              <span
                data-line
                className="block"
                style={{ willChange: "transform, filter", textShadow: "0 0 80px rgba(122,76,255,0.35)" }}
              >
                Training ohne Zufall.
              </span>
            </span>
            <span className="block overflow-hidden">
              <span
                data-line
                className="block italic"
                style={{ willChange: "transform, filter", color: "#c9b8ff", textShadow: "0 0 80px rgba(122,76,255,0.5)" }}
              >
                Gebaut für deine Prime.
              </span>
            </span>
          </span>
        </h2>

        {/* IMAGE + PILLARS */}
        <div className="mt-16 grid grid-cols-1 gap-12 md:mt-24 md:grid-cols-2 md:gap-16">
          {/* Image */}
          <div data-mfimgwrap className="order-2 md:order-1">
            <div
              data-mfimg
              className="relative aspect-[4/5] w-full overflow-hidden bg-[#0d0b12]"
              style={{ willChange: "clip-path, transform" }}
            >
              <div
                className="absolute inset-[-8%] bg-cover bg-center"
                style={{ backgroundImage: "url('/media/gym-01.jpg')", willChange: "transform" }}
              />
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: "linear-gradient(180deg, transparent 50%, rgba(5,3,8,0.82) 100%)" }}
              />
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                <p
                  className="font-display"
                  style={{ fontSize: "clamp(20px,2vw,30px)", color: "#f7f4fb", letterSpacing: "-0.01em" }}
                >
                  Discipline
                </p>
                <p
                  style={{
                    fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
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
                className="flex gap-6 border-t py-7 md:py-8"
                style={{
                  borderColor: i === 0 ? "rgba(244,241,247,0.16)" : "rgba(244,241,247,0.10)",
                  willChange: "transform, opacity, filter",
                }}
              >
                <span
                  style={{
                    fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
                    fontSize: "12px",
                    letterSpacing: "0.2em",
                    fontWeight: 600,
                    color: "rgba(122,76,255,0.90)",
                    paddingTop: "8px",
                  }}
                >
                  {p.n}
                </span>
                <div>
                  <h3
                    className="font-display mb-2"
                    style={{
                      fontSize: "clamp(24px,2.6vw,40px)",
                      letterSpacing: "-0.01em",
                      color: "#f4f1f7",
                    }}
                  >
                    {p.title}
                  </h3>
                  <p
                    className="max-w-[420px]"
                    style={{
                      fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
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

        {/* STATS BAND */}
        <div
          data-stats
          className="mt-20 grid grid-cols-2 gap-px overflow-hidden border md:mt-28 md:grid-cols-4"
          style={{ borderColor: "rgba(244,241,247,0.10)", background: "rgba(244,241,247,0.06)" }}
        >
          {STATS.map((s) => (
            <div
              key={s.label}
              data-stat
              className="flex flex-col items-start justify-center bg-[#07060b] p-7 md:p-9"
            >
              <span
                data-statval
                className="font-display"
                style={{
                  fontSize: "clamp(34px,4.4vw,62px)",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  color: "#f7f4fb",
                  textShadow: "0 0 40px rgba(122,76,255,0.40)",
                }}
              >
                0{s.suffix}
              </span>
              <span
                className="mt-3"
                style={{
                  fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
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
