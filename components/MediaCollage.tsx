"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Media } from "./Media";

type Tile = {
  src: string;
  video?: boolean;
  className: string;
  speed: number;
  alt: string;
};

const TILES: Tile[] = [
  {
    src: "/media/hero-b.mp4",
    video: true,
    alt: "Gym atmosphere",
    className:
      "left-[4%] top-[8%] w-[34vw] aspect-[3/4] md:w-[22vw] md:aspect-[4/5]",
    speed: -60,
  },
  {
    src: "/media/gym-01.jpg",
    alt: "Hammer Strength floor",
    className:
      "right-[5%] top-[4%] w-[40vw] aspect-[4/5] md:w-[26vw] md:aspect-[3/4]",
    speed: -110,
  },
  {
    src: "/media/gym-02.jpg",
    alt: "Sled push turf",
    className:
      "left-[18%] top-[44%] w-[42vw] aspect-[4/3] md:w-[28vw] md:aspect-[4/3]",
    speed: -40,
  },
  {
    src: "/media/gym-03.jpg",
    alt: "Rooftop training",
    className:
      "right-[12%] top-[48%] w-[36vw] aspect-[3/4] md:w-[22vw] md:aspect-[5/6]",
    speed: -150,
  },
  {
    src: "/media/gym-04.jpg",
    alt: "Cable grip",
    className:
      "left-[8%] bottom-[6%] w-[30vw] aspect-[1/1] md:w-[18vw] md:aspect-[1/1]",
    speed: -80,
  },
  {
    src: "/media/gym-05.jpg",
    alt: "Dumbbell rack",
    className:
      "right-[6%] bottom-[10%] w-[38vw] aspect-[4/5] md:w-[24vw] md:aspect-[4/5]",
    speed: -120,
  },
];

export default function MediaCollage() {
  const root = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Background flip on enter
      gsap.fromTo(
        root.current,
        { backgroundColor: "#f2efe6" },
        {
          backgroundColor: "#050505",
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top 80%",
            end: "top 30%",
            scrub: true,
          },
        }
      );

      // Tile entrance stagger
      gsap.from("[data-tile]", {
        opacity: 0,
        y: 60,
        scale: 0.95,
        duration: 1.1,
        ease: "expo.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: root.current,
          start: "top 70%",
        },
      });

      // Parallax per tile
      const tiles = gsap.utils.toArray<HTMLElement>("[data-tile]");
      tiles.forEach((tile) => {
        const speed = parseFloat(tile.dataset.speed || "-60");
        gsap.to(tile, {
          y: speed,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      });

      // Label fade
      gsap.from("[data-collage-label]", {
        opacity: 0,
        y: 24,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: root.current,
          start: "top 65%",
        },
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      className="relative w-full overflow-hidden bg-[#f2efe6] text-[#f2efe6]"
      style={{ minHeight: "150vh" }}
    >
      {/* Section label */}
      <div
        data-collage-label
        className="sticky top-0 z-20 flex items-start justify-between px-6 pt-8 md:px-10 md:pt-12"
      >
        <span className="font-mono-label text-[#f2efe6]/70">
          ATMOSPHÄRE — 01 / 06
        </span>
        <span className="font-mono-label text-[#f2efe6]/70">
          NO SOFT REPS
        </span>
      </div>

      {/* Editorial center heading */}
      <div className="pointer-events-none relative z-10 flex min-h-[60vh] items-center justify-center px-6">
        <h2
          data-collage-label
          className="font-display text-center text-[18vw] leading-[0.85] md:text-[clamp(120px,12vw,220px)]"
        >
          NEON.
          <br />
          CHROME.
        </h2>
      </div>

      {/* Floating tiles overlay */}
      <div className="relative h-[100vh] w-full">
        {TILES.map((t, i) => (
          <div
            key={i}
            data-tile
            data-speed={t.speed}
            className={`absolute overflow-hidden ${t.className}`}
          >
            <Media
              src={t.src}
              video={t.video}
              alt={t.alt}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Footer line */}
      <div className="relative z-10 flex items-end justify-between px-6 pb-10 md:px-10 md:pb-14">
        <span className="font-mono-label text-[#f2efe6]/60">
          TRAIN HARD. STAY SHARP.
        </span>
        <span className="font-mono-label text-[#f2efe6]/60">
          SMILEFIT / 2026
        </span>
      </div>
    </section>
  );
}
