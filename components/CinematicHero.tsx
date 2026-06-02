"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const HERO_LINES = ["KEIN", "STANDARD.", "KEIN ZUFALL."] as const;
const SCRAMBLE_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ.,!?/-";

// Real SmileFit cinematic hero: central athlete, floating weights, black void,
// holographic rings, premium violet energy. File: public/smilefit-hero-video (1).mp4
const HERO_VIDEO_SRC = "/smilefit-hero-video%20(1).mp4";

function runScramble(
  scope: HTMLElement,
  opts: { stagger: number; cycles: number; tick: number }
): () => void {
  const chars = Array.from(scope.querySelectorAll<HTMLElement>("[data-char]"));
  const timers: ReturnType<typeof setTimeout>[] = [];
  const intervals: ReturnType<typeof setInterval>[] = [];

  chars.forEach((el, i) => {
    const finalChar = el.dataset.final ?? el.textContent ?? "";
    if (finalChar.trim() === "") return;
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

// Piecewise non-linear mapping: scroll progress (0-1) → video time fraction (0-1).
// Phase 0-15%: barely moves (frozen intro reveal)
// Phase 15-35%: activation / energy build
// Phase 35-65%: main unlock / athlete rising
// Phase 65-90%: peak performance
// Phase 90-100%: final hold / open
function scrollToVideoFraction(p: number): number {
  const ramp = (v: number, lo: number, hi: number) =>
    Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
  if (p < 0.15) return ramp(p, 0, 0.15) * 0.04;
  if (p < 0.35) return 0.04 + ramp(p, 0.15, 0.35) * 0.22;
  if (p < 0.65) return 0.26 + ramp(p, 0.35, 0.65) * 0.36;
  if (p < 0.9) return 0.62 + ramp(p, 0.65, 0.9) * 0.26;
  return 0.88 + ramp(p, 0.9, 1.0) * 0.12;
}

export default function CinematicHero() {
  const root = useRef<HTMLElement | null>(null);
  const cta = useRef<HTMLAnchorElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const cleanups: Array<() => void> = [];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---- RAF-based video scrub state ----
    let targetVideoFrac = 0;
    let currentVideoFrac = 0;
    let rafId = 0;
    let videoDuration = 0;

    const video = videoRef.current;
    if (video) {
      video.pause();
      // Capture duration once metadata loads; video may already be loaded.
      const onMeta = () => {
        videoDuration = video.duration || 0;
        if (reduce) {
          // Show mid-point frame for reduced-motion users.
          video.currentTime = videoDuration * 0.45;
        }
      };
      if (video.readyState >= 1) {
        videoDuration = video.duration || 0;
      } else {
        video.addEventListener("loadedmetadata", onMeta);
        cleanups.push(() => video.removeEventListener("loadedmetadata", onMeta));
      }

      const tick = () => {
        // Lerp toward target — smooth 12% per frame (~0.2s lag at 60fps).
        currentVideoFrac += (targetVideoFrac - currentVideoFrac) * 0.12;
        if (videoDuration > 0) {
          const t = currentVideoFrac * videoDuration;
          if (Math.abs(video.currentTime - t) > 0.015) {
            video.currentTime = t;
          }
        }
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
      cleanups.push(() => cancelAnimationFrame(rafId));
    }

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // ===================== DESKTOP =====================
      mm.add("(min-width: 768px)", () => {
        const hover = window.matchMedia("(hover: hover)").matches;

        if (reduce) {
          gsap.set("[data-letterbox]", { clipPath: "inset(0% 0%)" });
          gsap.set("[data-headline]", { opacity: 1, scale: 1 });
          gsap.set("[data-eyebrow-rule]", { scaleX: 1 });
          gsap.set(
            "[data-nav], [data-eyebrow-text], [data-subhead], [data-cta], [data-scrollcue]",
            { opacity: 1, y: 0, x: 0 }
          );
          return;
        }

        // -------- Scene 0: impact load inside letterbox --------
        gsap.set("[data-letterbox]", {
          clipPath: "inset(12% 18% round 0px)",
        });

        const intro = gsap.timeline({
          defaults: { ease: "power4.out" },
          delay: 0.12,
        });

        intro.from(
          "[data-headline]",
          { scale: 1.06, duration: 1.1, ease: "expo.out" },
          0
        );
        const headlineEl = root.current?.querySelector<HTMLElement>("[data-headline]");
        if (headlineEl) {
          const stop = runScramble(headlineEl, { stagger: 30, cycles: 25, tick: 25 });
          cleanups.push(stop);
        }
        intro.to(
          root.current,
          { keyframes: { x: [0, -4, 4, -3, 2, 0] }, duration: 0.34, ease: "none" },
          0.06
        );
        intro.set("[data-fire]", { filter: ABERRATION_FILTER }, 0.06);
        intro.set("[data-fire]", { clearProps: "filter" }, 0.18);
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
        intro.from("[data-nav]", { y: -16, opacity: 0, duration: 0.8, stagger: 0.05 }, 0.15);
        intro.from("[data-eyebrow-rule]", { scaleX: 0, duration: 0.7, ease: "expo.out" }, 0.25);
        intro.from("[data-eyebrow-text]", { opacity: 0, x: -8, duration: 0.6 }, 0.45);
        intro.from("[data-subhead]", { opacity: 0, y: 14, duration: 0.7 }, 0.7);
        intro.from("[data-cta]", { opacity: 0, y: 12, duration: 0.7 }, 0.82);
        intro.from("[data-scrollcue]", { opacity: 0, duration: 0.6 }, 0.95);

        // -------- Scene 2: scroll-scrubbed flood + handoff --------
        // This ScrollTrigger drives both the GSAP CSS values and the video
        // currentTime via the onUpdate callback (RAF smoothing applied above).
        const morph = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "+=140%",
            pin: true,
            scrub: 0.8,
            anticipatePin: 1,
            onUpdate: (self) => {
              // Feed scroll progress into the video scrub pipeline.
              targetVideoFrac = scrollToVideoFraction(self.progress);
            },
          },
        });

        morph
          .to(
            "[data-letterbox]",
            { clipPath: "inset(0% 0% round 0px)", duration: 0.55, ease: "power2.inOut" },
            0
          )
          .to("[data-bg]", { scale: 1.16 }, 0)
          .to("[data-headline]", { scale: 1.45, opacity: 0, y: -40 }, 0.1)
          .to("[data-eyebrow]", { opacity: 0, y: -10 }, 0.25)
          .to("[data-subhead]", { opacity: 0, y: -10 }, 0.3)
          .to("[data-cta]", { opacity: 0, y: -10 }, 0.25)
          .to("[data-scrollcue]", { opacity: 0 }, 0.12)
          .to("[data-vignette]", { opacity: 0.85 }, 0.45)
          // Violet floor-ring glow rises as video reaches peak energy.
          .fromTo(
            "[data-floorglow]",
            { opacity: 0, scaleX: 0.6 },
            { opacity: 1, scaleX: 1, duration: 0.3, ease: "power2.out" },
            0.5
          )
          .to("[data-floorglow]", { opacity: 0, duration: 0.2 }, 0.78)
          .to("[data-handoff]", { opacity: 1 }, 0.82);

        // -------- Cursor spotlight --------
        if (hover && root.current) {
          const rootEl = root.current;
          const qX = gsap.quickTo("[data-cursorlight]", "x", { duration: 0.5, ease: "power3.out" });
          const qY = gsap.quickTo("[data-cursorlight]", "y", { duration: 0.5, ease: "power3.out" });
          gsap.set("[data-cursorlight]", { opacity: 0 });
          const onMove = (e: MouseEvent) => {
            const rect = rootEl.getBoundingClientRect();
            qX(e.clientX - rect.left);
            qY(e.clientY - rect.top);
            gsap.to("[data-cursorlight]", { opacity: 1, duration: 0.4, overwrite: "auto" });
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
          const qX = gsap.quickTo(btn, "x", { duration: 0.35, ease: "power3.out" });
          const qY = gsap.quickTo(btn, "y", { duration: 0.35, ease: "power3.out" });
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
          cleanups.push(() => window.removeEventListener("mousemove", onCtaMove));
        }
      });

      // ===================== MOBILE =====================
      // Mobile: let video autoplay (no scrub) — simpler reveal.
      mm.add("(max-width: 767px)", () => {
        if (video) {
          // On mobile, autoplay so there's always motion.
          video.loop = true;
          video.play().catch(() => {/* autoplay blocked — static poster is fine */});
        }
        if (reduce) return;
        gsap.from(
          "[data-nav], [data-eyebrow], [data-headline], [data-subhead], [data-cta]",
          { opacity: 0, y: 22, duration: 0.8, ease: "power3.out", stagger: 0.08 }
        );
        const headlineEl = root.current?.querySelector<HTMLElement>("[data-headline]");
        if (headlineEl) {
          const stop = runScramble(headlineEl, { stagger: 12, cycles: 12, tick: 22 });
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
          ref={videoRef}
          src={HERO_VIDEO_SRC}
          poster="/hero/poster.jpg"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: "brightness(1.15) saturate(1.1)" }}
          muted
          playsInline
          preload="auto"
        />
        {/* Violet wash */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 80% at 18% 12%, rgba(124,108,255,0.12), transparent 55%)",
          }}
        />
      </div>

      {/* Floor ring glow — appears during video peak energy phase */}
      <div
        data-floorglow
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] opacity-0"
        style={{
          height: "38%",
          background:
            "radial-gradient(ellipse 80% 40% at 50% 100%, rgba(122,76,255,0.38) 0%, transparent 70%)",
          willChange: "transform, opacity",
        }}
      />

      {/* Cursor spotlight */}
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

      {/* Vignette */}
      <div
        data-vignette
        className="pointer-events-none absolute inset-0 z-[7] opacity-50"
        style={{
          background:
            "radial-gradient(130% 90% at 50% 50%, transparent 30%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.92) 100%)",
        }}
      />

      {/* ============ LETTERBOX WINDOW ============ */}
      <div
        data-letterbox
        className="absolute inset-0 z-[8]"
        style={{ willChange: "clip-path" }}
      >
        {/* NAV */}
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
            style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontWeight: 500 }}
          >
            <a href="#training" className="hover:opacity-60">Training</a>
            <a href="#raume" className="hover:opacity-60">Räume</a>
            <a href="#mitgliedschaft" className="hover:opacity-60">Mitgliedschaft</a>
            <a href="#kontakt" className="hover:opacity-60">Kontakt</a>
          </nav>
          <a
            href="#kontakt"
            data-nav
            className="text-[12px] uppercase tracking-[0.06em] md:hidden"
            style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontWeight: 500 }}
          >
            Menu
          </a>
        </header>

        {/* UI BLOCK */}
        <div className="absolute inset-x-0 bottom-0 z-[10] px-6 pb-12 md:px-10 md:pb-16">
          <div className="flex items-end justify-between gap-10">
            <div className="max-w-[820px]">
              {/* Eyebrow */}
              <div data-eyebrow className="mb-6 flex items-center gap-3">
                <span
                  data-eyebrow-rule
                  className="block h-px w-12 bg-[#7a4cff]"
                  style={{ transformOrigin: "left center" }}
                />
                <span
                  data-eyebrow-text
                  className="text-[11px] uppercase tracking-[0.32em] text-[#7a4cff]"
                  style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontWeight: 600 }}
                >
                  Built Different.
                </span>
              </div>

              {/* Headline */}
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
                      <span key={ci} data-char data-final={ch} className="inline-block">
                        {ch === " " ? " " : ch}
                      </span>
                    ))}
                  </span>
                ))}
              </h1>

              <p
                data-subhead
                className="mt-7 max-w-[380px] text-[13px] leading-[1.55] text-[#f2efe6]/75"
                style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontWeight: 400 }}
              >
                Premium Training. Maschinen. Atmosphäre. Fokus.
              </p>

              <div data-cta className="mt-7">
                <a
                  ref={cta}
                  href="#kontakt"
                  className="group relative inline-flex items-center gap-3 overflow-hidden border border-[#f2efe6]/85 px-5 py-3 text-[11px] uppercase tracking-[0.22em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a4cff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
                  style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontWeight: 600, willChange: "transform" }}
                >
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

            {/* Scroll cue */}
            <div
              data-scrollcue
              className="hidden flex-col items-end gap-3 text-[#f2efe6]/70 md:flex"
              style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontWeight: 500 }}
            >
              <span className="text-[11px] uppercase tracking-[0.28em]">Scroll</span>
              <span className="relative block h-14 w-px overflow-hidden bg-[#f2efe6]/15">
                <span className="animate-scroll-cue absolute inset-x-0 top-0 h-1/3 bg-[#f2efe6]" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* HANDOFF VEIL */}
      <div
        data-handoff
        className="pointer-events-none absolute inset-0 z-[30] bg-[#050505] opacity-0"
      />
    </section>
  );
}
