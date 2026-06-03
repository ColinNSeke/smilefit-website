"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function CinematicHero() {
  const root = useRef<HTMLElement | null>(null);
  const [navLinksHidden, setNavLinksHidden] = useState(true);

  /* Fade-in on load */
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    gsap.set(root.current, { opacity: 0 });
    gsap.to(root.current, { opacity: 1, duration: 0.8, ease: "power2.out", delay: 0.1 });
  }, []);

  /* Hide nav text links while hero is in view */
  useEffect(() => {
    const section = root.current;
    if (!section) return;
    const io = new IntersectionObserver(
      ([entry]) => setNavLinksHidden(entry.isIntersecting),
      { threshold: 0.05 },
    );
    io.observe(section);
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* NAV — always visible; text links hidden while hero in view */}
      <header className="fixed inset-x-0 top-0 z-[50] flex items-center justify-between px-6 py-7 md:px-12 md:py-8">
        <a href="#" className="font-display text-[#f4f1f7]"
          style={{ fontSize: "clamp(18px,1.8vw,24px)", letterSpacing: "0.02em", lineHeight: 1 }}>
          SMILEFIT
        </a>
        <nav className="hidden items-center gap-9 md:flex" style={{ fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif" }}>
          {(["TRAINING", "RÄUME", "MITGLIEDSCHAFT", "KONTAKT"] as const).map((item) => (
            <a key={item} href="#"
              className="text-[11px] font-[600] uppercase tracking-[0.20em] text-[#f4f1f7]/70 transition-all duration-300 hover:text-[#f4f1f7]"
              style={{ opacity: navLinksHidden ? 0 : 1, pointerEvents: navLinksHidden ? "none" : "auto" }}>
              {item}
            </a>
          ))}
          <span className="ml-1 flex flex-col gap-[5px]">
            <span className="block h-[1.5px] w-6 bg-[#f4f1f7]/80" />
            <span className="block h-[1.5px] w-6 bg-[#f4f1f7]/80" />
          </span>
        </nav>
        <button aria-label="Menu" className="flex flex-col gap-[5px] md:hidden">
          <span className="block h-[1.5px] w-6 bg-[#f4f1f7]/80" />
          <span className="block h-[1.5px] w-6 bg-[#f4f1f7]/80" />
        </button>
      </header>

      {/* Hero — image only */}
      <section
        ref={root}
        className="relative h-screen min-h-[640px] w-full overflow-hidden"
        style={{ opacity: 0 }}
      >
        <img
          src="/NEW%20HERO%20PAGE"
          alt="SmileFit — Bring back your prime. One more time."
          className="absolute inset-0 h-full w-full object-cover object-center"
          draggable={false}
          fetchPriority="high"
        />
      </section>
    </>
  );
}
