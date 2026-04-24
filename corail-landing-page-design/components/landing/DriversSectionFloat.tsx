"use client";

import { useEffect, useRef, useState } from "react";

export function DriversSectionFloat({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [y, setY] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const viewportCenter = window.innerHeight / 2;
      const diff = (center - viewportCenter) * 0.06;
      setY(diff);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      ref={ref}
      className="relative order-2 lg:order-1 transition-transform duration-150 ease-out"
      style={{ transform: `translate3d(0, ${y}px, 0)` }}
    >
      {children}
    </div>
  );
}
