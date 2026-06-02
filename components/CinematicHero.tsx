"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HeroThreeOverlay, { type HeroOverlayHandle } from "./HeroThreeOverlay";

// Real SmileFit cinematic hero: central athlete, floating weights, black void,
// holographic rings, premium violet energy. File: public/smilefit-hero-video (1).mp4
const HERO_VIDEO_SRC = "/smilefit-hero-video%20(1).mp4";

// Stronger, clearly-staged scroll → video time mapping so the chamber visibly
// unlocks as you scroll:
//   0.00–0.15 → 0.00–0.04   frozen tension
//   0.15–0.35 → 0.04–0.28   activation begins
//   0.35–0.65 → 0.28–0.72   weights / rings / energy clearly move
//   0.65–0.90 → 0.72–0.95   peak motion
//   0.90–1.00 → 0.95–1.00   open-up
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

    // ---- RAF-based video scrub state ----
    let targetVideoFrac = 0;
    let currentVideoFrac = 0;
    let rafId = 0;
    let videoDuration = 0;

    const video = videoRef.current;
    if (video) {
      video.pause();
      const onMeta = () => {
        videoDuration = video.duration || 0;
        if (reduce) video.currentTime = videoDuration * 0.45;
      };
      if (video.readyState >= 1) videoDuration = video.duration || 0;
      else {
        video.addEventListener("loadedmetadata", onMeta);
        cleanups.push(() => video.removeEventListener("loadedmetadata", onMeta));
      }

      const tick = () => {
        // Snappier lerp (0.18) so scroll motion is clearly visible.
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
            "[data-nav], [data-eyebrow], [data-line], [data-support], [data-cta], [data-tabs], [data-scrollcue]",
            { opacity: 1, y: 0, clipPath: "inset(0% 0%)" }
          );
          return;
        }

        // -------- Scene 0: quiet editorial load inside letterbox --------
        gsap.set("[data-letterbox]", { clipPath: "inset(8% 12% round 0px)" });
        gsap.set("[data-line]", { clipPath: "inset(0% 0% 100% 0%)" });

        const intro = gsap.timeline({
          defaults: { ease: "power3.out" },
          delay: 0.15,
        });
        intro
          .from("[data-nav]", { y: -14, opacity: 0, duration: 0.9, stagger: 0.06 }, 0)
          .from("[data-eyebrow]", { y: 12, opacity: 0, duration: 0.9 }, 0.15)
          // Headline lines rise behind a clip mask — calm, magazine reveal.
          .to(
            "[data-line]",
            { clipPath: "inset(0% 0% 0% 0%)", duration: 1.15, ease: "expo.out", stagger: 0.14 },
            0.25
          )
          .from(
            "[data-line]",
            { yPercent: 18, duration: 1.15, ease: "expo.out", stagger: 0.14 },
            0.25
          )
          .from("[data-support]", { y: 12, opacity: 0, duration: 0.9 }, 0.7)
          .from("[data-cta] > *", { y: 14, opacity: 0, duration: 0.8, stagger: 0.1 }, 0.85)
          .from("[data-tab]", { y: 10, opacity: 0, duration: 0.7, stagger: 0.06 }, 0.95)
          .from("[data-scrollcue]", { opacity: 0, duration: 0.7 }, 1.05)
          // Floor glow breathes in to a quiet resting level.
          .fromTo("[data-floorglow]", { opacity: 0 }, { opacity: 0.32, duration: 1.2 }, 0.4);

        // -------- Scene 1: scroll-scrubbed activation + handoff --------
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
              // Same scroll progress drives the Three.js overlay objects.
              overlay.current?.setProgress(p);

              // Scan wave sweeps once across the activation window 0.15–0.35.
              const sw = (p - 0.15) / 0.2;
              if (sw >= 0 && sw <= 1) {
                gsap.set("[data-scanwave]", {
                  yPercent: sw * 620 - 110,
                  opacity: Math.sin(sw * Math.PI) * 0.7,
                });
              } else {
                gsap.set("[data-scanwave]", { opacity: 0 });
              }
            },
          },
        });

        morph
          // Letterbox opens as activation begins.
          .to(
            "[data-letterbox]",
            { clipPath: "inset(0% 0% round 0px)", duration: 0.35, ease: "power2.inOut" },
            0.1
          )
          // Footage pushes in subtly through the unlock.
          .to("[data-bg]", { scale: 1.12 }, 0)
          // Floor glow rises from resting → activation → peak.
          .to("[data-floorglow]", { opacity: 0.55 }, 0.15)
          .to("[data-floorglow]", { opacity: 0.85 }, 0.5)
          // Particles drift faster as the chamber unlocks.
          .to("[data-particles]", { opacity: 0.85 }, 0.3)
          // Editorial copy holds during frozen tension, then clears so the
          // moving footage dominates the peak.
          .to("[data-eyebrow]", { opacity: 0, y: -8 }, 0.3)
          .to("[data-headline]", { opacity: 0, y: -26, scale: 1.04 }, 0.32)
          .to("[data-support]", { opacity: 0, y: -8 }, 0.34)
          .to("[data-cta]", { opacity: 0, y: -8 }, 0.36)
          .to("[data-tabs]", { opacity: 0, y: 8 }, 0.3)
          .to("[data-scrollcue]", { opacity: 0 }, 0.12)
          // Vignette deepens, floor glow eases off, handoff to next section.
          .to("[data-vignette]", { opacity: 0.85 }, 0.7)
          .to("[data-floorglow]", { opacity: 0, duration: 0.18 }, 0.85)
          .to("[data-handoff]", { opacity: 1 }, 0.86);

        // -------- Cursor spotlight (quiet) --------
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

        // -------- Primary CTA hover: subtle violet pulse + floor glow lift --
        if (hover && cta.current) {
          const btn = cta.current;
          const glow = root.current?.querySelector<HTMLElement>("[data-ctaglow]") ?? null;
          const onEnter = () => {
            // Rings brighten + weights vibrate slightly via the overlay.
            overlay.current?.pulse();
            if (glow) gsap.to(glow, { opacity: 1, duration: 0.5, ease: "power2.out" });
            gsap.to("[data-floorglow]", { opacity: "+=0.12", duration: 0.6, overwrite: "auto" });
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
        if (video) {
          video.loop = true;
          video.play().catch(() => {/* autoplay blocked — poster is fine */});
        }
        if (reduce) return;
        gsap.from(
          "[data-nav], [data-eyebrow], [data-line], [data-support], [data-cta] > *, [data-tab]",
          { opacity: 0, y: 18, duration: 0.8, ease: "power3.out", stagger: 0.06 }
        );
        gsap.fromTo("[data-floorglow]", { opacity: 0 }, { opacity: 0.3, duration: 1 });
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
      className="relative h-screen w-full overflow-hidden bg-[#050505] text-[#ece9f2]"
    >
      {/* ============ L0 — BACKGROUND VIDEO ============ */}
      <div data-bg className="absolute inset-0 z-0" style={{ willChange: "transform" }}>
        <video
          ref={videoRef}
          src={HERO_VIDEO_SRC}
          poster="/hero/poster.jpg"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: "brightness(1.06) saturate(1.04) contrast(1.03)" }}
          muted
          playsInline
          preload="auto"
        />
        {/* Restrained violet wash — top corner only, no big gradient. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 80% at 15% 8%, rgba(122,76,255,0.10), transparent 52%)",
          }}
        />
      </div>

      {/* ===== L2 — THREE.JS TRANSPARENT OVERLAY (weights / rings / particles) */}
      <HeroThreeOverlay
        ref={overlay}
        className="pointer-events-none absolute inset-0 z-[1]"
      />

      {/* Atmospheric particles — subtle dust drifting over the video */}
      <div
        data-particles
        className="hero-particles pointer-events-none absolute inset-0 z-[2] opacity-[0.55] mix-blend-screen"
        style={{
          backgroundImage:
            "radial-gradient(1.5px 1.5px at 20% 30%, rgba(255,255,255,0.5), transparent 60%), radial-gradient(1.3px 1.3px at 70% 60%, rgba(150,130,255,0.45), transparent 60%)",
          backgroundSize: "220px 220px, 300px 300px",
          animation: "heroParticleDrift 24s linear infinite",
          willChange: "background-position",
        }}
      />

      {/* Scan wave — thin bright sweep during activation (scroll 0.15–0.35) */}
      <div
        data-scanwave
        className="pointer-events-none absolute inset-x-0 top-0 z-[3] opacity-0 mix-blend-screen"
        style={{
          height: "14%",
          background:
            "linear-gradient(180deg, transparent 0%, rgba(170,158,255,0.12) 44%, rgba(214,208,255,0.55) 50%, rgba(170,158,255,0.12) 56%, transparent 100%)",
          willChange: "transform, opacity",
        }}
      />

      {/* Floor / ring glow — restrained violet, rises with scroll */}
      <div
        data-floorglow
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] opacity-0"
        style={{
          height: "34%",
          background:
            "radial-gradient(ellipse 70% 38% at 50% 100%, rgba(122,76,255,0.42) 0%, rgba(122,76,255,0.10) 45%, transparent 72%)",
          willChange: "opacity",
        }}
      />

      {/* Cursor spotlight */}
      <div
        data-cursorlight
        className="pointer-events-none absolute left-0 top-0 z-[3] hidden h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 mix-blend-screen md:block"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(122,76,255,0.08) 34%, transparent 62%)",
          willChange: "transform, opacity",
        }}
      />

      {/* Grain */}
      <div
        data-grain
        className="pointer-events-none absolute inset-0 z-[4] opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>\")",
          backgroundSize: "180px 180px",
        }}
      />

      {/* ===== L4 — READABILITY GRADIENT (keeps centered copy legible) ===== */}
      <div
        data-readability
        className="pointer-events-none absolute inset-0 z-[6]"
        style={{
          background:
            "radial-gradient(70% 55% at 50% 52%, rgba(5,5,5,0.55) 0%, rgba(5,5,5,0.18) 45%, transparent 75%)",
        }}
      />

      {/* Vignette */}
      <div
        data-vignette
        className="pointer-events-none absolute inset-0 z-[7] opacity-60"
        style={{
          background:
            "radial-gradient(130% 95% at 50% 45%, transparent 34%, rgba(0,0,0,0.6) 76%, rgba(0,0,0,0.94) 100%)",
        }}
      />

      {/* ============ LETTERBOX WINDOW ============ */}
      <div data-letterbox className="absolute inset-0 z-[8]" style={{ willChange: "clip-path" }}>
        {/* ---- Top bar ---- */}
        <header className="absolute inset-x-0 top-0 z-[40] flex items-center justify-between px-6 py-6 md:px-10 md:py-8">
          <a
            href="#"
            data-nav
            className="text-[16px] tracking-[0.18em] md:text-[17px]"
            style={{ fontWeight: 600 }}
          >
            SMILEFIT
          </a>
          <nav
            data-nav
            className="hidden items-center gap-8 text-[11px] uppercase tracking-[0.24em] text-[#ece9f2]/70 md:flex"
            style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontWeight: 500 }}
          >
            <a href="#training" className="transition-opacity hover:opacity-100 hover:text-[#ece9f2]">Training</a>
            <a href="#raume" className="transition-opacity hover:text-[#ece9f2]">Räume</a>
            <a href="#mitgliedschaft" className="transition-opacity hover:text-[#ece9f2]">Mitgliedschaft</a>
            <a href="#kontakt" className="transition-opacity hover:text-[#ece9f2]">Kontakt</a>
          </nav>
          <a
            href="#kontakt"
            data-nav
            className="text-[11px] uppercase tracking-[0.22em] text-[#ece9f2]/80 md:hidden"
            style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontWeight: 500 }}
          >
            Menu
          </a>
        </header>

        {/* ---- Centered editorial block ---- */}
        <div className="absolute inset-0 z-[10] flex flex-col items-center justify-center px-6 text-center">
          {/* Eyebrow */}
          <div data-eyebrow className="mb-7 flex items-center gap-4">
            <span className="block h-px w-8 bg-[#7a4cff]/70" />
            <span
              className="text-[11px] uppercase tracking-[0.42em] text-[#ece9f2]/75"
              style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontWeight: 500 }}
            >
              SMILEFIT · PREMIUM FITNESS
            </span>
            <span className="block h-px w-8 bg-[#7a4cff]/70" />
          </div>

          {/* Headline */}
          <h1
            data-headline
            className="font-serif-editorial"
            style={{
              fontSize: "clamp(48px, 8.5vw, 132px)",
              willChange: "transform, opacity",
            }}
          >
            <span data-line className="block" style={{ fontWeight: 400 }}>
              Stärker werden.
            </span>
            <span data-line className="block italic" style={{ fontWeight: 400 }}>
              Besser fühlen.
            </span>
          </h1>

          {/* Supporting line */}
          <p
            data-support
            className="mt-8 text-[13px] uppercase tracking-[0.34em] text-[#ece9f2]/70"
            style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontWeight: 500 }}
          >
            Kraft. Energie. Selbstvertrauen.
          </p>

          {/* CTAs */}
          <div data-cta className="mt-11 flex flex-col items-center gap-4 sm:flex-row">
            <a
              ref={cta}
              href="#kontakt"
              className="group relative inline-flex items-center gap-3 overflow-hidden border border-[#7a4cff]/70 px-7 py-3.5 text-[11px] uppercase tracking-[0.26em] text-[#ece9f2] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a4cff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
              style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontWeight: 600 }}
            >
              {/* hover wash + glow */}
              <span
                data-ctaglow
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-0"
                style={{ background: "radial-gradient(120% 120% at 50% 120%, rgba(122,76,255,0.28), transparent 70%)" }}
              />
              <span className="relative">Probetraining reservieren</span>
              <span aria-hidden className="relative transition-transform duration-500 group-hover:translate-x-1">→</span>
            </a>
            <a
              href="#mitgliedschaft"
              className="inline-flex items-center text-[11px] uppercase tracking-[0.26em] text-[#ece9f2]/65 underline-offset-[6px] transition-colors hover:text-[#ece9f2] hover:underline"
              style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontWeight: 600 }}
            >
              Mitglied werden
            </a>
          </div>
        </div>

        {/* ---- Bottom tabs + scroll cue ---- */}
        <div className="absolute inset-x-0 bottom-0 z-[10] flex items-end justify-between gap-6 px-6 pb-8 md:px-10 md:pb-10">
          <div
            data-tabs
            className="flex flex-wrap items-center gap-x-7 gap-y-2"
            style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontWeight: 500 }}
          >
            {TABS.map((tab, i) => (
              <span
                key={tab}
                data-tab
                className={`text-[10px] uppercase tracking-[0.3em] ${
                  i === 0 ? "text-[#ece9f2]" : "text-[#ece9f2]/45"
                }`}
              >
                {i === 0 && (
                  <span className="mr-2 inline-block h-[6px] w-[6px] -translate-y-px rounded-full bg-[#7a4cff] align-middle" />
                )}
                {tab}
              </span>
            ))}
          </div>

          {/* Scroll cue */}
          <div
            data-scrollcue
            className="hidden flex-col items-center gap-2 text-[#ece9f2]/60 md:flex"
            style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontWeight: 500 }}
          >
            <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
            <span className="relative block h-12 w-px overflow-hidden bg-[#ece9f2]/15">
              <span className="animate-scroll-cue absolute inset-x-0 top-0 h-1/3 bg-[#ece9f2]" />
            </span>
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
