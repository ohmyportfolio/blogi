"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ImageLightbox } from "@/components/ui/image-lightbox";

interface HtmlContentWithLightboxProps {
  html: string;
  className?: string;
}

export function HtmlContentWithLightbox({ html, className }: HtmlContentWithLightboxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const handleClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "IMG") {
      const src = (target as HTMLImageElement).src;
      if (src) {
        setLightboxSrc(src);
      }
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("click", handleClick);
    // Add cursor pointer to all images
    const images = el.querySelectorAll("img");
    images.forEach((img) => {
      img.style.cursor = "pointer";
    });
    return () => {
      el.removeEventListener("click", handleClick);
    };
  }, [handleClick]);

  return (
    <>
      <div
        ref={containerRef}
        className={className}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {lightboxSrc && createPortal(
        <ImageLightbox
          src={lightboxSrc}
          onClose={() => setLightboxSrc(null)}
        />,
        document.body
      )}
    </>
  );
}
