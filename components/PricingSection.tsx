"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion, isMobile } from "@/lib/lenis";
import MagneticButton from "./MagneticButton";
import RevealHeading from "./RevealHeading";

const PricingScene = dynamic(() => import("./PricingScene"), { ssr: false });

type Plan = {
  name: string;
  value: number;
  prefix?: string;
  priceNote?: string;
  features: string[];
  featured?: boolean;
};

const PLANS: Plan[] = [
  {
    name: "Basic",
    value: 25.9,
    prefix: "ab ",
    priceNote: "*",
    features: ["Trainerbetreuung", "1.100m² Fläche", "Hauptgebäude klimatisiert", "07:00 – 23:00 Uhr geöffnet"],
  },
  {
    name: "Premium",
    value: 35.9,
    prefix: "ab ",
    priceNote: "*",
    featured: true,
    features: [
      "Volles Leistungspaket", "Trainerbetreuung", "2.200m² Fläche", "Hauptgebäude klimatisiert",
      "24/7 – 365 Tage geöffnet", "Outdoor Area", "Funktional & Hardcore Area", "Booty-Builder Area",
      "DJ-Events", "E-Gym Premium", "Kurse",
    ],
  },
  {
    name: "Tageskarte",
    value: 15.0,
    features: [
      "Dein FLEX Day", "Getränkeflat", "2.200m² Fläche", "Hauptgebäude klimatisiert",
      "24/7 – 365 Tage geöffnet", "Outdoor Area", "Funktional & Hardcore Area", "Booty-Builder Area",
      "DJ-Events", "Kurse",
    ],
  },
];

function fmt(v: number) {
  return v.toFixed(2).replace(".", ",") + "€";
}

function Check({ featured }: { featured?: boolean }) {
  return (
    <span className="mt-[2px] inline-flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full"
      style={{ border: `1px solid ${featured ? "rgba(122,76,255,0.8)" : "rgba(244,241,247,0.28)"}` }}>
      <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
        <path d="M2.5 6.2L4.8 8.5L9.5 3.5" stroke={featured ? "#b79bff" : "rgba(244,241,247,0.75)"}
          strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export default function PricingSection() {
  const root = useRef<HTMLElement | null>(null);
  const pinWrap = useRef<HTMLDivElement | null>(null);
  const sceneProgress = useRef(0);
  const [sceneMounted, setSceneMounted] = useState(false);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduce = prefersReducedMotion();
    const mobile = isMobile();
    const cleanups: Array<() => void> = [];
    if (reduce || mobile) sceneProgress.current = 1;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-card]");
      const countedPrices = new WeakSet<HTMLElement>();

      ScrollTrigger.create({
        trigger: root.current,
        start: "top 150%",
        once: true,
        onEnter: () => setSceneMounted(true),
      });

      const countPrice = (card: HTMLElement) => {
        const el = card.querySelector<HTMLElement>("[data-price-val]");
        if (!el || countedPrices.has(el)) return;
        countedPrices.add(el);
        const target = parseFloat(el.dataset.target || "0");
        el.textContent = fmt(0);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 0.8,
          ease: "expo.out",
          onUpdate: () => { el.textContent = fmt(obj.v); },
        });
      };

      if (reduce) {
        gsap.fromTo(
          cards,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.35,
            ease: "power1.out",
            stagger: 0.08,
            scrollTrigger: { trigger: "[data-cards]", start: "top 88%" },
          },
        );
      } else if (!mobile && pinWrap.current) {
        gsap.set(cards, { opacity: 0, y: 40 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: pinWrap.current,
            start: "top top",
            end: () => `+=${window.innerHeight * 1.5}`,
            scrub: 0.6,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => { sceneProgress.current = self.progress; },
          },
        });
        tl
          .to(cards[0], { opacity: 1, y: 0, duration: 0.25, ease: "expo.out" }, 0.04)
          .call(() => countPrice(cards[0]), undefined, 0.04)
          .to(cards[1], { opacity: 1, y: 0, duration: 0.25, ease: "expo.out" }, 0.37)
          .call(() => countPrice(cards[1]), undefined, 0.37)
          .to(cards[2], { opacity: 1, y: 0, duration: 0.25, ease: "expo.out" }, 0.70)
          .call(() => countPrice(cards[2]), undefined, 0.70)
          .to({}, { duration: 0.05 }, 0.95);
      } else {
        gsap.set(cards, { opacity: 0, y: 40 });
        gsap.to(cards, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "expo.out",
          stagger: 0.12,
          scrollTrigger: { trigger: "[data-cards]", start: "top 86%" },
        });
        cards.forEach((card) => {
          ScrollTrigger.create({
            trigger: card,
            start: "top 85%",
            once: true,
            onEnter: () => countPrice(card),
          });
        });
      }

      if (!reduce) {
        gsap.from("[data-price-meta]", {
          opacity: 0,
          y: 20,
          duration: 0.7,
          ease: "expo.out",
          scrollTrigger: { trigger: "[data-pheadwrap]", start: "top 75%" },
        });
      }

      if (!mobile && !reduce) {
        cards.forEach((card) => {
          const featured = card.hasAttribute("data-card-featured");
          const border = card.querySelector<HTMLElement>("[data-card-border]");
          const onEnter = () => {
            gsap.to(card, {
              y: -8,
              z: 40,
              duration: 0.4,
              ease: "power2.out",
              boxShadow: featured
                ? "0 34px 80px -28px rgba(122,76,255,0.58)"
                : "0 34px 80px -28px rgba(0,0,0,0.72)",
            });
            if (border) gsap.to(border, { opacity: 1, duration: 0.35, ease: "power2.out" });
          };
          const onLeave = () => {
            gsap.to(card, {
              y: 0,
              z: 0,
              duration: 0.5,
              ease: "power2.out",
              boxShadow: "0 0 0 rgba(0,0,0,0)",
            });
            if (border) {
              gsap.to(border, {
                opacity: featured ? 0.72 : 0.38,
                duration: 0.45,
                ease: "power2.out",
              });
            }
          };
          card.addEventListener("mouseenter", onEnter);
          card.addEventListener("mouseleave", onLeave);
          cleanups.push(() => {
            card.removeEventListener("mouseenter", onEnter);
            card.removeEventListener("mouseleave", onLeave);
          });
        });
      }
    }, root);

    const t = setTimeout(() => ScrollTrigger.refresh(), 700);
    if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    return () => {
      cleanups.forEach((cleanup) => cleanup());
      clearTimeout(t);
      ctx.revert();
    };
  }, []);

  return (
    <section ref={root} id="mitgliedschaft"
      className="relative w-full overflow-hidden bg-[#07060b] text-[#f4f1f7]">
      <div ref={pinWrap} className="relative flex min-h-screen w-full flex-col justify-center py-24 md:py-28">
        {/* WebGL barbell behind the cards */}
        <div className="pointer-events-none absolute inset-0 z-0 opacity-90">
          {sceneMounted && <PricingScene progressRef={sceneProgress} />}
        </div>
        {/* Subtle linear scrim keeps glass cards readable without a radial glow. */}
        <div className="pointer-events-none absolute inset-0 z-0"
          style={{ background: "linear-gradient(180deg, rgba(7,6,11,0.3) 0%, rgba(7,6,11,0.08) 48%, rgba(7,6,11,0.46) 100%)" }} />

        <div className="relative z-10 mx-auto w-full max-w-[1320px] px-6 md:px-12">
          <div data-pheadwrap className="mb-12 text-center md:mb-16">
            <p data-price-meta className="mb-5"
              style={{ fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif", fontSize: "11px",
                letterSpacing: "0.32em", fontWeight: 600, color: "rgba(244,241,247,0.55)" }}>
              MITGLIEDSCHAFT · PRIME ACCESS
            </p>
            <RevealHeading as="h2" className="font-serif-editorial mx-auto max-w-[800px]"
              style={{ fontSize: "clamp(34px,5vw,76px)", lineHeight: 1.02, fontWeight: 300, color: "#efeaf6" }}>
              Wähle dein <span className="italic">Level.</span>
            </RevealHeading>
          </div>

          <div data-cards className="grid grid-cols-1 items-start gap-5 md:grid-cols-3 md:gap-6"
            style={{ perspective: "1200px" }}>
            {PLANS.map((plan) => (
              <div key={plan.name} data-card
                {...(plan.featured ? { "data-card-featured": "" } : {})}
                className="relative flex h-full flex-col p-8 md:p-9"
                style={{
                  willChange: "transform, box-shadow",
                  transformStyle: "preserve-3d",
                  borderRadius: "2px",
                  background: plan.featured ? "rgba(28,18,52,0.55)" : "rgba(13,11,18,0.45)",
                  backdropFilter: "blur(40px) saturate(140%)",
                  WebkitBackdropFilter: "blur(40px) saturate(140%)",
                  border: "1px solid transparent",
                  backgroundImage: plan.featured
                    ? "linear-gradient(rgba(28,18,52,0.55),rgba(28,18,52,0.55)), linear-gradient(135deg, rgba(180,140,255,0.7) 0%, rgba(122,76,255,0.15) 50%, rgba(0,0,0,0.4) 100%)"
                    : "linear-gradient(rgba(13,11,18,0.45),rgba(13,11,18,0.45)), linear-gradient(135deg, rgba(244,241,247,0.22) 0%, rgba(244,241,247,0.03) 50%, rgba(0,0,0,0.3) 100%)",
                  backgroundOrigin: "border-box",
                  backgroundClip: "padding-box, border-box",
                }}>
                <div
                  data-card-border
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    border: "1px solid transparent",
                    borderRadius: "2px",
                    background: plan.featured
                      ? "linear-gradient(135deg, rgba(212,194,255,0.95), rgba(122,76,255,0.28) 52%, rgba(255,255,255,0.08)) border-box"
                      : "linear-gradient(135deg, rgba(255,255,255,0.58), rgba(255,255,255,0.08) 52%, rgba(122,76,255,0.18)) border-box",
                    WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                    opacity: plan.featured ? 0.72 : 0.38,
                  }}
                />
                {plan.featured && (
                  <span className="absolute right-7 top-7"
                    style={{ fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif", fontSize: "9px",
                      letterSpacing: "0.28em", fontWeight: 700, color: "#c9b8ff" }}>BELIEBT</span>
                )}

                <h3 className="font-display mb-5"
                  style={{ fontSize: "clamp(26px,2.6vw,38px)", letterSpacing: "-0.01em", color: "#f7f4fb" }}>
                  {plan.name}
                </h3>

                <div className="mb-8 flex items-end gap-1">
                  {plan.prefix && (
                    <span className="font-serif-editorial" style={{ fontSize: "clamp(18px,1.8vw,24px)", fontWeight: 300, color: "rgba(239,234,246,0.7)", paddingBottom: "6px" }}>
                      {plan.prefix.trim()}&nbsp;
                    </span>
                  )}
                  <span data-price-val data-target={plan.value} className="font-serif-editorial"
                    style={{ fontSize: "clamp(34px,3.6vw,52px)", lineHeight: 1, fontWeight: 300, color: "#efeaf6" }}>
                    {fmt(plan.value)}
                  </span>
                  {plan.priceNote && (
                    <span style={{ color: "rgba(244,241,247,0.5)", fontSize: "16px", paddingBottom: "6px" }}>{plan.priceNote}</span>
                  )}
                </div>

                <ul className="mb-9 flex flex-col gap-3.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <Check featured={plan.featured} />
                      <span style={{ fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif", fontSize: "13.5px", lineHeight: 1.4, color: "rgba(244,241,247,0.74)" }}>{f}</span>
                    </li>
                  ))}
                </ul>

                <MagneticButton href="#kontakt" cursorLabel="JOIN"
                  className="mt-auto inline-flex items-center justify-center gap-3 px-6 py-4 text-center"
                  style={{ willChange: "transform", fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
                    fontSize: "11px", letterSpacing: "0.22em", fontWeight: 700, textTransform: "uppercase",
                    color: plan.featured ? "#0b0712" : "#f4f1f7",
                    background: plan.featured ? "#c9b8ff" : "transparent",
                    border: plan.featured ? "1px solid #c9b8ff" : "1px solid rgba(244,241,247,0.4)" }}>
                  Jetzt anmelden <span aria-hidden>→</span>
                </MagneticButton>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-10 max-w-[760px] text-center"
            style={{ fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif", fontSize: "11px", lineHeight: 1.6, color: "rgba(244,241,247,0.38)" }}>
            *In Verbindung mit einer 24-monatigen Mitgliedschaft. Zuzüglich einmaliger Verwaltungsgebühr
            in Höhe von 49,90 € sowie einer jährlichen Hygienepauschale von 15 €.
          </p>
        </div>
      </div>
    </section>
  );
}
