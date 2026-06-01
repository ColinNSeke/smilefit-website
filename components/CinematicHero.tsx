"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const HERO_LINES = ["KEIN", "STANDARD.", "KEIN ZUFALL."] as const;
const SCRAMBLE_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ.,!?/-";

/**
 * Decode entrance: each [data-char] scrambles through random glyphs, then
 * locks to its real character (data-final). The reveal ripples left→right via
 * a per-character start delay. Returns a cleanup that clears all timers and
 * restores final text. Whitespace characters are left untouched.
 */
function runScramble(
  scope: HTMLElement,
  opts: { stagger: number; cycles: number; tick: number }
): () => void {
  const chars = Array.from(scope.querySelectorAll<HTMLElement>("[data-char]"));
  const timers: ReturnType<typeof setTimeout>[] = [];
  const intervals: ReturnType<typeof setInterval>[] = [];

  chars.forEach((el, i) => {
    const finalChar = el.dataset.final ?? el.textContent ?? "";
    if (finalChar.trim() === "") return; // skip spaces
    const start = setTimeout(() => {
      let n = 0;
      const id = setInterval(() => {
        if (n >= opts.cycles) {
          clearInterval(id);
          el.textContent = finalChar;
          return;
        }
        el.textContent =
          SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)];
        n++;
      }, opts.tick);
      intervals.push(id);
    }, i * opts.stagger);
    timers.push(start);
  });

  return () => {
    timers.forEach(clearTimeout);
    intervals.forEach(clearInterval);
    chars.forEach((el) => {
      if (el.dataset.final !== undefined) el.textContent = el.dataset.final;
    });
  };
}

const ABERRATION_FILTER =
  "drop-shadow(-3px 0 rgba(255,0,40,0.9)) drop-shadow(3px 0 rgba(0,120,255,0.9))";

/**
 * SmileFit — Multi-scene cinematic hero.
 *
 * Mechanics:
 *  Scene 0 — Impact load: the headline settles (1.06 → 1) with a one-frame
 *    screen shake + grain/vignette pulse; each character decode-scrambles into
 *    place left→right; a one-shot RGB chromatic-aberration split fires on the
 *    impact beat; the neon eyebrow rule draws in; nav/subhead/CTA stagger in.
 *  Scene 1 — Living type: the <h1> uses background-clip:text over a cream→
 *    violet gradient with slowly panning violet "embers", plus a flickering
 *    neon-violet outer glow (CSS). Cream type with purple fire-light inside.
 *  Scene 2 — Flood + handoff: a pinned, scrubbed timeline scales the headline
 *    up and fades it while the footage pushes in and floods the viewport,
 *    clears the UI, then settles to near-black so the (near-black) room
 *    section takes over with no empty frame.
 *
 * Desktop also gets a cursor spotlight and a magnetic CTA. The real <h1> with
 * its actual characters renders server-side (aria-label + SSR text), so the
 * headline is the LCP, never blocked by JS, and reads if JS fails.
 * prefers-reduced-motion: no scramble / aberration / flicker / ember — the
 * final cream-fire state with a calm static glow.
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
          // Final states only — no scramble, no aberration, no shake/scrub.
          // (CSS flicker/ember are disabled via prefers-reduced-motion too.)
          gsap.set("[data-headline]", { opacity: 1, scale: 1 });
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

        // Headline settles with a fast overshoot.
        intro.from(
          "[data-headline]",
          { scale: 1.06, duration: 1.1, ease: "expo.out" },
          0
        );
        // Per-character decode scramble (ripples left→right, ~1s).
        const headlineEl = root.current?.querySelector<HTMLElement>(
          "[data-headline]"
        );
        if (headlineEl) {
          const stop = runScramble(headlineEl, {
            stagger: 30,
            cycles: 25,
            tick: 25,
          });
          cleanups.push(stop);
        }
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
        // Impact chromatic-aberration: one-shot RGB split on the headline that
        // settles clean (~120ms). Inline filter overrides the CSS glow flicker
        // during the beat; clearProps hands control back to the CSS animation.
        intro.set("[data-fire]", { filter: ABERRATION_FILTER }, 0.06);
        intro.set("[data-fire]", { clearProps: "filter" }, 0.18);
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
          // Headline scales up and fades → the footage floods the viewport.
          .to("[data-headline]", { scale: 1.45, opacity: 0, y: -40 }, 0)
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
          "[data-nav], [data-eyebrow], [data-headline], [data-subhead], [data-cta]",
          {
            opacity: 0,
            y: 22,
            duration: 0.8,
            ease: "power3.out",
            stagger: 0.08,
          }
        );
        // Keep the fire fill; shorten the decode scramble, no aberration.
        const headlineEl = root.current?.querySelector<HTMLElement>(
          "[data-headline]"
        );
        if (headlineEl) {
          const stop = runScramble(headlineEl, {
            stagger: 12,
            cycles: 12,
            tick: 22,
          });
          cleanups.push(stop);
        }
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
          style={{ filter: "brightness(1.15) saturate(1.1)" }}
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

      {/* Vignette (over the footage, deepens on scrub) */}
      <div
        data-vignette
        className="pointer-events-none absolute inset-0 z-[7] opacity-50"
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

            {/* Live headline — cream type with violet fire-light inside the
                letters (background-clip:text), per-character decode entrance,
                and an impact chromatic-aberration beat. Real characters render
                server-side (aria-label + SSR text) so the headline is the LCP,
                never blocked by JS, and reads if JS fails. */}
            <h1
              data-headline
              data-fire
              aria-label="Kein Standard. Kein Zufall."
              className="hero-fire-text font-display block leading-[0.9] tracking-[-0.02em]"
              style={{
                fontSize: "clamp(44px, 9vw, 150px)",
                textTransform: "uppercase",
                willChange: "transform, opacity, filter",
              }}
            >
              {HERO_LINES.map((line, li) => (
                <span key={li} aria-hidden className="block whitespace-nowrap">
                  {Array.from(line).map((ch, ci) => (
                    <span
                      key={ci}
                      data-char
                      data-final={ch}
                      className="inline-block"
                    >
                      {ch === " " ? "\u00a0" : ch}
                    </span>
                  ))}
                </span>
              ))}
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
