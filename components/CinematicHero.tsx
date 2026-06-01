"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type PanelDef = {
  key: "primary" | "two" | "three";
  src: string;
  video?: boolean;
  className: string;
  fallback: string;
  initial: gsap.TweenVars;
};

const PANELS: PanelDef[] = [
  {
    key: "primary",
    src: "/media/hero-a.mp4",
    video: true,
    className:
      "right-[6%] top-[10%] h-[64vh] w-[78vw] md:right-[12%] md:top-[12%] md:h-[72vh] md:w-[44vw]",
    fallback:
      "linear-gradient(140deg, #15171c 0%, #232732 40%, #3a3f4d 65%, #14161b 100%)",
    initial: {
      rotateY: -2,
      rotateX: 1,
      scale: 1.04,
      transformPerspective: 1600,
      transformOrigin: "60% 50%",
    },
  },
  {
    key: "two",
    src: "/media/gym-02.jpg",
    className:
      "left-[4%] bottom-[18%] h-[34vh] w-[60vw] md:left-[6%] md:bottom-[16%] md:h-[42vh] md:w-[26vw]",
    fallback:
      "linear-gradient(165deg, #1d2622 0%, #2c3a32 50%, #121814 100%)",
    initial: {
      yPercent: 22,
      xPercent: -6,
      opacity: 0,
      rotateZ: -3,
      rotateY: 6,
      transformPerspective: 1600,
      transformOrigin: "50% 100%",
    },
  },
  {
    key: "three",
    src: "/media/hero-b.mp4",
    video: true,
    className:
      "right-[2%] top-[20%] h-[34vh] w-[44vw] md:right-[2%] md:top-[18%] md:h-[40vh] md:w-[22vw]",
    fallback:
      "linear-gradient(150deg, #2a1e26 0%, #3f2933 50%, #1a1217 100%)",
    initial: {
      yPercent: -14,
      xPercent: 30,
      opacity: 0,
      rotateZ: 2,
      rotateY: -6,
      transformPerspective: 1600,
      transformOrigin: "50% 0%",
    },
  },
];

function Panel({ panel }: { panel: PanelDef }) {
  return (
    <div
      data-panel={panel.key}
      className={`absolute overflow-hidden ${panel.className}`}
      style={{
        willChange: "transform",
        boxShadow:
          "0 40px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset",
        transformStyle: "preserve-3d",
      }}
    >
      {/* permanent fallback base — visible until real media loads */}
      <div
        className="absolute inset-0"
        style={{ background: panel.fallback }}
      />
      <div
        className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-60"
        style={{
          background:
            "radial-gradient(70% 60% at 35% 25%, rgba(255,255,255,0.18), transparent 60%), radial-gradient(80% 70% at 70% 80%, rgba(0,0,0,0.55), transparent 65%)",
        }}
      />

      {/* media layer on top */}
      {panel.video ? (
        <video
          src={panel.src}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          autoPlay
          loop
          playsInline
          preload="metadata"
        />
      ) : (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${panel.src})` }}
        />
      )}

      {/* subtle inner gradient for cinematic edge */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.35) 100%)",
        }}
      />
    </div>
  );
}

export default function CinematicHero() {
  const root = useRef<HTMLElement | null>(null);
  const stage = useRef<HTMLDivElement | null>(null);
  const cta = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const cleanups: Array<() => void> = [];

    const ctx = gsap.context(() => {
      // Initialize panels at their pre-entrance state
      PANELS.forEach((p) => {
        gsap.set(`[data-panel='${p.key}']`, p.initial);
      });

      // INTRO TIMELINE — fires once on load
      const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
      intro
        .from(
          "[data-bg]",
          { opacity: 0, scale: 1.12, duration: 1.6, ease: "expo.out" },
          0
        )
        .from(
          "[data-panel='primary']",
          { opacity: 0, duration: 1.4, ease: "expo.out" },
          0.15
        )
        .from(
          "[data-nav]",
          {
            y: -14,
            opacity: 0,
            duration: 0.9,
            stagger: 0.04,
            ease: "power3.out",
          },
          0.2
        )
        .from(
          "[data-meta]",
          {
            opacity: 0,
            y: 12,
            duration: 0.7,
            stagger: 0.05,
            ease: "power3.out",
          },
          0.5
        )
        .from(
          "[data-line]",
          { yPercent: 110, duration: 1.0, stagger: 0.08 },
          0.4
        )
        .to(
          "[data-panel='two']",
          {
            opacity: 1,
            yPercent: 0,
            xPercent: 0,
            rotateZ: -1.5,
            rotateY: 0,
            duration: 1.4,
            ease: "expo.out",
          },
          0.8
        )
        .to(
          "[data-panel='three']",
          {
            opacity: 1,
            yPercent: 0,
            xPercent: 0,
            rotateZ: 1,
            rotateY: 0,
            duration: 1.4,
            ease: "expo.out",
          },
          0.95
        );

      // SCRUBBED SCROLL TIMELINE
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.8,
        },
      });

      // Phase 1: subtle camera move (0 → 0.4)
      tl.to(
        "[data-bg]",
        { scale: 1.18, yPercent: -4, ease: "none" },
        0
      )
        .to(
          "[data-vignette]",
          { opacity: 0.85, ease: "none" },
          0
        )
        .to(
          "[data-panel='primary']",
          {
            scale: 0.86,
            rotateY: -10,
            rotateX: 3,
            xPercent: -14,
            yPercent: -4,
            ease: "none",
          },
          0
        )
        .to(
          "[data-panel='two']",
          {
            xPercent: 16,
            yPercent: -18,
            rotateZ: 0,
            scale: 1.04,
            ease: "none",
          },
          0
        )
        .to(
          "[data-panel='three']",
          {
            xPercent: -22,
            yPercent: 10,
            rotateZ: -1,
            scale: 1.06,
            ease: "none",
          },
          0
        );

      // Phase 2: BUILT DIFFERENT enters and headline lifts away (0.35 → 0.7)
      tl.fromTo(
        "[data-built]",
        { opacity: 0, yPercent: 30 },
        { opacity: 1, yPercent: 0, ease: "none", duration: 0.3 },
        0.35
      )
        .to(
          "[data-headline]",
          { yPercent: -30, opacity: 0.35, ease: "none", duration: 0.35 },
          0.35
        )
        .to(
          "[data-meta-bottom]",
          { opacity: 0, ease: "none", duration: 0.2 },
          0.35
        );

      // Phase 3: panels break apart and slide toward exit (0.7 → 1)
      tl.to(
        "[data-panel='primary']",
        {
          scale: 0.62,
          rotateY: -14,
          xPercent: 8,
          yPercent: -28,
          ease: "none",
        },
        0.7
      )
        .to(
          "[data-panel='two']",
          { xPercent: -28, yPercent: 32, rotateZ: -4, ease: "none" },
          0.7
        )
        .to(
          "[data-panel='three']",
          { xPercent: 30, yPercent: -34, rotateZ: 4, ease: "none" },
          0.7
        )
        .to(
          "[data-built]",
          { opacity: 0, yPercent: -20, ease: "none", duration: 0.25 },
          0.78
        )
        .to(
          "[data-stage-fade]",
          { opacity: 1, ease: "none", duration: 0.25 },
          0.78
        );

      // MOUSE PARALLAX (desktop only)
      const mq = window.matchMedia("(min-width: 768px) and (hover: hover)");
      if (mq.matches && stage.current) {
        const stageEl = stage.current;
        const qPrimary = gsap.quickTo("[data-panel='primary']", "x", {
          duration: 0.9,
          ease: "power3.out",
        });
        const qPrimaryY = gsap.quickTo("[data-panel='primary']", "y", {
          duration: 0.9,
          ease: "power3.out",
        });
        const qTwoX = gsap.quickTo("[data-panel='two']", "x", {
          duration: 1.0,
          ease: "power3.out",
        });
        const qTwoY = gsap.quickTo("[data-panel='two']", "y", {
          duration: 1.0,
          ease: "power3.out",
        });
        const qThreeX = gsap.quickTo("[data-panel='three']", "x", {
          duration: 1.1,
          ease: "power3.out",
        });
        const qThreeY = gsap.quickTo("[data-panel='three']", "y", {
          duration: 1.1,
          ease: "power3.out",
        });
        const qBgX = gsap.quickTo("[data-bg]", "x", {
          duration: 1.3,
          ease: "power3.out",
        });
        const qBgY = gsap.quickTo("[data-bg]", "y", {
          duration: 1.3,
          ease: "power3.out",
        });

        const onMove = (e: MouseEvent) => {
          const rect = stageEl.getBoundingClientRect();
          const mx = (e.clientX - rect.left) / rect.width - 0.5;
          const my = (e.clientY - rect.top) / rect.height - 0.5;
          qPrimary(mx * 18);
          qPrimaryY(my * 14);
          qTwoX(mx * 26);
          qTwoY(my * 20);
          qThreeX(mx * -22);
          qThreeY(my * -16);
          qBgX(mx * -12);
          qBgY(my * -10);
        };
        window.addEventListener("mousemove", onMove);
        cleanups.push(() =>
          window.removeEventListener("mousemove", onMove)
        );
      }

      // MAGNETIC CTA (desktop only)
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
      style={{ height: "240vh" }}
    >
      <div
        ref={stage}
        className="sticky top-0 h-screen w-full overflow-hidden"
        style={{ perspective: "1600px" }}
      >
        {/* BACKGROUND VIDEO */}
        <div
          data-bg
          className="absolute inset-0"
          style={{ willChange: "transform" }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, #0a0a0a 0%, #131318 40%, #0a0a0a 100%)",
            }}
          />
          <video
            src="/media/hero-a.mp4"
            className="absolute inset-0 h-full w-full object-cover opacity-70"
            muted
            autoPlay
            loop
            playsInline
            preload="metadata"
          />
          {/* tint */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 80% at 30% 20%, rgba(122,76,255,0.10), transparent 55%), radial-gradient(100% 80% at 80% 90%, rgba(216,58,42,0.06), transparent 60%)",
            }}
          />
        </div>

        {/* GRAIN */}
        <div
          className="pointer-events-none absolute inset-0 z-[1] opacity-[0.10] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>\")",
            backgroundSize: "180px 180px",
          }}
        />

        {/* VIGNETTE */}
        <div
          data-vignette
          className="pointer-events-none absolute inset-0 z-[1] opacity-50"
          style={{
            background:
              "radial-gradient(130% 90% at 50% 50%, transparent 25%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.92) 100%)",
          }}
        />

        {/* MEDIA PANEL STACK */}
        <div
          className="absolute inset-0 z-[5]"
          style={{
            transformStyle: "preserve-3d",
            perspective: "1600px",
          }}
        >
          {PANELS.map((p) => (
            <Panel key={p.key} panel={p} />
          ))}
        </div>

        {/* BUILT DIFFERENT — sits between panels and text, fades in mid-scroll */}
        <div
          data-built
          className="pointer-events-none absolute inset-0 z-[8] flex items-center justify-center px-6 opacity-0"
        >
          <h2
            className="font-display text-stroke text-center"
            style={{
              fontSize: "clamp(80px, 16vw, 320px)",
              letterSpacing: "-0.05em",
              lineHeight: 0.82,
            }}
          >
            BUILT
            <br />
            DIFFERENT.
          </h2>
        </div>

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

        {/* TOP META */}
        <div
          data-meta
          className="absolute left-6 top-24 z-20 hidden text-[11px] uppercase tracking-[0.2em] text-[#f2efe6]/55 md:block md:left-10"
          style={{
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            fontWeight: 500,
          }}
        >
          01 / SMILEFIT
          <br />
          PREMIUM TRAINING CLUB
        </div>
        <div
          data-meta
          className="absolute right-6 top-24 z-20 hidden text-right text-[11px] uppercase tracking-[0.2em] text-[#f2efe6]/55 md:block md:right-10"
          style={{
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            fontWeight: 500,
          }}
        >
          STUTTGART AREA
          <br />
          EST. 2026
        </div>

        {/* HEADLINE BLOCK */}
        <div
          data-headline
          className="absolute inset-x-0 bottom-0 z-[20] px-6 pb-10 md:px-10 md:pb-14"
        >
          <div className="flex items-end justify-between gap-10">
            <div className="max-w-[820px]">
              <span
                data-meta
                className="block text-[11px] uppercase tracking-[0.22em] text-[#f2efe6]/60"
                style={{
                  fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                  fontWeight: 500,
                }}
              >
                ↘ NO SOFT REPS
              </span>
              <h1
                className="font-display mt-5 leading-[0.86] tracking-[-0.045em]"
                style={{
                  fontSize: "clamp(56px, 9.5vw, 176px)",
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
                data-meta
                className="mt-6 max-w-[420px] text-[13px] leading-[1.55] text-[#f2efe6]/75"
                style={{
                  fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                  fontWeight: 400,
                  textTransform: "none",
                  letterSpacing: 0,
                }}
              >
                Premium Training. Maschinen, Atmosphäre und Fokus auf einem
                anderen Level.
              </p>
              <div data-meta className="mt-7 flex flex-wrap items-center gap-6">
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
                <a
                  href="#training"
                  className="group relative text-[11px] uppercase tracking-[0.22em] text-[#f2efe6]/80 hover:text-[#f2efe6]"
                  style={{
                    fontFamily:
                      "Helvetica Neue, Helvetica, Arial, sans-serif",
                    fontWeight: 600,
                  }}
                >
                  <span>Gym entdecken</span>
                  <span
                    aria-hidden
                    className="absolute -bottom-1 left-0 h-px w-0 bg-current transition-[width] duration-500 ease-out group-hover:w-full"
                  />
                </a>
              </div>
            </div>

            {/* SCROLL CUE */}
            <div
              data-meta-bottom
              className="hidden flex-col items-end gap-3 text-[#f2efe6]/70 md:flex"
              style={{
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontWeight: 500,
              }}
            >
              <span className="text-[11px] uppercase tracking-[0.22em]">
                Scroll down
              </span>
              <span className="relative block h-12 w-px bg-[#f2efe6]/30">
                <span className="absolute inset-x-0 top-0 h-1/3 bg-[#f2efe6]" />
              </span>
            </div>
          </div>
        </div>

        {/* STAGE FADE — invisible until end of scroll, blends into next section */}
        <div
          data-stage-fade
          className="pointer-events-none absolute inset-0 z-[15] bg-[#050505] opacity-0"
        />
      </div>
    </section>
  );
}
