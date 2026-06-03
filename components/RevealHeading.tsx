"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import SplitType from "split-type";
import { prefersReducedMotion } from "@/lib/lenis";

type Props = {
  children: React.ReactNode;
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
    gsap.registerPlugin(ScrollTrigger, CustomEase);

    if (prefersReducedMotion()) return;

    const split = new SplitType(el, { types: "words" });
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

    const ease = CustomEase.create("smilefitHeadingReveal", "0.22,1,0.36,1");
    gsap.set(words, { yPercent: 110 });
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 75%",
      once: true,
      onEnter: () => {
        gsap.to(words, {
          yPercent: 0,
          duration: 0.9,
          ease,
          stagger,
        });
      },
    });

    return () => {
      st.kill();
      split.revert();
    };
  }, [children, stagger]);

  return React.createElement(as, { ref, className, style }, children);
}
