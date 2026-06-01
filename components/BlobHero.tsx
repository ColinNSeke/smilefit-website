"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

/**
 * Organic clip path (objectBoundingBox 0..1) — irregular liquid silhouette.
 * Two variants with matched anchor count so GSAP can interpolate the d attr.
 */
const BLOB_A =
  "M0.22,0.08 C0.36,0.01 0.55,-0.02 0.71,0.05 C0.88,0.13 1.02,0.28 0.97,0.46 C0.93,0.62 1.01,0.74 0.90,0.86 C0.78,0.99 0.58,1.03 0.42,0.97 C0.24,0.91 0.06,0.84 0.04,0.66 C0.03,0.50 -0.03,0.34 0.05,0.22 C0.10,0.14 0.16,0.11 0.22,0.08 Z";
const BLOB_B =
  "M0.18,0.14 C0.32,0.04 0.52,0.02 0.68,0.06 C0.86,0.10 1.04,0.24 0.99,0.42 C0.95,0.58 0.96,0.78 0.84,0.90 C0.72,1.02 0.52,0.98 0.36,0.94 C0.20,0.90 0.02,0.80 0.02,0.62 C0.02,0.46 0.00,0.30 0.08,0.20 C0.12,0.16 0.14,0.16 0.18,0.14 Z";

export default function BlobHero() {
  const root = useRef<HTMLElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const [mediaFailed, setMediaFailed] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

      tl.from("[data-hero-nav]", {
        y: -16,
        opacity: 0,
        duration: 0.9,
        stagger: 0.05,
        ease: "power3.out",
      })
        .from(
          "[data-hero-blob-wrap]",
          {
            scale: 0.86,
            opacity: 0,
            duration: 1.6,
          },
          "-=0.4"
        )
        .from(
          "[data-hero-media]",
          {
            scale: 1.12,
            opacity: 0,
            duration: 1.6,
            ease: "expo.out",
          },
          "-=1.3"
        )
        .from(
          "[data-hero-line]",
          {
            yPercent: 110,
            duration: 1.0,
            stagger: 0.07,
          },
          "-=1.0"
        )
        .from(
          "[data-hero-meta]",
          {
            opacity: 0,
            y: 10,
            duration: 0.7,
            stagger: 0.06,
            ease: "power3.out",
          },
          "-=0.6"
        );

      // Gentle liquid path morph
      if (pathRef.current) {
        gsap.to(pathRef.current, {
          attr: { d: BLOB_B },
          duration: 7,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }

      // Subtle drift + rotate on the wrapper
      gsap.to("[data-hero-blob-wrap]", {
        y: "+=14",
        duration: 6,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
      gsap.to("[data-hero-blob-wrap]", {
        rotate: 3,
        duration: 11,
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
      {/* SVG defs — organic clip path + subtle edge displacement filter */}
      <svg
        aria-hidden
        width="0"
        height="0"
        className="absolute"
        style={{ position: "absolute", width: 0, height: 0 }}
      >
        <defs>
          <clipPath id="heroBlobClip" clipPathUnits="objectBoundingBox">
            <path ref={pathRef} d={BLOB_A} />
          </clipPath>
          <filter id="heroBlobEdge">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012"
              numOctaves="2"
              seed="3"
            />
            <feDisplacementMap in="SourceGraphic" scale="6" />
          </filter>
        </defs>
      </svg>

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
        <a href="#kontakt" data-hero-nav className="font-mono-label md:hidden">
          MENU
        </a>
      </header>

      {/* Top-edge corner meta — small agency-style markers */}
      <div
        data-hero-nav
        className="absolute left-6 top-24 z-20 hidden font-mono-label text-[#050505]/50 md:block"
      >
        (01) PREMIUM TRAINING
        <br />
        SINCE 2026
      </div>
      <div
        data-hero-nav
        className="absolute right-6 top-24 z-20 hidden text-right font-mono-label text-[#050505]/50 md:block"
      >
        N 48.7°
        <br />
        E 09.1°
      </div>

      {/* CENTRAL ORGANIC MEDIA REVEAL */}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <div
          data-hero-blob-wrap
          className="relative h-[64vmin] w-[64vmin] max-h-[680px] max-w-[680px] md:h-[54vmin] md:w-[54vmin]"
        >
          {/* Media clipped by the organic SVG path */}
          <div
            data-hero-media
            className="absolute inset-0"
            style={{
              clipPath: "url(#heroBlobClip)",
              WebkitClipPath: "url(#heroBlobClip)",
            }}
          >
            {!mediaFailed ? (
              <video
                src="/media/hero-a.mp4"
                className="h-full w-full object-cover"
                muted
                autoPlay
                loop
                playsInline
                preload="metadata"
                onError={() => setMediaFailed(true)}
              />
            ) : (
              // Neutral media-like fallback — feels like a photograph, not a color blob
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(135deg, #2b2b2b 0%, #3a3a3a 35%, #555 55%, #2a2a2a 100%)",
                }}
              >
                <div
                  className="absolute inset-0 mix-blend-overlay opacity-60"
                  style={{
                    background:
                      "radial-gradient(60% 80% at 30% 25%, rgba(255,255,255,0.25), transparent 60%), radial-gradient(70% 60% at 75% 80%, rgba(0,0,0,0.45), transparent 65%)",
                  }}
                />
                <div
                  className="absolute inset-0 opacity-[0.08]"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(90deg, rgba(255,255,255,0.4) 0 1px, transparent 1px 3px)",
                  }}
                />
              </div>
            )}
          </div>

          {/* Subtle outlined echo — second offset organic stroke for layered liquid feel */}
          <svg
            aria-hidden
            viewBox="0 0 1 1"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full text-[#050505]/15"
            style={{ transform: "translate(2.5%, 3%) scale(1.02)" }}
          >
            <path
              d={BLOB_A}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.004"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Tiny floating index badge near edge of blob */}
          <span
            data-hero-meta
            className="absolute -right-2 top-[8%] hidden font-mono-label text-[#050505]/60 md:block"
          >
            01 / 06
          </span>
        </div>
      </div>

      {/* BOTTOM ROW — caption-style statement bottom-left, scroll cue bottom-right */}
      <div className="absolute inset-x-0 bottom-0 z-20 px-6 pb-10 md:px-10 md:pb-12">
        <div className="flex items-end justify-between gap-10">
          {/* Editorial caption block — restrained, agency-style */}
          <div className="max-w-[440px]">
            <span
              data-hero-meta
              className="block font-mono-label text-[#050505]/55"
            >
              ⟶ MANIFEST / SMILEFIT
            </span>

            <h1
              data-hero-meta
              className="mt-5 font-display text-[clamp(26px,3vw,46px)] leading-[0.96] tracking-[-0.025em]"
            >
              <span className="block overflow-hidden">
                <span data-hero-line className="block">
                  Kein Standard.
                </span>
              </span>
              <span className="block overflow-hidden">
                <span data-hero-line className="block">
                  Kein Zufall.
                </span>
              </span>
            </h1>

            <p
              data-hero-meta
              className="mt-5 max-w-[360px] text-[12.5px] leading-[1.5] text-[#050505]/70"
              style={{
                fontFamily:
                  "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontWeight: 400,
                textTransform: "none",
                letterSpacing: 0,
              }}
            >
              Premium Training. Maschinen, Atmosphäre und Fokus auf einem
              anderen Level.
            </p>

            <a
              data-hero-meta
              href="#kontakt"
              className="group mt-6 inline-flex items-center gap-2 font-mono-label text-[#050505]"
            >
              <span>Probetraining sichern</span>
              <span
                aria-hidden
                className="transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            </a>
          </div>

          {/* Scroll indicator bottom-right */}
          <div
            data-hero-meta
            className="flex flex-col items-end gap-3 text-[#050505]/70"
          >
            <span className="font-mono-label">SCROLL</span>
            <span className="block h-12 w-px bg-[#050505]/40" />
          </div>
        </div>
      </div>
    </section>
  );
}
