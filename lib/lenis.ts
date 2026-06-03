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
let tickerCallback: ((time: number) => void) | null = null;
let motionQuery: MediaQueryList | null = null;
let motionChangeHandler: ((event: MediaQueryListEvent) => void) | null = null;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches;
}

export function getLenis(): Lenis | null {
  return lenis;
}

function startLenis(): Lenis | null {
  if (lenis || prefersReducedMotion()) return lenis;
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.5,
  });

  lenis.on("scroll", ScrollTrigger.update);

  tickerCallback = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(tickerCallback);
  gsap.ticker.lagSmoothing(0);
  ScrollTrigger.refresh();

  return lenis;
}

function stopLenis() {
  if (!lenis) return;
  lenis.off("scroll", ScrollTrigger.update);
  lenis.destroy();
  lenis = null;
  if (tickerCallback) {
    gsap.ticker.remove(tickerCallback);
    tickerCallback = null;
  }
}

export function initLenis(): Lenis | null {
  if (started) return lenis;
  started = true;
  gsap.registerPlugin(ScrollTrigger);

  motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  motionChangeHandler = (event) => {
    if (event.matches) {
      stopLenis();
      ScrollTrigger.refresh();
      return;
    }
    startLenis();
  };
  motionQuery.addEventListener("change", motionChangeHandler);

  if (motionQuery.matches) {
    ScrollTrigger.refresh();
    return null;
  }

  return startLenis();
}

export function destroyLenis() {
  stopLenis();
  if (motionQuery && motionChangeHandler) {
    motionQuery.removeEventListener("change", motionChangeHandler);
  }
  motionQuery = null;
  motionChangeHandler = null;
  started = false;
}
