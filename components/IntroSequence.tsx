"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

const SESSION_KEY = "smilefit_intro_seen";

/**
 * 2.4s cinematic title card. Plays once per session.
 * Hairline rule draws → SMILEFIT outline signs itself → fills →
 * curtain clip-path sweep reveals the hero behind.
 * Reduced-motion: hard cut (renders nothing).
 */
export default function IntroSequence() {
  const [active, setActive] = useState(false);
  const root = useRef<HTMLDivElement | null>(null);
  const rule = useRef<HTMLDivElement | null>(null);
  const textPath = useRef<SVGTextElement | null>(null);
  const logoWrap = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = sessionStorage.getItem(SESSION_KEY);
    if (seen || reduce) return;

    sessionStorage.setItem(SESSION_KEY, "1");
    setActive(true);
  }, []);

  useEffect(() => {
    if (!active) return;
    document.body.style.overflow = "hidden";

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          document.body.style.overflow = "";
          setActive(false);
        },
      });

      // 0.0s — hairline rule draws L→R
      tl.fromTo(
        rule.current,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.6, ease: "expo.out", transformOrigin: "left center" },
        0,
      );

      // 0.4s — signature draw (stroke-dashoffset → 0)
      if (textPath.current) {
        const len = 1400;
        gsap.set(textPath.current, {
          attr: { "stroke-dasharray": len, "stroke-dashoffset": len },
          fillOpacity: 0,
        });
        tl.to(
          textPath.current,
          { attr: { "stroke-dashoffset": 0 }, duration: 1.0, ease: "power2.inOut" },
          0.4,
        );
        // 1.2s — fill with off-white
        tl.to(textPath.current, { fillOpacity: 1, duration: 0.3, ease: "power1.out" }, 1.2);
      }

      // 1.5s — logo + rule scale up & fade, curtain sweep reveals hero
      tl.to([logoWrap.current, rule.current], { scale: 1.04, opacity: 0, duration: 0.9, ease: "power2.in" }, 1.5);
      tl.to(
        root.current,
        { clipPath: "inset(0 0 100% 0)", duration: 1.0, ease: "power4.inOut" },
        1.5,
      );
    }, root);

    return () => {
      document.body.style.overflow = "";
      ctx.revert();
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black"
      style={{ clipPath: "inset(0 0 0% 0)" }}
    >
      <div ref={logoWrap} className="relative flex flex-col items-center" style={{ willChange: "transform, opacity" }}>
        <svg
          viewBox="0 0 600 120"
          width="min(70vw, 600px)"
          height="auto"
          aria-label="SMILEFIT"
          style={{ overflow: "visible" }}
        >
          <text
            ref={textPath}
            x="50%"
            y="50%"
            dominantBaseline="central"
            textAnchor="middle"
            fill="#EDEAE3"
            stroke="#EDEAE3"
            strokeWidth="1"
            style={{
              fontFamily: "Arial Black, Arial, sans-serif",
              fontWeight: 900,
              fontSize: "84px",
              letterSpacing: "0.02em",
            }}
          >
            SMILEFIT
          </text>
        </svg>
      </div>

      {/* hairline rule */}
      <div
        ref={rule}
        className="absolute left-0 top-1/2 h-px w-full"
        style={{ background: "rgba(237,234,227,0.5)", willChange: "transform", transform: "translateY(40px)" }}
      />
    </div>
  );
}
