"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion, isMobile } from "@/lib/lenis";

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

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduce = prefersReducedMotion();
    const mobile = isMobile();

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-card]");

      /* ── Price count-up on first visibility ── */
      cards.forEach((card) => {
        const el = card.querySelector<HTMLElement>("[data-price-val]");
        if (!el) return;
        const target = parseFloat(el.dataset.target || "0");
        if (reduce) { el.textContent = fmt(target); return; }
        const obj = { v: 0 };
        ScrollTrigger.create({
          trigger: card,
          start: "top 85%",
          once: true,
          onEnter: () =>
            gsap.to(obj, { v: target, duration: 0.8, ease: "expo.out",
              onUpdate: () => { el.textContent = fmt(obj.v); } }),
        });
      });

      if (reduce) {
        gsap.set("[data-card]", { clearProps: "all", opacity: 1, y: 0 });
        return;
      }

      /* ── Pinned choreography (desktop) ── */
      if (!mobile && pinWrap.current) {
        gsap.set(cards, { opacity: 0, y: 50 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: pinWrap.current,
            start: "top top",
            end: "+=150%",
            scrub: 0.6,
            pin: true,
            anticipatePin: 1,
            onUpdate: (self) => { sceneProgress.current = self.progress; },
          },
        });
        // 0–33: basic, 33–66: premium (+plates), 66–100: tageskarte
        tl.to(cards[0], { opacity: 1, y: 0, ease: "power2.out" }, 0.05);
        tl.to(cards[1], { opacity: 1, y: 0, ease: "power2.out" }, 0.4);
        tl.to(cards[2], { opacity: 1, y: 0, ease: "power2.out" }, 0.72);
        tl.to({}, { duration: 0.1 }); // tail
      } else {
        // mobile: simple staggered reveal, no pin
        gsap.set(cards, { opacity: 0, y: 40 });
        gsap.to(cards, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.12,
          scrollTrigger: { trigger: "[data-cards]", start: "top 86%" } });
      }

      /* ── Heading reveal ── */
      gsap.set("[data-phead]", { opacity: 0, y: 50 });
      gsap.to("[data-phead]", { opacity: 1, y: 0, duration: 1.0, ease: "power3.out", stagger: 0.12,
        scrollTrigger: { trigger: "[data-pheadwrap]", start: "top 85%" } });

      /* ── Hover lift (no pulsing glow) ── */
      if (!mobile) {
        cards.forEach((card) => {
          const featured = card.hasAttribute("data-card-featured");
          const onEnter = () => gsap.to(card, { y: -8, z: 40, duration: 0.4, ease: "power2.out",
            boxShadow: featured
              ? "0 30px 70px -30px rgba(122,76,255,0.55), 0 0 1px rgba(180,140,255,0.9)"
              : "0 30px 70px -30px rgba(0,0,0,0.65)" });
          const onLeave = () => gsap.to(card, { y: 0, z: 0, duration: 0.5, ease: "power2.out" });
          card.addEventListener("mouseenter", onEnter);
          card.addEventListener("mouseleave", onLeave);
        });

        /* magnetic price CTAs */
        gsap.utils.toArray<HTMLElement>("[data-price-cta]").forEach((btn) => {
          const onMove = (e: MouseEvent) => {
            const r = btn.getBoundingClientRect();
            gsap.to(btn, { x: (e.clientX - (r.left + r.width / 2)) * 0.35, y: (e.clientY - (r.top + r.height / 2)) * 0.35, duration: 0.3, ease: "power2.out" });
          };
          const onLeave = () => gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1,0.5)" });
          btn.addEventListener("mousemove", onMove as EventListener);
          btn.addEventListener("mouseleave", onLeave);
        });
      }
    }, root);

    const t = setTimeout(() => ScrollTrigger.refresh(), 700);
    if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    return () => { clearTimeout(t); ctx.revert(); };
  }, []);

  return (
    <section ref={root} id="mitgliedschaft"
      className="relative w-full overflow-hidden bg-[#07060b] text-[#f4f1f7]">
      <div ref={pinWrap} className="relative flex min-h-screen w-full flex-col justify-center py-24 md:py-28">
        {/* WebGL barbell behind the cards */}
        <div className="pointer-events-none absolute inset-0 z-0 opacity-90">
          <PricingScene progressRef={sceneProgress} paused={prefersReducedMotion() || isMobile()} />
        </div>
        {/* readability scrim */}
        <div className="pointer-events-none absolute inset-0 z-0"
          style={{ background: "radial-gradient(120% 90% at 50% 50%, transparent 30%, rgba(7,6,11,0.55) 75%, rgba(7,6,11,0.9) 100%)" }} />

        <div className="relative z-10 mx-auto w-full max-w-[1320px] px-6 md:px-12">
          <div data-pheadwrap className="mb-12 text-center md:mb-16">
            <p data-phead className="mb-5"
              style={{ fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif", fontSize: "11px",
                letterSpacing: "0.32em", fontWeight: 600, color: "rgba(244,241,247,0.55)" }}>
              MITGLIEDSCHAFT · PRIME ACCESS
            </p>
            <h2 data-phead className="font-serif-editorial mx-auto max-w-[800px]"
              style={{ fontSize: "clamp(34px,5vw,76px)", lineHeight: 1.02, fontWeight: 300, color: "#efeaf6" }}>
              Wähle dein <span className="italic">Level.</span>
            </h2>
          </div>

          <div data-cards className="grid grid-cols-1 items-start gap-5 md:grid-cols-3 md:gap-6"
            style={{ perspective: "1200px" }}>
            {PLANS.map((plan) => (
              <div key={plan.name} data-card
                {...(plan.featured ? { "data-card-featured": "" } : {})}
                className="relative flex h-full flex-col p-8 md:p-9"
                style={{
                  willChange: "transform, box-shadow",
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

                <a data-price-cta data-cursor-cta href="#kontakt"
                  className="mt-auto inline-flex items-center justify-center gap-3 px-6 py-4 text-center"
                  style={{ willChange: "transform", fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
                    fontSize: "11px", letterSpacing: "0.22em", fontWeight: 700, textTransform: "uppercase",
                    color: plan.featured ? "#0b0712" : "#f4f1f7",
                    background: plan.featured ? "#c9b8ff" : "transparent",
                    border: plan.featured ? "1px solid #c9b8ff" : "1px solid rgba(244,241,247,0.4)" }}>
                  Jetzt anmelden <span aria-hidden>→</span>
                </a>
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
