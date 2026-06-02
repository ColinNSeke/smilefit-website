"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const TEXT = "ENTER DIFFERENT ◆ LEAVE STRONGER ◆ KEIN STANDARD ◆ KEIN ZUFALL ◆ BUILT DIFFERENT ◆ ";

export default function MarqueeBand() {
  const track = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !track.current) return;

    const el = track.current;
    const singleWidth = el.scrollWidth / 2;

    const tween = gsap.to(el, {
      x: -singleWidth,
      duration: singleWidth / 80, // ~80px/s
      ease: "none",
      repeat: -1,
      modifiers: {
        x: gsap.utils.unitize((v: number) => parseFloat(v) % singleWidth),
      },
    });

    return () => tween.kill();
  }, []);

  const repeated = TEXT.repeat(6);

  return (
    <div
      className="relative w-full overflow-hidden bg-[#08080a] py-5"
      style={{ borderTop: "1px solid rgba(122,76,255,0.22)", borderBottom: "1px solid rgba(122,76,255,0.22)" }}
      aria-hidden
    >
      <div
        ref={track}
        className="flex whitespace-nowrap will-change-transform"
        style={{
          fontFamily: "'Arial Black', 'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontWeight: 900,
          fontSize: "clamp(14px, 2vw, 22px)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "#f2efe6",
        }}
      >
        <span>{repeated}</span>
        <span aria-hidden>{repeated}</span>
      </div>
    </div>
  );
}
