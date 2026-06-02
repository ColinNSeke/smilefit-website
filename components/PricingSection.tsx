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
      style={{ border: `1px solid ${featured ? "rgba(122,76,255,0.8)" : "rgba(244,241,247,0.28)"}` }}
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
        gsap.set("[data-card],[data-phead]", { clearProps: "all" });
        return;
      }

      /* =============================================
         HEADING
      ============================================= */
      gsap.set("[data-phead]", { opacity: 0, y: 60, filter: "blur(12px)" });
      gsap.to("[data-phead]", {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1.2,
        ease: "power3.out",
        stagger: 0.14,
        scrollTrigger: { trigger: "[data-pheadwrap]", start: "top 85%" },
        onComplete: () => gsap.set("[data-phead]", { clearProps: "filter" }),
      });

      /* =============================================
         CARDS — rise from below in 3D perspective
         with scale + rotateX, heavy stagger
      ============================================= */
      gsap.set("[data-card]", {
        opacity: 0,
        y: 140,
        scale: 0.82,
        rotateX: -20,
        transformPerspective: 1200,
        transformOrigin: "center bottom",
      });

      gsap.to("[data-card]", {
        opacity: 1,
        y: 0,
        scale: 1,
        rotateX: 0,
        duration: 1.3,
        ease: "power3.out",
        stagger: {
          each: 0.18,
          from: "start",
        },
        scrollTrigger: { trigger: "[data-cards]", start: "top 86%" },
      });

      /* =============================================
         FEATURED CARD — pulsing glow aura (VERY visible)
      ============================================= */
      const featuredCard = root.current?.querySelector<HTMLElement>("[data-card-featured]");
      if (featuredCard) {
        // Rotating conic gradient
        const aura = featuredCard.querySelector<HTMLElement>("[data-aura]");
        if (aura) {
          gsap.to(aura, {
            rotation: 360,
            duration: 6,
            ease: "none",
            repeat: -1,
            transformOrigin: "50% 50%",
          });
        }

        // Pulsing box-shadow — large, obvious, cannot be missed
        gsap.to(featuredCard, {
          boxShadow: "0 0 100px -20px rgba(122,76,255,0.95), 0 0 200px -60px rgba(122,76,255,0.50)",
          duration: 2.0,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: 0.5,
        });
      }

      /* =============================================
         HOVER — depth lift + glow
      ============================================= */
      const hover = window.matchMedia("(hover: hover)").matches;
      if (hover) {
        gsap.utils.toArray<HTMLElement>("[data-card]").forEach((card) => {
          const isFeatured = card.hasAttribute("data-card-featured");
          const onEnter = () =>
            gsap.to(card, {
              y: -16,
              scale: 1.02,
              boxShadow: isFeatured
                ? "0 0 120px -10px rgba(122,76,255,1.0), 0 40px 80px -30px rgba(0,0,0,0.8)"
                : "0 40px 80px -30px rgba(0,0,0,0.6), 0 0 40px -20px rgba(122,76,255,0.30)",
              duration: 0.45,
              ease: "power2.out",
            });
          const onLeave = () =>
            gsap.to(card, {
              y: 0,
              scale: 1,
              duration: 0.55,
              ease: "power2.out",
              clearProps: isFeatured ? "" : "boxShadow",
            });
          card.addEventListener("mouseenter", onEnter);
          card.addEventListener("mouseleave", onLeave);
        });

        /* Magnetic CTA buttons */
        gsap.utils.toArray<HTMLElement>("[data-price-cta]").forEach((btn) => {
          const onMove = (e: MouseEvent) => {
            const r  = btn.getBoundingClientRect();
            const dx = (e.clientX - (r.left + r.width  / 2)) * 0.40;
            const dy = (e.clientY - (r.top  + r.height / 2)) * 0.40;
            gsap.to(btn, {
              x: dx, y: dy,
              boxShadow: "0 0 36px rgba(122,76,255,0.65)",
              duration: 0.3,
              ease: "power2.out",
            });
          };
          const onLeave = () =>
            gsap.to(btn, {
              x: 0, y: 0,
              boxShadow: "0 0 0px rgba(122,76,255,0)",
              duration: 0.6,
              ease: "elastic.out(1,0.5)",
            });
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
    <section
      ref={root}
      id="mitgliedschaft"
      className="relative w-full overflow-hidden bg-[#07060b] py-24 text-[#f4f1f7] md:py-36"
    >
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(55% 45% at 50% 0%, rgba(95,48,195,0.18) 0%, transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-[1320px] px-6 md:px-12">
        {/* Heading */}
        <div data-pheadwrap className="mb-14 text-center md:mb-20">
          <p
            data-phead
            className="mb-5"
            style={{
              fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
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
            style={{ fontSize: "clamp(34px,5vw,76px)", lineHeight: 1.02, fontWeight: 300, color: "#efeaf6" }}
          >
            Wähle dein <span className="italic">Level.</span>
          </h2>
        </div>

        {/* Cards */}
        <div
          data-cards
          className="grid grid-cols-1 items-start gap-5 md:grid-cols-3 md:gap-6"
          style={{ perspective: "1200px" }}
        >
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              data-card
              {...(plan.featured ? { "data-card-featured": "" } : {})}
              className="relative flex h-full flex-col overflow-visible p-8 md:p-9"
              style={{
                willChange: "transform, box-shadow",
                background: plan.featured
                  ? "linear-gradient(180deg, rgba(40,22,80,0.96) 0%, rgba(14,10,22,0.98) 100%)"
                  : "rgba(13,11,18,0.80)",
                border: `1px solid ${plan.featured ? "rgba(122,76,255,0.70)" : "rgba(244,241,247,0.10)"}`,
                boxShadow: plan.featured
                  ? "0 30px 80px -30px rgba(122,76,255,0.65)"
                  : "none",
              }}
            >
              {plan.featured && (
                <>
                  {/* Rotating conic aura */}
                  <div
                    data-aura
                    aria-hidden
                    className="pointer-events-none absolute -inset-[50%]"
                    style={{
                      opacity: 0.28,
                      background:
                        "conic-gradient(from 0deg, transparent 0%, rgba(122,76,255,1) 16%, rgba(180,130,255,0.9) 32%, transparent 48%, rgba(122,76,255,0.8) 65%, transparent 82%)",
                      borderRadius: "50%",
                      willChange: "transform",
                      zIndex: -1,
                    }}
                  />
                  {/* Top gradient line */}
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-px"
                    style={{
                      background: "linear-gradient(90deg, transparent, rgba(180,130,255,1), transparent)",
                    }}
                  />
                  {/* BELIEBT badge */}
                  <span
                    className="absolute right-7 top-7"
                    style={{
                      fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
                      fontSize: "9px",
                      letterSpacing: "0.28em",
                      fontWeight: 700,
                      color: "#c9b8ff",
                    }}
                  >
                    BELIEBT
                  </span>
                </>
              )}

              {/* Name */}
              <h3
                className="font-display mb-5"
                style={{
                  fontSize: "clamp(26px,2.6vw,38px)",
                  letterSpacing: "-0.01em",
                  color: "#f7f4fb",
                }}
              >
                {plan.name}
              </h3>

              {/* Price */}
              <div className="mb-8 flex items-end gap-1">
                <span
                  className="font-serif-editorial"
                  style={{
                    fontSize: "clamp(34px,3.6vw,52px)",
                    lineHeight: 1,
                    fontWeight: 300,
                    color: "#efeaf6",
                  }}
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
                        fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
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
                className="mt-auto inline-flex items-center justify-center gap-3 px-6 py-4 text-center"
                style={{
                  willChange: "transform, box-shadow",
                  fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
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
            fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
            fontSize: "11px",
            lineHeight: 1.6,
            color: "rgba(244,241,247,0.38)",
          }}
        >
          *In Verbindung mit einer 24-monatigen Mitgliedschaft. Zuzüglich einmaliger Verwaltungsgebühr
          in Höhe von 49,90 € sowie einer jährlichen Hygienepauschale von 15 €.
        </p>
      </div>
    </section>
  );
}
