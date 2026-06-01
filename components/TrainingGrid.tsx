"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Media } from "./Media";

type Card = {
  title: string;
  meta: string;
  src: string;
  video?: boolean;
  className: string;
  index: string;
};

const CARDS: Card[] = [
  {
    index: "01",
    title: "KRAFT",
    meta: "2026 / SMILEFIT",
    src: "/media/gym-01.jpg",
    className:
      "md:col-span-7 md:col-start-1 md:row-start-1 aspect-[4/5] md:aspect-[5/6]",
  },
  {
    index: "02",
    title: "CONDITIONING",
    meta: "TURF / PERFORMANCE",
    src: "/media/gym-02.jpg",
    className:
      "md:col-span-5 md:col-start-8 md:row-start-1 md:mt-[28vh] aspect-[3/4]",
  },
  {
    index: "03",
    title: "COACHING",
    meta: "PERSONAL / SYSTEM",
    src: "/media/hero-b.mp4",
    video: true,
    className:
      "md:col-span-6 md:col-start-2 md:row-start-2 aspect-[4/3]",
  },
  {
    index: "04",
    title: "TURF",
    meta: "SLED / ATHLETIC",
    src: "/media/gym-03.jpg",
    className:
      "md:col-span-4 md:col-start-9 md:row-start-2 md:mt-[10vh] aspect-[3/4]",
  },
  {
    index: "05",
    title: "MASCHINEN",
    meta: "HAMMER / STRENGTH",
    src: "/media/gym-04.jpg",
    className:
      "md:col-span-5 md:col-start-1 md:row-start-3 aspect-[4/5]",
  },
  {
    index: "06",
    title: "ATMOSPHÄRE",
    meta: "NEON / CHROME",
    src: "/media/gym-06.jpg",
    className:
      "md:col-span-6 md:col-start-7 md:row-start-3 md:mt-[14vh] aspect-[5/4]",
  },
];

export default function TrainingGrid() {
  const root = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-card]");
      cards.forEach((card) => {
        const media = card.querySelector("[data-card-media]");
        const title = card.querySelector("[data-card-title]");
        const meta = card.querySelector("[data-card-meta]");

        gsap.from(media, {
          clipPath: "inset(100% 0 0 0)",
          duration: 1.2,
          ease: "expo.out",
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
          },
        });

        gsap.from([title, meta], {
          y: 30,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: {
            trigger: card,
            start: "top 80%",
          },
        });
      });

      gsap.from("[data-grid-title]", {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: root.current,
          start: "top 75%",
        },
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      id="training"
      className="relative w-full bg-[#050505] px-6 pb-32 pt-24 text-[#f2efe6] md:px-10 md:pb-48 md:pt-32"
    >
      {/* Section header */}
      <div
        data-grid-title
        className="mb-16 flex items-end justify-between gap-8 md:mb-28"
      >
        <div>
          <span className="font-mono-label text-[#f2efe6]/60">
            ⓘ TRAINING / SYSTEM
          </span>
          <h2 className="mt-4 font-display text-[14vw] leading-[0.85] md:text-[clamp(80px,8vw,160px)]">
            BUILT
            <br />
            DIFFERENT.
          </h2>
        </div>
        <span className="hidden font-mono-label text-[#f2efe6]/50 md:block">
          06 PROGRAMME
          <br />
          ENTER DIFFERENT. LEAVE STRONGER.
        </span>
      </div>

      <div className="grid grid-cols-1 gap-y-16 md:grid-cols-12 md:gap-x-6 md:gap-y-24">
        {CARDS.map((card) => (
          <article
            key={card.index}
            data-card
            className={`group relative ${card.className}`}
          >
            <div
              data-card-media
              className="relative h-full w-full overflow-hidden"
            >
              <Media
                src={card.src}
                video={card.video}
                alt={card.title}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
            </div>

            <div className="mt-5 flex items-start justify-between gap-6">
              <div>
                <span
                  data-card-meta
                  className="block font-mono-label text-[#f2efe6]/50"
                >
                  ({card.index})
                </span>
                <h3
                  data-card-title
                  className="mt-2 font-display text-[10vw] leading-[0.9] md:text-[clamp(36px,3.6vw,72px)]"
                >
                  {card.title}
                </h3>
              </div>
              <span
                data-card-meta
                className="shrink-0 text-right font-mono-label text-[#f2efe6]/50"
              >
                {card.meta}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
