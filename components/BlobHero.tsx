"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

/**
 * Four distinct irregular liquid silhouettes (objectBoundingBox 0..1).
 * Each fragment of the cluster gets its own shape so the composition reads
 * as overlapping organic media reveals, not a single oval.
 */
const PATH_MAIN_A =
  "M0.20,0.08 C0.40,-0.02 0.62,0.04 0.78,0.14 C0.92,0.24 1.04,0.40 0.96,0.56 C0.90,0.70 0.98,0.84 0.84,0.92 C0.66,1.02 0.46,0.98 0.30,0.92 C0.14,0.86 0.02,0.74 0.06,0.58 C0.10,0.42 -0.02,0.28 0.08,0.18 C0.12,0.12 0.16,0.10 0.20,0.08 Z";
const PATH_MAIN_B =
  "M0.18,0.12 C0.36,0.00 0.60,0.02 0.76,0.12 C0.92,0.22 1.00,0.42 0.94,0.58 C0.88,0.72 0.96,0.86 0.80,0.94 C0.62,1.02 0.42,0.96 0.28,0.90 C0.12,0.84 0.00,0.72 0.04,0.56 C0.08,0.40 -0.02,0.26 0.06,0.16 C0.10,0.12 0.14,0.10 0.18,0.12 Z";

const PATH_SAT_A =
  "M0.18,0.16 C0.32,0.04 0.56,-0.04 0.74,0.06 C0.92,0.16 1.02,0.34 0.92,0.52 C0.86,0.68 0.92,0.86 0.76,0.94 C0.60,1.02 0.40,0.96 0.24,0.88 C0.08,0.78 -0.02,0.58 0.04,0.40 C0.10,0.26 0.04,0.18 0.18,0.16 Z";
const PATH_SAT_A_ALT =
  "M0.22,0.12 C0.36,0.02 0.58,0.00 0.76,0.10 C0.94,0.20 0.98,0.38 0.90,0.56 C0.84,0.70 0.94,0.86 0.78,0.94 C0.62,1.02 0.42,0.94 0.26,0.86 C0.10,0.76 0.02,0.56 0.08,0.40 C0.14,0.28 0.06,0.16 0.22,0.12 Z";

const PATH_SAT_B =
  "M0.22,0.10 C0.38,0.02 0.56,0.00 0.74,0.10 C0.90,0.20 1.02,0.36 0.94,0.52 C0.88,0.66 0.96,0.82 0.80,0.90 C0.62,1.00 0.42,1.02 0.26,0.94 C0.10,0.86 -0.02,0.68 0.06,0.52 C0.12,0.40 0.06,0.22 0.16,0.14 C0.18,0.12 0.20,0.10 0.22,0.10 Z";
const PATH_SAT_B_ALT =
  "M0.20,0.14 C0.34,0.04 0.54,0.02 0.72,0.12 C0.88,0.22 1.00,0.40 0.92,0.56 C0.86,0.68 0.94,0.84 0.78,0.92 C0.60,1.00 0.40,1.00 0.24,0.92 C0.08,0.84 -0.02,0.66 0.08,0.50 C0.14,0.38 0.04,0.20 0.20,0.14 Z";

const PATH_SAT_C =
  "M0.20,0.12 C0.36,0.04 0.54,0.02 0.72,0.08 C0.88,0.14 1.02,0.30 0.96,0.48 C0.90,0.64 1.00,0.80 0.82,0.88 C0.66,0.96 0.46,1.00 0.30,0.92 C0.14,0.84 0.00,0.68 0.08,0.50 C0.14,0.36 0.04,0.20 0.20,0.12 Z";

type FragmentDef = {
  key: string;
  src: string;
  video?: boolean;
  alt: string;
  clipId: string;
  /** Tailwind classes for size + position relative to the cluster wrapper. */
  className: string;
  /** Fallback CSS background — different grayscale tones per fragment. */
  fallback: string;
  /** Float motion parameters. */
  floatY: number;
  floatRot: number;
  floatDur: number;
};

const FRAGMENTS: FragmentDef[] = [
  {
    key: "main",
    src: "/media/hero-a.mp4",
    video: true,
    alt: "Main training reel",
    clipId: "clipMain",
    // main blob — large, slightly left of center, occupying the cluster core
    className:
      "left-[6%] top-[8%] h-[78%] w-[64%] md:left-[8%] md:top-[6%] md:h-[82%] md:w-[60%]",
    fallback:
      "linear-gradient(140deg, #1f2024 0%, #2d2f33 38%, #4a4c52 62%, #1a1b1f 100%)",
    floatY: 10,
    floatRot: -2,
    floatDur: 7,
  },
  {
    key: "sat-a",
    src: "/media/gym-01.jpg",
    alt: "Hammer floor fragment",
    clipId: "clipSatA",
    // top-right satellite — overlaps main, smaller
    className:
      "right-[-4%] top-[-4%] h-[42%] w-[36%] md:right-[-2%] md:top-[-2%] md:h-[44%] md:w-[34%]",
    fallback:
      "linear-gradient(160deg, #3a3530 0%, #5a4f44 50%, #2b2620 100%)",
    floatY: -14,
    floatRot: 3,
    floatDur: 8.5,
  },
  {
    key: "sat-b",
    src: "/media/gym-02.jpg",
    alt: "Turf fragment",
    clipId: "clipSatB",
    // bottom satellite, spilling slightly under main blob, slightly right
    className:
      "left-[42%] bottom-[-6%] h-[40%] w-[40%] md:left-[44%] md:bottom-[-4%] md:h-[42%] md:w-[38%]",
    fallback:
      "linear-gradient(170deg, #1e2a26 0%, #2e3d36 45%, #14201b 100%)",
    floatY: 12,
    floatRot: -3,
    floatDur: 9.5,
  },
  {
    key: "sat-c",
    src: "/media/gym-03.jpg",
    alt: "Rooftop fragment",
    clipId: "clipSatC",
    // small left satellite, peeking out from behind the main blob
    className:
      "left-[-6%] bottom-[14%] h-[30%] w-[26%] md:left-[-4%] md:bottom-[18%] md:h-[28%] md:w-[22%]",
    fallback:
      "linear-gradient(150deg, #2a2126 0%, #44343c 50%, #1a1318 100%)",
    floatY: -8,
    floatRot: 4,
    floatDur: 10,
  },
];

function FragmentBlob({ frag }: { frag: FragmentDef }) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      data-frag={frag.key}
      className={`absolute ${frag.className}`}
      style={{ willChange: "transform" }}
    >
      <div
        className="relative h-full w-full"
        style={{
          clipPath: `url(#${frag.clipId})`,
          WebkitClipPath: `url(#${frag.clipId})`,
        }}
      >
        {!failed && frag.video ? (
          <video
            src={frag.src}
            className="h-full w-full object-cover"
            muted
            autoPlay
            loop
            playsInline
            preload="metadata"
            onError={() => setFailed(true)}
          />
        ) : !failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={frag.src}
            alt={frag.alt}
            className="h-full w-full object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: frag.fallback }}
          >
            <div
              className="absolute inset-0 mix-blend-overlay opacity-50"
              style={{
                background:
                  "radial-gradient(60% 70% at 30% 25%, rgba(255,255,255,0.22), transparent 60%), radial-gradient(70% 60% at 75% 80%, rgba(0,0,0,0.5), transparent 65%)",
              }}
            />
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, rgba(255,255,255,0.6) 0 1px, transparent 1px 3px)",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function BlobHero() {
  const root = useRef<HTMLElement | null>(null);
  const pathMainRef = useRef<SVGPathElement | null>(null);
  const pathSatARef = useRef<SVGPathElement | null>(null);
  const pathSatBRef = useRef<SVGPathElement | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

      tl.from("[data-nav]", {
        y: -16,
        opacity: 0,
        duration: 0.9,
        stagger: 0.05,
        ease: "power3.out",
      })
        .from(
          "[data-cluster]",
          { scale: 0.92, opacity: 0, duration: 1.4 },
          "-=0.4"
        )
        .from(
          "[data-frag]",
          {
            scale: 0.7,
            opacity: 0,
            duration: 1.3,
            stagger: 0.12,
            ease: "expo.out",
          },
          "-=1.2"
        )
        .from(
          "[data-line]",
          {
            yPercent: 110,
            duration: 1.0,
            stagger: 0.08,
          },
          "-=0.9"
        )
        .from(
          "[data-meta]",
          {
            opacity: 0,
            y: 10,
            duration: 0.7,
            stagger: 0.07,
            ease: "power3.out",
          },
          "-=0.6"
        );

      // Subtle continuous float per fragment — different timings give the
      // composition a living, liquid feel without bouncing.
      FRAGMENTS.forEach((frag) => {
        const el = root.current?.querySelector(`[data-frag="${frag.key}"]`);
        if (!el) return;
        gsap.to(el, {
          y: `+=${frag.floatY}`,
          rotate: frag.floatRot,
          duration: frag.floatDur,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      });

      // Gentle path morphing on three of the clip shapes so the silhouettes
      // breathe like liquid.
      if (pathMainRef.current) {
        gsap.to(pathMainRef.current, {
          attr: { d: PATH_MAIN_B },
          duration: 8,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }
      if (pathSatARef.current) {
        gsap.to(pathSatARef.current, {
          attr: { d: PATH_SAT_A_ALT },
          duration: 9,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }
      if (pathSatBRef.current) {
        gsap.to(pathSatBRef.current, {
          attr: { d: PATH_SAT_B_ALT },
          duration: 10,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      className="relative min-h-screen w-full overflow-hidden bg-[#f2efe6] text-[#050505]"
    >
      {/* SVG defs — one organic clipPath per fragment */}
      <svg
        aria-hidden
        width="0"
        height="0"
        className="absolute"
        style={{ position: "absolute", width: 0, height: 0 }}
      >
        <defs>
          <clipPath id="clipMain" clipPathUnits="objectBoundingBox">
            <path ref={pathMainRef} d={PATH_MAIN_A} />
          </clipPath>
          <clipPath id="clipSatA" clipPathUnits="objectBoundingBox">
            <path ref={pathSatARef} d={PATH_SAT_A} />
          </clipPath>
          <clipPath id="clipSatB" clipPathUnits="objectBoundingBox">
            <path ref={pathSatBRef} d={PATH_SAT_B} />
          </clipPath>
          <clipPath id="clipSatC" clipPathUnits="objectBoundingBox">
            <path d={PATH_SAT_C} />
          </clipPath>
        </defs>
      </svg>

      {/* TOP NAV */}
      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-6 md:px-10 md:py-8">
        <a
          href="#"
          data-nav
          className="font-display text-[18px] tracking-[-0.02em] md:text-[20px]"
        >
          SMILEFIT
        </a>
        <nav
          data-nav
          className="hidden items-center gap-7 text-[12px] uppercase tracking-[0.04em] md:flex"
          style={{
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            fontWeight: 500,
          }}
        >
          <a href="#training" className="hover:opacity-60">
            Training
          </a>
          <a href="#raume" className="hover:opacity-60">
            Räume
          </a>
          <a href="#mitgliedschaft" className="hover:opacity-60">
            Mitgliedschaft
          </a>
          <a href="#kontakt" className="hover:opacity-60">
            Kontakt
          </a>
        </nav>
        <a
          href="#kontakt"
          data-nav
          className="text-[12px] uppercase tracking-[0.06em] md:hidden"
          style={{
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            fontWeight: 500,
          }}
        >
          Menu
        </a>
      </header>

      {/* CENTRAL LIQUID CLUSTER */}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <div
          data-cluster
          className="relative h-[78vmin] w-[78vmin] max-h-[820px] max-w-[820px] md:h-[64vmin] md:w-[64vmin]"
        >
          {FRAGMENTS.map((frag) => (
            <FragmentBlob key={frag.key} frag={frag} />
          ))}
        </div>
      </div>

      {/* BOTTOM-LEFT STATEMENT */}
      <div className="absolute inset-x-0 bottom-0 z-20 px-6 pb-10 md:px-10 md:pb-12">
        <div className="flex items-end justify-between gap-10">
          <div className="max-w-[520px]">
            <h1
              className="font-display text-[clamp(40px,4.6vw,72px)] leading-[0.92] tracking-[-0.035em]"
              style={{ textTransform: "uppercase" }}
            >
              <span className="block overflow-hidden">
                <span data-line className="block">
                  Kein Standard.
                </span>
              </span>
              <span className="block overflow-hidden">
                <span data-line className="block">
                  Kein Zufall.
                </span>
              </span>
            </h1>

            <p
              data-meta
              className="mt-5 max-w-[360px] text-[13px] leading-[1.5] text-[#050505]/75"
              style={{
                fontFamily:
                  "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontWeight: 400,
              }}
            >
              Premium Training. Maschinen, Atmosphäre und Fokus auf einem
              anderen Level.
            </p>

            <a
              data-meta
              href="#kontakt"
              className="group mt-6 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em]"
              style={{
                fontFamily:
                  "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontWeight: 600,
              }}
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

          {/* Scroll cue */}
          <div
            data-meta
            className="hidden flex-col items-end gap-3 text-[#050505]/70 md:flex"
            style={{
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontWeight: 500,
            }}
          >
            <span className="text-[11px] uppercase tracking-[0.18em]">
              Scroll down
            </span>
            <span className="block h-12 w-px bg-[#050505]/40" />
          </div>
        </div>
      </div>
    </section>
  );
}
