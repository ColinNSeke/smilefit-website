"use client";

import SmoothScroll from "./SmoothScroll";
import CinematicHero from "./CinematicHero";
import RoomPowerOn from "./RoomPowerOn";
import TrainingGrid from "./TrainingGrid";
import MarqueeBand from "./MarqueeBand";
import EditorialStatement from "./EditorialStatement";
import HorizontalGallery from "./HorizontalGallery";
import FooterCTA from "./FooterCTA";

export default function SmileFitLanding() {
  return (
    <>
      <SmoothScroll />
      <main className="relative w-full">
        <CinematicHero />
        <RoomPowerOn />
        <TrainingGrid />
        <MarqueeBand />
        <EditorialStatement />
        <HorizontalGallery />
        <FooterCTA />
      </main>
    </>
  );
}
