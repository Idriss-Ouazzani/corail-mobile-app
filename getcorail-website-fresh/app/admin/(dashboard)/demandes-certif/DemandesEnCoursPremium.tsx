"use client";

import Link from "next/link";
import { useMemo, useState, useCallback } from "react";
import type { CredentialRequestRow } from "@/lib/credential-change-requests";

export type DriverDocKey =
  | "vtc_card"
  | "vtc_card_verso"
  | "id_card"
  | "id_card_verso"
  | "insurance";

export type DriverVerificationRow = {
  id: string;
  user_id: string;
  driver_verification_submitted_at: string | null;
  verification_id_document_type: string;
  verification_vtc_card_status: string;
  verification_vtc_card_status_verso: string;
  verification_id_card_status: string;
  verification_id_card_status_verso: string;
  verification_insurance_status: string;
  verification_vtc_card_url: string | null;
  verification_vtc_card_url_verso: string | null;
  verification_id_card_url: string | null;
  verification_id_card_url_verso: string | null;
  verification_insurance_url: string | null;
  user_full_name: string | null;
  user_email: string | null;
  _signedVtc: string | null;
  _signedVtcVerso: string | null;
  _signedId: string | null;
  _signedIdVerso: string | null;
  _signedInsurance: string | null;
};

type Category = "all" | "profile" | "credential";
type ProfileChip = "vtc_card" | "id_card" | "insurance";
type CredChip = "phone" | "vtc_number" | "siret" | "insurance";

const PROFILE_FILTER_CHIPS: { key: ProfileChip; short: string }[] = [
  { key: "vtc_card", short: "VTC" },
  { key: "id_card", short: "ID" },
  { key: "insurance", short: "Ass." },
];

const CRED_LABEL: Record<string, { label: string; short: string }> = {
  phone: { label: "Téléphone", short: "Tél." },
  vtc_number: { label: "N° carte VTC", short: "Carte" },
  siret: { label: "SIRET", short: "SIRET" },
  insurance: { label: "Assurance RC Pro", short: "Ass." },
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function fieldForDoc(row: DriverVerificationRow, key: DriverDocKey) {
  switch (key) {
    case "vtc_card":
      return { status: row.verification_vtc_card_status, url: row._signedVtc } as const;
    case "vtc_card_verso":
      return { status: row.verification_vtc_card_status_verso, url: row._signedVtcVerso } as const;
    case "id_card":
      return { status: row.verification_id_card_status, url: row._signedId } as const;
    case "id_card_verso":
      return { status: row.verification_id_card_status_verso, url: row._signedIdVerso } as const;
    case "insurance":
      return { status: row.verification_insurance_status, url: row._signedInsurance } as const;
  }
}

function visibleDocSlots(row: DriverVerificationRow): { key: DriverDocKey; label: string; short: string }[] {
  const idType = row.verification_id_document_type || "cni";
  const slots: { key: DriverDocKey; label: string; short: string }[] = [
    { key: "vtc_card", label: "Carte VTC (recto)", short: "VTC R" },
    { key: "vtc_card_verso", label: "Carte VTC (verso)", short: "VTC V" },
    {
      key: "id_card",
      label: idType === "passport" ? "Passeport (page identité)" : "Pièce d’identité (recto)",
      short: "ID R",
    },
  ];
  if (idType === "cni") {
    slots.push({ key: "id_card_verso", label: "Pièce d’identité (verso)", short: "ID V" });
  }
  slots.push({ key: "insurance", label: "Assurance RC Pro", short: "Ass." });
  return slots;
}

function vtcSectionPending(row: DriverVerificationRow): boolean {
  const rOk = row.verification_vtc_card_status === "approved";
  const hasV = !!(row.verification_vtc_card_url_verso && String(row.verification_vtc_card_url_verso).trim());
  const vOk = row.verification_vtc_card_status_verso === "approved" || (!hasV && rOk);
  return !(rOk && vOk);
}

function idSectionPending(row: DriverVerificationRow): boolean {
  const idType = row.verification_id_document_type || "cni";
  const rOk = row.verification_id_card_status === "approved";
  if (idType === "passport") return !rOk;
  const hasV = !!(row.verification_id_card_url_verso && String(row.verification_id_card_url_verso).trim());
  const vOk = row.verification_id_card_status_verso === "approved" || (!hasV && rOk);
  return !(rOk && vOk);
}

function insuranceSectionPending(row: DriverVerificationRow) {
  return row.verification_insurance_status !== "approved";
}

function driverMatchesProfileChips(row: DriverVerificationRow, chips: Set<ProfileChip>) {
  if (chips.size === 0) return true;
  for (const c of chips) {
    if (c === "vtc_card" && vtcSectionPending(row)) return true;
    if (c === "id_card" && idSectionPending(row)) return true;
    if (c === "insurance" && insuranceSectionPending(row)) return true;
  }
  return false;
}

function docSlotPending(row: DriverVerificationRow, key: DriverDocKey) {
  return fieldForDoc(row, key).status !== "approved";
}

function credMatchesChips(row: CredentialRequestRow, chips: Set<CredChip>) {
  if (chips.size === 0) return true;
  return chips.has(row.request_type as CredChip);
}

function matchesSearch(q: string, name: string | null | undefined, email: string | null | undefined) {
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  return (name || "").toLowerCase().includes(s) || (email || "").toLowerCase().includes(s);
}

function DocThumbLink({ href, caption }: { href: string; caption: string }) {
  const isImg = /\.(jpe?g|png|webp|gif|heic)(\?|$)/i.test(href);
  return (
    <div className="mt-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{caption}</p>
      {isImg ? (
        <a href={href} target="_blank" rel="noreferrer" className="mt-1 block overflow-hidden rounded-lg ring-1 ring-[var(--border)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={href} alt="" className="h-32 w-full object-cover transition hover:opacity-90" />
        </a>
      ) : (
        <a href={href} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-xs font-medium text-[var(--primary)] hover:underline">
          Ouvrir le fichier
        </a>
      )}
    </div>
  );
}

type Unified =
  | { kind: "driver"; id: string; sortAt: number; row: DriverVerificationRow }
  | { kind: "credential"; id: string; sortAt: number; row: CredentialRequestRow };

function buildUnified(drivers: DriverVerificationRow[], creds: CredentialRequestRow[]): Unified[] {
  const u: Unified[] = [
    ...drivers.map((row) => ({
      kind: "driver" as const,
      id: row.id,
      sortAt: row.driver_verification_submitted_at
        ? new Date(row.driver_verification_submitted_at).getTime()
        : 0,
      row,
    })),
    ...creds.map((row) => ({
      kind: "credential" as const,
      id: row.id,
      sortAt: new Date(row.created_at).getTime(),
      row,
    })),
  ];
  u.sort((a, b) => b.sortAt - a.sortAt);
  return u;
}

export type VerificationPreview = {
  vtcR: string | null;
  vtcV: string | null;
  ins: string | null;
  kbis: string | null;
};

export default function DemandesEnCoursPremium({
  driverRows,
  credentialRows,
  docUrlMap,
  docUrlMapVerso,
  verificationPreviewByUserId,
  credentialFiltre,
}: {
  driverRows: DriverVerificationRow[];
  credentialRows: CredentialRequestRow[];
  docUrlMap: Record<string, string>;
  docUrlMapVerso: Record<string, string>;
  verificationPreviewByUserId: Record<string, VerificationPreview>;
  credentialFiltre: "pending" | "all";
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const [profileChips, setProfileChips] = useState<Set<ProfileChip>>(new Set());
  const [credChips, setCredChips] = useState<Set<CredChip>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [credNote, setCredNote] = useState<Record<string, string>>({});

  const toggleProfileChip = (c: ProfileChip) => {
    setProfileChips((prev) => {
      const n = new Set(prev);
      if (n.has(c)) n.delete(c);
      else n.add(c);
      return n;
    });
  };
  const toggleCredChip = (c: CredChip) => {
    setCredChips((prev) => {
      const n = new Set(prev);
      if (n.has(c)) n.delete(c);
      else n.add(c);
      return n;
    });
  };

  const filtered = useMemo(() => {
    const q = search;
    const list = buildUnified(driverRows, credentialRows);
    return list.filter((item) => {
      if (item.kind === "driver") {
        if (category === "credential") return false;
        if (!matchesSearch(q, item.row.user_full_name, item.row.user_email)) return false;
        if (category === "profile" || category === "all") {
          if (!driverMatchesProfileChips(item.row, profileChips)) return false;
        }
        return true;
      }
      if (category === "profile") return false;
      if (!matchesSearch(q, item.row.user_full_name, item.row.user_email)) return false;
      if (!credMatchesChips(item.row, credChips)) return false;
      return true;
    });
  }, [driverRows, credentialRows, search, category, profileChips, credChips]);

  const stats = useMemo(() => {
    const pendCred = credentialRows.filter((r) => r.status === "pending").length;
    return { profile: driverRows.length, credPending: pendCred, credTotal: credentialRows.length };
  }, [driverRows, credentialRows]);

  const reviewDoc = useCallback(async (vtcId: string, docType: DriverDocKey, status: "approved" | "rejected") => {
    let adminNotes: string | undefined;
    if (status === "rejected") {
      const n = window.prompt("Note interne (optionnelle) pour le rejet de ce document :") ?? "";
      adminNotes = n.trim() || undefined;
    }
    const key = `${vtcId}-${docType}-${status}`;
    setLoadingKey(key);
    try {
      const res = await fetch(`/admin/api/driver-verification/${vtcId}/document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docType, status, adminNotes }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || res.statusText);
      if (j.allApproved) window.alert("Profil approuvé : tous les documents requis sont validés.");
      window.location.reload();
    } catch (e) {
      window.alert((e as Error).message);
    } finally {
      setLoadingKey(null);
    }
  }, []);

  const rejectProfile = useCallback(async (vtcId: string) => {
    const reason = window.prompt("Raison du rejet du dossier (visible côté chauffeur) :");
    if (reason == null) return;
    const r = reason.trim();
    if (!r) {
      window.alert("Une raison est obligatoire.");
      return;
    }
    setLoadingKey(`${vtcId}-reject-all`);
    try {
      const res = await fetch(`/admin/api/driver-verification/${vtcId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: r }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || res.statusText);
      window.location.reload();
    } catch (e) {
      window.alert((e as Error).message);
    } finally {
      setLoadingKey(null);
    }
  }, []);

  const credAct = useCallback(async (id: string, action: "approve" | "reject") => {
    setLoadingKey(id);
    try {
      const res = await fetch(`/admin/api/credential-requests/${id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: credNote[id]?.trim() || undefined }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || res.statusText);
      window.location.reload();
    } catch (e) {
      window.alert((e as Error).message);
    } finally {
      setLoadingKey(null);
    }
  }, [credNote]);

  const toggleExpand = (key: string) => {
    setExpanded((e) => (e === key ? null : key));
  };

  return (
    <div className="space-y-8">
      {/* Bandeau stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 px-5 py-4 shadow-sm backdrop-blur-sm">
          <p className="font-[family-name:var(--font-serif)] text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            {stats.profile}
          </p>
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--muted-foreground)]">Dossiers profil</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 px-5 py-4 shadow-sm backdrop-blur-sm">
          <p className="font-[family-name:var(--font-serif)] text-2xl font-semibold tracking-tight text-amber-400/90">
            {stats.credPending}
          </p>
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--muted-foreground)]">Changements en attente</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 px-5 py-4 shadow-sm backdrop-blur-sm">
          <p className="font-[family-name:var(--font-serif)] text-2xl font-semibold tracking-tight text-[var(--muted-foreground)]">
            {filtered.length}
          </p>
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--muted-foreground)]">Affichés (filtres)</p>
        </div>
      </div>

      {/* Barre filtres */}
      <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-b from-[var(--card)] to-[var(--background)]/40 p-4 shadow-md sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="relative min-w-[200px] flex-1 max-w-xl">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" aria-hidden>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou e-mail…"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)]/80 py-2.5 pl-10 pr-4 text-sm text-[var(--foreground)] outline-none ring-0 transition-shadow placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)]/50 focus:shadow-[0_0_0_3px_oklch(0.72_0.17_45/0.2)]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Vue</span>
            {(
              [
                { id: "all" as const, label: "Tout" },
                { id: "profile" as const, label: "Profil" },
                { id: "credential" as const, label: "Coordonnées" },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setCategory(id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  category === id
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md shadow-[var(--primary)]/25"
                    : "border border-[var(--border)] bg-[var(--muted)]/20 text-[var(--muted-foreground)] hover:bg-[var(--muted)]/35 hover:text-[var(--foreground)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {(category === "all" || category === "profile") && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--border)]/60 pt-4">
            <span className="w-full text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)] sm:w-auto sm:mr-2">
              Documents profil
            </span>
            {PROFILE_FILTER_CHIPS.map(({ key, short }) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleProfileChip(key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  profileChips.has(key)
                    ? "bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/40"
                    : "bg-[var(--muted)]/25 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {short}
              </button>
            ))}
            {profileChips.size > 0 && (
              <button
                type="button"
                onClick={() => setProfileChips(new Set())}
                className="ml-auto text-xs text-[var(--primary)] underline-offset-2 hover:underline"
              >
                Réinitialiser
              </button>
            )}
          </div>
        )}

        {(category === "all" || category === "credential") && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--border)]/60 pt-4 sm:mt-4">
            <span className="w-full text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)] sm:w-auto sm:mr-2">
              Type de changement
            </span>
            {(["phone", "vtc_number", "siret", "insurance"] as CredChip[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleCredChip(key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  credChips.has(key)
                    ? "bg-amber-500/20 text-amber-100 ring-1 ring-amber-400/35"
                    : "bg-[var(--muted)]/25 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {CRED_LABEL[key].short}
              </button>
            ))}
            {credChips.size > 0 && (
              <button
                type="button"
                onClick={() => setCredChips(new Set())}
                className="ml-auto text-xs text-[var(--primary)] underline-offset-2 hover:underline"
              >
                Réinitialiser
              </button>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border)]/60 pt-4">
          <span className="text-xs text-[var(--muted-foreground)]">Historique changements :</span>
          <Link
            href="/admin/demandes-certif"
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              credentialFiltre === "pending"
                ? "bg-[var(--primary)]/15 text-[var(--primary)] ring-1 ring-[var(--primary)]/30"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            En attente
          </Link>
          <Link
            href="/admin/demandes-certif?filtre=tout"
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              credentialFiltre === "all"
                ? "bg-[var(--primary)]/15 text-[var(--primary)] ring-1 ring-[var(--primary)]/30"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            Toutes
          </Link>
        </div>
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--muted)]/10 py-16 text-center">
          <p className="font-[family-name:var(--font-serif)] text-lg text-[var(--foreground)]">Aucune demande ne correspond</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Ajuste la recherche ou les filtres.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((item) => {
            const key = `${item.kind}:${item.id}`;
            const open = expanded === key;
            if (item.kind === "driver") {
              const r = item.row;
              const slots = visibleDocSlots(r);
              const pendingCount = slots.filter((d) => docSlotPending(r, d.key)).length;
              return (
                <li key={key}>
                  <div
                    className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
                      open
                        ? "border-[var(--primary)]/40 bg-[var(--card)] shadow-lg shadow-black/20 ring-1 ring-[var(--primary)]/20"
                        : "border-[var(--border)] bg-[var(--card)]/60 shadow-sm hover:border-[var(--muted-foreground)]/25 hover:bg-[var(--card)]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleExpand(key)}
                      className="flex w-full items-start gap-4 p-4 text-left sm:p-5"
                    >
                      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/25 to-cyan-600/10 text-cyan-200">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                            Vérification profil
                          </span>
                          <span className="rounded-md bg-[var(--muted)]/40 px-2 py-0.5 text-[10px] font-semibold text-[var(--muted-foreground)]">
                            {pendingCount} doc. à traiter
                          </span>
                        </div>
                        <p className="mt-2 truncate font-medium text-[var(--foreground)]">{r.user_full_name || "Sans nom"}</p>
                        <p className="truncate text-sm text-[var(--muted-foreground)]">{r.user_email || "—"}</p>
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">Envoyé {fmtDate(r.driver_verification_submitted_at)}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {slots.map(({ key, short }) => {
                            const st = fieldForDoc(r, key).status;
                            const ok = st === "approved";
                            return (
                              <span
                                key={key}
                                className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${
                                  ok ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-200"
                                }`}
                              >
                                {short} · {st}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <span
                        className={`mt-1 shrink-0 text-[var(--muted-foreground)] transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                        aria-hidden
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </button>
                    <div
                      className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                    >
                      <div className="min-h-0 overflow-hidden border-t border-[var(--border)]/80">
                        <div className="space-y-4 bg-[var(--background)]/30 p-4 sm:p-5">
                          <p className="text-xs text-[var(--muted-foreground)]">
                            Profil VTC <code className="rounded bg-[var(--muted)]/30 px-1 text-[11px]">{r.id}</code>
                            {(r.verification_id_document_type || "cni") === "passport" ? (
                              <span className="ml-2 rounded bg-[var(--muted)]/40 px-1.5 py-0.5 text-[10px] text-[var(--muted-foreground)]">
                                Passeport
                              </span>
                            ) : (
                              <span className="ml-2 rounded bg-[var(--muted)]/40 px-1.5 py-0.5 text-[10px] text-[var(--muted-foreground)]">
                                CNI
                              </span>
                            )}
                          </p>
                          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {slots.map(({ key, label }) => {
                              const { status, url } = fieldForDoc(r, key);
                              const ok = status === "approved";
                              const isImg = url && /\.(jpe?g|png|webp|gif|heic)(\?|$)/i.test(url);
                              return (
                                <div
                                  key={key}
                                  className="rounded-xl border border-[var(--border)] bg-[var(--card)]/90 p-3 shadow-inner"
                                >
                                  <p className="text-xs font-semibold text-[var(--foreground)]">{label}</p>
                                  <p className="mt-1 text-[10px] uppercase text-[var(--muted-foreground)]">{status}</p>
                                  {url && isImg && (
                                    <a href={url} target="_blank" rel="noreferrer" className="mt-2 block overflow-hidden rounded-lg ring-1 ring-white/10">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={url} alt="" className="h-28 w-full object-cover transition hover:opacity-90" />
                                    </a>
                                  )}
                                  {url && !isImg && (
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="mt-2 inline-flex text-xs font-medium text-[var(--primary)] hover:underline"
                                    >
                                      Ouvrir le fichier (PDF)
                                    </a>
                                  )}
                                  {!ok && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        disabled={!!loadingKey}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          reviewDoc(r.id, key, "approved");
                                        }}
                                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                                      >
                                        {loadingKey === `${r.id}-${key}-approved` ? "…" : "Approuver"}
                                      </button>
                                      <button
                                        type="button"
                                        disabled={!!loadingKey}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          reviewDoc(r.id, key, "rejected");
                                        }}
                                        className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                                      >
                                        {loadingKey === `${r.id}-${key}-rejected` ? "…" : "Rejeter"}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-6 rounded-xl border border-red-500/20 bg-gradient-to-br from-red-950/35 to-transparent p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-red-300">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 9v3.75m0-9v.008M12 21a9 9 0 01-9-9 9 9 0 019-9 9 9 0 019 9c0 1.507-.37 2.926-1.027 4.174M15 12H9"
                                  />
                                </svg>
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold tracking-wide text-red-200/95">Refus global</p>
                                <p className="mt-1 text-[11px] leading-relaxed text-red-200/55">
                                  Le message saisi sera visible par le chauffeur. À utiliser si le dossier entier est à refaire.
                                </p>
                                <button
                                  type="button"
                                  disabled={!!loadingKey}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    rejectProfile(r.id);
                                  }}
                                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-400/40 bg-transparent px-3.5 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/10 disabled:opacity-50"
                                >
                                  <svg className="h-3.5 w-3.5 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                                  </svg>
                                  {loadingKey === `${r.id}-reject-all` ? "Traitement…" : "Refuser tout le dossier"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            }
            const r = item.row;
            const meta = CRED_LABEL[r.request_type] || { label: r.request_type, short: r.request_type };
            const isPending = r.status === "pending";
            return (
              <li key={key}>
                <div
                  className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
                    open
                      ? "border-[var(--primary)]/40 bg-[var(--card)] shadow-lg shadow-black/20 ring-1 ring-[var(--primary)]/20"
                      : "border-[var(--border)] bg-[var(--card)]/60 shadow-sm hover:border-[var(--muted-foreground)]/25 hover:bg-[var(--card)]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(key)}
                    className="flex w-full items-start gap-4 p-4 text-left sm:p-5"
                  >
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-600/10 text-amber-100">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                      </svg>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">
                          Changement coordonnées
                        </span>
                        <span className="rounded-md bg-[var(--primary)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--primary)]">
                          {meta.short}
                        </span>
                        <span
                          className={
                            isPending
                              ? "rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-100"
                              : "rounded-md bg-[var(--muted)]/40 px-2 py-0.5 text-[10px] text-[var(--muted-foreground)]"
                          }
                        >
                          {isPending ? "En attente" : r.status}
                        </span>
                      </div>
                      <p className="mt-2 truncate font-medium text-[var(--foreground)]">{r.user_full_name || "—"}</p>
                      <p className="truncate text-sm text-[var(--muted-foreground)]">{r.user_email || "—"}</p>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">Demandé {fmtDate(r.created_at)}</p>
                    </div>
                    <span
                      className={`mt-1 shrink-0 text-[var(--muted-foreground)] transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                      aria-hidden
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                  >
                    <div className="min-h-0 overflow-hidden border-t border-[var(--border)]/80">
                      <div className="space-y-4 bg-[var(--background)]/30 p-4 sm:p-5">
                        <div className="grid gap-2 text-sm">
                          <p>
                            <span className="text-[var(--muted-foreground)]">Ancien</span>{" "}
                            <span className="font-mono text-[13px]">{r.current_value || "—"}</span>
                          </p>
                          <p>
                            <span className="text-[var(--muted-foreground)]">Demandé</span>{" "}
                            <span className="font-mono text-[13px] font-semibold text-[var(--primary)]">{r.requested_value}</span>
                          </p>
                          {r.resolved_at && !isPending && (
                            <p className="text-xs text-[var(--muted-foreground)]">Traité le {fmtDate(r.resolved_at)}</p>
                          )}
                          {r.admin_note && <p className="text-xs text-[var(--muted-foreground)]">Note : {r.admin_note}</p>}
                        </div>
                        {(() => {
                          const prev = verificationPreviewByUserId[r.user_id] ?? {
                            vtcR: null,
                            vtcV: null,
                            ins: null,
                            kbis: null,
                          };
                          const newR = docUrlMap[r.id];
                          const newV = docUrlMapVerso[r.id];
                          const showVtcCompare = r.request_type === "vtc_number";
                          const showInsCompare = r.request_type === "insurance";
                          const showSiretCompare =
                            r.request_type === "siret" && (!!newR || !!prev.kbis);
                          return (
                            <div className="mt-4 space-y-4">
                              {(showVtcCompare || showInsCompare || showSiretCompare) && (
                                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]/60 p-4">
                                  <p className="text-xs font-semibold text-[var(--foreground)]">
                                    Comparaison visuelle (dossier validé actuel vs pièces jointes à la demande)
                                  </p>
                                  {showVtcCompare ? (
                                    <div className="mt-3 grid gap-4 lg:grid-cols-2">
                                      <div className="rounded-lg border border-[var(--border)]/80 bg-[var(--background)]/40 p-3">
                                        <p className="text-[11px] font-bold uppercase text-cyan-600/90">Carte VTC — actuellement en dossier</p>
                                        {prev.vtcR ? <DocThumbLink href={prev.vtcR} caption="Recto" /> : <p className="mt-2 text-xs text-[var(--muted-foreground)]">Recto absent</p>}
                                        {prev.vtcV ? <DocThumbLink href={prev.vtcV} caption="Verso" /> : null}
                                      </div>
                                      <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3">
                                        <p className="text-[11px] font-bold uppercase text-amber-200/95">Soumis avec cette demande</p>
                                        {newR ? <DocThumbLink href={newR} caption="Recto (nouveau)" /> : <p className="mt-2 text-xs text-[var(--muted-foreground)]">—</p>}
                                        {newV ? <DocThumbLink href={newV} caption="Verso (nouveau)" /> : null}
                                      </div>
                                    </div>
                                  ) : null}
                                  {showInsCompare ? (
                                    <div className="mt-3 grid gap-4 lg:grid-cols-2">
                                      <div className="rounded-lg border border-[var(--border)]/80 bg-[var(--background)]/40 p-3">
                                        <p className="text-[11px] font-bold uppercase text-cyan-600/90">Assurance — dossier actuel</p>
                                        {prev.ins ? <DocThumbLink href={prev.ins} caption="Attestation enregistrée" /> : <p className="mt-2 text-xs text-[var(--muted-foreground)]">—</p>}
                                      </div>
                                      <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3">
                                        <p className="text-[11px] font-bold uppercase text-amber-200/95">Nouvelle pièce</p>
                                        {newR ? <DocThumbLink href={newR} caption="Fichier joint" /> : <p className="mt-2 text-xs text-[var(--muted-foreground)]">—</p>}
                                      </div>
                                    </div>
                                  ) : null}
                                  {showSiretCompare ? (
                                    <div className="mt-3 grid gap-4 lg:grid-cols-2">
                                      <div className="rounded-lg border border-[var(--border)]/80 bg-[var(--background)]/40 p-3">
                                        <p className="text-[11px] font-bold uppercase text-cyan-600/90">KBIS / extrait (dossier facturation)</p>
                                        {prev.kbis ? (
                                          <DocThumbLink href={prev.kbis} caption="Document enregistré" />
                                        ) : (
                                          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                                            Aucun KBIS archivé — comparer avec le SIRET affiché ci-dessus (ancien).
                                          </p>
                                        )}
                                      </div>
                                      <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3">
                                        <p className="text-[11px] font-bold uppercase text-amber-200/95">Justificatif de la demande</p>
                                        {newR ? <DocThumbLink href={newR} caption="Pièce jointe (nouveau SIRET)" /> : <p className="mt-2 text-xs text-[var(--muted-foreground)]">—</p>}
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                              )}
                              {!showVtcCompare && !showInsCompare && !showSiretCompare && r.document_path && docUrlMap[r.id] && (
                                <a
                                  href={docUrlMap[r.id]}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--primary)] hover:bg-[var(--muted)]/20"
                                >
                                  Voir le justificatif
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              )}
                            </div>
                          );
                        })()}
                        {isPending && (
                          <>
                            <textarea
                              className="min-h-[72px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]/40"
                              placeholder="Note interne (optionnelle)"
                              value={credNote[r.id] ?? ""}
                              onChange={(e) => setCredNote((m) => ({ ...m, [r.id]: e.target.value }))}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={!!loadingKey}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  credAct(r.id, "approve");
                                }}
                                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                              >
                                {loadingKey === r.id ? "…" : "Approuver"}
                              </button>
                              <button
                                type="button"
                                disabled={!!loadingKey}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  credAct(r.id, "reject");
                                }}
                                className="rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                              >
                                Refuser
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
