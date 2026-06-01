"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Media } from "./Media";

type Panel = {
  key: string;
  src: string;
  video?: boolean;
  alt: string;
  /** Tailwind classes for the intentional REST slot. */
  className: string;
  /** z-index — main has the highest visual priority. */
  z: number;
  initial: gsap.TweenVars;
  enterAt: number;
  enterDuration: number;
  enterTween: gsap.TweenVars;
};

// FIVE INTENTIONAL SLOTS — composed for clear separation. No slot covers
// the subject of another. Touch points are deliberate (rightSlot beside
// main, accentSlot peeking from the right edge behind rightSlot).
const PANELS: Panel[] = [
  // mainSlot — center-right dominant
  {
    key: "main",
    src: "/media/gym-01.jpg",
    alt: "Sled push athlete",
    className: "left-[30%] top-[10%] w-[40vw] h-[60vh]",
    z: 30,
    initial: {
      scale: 1.12,
      rotateY: 0,
      opacity: 1,
      transformPerspective: 1600,
    },
    enterAt: 0,
    enterDuration: 0.5,
    enterTween: { scale: 1, rotateY: -6, ease: "none" },
  },
  // leftSlot — left vertical column, behind main
  {
    key: "left",
    src: "/media/gym-02.jpg",
    alt: "Hex-light gym interior",
    className: "left-[3%] top-[14%] w-[22vw] h-[52vh]",
    z: 15,
    initial: {
      opacity: 0,
      xPercent: -80,
      rotateY: 22,
      scale: 0.94,
      transformPerspective: 1600,
    },
    enterAt: 0.08,
    enterDuration: 0.22,
    enterTween: {
      opacity: 1,
      xPercent: 0,
      rotateY: 4,
      scale: 1,
      ease: "none",
    },
  },
  // rightSlot — upper-right small companion (no overlap with main)
  {
    key: "right",
    src: "/media/gym-04.jpg",
    alt: "Cable grip",
    className: "right-[4%] top-[12%] w-[18vw] h-[34vh]",
    z: 20,
    initial: {
      opacity: 0,
      xPercent: 80,
      rotateY: -22,
      scale: 0.94,
      transformPerspective: 1600,
    },
    enterAt: 0.22,
    enterDuration: 0.22,
    enterTween: {
      opacity: 1,
      xPercent: 0,
      rotateY: -5,
      scale: 1,
      ease: "none",
    },
  },
  // bottomSlot — wide horizontal below main (no vertical overlap)
  {
    key: "bottom",
    src: "/media/gym-03.jpg",
    alt: "Rooftop sunset",
    className: "left-[28%] bottom-[8%] w-[34vw] h-[20vh]",
    z: 25,
    initial: {
      opacity: 0,
      yPercent: 90,
      rotateZ: -2,
      scale: 0.96,
      transformPerspective: 1600,
    },
    enterAt: 0.36,
    enterDuration: 0.22,
    enterTween: {
      opacity: 1,
      yPercent: 0,
      rotateZ: 0,
      scale: 1,
      ease: "none",
    },
  },
  // accentSlot — thin vertical accent at far right edge, deepest layer
  {
    key: "accent",
    src: "/media/gym-05.jpg",
    alt: "Dumbbell rack purple",
    className: "right-[0%] bottom-[22%] w-[9vw] h-[30vh]",
    z: 5,
    initial: {
      opacity: 1,
      clipPath: "inset(100% 0 0 0)",
      WebkitClipPath: "inset(100% 0 0 0)",
      transformPerspective: 1600,
    },
    enterAt: 0.5,
    enterDuration: 0.26,
    enterTween: {
      clipPath: "inset(0% 0 0 0)",
      WebkitClipPath: "inset(0% 0 0 0)",
      ease: "none",
    },
  },
];

export default function MediaCollage() {
  const root = useRef<HTMLElement | null>(null);
  const stage = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // ========== DESKTOP ==========
      mm.add("(min-width: 768px)", () => {
        const listenerCleanups: Array<() => void> = [];

        PANELS.forEach((p) => {
          gsap.set(`[data-panel='${p.key}']`, p.initial);
        });

        gsap.set("[data-label]", { opacity: 0, y: 12 });
        gsap.set("[data-title-line]", { yPercent: 110 });
        gsap.set("[data-micro]", { opacity: 0, y: 12 });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: stage.current,
            start: "top top",
            end: "+=200%",
            pin: true,
            scrub: 0.8,
            anticipatePin: 1,
          },
        });

        PANELS.forEach((p) => {
          tl.to(
            `[data-panel='${p.key}']`,
            { ...p.enterTween, duration: p.enterDuration },
            p.enterAt
          );
        });

        // Slow ambient drift during the whole sequence — gives depth even
        // before/after a panel's specific entrance.
        PANELS.forEach((p, i) => {
          tl.to(
            `[data-panel='${p.key}']`,
            { y: `-=${8 + i * 2}`, duration: 1, ease: "none" },
            0
          );
        });

        // Text reveals
        tl.to(
          "[data-label]",
          { opacity: 1, y: 0, duration: 0.15 },
          0.04
        );
        tl.to(
          "[data-title-line]",
          { yPercent: 0, duration: 0.2, stagger: 0.06 },
          0.62
        );
        tl.to("[data-micro]", { opacity: 1, y: 0, duration: 0.15 }, 0.78);

        // Hover tilt — desktop only
        if (window.matchMedia("(hover: hover)").matches && stage.current) {
          PANELS.forEach((p) => {
            const el = stage.current!.querySelector<HTMLElement>(
              `[data-panel='${p.key}']`
            );
            if (!el) return;
            const baseRY = (p.enterTween.rotateY as number | undefined) ?? 0;
            const qRY = gsap.quickTo(el, "rotateY", {
              duration: 0.5,
              ease: "power3.out",
            });
            const qRX = gsap.quickTo(el, "rotateX", {
              duration: 0.5,
              ease: "power3.out",
            });
            const qS = gsap.quickTo(el, "scale", {
              duration: 0.6,
              ease: "power3.out",
            });
            const onMove = (e: MouseEvent) => {
              const rect = el.getBoundingClientRect();
              const mx = (e.clientX - rect.left) / rect.width - 0.5;
              const my = (e.clientY - rect.top) / rect.height - 0.5;
              qRY(baseRY + mx * 6);
              qRX(-my * 6);
              qS(1.03);
            };
            const onLeave = () => {
              qRY(baseRY);
              qRX(0);
              qS(1);
            };
            el.addEventListener("mousemove", onMove);
            el.addEventListener("mouseleave", onLeave);
            listenerCleanups.push(() => {
              el.removeEventListener("mousemove", onMove);
              el.removeEventListener("mouseleave", onLeave);
            });
          });
        }

        return () => {
          listenerCleanups.forEach((c) => c());
        };
      });

      // ========== MOBILE ==========
      mm.add("(max-width: 767px)", () => {
        gsap.from("[data-mobile-card]", {
          opacity: 0,
          y: 60,
          scale: 0.96,
          duration: 1.0,
          ease: "expo.out",
          stagger: 0.1,
          scrollTrigger: {
            trigger: root.current,
            start: "top 75%",
          },
        });
        gsap.from("[data-mobile-text]", {
          opacity: 0,
          y: 30,
          duration: 0.9,
          ease: "expo.out",
          stagger: 0.08,
          scrollTrigger: {
            trigger: root.current,
            start: "top 80%",
          },
        });
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      className="relative w-full bg-[#050505] text-[#f2efe6]"
    >
      {/* ===== MOBILE LAYOUT ===== */}
      <div className="flex flex-col gap-10 px-6 py-24 md:hidden">
        <div className="flex items-start justify-between">
          <span
            data-mobile-text
            className="text-[10px] uppercase tracking-[0.22em] text-[#f2efe6]/55"
            style={{
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontWeight: 500,
            }}
          >
            Atmosphäre / 01
          </span>
          <span
            data-mobile-text
            className="text-[10px] uppercase tracking-[0.22em] text-[#f2efe6]/55"
            style={{
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontWeight: 500,
            }}
          >
            Neon / Chrome / Fokus
          </span>
        </div>
        <h2
          data-mobile-text
          className="font-display leading-[0.9] tracking-[-0.04em]"
          style={{
            fontSize: "clamp(40px, 12vw, 80px)",
            textTransform: "uppercase",
          }}
        >
          Der Raum
          <br />
          trainiert mit.
        </h2>
        {PANELS.map((p) => (
          <div
            key={p.key}
            data-mobile-card
            className="aspect-[4/5] w-full overflow-hidden"
          >
            <Media
              src={p.src}
              video={p.video}
              alt={p.alt}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* ===== DESKTOP CINEMATIC STAGE ===== */}
      <div
        ref={stage}
        className="relative hidden h-screen w-full overflow-hidden md:block"
        style={{ perspective: "1600px" }}
      >
        {/* Subtle ambient bg gradient */}
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 50%, rgba(122,76,255,0.06), transparent 55%)",
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
          className="pointer-events-none absolute inset-0 z-[2] opacity-50"
          style={{
            background:
              "radial-gradient(130% 90% at 50% 50%, transparent 30%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.92) 100%)",
          }}
        />

        {/* 3D PANEL STAGE */}
        <div
          className="absolute inset-0 z-[5]"
          style={{ transformStyle: "preserve-3d", perspective: "1600px" }}
        >
          {PANELS.map((p) => (
            <div
              key={p.key}
              data-panel={p.key}
              className={`absolute overflow-hidden ${p.className}`}
              style={{
                zIndex: p.z,
                willChange: "transform, clip-path",
                boxShadow:
                  "0 40px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset",
                transformStyle: "preserve-3d",
              }}
            >
              <Media
                src={p.src}
                video={p.video}
                alt={p.alt}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.45) 100%)",
                }}
              />
            </div>
          ))}
        </div>

        {/* Top-left label */}
        <div
          data-label
          className="absolute left-6 top-8 z-[40] text-[11px] uppercase tracking-[0.28em] text-[#f2efe6]/55 md:left-10 md:top-10"
          style={{
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            fontWeight: 600,
          }}
        >
          Atmosphäre / 01
        </div>

        {/* Bottom-left main text — sits in the clean strip left of bottomSlot */}
        <div className="absolute left-6 bottom-10 z-[40] max-w-[24vw] md:left-10 md:bottom-12">
          <h2
            className="font-display leading-[0.95] tracking-[-0.035em]"
            style={{
              fontSize: "clamp(20px, 1.8vw, 36px)",
              textTransform: "uppercase",
            }}
          >
            <span className="block overflow-hidden">
              <span data-title-line className="block">
                Der Raum
              </span>
            </span>
            <span className="block overflow-hidden">
              <span data-title-line className="block">
                trainiert mit.
              </span>
            </span>
          </h2>
        </div>

        {/* Bottom-right micro label — pulled in slightly so accentSlot edge
            doesn't crowd it */}
        <div
          data-micro
          className="absolute right-[14vw] bottom-8 z-[40] text-right text-[11px] uppercase tracking-[0.28em] text-[#f2efe6]/55 md:right-[14vw] md:bottom-10"
          style={{
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            fontWeight: 600,
          }}
        >
          Neon / Chrome / Fokus
        </div>
      </div>
    </section>
  );
}
