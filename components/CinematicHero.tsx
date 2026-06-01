"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function CinematicHero() {
  const root = useRef<HTMLElement | null>(null);
  const stage = useRef<HTMLDivElement | null>(null);
  const cta = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const cleanups: Array<() => void> = [];

    const ctx = gsap.context(() => {
      // INTRO — one calm cinematic reveal
      const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
      intro
        .from(
          "[data-bg]",
          { opacity: 0, scale: 1.12, duration: 1.8, ease: "expo.out" },
          0
        )
        .from(
          "[data-nav]",
          {
            y: -14,
            opacity: 0,
            duration: 0.9,
            stagger: 0.05,
            ease: "power3.out",
          },
          0.3
        )
        .from(
          "[data-line]",
          { yPercent: 110, duration: 1.1, stagger: 0.08 },
          0.5
        )
        .from(
          "[data-fade]",
          {
            opacity: 0,
            y: 12,
            duration: 0.9,
            stagger: 0.06,
            ease: "power3.out",
          },
          0.8
        );

      // SCRUBBED SCROLL TIMELINE — slow, restrained, premium
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.8,
        },
      });

      tl.to("[data-bg]", { scale: 1.06, yPercent: -8, ease: "none" }, 0)
        .to("[data-vignette]", { opacity: 1, ease: "none" }, 0)
        .to("[data-dim]", { opacity: 0.55, ease: "none" }, 0)
        .to(
          "[data-headline]",
          { yPercent: -16, opacity: 0.85, ease: "none" },
          0
        )
        // exit fade — blends into the next black section
        .to(
          "[data-headline]",
          { opacity: 0, yPercent: -50, ease: "none" },
          0.6
        )
        .to("[data-bg]", { scale: 1.0, opacity: 0.4, ease: "none" }, 0.6)
        .to("[data-stage-fade]", { opacity: 1, ease: "none" }, 0.75);

      // Subtle mouse parallax on bg only (desktop)
      const mq = window.matchMedia("(min-width: 768px) and (hover: hover)");
      if (mq.matches && stage.current) {
        const stageEl = stage.current;
        const qX = gsap.quickTo("[data-bg]", "x", {
          duration: 1.4,
          ease: "power3.out",
        });
        const qY = gsap.quickTo("[data-bg]", "y", {
          duration: 1.4,
          ease: "power3.out",
        });
        const onMove = (e: MouseEvent) => {
          const rect = stageEl.getBoundingClientRect();
          const mx = (e.clientX - rect.left) / rect.width - 0.5;
          const my = (e.clientY - rect.top) / rect.height - 0.5;
          qX(mx * -18);
          qY(my * -14);
        };
        window.addEventListener("mousemove", onMove);
        cleanups.push(() => window.removeEventListener("mousemove", onMove));
      }

      // Magnetic CTA
      if (mq.matches && cta.current) {
        const btn = cta.current;
        const qX = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3.out" });
        const qY = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3.out" });
        const onCtaMove = (e: MouseEvent) => {
          const rect = btn.getBoundingClientRect();
          const x = e.clientX - (rect.left + rect.width / 2);
          const y = e.clientY - (rect.top + rect.height / 2);
          const dist = Math.hypot(x, y);
          const max = 120;
          if (dist < max) {
            const f = 1 - dist / max;
            qX(x * 0.35 * f);
            qY(y * 0.35 * f);
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
      className="relative w-full bg-[#050505] text-[#f2efe6]"
      style={{ height: "200vh" }}
    >
      <div
        ref={stage}
        className="sticky top-0 h-screen w-full overflow-hidden"
      >
        {/* DOMINANT HERO VIDEO — single, full bleed */}
        <div
          data-bg
          className="absolute inset-0"
          style={{ willChange: "transform" }}
        >
          <div
            className="absolute inset-0"
            style={{ background: "#0a0a0a" }}
          />
          <video
            src="/media/hero-a.mp4"
            className="absolute inset-0 h-full w-full object-cover"
            muted
            autoPlay
            loop
            playsInline
            preload="auto"
          />
        </div>

        {/* Dark scrim — pushes the video into the cinematic register */}
        <div
          data-dim
          className="pointer-events-none absolute inset-0 z-[1] opacity-35"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 30%, rgba(0,0,0,0.25) 65%, rgba(0,0,0,0.85) 100%)",
          }}
        />

        {/* Subtle violet ambient tint */}
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              "radial-gradient(120% 80% at 25% 15%, rgba(122,76,255,0.10), transparent 55%)",
          }}
        />

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
          data-vignette
          className="pointer-events-none absolute inset-0 z-[2] opacity-50"
          style={{
            background:
              "radial-gradient(130% 90% at 50% 50%, transparent 30%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.92) 100%)",
          }}
        />

        {/* NAV */}
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

        {/* HEADLINE BLOCK — bottom-left, tighter and smaller */}
        <div
          data-headline
          className="absolute inset-x-0 bottom-0 z-[20] px-6 pb-12 md:px-10 md:pb-16"
        >
          <div className="flex items-end justify-between gap-10">
            <div className="max-w-[640px]">
              <span
                data-fade
                className="block text-[11px] uppercase tracking-[0.28em] text-[#f2efe6]/55"
                style={{
                  fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                  fontWeight: 600,
                }}
              >
                Built Different.
              </span>

              <h1
                className="font-display mt-5 leading-[0.9] tracking-[-0.04em]"
                style={{
                  fontSize: "clamp(44px, 6vw, 104px)",
                  textTransform: "uppercase",
                }}
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
                data-fade
                className="mt-5 max-w-[360px] text-[13px] leading-[1.55] text-[#f2efe6]/75"
                style={{
                  fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                  fontWeight: 400,
                  textTransform: "none",
                  letterSpacing: 0,
                }}
              >
                Premium Training. Maschinen. Atmosphäre. Fokus.
              </p>

              <div data-fade className="mt-7">
                <a
                  ref={cta}
                  href="#kontakt"
                  className="group inline-flex items-center gap-3 border border-[#f2efe6]/85 px-5 py-3 text-[11px] uppercase tracking-[0.22em] transition-colors hover:bg-[#f2efe6] hover:text-[#050505]"
                  style={{
                    fontFamily:
                      "Helvetica Neue, Helvetica, Arial, sans-serif",
                    fontWeight: 600,
                    willChange: "transform",
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
            </div>

            <div
              data-fade
              className="hidden flex-col items-end gap-3 text-[#f2efe6]/70 md:flex"
              style={{
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontWeight: 500,
              }}
            >
              <span className="text-[11px] uppercase tracking-[0.28em]">
                Scroll
              </span>
              <span className="relative block h-12 w-px bg-[#f2efe6]/30">
                <span className="absolute inset-x-0 top-0 h-1/3 bg-[#f2efe6]" />
              </span>
            </div>
          </div>
        </div>

        {/* Exit fade into next section */}
        <div
          data-stage-fade
          className="pointer-events-none absolute inset-0 z-[25] bg-[#050505] opacity-0"
        />
      </div>
    </section>
  );
}
