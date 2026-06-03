"use client";

/**
 * Scroll-scrubbed 3D Bezier letter-flight headline.
 *
 * All letters share a single origin point in the lower-left. Each flies along
 * its own quadratic Bezier path to its natural reading position, tumbling on
 * all three rotation axes and stretching during fast portions of flight.
 * Fully bidirectional — scroll back reverses letters to origin.
 */

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion, isMobile } from "@/lib/lenis";
import { bezierPoint, lerpVec3, clamp, easeOutBack, seededRandom, vec3Distance, type Vec3 } from "@/lib/bezier";

/* ── Configuration ── */
const ORIGIN: Vec3 = { x: -200, y: 350, z: -400 };
const LETTER_DURATION = 0.18;
const LETTER_STAGGER  = 0.025;
/* easeOutBack kicks in for last 15% of each letter's local progress */
const SPRING_THRESHOLD = 0.85;

/* Pre-computed per-letter data (filled once at mount). */
type LetterData = {
  el: HTMLElement;
  /** translate3d values at t=0 (moves letter to shared ORIGIN in screen space) */
  startOffset: Vec3;
  /** always {0,0,0} — natural layout position */
  endOffset: Vec3;
  /** bezier control point (in offset/transform space) */
  controlOffset: Vec3;
  /** initial rotation (degrees), unwinds to 0 */
  initRot: Vec3;
  /** stagger start in global progress [0,1] */
  progStart: number;
  /** stagger end in global progress [0,1] */
  progEnd: number;
  /** is this letter part of line 2 (for gradient coloring) */
  line2: boolean;
  /** fraction along line2 for gradient [0,1] */
  line2Frac: number;
};

/* Interpolate hex color — used for per-letter line-2 gradient */
function lerpColor(a: [number,number,number], b: [number,number,number], t: number): string {
  const r = Math.round(a[0] + (b[0]-a[0])*t);
  const g = Math.round(a[1] + (b[1]-a[1])*t);
  const bl = Math.round(a[2] + (b[2]-a[2])*t);
  return `rgb(${r},${g},${bl})`;
}
const COLOR_WHITE:  [number,number,number] = [237, 234, 227]; // #EDEAE3
const COLOR_PURPLE: [number,number,number] = [107,  63, 184]; // #6B3FB8

export default function BezierLetterFlight() {
  const stageRef  = useRef<HTMLDivElement | null>(null);
  const line1Ref  = useRef<HTMLDivElement | null>(null);
  const line2Ref  = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stage  = stageRef.current;
    const line1  = line1Ref.current;
    const line2  = line2Ref.current;
    if (!stage || !line1 || !line2) return;

    const reduced = prefersReducedMotion() || isMobile();

    /* ── Static fallback ── */
    if (reduced) {
      [line1, line2].forEach(el => {
        el.style.opacity = "1";
        el.style.visibility = "visible";
      });
      return;
    }

    /* ── Split text into per-char spans ── */
    const splitEl = (container: HTMLElement): HTMLElement[] => {
      const text = container.dataset.text ?? container.textContent ?? "";
      container.textContent = "";
      return text.split("").map(char => {
        const span = document.createElement("span");
        span.textContent = char;
        span.style.display = "inline-block";
        span.style.transformStyle = "preserve-3d";
        span.style.willChange = "transform, opacity";
        span.setAttribute("aria-hidden", "true");
        container.appendChild(span);
        return span;
      });
    };

    const chars1 = splitEl(line1);
    const chars2 = splitEl(line2);

    /* Make container visible for measurement */
    stage.style.opacity  = "1";
    stage.style.visibility = "visible";
    /* Set all chars transparent for first-frame init */
    [...chars1, ...chars2].forEach(c => { c.style.opacity = "0"; });

    /* ── Measure final positions (after layout) ── */
    const containerRect = stage.getBoundingClientRect();

    const buildData = (
      chars: HTMLElement[],
      line2: boolean,
      globalIndexStart: number,
    ): LetterData[] => {
      const animatable = chars.filter(c => c.textContent !== " ").length;
      let ai = 0; // animatable index for gradient fraction

      return chars.map((el, localI) => {
        const isSpace = el.textContent === " " || el.textContent === "";
        const rect = el.getBoundingClientRect();
        const finalX = rect.left - containerRect.left;
        const finalY = rect.top  - containerRect.top;

        /* How far this letter is from origin in container space */
        const startOffset: Vec3 = {
          x: ORIGIN.x - finalX,
          y: ORIGIN.y - finalY,
          z: ORIGIN.z,
        };
        const endOffset: Vec3 = { x: 0, y: 0, z: 0 };

        /* Control point: midpoint of start→end, arc upward, briefly overshoot Z */
        const controlOffset: Vec3 = {
          x: (startOffset.x + endOffset.x) / 2,
          y: startOffset.y - 220,  // arc upward
          z: startOffset.z / 2 + 160,
        };

        const gi = globalIndexStart + localI;
        const initRot: Vec3 = {
          x: 45 + seededRandom(gi)     * 50 - 25,  // 20°–70°
          y: 90 + seededRandom(gi+100) * 60 - 30,  // 60°–120°
          z: seededRandom(gi+200)      * 40 - 20,  // -20°–20°
        };

        const progStart = isSpace ? 0 : gi * LETTER_STAGGER;
        const progEnd   = progStart + LETTER_DURATION;

        const line2Frac = (line2 && animatable > 1) ? ai / (animatable - 1) : 0;
        if (!isSpace && line2) ai++;

        if (line2) {
          el.style.color = lerpColor(COLOR_WHITE, COLOR_PURPLE, line2Frac);
        } else {
          el.style.color = "#EDEAE3";
        }

        return { el, startOffset, endOffset, controlOffset, initRot, progStart, progEnd, line2, line2Frac };
      });
    };

    const line2StartIndex = chars1.length;
    const allData: LetterData[] = [
      ...buildData(chars1, false, 0),
      ...buildData(chars2, true,  line2StartIndex),
    ];

    /* ── Per-letter update ── */
    const ZERO_ROT: Vec3 = { x: 0, y: 0, z: 0 };

    const applyLetter = (d: LetterData, globalProgress: number) => {
      const isSpace = d.el.textContent === " " || d.el.textContent === "";

      /* Spaces: never animate, stay invisible until line is partly formed */
      if (isSpace) {
        const lineStart = d.progStart;
        d.el.style.opacity = globalProgress > lineStart ? "1" : "0";
        d.el.style.transform = "none";
        return;
      }

      let local = clamp(
        (globalProgress - d.progStart) / (d.progEnd - d.progStart),
        0, 1,
      );

      /* Spring ease: linear up to SPRING_THRESHOLD, easeOutBack for remainder */
      let eased: number;
      if (local < SPRING_THRESHOLD) {
        eased = local / SPRING_THRESHOLD * SPRING_THRESHOLD;
      } else {
        const t = (local - SPRING_THRESHOLD) / (1 - SPRING_THRESHOLD);
        eased = SPRING_THRESHOLD + easeOutBack(t) * (1 - SPRING_THRESHOLD);
      }
      eased = clamp(eased, 0, 1.08); // allow slight overshoot but cap it

      /* Bezier position */
      const pos = bezierPoint(d.startOffset, d.controlOffset, d.endOffset, eased);

      /* Velocity stretch: sample path slightly ahead to estimate speed */
      const t2 = clamp(eased + 0.04, 0, 1);
      const posAhead = bezierPoint(d.startOffset, d.controlOffset, d.endOffset, t2);
      const speed = vec3Distance(pos, posAhead);
      const stretch = 1 + Math.min(speed / 180, 0.75);
      /* squash perpendicular to maintain rough volume */
      const squash = 1 / Math.sqrt(stretch);

      /* Rotation tumble */
      const rot = lerpVec3(d.initRot, ZERO_ROT, clamp(eased, 0, 1));

      /* Opacity: fade in quickly at letter start */
      const opacity = local < 0.04 ? 0 : Math.min(1, local * 6);

      d.el.style.opacity = opacity.toFixed(3);
      d.el.style.transform = [
        `translate3d(${pos.x.toFixed(2)}px,${pos.y.toFixed(2)}px,${pos.z.toFixed(2)}px)`,
        `rotateX(${rot.x.toFixed(2)}deg)`,
        `rotateY(${rot.y.toFixed(2)}deg)`,
        `rotateZ(${rot.z.toFixed(2)}deg)`,
        `scaleX(${stretch.toFixed(3)})`,
        `scaleY(${squash.toFixed(3)})`,
      ].join(" ");

      /* Release will-change once fully settled */
      d.el.style.willChange = (local >= 1 && globalProgress < 0.995) ? "auto" : "transform, opacity";
    };

    /* ── RAF-batched render loop ── */
    let currentProgress = 0;
    let rafId = 0;
    let dirty = false;

    const renderAll = () => {
      rafId = 0;
      dirty = false;
      for (const d of allData) applyLetter(d, currentProgress);
    };

    const schedule = () => {
      if (dirty) return;
      dirty = true;
      rafId = requestAnimationFrame(renderAll);
    };

    /* Initial render at progress=0 (letters at ORIGIN) */
    renderAll();

    /* ── ScrollTrigger ── */
    gsap.registerPlugin(ScrollTrigger);
    const hero = stage.closest("section") ?? stage;

    const st = ScrollTrigger.create({
      trigger: hero,
      start: "top top",
      end: "bottom top",
      scrub: 0.4,
      onUpdate: (self) => {
        currentProgress = self.progress;
        schedule();
      },
    });

    const refreshT = setTimeout(() => ScrollTrigger.refresh(), 300);
    if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());

    return () => {
      clearTimeout(refreshT);
      if (rafId) cancelAnimationFrame(rafId);
      st.kill();
    };
  }, []);

  return (
    <div
      ref={stageRef}
      className="pointer-events-none absolute inset-y-0 left-0 z-[3] flex max-w-[700px] flex-col justify-center px-6 md:px-12 lg:px-20"
      style={{
        perspective: "1400px",
        transformStyle: "preserve-3d",
        /* Hidden until mount measures positions; JS makes it visible */
        opacity: 0,
        visibility: "hidden",
      }}
      aria-label="Bring back your prime. One more time."
      role="heading"
      aria-level={1}
    >
      {/* Line 1 */}
      <div
        ref={line1Ref}
        data-text="Bring back your prime."
        className="font-serif-editorial"
        style={{
          fontWeight: 400,
          fontSize: "clamp(56px,6.5vw,112px)",
          lineHeight: 0.95,
          letterSpacing: "-0.01em",
          transformStyle: "preserve-3d",
        }}
      >
        {/* text content injected by JS at mount; static SSR fallback: */}
        Bring back your prime.
      </div>

      {/* Line 2 */}
      <div
        ref={line2Ref}
        data-text="One more time."
        className="font-serif-editorial"
        style={{
          fontWeight: 400,
          fontSize: "clamp(56px,6.5vw,112px)",
          lineHeight: 0.95,
          letterSpacing: "-0.01em",
          transformStyle: "preserve-3d",
        }}
      >
        {/* text content injected by JS at mount; static SSR fallback: */}
        One more time.
      </div>
    </div>
  );
}
