"use client";

import { useEffect, useRef, useState } from "react";

function useCountUp(end: number, durationMs: number, start: boolean) {
  const [value, setValue] = useState(0);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    if (!start) return;
    startTime.current = null;
    const step = (timestamp: number) => {
      if (startTime.current == null) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - (1 - progress) ** 2;
      setValue(Math.round(end * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, durationMs, start]);

  return value;
}

function AnimatedNumber({ end, suffix = "", duration = 1800 }: { end: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [start, setStart] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStart(true);
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const value = useCountUp(end, duration, start);
  return (
    <span ref={ref}>
      {value.toLocaleString("fr-FR")}{suffix}
    </span>
  );
}

const stats = [
  { value: 150, suffix: "+", label: "Chauffeurs indépendants" },
  { value: 12000, suffix: "+", label: "Trajets réalisés" },
  { value: 0, suffix: "%", label: "Commission prélevée" },
];

export function StatsCounter() {
  return (
    <section className="py-20 lg:py-28 relative bg-gradient-to-b from-background via-muted/15 to-background overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.label} className="group">
              <p className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium text-primary tabular-nums tracking-tight mb-2">
                <AnimatedNumber end={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-foreground/60 text-sm sm:text-base font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
