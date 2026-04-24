"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarIcon, Clock, Euro } from "lucide-react";
import { AddressAutocomplete, type AddressSuggestion } from "@/components/landing/AddressAutocomplete";
import { calculateDistanceKm } from "@/lib/distance";
import { computeIndicativeRange, formatEUR, roundToFiftyCents } from "@/lib/pricing";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

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
  preferredDriverSlug?: string;
  driverFirstName?: string;
};

export function ReserverForm({ preferredDriverSlug, driverFirstName }: Props) {
  const [departureAddress, setDepartureAddress] = useState<AddressSuggestion | null>(null);
  const [departureLabel, setDepartureLabel] = useState("");
  const [arrivalAddress, setArrivalAddress] = useState<AddressSuggestion | null>(null);
  const [arrivalLabel, setArrivalLabel] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("");
  const [budgetChoice, setBudgetChoice] = useState<"median" | "custom" | null>(null);
  const [budget, setBudget] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [fallbackToMarketplace, setFallbackToMarketplace] = useState(false);
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
  const medianEur = indicativeRange ? roundToFiftyCents((indicativeRange.low + indicativeRange.high) / 2) : 0;
  const effectiveBudget = budgetChoice === "median" && indicativeRange ? String(medianEur) : budget;

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
    if (!email) {
      setSubmitError("L'email est obligatoire pour recevoir la confirmation de réservation.");
      setSubmitStatus("error");
      return;
    }
    const budgetNum = parseFloat((effectiveBudget || "0").replace(",", "."));
    if (!Number.isFinite(budgetNum) || budgetNum <= 0) {
      setSubmitError("Veuillez indiquer un budget.");
      setSubmitStatus("error");
      return;
    }
    setSubmitError(null);
    setSubmitStatus("loading");
    const [hours, minutes] = time.split(":").map(Number);
    const scheduledAt = new Date(date);
    scheduledAt.setHours(hours, minutes, 0, 0);

    const body = {
      pickup_address: departureAddress.label,
      dropoff_address: arrivalAddress.label,
      scheduled_at: scheduledAt.toISOString(),
      price_cents: Math.round(budgetNum * 100),
      distance_km: distanceKm ?? undefined,
      notes: notes.trim() || undefined,
      client_name: clientName.trim() || undefined,
      client_email: email || undefined,
      client_phone: phone || undefined,
      preferred_driver_slug: preferredDriverSlug || undefined,
      fallback_to_marketplace: Boolean(preferredDriverSlug && fallbackToMarketplace),
    };

    try {
      const res = await fetch("/api/driver-booking-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AddressAutocomplete
          label="Adresse de départ"
          placeholder="Ex: 10 Place du Capitole, Toulouse"
          value={departureLabel}
          onSelectAddress={(addr) => {
            setDepartureAddress(addr);
            setDepartureLabel(addr.label);
          }}
          onChangeText={setDepartureLabel}
        />
        <AddressAutocomplete
          label="Adresse d'arrivée"
          placeholder="Ex: Aéroport Toulouse-Blagnac"
          value={arrivalLabel}
          onSelectAddress={(addr) => {
            setArrivalAddress(addr);
            setArrivalLabel(addr.label);
          }}
          onChangeText={setArrivalLabel}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mobile / tablet : champs natifs pour éviter troncature Android et bug sélection iOS */}
        <div className="grid grid-cols-[1fr_1fr] gap-3 md:hidden col-span-2">
          <div className="space-y-2 min-w-0">
            <Label htmlFor="reserver-date-native">Date</Label>
            <div className="relative h-12 rounded-xl border border-[var(--border)] bg-[var(--background)] overflow-hidden">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)] pointer-events-none z-10" />
              <input
                id="reserver-date-native"
                type="date"
                min={format(new Date(), "yyyy-MM-dd")}
                value={date ? format(date, "yyyy-MM-dd") : ""}
                onChange={(e) => setDate(e.target.value ? new Date(e.target.value + "T12:00:00") : undefined)}
                className="w-full h-full pl-11 pr-1 bg-transparent border-0 text-sm [color-scheme:dark]"
              />
            </div>
          </div>
          <div className="space-y-2 min-w-[7rem]">
            <Label htmlFor="reserver-time-native">Heure</Label>
            <div className="relative h-12 min-w-[7rem] rounded-xl border border-[var(--border)] bg-[var(--background)] overflow-visible">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)] pointer-events-none z-10" />
              <input
                id="reserver-time-native"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full min-w-[6rem] h-full pl-11 pr-2 bg-transparent border-0 text-sm [color-scheme:dark]"
              />
            </div>
          </div>
        </div>
        {/* Desktop : Popover date + Select heure */}
        <div className="hidden md:block space-y-2">
          <Label>Date</Label>
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "w-full h-12 pl-11 pr-4 flex items-center text-left bg-[var(--background)] border border-[var(--border)] rounded-xl",
                  !date && "text-[var(--muted-foreground)]"
                )}
              >
                <CalendarIcon className="absolute left-3 w-5 h-5 text-[var(--muted-foreground)]" />
                <span>{date ? format(date, "EEE d MMMM yyyy", { locale: fr }) : "Choisir une date"}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => {
                  setDate(d);
                  setDatePickerOpen(false);
                }}
                disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                locale={fr}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="hidden md:block space-y-2">
          <Label>Heure</Label>
          <Select value={time} onValueChange={setTime}>
            <SelectTrigger className="h-12 pl-11 rounded-xl bg-[var(--background)] border-[var(--border)]">
              <Clock className="absolute left-3 w-5 h-5 text-[var(--muted-foreground)]" />
              <SelectValue placeholder="Choisir une heure" />
            </SelectTrigger>
            <SelectContent>
              {TIME_SLOTS.map((slot) => (
                <SelectItem key={slot} value={slot}>{slot}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {indicativeRange && (
        <div className="space-y-3">
          <Label>Budget (€)</Label>
          <p className="text-sm text-[var(--muted-foreground)]">
            Fourchette habituelle : {formatEUR(indicativeRange.low)} – {formatEUR(indicativeRange.high)}.
          </p>
          <div className="flex gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setBudgetChoice("median")}
              className={cn(
                "px-4 py-2 rounded-xl border text-sm font-medium",
                budgetChoice === "median"
                  ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                  : "border-[var(--border)] bg-[var(--muted)]/30"
              )}
            >
              Médian {formatEUR(medianEur)}
            </button>
            <button
              type="button"
              onClick={() => setBudgetChoice("custom")}
              className={cn(
                "px-4 py-2 rounded-xl border text-sm font-medium",
                budgetChoice === "custom"
                  ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                  : "border-[var(--border)] bg-[var(--muted)]/30"
              )}
            >
              Autre montant
            </button>
            {budgetChoice === "custom" && (
              <div className="flex items-center gap-2">
                <Euro className="w-4 h-4 text-[var(--muted-foreground)]" />
                <Input
                  type="number"
                  placeholder="Ex: 45"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-24 h-10 rounded-xl"
                />
                <span className="text-sm text-[var(--muted-foreground)]">€</span>
              </div>
            )}
          </div>
        </div>
      )}
      {!indicativeRange && (
        <div className="space-y-2">
          <Label>Budget indicatif (€)</Label>
          <Input
            type="number"
            placeholder="Ex: 45"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="h-12 rounded-xl"
          />
        </div>
      )}

      <div className="space-y-4">
        <Label>Vos coordonnées</Label>
        <Input placeholder="Votre nom (facultatif)" value={clientName} onChange={(e) => setClientName(e.target.value)} className="h-12 rounded-xl" />
        <Input type="email" placeholder="Email *" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="h-12 rounded-xl" />
        <Input type="tel" placeholder="Téléphone *" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="h-12 rounded-xl" />
      </div>

      <div className="space-y-2">
        <Label>Notes (facultatif)</Label>
        <textarea
          rows={2}
          placeholder="Informations pour le chauffeur..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl resize-none"
        />
      </div>

      {preferredDriverSlug && driverFirstName && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--muted)]/30 border border-[var(--border)]">
          <Checkbox
            id="fallback"
            checked={fallbackToMarketplace}
            onCheckedChange={(c) => setFallbackToMarketplace(c === true)}
          />
          <Label htmlFor="fallback" className="text-sm leading-relaxed cursor-pointer">
            Si {driverFirstName} n&apos;est pas disponible, acceptez-vous qu&apos;on vous propose un autre chauffeur ? 
            Dans ce cas, votre demande sera publiée aux chauffeurs du réseau.
          </Label>
        </div>
      )}

      <div className="p-4 rounded-xl bg-[var(--muted)]/20 border border-[var(--border)] space-y-2 text-sm text-[var(--muted-foreground)]">
        <p>Mode de paiement : à régler directement auprès du chauffeur.</p>
        <p>Pour toute modification ou annulation, contactez directement votre chauffeur.</p>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--muted)]/30 border border-[var(--border)]">
        <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(c) => setTermsAccepted(c === true)} />
        <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
          J&apos;accepte les <Link href="/cgu" className="text-[var(--primary)] underline" target="_blank" rel="noopener noreferrer">CGU</Link>
          {" "}et la{" "}
          <Link href="/confidentialite" className="text-[var(--primary)] underline" target="_blank" rel="noopener noreferrer">Politique de confidentialité</Link>.
        </Label>
      </div>

      {submitStatus === "success" && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 text-center">
          {preferredDriverSlug
            ? "Votre demande a été envoyée au chauffeur. Vous serez recontacté rapidement."
            : "Votre réservation a bien été envoyée. Les chauffeurs pourront vous répondre."}
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
        className="w-full h-14 rounded-xl"
      >
        {submitStatus === "loading" ? "Envoi en cours…" : "Envoyer ma demande"}
      </Button>
    </form>
  );
}
