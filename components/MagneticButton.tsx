"use client";

import { useRef, useEffect, forwardRef } from "react";
import { gsap } from "gsap";
import { prefersReducedMotion, isMobile } from "@/lib/lenis";

type Props = {
  children: React.ReactNode;
  href?: string;
  className?: string;
  style?: React.CSSProperties;
  /** label gets a stronger pull than the shell */
  labelClassName?: string;
  dataCursorCta?: boolean;
};

/**
 * Magnetic CTA. Within 80px the shell translates 30% toward the cursor,
 * the inner label 60%. Springs back on leave.
 */
const MagneticButton = forwardRef<HTMLAnchorElement, Props>(function MagneticButton(
  { children, href = "#", className = "", style, labelClassName = "", dataCursorCta = true },
  forwardedRef,
) {
  const localRef = useRef<HTMLAnchorElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = localRef.current;
    const label = labelRef.current;
    if (!el || isMobile() || prefersReducedMotion()) return;

    const RADIUS = 80;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < RADIUS + Math.max(r.width, r.height) / 2) {
        gsap.to(el, { x: dx * 0.3, y: dy * 0.3, duration: 0.4, ease: "power3.out" });
        if (label) gsap.to(label, { x: dx * 0.6, y: dy * 0.6, duration: 0.4, ease: "power3.out" });
      }
    };
    const onLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" });
      if (label) gsap.to(label, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" });
    };

    window.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <a
      ref={(node) => {
        localRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      href={href}
      className={className}
      style={{ willChange: "transform", ...style }}
      {...(dataCursorCta ? { "data-cursor-cta": "" } : {})}
    >
      <span ref={labelRef} className={labelClassName} style={{ display: "inline-flex", alignItems: "center", gap: "1rem", willChange: "transform" }}>
        {children}
      </span>
    </a>
  );
});

export default MagneticButton;
