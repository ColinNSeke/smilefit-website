"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Media } from "./Media";

type Item = {
  src: string;
  label: string;
  index: string;
  size: "lg" | "md" | "tall" | "wide";
};

const ITEMS: Item[] = [
  { src: "/media/gym-01.jpg", label: "HAMMER FLOOR", index: "01", size: "lg" },
  { src: "/media/gym-02.jpg", label: "SLED TRACK", index: "02", size: "tall" },
  { src: "/media/gym-03.jpg", label: "ROOFTOP / SUNSET", index: "03", size: "wide" },
  { src: "/media/gym-04.jpg", label: "GRIP / CABLE", index: "04", size: "tall" },
  { src: "/media/gym-05.jpg", label: "NEON RACK", index: "05", size: "lg" },
  { src: "/media/gym-06.jpg", label: "ATMOSPHÄRE", index: "06", size: "md" },
  { src: "/media/gym-07.jpg", label: "DETAIL / CHROME", index: "07", size: "tall" },
  { src: "/media/gym-08.jpg", label: "ENTRY", index: "08", size: "wide" },
];

function sizeClass(size: Item["size"]) {
  switch (size) {
    case "tall":
      return "h-[78vh] w-[40vh] md:w-[44vh]";
    case "wide":
      return "h-[60vh] w-[88vh] md:w-[100vh]";
    case "md":
      return "h-[60vh] w-[50vh]";
    case "lg":
    default:
      return "h-[72vh] w-[60vh]";
  }
}

export default function HorizontalGallery() {
  const root = useRef<HTMLElement | null>(null);
  const track = useRef<HTMLDivElement | null>(null);
  const progress = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!track.current || !root.current) return;

      const getDistance = () =>
        track.current!.scrollWidth - window.innerWidth;

      const tween = gsap.to(track.current, {
        x: () => -getDistance(),
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: () => `+=${getDistance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      if (progress.current) {
        gsap.fromTo(
          progress.current,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: () => `+=${getDistance()}`,
              scrub: true,
            },
          }
        );
      }

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      id="raume"
      className="relative w-full overflow-hidden bg-[#f2efe6] text-[#050505]"
      style={{ height: "100vh" }}
    >
      {/* Header overlay */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between px-6 pt-8 md:px-10 md:pt-12">
        <span className="font-mono-label">RÄUME / ATMOSPHÄRE</span>
        <span className="font-mono-label">DER RAUM TRAINIERT MIT.</span>
      </div>

      {/* Horizontal track */}
      <div
        ref={track}
        className="absolute inset-y-0 left-0 flex items-center gap-6 pl-6 pr-[20vw] md:gap-10 md:pl-10"
        style={{ willChange: "transform" }}
      >
        {/* Intro title block as first item */}
        <div className="flex h-[78vh] w-[80vh] shrink-0 flex-col justify-between py-10">
          <span className="font-mono-label text-[#050505]/60">
            GALLERY — 03
          </span>
          <h2 className="font-display text-[12vw] leading-[0.86] md:text-[clamp(80px,8vw,160px)]">
            DER
            <br />
            RAUM
            <br />
            TRAINIERT
            <br />
            MIT.
          </h2>
          <span className="font-mono-label text-[#050505]/60">
            08 RÄUME — SCROLL →
          </span>
        </div>

        {ITEMS.map((it) => (
          <figure
            key={it.index}
            className={`relative shrink-0 overflow-hidden ${sizeClass(it.size)}`}
          >
            <Media
              src={it.src}
              alt={it.label}
              className="h-full w-full object-cover"
            />
            <figcaption className="absolute inset-x-4 bottom-4 flex items-end justify-between text-[#f2efe6]">
              <span className="font-mono-label">{it.label}</span>
              <span className="font-mono-label">({it.index})</span>
            </figcaption>
          </figure>
        ))}
      </div>

      {/* Progress bar */}
      <div className="pointer-events-none absolute inset-x-6 bottom-6 z-20 md:inset-x-10 md:bottom-10">
        <div className="flex items-center gap-4">
          <span className="font-mono-label text-[#050505]/60">PROGRESS</span>
          <div className="relative h-px flex-1 bg-[#050505]/20">
            <div
              ref={progress}
              className="absolute inset-y-0 left-0 origin-left bg-[#050505]"
              style={{ width: "100%", transform: "scaleX(0)" }}
            />
          </div>
          <span className="font-mono-label text-[#050505]/60">08</span>
        </div>
      </div>
    </section>
  );
}
