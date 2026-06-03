"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion, isMobile } from "@/lib/lenis";
import {
  bezierPoint,
  lerpRotation,
  clamp,
  easeOutBack,
  type Vec3,
} from "@/lib/bezier";

/* ── Tunable configuration (first-pass values) ── */
const CONFIG = {
  startX: -80,   // negative = from left
  startY: -40,   // negative = from above
  startZ: -600,  // deep behind screen → flies toward viewer

  curveX: 20,    // slight rightward bend
  curveY: -100,  // upward arc mid-flight
  curveZ: 300,   // overshoot forward briefly before settling

  rotateX: 65,   // forward-tipping nod
  rotateY: 35,   // door-swing flip
  rotateZ: -15,  // subtle roll

  staggerSeconds: 0.04,
};

/* Each phrase animates over its own slice of hero scroll progress. */
const PHRASE_WINDOWS = {
  one: { start: 0.05, end: 0.40 },
  two: { start: 0.55, end: 0.90 },
} as const;

/* How much of a phrase's window is "fly-in" vs the residual stagger budget. */
const STAGGER_BUDGET = 0.35; // fraction of window reserved to spread letter starts

type LetterRef = {
  el: HTMLSpanElement;
  /* normalized index within phrase, 0..1, used for stagger offset */
  staggerFrac: number;
};

function buildLetters(
  container: HTMLElement,
  text: string,
  gradient = false,
): LetterRef[] {
  const letters: LetterRef[] = [];
  // Split into per-character spans, preserving spaces as non-animated gaps.
  const chars = text.split("");
  const animatable = chars.filter((c) => c !== " ").length;
  let animIndex = 0;

  for (const char of chars) {
    if (char === " ") {
      const space = document.createElement("span");
      space.textContent = " ";
      space.style.display = "inline-block";
      space.setAttribute("aria-hidden", "true");
      container.appendChild(space);
      continue;
    }
    const span = document.createElement("span");
    span.textContent = char;
    span.className = "bezier-letter";
    span.style.display = "inline-block";
    span.style.transformStyle = "preserve-3d";
    span.style.willChange = "transform, opacity";
    span.setAttribute("aria-hidden", "true");
    if (gradient) {
      // Per-letter gradient — background-clip:text doesn't span child boxes,
      // so the gradient is applied to each letter individually.
      span.style.backgroundImage = "linear-gradient(180deg, #EDEAE3 0%, #6B3FB8 100%)";
      span.style.backgroundClip = "text";
      (span.style as CSSStyleDeclaration & { webkitBackgroundClip?: string }).webkitBackgroundClip = "text";
      (span.style as CSSStyleDeclaration & { webkitTextFillColor?: string }).webkitTextFillColor = "transparent";
      span.style.color = "transparent";
    }
    container.appendChild(span);
    letters.push({
      el: span,
      staggerFrac: animatable > 1 ? animIndex / (animatable - 1) : 0,
    });
    animIndex++;
  }
  return letters;
}

export default function HeroBezierText() {
  const wrap = useRef<HTMLDivElement | null>(null);
  const line1 = useRef<HTMLDivElement | null>(null);
  const line2 = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const c1 = line1.current;
    const c2 = line2.current;
    if (!c1 || !c2) return;

    const reduced = prefersReducedMotion() || isMobile();

    // Build letters into both lines.
    const letters1 = buildLetters(c1, "Bring back your prime.");
    const letters2 = buildLetters(c2, "One more time.", true);

    /* Reduced-motion / mobile → static final headline, no scroll wiring. */
    if (reduced) {
      [...letters1, ...letters2].forEach(({ el }) => {
        el.style.transform = "none";
        el.style.opacity = "1";
        el.style.willChange = "auto";
      });
      return;
    }

    const start: Vec3 = { x: CONFIG.startX, y: CONFIG.startY, z: CONFIG.startZ };
    const control: Vec3 = { x: CONFIG.curveX, y: CONFIG.curveY, z: CONFIG.curveZ };
    const end: Vec3 = { x: 0, y: 0, z: 0 };
    const startRot: Vec3 = { x: CONFIG.rotateX, y: CONFIG.rotateY, z: CONFIG.rotateZ };
    const endRot: Vec3 = { x: 0, y: 0, z: 0 };

    /* Per-letter local progress from the phrase's global window + stagger. */
    const applyPhrase = (
      letters: LetterRef[],
      win: { start: number; end: number },
      globalProgress: number,
    ) => {
      const span = win.end - win.start;
      const staggerSpan = span * STAGGER_BUDGET;
      const flightSpan = span - staggerSpan;

      for (const { el, staggerFrac } of letters) {
        const myStart = win.start + staggerFrac * staggerSpan;
        const myEnd = myStart + flightSpan;
        const raw = clamp((globalProgress - myStart) / (myEnd - myStart), 0, 1);
        // Spring feel: overshoot near the end of each letter's flight.
        const eased = easeOutBack(raw);

        const p = bezierPoint(start, control, end, eased);
        const r = lerpRotation(startRot, endRot, eased);
        const opacity = raw < 0.05 ? 0 : Math.min(1, raw * 4);

        el.style.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, ${p.z.toFixed(2)}px) rotateX(${r.x.toFixed(2)}deg) rotateY(${r.y.toFixed(2)}deg) rotateZ(${r.z.toFixed(2)}deg)`;
        el.style.opacity = opacity.toFixed(3);

        // drop will-change once fully settled & holding to save compositing cost
        if (raw >= 1) el.style.willChange = "auto";
        else el.style.willChange = "transform, opacity";
      }
    };

    let progress = 0;
    let visible = true;
    let rafPending = false;

    const render = () => {
      rafPending = false;
      if (!visible) return;
      applyPhrase(letters1, PHRASE_WINDOWS.one, progress);
      applyPhrase(letters2, PHRASE_WINDOWS.two, progress);
    };

    const schedule = () => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(render);
    };

    gsap.registerPlugin(ScrollTrigger);
    const heroEl = wrap.current?.closest("section") ?? wrap.current;

    const st = ScrollTrigger.create({
      trigger: heroEl,
      start: "top top",
      end: "bottom top",
      scrub: true,
      onUpdate: (self) => {
        progress = self.progress;
        schedule();
      },
    });

    /* Pause work while hero is offscreen. */
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) schedule();
      },
      { threshold: 0 },
    );
    if (heroEl) io.observe(heroEl);

    // initial paint (letters at start positions)
    render();
    const refreshT = setTimeout(() => ScrollTrigger.refresh(), 300);
    if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());

    return () => {
      clearTimeout(refreshT);
      st.kill();
      io.disconnect();
    };
  }, []);

  return (
    <div
      ref={wrap}
      className="bezier-headline pointer-events-none absolute inset-y-0 left-0 z-[2] flex max-w-[760px] flex-col justify-center px-6 md:px-12 lg:px-20"
      style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
      aria-label="Bring back your prime. One more time."
      role="heading"
      aria-level={1}
    >
      <div
        ref={line1}
        className="font-serif-editorial"
        style={{
          fontWeight: 400,
          fontSize: "clamp(56px,6.5vw,112px)",
          lineHeight: 1.05,
          letterSpacing: "-0.01em",
          color: "#EDEAE3",
          transformStyle: "preserve-3d",
        }}
      />
      <div
        ref={line2}
        className="font-serif-editorial"
        style={{
          fontWeight: 400,
          fontSize: "clamp(56px,6.5vw,112px)",
          lineHeight: 1.05,
          letterSpacing: "-0.01em",
          transformStyle: "preserve-3d",
        }}
      />
    </div>
  );
}
