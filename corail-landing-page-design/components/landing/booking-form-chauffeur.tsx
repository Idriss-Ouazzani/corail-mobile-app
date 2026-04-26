"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { CalendarIcon, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AddressAutocomplete, type AddressSuggestion } from "./AddressAutocomplete";
import { calculateDistanceKm } from "@/lib/distance";
import { computeIndicativeRange, formatEUR } from "@/lib/pricing";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TIME_SLOTS = (() => {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
})();

type Props = {
  driverId: string;
  driverDisplayName: string;
};

export function BookingFormChauffeur({ driverId, driverDisplayName }: Props) {
  const [departureAddress, setDepartureAddress] = useState<AddressSuggestion | null>(null);
  const [departureLabel, setDepartureLabel] = useState("");
  const [arrivalAddress, setArrivalAddress] = useState<AddressSuggestion | null>(null);
  const [arrivalLabel, setArrivalLabel] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [fallbackToMarketplace, setFallbackToMarketplace] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const distanceKm =
    departureAddress?.coordinates && arrivalAddress?.coordinates && date && time
      ? calculateDistanceKm(
          { lat: departureAddress.coordinates.lat, lon: departureAddress.coordinates.lon },
          { lat: arrivalAddress.coordinates.lat, lon: arrivalAddress.coordinates.lon }
        )
      : null;
  const indicativeRange = distanceKm != null && distanceKm > 0 ? computeIndicativeRange(distanceKm) : null;
  const firstName = driverDisplayName.split(" ")[0] || driverDisplayName;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!departureAddress?.label || !arrivalAddress?.label || !date || !time) {
      setSubmitError("Veuillez remplir les adresses, la date et l'heure.");
      setSubmitStatus("error");
      return;
    }
    if (!termsAccepted) {
      setSubmitError("Veuillez accepter les CGU et la politique de confidentialité.");
      setSubmitStatus("error");
      return;
    }
    const email = clientEmail.trim();
    const phone = clientPhone.trim().replace(/\s/g, "");
    if (!email && !phone) {
      setSubmitError("Indiquez au moins un email ou un téléphone pour le devis.");
      setSubmitStatus("error");
      return;
    }
    setSubmitError(null);
    setSubmitStatus("loading");
    const [hours, minutes] = time.split(":").map(Number);
    const scheduledAt = new Date(date);
    scheduledAt.setHours(hours, minutes, 0, 0);

    try {
      const res = await fetch("/api/driver-ride-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup_address: departureAddress.label,
          dropoff_address: arrivalAddress.label,
          scheduled_at: scheduledAt.toISOString(),
          distance_km: distanceKm ?? undefined,
          indicative_low_cents: indicativeRange ? Math.round(indicativeRange.low * 100) : undefined,
          indicative_high_cents: indicativeRange ? Math.round(indicativeRange.high * 100) : undefined,
          notes: notes.trim() || undefined,
          client_name: clientName.trim() || undefined,
          client_email: email || undefined,
          client_phone: phone || undefined,
          preferred_driver_id: driverId,
          fallback_to_marketplace: fallbackToMarketplace,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(data.error || "Une erreur est survenue.");
        setSubmitStatus("error");
        return;
      }
      setSubmitStatus("success");
    } catch (err: unknown) {
      setSubmitError("Erreur réseau. Réessayez.");
      setSubmitStatus("error");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <p className="text-center text-[var(--muted-foreground)] mb-6">
        Votre demande est transmise à <strong className="text-[var(--foreground)]">{driverDisplayName}</strong>. Vous recevrez un devis (email) lorsqu’il proposera un tarif. Estimation affichée : indicative, non contractuelle.
      </p>
      <form
        className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6 shadow-lg space-y-6 overflow-hidden min-w-0 max-w-full"
        onSubmit={handleSubmit}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
          <AddressAutocomplete
            label="Adresse de départ"
            placeholder="Ex: 10 Place du Capitole"
            value={departureLabel}
            onSelectAddress={(addr) => {
              setDepartureAddress(addr);
              setDepartureLabel(addr.label);
            }}
            onChangeText={setDepartureLabel}
          />
          <AddressAutocomplete
            label="Adresse d'arrivée"
            placeholder="Ex: Aéroport"
            value={arrivalLabel}
            onSelectAddress={(addr) => {
              setArrivalAddress(addr);
              setArrivalLabel(addr.label);
            }}
            onChangeText={setArrivalLabel}
          />
        </div>

        <div className="grid grid-cols-[1fr_1fr] gap-3 sm:gap-4 min-w-0">
          <div className="min-w-0 w-full overflow-hidden">
            <Label className="text-sm text-[var(--muted-foreground)]">Date</Label>
            <div className="mt-1 min-w-0 w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background)] h-12 flex items-center">
              <input
                type="date"
                min={format(new Date(), "yyyy-MM-dd")}
                value={date ? format(date, "yyyy-MM-dd") : ""}
                onChange={(e) => setDate(e.target.value ? new Date(e.target.value) : undefined)}
                className="w-full min-w-0 h-full px-3 py-0 rounded-xl border-0 bg-transparent text-[var(--foreground)] text-sm box-border [color-scheme:dark]"
              />
            </div>
          </div>
          <div className="min-w-0 w-full overflow-hidden">
            <Label className="text-sm text-[var(--muted-foreground)]">Heure</Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger className="mt-1 h-12 rounded-xl bg-[var(--background)] min-w-0 w-full max-w-full">
                <Clock className="w-4 h-4 mr-2 text-[var(--muted-foreground)]" />
                <SelectValue placeholder="Heure" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((slot) => (
                  <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {indicativeRange ? (
          <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 p-4">
            <p className="text-sm font-medium">Estimation indicative (non contractuelle)</p>
            <p className="text-sm text-[var(--muted-foreground)]">
              {formatEUR(indicativeRange.low)} – {formatEUR(indicativeRange.high)} · le devis fera foi.
            </p>
          </div>
        ) : (
          <p className="text-sm text-[var(--muted-foreground)]">Indiquez départ et arrivée pour afficher une fourchette.</p>
        )}

        <div className="space-y-4">
          <Label className="text-sm text-[var(--muted-foreground)]">Vos coordonnées</Label>
          <Input placeholder="Nom (facultatif)" value={clientName} onChange={(e) => setClientName(e.target.value)} className="h-12 rounded-xl" />
          <Input type="email" placeholder="Email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="h-12 rounded-xl" />
          <Input type="tel" placeholder="Téléphone" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="h-12 rounded-xl" />
          <p className="text-xs text-[var(--muted-foreground)]">Au moins l’email ou le téléphone (pour le devis).</p>
        </div>

        <div>
          <Label className="text-sm text-[var(--muted-foreground)]">Notes (facultatif)</Label>
          <textarea
            rows={2}
            placeholder="Informations pour le chauffeur..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] resize-none"
          />
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--muted)]/30 border border-[var(--border)] min-w-0">
          <Checkbox
            id="fallback"
            checked={fallbackToMarketplace}
            onCheckedChange={(c) => setFallbackToMarketplace(c === true)}
            className="mt-0.5 shrink-0 size-5 border-2 border-[var(--primary)]/80 bg-[var(--background)]"
          />
          <Label htmlFor="fallback" className="text-sm leading-relaxed cursor-pointer">
            Si {firstName} n&apos;est pas disponible, acceptez-vous qu&apos;on vous propose un autre chauffeur du réseau ?
          </Label>
        </div>

        <div className="p-4 rounded-xl bg-[var(--muted)]/20 border border-[var(--border)] space-y-2 text-sm text-[var(--muted-foreground)]">
          <p>Mode de paiement : à régler directement auprès du chauffeur.</p>
          <p>Pour toute modification ou annulation, contactez directement votre chauffeur.</p>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--muted)]/30 border border-[var(--border)] min-w-0">
          <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(c) => setTermsAccepted(c === true)} className="mt-0.5 shrink-0 size-5 border-2 border-[var(--primary)]/80 bg-[var(--background)]" />
          <label htmlFor="terms" className="text-sm text-[var(--muted-foreground)] leading-relaxed cursor-pointer min-w-0 flex-1 font-normal block">
            J&apos;accepte les <Link href="/cgu" className="text-[var(--primary)] underline" target="_blank" rel="noopener noreferrer">CGU</Link> et la{" "}
            <Link href="/confidentialite" className="text-[var(--primary)] underline" target="_blank" rel="noopener noreferrer">Politique de confidentialité</Link>.
          </label>
        </div>

        {submitStatus === "success" && (
          <div className="p-4 rounded-xl bg-green-500/15 border border-green-500/30 text-green-700 dark:text-green-400 text-center space-y-1">
            <p className="font-semibold">Devis en cours</p>
            <p className="text-sm">Demande envoyée à {driverDisplayName}. Vous recevrez un devis par email dès qu’un tarif sera proposé.</p>
          </div>
        )}
        {submitStatus === "error" && submitError && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-center">
            {submitError}
          </div>
        )}
        <Button
          type="submit"
          size="lg"
          disabled={submitStatus === "loading"}
          className="w-full h-14 rounded-xl font-medium"
        >
          {submitStatus === "loading" ? "Envoi…" : "Envoyer ma demande"}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </form>
    </div>
  );
}
