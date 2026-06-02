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
    src: "/image.png",
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
        gsap.set("[data-tile], [data-head]", { opacity: 1, clipPath: "inset(0% 0%)" });
        return;
      }

      // Heading reveal
      gsap.from("[data-head]", {
        y: 40,
        opacity: 0,
        duration: 1.0,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: { trigger: "[data-headwrap]", start: "top 78%" },
      });

      // Staggered clip-path tile reveals
      gsap.utils.toArray<HTMLElement>("[data-tile]").forEach((tile, i) => {
        const img = tile.querySelector<HTMLElement>("[data-tileimg]");
        gsap.fromTo(
          tile,
          { clipPath: "inset(0% 0% 100% 0%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1.1,
            ease: "expo.out",
            scrollTrigger: { trigger: tile, start: "top 86%" },
          }
        );
        if (img) {
          gsap.fromTo(
            img,
            { scale: 1.25 },
            {
              scale: 1.0,
              duration: 1.4,
              ease: "expo.out",
              scrollTrigger: { trigger: tile, start: "top 86%" },
            }
          );
          // Parallax drift while scrolling through
          gsap.to(img, {
            yPercent: 12,
            ease: "none",
            scrollTrigger: { trigger: tile, start: "top bottom", end: "bottom top", scrub: true },
          });
        }
      });

      // Video interlude — scale-in reveal
      gsap.fromTo(
        "[data-interlude]",
        { clipPath: "inset(12% 8% round 0px)", opacity: 0.6 },
        {
          clipPath: "inset(0% 0% round 0px)",
          opacity: 1,
          duration: 1.3,
          ease: "power3.inOut",
          scrollTrigger: { trigger: "[data-interlude]", start: "top 80%" },
        }
      );
    }, root);

    return () => ctx.revert();
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
                className="absolute inset-0 bg-cover bg-center transition-transform duration-[1200ms] ease-out group-hover:scale-[1.06]"
                style={{ backgroundImage: `url('${t.src}')`, willChange: "transform" }}
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
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 md:p-6">
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
