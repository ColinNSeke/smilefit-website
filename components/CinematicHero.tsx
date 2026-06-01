"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * SmileFit — Title-sequence hero.
 *
 * Three mechanics:
 *  1. Z-depth — headline (L1) sits BEHIND a foreground subject cutout (L2),
 *     so the dumbbell/hand passes in front of the type.
 *  2. Title reveal — staggered, masked line-by-line entrance on load,
 *     like a film credit sequence.
 *  3. Scroll morph — pinned scrub timeline: video scales, type blurs and
 *     lifts away, subject drifts up out of frame, fade-to-black seamlessly
 *     hands off to the next section.
 *
 * Layers:
 *   L0 (z=0)   full-bleed background <video> with poster
 *   L1 (z=10)  headline block (eyebrow + h1 + subhead + CTA)
 *   L2 (z=20)  alpha-cutout subject  →  /public/hero/subject.png
 *               (TODO: drop the actual alpha PNG here; graceful fallback
 *                hides this layer if the asset 404s.)
 *
 * Reduced-motion: pin / parallax / mask reveals are skipped; final state
 * renders with a calm fade.
 */
export default function CinematicHero() {
  const root = useRef<HTMLElement | null>(null);
  const cta = useRef<HTMLAnchorElement | null>(null);
  const [subjectFailed, setSubjectFailed] = useState(false);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const cleanups: Array<() => void> = [];
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const hover = window.matchMedia(
      "(min-width: 768px) and (hover: hover)"
    ).matches;

    const ctx = gsap.context(() => {
      if (reduce) {
        // Calm fade-in for everything, no pin, no parallax.
        gsap.from(
          "[data-nav], [data-eyebrow], [data-headline] [data-line], [data-subhead], [data-cta], [data-subject]",
          {
            opacity: 0,
            duration: 0.6,
            ease: "power2.out",
            stagger: 0.05,
          }
        );
        return;
      }

      // ============== INTRO TIMELINE ==============
      const intro = gsap.timeline({
        defaults: { ease: "power4.out" },
        delay: 0.15,
      });

      // Nav + logo
      intro.from(
        "[data-nav]",
        { y: -16, opacity: 0, duration: 0.8, stagger: 0.05 },
        0
      );

      // Eyebrow rule draws in, then text fades
      intro.from(
        "[data-eyebrow-rule]",
        { scaleX: 0, duration: 0.75, ease: "expo.out" },
        0.3
      );
      intro.from(
        "[data-eyebrow-text]",
        { opacity: 0, x: -8, duration: 0.6 },
        0.5
      );

      // Headline: line-by-line mask-up reveal (film credits)
      intro.from(
        "[data-line]",
        {
          yPercent: 110,
          duration: 0.95,
          stagger: 0.12,
          ease: "power4.out",
        },
        0.4
      );

      // Subhead, CTA
      intro.from(
        "[data-subhead]",
        { opacity: 0, y: 14, duration: 0.7 },
        1.05
      );
      intro.from("[data-cta]", { opacity: 0, y: 12, duration: 0.7 }, 1.18);
      intro.from(
        "[data-scrollcue]",
        { opacity: 0, duration: 0.6 },
        1.3
      );

      // Foreground subject drifts in from below at a different rate
      intro.from(
        "[data-subject]",
        {
          opacity: 0,
          y: 40,
          scale: 1.05,
          duration: 1.3,
          ease: "expo.out",
        },
        0.6
      );

      // ============== SCROLL MORPH (pinned, scrubbed) ==============
      const morph = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "+=110%",
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
        },
      });

      morph
        // L0: video pushes deeper into frame
        .to("[data-bg]", { scale: 1.12, yPercent: -4 }, 0)
        // L2: subject drifts up
        .to("[data-subject]", { yPercent: -8 }, 0)
        // Subtle vignette deepens early
        .to("[data-vignette]", { opacity: 1 }, 0)
        // Mid: type starts to dissolve (blur + lift + fade)
        .to(
          "[data-headline]",
          { filter: "blur(8px)", opacity: 0, y: -60 },
          0.5
        )
        .to("[data-eyebrow]", { opacity: 0 }, 0.45)
        .to("[data-subhead]", { opacity: 0 }, 0.5)
        .to("[data-cta]", { opacity: 0, y: -14 }, 0.45)
        .to("[data-scrollcue]", { opacity: 0 }, 0.4)
        // Late: subject lifts out + background fades so the next section
        // (dark MediaCollage) takes over without a visible boundary.
        .to("[data-subject]", { yPercent: -110, opacity: 0 }, 0.6)
        .to("[data-bg]", { opacity: 0.25, scale: 1.2 }, 0.7)
        .to("[data-handoff]", { opacity: 1 }, 0.75);

      // ============== POINTER PARALLAX (desktop) ==============
      if (hover && root.current) {
        const rootEl = root.current;
        const qBgX = gsap.quickTo("[data-bg]", "x", {
          duration: 1.4,
          ease: "power3.out",
        });
        const qBgY = gsap.quickTo("[data-bg]", "y", {
          duration: 1.4,
          ease: "power3.out",
        });
        const qHX = gsap.quickTo("[data-headline]", "x", {
          duration: 0.9,
          ease: "power3.out",
        });
        const qHY = gsap.quickTo("[data-headline]", "y", {
          duration: 0.9,
          ease: "power3.out",
        });
        const qSX = gsap.quickTo("[data-subject]", "x", {
          duration: 0.7,
          ease: "power3.out",
        });
        const qSY = gsap.quickTo("[data-subject]", "y", {
          duration: 0.7,
          ease: "power3.out",
        });
        const onMove = (e: MouseEvent) => {
          const rect = rootEl.getBoundingClientRect();
          const mx = (e.clientX - rect.left) / rect.width - 0.5;
          const my = (e.clientY - rect.top) / rect.height - 0.5;
          // Back slow, front fast
          qBgX(mx * -8);
          qBgY(my * -6);
          qHX(mx * 6);
          qHY(my * 4);
          qSX(mx * 14);
          qSY(my * 10);
        };
        window.addEventListener("mousemove", onMove);
        cleanups.push(() => window.removeEventListener("mousemove", onMove));
      }

      // ============== MAGNETIC CTA ==============
      if (hover && cta.current) {
        const btn = cta.current;
        const qX = gsap.quickTo(btn, "x", {
          duration: 0.35,
          ease: "power3.out",
        });
        const qY = gsap.quickTo(btn, "y", {
          duration: 0.35,
          ease: "power3.out",
        });
        const onCtaMove = (e: MouseEvent) => {
          const rect = btn.getBoundingClientRect();
          const x = e.clientX - (rect.left + rect.width / 2);
          const y = e.clientY - (rect.top + rect.height / 2);
          const dist = Math.hypot(x, y);
          const radius = 140;
          const cap = 12;
          if (dist < radius) {
            const f = 1 - dist / radius;
            qX(Math.max(-cap, Math.min(cap, x * 0.3 * f)));
            qY(Math.max(-cap, Math.min(cap, y * 0.3 * f)));
          } else {
            qX(0);
            qY(0);
          }
        };
        window.addEventListener("mousemove", onCtaMove);
        cleanups.push(() =>
          window.removeEventListener("mousemove", onCtaMove)
        );
      }
    }, root);

    return () => {
      cleanups.forEach((c) => c());
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={root}
      className="relative h-screen w-full overflow-hidden bg-[#050505] text-[#f2efe6]"
    >
      {/* ============ L0 — BACKGROUND VIDEO ============ */}
      <div
        data-bg
        className="absolute inset-0 z-0"
        style={{ willChange: "transform" }}
      >
        <video
          src="/media/hero-a.mp4"
          poster="/hero/poster.jpg"
          className="absolute inset-0 h-full w-full object-cover"
          muted
          autoPlay
          loop
          playsInline
          preload="metadata"
        />
        {/* Cinematic scrim — pushes the video into the dark register */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 28%, rgba(0,0,0,0.30) 65%, rgba(0,0,0,0.88) 100%)",
          }}
        />
        {/* Subtle violet wash (hex-light reference) */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 80% at 18% 12%, rgba(124,108,255,0.10), transparent 55%)",
          }}
        />
      </div>

      {/* Grain */}
      <div
        className="pointer-events-none absolute inset-0 z-[2] opacity-[0.08] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>\")",
          backgroundSize: "180px 180px",
        }}
      />

      {/* Vignette (deepens on scrub) */}
      <div
        data-vignette
        className="pointer-events-none absolute inset-0 z-[2] opacity-50"
        style={{
          background:
            "radial-gradient(130% 90% at 50% 50%, transparent 30%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.92) 100%)",
        }}
      />

      {/* ============ NAV ============ */}
      <header className="absolute inset-x-0 top-0 z-[40] flex items-center justify-between px-6 py-6 md:px-10 md:py-8">
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

      {/* ============ L1 — HEADLINE BLOCK ============ */}
      <div
        data-headline
        className="absolute inset-x-0 bottom-0 z-[10] px-6 pb-12 md:px-10 md:pb-16"
        style={{ willChange: "transform, filter, opacity" }}
      >
        <div className="flex items-end justify-between gap-10">
          <div className="max-w-[820px]">
            {/* Eyebrow with accent rule */}
            <div data-eyebrow className="mb-6 flex items-center gap-3">
              <span
                data-eyebrow-rule
                className="block h-px w-12 bg-[#7a4cff]"
                style={{ transformOrigin: "left center" }}
              />
              <span
                data-eyebrow-text
                className="text-[11px] uppercase tracking-[0.32em] text-[#7a4cff]"
                style={{
                  fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                  fontWeight: 600,
                }}
              >
                Built Different.
              </span>
            </div>

            {/* H1 — three stacked lines, each masked for reveal */}
            <h1
              className="font-display leading-[0.88] tracking-[-0.02em]"
              style={{
                fontSize: "clamp(60px, 9vw, 168px)",
                textTransform: "uppercase",
              }}
            >
              <span className="block overflow-hidden">
                <span data-line className="block">
                  Kein
                </span>
              </span>
              <span className="block overflow-hidden">
                <span data-line className="block">
                  Standard.
                </span>
              </span>
              <span className="block overflow-hidden">
                <span data-line className="block">
                  Kein Zufall.
                </span>
              </span>
            </h1>

            <p
              data-subhead
              className="mt-7 max-w-[380px] text-[13px] leading-[1.55] text-[#f2efe6]/75"
              style={{
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontWeight: 400,
                textTransform: "none",
                letterSpacing: 0,
              }}
            >
              Premium Training. Maschinen. Atmosphäre. Fokus.
            </p>

            <div data-cta className="mt-7">
              <a
                ref={cta}
                href="#kontakt"
                className="group relative inline-flex items-center gap-3 overflow-hidden border border-[#f2efe6]/85 px-5 py-3 text-[11px] uppercase tracking-[0.22em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a4cff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
                style={{
                  fontFamily:
                    "Helvetica Neue, Helvetica, Arial, sans-serif",
                  fontWeight: 600,
                  willChange: "transform",
                }}
              >
                {/* Fill-from-bottom layer */}
                <span
                  aria-hidden
                  className="absolute inset-0 translate-y-full bg-[#f2efe6] transition-transform duration-500 ease-out group-hover:translate-y-0"
                />
                <span className="relative transition-colors duration-500 group-hover:text-[#050505]">
                  Probetraining sichern
                </span>
                <span
                  aria-hidden
                  className="relative transition-[transform,color] duration-500 group-hover:translate-x-1 group-hover:text-[#050505]"
                >
                  →
                </span>
              </a>
            </div>
          </div>

          {/* Scroll cue (animated) */}
          <div
            data-scrollcue
            className="hidden flex-col items-end gap-3 text-[#f2efe6]/70 md:flex"
            style={{
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontWeight: 500,
            }}
          >
            <span className="text-[11px] uppercase tracking-[0.28em]">
              Scroll
            </span>
            <span className="relative block h-14 w-px overflow-hidden bg-[#f2efe6]/15">
              <span className="animate-scroll-cue absolute inset-x-0 top-0 h-1/3 bg-[#f2efe6]" />
            </span>
          </div>
        </div>
      </div>

      {/* ============ L2 — FOREGROUND SUBJECT CUTOUT ============ */}
      {/*
        TODO: drop an alpha cutout at /public/hero/subject.png (or upgrade
        to an alpha video, WebM/VP9 or HEVC). Without the asset, this
        layer is hidden gracefully — the hero composition still reads
        correctly.
      */}
      {!subjectFailed && (
        <div
          data-subject
          className="pointer-events-none absolute inset-0 z-[20] hidden md:block"
          style={{ willChange: "transform, opacity" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero/subject.png"
            alt=""
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-full w-full object-contain object-bottom"
            onError={() => setSubjectFailed(true)}
          />
        </div>
      )}

      {/* ============ HANDOFF VEIL ============ */}
      {/* Late-scroll fade to flat black so the pinned hero unpins into
          MediaCollage with no visible boundary. */}
      <div
        data-handoff
        className="pointer-events-none absolute inset-0 z-[30] bg-[#050505] opacity-0"
      />
    </section>
  );
}
