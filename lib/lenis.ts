"use client";

import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Single source of truth for smooth scroll.
 * Every scroll-linked animation in the site consumes this one instance
 * (or, under prefers-reduced-motion, falls back to native scroll while
 * ScrollTrigger still drives timelines).
 */

let lenis: Lenis | null = null;
let started = false;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 768px)").matches;
}

export function getLenis(): Lenis | null {
  return lenis;
}

export function initLenis(): Lenis | null {
  if (started) return lenis;
  started = true;

  gsap.registerPlugin(ScrollTrigger);

  if (prefersReducedMotion()) {
    // Native scroll; still bridge ScrollTrigger so reveals work.
    ScrollTrigger.refresh();
    return null;
  }

  lenis = new Lenis({
    duration: isMobile() ? 0.8 : 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.5,
  });

  lenis.on("scroll", ScrollTrigger.update);

  const raf = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

export function destroyLenis() {
  if (lenis) {
    lenis.destroy();
    lenis = null;
  }
  started = false;
}
