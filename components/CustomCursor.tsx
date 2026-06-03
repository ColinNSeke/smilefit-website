"use client";

import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const dot = useRef<HTMLDivElement | null>(null);
  const label = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (reduce || !finePointer || window.innerWidth < 768 || !dot.current) return;

    const el = dot.current;
    const cursorLabel = label.current;
    const target = { x: -100, y: -100 };
    const current = { x: -100, y: -100 };
    let frame = 0;
    let visible = false;
    let mode = "";

    const setMode = (next: "default" | "cta" | "media" | "hidden", nextLabel = "") => {
      if (mode === next && (next !== "cta" || cursorLabel?.textContent === nextLabel)) return;
      mode = next;
      if (cursorLabel) cursorLabel.textContent = next === "cta" ? nextLabel : "";

      if (next === "hidden") {
        el.style.opacity = "0";
        return;
      }
      el.style.opacity = visible ? "1" : "0";
      el.style.width = next === "cta" ? "64px" : next === "media" ? "80px" : "8px";
      el.style.height = next === "cta" ? "64px" : next === "media" ? "80px" : "8px";
      el.style.backgroundColor = next === "media" ? "transparent" : "#f2efe6";
      el.style.border = next === "media" ? "1px solid #f2efe6" : "1px solid transparent";
    };

    const render = () => {
      current.x += (target.x - current.x) * 0.15;
      current.y += (target.y - current.y) * 0.15;
      el.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) translate(-50%, -50%)`;
      frame = requestAnimationFrame(render);
    };

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      visible = true;

      const targetEl = e.target as HTMLElement;
      if (targetEl.closest("main > section:first-of-type")) {
        setMode("hidden");
        return;
      }

      const cta = targetEl.closest<HTMLElement>("[data-cursor-cta]");
      if (cta) {
        setMode("cta", cta.dataset.cursorLabel || "GO");
        return;
      }

      if (targetEl.closest("[data-card], [data-cursor-image], [data-gallery-item], img, video")) {
        setMode("media");
        return;
      }

      setMode("default");
    };
    const onLeave = () => {
      visible = false;
      el.style.opacity = "0";
    };

    const previousCursor = document.body.style.cursor;
    document.body.style.cursor = "none";
    setMode("default");
    frame = requestAnimationFrame(render);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.cursor = previousCursor;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={dot}
      className="custom-cursor pointer-events-none fixed left-0 top-0 z-[9999] hidden h-2 w-2 items-center justify-center rounded-full bg-[#f2efe6] mix-blend-difference md:flex"
      style={{
        opacity: 0,
        transition:
          "width 280ms cubic-bezier(0.22,1,0.36,1), height 280ms cubic-bezier(0.22,1,0.36,1), background-color 220ms ease, border-color 220ms ease, opacity 180ms ease",
        willChange: "transform, width, height, opacity",
      }}
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
