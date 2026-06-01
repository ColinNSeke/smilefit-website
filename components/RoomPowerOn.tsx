"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * SmileFit — "Der Raum trainiert mit." Room power-on section.
 *
 * The gym room starts near-black, then powers on zone by zone as the user
 * scrolls: hex ceiling lights ignite, the machine resolves from shadow, the
 * back Hammer Strength rack illuminates, the floor markings glow in — until
 * the full room is alive and the base photo reads at its natural exposure.
 *
 * Mechanic: a full base photo (room.jpg) sits dimmed via a CSS filter + a
 * black overlay. Each zone-N.png is a rectangular crop of room.jpg, placed
 * back in its source position at opacity 0; revealing it is pure opacity —
 * because the underlying pixels match, the rectangle edges are invisible.
 *
 * The plate is held at room.jpg's native aspect ratio so the zone percentage
 * positions line up exactly with the cover-framed base.
 *
 * Fallback: if the zone crops fail to load, the base still powers on via the
 * global brightness/saturate reveal — the section never breaks.
 * Mobile / reduced-motion: the fully-lit room, no pin / scrub / per-zone work.
 */
type Zone = {
  id: string;
  src: string;
  left: string;
  top: string;
  width: string;
  height: string;
  order: number;
};

// Percentages of room.jpg's natural dimensions — tune by eye if needed.
const ZONES: Zone[] = [
  { id: "zone-1", src: "/room/zone-1.png", left: "0%", top: "0%", width: "100%", height: "38%", order: 1 }, // lights
  { id: "zone-3", src: "/room/zone-3.png", left: "25%", top: "40%", width: "38%", height: "53%", order: 2 }, // machine
  { id: "zone-4", src: "/room/zone-4.png", left: "69%", top: "43%", width: "31%", height: "24%", order: 3 }, // hammer rack
  { id: "zone-2", src: "/room/zone-2.png", left: "27%", top: "71%", width: "53%", height: "27%", order: 4 }, // floor tape
];

// Aspect ratio of room.jpg (360 x 426) — keeps zone % positions aligned.
const ROOM_ASPECT = "360 / 426";

const DIM_FILTER = "brightness(0.18) saturate(0.35) contrast(1.05)";
const LIT_FILTER = "brightness(1) saturate(1) contrast(1)";

/**
 * The room plate: dimmable base photo + zone crops in source position + a
 * black dim overlay. `lit` is the render-time default; GSAP drives the live
 * states from `data-*` hooks. Hoisted to module scope so it isn't recreated
 * on every render.
 */
function RoomPlate({
  lit,
  failed,
  onFail,
}: {
  lit: boolean;
  failed: Record<string, boolean>;
  onFail: (id: string) => void;
}) {
  return (
    <div
      className="absolute left-0 w-full"
      style={{ top: "50%", transform: "translateY(-50%)", aspectRatio: ROOM_ASPECT }}
    >
      {/* Base plate */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        data-base
        src="/room/room.jpg"
        alt="SmileFit Trainingsraum — Maschinen, Neon und Hammer-Strength-Rack."
        className="absolute inset-0 h-full w-full object-cover"
        style={{ filter: lit ? LIT_FILTER : DIM_FILTER, willChange: "filter" }}
      />

      {/* Zone crops, back in their source positions. */}
      {ZONES.filter((z) => !failed[z.id]).map((z) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={z.id}
          data-zone={z.id}
          src={z.src}
          alt=""
          aria-hidden
          onError={() => onFail(z.id)}
          className="absolute h-auto w-auto object-cover"
          style={{
            left: z.left,
            top: z.top,
            width: z.width,
            height: z.height,
            opacity: lit ? 1 : 0,
            willChange: "opacity",
          }}
        />
      ))}

      {/* Global dim overlay for extra depth. */}
      <div
        data-dim
        className="pointer-events-none absolute inset-0 bg-black"
        style={{ opacity: lit ? 0 : 0.55 }}
      />
    </div>
  );
}

export default function RoomPowerOn() {
  const root = useRef<HTMLElement | null>(null);
  const stage = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState<Record<string, boolean>>({});

  const markFailed = (id: string) =>
    setFailed((f) => (f[id] ? f : { ...f, [id]: true }));

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Preload base + zone images before wiring the pinned timeline.
    const sources = ["/room/room.jpg", ...ZONES.map((z) => z.src)];
    let cancelled = false;
    const preload = Promise.all(
      sources.map(
        (src) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = src;
          })
      )
    );

    const ctx = gsap.context(() => {}, root);

    preload.then(() => {
      if (cancelled) return;

      ctx.add(() => {
        const mm = gsap.matchMedia();

        // ===================== DESKTOP =====================
        mm.add("(min-width: 768px)", () => {
          if (reduce) {
            gsap.set("[data-base]", { filter: LIT_FILTER });
            gsap.set("[data-dim]", { opacity: 0 });
            gsap.set("[data-zone]", { opacity: 1 });
            gsap.set("[data-title-line]", { yPercent: 0 });
            gsap.set("[data-mono]", { opacity: 1, y: 0 });
            return;
          }

          // Initial near-dark state.
          gsap.set("[data-base]", { filter: DIM_FILTER });
          gsap.set("[data-dim]", { opacity: 0.55 });
          gsap.set("[data-zone]", { opacity: 0 });
          gsap.set("[data-title-line]", { yPercent: 110 });
          gsap.set("[data-mono]", { opacity: 0, y: 12 });

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: stage.current,
              start: "top top",
              end: "+=140%",
              pin: true,
              scrub: 0.8,
              anticipatePin: 1,
            },
          });

          // Zones ignite in choreographed order: lights → machine → rack → floor.
          tl.to("[data-zone='zone-1']", { opacity: 1, duration: 0.18 }, 0.05)
            .to("[data-zone='zone-3']", { opacity: 1, duration: 0.18 }, 0.25)
            .to("[data-zone='zone-4']", { opacity: 1, duration: 0.18 }, 0.45)
            .to("[data-zone='zone-2']", { opacity: 1, duration: 0.18 }, 0.6)
            // The room comes fully alive: dim lifts, base returns to neutral.
            .to("[data-dim]", { opacity: 0, duration: 0.35 }, 0.55)
            .to("[data-base]", { filter: LIT_FILTER, duration: 0.4 }, 0.55)
            // Headline + mono label resolve as the build completes.
            .to(
              "[data-title-line]",
              { yPercent: 0, duration: 0.22, stagger: 0.08 },
              0.62
            )
            .to("[data-mono]", { opacity: 1, y: 0, duration: 0.18 }, 0.9);
        });

        // ===================== MOBILE =====================
        mm.add("(max-width: 767px)", () => {
          // Fully-lit room; no pin / scrub / per-zone reveal.
          gsap.set("[data-base]", { filter: LIT_FILTER });
          gsap.set("[data-dim]", { opacity: 0 });
          gsap.set("[data-zone]", { opacity: 1 });
          if (reduce) {
            gsap.set("[data-title-line]", { yPercent: 0 });
            gsap.set("[data-mono]", { opacity: 1, y: 0 });
            return;
          }
          gsap.from("[data-title-line]", {
            yPercent: 110,
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.08,
            scrollTrigger: { trigger: root.current, start: "top 75%" },
          });
          gsap.from("[data-mono]", {
            opacity: 0,
            y: 12,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: { trigger: root.current, start: "top 70%" },
          });
        });
      });

      ScrollTrigger.refresh();
    });

    return () => {
      cancelled = true;
      ctx.revert();
    };
  }, []);

  return (
    <section
      id="raume"
      ref={root}
      className="relative w-full bg-[#050505] text-[#f2efe6]"
    >
      {/* ===== MOBILE — fully-lit room ===== */}
      <div className="relative overflow-hidden px-6 py-20 md:hidden">
        <div className="relative aspect-[360/426] w-full overflow-hidden">
          <RoomPlate lit failed={failed} onFail={markFailed} />
        </div>
        <div className="mt-8 flex items-start justify-between">
          <span
            className="text-[10px] uppercase tracking-[0.22em] text-[#f2efe6]/55"
            style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontWeight: 500 }}
          >
            Räume / 02
          </span>
          <span
            data-mono
            className="text-[10px] uppercase tracking-[0.22em] text-[#f2efe6]/55"
            style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontWeight: 500 }}
          >
            Neon / Chrome / Fokus
          </span>
        </div>
        <h2
          className="font-display mt-4 leading-[0.9] tracking-[-0.04em]"
          style={{ fontSize: "clamp(40px, 12vw, 80px)", textTransform: "uppercase" }}
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

      {/* ===== DESKTOP — pinned power-on stage ===== */}
      <div
        ref={stage}
        className="relative hidden h-screen w-full overflow-hidden md:block"
      >
        <RoomPlate lit={false} failed={failed} onFail={markFailed} />

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
          className="pointer-events-none absolute inset-0 z-[2] opacity-60"
          style={{
            background:
              "radial-gradient(130% 90% at 50% 50%, transparent 35%, rgba(0,0,0,0.55) 78%, rgba(0,0,0,0.92) 100%)",
          }}
        />

        {/* Top-left section label */}
        <div
          className="absolute left-6 top-8 z-[40] text-[11px] uppercase tracking-[0.28em] text-[#f2efe6]/55 md:left-10 md:top-10"
          style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontWeight: 600 }}
        >
          Räume / 02
        </div>

        {/* Bottom-left headline */}
        <div className="absolute bottom-10 left-6 z-[40] max-w-[60vw] md:bottom-12 md:left-10">
          <h2
            className="font-display leading-[0.9] tracking-[-0.035em]"
            style={{ fontSize: "clamp(40px, 6vw, 104px)", textTransform: "uppercase" }}
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

        {/* Bottom-right mono label */}
        <div
          data-mono
          className="absolute bottom-10 right-6 z-[40] text-right text-[11px] uppercase tracking-[0.28em] text-[#f2efe6]/55 md:right-10 md:bottom-12"
          style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontWeight: 600 }}
        >
          Neon / Chrome / Fokus
        </div>
      </div>
    </section>
  );
}
