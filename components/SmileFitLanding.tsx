"use client";

import SmoothScroll from "./SmoothScroll";
import IntroSequence from "./IntroSequence";
import MixBlendCursor from "./MixBlendCursor";
import ScrollProgressRail from "./ScrollProgressRail";
import CinematicHero from "./CinematicHero";
import RaumeSection from "./RaumeSection";
import ManifestoSection from "./ManifestoSection";
import PricingSection from "./PricingSection";
import FooterInfo from "./FooterInfo";

export default function SmileFitLanding() {
  return (
    <>
      <IntroSequence />
      <MixBlendCursor />
      <ScrollProgressRail />
      <SmoothScroll />
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
