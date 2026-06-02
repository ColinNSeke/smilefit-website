"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function FooterInfo() {
  const root = useRef<HTMLElement | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      if (reduce) {
        gsap.set("[data-fi], [data-bigmark]", { opacity: 1, y: 0, clipPath: "inset(0% 0%)" });
        return;
      }
      gsap.from("[data-fi]", {
        y: 26,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: { trigger: root.current, start: "top 78%" },
      });
      gsap.fromTo(
        "[data-bigmark]",
        { clipPath: "inset(0% 0% 100% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1.3,
          ease: "expo.out",
          scrollTrigger: { trigger: "[data-bigmark]", start: "top 92%" },
        }
      );

      // Footer headline glow
      gsap.fromTo(
        "[data-footer-headline]",
        { textShadow: "0 0 0px rgba(122,76,255,0)" },
        {
          textShadow: "0 0 60px rgba(122,76,255,0.18)",
          duration: 1.4,
          ease: "power2.out",
          scrollTrigger: { trigger: "[data-footer-headline]", start: "top 80%" },
        }
      );

      // CTA button glow on hover
      if (window.matchMedia("(hover: hover)").matches) {
        const ctaBtn = root.current?.querySelector<HTMLElement>("[data-footer-cta]");
        if (ctaBtn) {
          const onEnter = () => gsap.to(ctaBtn, { boxShadow: "0 0 28px rgba(122,76,255,0.35)", duration: 0.4, ease: "power2.out" });
          const onLeave = () => gsap.to(ctaBtn, { boxShadow: "0 0 0px rgba(122,76,255,0)", duration: 0.5 });
          ctaBtn.addEventListener("mouseenter", onEnter);
          ctaBtn.addEventListener("mouseleave", onLeave);
        }
      }
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <footer
      ref={root}
      id="kontakt"
      className="relative w-full overflow-hidden bg-[#050308] pt-24 text-[#f4f1f7] md:pt-32"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{ background: "radial-gradient(60% 50% at 50% 100%, rgba(95,48,195,0.12) 0%, transparent 60%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.22] mix-blend-screen"
        style={{
          backgroundImage:
            "radial-gradient(1.5px 1.5px at 20% 30%, rgba(160,120,255,0.6), transparent 55%), radial-gradient(1.2px 1.2px at 75% 20%, rgba(130,90,255,0.5), transparent 55%), radial-gradient(1px 1px at 50% 60%, rgba(200,170,255,0.45), transparent 55%), radial-gradient(1.3px 1.3px at 85% 70%, rgba(140,100,255,0.4), transparent 55%)",
          backgroundSize: "320px 320px, 280px 280px, 240px 240px, 360px 360px",
          animation: "heroParticleDrift 32s linear infinite",
          willChange: "background-position",
        }}
      />

      <div className="relative mx-auto max-w-[1320px] px-6 md:px-12">
        {/* Top: brand + contact intent */}
        <div className="flex flex-col gap-10 border-b pb-16 md:flex-row md:items-end md:justify-between" style={{ borderColor: "rgba(244,241,247,0.10)" }}>
          <div>
            <p
              data-fi
              className="mb-5 flex items-center gap-3"
              style={{
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontSize: "11px",
                letterSpacing: "0.32em",
                fontWeight: 600,
                color: "rgba(244,241,247,0.55)",
              }}
            >
              <span className="inline-block h-px w-8" style={{ background: "rgba(122,76,255,0.6)" }} />
              KONTAKT · STUTTGART
            </p>
            <h2
              data-fi
              data-footer-headline
              className="font-serif-editorial"
              style={{ fontSize: "clamp(32px, 4.6vw, 68px)", lineHeight: 1.02, fontWeight: 300, color: "#efeaf6", willChange: "text-shadow" }}
            >
              Bereit, wenn <span className="italic">du es bist.</span>
            </h2>
          </div>
          <a
            data-fi
            data-footer-cta
            href="#"
            className="group inline-flex w-fit items-center gap-4 border px-8 py-4 transition-colors"
            style={{
              willChange: "box-shadow",
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontSize: "11px",
              letterSpacing: "0.24em",
              fontWeight: 700,
              textTransform: "uppercase",
              color: "#f4f1f7",
              borderColor: "rgba(244,241,247,0.5)",
            }}
          >
            Probetraining reservieren
            <span aria-hidden className="transition-transform duration-500 group-hover:translate-x-1.5">→</span>
          </a>
        </div>

        {/* Info columns */}
        <div className="grid grid-cols-1 gap-12 py-16 md:grid-cols-3 md:gap-8">
          {/* Personalzeiten */}
          <div data-fi>
            <h3
              className="mb-5"
              style={{
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontSize: "11px",
                letterSpacing: "0.26em",
                fontWeight: 700,
                textTransform: "uppercase",
                color: "#c9b8ff",
              }}
            >
              Personalzeiten
            </h3>
            <ul className="flex flex-col gap-3" style={{ color: "rgba(244,241,247,0.72)" }}>
              <li style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontSize: "13.5px", lineHeight: 1.6 }}>
                <span className="block text-[#f4f1f7]">Montag – Freitag</span>
                07:00 – 23:00 Uhr
              </li>
              <li style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontSize: "13.5px", lineHeight: 1.6 }}>
                <span className="block text-[#f4f1f7]">Samstag</span>
                07:00 – 09:00 · 14:00 – 17:00 · 22:00 – 23:00 Uhr
              </li>
              <li style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontSize: "13.5px", lineHeight: 1.6 }}>
                <span className="block text-[#f4f1f7]">Sonntag</span>
                14:00 – 17:00 · 22:00 – 23:00 Uhr
              </li>
            </ul>
          </div>

          {/* Öffnungszeiten Premium */}
          <div data-fi>
            <h3
              className="mb-5"
              style={{
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontSize: "11px",
                letterSpacing: "0.26em",
                fontWeight: 700,
                textTransform: "uppercase",
                color: "#c9b8ff",
              }}
            >
              Öffnungszeiten Premium
            </h3>
            <p style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontSize: "13.5px", lineHeight: 1.6, color: "rgba(244,241,247,0.72)" }}>
              <span className="block text-[#f4f1f7]">Montag – Sonntag</span>
              24 Stunden geöffnet
            </p>

            <h3
              className="mb-5 mt-9"
              style={{
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontSize: "11px",
                letterSpacing: "0.26em",
                fontWeight: 700,
                textTransform: "uppercase",
                color: "#c9b8ff",
              }}
            >
              Öffnungszeiten Basic
            </h3>
            <p style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontSize: "13.5px", lineHeight: 1.6, color: "rgba(244,241,247,0.72)" }}>
              <span className="block text-[#f4f1f7]">Montag – Sonntag</span>
              07:00 – 23:00 Uhr
            </p>
          </div>

          {/* Social / Follow */}
          <div data-fi>
            <h3
              className="mb-5"
              style={{
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontSize: "11px",
                letterSpacing: "0.26em",
                fontWeight: 700,
                textTransform: "uppercase",
                color: "#c9b8ff",
              }}
            >
              Folge uns
            </h3>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 transition-colors"
              style={{ color: "rgba(244,241,247,0.78)" }}
            >
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors group-hover:border-[#7a4cff]"
                style={{ border: "1px solid rgba(244,241,247,0.25)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </span>
              <span style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", fontSize: "13.5px", letterSpacing: "0.04em" }}>
                @smilefit
              </span>
            </a>
          </div>
        </div>
      </div>

      {/* Giant wordmark */}
      <div className="relative overflow-hidden px-6 md:px-12">
        <h2
          data-bigmark
          className="font-display mx-auto max-w-[1320px] leading-none"
          style={{
            fontSize: "clamp(64px, 19vw, 320px)",
            letterSpacing: "-0.04em",
            color: "transparent",
            WebkitTextStroke: "1px rgba(244,241,247,0.14)",
            lineHeight: 0.82,
            paddingBottom: "0.06em",
          }}
        >
          SMILEFIT
        </h2>
      </div>

      {/* Bottom bar */}
      <div className="relative border-t" style={{ borderColor: "rgba(244,241,247,0.10)" }}>
        <div
          className="mx-auto flex max-w-[1320px] flex-col gap-3 px-6 py-7 md:flex-row md:items-center md:justify-between md:px-12"
          style={{
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            fontSize: "11px",
            letterSpacing: "0.14em",
            color: "rgba(244,241,247,0.42)",
          }}
        >
          <span>© {new Date().getFullYear()} SMILEFIT · STUTTGART</span>
          <div className="flex gap-7">
            <a href="#" className="transition-colors hover:text-[#f4f1f7]">Impressum</a>
            <a href="#" className="transition-colors hover:text-[#f4f1f7]">Datenschutz</a>
            <a href="#" className="transition-colors hover:text-[#f4f1f7]">AGB</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
