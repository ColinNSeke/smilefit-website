"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion, isMobile } from "@/lib/lenis";

type Tile = { src: string; label: string; index: string; caption: string };

const TILES: Tile[] = [
  { src: "/media/gym-02.jpg", label: "System", index: "01", caption: "Hauptfläche · 2.200m²" },
  { src: "/media/gym-05.jpg", label: "Training", index: "02", caption: "Free Weights · Hardcore Area" },
  { src: "/media/gym-06.jpg", label: "Kraft", index: "03", caption: "Hammer Strength" },
  { src: "/media/gym-04.jpg", label: "Performance", index: "04", caption: "Funktional · Conditioning" },
];

export default function RaumeSection() {
  const root = useRef<HTMLElement | null>(null);
  const pin = useRef<HTMLDivElement | null>(null);
  const track = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduce = prefersReducedMotion();
    const mobile = isMobile();

    const ctx = gsap.context(() => {
      /* Heading */
      if (!reduce) {
        gsap.set("[data-head]", { opacity: 0, y: 70, filter: "blur(12px)" });
        gsap.to("[data-head]", { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.1, ease: "power3.out",
          stagger: 0.14, scrollTrigger: { trigger: "[data-headwrap]", start: "top 85%" },
          onComplete: () => gsap.set("[data-head]", { clearProps: "filter" }) });
      }

      const panels = gsap.utils.toArray<HTMLElement>("[data-hpanel]");

      /* ── Horizontal pinned scroll (desktop only) ── */
      if (!reduce && !mobile && track.current && pin.current) {
        const getAmount = () => (track.current ? track.current.scrollWidth - window.innerWidth : 0);

        const tween = gsap.to(track.current, { x: () => -getAmount(), ease: "none" });

        ScrollTrigger.create({
          trigger: pin.current,
          start: "top top",
          end: () => "+=" + getAmount(),
          pin: true,
          scrub: 1,
          animation: tween,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        });

        // each image scales 0.9 → 1 as it reaches center; label fades when centered
        panels.forEach((panel) => {
          const img = panel.querySelector<HTMLElement>("[data-tileimg]");
          const label = panel.querySelector<HTMLElement>("[data-tilelabel]");
          if (img)
            gsap.fromTo(img, { scale: 0.9 }, {
              scale: 1, ease: "none",
              scrollTrigger: { trigger: panel, containerAnimation: tween, start: "left right", end: "center center", scrub: true },
            });
          if (label)
            gsap.fromTo(label, { opacity: 0, y: 24 }, {
              opacity: 1, y: 0, ease: "none",
              scrollTrigger: { trigger: panel, containerAnimation: tween, start: "left 70%", end: "center center", scrub: true },
            });
        });
      } else if (!reduce) {
        // mobile / reduced-motion fallback: simple vertical reveal
        panels.forEach((panel) => {
          const img = panel.querySelector<HTMLElement>("[data-tileimg]");
          gsap.fromTo(panel, { opacity: 0, y: 40 }, {
            opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
            scrollTrigger: { trigger: panel, start: "top 85%" },
          });
          if (img)
            gsap.fromTo(img, { scale: 1.2 }, {
              scale: 1, ease: "none",
              scrollTrigger: { trigger: panel, start: "top bottom", end: "bottom top", scrub: true },
            });
        });
      }

      /* Video interlude */
      gsap.set("[data-interlude]", { clipPath: "inset(16% 12%)", opacity: 0, scale: 0.92 });
      gsap.to("[data-interlude]", { clipPath: "inset(0% 0%)", opacity: 1, scale: 1, duration: 1.6,
        ease: "expo.inOut", scrollTrigger: { trigger: "[data-interlude]", start: "top 85%" } });
      gsap.from("[data-interlude-text]", { y: 60, opacity: 0, filter: "blur(16px)", duration: 1.2,
        ease: "power3.out", scrollTrigger: { trigger: "[data-interlude]", start: "top 70%" },
        onComplete: () => gsap.set("[data-interlude-text]", { clearProps: "filter" }) });
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
            <p data-head className="mb-5 flex items-center gap-3"
              style={{ fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif", fontSize: "11px", letterSpacing: "0.32em", fontWeight: 600, color: "rgba(244,241,247,0.55)" }}>
              <span className="inline-block h-px w-8" style={{ background: "rgba(122,76,255,0.8)" }} />
              RÄUME · ATMOSPHÄRE
            </p>
            <h2 data-head className="font-serif-editorial"
              style={{ fontSize: "clamp(38px,5.6vw,86px)", lineHeight: 1.0, fontWeight: 300, color: "#efeaf6" }}>
              Der Raum<br /><span className="italic">trainiert mit.</span>
            </h2>
          </div>
          <p data-head className="max-w-[340px]"
            style={{ fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif", fontSize: "14px", lineHeight: 1.7, color: "rgba(244,241,247,0.60)" }}>
            Atmosphäre für Leistung. Jede Zone in SmileFit ist auf Fokus, Kraft und Conditioning ausgelegt.
          </p>
        </div>
      </div>

      {/* Horizontal gallery (pinned on desktop) */}
      <div ref={pin} className="relative w-full overflow-hidden md:h-screen">
        <div ref={track}
          className="flex flex-col gap-6 px-6 pb-24 md:h-full md:flex-row md:items-center md:gap-8 md:px-[8vw] md:pb-0">
          {TILES.map((t) => (
            <article key={t.src} data-hpanel
              className="group relative shrink-0 overflow-hidden bg-[#0d0b12] aspect-[4/5] w-full md:aspect-auto md:h-[68vh] md:w-[58vw] lg:w-[46vw]"
              style={{ willChange: "transform" }}>
              <div data-tileimg className="absolute inset-[-6%] bg-cover bg-center"
                style={{ backgroundImage: `url('${t.src}')`, willChange: "transform" }} />
              <div className="pointer-events-none absolute inset-0"
                style={{ background: "linear-gradient(180deg, rgba(7,6,11,0.05) 0%, transparent 30%, rgba(7,6,11,0.25) 60%, rgba(7,6,11,0.88) 100%)" }} />
              <div data-tilelabel data-cursor-figure className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 md:p-7">
                <div>
                  <p className="mb-1" style={{ fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif", fontSize: "10px", letterSpacing: "0.28em", fontWeight: 600, color: "rgba(244,241,247,0.55)" }}>{t.caption}</p>
                  <h3 className="font-display" style={{ fontSize: "clamp(22px,2.2vw,38px)", letterSpacing: "-0.01em", color: "#f7f4fb" }}>{t.label}</h3>
                </div>
                <span style={{ fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif", fontSize: "11px", letterSpacing: "0.2em", fontWeight: 600, color: "rgba(244,241,247,0.40)" }}>/ {t.index}</span>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Video interlude */}
      <div className="relative mx-auto max-w-[1320px] px-6 pb-24 md:px-12 md:pb-36">
        <div data-interlude className="relative mt-5 aspect-[21/9] w-full overflow-hidden bg-black"
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
