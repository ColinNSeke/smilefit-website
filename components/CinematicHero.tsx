"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HeroThreeOverlay, { type HeroOverlayHandle } from "./HeroThreeOverlay";

const HERO_VIDEO_SRC = "/smilefit-hero-video%20(1).mp4";

// Video scroll map — kept for future use, currently hidden.
function scrollToVideoFraction(p: number): number {
  const ramp = (v: number, lo: number, hi: number) =>
    Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
  if (p < 0.15) return ramp(p, 0, 0.15) * 0.04;
  if (p < 0.35) return 0.04 + ramp(p, 0.15, 0.35) * 0.24;
  if (p < 0.65) return 0.28 + ramp(p, 0.35, 0.65) * 0.44;
  if (p < 0.9) return 0.72 + ramp(p, 0.65, 0.9) * 0.23;
  return 0.95 + ramp(p, 0.9, 1.0) * 0.05;
}

const TABS = ["PROBETRAINING", "MITGLIEDSCHAFT", "TRAINING", "WELLNESS"] as const;

export default function CinematicHero() {
  const root = useRef<HTMLElement | null>(null);
  const cta = useRef<HTMLAnchorElement | null>(null);
  const overlay = useRef<HeroOverlayHandle | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const cleanups: Array<() => void> = [];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // RAF video scrub (video stays hidden; logic kept for potential future reveal)
    let targetVideoFrac = 0;
    let currentVideoFrac = 0;
    let rafId = 0;
    let videoDuration = 0;

    const video = videoRef.current;
    if (video) {
      video.pause();
      const onMeta = () => { videoDuration = video.duration || 0; };
      if (video.readyState >= 1) videoDuration = video.duration || 0;
      else {
        video.addEventListener("loadedmetadata", onMeta);
        cleanups.push(() => video.removeEventListener("loadedmetadata", onMeta));
      }
      const tick = () => {
        currentVideoFrac += (targetVideoFrac - currentVideoFrac) * 0.18;
        if (videoDuration > 0) {
          const t = currentVideoFrac * videoDuration;
          if (Math.abs(video.currentTime - t) > 0.01) video.currentTime = t;
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
          gsap.set(
            "[data-nav], [data-brand], [data-eyebrow], [data-headline], [data-line], [data-statement], [data-cta], [data-tabs], [data-scrollcue]",
            { opacity: 1, y: 0, clipPath: "inset(0% 0%)" }
          );
          return;
        }

        gsap.set("[data-letterbox]", { clipPath: "inset(6% 8% round 0px)" });
        gsap.set("[data-line]", { clipPath: "inset(0% 0% 100% 0%)" });

        // ---- Intro reveal sequence ----
        const intro = gsap.timeline({ defaults: { ease: "power3.out" }, delay: 0.1 });
        intro
          .to("[data-letterbox]", { clipPath: "inset(0% 0% round 0px)", duration: 1.4, ease: "power3.inOut" }, 0.05)
          // 1. Nav + top-left brand
          .from("[data-nav]", { y: -12, opacity: 0, duration: 0.9, stagger: 0.07 }, 0)
          // 2. Eyebrow
          .from("[data-eyebrow]", { y: 10, opacity: 0, duration: 0.9 }, 0.45)
          // 3. SmileFit main title — soft fade + slight rise
          .from("[data-headline]", { y: 20, opacity: 0, filter: "blur(10px)", duration: 1.1, ease: "expo.out" }, 0.75)
          .set("[data-headline]", { clearProps: "filter" })
          // 4. Editorial lines — masked line-by-line reveal
          .to(
            "[data-line]",
            { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "expo.out", stagger: 0.17 },
            1.1
          )
          .from(
            "[data-line]",
            { yPercent: 110, filter: "blur(10px)", duration: 1.2, ease: "expo.out", stagger: 0.17 },
            1.1
          )
          .set("[data-line]", { clearProps: "filter" })
          // 5. Lower-left statement — upward with blur-to-sharp
          .from("[data-statement]", { y: 16, opacity: 0, filter: "blur(6px)", duration: 0.9 }, 1.7)
          .set("[data-statement]", { clearProps: "filter" })
          // 6. CTAs + bottom tabs
          .from("[data-cta] > *", { y: 12, opacity: 0, duration: 0.8, stagger: 0.1 }, 1.85)
          .from("[data-tab]", { y: 8, opacity: 0, duration: 0.6, stagger: 0.055 }, 1.9)
          .from("[data-scrollcue]", { opacity: 0, duration: 0.7 }, 2.1)
          // Floor glow breathes in
          .fromTo("[data-floorglow]", { opacity: 0 }, { opacity: 0.3, duration: 1.4 }, 0.5);

        // ---- Scroll-driven activation ----
        const morph = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "+=170%",
            pin: true,
            scrub: 0.5,
            anticipatePin: 1,
            onUpdate: (self) => {
              const p = self.progress;
              targetVideoFrac = scrollToVideoFraction(p);
              overlay.current?.setProgress(p);
              // Scan sweep during 0.15–0.35
              const sw = (p - 0.15) / 0.2;
              if (sw >= 0 && sw <= 1) {
                gsap.set("[data-scanwave]", {
                  yPercent: sw * 620 - 110,
                  opacity: Math.sin(sw * Math.PI) * 0.65,
                });
              } else {
                gsap.set("[data-scanwave]", { opacity: 0 });
              }
            },
          },
        });

        morph
          // Subtle scale push
          .to("[data-bg]", { scale: 1.08 }, 0)
          // Floor glow rises
          .to("[data-floorglow]", { opacity: 0.52 }, 0.15)
          .to("[data-floorglow]", { opacity: 0.78 }, 0.55)
          // Particles lift
          .to("[data-particles]", { opacity: 0.75 }, 0.3)
          // Typography clears later so it coexists longer with the motion
          .to("[data-eyebrow]", { opacity: 0, y: -6 }, 0.35)
          .to("[data-headline]", { opacity: 0, y: -18, scale: 1.03 }, 0.38)
          .to("[data-lines]", { opacity: 0, y: -14 }, 0.40)
          .to("[data-statement]", { opacity: 0, y: 10 }, 0.40)
          .to("[data-cta]", { opacity: 0, y: -8 }, 0.42)
          .to("[data-brand]", { opacity: 0, y: -8 }, 0.38)
          .to("[data-tabs]", { opacity: 0, y: 6 }, 0.36)
          .to("[data-scrollcue]", { opacity: 0 }, 0.14)
          // Vignette deepens at peak
          .to("[data-vignette]", { opacity: 0.75 }, 0.72)
          // Floor glow holds longer before fading
          .to("[data-floorglow]", { opacity: 0.3 }, 0.88)
          .to("[data-floorglow]", { opacity: 0 }, 0.96)
          // Handoff veil — starts later, doesn't go fully black too early
          .to("[data-handoff]", { opacity: 1 }, 0.94);

        // Cursor spotlight
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
          const onLeave = () => gsap.to("[data-cursorlight]", { opacity: 0, duration: 0.4 });
          rootEl.addEventListener("mousemove", onMove);
          rootEl.addEventListener("mouseleave", onLeave);
          cleanups.push(() => {
            rootEl.removeEventListener("mousemove", onMove);
            rootEl.removeEventListener("mouseleave", onLeave);
          });
        }

        // CTA hover pulse
        if (hover && cta.current) {
          const btn = cta.current;
          const glow = root.current?.querySelector<HTMLElement>("[data-ctaglow]") ?? null;
          const onEnter = () => {
            overlay.current?.pulse();
            if (glow) gsap.to(glow, { opacity: 1, duration: 0.5, ease: "power2.out" });
            gsap.to("[data-floorglow]", { opacity: "+=0.1", duration: 0.6, overwrite: "auto" });
            gsap.to(btn, {
              keyframes: [
                { boxShadow: "0 0 0px rgba(122,76,255,0.0)" },
                { boxShadow: "0 0 22px rgba(122,76,255,0.45)" },
                { boxShadow: "0 0 12px rgba(122,76,255,0.22)" },
              ],
              duration: 0.9,
              ease: "sine.inOut",
            });
          };
          const onLeave = () => {
            if (glow) gsap.to(glow, { opacity: 0, duration: 0.5 });
            gsap.to(btn, { boxShadow: "0 0 0px rgba(122,76,255,0.0)", duration: 0.5 });
          };
          btn.addEventListener("mouseenter", onEnter);
          btn.addEventListener("mouseleave", onLeave);
          cleanups.push(() => {
            btn.removeEventListener("mouseenter", onEnter);
            btn.removeEventListener("mouseleave", onLeave);
          });
        }
      });

      // ===================== MOBILE =====================
      mm.add("(max-width: 767px)", () => {
        if (reduce) return;
        gsap.from(
          "[data-nav], [data-brand], [data-eyebrow], [data-headline], [data-line], [data-statement], [data-cta] > *, [data-tab]",
          { opacity: 0, y: 16, duration: 0.8, ease: "power3.out", stagger: 0.05 }
        );
        gsap.fromTo("[data-floorglow]", { opacity: 0 }, { opacity: 0.28, duration: 1 });
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
      className="relative h-screen w-full overflow-hidden bg-[#0d0d0f] text-[#ece9f2]"
    >
      {/* ============ L0 — GRAPHITE BACKGROUND ============
          Video is hidden; Three.js is now the main visual.
          Rich dark graphite base so the hero never reads as plain black. */}
      <div data-bg className="absolute inset-0 z-0" style={{ willChange: "transform" }}>
        {/* Graphite base gradient — lifts midtones, keeps premium dark feel */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 130% 110% at 50% 65%, #1c1c24 0%, #111116 38%, #080809 100%)",
          }}
        />
        {/* Restrained violet atmospheric centre glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 40% at 50% 54%, rgba(122,76,255,0.07) 0%, transparent 70%)",
          }}
        />
        {/* Silver horizontal accent — subtle depth plane */}
        <div
          className="pointer-events-none absolute inset-x-0"
          style={{
            top: "58%",
            height: "1px",
            background:
              "linear-gradient(90deg, transparent 0%, rgba(180,180,200,0.06) 30%, rgba(180,180,200,0.12) 50%, rgba(180,180,200,0.06) 70%, transparent 100%)",
          }}
        />
        {/* Video element — hidden; athlete not visible */}
        <video
          ref={videoRef}
          src={HERO_VIDEO_SRC}
          poster="/hero/poster.jpg"
          className="absolute inset-0 h-full w-full object-cover opacity-0"
          muted
          playsInline
          preload="none"
          aria-hidden
        />
      </div>

      {/* ===== L1 — THREE.JS OVERLAY: main motion system ===== */}
      <HeroThreeOverlay
        ref={overlay}
        className="pointer-events-none absolute inset-0 z-[1]"
      />

      {/* Atmospheric particles */}
      <div
        data-particles
        className="hero-particles pointer-events-none absolute inset-0 z-[2] opacity-[0.4] mix-blend-screen"
        style={{
          backgroundImage:
            "radial-gradient(1.5px 1.5px at 20% 30%, rgba(255,255,255,0.45), transparent 60%), radial-gradient(1.3px 1.3px at 72% 62%, rgba(140,120,255,0.4), transparent 60%)",
          backgroundSize: "220px 220px, 310px 310px",
          animation: "heroParticleDrift 26s linear infinite",
          willChange: "background-position",
        }}
      />

      {/* Scan wave */}
      <div
        data-scanwave
        className="pointer-events-none absolute inset-x-0 top-0 z-[3] opacity-0 mix-blend-screen"
        style={{
          height: "14%",
          background:
            "linear-gradient(180deg, transparent 0%, rgba(160,148,255,0.09) 44%, rgba(210,200,255,0.45) 50%, rgba(160,148,255,0.09) 56%, transparent 100%)",
          willChange: "transform, opacity",
        }}
      />

      {/* Floor glow */}
      <div
        data-floorglow
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] opacity-0"
        style={{
          height: "38%",
          background:
            "radial-gradient(ellipse 72% 42% at 50% 100%, rgba(122,76,255,0.38) 0%, rgba(122,76,255,0.09) 48%, transparent 74%)",
          willChange: "opacity",
        }}
      />

      {/* Cursor spotlight */}
      <div
        data-cursorlight
        className="pointer-events-none absolute left-0 top-0 z-[3] hidden h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 mix-blend-screen md:block"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.10) 0%, rgba(122,76,255,0.06) 36%, transparent 64%)",
          willChange: "transform, opacity",
        }}
      />

      {/* Grain */}
      <div
        className="pointer-events-none absolute inset-0 z-[4] opacity-[0.055] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>\")",
          backgroundSize: "180px 180px",
        }}
      />

      {/* Readability gradient — light centre veil so text is crisp over objects */}
      <div
        className="pointer-events-none absolute inset-0 z-[6]"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(10,10,14,0.55) 0%, rgba(10,10,14,0.18) 50%, transparent 78%)",
        }}
      />

      {/* Vignette — softer than before */}
      <div
        data-vignette
        className="pointer-events-none absolute inset-0 z-[7] opacity-50"
        style={{
          background:
            "radial-gradient(140% 100% at 50% 46%, transparent 36%, rgba(0,0,0,0.52) 74%, rgba(0,0,0,0.88) 100%)",
        }}
      />

      {/* ============ LETTERBOX ============ */}
      <div data-letterbox className="absolute inset-0 z-[8]" style={{ willChange: "clip-path" }}>

        {/* ---- Top bar: brand left, nav right ---- */}
        <header className="absolute inset-x-0 top-0 z-[40] flex items-center justify-between px-8 py-7 md:px-12 md:py-8">
          {/* Top-left SMILEFIT mark */}
          <a
            href="#"
            data-brand
            className="text-[#ece9f2]"
            style={{
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontSize: "clamp(11px, 1.1vw, 13px)",
              letterSpacing: "0.34em",
              fontWeight: 600,
            }}
          >
            SMILEFIT
          </a>

          {/* Top-right nav */}
          <nav
            data-nav
            className="hidden items-center gap-9 text-[11px] uppercase tracking-[0.22em] text-[#ece9f2]/60 md:flex"
            style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontWeight: 500 }}
          >
            <a href="#training" className="transition-colors hover:text-[#ece9f2]">Training</a>
            <a href="#raume" className="transition-colors hover:text-[#ece9f2]">Räume</a>
            <a href="#mitgliedschaft" className="transition-colors hover:text-[#ece9f2]">Mitgliedschaft</a>
            <a href="#kontakt" className="transition-colors hover:text-[#ece9f2]">Kontakt</a>
          </nav>

          <a
            href="#kontakt"
            data-nav
            className="text-[11px] uppercase tracking-[0.22em] text-[#ece9f2]/70 md:hidden"
            style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontWeight: 500 }}
          >
            Menu
          </a>
        </header>

        {/* ---- Center editorial block ---- */}
        <div className="absolute inset-0 z-[10] flex flex-col items-center justify-center px-6 text-center">

          {/* Eyebrow */}
          <p
            data-eyebrow
            className="mb-7 text-[#ece9f2]/50"
            style={{
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontSize: "clamp(9px, 0.85vw, 11px)",
              letterSpacing: "0.38em",
              fontWeight: 500,
            }}
          >
            PREMIUM FITNESS · STUTTGART
          </p>

          {/* Main brand title — elegant serif, THE hero centrepiece */}
          <h1
            data-headline
            className="font-serif-editorial text-[#ece9f2]"
            style={{
              fontSize: "clamp(52px, 8.5vw, 138px)",
              letterSpacing: "0.06em",
              lineHeight: 1.0,
              fontWeight: 300,
              willChange: "transform, opacity",
            }}
          >
            SmileFit
          </h1>

          {/* Divider */}
          <div className="my-7 h-px w-12 bg-[#7a4cff]/40" />

          {/* Editorial supporting lines */}
          <div data-lines>
            <p
              className="font-serif-editorial text-[#ece9f2]/75"
              style={{
                fontSize: "clamp(14px, 1.55vw, 24px)",
                letterSpacing: "0.04em",
                lineHeight: 1.55,
                fontWeight: 300,
              }}
            >
              <span className="block overflow-hidden">
                <span data-line className="block italic" style={{ willChange: "transform, filter" }}>
                  Bring back your prime.
                </span>
              </span>
              <span className="block overflow-hidden">
                <span data-line className="block italic" style={{ willChange: "transform, filter" }}>
                  One more time.
                </span>
              </span>
            </p>
          </div>

          {/* CTAs */}
          <div data-cta className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <a
              ref={cta}
              href="#kontakt"
              className="group relative inline-flex items-center gap-3 overflow-hidden border border-[#7a4cff]/60 px-7 py-3 text-[10px] uppercase tracking-[0.28em] text-[#ece9f2] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a4cff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d0f]"
              style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontWeight: 600 }}
            >
              <span
                data-ctaglow
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-0"
                style={{ background: "radial-gradient(120% 120% at 50% 120%, rgba(122,76,255,0.25), transparent 70%)" }}
              />
              <span className="relative">Probetraining reservieren</span>
              <span aria-hidden className="relative transition-transform duration-500 group-hover:translate-x-1">→</span>
            </a>
            <a
              href="#mitgliedschaft"
              className="inline-flex items-center text-[10px] uppercase tracking-[0.28em] text-[#ece9f2]/55 underline-offset-[6px] transition-colors hover:text-[#ece9f2] hover:underline"
              style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontWeight: 600 }}
            >
              Mitglied werden
            </a>
          </div>
        </div>

        {/* ---- Lower-left statement ---- */}
        <div
          data-statement
          className="absolute bottom-0 left-0 z-[10] px-8 pb-10 md:px-12 md:pb-12"
        >
          <span className="mb-2 block h-px w-8 bg-[#7a4cff]/50" />
          <p
            className="text-[#ece9f2]"
            style={{
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontSize: "clamp(11px, 1.15vw, 16px)",
              letterSpacing: "0.16em",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            You&rsquo;re not done yet.
          </p>
        </div>

        {/* ---- Bottom centre: tabs ---- */}
        <div className="absolute inset-x-0 bottom-0 z-[10] flex justify-center pb-8 md:pb-10">
          <div
            data-tabs
            className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2"
            style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontWeight: 500 }}
          >
            {TABS.map((tab, i) => (
              <span
                key={tab}
                data-tab
                className={`text-[9px] uppercase tracking-[0.32em] ${
                  i === 0 ? "text-[#ece9f2]" : "text-[#ece9f2]/38"
                }`}
              >
                {i === 0 && (
                  <span className="mr-2 inline-block h-[5px] w-[5px] -translate-y-px rounded-full bg-[#7a4cff] align-middle" />
                )}
                {tab}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll cue */}
        <div
          data-scrollcue
          className="absolute bottom-8 left-1/2 z-[10] hidden -translate-x-1/2 flex-col items-center gap-2 text-[#ece9f2]/45 md:flex"
          style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontWeight: 500 }}
        >
          <span className="text-[9px] uppercase tracking-[0.32em]">Scroll</span>
          <span className="relative block h-10 w-px overflow-hidden bg-[#ece9f2]/12">
            <span className="animate-scroll-cue absolute inset-x-0 top-0 h-1/3 bg-[#ece9f2]" />
          </span>
        </div>

        {/* Placeholder keeps morph refs intact */}
        <div data-quote className="pointer-events-none absolute opacity-0" aria-hidden />
      </div>

      {/* HANDOFF VEIL */}
      <div
        data-handoff
        className="pointer-events-none absolute inset-0 z-[30] bg-[#080809] opacity-0"
      />
    </section>
  );
}
