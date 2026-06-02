"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function MixBlendCursor() {
  const dot = useRef<HTMLDivElement | null>(null);
  const label = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const noHover = window.matchMedia("(hover: none)").matches;
    if (reduce || isMobile || noHover || !dot.current) return;

    const el = dot.current;
    gsap.set(el, { xPercent: -50, yPercent: -50, opacity: 0 });

    const qX = gsap.quickTo(el, "x", { duration: 0.28, ease: "power3.out" });
    const qY = gsap.quickTo(el, "y", { duration: 0.28, ease: "power3.out" });

    const onMove = (e: MouseEvent) => {
      qX(e.clientX);
      qY(e.clientY);
      gsap.to(el, { opacity: 1, duration: 0.2, overwrite: "auto" });
    };
    const onLeave = () => gsap.to(el, { opacity: 0, duration: 0.3, overwrite: "auto" });

    const onEnterInteractive = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const interactive = t.closest("a, button, [data-card], [data-gallery-item]");
      if (!interactive) return;
      const viewLabel = interactive.getAttribute("data-cursor-label") ?? "VIEW";
      if (label.current) label.current.textContent = viewLabel;
      gsap.to(el, { width: 80, height: 80, duration: 0.35, ease: "power3.out", overwrite: "auto" });
    };
    const onLeaveInteractive = () => {
      gsap.to(el, { width: 24, height: 24, duration: 0.3, ease: "power3.out", overwrite: "auto" });
      if (label.current) label.current.textContent = "";
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseover", onEnterInteractive);
    document.addEventListener("mouseout", onLeaveInteractive);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseover", onEnterInteractive);
      document.removeEventListener("mouseout", onLeaveInteractive);
    };
  }, []);

  return (
    <div
      ref={dot}
      className="pointer-events-none fixed left-0 top-0 z-[9999] hidden h-6 w-6 items-center justify-center rounded-full bg-[#f2efe6] mix-blend-difference md:flex"
      style={{ willChange: "transform, width, height" }}
      aria-hidden
    >
      <span
        ref={label}
        className="select-none text-[8px] font-black uppercase tracking-[0.1em] text-[#050505]"
        style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
      />
    </div>
  );
}
