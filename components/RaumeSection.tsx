"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type Tile = {
  src: string;
  label: string;
  index: string;
  caption: string;
  area: string; // grid placement classes
};

const TILES: Tile[] = [
  {
    src: "/media/gym-02.jpg",
    label: "System",
    index: "01",
    caption: "Hauptfläche · 2.200m²",
    area: "md:col-span-5 md:row-span-2",
  },
  {
    src: "/media/gym-05.jpg",
    label: "Training",
    index: "02",
    caption: "Free Weights · Hardcore Area",
    area: "md:col-span-4",
  },
  {
    src: "/media/gym-06.jpg",
    label: "Kraft",
    index: "03",
    caption: "Hammer Strength",
    area: "md:col-span-3 md:row-span-2",
  },
  {
    src: "/media/gym-04.jpg",
    label: "Performance",
    index: "04",
    caption: "Funktional · Conditioning",
    area: "md:col-span-4",
  },
];

export default function RaumeSection() {
  const root = useRef<HTMLElement | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      if (reduce) {
        gsap.set("[data-tile], [data-head], [data-tileimg], [data-tilelabel], [data-veil]", {
          opacity: 1,
          clipPath: "inset(0% 0%)",
          scale: 1,
          y: 0,
        });
        gsap.set("[data-veil]", { opacity: 0 });
        return;
      }

      // Heading reveal — strong upward + blur-to-sharp
      gsap.set("[data-head]", { opacity: 0, y: 52, filter: "blur(8px)" });
      gsap.to("[data-head]", {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        duration: 1.1,
        ease: "power3.out",
        stagger: 0.14,
        scrollTrigger: { trigger: "[data-headwrap]", start: "top 82%" },
      });

      // Staggered tile mask-wipe reveals — images "open from darkness"
      gsap.utils.toArray<HTMLElement>("[data-tile]").forEach((tile) => {
        const img = tile.querySelector<HTMLElement>("[data-tileimg]");
        const veil = tile.querySelector<HTMLElement>("[data-veil]");
        const label = tile.querySelector<HTMLElement>("[data-tilelabel]");

        const tl = gsap.timeline({ scrollTrigger: { trigger: tile, start: "top 88%" } });
        tl.fromTo(
          tile,
          { clipPath: "inset(0% 0% 100% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "expo.out" },
          0
        );
        if (img) tl.fromTo(img, { scale: 1.45 }, { scale: 1.0, duration: 1.5, ease: "expo.out" }, 0);
        if (veil) tl.fromTo(veil, { opacity: 1 }, { opacity: 0, duration: 1.3, ease: "power2.out" }, 0.1);
        if (label) tl.from(label, { y: 26, opacity: 0, duration: 0.8, ease: "power3.out" }, 0.5);

        if (img) {
          gsap.to(img, {
            yPercent: 16,
            ease: "none",
            scrollTrigger: { trigger: tile, start: "top bottom", end: "bottom top", scrub: true },
          });
        }
      });

      // 3D tilt + image drift on hover (pointer devices)
      if (window.matchMedia("(hover: hover)").matches) {
        gsap.utils.toArray<HTMLElement>("[data-tile]").forEach((tile) => {
          const img = tile.querySelector<HTMLElement>("[data-tileimg]");
          const qrx = gsap.quickTo(tile, "rotateX", { duration: 0.5, ease: "power2.out" });
          const qry = gsap.quickTo(tile, "rotateY", { duration: 0.5, ease: "power2.out" });
          gsap.set(tile, { transformPerspective: 900, transformOrigin: "center" });
          const onMove = (e: MouseEvent) => {
            const r = tile.getBoundingClientRect();
            const nx = (e.clientX - r.left) / r.width - 0.5;
            const ny = (e.clientY - r.top) / r.height - 0.5;
            qry(nx * 9);
            qrx(ny * -9);
            if (img) gsap.to(img, { x: nx * -18, y: ny * -18, duration: 0.5, ease: "power2.out" });
          };
          const onLeave = () => {
            qrx(0);
            qry(0);
            if (img) gsap.to(img, { x: 0, y: 0, duration: 0.6, ease: "power2.out" });
          };
          tile.addEventListener("mousemove", onMove);
          tile.addEventListener("mouseleave", onLeave);
        });
      }

      // Video interlude — scale-in reveal
      gsap.fromTo(
        "[data-interlude]",
        { clipPath: "inset(14% 10% round 0px)", opacity: 0.5 },
        {
          clipPath: "inset(0% 0% round 0px)",
          opacity: 1,
          duration: 1.4,
          ease: "power3.inOut",
          scrollTrigger: { trigger: "[data-interlude]", start: "top 82%" },
        }
      );
    }, root);

    const refreshT = window.setTimeout(() => ScrollTrigger.refresh(), 600);
    if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    return () => {
      window.clearTimeout(refreshT);
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={root}
      id="raume"
      className="relative w-full overflow-hidden bg-[#07060b] py-24 text-[#f4f1f7] md:py-36"
    >
      {/* Ambient violet wash */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 50% at 12% 0%, rgba(95,48,195,0.10) 0%, transparent 60%), radial-gradient(50% 40% at 100% 100%, rgba(95,48,195,0.08) 0%, transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-[1320px] px-6 md:px-12">
        {/* ===== Heading ===== */}
        <div data-headwrap className="mb-14 flex flex-col gap-8 md:mb-20 md:flex-row md:items-end md:justify-between">
          <div>
            <p
              data-head
              className="mb-5 flex items-center gap-3"
              style={{
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontSize: "11px",
                letterSpacing: "0.32em",
                fontWeight: 600,
                color: "rgba(244,241,247,0.55)",
              }}
            >
              <span className="inline-block h-px w-8" style={{ background: "rgba(122,76,255,0.6)" }} />
              RÄUME · ATMOSPHÄRE
            </p>
            <h2
              data-head
              className="font-serif-editorial"
              style={{ fontSize: "clamp(38px, 5.6vw, 86px)", lineHeight: 1.0, fontWeight: 300, color: "#efeaf6" }}
            >
              Der Raum
              <br />
              <span className="italic">trainiert mit.</span>
            </h2>
          </div>
          <p
            data-head
            className="max-w-[340px]"
            style={{
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontSize: "14px",
              lineHeight: 1.7,
              fontWeight: 400,
              color: "rgba(244,241,247,0.60)",
            }}
          >
            Atmosphäre für Leistung. Jede Zone in SmileFit ist auf Fokus, Kraft und
            Conditioning ausgelegt — Training ohne Zufall.
          </p>
        </div>

        {/* ===== Editorial gallery grid ===== */}
        <div className="grid grid-cols-1 gap-4 md:auto-rows-[230px] md:grid-cols-12 md:gap-5">
          {TILES.map((t) => (
            <article
              key={t.src}
              data-tile
              className={`group relative overflow-hidden bg-[#0d0b12] ${t.area}`}
              style={{ willChange: "clip-path" }}
            >
              <div
                data-tileimg
                className="absolute inset-[-8%] bg-cover bg-center"
                style={{ backgroundImage: `url('${t.src}')`, willChange: "transform" }}
              />
              {/* Darkness veil that lifts on reveal */}
              <div
                data-veil
                className="pointer-events-none absolute inset-0 bg-[#050308]"
                style={{ willChange: "opacity" }}
              />
              {/* Legibility grade */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(7,6,11,0.10) 0%, transparent 30%, rgba(7,6,11,0.20) 60%, rgba(7,6,11,0.86) 100%)",
                }}
              />
              {/* Violet edge on hover */}
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ boxShadow: "inset 0 0 0 1px rgba(122,76,255,0.5)" }}
              />
              {/* Label */}
              <div data-tilelabel className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 md:p-6">
                <div>
                  <p
                    className="mb-1"
                    style={{
                      fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
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
                    style={{ fontSize: "clamp(22px, 2.2vw, 34px)", letterSpacing: "-0.01em", color: "#f7f4fb" }}
                  >
                    {t.label}
                  </h3>
                </div>
                <span
                  style={{
                    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
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

        {/* ===== Cinematic video interlude ===== */}
        <div
          data-interlude
          className="relative mt-5 aspect-[21/9] w-full overflow-hidden bg-black md:mt-5"
          style={{ willChange: "clip-path" }}
        >
          <video
            className="absolute inset-0 h-full w-full object-cover"
            style={{ filter: "brightness(0.78) saturate(1.05)" }}
            src="/media/hero-b.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(90% 120% at 50% 50%, transparent 40%, rgba(7,6,11,0.7) 100%)" }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p
              className="mb-3"
              style={{
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontSize: "11px",
                letterSpacing: "0.34em",
                fontWeight: 600,
                color: "rgba(244,241,247,0.62)",
              }}
            >
              BUILT FOR FOCUS
            </p>
            <p
              className="font-serif-editorial px-6"
              style={{ fontSize: "clamp(26px, 4vw, 60px)", lineHeight: 1.05, fontWeight: 300, color: "#f4f1f7" }}
            >
              Atmosphäre für <span className="italic">Leistung.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
