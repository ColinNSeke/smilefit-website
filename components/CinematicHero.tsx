"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Approved hero reference (kettlebell + violet energy burst on black).
const HERO_IMAGE = "/hero%20site%20new";

const NAV = ["Programme", "Über uns", "Mitgliedschaft", "Coaching", "Kontakt"] as const;

export default function CinematicHero() {
  const root = useRef<HTMLElement | null>(null);
  const cta = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const cleanups: Array<() => void> = [];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (reduce) {
        gsap.set("[data-rv]", { opacity: 1, y: 0, clipPath: "inset(0% 0%)" });
        return;
      }

      // ---- Page-load reveal ----
      gsap.set("[data-line]", { clipPath: "inset(0% 0% 100% 0%)" });
      const intro = gsap.timeline({ defaults: { ease: "power3.out" }, delay: 0.15 });
      intro
        .from("[data-brandmark]", { y: -14, opacity: 0, duration: 0.9 }, 0)
        .from("[data-navitem]", { y: -12, opacity: 0, duration: 0.8, stagger: 0.06 }, 0.05)
        // Purple glow blooms behind the headline
        .fromTo(
          "[data-textglow]",
          { opacity: 0, scale: 0.55 },
          { opacity: 1, scale: 1, duration: 1.7, ease: "power2.out" },
          0.35
        )
        .from("[data-eyebrow]", { y: 16, opacity: 0, duration: 0.9 }, 0.5)
        // Big headline — masked line-by-line: clip reveal + heavy blur + scale + upward thrust.
        .to("[data-line]", { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "expo.out", stagger: 0.18 }, 0.7)
        .from(
          "[data-line]",
          { yPercent: 130, scale: 1.16, filter: "blur(22px)", duration: 1.3, ease: "expo.out", stagger: 0.18 },
          0.7
        )
        .set("[data-line]", { clearProps: "filter" })
        .from("[data-cta] > *", { x: -40, opacity: 0, duration: 0.95, ease: "power3.out", stagger: 0.12 }, 1.55)
        .from("[data-scrollcue]", { opacity: 0, duration: 0.8 }, 1.85)
        // Energy burst scales in slowly from oversized to resting.
        .fromTo("[data-burst]", { opacity: 0, scale: 1.18 }, { opacity: 1, scale: 1, duration: 2.2, ease: "power2.out" }, 0);

      // ---- Scroll: heavy parallax on the object + handoff ----
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom top",
          scrub: 0.6,
        },
      });
      tl
        .to("[data-burst]", { yPercent: 14, scale: 1.06, ease: "none" }, 0)
        .to("[data-particles]", { yPercent: 22, ease: "none" }, 0)
        .to("[data-copy]", { yPercent: -8, opacity: 0.0, ease: "none" }, 0)
        .to("[data-vignette]", { opacity: 0.9, ease: "none" }, 0);

      // ---- Object breathing (slow, heavy) ----
      const breathe = gsap.to("[data-burst]", {
        scale: "+=0.015",
        duration: 5.5,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
      cleanups.push(() => breathe.kill());

      // ---- Pointer parallax (premium depth) ----
      const hover = window.matchMedia("(hover: hover)").matches;
      if (hover && root.current) {
        const rootEl = root.current;
        const qbx = gsap.quickTo("[data-burst]", "x", { duration: 0.8, ease: "power3.out" });
        const qby = gsap.quickTo("[data-burst]", "y", { duration: 0.8, ease: "power3.out" });
        const onMove = (e: MouseEvent) => {
          const r = rootEl.getBoundingClientRect();
          const nx = (e.clientX - r.left) / r.width - 0.5;
          const ny = (e.clientY - r.top) / r.height - 0.5;
          qbx(nx * -26);
          qby(ny * -16);
        };
        rootEl.addEventListener("mousemove", onMove);
        cleanups.push(() => rootEl.removeEventListener("mousemove", onMove));
      }

      // ---- CTA hover pulse ----
      if (hover && cta.current) {
        const btn = cta.current;
        const glow = root.current?.querySelector<HTMLElement>("[data-ctaglow]") ?? null;
        const onEnter = () => {
          if (glow) gsap.to(glow, { opacity: 1, duration: 0.5, ease: "power2.out" });
          gsap.to(btn, {
            keyframes: [
              { boxShadow: "0 0 0px rgba(122,76,255,0.0)" },
              { boxShadow: "0 0 24px rgba(122,76,255,0.42)" },
              { boxShadow: "0 0 12px rgba(122,76,255,0.20)" },
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
    }, root);

    // Recalculate trigger positions once fonts/images settle.
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    const refreshT = window.setTimeout(() => ScrollTrigger.refresh(), 600);
    if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());

    return () => {
      window.removeEventListener("load", onLoad);
      window.clearTimeout(refreshT);
      cleanups.forEach((c) => c());
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={root}
      className="relative h-screen min-h-[640px] w-full overflow-hidden bg-[#050308] text-[#f4f1f7]"
    >
      {/* ===== Hero object: kettlebell + violet energy burst (approved ref) ===== */}
      <div
        data-burst
        className="absolute inset-0 z-0"
        style={{ willChange: "transform, opacity" }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center md:bg-[position:72%_50%]"
          style={{ backgroundImage: `url('${HERO_IMAGE}')` }}
        />
      </div>

      {/* Black grade on the left — hides the reference's baked text and seats
          the real HTML headline; the burst stays clear on the right. */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(90deg, #050308 0%, #050308 40%, rgba(5,3,8,0.88) 52%, rgba(5,3,8,0.45) 64%, rgba(5,3,8,0.12) 76%, transparent 88%)",
        }}
      />
      {/* Bottom + top cinematic grade */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(5,3,8,0.55) 0%, transparent 24%, transparent 68%, rgba(5,3,8,0.72) 100%)",
        }}
      />

      {/* Subtle violet energy particles */}
      <div
        data-particles
        className="hero-particles pointer-events-none absolute inset-0 z-[2] opacity-[0.35] mix-blend-screen"
        style={{
          backgroundImage:
            "radial-gradient(1.4px 1.4px at 64% 38%, rgba(168,130,255,0.55), transparent 60%), radial-gradient(1.2px 1.2px at 80% 60%, rgba(140,90,255,0.45), transparent 60%), radial-gradient(1px 1px at 56% 70%, rgba(200,170,255,0.4), transparent 60%)",
          backgroundSize: "260px 260px, 340px 340px, 200px 200px",
          animation: "heroParticleDrift 26s linear infinite",
          willChange: "background-position",
        }}
      />

      {/* Grain */}
      <div
        className="pointer-events-none absolute inset-0 z-[3] opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>\")",
          backgroundSize: "180px 180px",
        }}
      />

      {/* Vignette */}
      <div
        data-vignette
        className="pointer-events-none absolute inset-0 z-[4] opacity-70"
        style={{
          background:
            "radial-gradient(135% 100% at 60% 45%, transparent 40%, rgba(0,0,0,0.45) 76%, rgba(0,0,0,0.82) 100%)",
        }}
      />

      {/* ===== Top navigation ===== */}
      <header className="absolute inset-x-0 top-0 z-[20] flex items-center justify-between px-6 py-6 md:px-12 md:py-8">
        <a
          href="#"
          data-brandmark
          data-rv
          className="font-display text-[#f4f1f7]"
          style={{ fontSize: "clamp(18px, 1.8vw, 24px)", letterSpacing: "0.02em", lineHeight: 1 }}
        >
          SMILEFIT
        </a>

        <nav
          className="hidden items-center gap-9 md:flex"
          style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
        >
          {NAV.map((item) => (
            <a
              key={item}
              data-navitem
              data-rv
              href="#"
              className="text-[11px] uppercase tracking-[0.20em] text-[#f4f1f7]/72 transition-colors hover:text-[#f4f1f7]"
              style={{ fontWeight: 600 }}
            >
              {item}
            </a>
          ))}
          <span data-navitem data-rv className="ml-1 flex flex-col gap-[5px]">
            <span className="block h-[1.5px] w-6 bg-[#f4f1f7]/80" />
            <span className="block h-[1.5px] w-6 bg-[#f4f1f7]/80" />
          </span>
        </nav>

        <button
          data-navitem
          data-rv
          aria-label="Menu"
          className="flex flex-col gap-[5px] md:hidden"
        >
          <span className="block h-[1.5px] w-6 bg-[#f4f1f7]/80" />
          <span className="block h-[1.5px] w-6 bg-[#f4f1f7]/80" />
        </button>
      </header>

      {/* ===== Left editorial copy block ===== */}
      <div
        data-copy
        className="absolute inset-y-0 left-0 z-[10] flex max-w-[900px] flex-col justify-center px-6 md:px-12 lg:px-20"
        style={{ willChange: "transform, opacity" }}
      >
        {/* Eyebrow */}
        <p
          data-eyebrow
          data-rv
          className="mb-6 md:mb-8"
          style={{
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            fontSize: "clamp(10px, 1.0vw, 13px)",
            letterSpacing: "0.26em",
            fontWeight: 600,
            lineHeight: 1.7,
            color: "rgba(244,241,247,0.78)",
          }}
        >
          BRING BACK YOUR PRIME,
          <br />
          ONE MORE TIME.
        </p>

        {/* Purple glow bloom behind the headline */}
        <div
          data-textglow
          aria-hidden
          className="pointer-events-none absolute left-0 top-1/2 z-[-1] h-[60vh] w-[60vh] -translate-y-1/2"
          style={{
            background: "radial-gradient(circle, rgba(122,76,255,0.42) 0%, rgba(95,48,195,0.18) 35%, transparent 68%)",
            filter: "blur(20px)",
            willChange: "transform, opacity",
          }}
        />

        {/* Headline */}
        <h1
          className="font-display relative"
          style={{
            fontSize: "clamp(48px, 8.0vw, 118px)",
            lineHeight: 0.9,
            letterSpacing: "-0.03em",
            color: "#f7f4fb",
          }}
        >
          <span className="block overflow-hidden">
            <span data-line data-rv className="block whitespace-nowrap" style={{ willChange: "transform, filter" }}>
              You&rsquo;re not
            </span>
          </span>
          <span className="block overflow-hidden">
            <span data-line data-rv className="block whitespace-nowrap" style={{ willChange: "transform, filter" }}>
              done yet.
            </span>
          </span>
        </h1>

        {/* CTA */}
        <div data-cta className="mt-10 flex items-center gap-6 md:mt-12">
          <a
            ref={cta}
            data-rv
            href="#mitgliedschaft"
            className="group relative inline-flex items-center gap-4 overflow-hidden border px-8 py-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a4cff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050308]"
            style={{
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "#f4f1f7",
              borderColor: "rgba(244,241,247,0.55)",
            }}
          >
            <span
              data-ctaglow
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-0"
              style={{ background: "radial-gradient(120% 130% at 50% 120%, rgba(122,76,255,0.30), transparent 70%)" }}
            />
            <span className="relative">Starte deine Reise</span>
            <span aria-hidden className="relative transition-transform duration-500 group-hover:translate-x-1.5">→</span>
          </a>
        </div>
      </div>

      {/* Scroll cue */}
      <div
        data-scrollcue
        data-rv
        className="absolute bottom-7 left-1/2 z-[10] hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
        style={{
          fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
          color: "rgba(244,241,247,0.45)",
        }}
      >
        <span style={{ fontSize: "9px", letterSpacing: "0.32em", textTransform: "uppercase" }}>Scroll</span>
        <span className="relative block h-10 w-px overflow-hidden" style={{ background: "rgba(244,241,247,0.12)" }}>
          <span className="animate-scroll-cue absolute inset-x-0 top-0 h-1/3 bg-[#f4f1f7]" />
        </span>
      </div>
    </section>
  );
}
