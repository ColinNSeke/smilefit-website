"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Returns 0→1 progress of an element through the viewport, driven by
 * ScrollTrigger (which is fed by the single Lenis instance). No native
 * scroll listeners.
 */
export function useScrollProgress(
  ref: React.RefObject<HTMLElement | null>,
  start = "top bottom",
  end = "bottom top",
) {
  const [progress, setProgress] = useState(0);
  const value = useRef(0);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const el = ref.current;
    if (!el) return;

    const st = ScrollTrigger.create({
      trigger: el,
      start,
      end,
      onUpdate: (self) => {
        value.current = self.progress;
        setProgress(self.progress);
      },
    });

    return () => st.kill();
  }, [ref, start, end]);

  return { progress, progressRef: value };
}
