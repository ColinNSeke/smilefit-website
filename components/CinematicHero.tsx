"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { prefersReducedMotion } from "@/lib/lenis";

const NAV = ["TRAINING", "RÄUME", "MITGLIEDSCHAFT", "KONTAKT"] as const;

export default function CinematicHero() {
  const root = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    if (reduced) {
      gsap.set("[data-hero-block],[data-brandmark],[data-navitem]", { opacity: 1 });
      return;
    }

    gsap.set("[data-hero-bg]", { opacity: 0 });
    gsap.set("[data-hero-block]", { opacity: 0 });
    gsap.set("[data-brandmark]", { opacity: 0 });
    gsap.set("[data-navitem]", { opacity: 0 });

    const tl = gsap.timeline({ delay: 0.1 });
    tl
      .to("[data-hero-bg]", { opacity: 1, duration: 0.8, ease: "power2.out" }, 0)
      .to("[data-brandmark]", { opacity: 1, duration: 0.7, ease: "power3.out" }, 0.15)
      .to("[data-navitem]", { opacity: 1, duration: 0.6, ease: "power3.out", stagger: 0.05 }, 0.2)
      .to("[data-hero-block]", { opacity: 1, duration: 0.6, ease: "power2.out" }, 0.2);

    return () => { tl.kill(); };
  }, []);

  return (
    <section
      ref={root}
      className="relative h-screen min-h-[640px] w-full overflow-hidden bg-[#050308] text-[#f4f1f7]"
    >
      {/* Background image — right-aligned */}
      <div
        data-hero-bg
        className="absolute inset-0 z-[1]"
        style={{
          backgroundImage: "url('/NEW HERO PAGE')",
          backgroundSize: "cover",
          backgroundPosition: "center right",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Dark overlay */}
      <div className="pointer-events-none absolute inset-0 z-[2]"
        style={{ background: "linear-gradient(90deg, #050308 0%, rgba(5,3,8,0.85) 32%, rgba(5,3,8,0.45) 54%, rgba(5,3,8,0.12) 72%, transparent 90%)" }} />
      <div className="pointer-events-none absolute inset-0 z-[2]"
        style={{ background: "linear-gradient(180deg, rgba(5,3,8,0.45) 0%, transparent 20%, transparent 70%, rgba(5,3,8,0.80) 100%)" }} />

      {/* Vignette */}
      <div className="pointer-events-none absolute inset-0 z-[3] opacity-40"
        style={{ background: "radial-gradient(130% 100% at 62% 44%, transparent 38%, rgba(0,0,0,0.50) 72%, rgba(0,0,0,0.88) 100%)" }} />

      {/* Grain */}
      <div className="pointer-events-none absolute inset-0 z-[4] opacity-[0.045] mix-blend-overlay"
        style={{
          backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>\")",
          backgroundSize: "180px 180px",
        }} />

      {/* NAV */}
      <header className="absolute inset-x-0 top-0 z-[20] flex items-center justify-between px-6 py-7 md:px-12 md:py-8">
        <a data-brandmark href="#"
          className="font-display text-[#f4f1f7]"
          style={{ fontSize: "clamp(18px,1.8vw,24px)", letterSpacing: "0.02em", lineHeight: 1 }}>
          SMILEFIT
        </a>
        <nav className="hidden items-center gap-9 md:flex" style={{ fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif" }}>
          {NAV.map((item) => (
            <a key={item} data-navitem href="#"
              className="text-[11px] font-[600] uppercase tracking-[0.20em] text-[#f4f1f7]/70 transition-colors hover:text-[#f4f1f7]">
              {item}
            </a>
          ))}
          <span data-navitem className="ml-1 flex flex-col gap-[5px]">
            <span className="block h-[1.5px] w-6 bg-[#f4f1f7]/80" />
            <span className="block h-[1.5px] w-6 bg-[#f4f1f7]/80" />
          </span>
        </nav>
        <button data-navitem aria-label="Menu" className="flex flex-col gap-[5px] md:hidden">
          <span className="block h-[1.5px] w-6 bg-[#f4f1f7]/80" />
          <span className="block h-[1.5px] w-6 bg-[#f4f1f7]/80" />
        </button>
      </header>

      {/* COPY — fades in as one block */}
      <div
        data-hero-block
        className="absolute inset-y-0 left-0 z-[10] flex max-w-[680px] flex-col justify-center px-6 md:px-12 lg:px-20"
      >
        {/* Eyebrow rule */}
        <div className="mb-5 h-px w-10" style={{ background: "#EDEAE3" }} />

        {/* Eyebrow label */}
        <p className="mb-8"
          style={{
            fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
            fontSize: "11px", letterSpacing: "0.30em", fontWeight: 600,
            textTransform: "uppercase", color: "rgba(237,234,227,0.5)",
          }}>
          PREMIUM FITNESS · STUTTGART
        </p>

        {/* Headline */}
        <h1
          className="font-serif-editorial"
          style={{
            fontWeight: 400,
            fontSize: "clamp(44px,5vw,90px)",
            lineHeight: 1.05,
            letterSpacing: "-0.01em",
            color: "#EDEAE3",
            maxWidth: "600px",
          }}
        >
          <span style={{ display: "block" }}>Bring back your prime.</span>
          <span
            style={{
              display: "block",
              background: "linear-gradient(90deg, #EDEAE3 0%, #7a4cff 60%, #b490ff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            One more time.
          </span>
        </h1>

        {/* CTA */}
        <a
          href="#mitgliedschaft"
          className="group mt-10 inline-flex w-fit items-center gap-3"
          style={{
            fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
            fontSize: "11px", fontWeight: 700, letterSpacing: "0.24em",
            textTransform: "uppercase", color: "#f4f1f7",
            borderBottom: "1px solid rgba(244,241,247,0.45)",
            paddingBottom: "4px",
          }}
        >
          <span>PROBETRAINING RESERVIEREN</span>
          <span aria-hidden className="transition-transform duration-400 group-hover:translate-x-1">→</span>
        </a>

        {/* Footnote */}
        <p
          className="font-display mt-auto pb-10"
          style={{
            fontSize: "clamp(11px,0.9vw,13px)",
            letterSpacing: "0.22em",
            color: "rgba(237,234,227,0.35)",
            textTransform: "uppercase",
          }}
        >
          YOU&rsquo;RE NOT DONE YET.
        </p>
      </div>
    </section>
  );
}
