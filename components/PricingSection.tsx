"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion, isMobile } from "@/lib/lenis";

const PricingScene = dynamic(() => import("./PricingScene"), { ssr: false });

/* ── Data ── */
type Plan = {
  id: string;
  name: string;
  value: number;
  period: string;
  prefix?: string;
  priceNote?: string;
  tag?: string;
  features: string[];
  featured?: boolean;
};

const PLANS: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    value: 25.9,
    period: "/ Monat",
    prefix: "ab",
    priceNote: "*",
    features: [
      "Trainerbetreuung",
      "1.100m² Fläche",
      "Hauptgebäude klimatisiert",
      "07:00 – 23:00 Uhr",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    value: 35.9,
    period: "/ Monat",
    prefix: "ab",
    priceNote: "*",
    tag: "EMPFOHLEN",
    featured: true,
    features: [
      "Volles Leistungspaket",
      "Trainerbetreuung",
      "2.200m² Fläche",
      "Hauptgebäude klimatisiert",
      "24/7 · 365 Tage",
      "Outdoor Area",
      "Funktional & Hardcore",
      "Booty-Builder Area",
      "DJ-Events",
      "E-Gym Premium",
      "Kurse inkl.",
    ],
  },
  {
    id: "tages",
    name: "Tageskarte",
    value: 15.0,
    period: "/ Tag",
    features: [
      "Dein FLEX Day",
      "Getränkeflat",
      "2.200m² Fläche",
      "Hauptgebäude klimatisiert",
      "24/7 · 365 Tage",
      "Outdoor Area",
      "Funktional & Hardcore",
      "Booty-Builder Area",
      "DJ-Events",
      "Kurse inkl.",
    ],
  },
];

const STATS = [
  { icon: "□□", label: "2.200m²" },
  { icon: "◷", label: "24/7 Zugang" },
  { icon: "✳", label: "Klimatisiert" },
  { icon: "◇", label: "Premium Areas" },
];

function fmt(v: number) {
  return v.toFixed(2).replace(".", ",") + " €";
}

/* Thin check mark — line style */
function Tick({ featured }: { featured?: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginTop: "2px" }}>
      <path d="M1.5 6.5L4.5 9.5L10.5 2.5"
        stroke={featured ? "rgba(180,148,255,0.9)" : "rgba(244,241,247,0.45)"}
        strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PricingSection() {
  const root      = useRef<HTMLElement | null>(null);
  const pinWrap   = useRef<HTMLDivElement | null>(null);
  const sceneProgress = useRef(0);
  const [glowEnabled, setGlowEnabled] = useState(false);

  useEffect(() => {
    const hover = window.matchMedia("(hover: hover)").matches;
    setGlowEnabled(hover && !prefersReducedMotion());
  }, []);

  /* Cursor-follow glow — direct DOM writes, no re-render */
  const handleGlowMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!glowEnabled) return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--glow-x", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--glow-y", `${e.clientY - r.top}px`);
    e.currentTarget.style.setProperty("--glow-o", "1");
  };
  const handleGlowLeave = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.setProperty("--glow-o", "0");
  };

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduce = prefersReducedMotion();
    const mob    = isMobile();

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-card]");

      /* Price counter */
      cards.forEach((card) => {
        const el = card.querySelector<HTMLElement>("[data-price-val]");
        if (!el) return;
        const target = parseFloat(el.dataset.target ?? "0");
        if (reduce) { el.textContent = fmt(target); return; }
        const obj = { v: 0 };
        ScrollTrigger.create({
          trigger: card, start: "top 88%", once: true,
          onEnter: () =>
            gsap.to(obj, {
              v: target, duration: 1.1, ease: "expo.out",
              onUpdate: () => { el.textContent = fmt(obj.v); },
            }),
        });
      });

      if (reduce) {
        gsap.set("[data-card],[data-phead],[data-stat-item]", { clearProps: "all", opacity: 1 });
        return;
      }

      /* Heading reveal */
      gsap.set("[data-phead]", { opacity: 0, y: 40, filter: "blur(8px)" });
      gsap.to("[data-phead]", {
        opacity: 1, y: 0, filter: "blur(0px)", duration: 1.1, ease: "power3.out", stagger: 0.13,
        scrollTrigger: { trigger: "[data-pheadwrap]", start: "top 88%" },
        onComplete: () => gsap.set("[data-phead]", { clearProps: "filter" }),
      });

      /* ── Pinned card choreography (desktop) ── */
      if (!mob && pinWrap.current) {
        /* Clip-path cinematic wipe in + then hold */
        gsap.set(cards, { clipPath: "inset(100% 0% 0% 0%)", opacity: 1 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: pinWrap.current,
            start: "top top",
            end: "+=160%",
            scrub: 0.7,
            pin: true,
            anticipatePin: 1,
            onUpdate: (self) => { sceneProgress.current = self.progress; },
          },
        });

        tl.to(cards[0], { clipPath: "inset(0% 0% 0% 0%)", ease: "power2.out", duration: 0.4 }, 0.05);
        tl.to(cards[1], { clipPath: "inset(0% 0% 0% 0%)", ease: "power2.out", duration: 0.4 }, 0.32);
        tl.to(cards[2], { clipPath: "inset(0% 0% 0% 0%)", ease: "power2.out", duration: 0.4 }, 0.60);
        tl.to({}, { duration: 0.15 }); // hold tail
      } else {
        gsap.set(cards, { opacity: 0, y: 36 });
        gsap.to(cards, {
          opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.14,
          scrollTrigger: { trigger: "[data-cards]", start: "top 86%" },
        });
      }

      /* Stats strip reveal */
      gsap.set("[data-stat-item]", { opacity: 0, y: 20 });
      gsap.to("[data-stat-item]", {
        opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.08,
        scrollTrigger: { trigger: "[data-stats]", start: "top 92%" },
      });

      /* Magnetic CTAs */
      if (!mob) {
        gsap.utils.toArray<HTMLElement>("[data-price-cta]").forEach((btn) => {
          const onMove = (e: MouseEvent) => {
            const r = btn.getBoundingClientRect();
            gsap.to(btn, { x: (e.clientX - (r.left + r.width / 2)) * 0.3, y: (e.clientY - (r.top + r.height / 2)) * 0.3, duration: 0.3, ease: "power2.out" });
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
      className="relative w-full overflow-hidden bg-[#050308] text-[#f4f1f7]">

      {/* Ambient top vignette */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-48"
        style={{ background: "linear-gradient(to bottom, rgba(5,3,8,0.9), transparent)" }} />

      <div ref={pinWrap}
        className="relative flex min-h-screen w-full flex-col items-center justify-center py-28">

        {/* WebGL barbell */}
        <div className="pointer-events-none absolute inset-0 z-0 opacity-85">
          <PricingScene progressRef={sceneProgress} paused={prefersReducedMotion() || isMobile()} />
        </div>

        {/* Deep radial scrim so cards are legible */}
        <div className="pointer-events-none absolute inset-0 z-[1]"
          style={{ background: "radial-gradient(110% 80% at 50% 50%, rgba(5,3,8,0.25) 0%, rgba(5,3,8,0.75) 55%, rgba(5,3,8,0.97) 100%)" }} />

        <div className="relative z-10 mx-auto w-full max-w-[1320px] px-6 md:px-12">

          {/* Heading */}
          <div data-pheadwrap className="mb-16 text-center md:mb-20">
            <p data-phead
              style={{
                fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
                fontSize: "10px", letterSpacing: "0.36em", fontWeight: 600,
                color: "rgba(244,241,247,0.4)", textTransform: "uppercase", marginBottom: "20px",
              }}>
              MITGLIEDSCHAFT · PRIME ACCESS
            </p>
            <h2 data-phead className="font-serif-editorial"
              style={{ fontSize: "clamp(40px,5.5vw,84px)", lineHeight: 1.0, fontWeight: 300, color: "#efeaf6" }}>
              Wähle dein <span className="italic">Level.</span>
            </h2>
          </div>

          {/* Cards grid — PREMIUM centre is taller on desktop via self-stretch */}
          <div data-cards
            className="grid grid-cols-1 items-stretch gap-px md:grid-cols-3"
            style={{ perspective: "1400px" }}>

            {PLANS.map((plan, pi) => {
              const isFirst  = pi === 0;
              const isLast   = pi === PLANS.length - 1;

              return (
                <article key={plan.id} data-card
                  {...(plan.featured ? { "data-card-featured": "" } : {})}
                  onMouseMove={handleGlowMove}
                  onMouseLeave={handleGlowLeave}
                  style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    isolation: "isolate",
                    /* Shared glass base */
                    background: plan.featured
                      ? "rgba(18,10,38,0.72)"
                      : "rgba(9,7,15,0.55)",
                    backdropFilter: "blur(48px) saturate(120%)",
                    WebkitBackdropFilter: "blur(48px) saturate(120%)",
                    /* Border via box-shadow inset so it doesn't affect layout */
                    boxShadow: plan.featured
                      ? "inset 0 0 0 1px rgba(160,120,255,0.55), 0 0 80px -20px rgba(122,76,255,0.35)"
                      : `inset 0 0 0 1px rgba(244,241,247,0.09)`,
                    borderRadius: plan.featured ? "4px" : isFirst ? "4px 0 0 4px" : isLast ? "0 4px 4px 0" : "0",
                    padding: plan.featured ? "44px 40px 40px" : "40px 36px 36px",
                    /* CSS var defaults for cursor glow */
                    ["--glow-x" as string]: "50%",
                    ["--glow-y" as string]: "50%",
                    ["--glow-o" as string]: "0",
                    /* pull featured slightly up on desktop */
                    marginTop: plan.featured ? "0" : "0",
                  } as React.CSSProperties}>

                  {/* ── Ambient top edge glow (featured only) ── */}
                  {plan.featured && (
                    <div aria-hidden style={{
                      position: "absolute", top: 0, left: "10%", right: "10%", height: "1px",
                      background: "linear-gradient(90deg, transparent, rgba(190,155,255,0.9) 30%, rgba(255,255,255,0.7) 50%, rgba(190,155,255,0.9) 70%, transparent)",
                      boxShadow: "0 0 24px 4px rgba(150,100,255,0.5)",
                    }} />
                  )}

                  {/* ── Sweeping sheen animation (featured only) ── */}
                  {plan.featured && (
                    <div aria-hidden style={{
                      position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden",
                    }}>
                      <div style={{
                        position: "absolute", top: 0, bottom: 0, width: "40%",
                        background: "linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
                        animation: "cardSheen 5s ease-in-out infinite",
                        animationDelay: "2s",
                      }} />
                    </div>
                  )}

                  {/* ── Cursor-follow radial glow ── */}
                  {glowEnabled && (
                    <div aria-hidden style={{
                      position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1,
                      opacity: "var(--glow-o)" as unknown as number,
                      transition: "opacity 250ms ease-out",
                      background: plan.featured
                        ? "radial-gradient(500px circle at var(--glow-x) var(--glow-y), rgba(255,255,255,0.11), transparent 45%)"
                        : "radial-gradient(500px circle at var(--glow-x) var(--glow-y), rgba(150,110,255,0.16), transparent 45%)",
                    }} />
                  )}

                  {/* ── Content ── */}
                  <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", height: "100%" }}>

                    {/* Tag */}
                    {plan.tag && (
                      <span style={{
                        alignSelf: "flex-start",
                        marginBottom: "20px",
                        padding: "4px 10px",
                        borderRadius: "2px",
                        fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
                        fontSize: "9px", letterSpacing: "0.28em", fontWeight: 700,
                        color: "#b49bff",
                        background: "rgba(122,76,255,0.18)",
                        border: "1px solid rgba(150,100,255,0.35)",
                        textTransform: "uppercase",
                      }}>
                        {plan.tag}
                      </span>
                    )}

                    {/* Plan name */}
                    <p style={{
                      fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
                      fontSize: "10px", letterSpacing: "0.30em", fontWeight: 600,
                      textTransform: "uppercase",
                      color: plan.featured ? "rgba(190,160,255,0.8)" : "rgba(244,241,247,0.45)",
                      marginBottom: "12px",
                    }}>
                      {plan.name}
                    </p>

                    {/* Price */}
                    <div style={{ marginBottom: "8px", display: "flex", alignItems: "flex-start", gap: "6px" }}>
                      {plan.prefix && (
                        <span className="font-serif-editorial" style={{
                          fontSize: "clamp(16px,1.4vw,20px)", fontWeight: 300,
                          color: "rgba(239,234,246,0.5)", paddingTop: "10px",
                        }}>
                          {plan.prefix}
                        </span>
                      )}
                      <span data-price-val data-target={plan.value}
                        className="font-serif-editorial"
                        style={{
                          fontSize: "clamp(52px,5.5vw,88px)", lineHeight: 1,
                          fontWeight: 300,
                          color: plan.featured ? "#f0ebff" : "#efeaf6",
                          letterSpacing: "-0.03em",
                        }}>
                        {fmt(plan.value)}
                      </span>
                      {plan.priceNote && (
                        <span style={{ color: "rgba(244,241,247,0.35)", fontSize: "14px", paddingTop: "10px" }}>
                          {plan.priceNote}
                        </span>
                      )}
                    </div>
                    <p style={{
                      fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
                      fontSize: "11px", letterSpacing: "0.14em",
                      color: "rgba(244,241,247,0.35)", marginBottom: "32px",
                    }}>
                      {plan.period}
                    </p>

                    {/* Hairline divider */}
                    <div style={{ height: "1px", background: plan.featured ? "rgba(160,120,255,0.2)" : "rgba(244,241,247,0.07)", marginBottom: "28px" }} />

                    {/* Features */}
                    <ul style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "36px" }}>
                      {plan.features.map((f) => (
                        <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                          <Tick featured={plan.featured} />
                          <span style={{
                            fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
                            fontSize: "13px", lineHeight: 1.45,
                            color: plan.featured ? "rgba(244,241,247,0.78)" : "rgba(244,241,247,0.55)",
                          }}>
                            {f}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <a data-price-cta href="#kontakt"
                      style={{
                        marginTop: "auto",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                        padding: plan.featured ? "18px 28px" : "16px 28px",
                        fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
                        fontSize: "10px", letterSpacing: "0.24em", fontWeight: 700,
                        textTransform: "uppercase",
                        willChange: "transform",
                        textDecoration: "none",
                        color: plan.featured ? "#08060f" : "#f4f1f7",
                        background: plan.featured
                          ? "linear-gradient(135deg, #c9b8ff 0%, #a078ff 100%)"
                          : "transparent",
                        border: plan.featured
                          ? "none"
                          : "1px solid rgba(244,241,247,0.22)",
                        boxShadow: plan.featured
                          ? "0 8px 32px -8px rgba(122,76,255,0.6), inset 0 1px 0 rgba(255,255,255,0.25)"
                          : "none",
                      }}>
                      Jetzt anmelden
                      <span aria-hidden style={{ opacity: 0.7 }}>→</span>
                    </a>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Fine print */}
          <p style={{
            fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
            fontSize: "10px", lineHeight: 1.7,
            color: "rgba(244,241,247,0.28)", marginTop: "28px", textAlign: "center",
          }}>
            *24-monatige Mitgliedschaft. Zzgl. einmaliger Verwaltungsgebühr 49,90 € + Hygienepauschale 15 €/Jahr.
          </p>
        </div>
      </div>

      {/* Stats strip */}
      <div data-stats
        className="relative z-10 mx-auto w-full max-w-[1320px] px-6 pb-24 md:px-12 md:pb-32">
        <div style={{ borderTop: "1px solid rgba(244,241,247,0.07)", paddingTop: "32px" }}>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map((s) => (
              <div data-stat-item key={s.label}
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{
                  fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
                  fontSize: "9px", letterSpacing: "0.32em", fontWeight: 600,
                  color: "rgba(244,241,247,0.30)", textTransform: "uppercase",
                }}>
                  {s.icon}
                </span>
                <span style={{
                  fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
                  fontSize: "12px", letterSpacing: "0.08em",
                  color: "rgba(244,241,247,0.55)", fontWeight: 500,
                }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sheen keyframe */}
      <style>{`
        @keyframes cardSheen {
          0%   { left: -40%; opacity: 0; }
          10%  { opacity: 1; }
          50%  { left: 130%; opacity: 1; }
          51%  { opacity: 0; }
          100% { left: 130%; opacity: 0; }
        }
      `}</style>
    </section>
  );
}
