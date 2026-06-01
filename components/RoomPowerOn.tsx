"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * SmileFit — "Der Raum trainiert mit." Room power-on section.
 *
 * The gym room starts near-black, then powers on as the user scrolls: the
 * base photo's brightness and saturation animate from dim to neutral so the
 * full room reads alive. A black overlay lifts in sync.
 *
 * Drop the new photo at /public/raume/02.jpg — the section references that
 * path and will begin rendering as soon as the file exists.
 *
 * Mobile / reduced-motion: the fully-lit room, no pin / scrub.
 */

const DIM_FILTER = "brightness(0.18) saturate(0.35) contrast(1.05)";
const LIT_FILTER  = "brightness(1) saturate(1) contrast(1)";

function RoomPlate({ lit }: { lit: boolean }) {
  return (
    <div className="absolute inset-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        data-base
        src="/raume/02.jpg"
        alt="SmileFit Trainingsraum — Maschinen, Neon und Hammer-Strength-Rack."
        className="absolute inset-0 h-full w-full object-cover"
        style={{ filter: lit ? LIT_FILTER : DIM_FILTER, willChange: "filter" }}
      />
      {/* Global dim overlay lifts as the room powers on. */}
      <div
        data-dim
        className="pointer-events-none absolute inset-0 bg-black"
        style={{ opacity: lit ? 0 : 0.55 }}
      />
    </div>
  );
}

export default function RoomPowerOn() {
  const root  = useRef<HTMLElement | null>(null);
  const stage = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Preload base before wiring the pinned timeline.
    let cancelled = false;
    const preload = new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = "/raume/02.jpg";
    });

    const ctx = gsap.context(() => {}, root);

    preload.then(() => {
      if (cancelled) return;

      ctx.add(() => {
        const mm = gsap.matchMedia();

        // ===================== DESKTOP =====================
        mm.add("(min-width: 768px)", () => {
          if (reduce) {
            gsap.set("[data-base]", { filter: LIT_FILTER });
            gsap.set("[data-dim]",  { opacity: 0 });
            gsap.set("[data-title-line]", { yPercent: 0 });
            gsap.set("[data-mono]", { opacity: 1, y: 0 });
            return;
          }

          // Initial near-dark state.
          gsap.set("[data-base]", { filter: DIM_FILTER });
          gsap.set("[data-dim]",  { opacity: 0.55 });
          gsap.set("[data-title-line]", { yPercent: 110 });
          gsap.set("[data-mono]", { opacity: 0, y: 12 });

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: stage.current,
              start: "top top",
              end: "+=140%",
              pin: true,
              scrub: 0.8,
              anticipatePin: 1,
            },
          });

          // Dim overlay lifts, base filter returns to neutral.
          tl.to("[data-dim]",  { opacity: 0, duration: 0.5 }, 0.1)
            .to("[data-base]", { filter: LIT_FILTER, duration: 0.55 }, 0.1)
            // Headline + mono label resolve as the room comes alive.
            .to("[data-title-line]", { yPercent: 0, duration: 0.22, stagger: 0.08 }, 0.55)
            .to("[data-mono]", { opacity: 1, y: 0, duration: 0.18 }, 0.85);
        });

        // ===================== MOBILE =====================
        mm.add("(max-width: 767px)", () => {
          gsap.set("[data-base]", { filter: LIT_FILTER });
          gsap.set("[data-dim]",  { opacity: 0 });
          if (reduce) {
            gsap.set("[data-title-line]", { yPercent: 0 });
            gsap.set("[data-mono]", { opacity: 1, y: 0 });
            return;
          }
          gsap.from("[data-title-line]", {
            yPercent: 110,
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.08,
            scrollTrigger: { trigger: root.current, start: "top 75%" },
          });
          gsap.from("[data-mono]", {
            opacity: 0,
            y: 12,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: { trigger: root.current, start: "top 70%" },
          });
        });
      });

      ScrollTrigger.refresh();
    });

    return () => {
      cancelled = true;
      ctx.revert();
    };
  }, []);

  return (
    <section
      id="raume"
      ref={root}
      className="relative w-full bg-[#050505] text-[#f2efe6]"
    >
      {/* ===== MOBILE — fully-lit room ===== */}
      <div className="relative overflow-hidden px-6 py-20 md:hidden">
        <div className="relative aspect-video w-full overflow-hidden">
          <RoomPlate lit />
        </div>
        <div className="mt-8 flex items-start justify-between">
          <span
            className="text-[10px] uppercase tracking-[0.22em] text-[#f2efe6]/55"
            style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontWeight: 500 }}
          >
            Räume / 02
          </span>
          <span
            data-mono
            className="text-[10px] uppercase tracking-[0.22em] text-[#f2efe6]/55"
            style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontWeight: 500 }}
          >
            Neon / Chrome / Fokus
          </span>
        </div>
        <h2
          className="font-display mt-4 leading-[0.9] tracking-[-0.04em]"
          style={{ fontSize: "clamp(40px, 12vw, 80px)", textTransform: "uppercase" }}
        >
          <span className="block overflow-hidden">
            <span data-title-line className="block">Der Raum</span>
          </span>
          <span className="block overflow-hidden">
            <span data-title-line className="block">trainiert mit.</span>
          </span>
        </h2>
      </div>

      {/* ===== DESKTOP — pinned power-on stage ===== */}
      <div
        ref={stage}
        className="relative hidden h-screen w-full overflow-hidden md:block"
      >
        <RoomPlate lit={false} />

        {/* Grain */}
        <div
          className="pointer-events-none absolute inset-0 z-[2] opacity-[0.08] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>\")",
            backgroundSize: "180px 180px",
          }}
        />

        {/* Vignette */}
        <div
          className="pointer-events-none absolute inset-0 z-[2] opacity-60"
          style={{
            background:
              "radial-gradient(130% 90% at 50% 50%, transparent 35%, rgba(0,0,0,0.55) 78%, rgba(0,0,0,0.92) 100%)",
          }}
        />

        {/* Top-left section label */}
        <div
          className="absolute left-6 top-8 z-[40] text-[11px] uppercase tracking-[0.28em] text-[#f2efe6]/55 md:left-10 md:top-10"
          style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontWeight: 600 }}
        >
          Räume / 02
        </div>

        {/* Bottom-left headline */}
        <div className="absolute bottom-10 left-6 z-[40] max-w-[60vw] md:bottom-12 md:left-10">
          <h2
            className="font-display leading-[0.9] tracking-[-0.035em]"
            style={{ fontSize: "clamp(40px, 6vw, 104px)", textTransform: "uppercase" }}
          >
            <span className="block overflow-hidden">
              <span data-title-line className="block">Der Raum</span>
            </span>
            <span className="block overflow-hidden">
              <span data-title-line className="block">trainiert mit.</span>
            </span>
          </h2>
        </div>

        {/* Bottom-right mono label */}
        <div
          data-mono
          className="absolute bottom-10 right-6 z-[40] text-right text-[11px] uppercase tracking-[0.28em] text-[#f2efe6]/55 md:right-10 md:bottom-12"
          style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontWeight: 600 }}
        >
          Neon / Chrome / Fokus
        </div>
      </div>
    </section>
  );
}
