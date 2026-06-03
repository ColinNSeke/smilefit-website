"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { prefersReducedMotion, isMobile } from "@/lib/lenis";

const BirdsCanvas = dynamic(() => import("./BirdsCanvas"), { ssr: false });

export default function BirdsSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [showCanvas, setShowCanvas] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion() || isMobile()) return;
    // Check WebGL2
    try {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl2");
      if (!gl) return;
    } catch {
      return;
    }
    setShowCanvas(true);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden"
      aria-hidden="true"
    >
      {/* Background gym photo */}
      <div
        className="absolute inset-0 z-[0]"
        style={{
          backgroundImage: "url('/media/gym-04.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(2px)",
          transform: "scale(1.04)",
        }}
      />

      {/* Dark overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{ background: "rgba(0,0,0,0.70)" }}
      />

      {/* Purple radial */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background: "radial-gradient(ellipse at center, rgba(107,63,184,0.15), transparent 70%)",
        }}
      />

      {/* Birds canvas or fallback */}
      {showCanvas ? (
        <div className="absolute inset-0 z-[2]">
          <BirdsCanvas sectionRef={sectionRef} />
        </div>
      ) : (
        <div className="absolute inset-0 z-[2] flex items-center justify-center">
          <span
            className="font-display select-none"
            style={{
              fontSize: "clamp(48px,8vw,120px)",
              letterSpacing: "0.08em",
              color: "rgba(237,234,227,0.18)",
              textTransform: "uppercase",
            }}
          >
            SmileFit
          </span>
        </div>
      )}
    </section>
  );
}
