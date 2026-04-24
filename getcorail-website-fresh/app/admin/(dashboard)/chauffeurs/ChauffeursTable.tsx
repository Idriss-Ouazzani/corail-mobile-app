"use client";

import { useState, useMemo } from "react";
import type { ChauffeurRow } from "@/lib/admin-chauffeurs";

function toCSV(rows: ChauffeurRow[]): string {
  const headers = ["email", "full_name", "slug", "driver_verification_status", "zone_city", "created_at"];
  const escape = (v: string | null) => (v == null ? "" : `"${String(v).replace(/"/g, '""')}"`);
  const line = (r: ChauffeurRow) =>
    headers.map((h) => escape((r as Record<string, string | null>)[h])).join(",");
  return [headers.join(","), ...rows.map(line)].join("\r\n");
}

export default function ChauffeursTable({ rows }: { rows: ChauffeurRow[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.email.toLowerCase().includes(q) ||
        (r.full_name || "").toLowerCase().includes(q) ||
        (r.slug || "").toLowerCase().includes(q) ||
        (r.zone_city || "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  function handleExport() {
    const csv = toCSV(filtered);
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chauffeurs-corail-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <input
          type="search"
          placeholder="Rechercher (email, nom, slug, ville…)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
        <button
          type="button"
          onClick={handleExport}
          className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
        >
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Nom</th>
              <th className="p-3 font-medium">Slug</th>
              <th className="p-3 font-medium">Statut</th>
              <th className="p-3 font-medium">Ville</th>
              <th className="p-3 font-medium">Créé le</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-[var(--muted-foreground)]">
                  Aucun chauffeur trouvé.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-b border-[var(--border)] hover:bg-[var(--muted)]/50">
                  <td className="p-3">{r.email}</td>
                  <td className="p-3">{r.full_name || "—"}</td>
                  <td className="p-3">{r.slug || "—"}</td>
                  <td className="p-3">
                    <span
                      className={
                        r.driver_verification_status === "approved"
                          ? "text-green-600"
                          : r.driver_verification_status === "pending"
                            ? "text-amber-600"
                            : "text-[var(--muted-foreground)]"
                      }
                    >
                      {r.driver_verification_status}
                    </span>
                  </td>
                  <td className="p-3">{r.zone_city || "—"}</td>
                  <td className="p-3">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString("fr-FR") : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[var(--muted-foreground)]">
        {filtered.length} chauffeur{filtered.length !== 1 ? "s" : ""} affiché
        {search.trim() ? ` (filtré sur « ${search.trim()} »)` : ""}
      </p>
    </div>
  );
}
