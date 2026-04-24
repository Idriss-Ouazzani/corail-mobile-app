"use client";

import { useEffect, useRef, useState } from "react";

export function HeroParallax() {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const viewportCenter = typeof window !== "undefined" ? window.innerHeight / 2 : 0;
      const diff = center - viewportCenter;
      setOffset(diff * 0.08);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      ref={ref}
      className="absolute inset-0 z-0"
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/hero-bg.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-100 ease-out"
        style={{ transform: `translate3d(0, ${offset}px, 0) scale(1.02)` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/92 to-background/50 hero-gradient-pulse" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-primary/5 pointer-events-none" />
    </div>
  );
}
