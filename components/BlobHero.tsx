"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Media } from "./Media";

export default function BlobHero() {
  const root = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
      });

      tl.from("[data-hero-nav]", {
        y: -20,
        opacity: 0,
        duration: 0.9,
        stagger: 0.05,
      })
        .from(
          "[data-hero-blob]",
          {
            scale: 0.7,
            opacity: 0,
            duration: 1.4,
            ease: "expo.out",
          },
          "-=0.5"
        )
        .from(
          "[data-hero-line]",
          {
            yPercent: 110,
            duration: 1.1,
            stagger: 0.08,
            ease: "expo.out",
          },
          "-=0.9"
        )
        .from(
          "[data-hero-meta]",
          { opacity: 0, y: 12, duration: 0.7, stagger: 0.08 },
          "-=0.5"
        );

      // Gentle continuous float on blob
      gsap.to("[data-hero-blob]", {
        y: "+=18",
        duration: 4.5,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
      gsap.to("[data-hero-blob]", {
        rotate: 4,
        duration: 9,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      className="relative min-h-screen w-full overflow-hidden bg-[#f2efe6] text-[#050505]"
    >
      {/* NAV */}
      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-6 md:px-10 md:py-8">
        <a
          href="#"
          data-hero-nav
          className="font-display text-[18px] tracking-[-0.02em] md:text-[20px]"
        >
          SMILEFIT
        </a>
        <nav
          data-hero-nav
          className="hidden items-center gap-8 font-mono-label md:flex"
        >
          <a href="#training" className="hover:opacity-60">
            TRAINING
          </a>
          <a href="#raume" className="hover:opacity-60">
            RÄUME
          </a>
          <a href="#mitgliedschaft" className="hover:opacity-60">
            MITGLIEDSCHAFT
          </a>
          <a href="#kontakt" className="hover:opacity-60">
            KONTAKT
          </a>
        </nav>
        <a
          href="#kontakt"
          data-hero-nav
          className="font-mono-label md:hidden"
        >
          MENU
        </a>
      </header>

      {/* BLOB CENTER */}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <div
          data-hero-blob
          className="blob-morph relative h-[68vmin] w-[68vmin] max-h-[720px] max-w-[720px] overflow-hidden md:h-[58vmin] md:w-[58vmin]"
          style={{ borderRadius: "56% 44% 62% 38% / 48% 52% 48% 52%" }}
        >
          <Media
            src="/media/hero-a.mp4"
            video
            className="h-full w-full object-cover"
          />
          {/* purple lighting wash from gym lights */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 30% 20%, rgba(122,76,255,0.18), transparent 55%)",
            }}
          />
        </div>
      </div>

      {/* BOTTOM-LEFT HEADLINE */}
      <div className="absolute inset-x-0 bottom-0 z-20 px-6 pb-10 md:px-10 md:pb-14">
        <div className="flex items-end justify-between gap-8">
          <div className="max-w-[640px]">
            <h1 className="font-display text-[14vw] leading-[0.86] tracking-[-0.045em] md:text-[clamp(64px,7.5vw,140px)]">
              <span className="block overflow-hidden">
                <span data-hero-line className="block">
                  KEIN STANDARD.
                </span>
              </span>
              <span className="block overflow-hidden">
                <span data-hero-line className="block">
                  KEIN ZUFALL.
                </span>
              </span>
            </h1>

            <div className="mt-6 grid max-w-[520px] gap-5 md:mt-8 md:grid-cols-[1fr_auto] md:items-end">
              <p
                data-hero-meta
                className="text-[13px] leading-[1.45] text-[#1a1a1a]/80 md:text-[14px]"
                style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontWeight: 400 }}
              >
                Premium Training. Maschinen, Atmosphäre
                <br className="hidden md:block" /> und Fokus auf einem anderen Level.
              </p>
              <a
                data-hero-meta
                href="#kontakt"
                className="group inline-flex items-center gap-3 self-start border-b border-[#050505] pb-1 font-mono-label md:self-end"
              >
                <span>Probetraining sichern</span>
                <span aria-hidden className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </a>
            </div>
          </div>

          {/* SCROLL INDICATOR */}
          <div
            data-hero-meta
            className="hidden flex-col items-end gap-3 md:flex"
          >
            <span className="font-mono-label">SCROLL DOWN</span>
            <span className="block h-12 w-px bg-[#050505]/40" />
          </div>
        </div>
      </div>

      {/* tiny hex accent — barely visible */}
      <svg
        aria-hidden
        className="absolute right-8 top-24 z-20 hidden h-6 w-6 opacity-30 md:block"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        <polygon points="12,2 22,7 22,17 12,22 2,17 2,7" />
      </svg>
    </section>
  );
}
