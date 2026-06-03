"use client";

import CustomCursor from "./CustomCursor";
import ScrollProgressRail from "./ScrollProgressRail";
import CinematicHero from "./CinematicHero";
import RaumeSection from "./RaumeSection";
import ManifestoSection from "./ManifestoSection";
import PricingSection from "./PricingSection";
import FooterInfo from "./FooterInfo";

export default function SmileFitLanding() {
  return (
    <>
      <CustomCursor />
      <ScrollProgressRail />
      <main className="relative w-full bg-[#050308]">
        <CinematicHero />
        <RaumeSection />
        <ManifestoSection />
        <PricingSection />
        <FooterInfo />
      </main>
    </>
  );
}
