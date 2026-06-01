"use client";

import SmoothScroll from "./SmoothScroll";
import BlobHero from "./BlobHero";
import MediaCollage from "./MediaCollage";
import TrainingGrid from "./TrainingGrid";
import EditorialStatement from "./EditorialStatement";
import HorizontalGallery from "./HorizontalGallery";
import FooterCTA from "./FooterCTA";

export default function SmileFitLanding() {
  return (
    <>
      <SmoothScroll />
      <main className="relative w-full">
        <BlobHero />
        <MediaCollage />
        <TrainingGrid />
        <EditorialStatement />
        <HorizontalGallery />
        <FooterCTA />
      </main>
    </>
  );
}
