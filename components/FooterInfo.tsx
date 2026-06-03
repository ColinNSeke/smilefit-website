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
        gsap.set("[data-fi],[data-bigmark],[data-footer-headline],[data-footer-cta]",
          { clearProps: "all" });
        return;
      }

      /* =============================================
         CINEMATIC REVEAL — section emerges from total darkness
      ============================================= */

      // Start: everything hidden
      gsap.set("[data-footer-headline]", {
        opacity: 0,
        scale: 1.28,
        filter: "blur(32px)",
        y: 40,
      });
      gsap.set("[data-fi]", { opacity: 0, y: 50, filter: "blur(10px)" });
      gsap.set("[data-footer-cta]", { opacity: 0, y: 40 });

      // Darkness overlay starts opaque
      gsap.set("[data-footer-darken]", { opacity: 1 });

      // Master timeline triggered when section enters
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top 80%",
        },
      });

      tl
        // 1. Darkness lifts
        .to("[data-footer-darken]", { opacity: 0, duration: 1.4, ease: "power2.out" }, 0)

        // 2. Headline bursts in — biggest blur clear of the page
        .to("[data-footer-headline]", {
          opacity: 1,
          scale: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1.5,
          ease: "expo.out",
          onComplete: () => {
            gsap.set("[data-footer-headline]", { clearProps: "filter" });
            // Purple glow settles into the headline
            gsap.to("[data-footer-headline]", {
              textShadow: "0 0 80px rgba(122,76,255,0.45)",
              duration: 1.0,
              ease: "power2.out",
            });
          },
        }, 0.3)

        // 3. Info columns rise in
        .to("[data-fi]", {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1.0,
          ease: "power3.out",
          stagger: 0.09,
          onComplete: () => gsap.set("[data-fi]", { clearProps: "filter" }),
        }, 0.7)

        // 4. CTA button
        .to("[data-footer-cta]", { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" }, 0.9);

      // WORDMARK — stroke draws in left → right, then tilts on scroll-past
      gsap.fromTo(
        "[data-bigmark]",
        { clipPath: "inset(0% 100% 0% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1.4,
          ease: "expo.out",
          scrollTrigger: { trigger: "[data-bigmark]", start: "top 90%" },
        }
      );
      // read-from-below tilt (max 4°) as it leaves the viewport
      gsap.fromTo(
        "[data-bigmark]",
        { rotateX: 0 },
        {
          rotateX: 4,
          ease: "none",
          transformPerspective: 900,
          transformOrigin: "center bottom",
          scrollTrigger: { trigger: "[data-bigmark]", start: "top 60%", end: "bottom top", scrub: 0.6 },
        }
      );

      /* =============================================
         CTA BUTTON — always-pulsing glow
      ============================================= */
      const ctaBtn = root.current?.querySelector<HTMLElement>("[data-footer-cta]");
      if (ctaBtn) {
        const pulse = gsap.to(ctaBtn, {
          boxShadow: "0 0 42px rgba(122,76,255,0.65)",
          duration: 1.6,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: 1.2,
        });

        if (window.matchMedia("(hover: hover)").matches) {
          const onMove = (e: MouseEvent) => {
            const r  = ctaBtn.getBoundingClientRect();
            const dx = (e.clientX - (r.left + r.width  / 2)) * 0.38;
            const dy = (e.clientY - (r.top  + r.height / 2)) * 0.38;
            pulse.pause();
            gsap.to(ctaBtn, {
              x: dx, y: dy,
              boxShadow: "0 0 60px rgba(122,76,255,0.90)",
              duration: 0.3, ease: "power2.out",
            });
          };
          const onLeave = () => {
            gsap.to(ctaBtn, {
              x: 0, y: 0,
              duration: 0.6, ease: "elastic.out(1,0.5)",
              onComplete: () => pulse.play(),
            });
          };
          ctaBtn.addEventListener("mousemove", onMove as EventListener);
          ctaBtn.addEventListener("mouseleave", onLeave);
        }
      }
    }, root);

    const t = setTimeout(() => ScrollTrigger.refresh(), 700);
    if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    return () => { clearTimeout(t); ctx.revert(); };
  }, []);

  return (
    <footer
      ref={root}
      id="kontakt"
      className="relative w-full overflow-hidden bg-[#050308] pt-24 text-[#f4f1f7] md:pt-32"
    >
      {/* Darkness overlay — lifted by GSAP */}
      <div
        data-footer-darken
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[10] bg-[#050308]"
        style={{ willChange: "opacity" }}
      />

      {/* Purple energy wash */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 100%, rgba(122,76,255,0.22) 0%, transparent 60%)",
        }}
      />

      {/* Drifting particles */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.28] mix-blend-screen"
        style={{
          backgroundImage:
            "radial-gradient(1.8px 1.8px at 18% 28%, rgba(180,130,255,0.7), transparent 50%), radial-gradient(1.4px 1.4px at 72% 18%, rgba(140,90,255,0.6), transparent 50%), radial-gradient(1.2px 1.2px at 48% 58%, rgba(200,170,255,0.55), transparent 50%), radial-gradient(1.5px 1.5px at 83% 68%, rgba(160,100,255,0.5), transparent 50%)",
          backgroundSize: "340px 340px, 290px 290px, 250px 250px, 380px 380px",
          animation: "heroParticleDrift 28s linear infinite",
          willChange: "background-position",
        }}
      />

      <div className="relative z-[11] mx-auto max-w-[1320px] px-6 md:px-12">
        {/* TOP — brand + contact intent */}
        <div
          className="flex flex-col gap-10 border-b pb-16 md:flex-row md:items-end md:justify-between"
          style={{ borderColor: "rgba(244,241,247,0.10)" }}
        >
          <div>
            <p
              data-fi
              className="mb-5 flex items-center gap-3"
              style={{
                fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
                fontSize: "11px",
                letterSpacing: "0.32em",
                fontWeight: 600,
                color: "rgba(244,241,247,0.55)",
              }}
            >
              <span className="inline-block h-px w-8" style={{ background: "rgba(122,76,255,0.8)" }} />
              KONTAKT · STUTTGART
            </p>
            <h2
              data-footer-headline
              className="font-serif-editorial"
              style={{
                fontSize: "clamp(32px,4.6vw,68px)",
                lineHeight: 1.02,
                fontWeight: 300,
                color: "#efeaf6",
                willChange: "transform, opacity, filter, text-shadow",
              }}
            >
              Bereit, wenn <span className="italic">du es bist.</span>
            </h2>
          </div>

          <a
            data-footer-cta
            href="#"
            className="group inline-flex w-fit items-center gap-4 border px-8 py-4 transition-colors"
            style={{
              fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
              fontSize: "11px",
              letterSpacing: "0.24em",
              fontWeight: 700,
              textTransform: "uppercase",
              color: "#f4f1f7",
              borderColor: "rgba(244,241,247,0.55)",
              willChange: "transform, box-shadow",
            }}
          >
            Probetraining reservieren
            <span aria-hidden className="transition-transform duration-500 group-hover:translate-x-2">→</span>
          </a>
        </div>

        {/* INFO COLUMNS */}
        <div className="grid grid-cols-1 gap-12 py-16 md:grid-cols-3 md:gap-8">
          {/* Personalzeiten */}
          <div data-fi>
            <h3
              className="mb-5"
              style={{
                fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
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
              <li style={{ fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif", fontSize: "13.5px", lineHeight: 1.6 }}>
                <span className="block text-[#f4f1f7]">Montag – Freitag</span>07:00 – 23:00 Uhr
              </li>
              <li style={{ fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif", fontSize: "13.5px", lineHeight: 1.6 }}>
                <span className="block text-[#f4f1f7]">Samstag</span>07:00 – 09:00 · 14:00 – 17:00 · 22:00 – 23:00 Uhr
              </li>
              <li style={{ fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif", fontSize: "13.5px", lineHeight: 1.6 }}>
                <span className="block text-[#f4f1f7]">Sonntag</span>14:00 – 17:00 · 22:00 – 23:00 Uhr
              </li>
            </ul>
          </div>

          {/* Öffnungszeiten */}
          <div data-fi>
            <h3
              className="mb-5"
              style={{
                fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
                fontSize: "11px",
                letterSpacing: "0.26em",
                fontWeight: 700,
                textTransform: "uppercase",
                color: "#c9b8ff",
              }}
            >
              Öffnungszeiten Premium
            </h3>
            <p style={{ fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif", fontSize: "13.5px", lineHeight: 1.6, color: "rgba(244,241,247,0.72)" }}>
              <span className="block text-[#f4f1f7]">Montag – Sonntag</span>24 Stunden geöffnet
            </p>
            <h3
              className="mb-5 mt-9"
              style={{
                fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
                fontSize: "11px",
                letterSpacing: "0.26em",
                fontWeight: 700,
                textTransform: "uppercase",
                color: "#c9b8ff",
              }}
            >
              Öffnungszeiten Basic
            </h3>
            <p style={{ fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif", fontSize: "13.5px", lineHeight: 1.6, color: "rgba(244,241,247,0.72)" }}>
              <span className="block text-[#f4f1f7]">Montag – Sonntag</span>07:00 – 23:00 Uhr
            </p>
          </div>

          {/* Social */}
          <div data-fi>
            <h3
              className="mb-5"
              style={{
                fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
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
              <span style={{ fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif", fontSize: "13.5px", letterSpacing: "0.04em" }}>
                @smilefit
              </span>
            </a>
          </div>
        </div>
      </div>

      {/* GIANT WORDMARK */}
      <div className="relative z-[11] overflow-hidden px-6 md:px-12">
        <h2
          data-bigmark
          className="font-display mx-auto max-w-[1320px] leading-none"
          style={{
            fontSize: "clamp(64px,19vw,320px)",
            letterSpacing: "-0.04em",
            color: "transparent",
            WebkitTextStroke: "1px rgba(244,241,247,0.16)",
            lineHeight: 0.82,
            paddingBottom: "0.06em",
            willChange: "clip-path, transform",
          }}
        >
          SMILEFIT
        </h2>
      </div>

      {/* BOTTOM BAR */}
      <div className="relative z-[11] border-t" style={{ borderColor: "rgba(244,241,247,0.10)" }}>
        <div
          className="mx-auto flex max-w-[1320px] flex-col gap-3 px-6 py-7 md:flex-row md:items-center md:justify-between md:px-12"
          style={{
            fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
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
