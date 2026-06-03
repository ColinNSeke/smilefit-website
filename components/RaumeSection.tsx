"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/lenis";
import RevealHeading from "./RevealHeading";

export default function RaumeSection() {
  const root = useRef<HTMLElement | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduce = prefersReducedMotion();

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-card]");
      if (reduce) {
        gsap.set("[data-space-meta],[data-card],[data-interlude],[data-interlude-text]", {
          opacity: 1,
          y: 0,
          scale: 1,
          clipPath: "inset(0% 0%)",
        });
        return;
      }

      gsap.from("[data-space-meta]", {
        opacity: 0,
        y: 24,
        duration: 0.7,
        ease: "expo.out",
        stagger: 0.08,
        scrollTrigger: { trigger: "[data-headwrap]", start: "top 75%" },
      });

      gsap.fromTo(
        cards,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "expo.out",
          stagger: 0.1,
          scrollTrigger: { trigger: "[data-space-cards]", start: "top 88%" },
        },
      );

      gsap.set("[data-interlude]", { clipPath: "inset(16% 12%)", opacity: 0, scale: 0.92 });
      gsap.to("[data-interlude]", {
        clipPath: "inset(0% 0%)", opacity: 1, scale: 1, duration: 1.6,
        ease: "expo.inOut", scrollTrigger: { trigger: "[data-interlude]", start: "top 85%" },
      });
      gsap.from("[data-interlude-text]", {
        y: 60, opacity: 0, filter: "blur(16px)", duration: 1.2, ease: "power3.out",
        scrollTrigger: { trigger: "[data-interlude]", start: "top 70%" },
        onComplete: () => gsap.set("[data-interlude-text]", { clearProps: "filter" }),
      });
    }, root);

    const t = setTimeout(() => ScrollTrigger.refresh(), 700);
    if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    return () => { clearTimeout(t); ctx.revert(); };
  }, []);

  return (
    <section ref={root} id="raume" className="relative w-full bg-[#07060b] text-[#f4f1f7]">
      <div className="pointer-events-none absolute inset-0 opacity-70"
        style={{ background: "radial-gradient(60% 50% at 12% 0%, rgba(95,48,195,0.12) 0%, transparent 60%), radial-gradient(50% 40% at 100% 100%, rgba(95,48,195,0.10) 0%, transparent 60%)" }} />

      {/* Heading */}
      <div className="relative mx-auto max-w-[1320px] px-6 pt-24 md:px-12 md:pt-36">
        <div data-headwrap className="mb-14 flex flex-col gap-8 md:mb-16 md:flex-row md:items-end md:justify-between">
          <div>
            <p data-space-meta className="mb-5 flex items-center gap-3"
              style={{ fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif", fontSize: "11px", letterSpacing: "0.32em", fontWeight: 600, color: "rgba(244,241,247,0.55)" }}>
              <span className="inline-block h-px w-8" style={{ background: "rgba(122,76,255,0.8)" }} />
              RÄUME · ATMOSPHÄRE
            </p>
            <RevealHeading as="h2" className="font-serif-editorial"
              style={{ fontSize: "clamp(38px,5.6vw,86px)", lineHeight: 1.0, fontWeight: 300, color: "#efeaf6" }}>
              Der Raum<br /><span className="italic">trainiert mit.</span>
            </RevealHeading>
          </div>
          <p data-space-meta className="max-w-[340px]"
            style={{ fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif", fontSize: "14px", lineHeight: 1.7, color: "rgba(244,241,247,0.60)" }}>
            Atmosphäre für Leistung. Jede Zone in SmileFit ist auf Fokus, Kraft und Conditioning ausgelegt.
          </p>
        </div>

        {/* Vertical CSS Grid */}
        <div data-space-cards className="grid gap-4" style={{ gridTemplateColumns: "repeat(12, 1fr)", paddingBottom: "80px" }}>
          {/* Row 1: three cards */}
          {/* SYSTEM — col 1–4 */}
          <article data-card
            className="group relative col-span-12 overflow-hidden bg-[#0d0b12] md:col-span-4"
            style={{ aspectRatio: "3/4" }}>
            <div className="absolute inset-[-6%] bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
              style={{ backgroundImage: "url('/media/gym-02.jpg')" }} />
            <div className="pointer-events-none absolute inset-0"
              style={{ background: "linear-gradient(180deg, transparent 40%, rgba(7,6,11,0.90) 100%)" }} />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 md:p-6">
              <div>
                <p className="mb-1" style={{ fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif", fontSize: "10px", letterSpacing: "0.28em", fontWeight: 600, color: "rgba(244,241,247,0.55)" }}>Hauptfläche · 2.200m²</p>
                <h3 className="font-display" style={{ fontSize: "clamp(22px,2.2vw,34px)", letterSpacing: "-0.01em", color: "#f7f4fb" }}>System</h3>
              </div>
              <span style={{ fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif", fontSize: "11px", letterSpacing: "0.2em", fontWeight: 600, color: "rgba(244,241,247,0.40)" }}>/ 01</span>
            </div>
          </article>

          {/* TRAINING — col 5–8 */}
          <article data-card
            className="group relative col-span-12 overflow-hidden bg-[#0d0b12] md:col-span-4"
            style={{ aspectRatio: "4/5" }}>
            <div className="absolute inset-[-6%] bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
              style={{ backgroundImage: "url('/media/gym-05.jpg')" }} />
            <div className="pointer-events-none absolute inset-0"
              style={{ background: "linear-gradient(180deg, transparent 40%, rgba(7,6,11,0.90) 100%)" }} />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 md:p-6">
              <div>
                <p className="mb-1" style={{ fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif", fontSize: "10px", letterSpacing: "0.28em", fontWeight: 600, color: "rgba(244,241,247,0.55)" }}>Free Weights · Hardcore Area</p>
                <h3 className="font-display" style={{ fontSize: "clamp(22px,2.2vw,34px)", letterSpacing: "-0.01em", color: "#f7f4fb" }}>Training</h3>
              </div>
              <span style={{ fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif", fontSize: "11px", letterSpacing: "0.2em", fontWeight: 600, color: "rgba(244,241,247,0.40)" }}>/ 02</span>
            </div>
          </article>

          {/* KRAFT — col 9–12 */}
          <article data-card
            className="group relative col-span-12 overflow-hidden bg-[#0d0b12] md:col-span-4"
            style={{ aspectRatio: "3/4" }}>
            <div className="absolute inset-[-6%] bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
              style={{ backgroundImage: "url('/media/gym-06.jpg')" }} />
            <div className="pointer-events-none absolute inset-0"
              style={{ background: "linear-gradient(180deg, transparent 40%, rgba(7,6,11,0.90) 100%)" }} />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 md:p-6">
              <div>
                <p className="mb-1" style={{ fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif", fontSize: "10px", letterSpacing: "0.28em", fontWeight: 600, color: "rgba(244,241,247,0.55)" }}>Hammer Strength</p>
                <h3 className="font-display" style={{ fontSize: "clamp(22px,2.2vw,34px)", letterSpacing: "-0.01em", color: "#f7f4fb" }}>Kraft</h3>
              </div>
              <span style={{ fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif", fontSize: "11px", letterSpacing: "0.2em", fontWeight: 600, color: "rgba(244,241,247,0.40)" }}>/ 03</span>
            </div>
          </article>

          {/* Row 2: PERFORMANCE — full width */}
          <article data-card
            className="group relative col-span-12 overflow-hidden bg-[#0d0b12]"
            style={{ aspectRatio: "16/6" }}>
            <div className="absolute inset-[-4%] bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
              style={{ backgroundImage: "url('/media/gym-04.jpg')" }} />
            <div className="pointer-events-none absolute inset-0"
              style={{ background: "linear-gradient(180deg, transparent 40%, rgba(7,6,11,0.90) 100%)" }} />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 md:p-8">
              <div>
                <p className="mb-1" style={{ fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif", fontSize: "10px", letterSpacing: "0.28em", fontWeight: 600, color: "rgba(244,241,247,0.55)" }}>Funktional · Conditioning</p>
                <h3 className="font-display" style={{ fontSize: "clamp(22px,2.8vw,44px)", letterSpacing: "-0.01em", color: "#f7f4fb" }}>Performance</h3>
              </div>
              <span style={{ fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif", fontSize: "11px", letterSpacing: "0.2em", fontWeight: 600, color: "rgba(244,241,247,0.40)" }}>/ 04</span>
            </div>
          </article>
        </div>
      </div>

      {/* Video interlude */}
      <div className="relative mx-auto max-w-[1320px] px-6 pb-24 md:px-12 md:pb-36">
        <div data-interlude className="relative aspect-[21/9] w-full overflow-hidden bg-black"
          style={{ willChange: "clip-path, transform, opacity" }}>
          <video className="absolute inset-0 h-full w-full object-cover" style={{ filter: "brightness(0.72) saturate(1.05)" }}
            src="/media/hero-b.mp4" autoPlay muted loop playsInline preload="metadata" />
          <div className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(90% 120% at 50% 50%, transparent 38%, rgba(7,6,11,0.75) 100%)" }} />
          <div data-interlude-text className="absolute inset-0 flex flex-col items-center justify-center text-center" style={{ willChange: "transform, opacity" }}>
            <p className="mb-3" style={{ fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif", fontSize: "11px", letterSpacing: "0.34em", fontWeight: 600, color: "rgba(244,241,247,0.65)" }}>BUILT FOR FOCUS</p>
            <p className="font-serif-editorial px-6" style={{ fontSize: "clamp(26px,4vw,60px)", lineHeight: 1.05, fontWeight: 300, color: "#f4f1f7" }}>
              Atmosphäre für <span className="italic">Leistung.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
