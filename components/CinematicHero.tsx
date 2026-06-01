"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * SmileFit — Multi-scene cinematic hero.
 *
 * Mechanics:
 *  Scene 0 — Impact load: the masked headline settles (1.06 → 1) with a
 *    one-frame screen shake + grain/vignette pulse; the neon eyebrow rule
 *    draws in; nav / logo / subhead / CTA stagger in.
 *  Scene 1 — Type as window: an SVG mask paints near-black over the footage
 *    everywhere EXCEPT the letterforms, so the video is visible only inside
 *    the type. Vector mask → crisp at any size.
 *  Scene 2 — Flood + handoff: a pinned, scrubbed timeline scales the masked
 *    type up and fades the near-black surround so the footage floods the
 *    viewport, fades the eyebrow/subhead/CTA, then settles to near-black so
 *    the (near-black) room section takes over with no empty frame.
 *
 * Desktop also gets a cursor spotlight (lights the footage seen through the
 * letters) and a magnetic CTA. Mobile / reduced-motion fall back to a calm
 * impact-fade with a plainly-rendered cream headline.
 *
 * The real <h1> is always in the DOM (visible on mobile, sr-only on desktop
 * where the SVG carries the same words) so the headline is never blocked by
 * JS and stays readable if JS fails.
 */
export default function CinematicHero() {
  const root = useRef<HTMLElement | null>(null);
  const cta = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const cleanups: Array<() => void> = [];
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // ===================== DESKTOP =====================
      mm.add("(min-width: 768px)", () => {
        const hover = window.matchMedia("(hover: hover)").matches;

        if (reduce) {
          // Final states only — no shake, no scrub.
          gsap.set("[data-window], [data-mask]", { opacity: 1, scale: 1 });
          gsap.set("[data-eyebrow-rule]", { scaleX: 1 });
          gsap.set(
            "[data-nav], [data-eyebrow-text], [data-subhead], [data-cta], [data-scrollcue]",
            { opacity: 1, y: 0, x: 0 }
          );
          return;
        }

        // -------- Scene 0: impact load --------
        const intro = gsap.timeline({
          defaults: { ease: "power4.out" },
          delay: 0.12,
        });

        // Masked headline settles with a fast overshoot.
        intro.from(
          "[data-window]",
          { scale: 1.06, duration: 1.1, ease: "expo.out" },
          0
        );
        // One-frame screen shake.
        intro.to(
          root.current,
          {
            keyframes: { x: [0, -4, 4, -3, 2, 0] },
            duration: 0.34,
            ease: "none",
          },
          0.06
        );
        // Grain + vignette pulse.
        intro.fromTo(
          "[data-grain]",
          { opacity: 0.22 },
          { opacity: 0.08, duration: 0.7, ease: "power2.out" },
          0
        );
        intro.fromTo(
          "[data-vignette]",
          { opacity: 0.85 },
          { opacity: 0.5, duration: 0.7, ease: "power2.out" },
          0
        );

        // Nav + logo drop in.
        intro.from(
          "[data-nav]",
          { y: -16, opacity: 0, duration: 0.8, stagger: 0.05 },
          0.15
        );
        // Eyebrow rule draws, then text.
        intro.from(
          "[data-eyebrow-rule]",
          { scaleX: 0, duration: 0.7, ease: "expo.out" },
          0.25
        );
        intro.from(
          "[data-eyebrow-text]",
          { opacity: 0, x: -8, duration: 0.6 },
          0.45
        );
        intro.from("[data-subhead]", { opacity: 0, y: 14, duration: 0.7 }, 0.7);
        intro.from("[data-cta]", { opacity: 0, y: 12, duration: 0.7 }, 0.82);
        intro.from(
          "[data-scrollcue]",
          { opacity: 0, duration: 0.6 },
          0.95
        );

        // -------- Scene 2: flood + handoff (pinned scrub) --------
        const morph = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "+=120%",
            pin: true,
            scrub: 0.8,
            anticipatePin: 1,
          },
        });

        morph
          // Footage pushes in.
          .to("[data-bg]", { scale: 1.16 }, 0)
          // Type scales up and the near-black surround fades → footage floods.
          .to("[data-mask]", { scale: 1.55, opacity: 0 }, 0)
          // UI clears out.
          .to("[data-eyebrow]", { opacity: 0, y: -10 }, 0.2)
          .to("[data-subhead]", { opacity: 0, y: -10 }, 0.25)
          .to("[data-cta]", { opacity: 0, y: -10 }, 0.2)
          .to("[data-scrollcue]", { opacity: 0 }, 0.1)
          .to("[data-vignette]", { opacity: 0.85 }, 0.4)
          // Settle to near-black so the (near-black) room hands off seamlessly.
          .to("[data-handoff]", { opacity: 1 }, 0.82);

        // -------- Cursor spotlight (lights footage through the type) --------
        if (hover && root.current) {
          const rootEl = root.current;
          const qX = gsap.quickTo("[data-cursorlight]", "x", {
            duration: 0.5,
            ease: "power3.out",
          });
          const qY = gsap.quickTo("[data-cursorlight]", "y", {
            duration: 0.5,
            ease: "power3.out",
          });
          gsap.set("[data-cursorlight]", { opacity: 0 });
          const onMove = (e: MouseEvent) => {
            const rect = rootEl.getBoundingClientRect();
            qX(e.clientX - rect.left);
            qY(e.clientY - rect.top);
            gsap.to("[data-cursorlight]", {
              opacity: 1,
              duration: 0.4,
              overwrite: "auto",
            });
          };
          const onLeave = () =>
            gsap.to("[data-cursorlight]", { opacity: 0, duration: 0.4 });
          rootEl.addEventListener("mousemove", onMove);
          rootEl.addEventListener("mouseleave", onLeave);
          cleanups.push(() => {
            rootEl.removeEventListener("mousemove", onMove);
            rootEl.removeEventListener("mouseleave", onLeave);
          });
        }

        // -------- Magnetic CTA --------
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
      });

      // ===================== MOBILE =====================
      mm.add("(max-width: 767px)", () => {
        if (reduce) return;
        gsap.from(
          "[data-nav], [data-eyebrow], [data-h1-mobile], [data-subhead], [data-cta]",
          {
            opacity: 0,
            y: 22,
            duration: 0.8,
            ease: "power3.out",
            stagger: 0.08,
          }
        );
      });
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
      <div data-bg className="absolute inset-0 z-0" style={{ willChange: "transform" }}>
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
        {/* Violet wash (hex-light reference) */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 80% at 18% 12%, rgba(124,108,255,0.12), transparent 55%)",
          }}
        />
      </div>

      {/* Cursor spotlight — desktop only, sits under the mask so it lights
          the footage seen through the letterforms. */}
      <div
        data-cursorlight
        className="pointer-events-none absolute left-0 top-0 z-[3] hidden h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 mix-blend-screen md:block"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(124,108,255,0.10) 32%, transparent 62%)",
          willChange: "transform, opacity",
        }}
      />

      {/* Grain */}
      <div
        data-grain
        className="pointer-events-none absolute inset-0 z-[4] opacity-[0.08] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>\")",
          backgroundSize: "180px 180px",
        }}
      />

      {/* ============ L1 — TYPE-AS-WINDOW (desktop) ============ */}
      {/* SVG paints near-black over the footage except inside the letters. */}
      <div
        data-window
        className="pointer-events-none absolute inset-0 z-[5] hidden md:block"
        style={{ willChange: "transform" }}
      >
        <div
          data-mask
          className="absolute inset-0"
          style={{ willChange: "transform, opacity", transformOrigin: "12% 64%" }}
        >
          <svg
            className="h-full w-full"
            viewBox="0 0 1280 720"
            preserveAspectRatio="xMidYMid slice"
            role="presentation"
            aria-hidden="true"
          >
            <defs>
              <mask id="heroTypeMask">
                <rect x="0" y="0" width="1280" height="720" fill="#fff" />
                <g
                  fill="#000"
                  style={{
                    fontFamily:
                      '"Arial Black", "Helvetica Neue", Helvetica, Arial, sans-serif',
                    fontWeight: 900,
                  }}
                  fontSize="138"
                  letterSpacing="-3"
                >
                  <text x="60" y="408">
                    KEIN
                  </text>
                  <text x="60" y="546">
                    STANDARD.
                  </text>
                  <text x="60" y="684">
                    KEIN ZUFALL.
                  </text>
                </g>
              </mask>
            </defs>
            {/* Near-black surround with the letters knocked out. */}
            <rect
              x="0"
              y="0"
              width="1280"
              height="720"
              fill="#050505"
              mask="url(#heroTypeMask)"
            />
          </svg>
        </div>
      </div>

      {/* Vignette (over the surround, deepens on scrub) */}
      <div
        data-vignette
        className="pointer-events-none absolute inset-0 z-[6] opacity-50"
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

      {/* ============ L2 — UI BLOCK (eyebrow / headline / subhead / CTA) ============ */}
      <div className="absolute inset-x-0 bottom-0 z-[10] px-6 pb-12 md:px-10 md:pb-16">
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

            {/* Real <h1> — visible on mobile, sr-only on desktop (where the
                SVG window carries the same words). Always in the DOM so the
                headline is never blocked by JS and reads if JS fails. */}
            <h1 className="md:sr-only">
              <span className="sr-only">Kein Standard. Kein Zufall.</span>
              <span
                data-h1-mobile
                aria-hidden
                className="font-display block leading-[0.88] tracking-[-0.02em] md:hidden"
                style={{
                  fontSize: "clamp(56px, 16vw, 96px)",
                  textTransform: "uppercase",
                }}
              >
                <span className="block">Kein</span>
                <span className="block">Standard.</span>
                <span className="block">Kein Zufall.</span>
              </span>
            </h1>

            {/* Spacer reserves the headline footprint on desktop, where the
                visible type lives in the full-bleed SVG window above. */}
            <div
              aria-hidden
              className="hidden md:block"
              style={{ height: "clamp(220px, 30vw, 430px)" }}
            />

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
                  fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
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

          {/* Animated scroll cue */}
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

      {/* ============ HANDOFF VEIL ============ */}
      <div
        data-handoff
        className="pointer-events-none absolute inset-0 z-[30] bg-[#050505] opacity-0"
      />
    </section>
  );
}
