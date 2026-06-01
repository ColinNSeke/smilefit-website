"use client";

import { useState } from "react";

type Props = {
  src: string;
  alt?: string;
  className?: string;
  video?: boolean;
};

export function Media({ src, alt = "", className = "", video = false }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <div className={`media-fallback ${className}`} aria-label={alt} />;
  }

  if (video) {
    return (
      <video
        src={src}
        className={className}
        muted
        autoPlay
        loop
        playsInline
        preload="metadata"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
