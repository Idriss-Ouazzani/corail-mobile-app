"use client";

import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { DashboardPeriod } from "@/lib/admin-dashboard";

const PERIODS: { value: DashboardPeriod; label: string }[] = [
  { value: 7, label: "7 jours" },
  { value: 30, label: "30 jours" },
  { value: 90, label: "90 jours" },
];

export function PeriodFilter({ currentPeriod }: { currentPeriod: DashboardPeriod }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function setPeriod(period: DashboardPeriod) {
    if (period === currentPeriod) return;
    startTransition(() => {
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      next.set("period", String(period));
      router.push(`${pathname}?${next.toString()}`);
      router.refresh(); // Force server to re-run with new searchParams (évite cache routeur)
    });
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--card)] p-1">
      {PERIODS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setPeriod(value)}
          disabled={isPending}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
            currentPeriod === value
              ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
              : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          {label}
        </button>
      ))}
      {isPending && <span className="ml-1 text-xs text-[var(--muted-foreground)]">Chargement…</span>}
    </div>
  );
}
