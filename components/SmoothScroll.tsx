"use client";

import { useEffect } from "react";
import { initLenis, destroyLenis } from "@/lib/lenis";

/**
 * Mounts the single Lenis instance (or native scroll under reduced motion).
 * All scroll-linked animation consumes the instance via lib/lenis.
 */
export default function SmoothScroll() {
  useEffect(() => {
    initLenis();
    return () => destroyLenis();
  }, []);

  return null;
}
