"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";
import { prefersReducedMotion } from "@/lib/lenis";

type Props = {
  children: string;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  style?: React.CSSProperties;
  /** stagger per word, seconds */
  stagger?: number;
};

/**
 * Masked, per-word reveal driven by ScrollTrigger when the heading's top
 * crosses 75% of the viewport. Words rise from behind an overflow clip.
 */
export default function RevealHeading({
  children,
  as = "h2",
  className = "",
  style,
  stagger = 0.04,
}: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);

    const reduce = prefersReducedMotion();
    const split = new SplitType(el, { types: "lines,words" });

    // Wrap each word in an overflow-hidden mask line.
    const words = split.words ?? [];
    words.forEach((w) => {
      const wrap = document.createElement("span");
      wrap.style.display = "inline-block";
      wrap.style.overflow = "hidden";
      wrap.style.verticalAlign = "top";
      w.parentNode?.insertBefore(wrap, w);
      wrap.appendChild(w);
      (w as HTMLElement).style.display = "inline-block";
    });

    if (reduce) {
      gsap.set(words, { yPercent: 0, opacity: 1 });
      return () => split.revert();
    }

    gsap.set(words, { yPercent: 115 });
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 75%",
      once: true,
      onEnter: () => {
        gsap.to(words, {
          yPercent: 0,
          duration: 0.9,
          ease: "expo.out",
          stagger,
        });
      },
    });

    return () => {
      st.kill();
      split.revert();
    };
  }, [children, stagger]);

  const Tag = as as React.ElementType;
  return (
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  );
}
