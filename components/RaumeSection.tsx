"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type Tile = {
  src: string;
  label: string;
  index: string;
  caption: string;
  area: string;
  wipeDir: string; // clip-path reveal direction
};

const TILES: Tile[] = [
  {
    src: "/media/gym-02.jpg",
    label: "System",
    index: "01",
    caption: "Hauptfläche · 2.200m²",
    area: "md:col-span-5 md:row-span-2",
    wipeDir: "left",
  },
  {
    src: "/media/gym-05.jpg",
    label: "Training",
    index: "02",
    caption: "Free Weights · Hardcore Area",
    area: "md:col-span-4",
    wipeDir: "top",
  },
  {
    src: "/media/gym-06.jpg",
    label: "Kraft",
    index: "03",
    caption: "Hammer Strength",
    area: "md:col-span-3 md:row-span-2",
    wipeDir: "right",
  },
  {
    src: "/media/gym-04.jpg",
    label: "Performance",
    index: "04",
    caption: "Funktional · Conditioning",
    area: "md:col-span-4",
    wipeDir: "bottom",
  },
];

// Starting clipPath per wipe direction
const WIPE_START: Record<string, string> = {
  left:   "inset(0% 100% 0% 0%)",
  right:  "inset(0% 0% 0% 100%)",
  top:    "inset(0% 0% 100% 0%)",
  bottom: "inset(100% 0% 0% 0%)",
};

export default function RaumeSection() {
  const root = useRef<HTMLElement | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 768;

    const ctx = gsap.context(() => {
      /* --- Reduced motion: show all instantly --- */
      if (reduce) {
        gsap.set("[data-tile],[data-head],[data-veil],[data-tilelabel]", { clearProps: "all" });
        gsap.set("[data-veil]", { opacity: 0 });
        return;
      }

      /* =============================================
         HEADING — heavy upward burst with blur
      ============================================= */
      gsap.set("[data-head]", { opacity: 0, y: 80, filter: "blur(14px)" });
      gsap.to("[data-head]", {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1.2,
        ease: "power3.out",
        stagger: 0.15,
        scrollTrigger: { trigger: "[data-headwrap]", start: "top 85%" },
        onComplete: () => gsap.set("[data-head]", { clearProps: "filter" }),
      });

      /* =============================================
         TILES — each wipes in from a different side,
         image opens from total darkness (veil lifts)
      ============================================= */
      gsap.utils.toArray<HTMLElement>("[data-tile]").forEach((tile) => {
        const dir   = tile.dataset.wipe ?? "top";
        const img   = tile.querySelector<HTMLElement>("[data-tileimg]");
        const veil  = tile.querySelector<HTMLElement>("[data-veil]");
        const label = tile.querySelector<HTMLElement>("[data-tilelabel]");

        // Set initial state
        gsap.set(tile, { clipPath: WIPE_START[dir] });
        if (img) gsap.set(img, { scale: 1.5 });
        if (veil) gsap.set(veil, { opacity: 1 });
        if (label) gsap.set(label, { opacity: 0, y: 32 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: tile,
            start: "top 90%",
          },
        });

        // 1. Tile wipes open
        tl.to(tile, {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1.4,
          ease: "expo.inOut",
        }, 0);

        // 2. Image scales down from oversized (opens from darkness)
        if (img) tl.to(img, { scale: 1.0, duration: 1.8, ease: "expo.out" }, 0);

        // 3. Darkness veil lifts — image emerges
        if (veil) tl.to(veil, { opacity: 0, duration: 1.6, ease: "power2.out" }, 0.1);

        // 4. Label rises in after image is revealed
        if (label) tl.to(label, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" }, 0.65);

        // Parallax scroll through
        if (img && !isMobile) {
          gsap.to(img, {
            yPercent: 18,
            ease: "none",
            scrollTrigger: {
              trigger: tile,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          });
        }
      });

      /* =============================================
         TILE HOVER — 3D tilt + image drift + glow
      ============================================= */
      if (!isMobile && window.matchMedia("(hover: hover)").matches) {
        gsap.utils.toArray<HTMLElement>("[data-tile]").forEach((tile) => {
          const img = tile.querySelector<HTMLElement>("[data-tileimg]");
          const glowBorder = tile.querySelector<HTMLElement>("[data-glow-border]");
          gsap.set(tile, { transformPerspective: 1000, transformOrigin: "center center" });

          const onMove = (e: MouseEvent) => {
            const r  = tile.getBoundingClientRect();
            const nx = (e.clientX - r.left)  / r.width  - 0.5;
            const ny = (e.clientY - r.top)   / r.height - 0.5;

            gsap.to(tile, { rotateY: nx * 14, rotateX: ny * -14, duration: 0.5, ease: "power2.out" });
            if (img) gsap.to(img, { x: nx * -24, y: ny * -24, scale: 1.08, duration: 0.5, ease: "power2.out" });
            if (glowBorder) gsap.to(glowBorder, { opacity: 1, duration: 0.3 });
          };
          const onLeave = () => {
            gsap.to(tile, { rotateY: 0, rotateX: 0, duration: 0.7, ease: "power2.out" });
            if (img) gsap.to(img, { x: 0, y: 0, scale: 1.0, duration: 0.7, ease: "power2.out" });
            if (glowBorder) gsap.to(glowBorder, { opacity: 0, duration: 0.4 });
          };

          tile.addEventListener("mousemove", onMove);
          tile.addEventListener("mouseleave", onLeave);
        });
      }

      /* =============================================
         VIDEO INTERLUDE — massive letterbox open
      ============================================= */
      gsap.set("[data-interlude]", { clipPath: "inset(16% 12%)", opacity: 0, scale: 0.92 });
      gsap.to("[data-interlude]", {
        clipPath: "inset(0% 0%)",
        opacity: 1,
        scale: 1,
        duration: 1.6,
        ease: "expo.inOut",
        scrollTrigger: { trigger: "[data-interlude]", start: "top 85%" },
      });

      // Video parallax text
      gsap.from("[data-interlude-text]", {
        y: 60,
        opacity: 0,
        filter: "blur(16px)",
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: { trigger: "[data-interlude]", start: "top 70%" },
        onComplete: () => gsap.set("[data-interlude-text]", { clearProps: "filter" }),
      });
    }, root);

    const t = setTimeout(() => ScrollTrigger.refresh(), 700);
    if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    return () => { clearTimeout(t); ctx.revert(); };
  }, []);

  return (
    <section
      ref={root}
      id="raume"
      className="relative w-full overflow-hidden bg-[#07060b] py-24 text-[#f4f1f7] md:py-36"
    >
      {/* Ambient wash */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 50% at 12% 0%, rgba(95,48,195,0.12) 0%, transparent 60%), radial-gradient(50% 40% at 100% 100%, rgba(95,48,195,0.10) 0%, transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-[1320px] px-6 md:px-12">
        {/* HEADING */}
        <div data-headwrap className="mb-14 flex flex-col gap-8 md:mb-20 md:flex-row md:items-end md:justify-between">
          <div>
            <p
              data-head
              className="mb-5 flex items-center gap-3"
              style={{
                fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
                fontSize: "11px",
                letterSpacing: "0.32em",
                fontWeight: 600,
                color: "rgba(244,241,247,0.55)",
              }}
            >
              <span className="inline-block h-px w-8" style={{ background: "rgba(122,76,255,0.8)" }} />
              RÄUME · ATMOSPHÄRE
            </p>
            <h2
              data-head
              className="font-serif-editorial"
              style={{ fontSize: "clamp(38px,5.6vw,86px)", lineHeight: 1.0, fontWeight: 300, color: "#efeaf6" }}
            >
              Der Raum<br />
              <span className="italic">trainiert mit.</span>
            </h2>
          </div>
          <p
            data-head
            className="max-w-[340px]"
            style={{
              fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
              fontSize: "14px",
              lineHeight: 1.7,
              color: "rgba(244,241,247,0.60)",
            }}
          >
            Atmosphäre für Leistung. Jede Zone in SmileFit ist auf Fokus, Kraft und Conditioning ausgelegt.
          </p>
        </div>

        {/* GALLERY GRID */}
        <div className="grid grid-cols-1 gap-4 md:auto-rows-[230px] md:grid-cols-12 md:gap-5">
          {TILES.map((t) => (
            <article
              key={t.src}
              data-tile
              data-wipe={t.wipeDir}
              className={`group relative overflow-hidden bg-[#0d0b12] ${t.area}`}
              style={{ willChange: "clip-path, transform" }}
            >
              {/* Image */}
              <div
                data-tileimg
                className="absolute inset-[-8%] bg-cover bg-center"
                style={{ backgroundImage: `url('${t.src}')`, willChange: "transform" }}
              />

              {/* Dark veil — lifted during reveal */}
              <div
                data-veil
                className="pointer-events-none absolute inset-0 bg-[#050308]"
                style={{ willChange: "opacity", zIndex: 1 }}
              />

              {/* Legibility grade */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  zIndex: 2,
                  background:
                    "linear-gradient(180deg, rgba(7,6,11,0.05) 0%, transparent 30%, rgba(7,6,11,0.25) 60%, rgba(7,6,11,0.88) 100%)",
                }}
              />

              {/* Hover purple border glow */}
              <div
                data-glow-border
                className="pointer-events-none absolute inset-0 opacity-0"
                style={{ zIndex: 3, boxShadow: "inset 0 0 0 2px rgba(122,76,255,0.75), inset 0 0 40px rgba(122,76,255,0.18)" }}
              />

              {/* Label */}
              <div
                data-tilelabel
                className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 md:p-6"
                style={{ zIndex: 4 }}
              >
                <div>
                  <p
                    className="mb-1"
                    style={{
                      fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
                      fontSize: "10px",
                      letterSpacing: "0.28em",
                      fontWeight: 600,
                      color: "rgba(244,241,247,0.55)",
                    }}
                  >
                    {t.caption}
                  </p>
                  <h3
                    className="font-display"
                    style={{ fontSize: "clamp(22px,2.2vw,34px)", letterSpacing: "-0.01em", color: "#f7f4fb" }}
                  >
                    {t.label}
                  </h3>
                </div>
                <span
                  style={{
                    fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
                    fontSize: "11px",
                    letterSpacing: "0.2em",
                    fontWeight: 600,
                    color: "rgba(244,241,247,0.40)",
                  }}
                >
                  / {t.index}
                </span>
              </div>
            </article>
          ))}
        </div>

        {/* VIDEO INTERLUDE */}
        <div
          data-interlude
          className="relative mt-5 aspect-[21/9] w-full overflow-hidden bg-black"
          style={{ willChange: "clip-path, transform, opacity" }}
        >
          <video
            className="absolute inset-0 h-full w-full object-cover"
            style={{ filter: "brightness(0.72) saturate(1.05)" }}
            src="/media/hero-b.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(90% 120% at 50% 50%, transparent 38%, rgba(7,6,11,0.75) 100%)" }}
          />
          <div
            data-interlude-text
            className="absolute inset-0 flex flex-col items-center justify-center text-center"
            style={{ willChange: "transform, opacity" }}
          >
            <p
              className="mb-3"
              style={{
                fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
                fontSize: "11px",
                letterSpacing: "0.34em",
                fontWeight: 600,
                color: "rgba(244,241,247,0.65)",
              }}
            >
              BUILT FOR FOCUS
            </p>
            <p
              className="font-serif-editorial px-6"
              style={{ fontSize: "clamp(26px,4vw,60px)", lineHeight: 1.05, fontWeight: 300, color: "#f4f1f7" }}
            >
              Atmosphäre für <span className="italic">Leistung.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
