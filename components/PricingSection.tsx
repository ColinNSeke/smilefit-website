"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type Plan = {
  name: string;
  price: string;
  priceNote?: string;
  features: string[];
  featured?: boolean;
};

const PLANS: Plan[] = [
  {
    name: "Basic",
    price: "ab 25,90€",
    priceNote: "*",
    features: [
      "Trainerbetreuung",
      "1.100m² Fläche",
      "Hauptgebäude klimatisiert",
      "07:00 – 23:00 Uhr geöffnet",
    ],
  },
  {
    name: "Premium",
    price: "ab 35,90€",
    priceNote: "*",
    featured: true,
    features: [
      "Volles Leistungspaket",
      "Trainerbetreuung",
      "2.200m² Fläche",
      "Hauptgebäude klimatisiert",
      "24/7 – 365 Tage geöffnet",
      "Outdoor Area",
      "Funktional & Hardcore Area",
      "Booty-Builder Area",
      "DJ-Events",
      "E-Gym Premium",
      "Kurse",
    ],
  },
  {
    name: "Tageskarte",
    price: "15,00€",
    features: [
      "Dein FLEX Day",
      "Getränkeflat",
      "2.200m² Fläche",
      "Hauptgebäude klimatisiert",
      "24/7 – 365 Tage geöffnet",
      "Outdoor Area",
      "Funktional & Hardcore Area",
      "Booty-Builder Area",
      "DJ-Events",
      "Kurse",
    ],
  },
];

function Check({ featured }: { featured?: boolean }) {
  return (
    <span
      className="mt-[2px] inline-flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full"
      style={{
        border: `1px solid ${featured ? "rgba(122,76,255,0.7)" : "rgba(244,241,247,0.28)"}`,
      }}
    >
      <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
        <path
          d="M2.5 6.2L4.8 8.5L9.5 3.5"
          stroke={featured ? "#b79bff" : "rgba(244,241,247,0.75)"}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function PricingSection() {
  const root = useRef<HTMLElement | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      if (reduce) {
        gsap.set("[data-card], [data-phead]", { opacity: 1, y: 0 });
        return;
      }
      gsap.from("[data-phead]", {
        y: 30,
        opacity: 0,
        duration: 1.0,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: { trigger: "[data-pheadwrap]", start: "top 80%" },
      });
      gsap.from("[data-card]", {
        y: 54,
        opacity: 0,
        duration: 1.0,
        ease: "power3.out",
        stagger: 0.13,
        scrollTrigger: { trigger: "[data-cards]", start: "top 82%" },
      });

      // Hover depth + magnetic CTA on pointer devices
      if (window.matchMedia("(hover: hover)").matches) {
        gsap.utils.toArray<HTMLElement>("[data-card]").forEach((card) => {
          const onEnter = () => gsap.to(card, { y: -8, duration: 0.4, ease: "power2.out" });
          const onLeave = () => gsap.to(card, { y: 0, duration: 0.5, ease: "power2.out" });
          card.addEventListener("mouseenter", onEnter);
          card.addEventListener("mouseleave", onLeave);
        });

        gsap.utils.toArray<HTMLElement>("[data-price-cta]").forEach((btn) => {
          const onMove = (e: MouseEvent) => {
            const r = btn.getBoundingClientRect();
            const dx = (e.clientX - (r.left + r.width / 2)) * 0.28;
            const dy = (e.clientY - (r.top + r.height / 2)) * 0.28;
            gsap.to(btn, { x: dx, y: dy, duration: 0.35, ease: "power2.out" });
          };
          const onLeave = () => gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1,0.5)" });
          btn.addEventListener("mousemove", onMove as EventListener);
          btn.addEventListener("mouseleave", onLeave);
        });
      }

      // Animated aura on the featured card
      const featuredCard = root.current?.querySelector<HTMLElement>("[data-card-featured]");
      if (featuredCard) {
        const aura = featuredCard.querySelector<HTMLElement>("[data-aura]");
        if (aura) {
          gsap.to(aura, { rotation: 360, duration: 8, ease: "none", repeat: -1, transformOrigin: "50% 50%" });
        }
      }
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      id="mitgliedschaft"
      className="relative w-full overflow-hidden bg-[#07060b] py-24 text-[#f4f1f7] md:py-36"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{ background: "radial-gradient(55% 45% at 50% 0%, rgba(95,48,195,0.12) 0%, transparent 60%)" }}
      />

      <div className="relative mx-auto max-w-[1320px] px-6 md:px-12">
        {/* Heading */}
        <div data-pheadwrap className="mb-14 text-center md:mb-20">
          <p
            data-phead
            className="mb-5"
            style={{
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontSize: "11px",
              letterSpacing: "0.32em",
              fontWeight: 600,
              color: "rgba(244,241,247,0.55)",
            }}
          >
            MITGLIEDSCHAFT · PRIME ACCESS
          </p>
          <h2
            data-phead
            className="font-serif-editorial mx-auto max-w-[800px]"
            style={{ fontSize: "clamp(34px, 5vw, 76px)", lineHeight: 1.02, fontWeight: 300, color: "#efeaf6" }}
          >
            Wähle dein <span className="italic">Level.</span>
          </h2>
        </div>

        {/* Cards */}
        <div data-cards className="grid grid-cols-1 items-start gap-5 md:grid-cols-3 md:gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              data-card
              {...(plan.featured ? { "data-card-featured": "" } : {})}
              className="relative flex h-full flex-col overflow-hidden p-8 md:p-9"
              style={{
                willChange: "transform",
                background: plan.featured
                  ? "linear-gradient(180deg, rgba(33,20,64,0.92) 0%, rgba(14,10,22,0.96) 100%)"
                  : "rgba(13,11,18,0.7)",
                border: `1px solid ${plan.featured ? "rgba(122,76,255,0.55)" : "rgba(244,241,247,0.10)"}`,
                boxShadow: plan.featured ? "0 30px 80px -40px rgba(122,76,255,0.55)" : "none",
              }}
            >
              {plan.featured && (
                <>
                  <div
                    data-aura
                    aria-hidden
                    className="pointer-events-none absolute -inset-[60%] opacity-[0.07]"
                    style={{
                      background: "conic-gradient(from 0deg, transparent 0%, rgba(122,76,255,1) 20%, transparent 40%, rgba(180,130,255,0.8) 60%, transparent 80%)",
                      borderRadius: "50%",
                      willChange: "transform",
                    }}
                  />
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-px"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(122,76,255,0.9), transparent)" }}
                  />
                  <span
                    className="absolute right-7 top-8"
                    style={{
                      fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                      fontSize: "9px",
                      letterSpacing: "0.28em",
                      fontWeight: 700,
                      color: "#b79bff",
                    }}
                  >
                    BELIEBT
                  </span>
                </>
              )}

              {/* Name */}
              <h3
                className="font-display mb-5"
                style={{ fontSize: "clamp(26px, 2.6vw, 38px)", letterSpacing: "-0.01em", color: "#f7f4fb" }}
              >
                {plan.name}
              </h3>

              {/* Price */}
              <div className="mb-8 flex items-end gap-1">
                <span
                  className="font-serif-editorial"
                  style={{ fontSize: "clamp(34px, 3.6vw, 52px)", lineHeight: 1, fontWeight: 300, color: "#efeaf6" }}
                >
                  {plan.price}
                </span>
                {plan.priceNote && (
                  <span style={{ color: "rgba(244,241,247,0.5)", fontSize: "16px", paddingBottom: "6px" }}>
                    {plan.priceNote}
                  </span>
                )}
              </div>

              {/* Features */}
              <ul className="mb-9 flex flex-col gap-3.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check featured={plan.featured} />
                    <span
                      style={{
                        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                        fontSize: "13.5px",
                        lineHeight: 1.4,
                        color: "rgba(244,241,247,0.74)",
                      }}
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                data-price-cta
                href="#kontakt"
                className="mt-auto inline-flex items-center justify-center gap-3 px-6 py-3.5 text-center transition-colors"
                style={{
                  willChange: "transform",
                  fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                  fontSize: "11px",
                  letterSpacing: "0.22em",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: plan.featured ? "#0b0712" : "#f4f1f7",
                  background: plan.featured ? "#c9b8ff" : "transparent",
                  border: plan.featured ? "1px solid #c9b8ff" : "1px solid rgba(244,241,247,0.4)",
                }}
              >
                Jetzt anmelden
                <span aria-hidden>→</span>
              </a>
            </div>
          ))}
        </div>

        {/* Fine print */}
        <p
          className="mx-auto mt-10 max-w-[760px] text-center"
          style={{
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            fontSize: "11px",
            lineHeight: 1.6,
            color: "rgba(244,241,247,0.40)",
          }}
        >
          *In Verbindung mit einer 24-monatigen Mitgliedschaft. Zuzüglich einmaliger
          Verwaltungsgebühr in Höhe von 49,90 € sowie einer jährlichen Hygienepauschale von 15 €.
        </p>
      </div>
    </section>
  );
}
