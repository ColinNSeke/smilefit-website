"use client";

import { useRef, useEffect, forwardRef } from "react";
import { prefersReducedMotion, isMobile } from "@/lib/lenis";

type Props = {
  children: React.ReactNode;
  href?: string;
  className?: string;
  style?: React.CSSProperties;
  /** label gets a stronger pull than the shell */
  labelClassName?: string;
  dataCursorCta?: boolean;
  dataFooterCta?: boolean;
  cursorLabel?: string;
};

/**
 * Magnetic CTA. Within 80px the shell translates 30% toward the cursor,
 * the inner label 60%. Springs back on leave.
 */
const MagneticButton = forwardRef<HTMLAnchorElement, Props>(function MagneticButton(
  {
    children,
    href = "#",
    className = "",
    style,
    labelClassName = "",
    dataCursorCta = true,
    dataFooterCta = false,
    cursorLabel = "GO",
  },
  forwardedRef,
) {
  const localRef = useRef<HTMLAnchorElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = localRef.current;
    const label = labelRef.current;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!el || !label || isMobile() || prefersReducedMotion() || !finePointer) return;

    const RADIUS = 80;
    const STIFFNESS = 200;
    const DAMPING = 18;
    const shell = { x: 0, y: 0, vx: 0, vy: 0, targetX: 0, targetY: 0 };
    const inner = { x: 0, y: 0, vx: 0, vy: 0, targetX: 0, targetY: 0 };
    let frame = 0;
    let lastTime = 0;

    const render = () => {
      el.style.transform = `translate3d(${shell.x}px, ${shell.y}px, 0)`;
      label.style.transform = `translate3d(${inner.x}px, ${inner.y}px, 0)`;
    };

    const stepAxis = (
      position: number,
      velocity: number,
      target: number,
      delta: number,
    ) => {
      const acceleration = (target - position) * STIFFNESS - velocity * DAMPING;
      const nextVelocity = velocity + acceleration * delta;
      return [position + nextVelocity * delta, nextVelocity] as const;
    };

    const tick = (time: number) => {
      const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.032) : 1 / 60;
      lastTime = time;

      [shell.x, shell.vx] = stepAxis(shell.x, shell.vx, shell.targetX, delta);
      [shell.y, shell.vy] = stepAxis(shell.y, shell.vy, shell.targetY, delta);
      [inner.x, inner.vx] = stepAxis(inner.x, inner.vx, inner.targetX, delta);
      [inner.y, inner.vy] = stepAxis(inner.y, inner.vy, inner.targetY, delta);
      render();

      const moving = [shell, inner].some(
        (part) =>
          Math.abs(part.targetX - part.x) > 0.02 ||
          Math.abs(part.targetY - part.y) > 0.02 ||
          Math.abs(part.vx) > 0.02 ||
          Math.abs(part.vy) > 0.02,
      );
      if (moving) frame = requestAnimationFrame(tick);
      else {
        frame = 0;
        lastTime = 0;
      }
    };

    const startSpring = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const release = () => {
      shell.targetX = 0;
      shell.targetY = 0;
      inner.targetX = 0;
      inner.targetY = 0;
      startSpring();
    };

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const left = r.left - shell.x;
      const top = r.top - shell.y;
      const right = left + r.width;
      const bottom = top + r.height;
      const outsideX = Math.max(left - e.clientX, 0, e.clientX - right);
      const outsideY = Math.max(top - e.clientY, 0, e.clientY - bottom);
      if (Math.hypot(outsideX, outsideY) > RADIUS) {
        release();
        return;
      }

      const cx = left + r.width / 2;
      const cy = top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      shell.targetX = dx * 0.3;
      shell.targetY = dy * 0.3;
      inner.targetX = dx * 0.6;
      inner.targetY = dy * 0.6;
      startSpring();
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("blur", release);
    el.addEventListener("mouseleave", release);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("blur", release);
      el.removeEventListener("mouseleave", release);
      cancelAnimationFrame(frame);
      el.style.transform = "";
      label.style.transform = "";
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
      {...(dataFooterCta ? { "data-footer-cta": "" } : {})}
      data-cursor-label={cursorLabel}
    >
      <span
        ref={labelRef}
        className={labelClassName}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "1rem",
          willChange: "transform",
        }}
      >
        {children}
      </span>
    </a>
  );
});

export default MagneticButton;
