"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarIcon, Clock, Euro, Baby, Wifi, Briefcase, PawPrint, Users, ArrowRight, Sparkles } from "lucide-react";
import { AddressAutocomplete, type AddressSuggestion } from "./AddressAutocomplete";
import { calculateDistanceKm } from "@/lib/distance";
import { computeIndicativeRange, formatEUR, roundToFiftyCents } from "@/lib/pricing";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const additionalOptions = [
  { id: "baby-seat", label: "Siège bébé", icon: Baby },
  { id: "wifi", label: "WiFi", icon: Wifi },
  { id: "business", label: "Classe affaires", icon: Briefcase },
  { id: "pet-friendly", label: "Animaux", icon: PawPrint },
  { id: "multiple", label: "Multi-passagers", icon: Users },
];

const TIME_SLOTS = (() => {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
})();

export function BookingForm() {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [departureAddress, setDepartureAddress] = useState<AddressSuggestion | null>(null);
  const [departureLabel, setDepartureLabel] = useState("");
  const [arrivalAddress, setArrivalAddress] = useState<AddressSuggestion | null>(null);
  const [arrivalLabel, setArrivalLabel] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>("");
  const [budgetChoice, setBudgetChoice] = useState<"median" | "custom" | null>(null);
  const [budget, setBudget] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const toggleOption = (optionId: string) => {
    setSelectedOptions((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId]
    );
  };

  const distanceKm =
    departureAddress?.coordinates && arrivalAddress?.coordinates && date && time
      ? calculateDistanceKm(
          { lat: departureAddress.coordinates.lat, lon: departureAddress.coordinates.lon },
          { lat: arrivalAddress.coordinates.lat, lon: arrivalAddress.coordinates.lon }
        )
      : null;

  const indicativeRange = distanceKm != null && distanceKm > 0 ? computeIndicativeRange(distanceKm) : null;
  const medianEur = indicativeRange ? roundToFiftyCents((indicativeRange.low + indicativeRange.high) / 2) : 0;
  const budgetValue = budget !== "" ? parseFloat(budget.replace(",", ".")) : null;
  const isBudgetAboveRange = indicativeRange != null && budgetValue != null && !Number.isNaN(budgetValue) && budgetValue > indicativeRange.high;
  const effectiveBudget = budgetChoice === "median" ? String(medianEur) : budget;

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
      setSubmitError("Indiquez au moins votre email ou votre téléphone pour recevoir la confirmation ou la proposition du chauffeur.");
      setSubmitStatus("error");
      return;
    }
    const budgetNum = parseFloat((effectiveBudget || "0").replace(",", "."));
    if (!Number.isFinite(budgetNum) || budgetNum <= 0) {
      setSubmitError("Veuillez indiquer un budget (option prix médian ou montant personnalisé).");
      setSubmitStatus("error");
      return;
    }
    setSubmitError(null);
    setSubmitStatus("loading");
    const [hours, minutes] = time.split(":").map(Number);
    const scheduledAt = new Date(date);
    scheduledAt.setHours(hours, minutes, 0, 0);

    // Inclure les options (siège bébé, WiFi, etc.) dans les notes pour affichage dans l'app
    const optionsLabels = selectedOptions.length
      ? additionalOptions.filter((o) => selectedOptions.includes(o.id)).map((o) => o.label)
      : [];
    const optionsLine =
      optionsLabels.length > 0 ? `Options demandées : ${optionsLabels.join(", ")}` : "";
    const combinedNotes = [optionsLine, notes.trim()].filter(Boolean).join("\n\n");

    const body = {
      pickup_address: departureAddress.label,
      dropoff_address: arrivalAddress.label,
      scheduled_at: scheduledAt.toISOString(),
      price_cents: Math.round(budgetNum * 100),
      distance_km: distanceKm ?? undefined,
      indicative_low_cents: indicativeRange ? Math.round(indicativeRange.low * 100) : undefined,
      indicative_high_cents: indicativeRange ? Math.round(indicativeRange.high * 100) : undefined,
      notes: combinedNotes || undefined,
      client_name: clientName.trim() || undefined,
      client_email: email || undefined,
      client_phone: phone || undefined,
    };
    const apiUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/api/booking-request`
        : "/api/booking-request";
    if (typeof window !== "undefined" && (!window.location.origin || window.location.origin.startsWith("file:"))) {
      setSubmitError("Ouvrez le site via le serveur de développement : dans le dossier corail-landing-page-design, lancez « npm run dev » puis ouvrez l’URL affichée (ex. http://localhost:3000).");
      setSubmitStatus("error");
      return;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(data.error || "Une erreur est survenue.");
        setSubmitStatus("error");
        return;
      }
      setSubmitStatus("success");
    } catch (err: any) {
      const isAbort = err?.name === "AbortError";
      const msg = err?.message ?? "";
      const friendly = isAbort
        ? "La requête a expiré. Vérifiez votre connexion et .env.local (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)."
        : msg === "fetch failed" || msg.includes("Failed to fetch") || msg.includes("NetworkError")
          ? "Impossible de joindre l'API. Ouvrez http://localhost:3000/api/booking-request dans un autre onglet pour vérifier que l'API répond."
          : msg || "Erreur réseau.";
      setSubmitError(friendly);
      setSubmitStatus("error");
    }
  };

  return (
    <section id="reserver" className="py-28 lg:py-36 bg-gradient-to-b from-background via-muted/30 to-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/5 border border-primary/15 text-primary mb-8 tracking-wide">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">Demande de course</span>
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl font-medium text-foreground mb-5 tracking-tight">
            Réservez votre course
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Décrivez votre trajet. Les chauffeurs du réseau Corail recevront votre réservation 
            et pourront vous répondre avec leur proposition. Vous choisissez librement.
          </p>
        </div>

        <div className="max-w-3xl mx-auto min-w-0 px-2 sm:px-0">
          <form className="bg-card/80 backdrop-blur-sm border border-border/80 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl shadow-black/5 overflow-hidden min-w-0 max-w-full" onSubmit={handleSubmit}>
            {indicativeRange && budgetChoice != null && (
              <input type="hidden" name="budget" value={effectiveBudget} />
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 min-w-0">
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

              {/* Mobile : date et heure côte à côte, rectangles de même taille */}
              <div className="grid grid-cols-[1fr_1fr] gap-3 md:hidden min-w-0 col-span-full">
                <div className="space-y-2 min-w-0 w-full">
                  <Label htmlFor="date-native" className="text-foreground font-medium">Date</Label>
                  <div className="relative min-w-0 w-full overflow-hidden rounded-xl border border-border bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0 h-12">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none shrink-0 z-10" />
                    <input
                      id="date-native"
                      type="date"
                      min={format(new Date(), "yyyy-MM-dd")}
                      value={date ? format(date, "yyyy-MM-dd") : ""}
                      onChange={(e) => setDate(e.target.value ? new Date(e.target.value + "T12:00:00") : undefined)}
                      className="w-full min-w-0 h-full pl-11 pr-1 rounded-xl bg-transparent border-0 text-foreground text-sm focus:outline-none focus:ring-0 [color-scheme:dark] box-border"
                    />
                  </div>
                </div>
                <div className="space-y-2 min-w-0 w-full">
                  <Label htmlFor="time-native" className="text-foreground font-medium">Heure</Label>
                  <div className="relative min-w-0 w-full overflow-hidden rounded-xl border border-border bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0 h-12">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none shrink-0 z-10" />
                    <input
                      id="time-native"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full min-w-0 h-full pl-11 pr-1 rounded-xl bg-transparent border-0 text-foreground text-sm focus:outline-none focus:ring-0 [color-scheme:dark] box-border"
                    />
                  </div>
                </div>
              </div>

              {/* Desktop : calendrier et liste d'heures */}
              <div className="space-y-2 hidden md:block">
                <Label className="text-foreground font-medium">Date</Label>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "relative w-full min-h-12 py-3 pl-11 pr-4 flex items-center text-left bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none shrink-0" />
                      <span className="block text-left">
                        {date ? format(date, "d MMMM yyyy", { locale: fr }) : "Choisir une date"}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(selectedDate) => {
                        setDate(selectedDate);
                        setDatePickerOpen(false);
                      }}
                      disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                      locale={fr}
                      classNames={{ disabled: "!opacity-50 !text-muted-foreground pointer-events-none" }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2 hidden md:block">
                <Label htmlFor="time" className="text-foreground font-medium">
                  Heure
                </Label>
                <Select value={time || undefined} onValueChange={setTime}>
                  <SelectTrigger
                    id="time"
                    className="relative w-full h-12 min-h-[3rem] pl-11 pr-10 rounded-xl bg-background border border-border text-foreground focus:ring-2 focus:ring-ring"
                  >
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none shrink-0" />
                    {time ? <span className="block truncate">{time}</span> : <SelectValue placeholder="Choisir une heure" />}
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {indicativeRange && (
              <div className="mb-8 space-y-4">
                <p className="text-sm font-medium text-foreground">
                  Tarifs habituellement constatés pour ce trajet : {formatEUR(indicativeRange.low)} – {formatEUR(indicativeRange.high)}.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => { setBudgetChoice("median"); setBudget(""); }}
                    className={cn(
                      "text-center p-5 rounded-2xl border-2 transition-all flex flex-col items-center",
                      budgetChoice === "median"
                        ? "border-green-500/60 bg-green-500/10"
                        : "border-border bg-muted/30 hover:border-green-500/40 hover:bg-green-500/5"
                    )}
                  >
                    <span className="text-sm font-semibold text-foreground mb-2">
                      Réserver au prix médian
                    </span>
                    {budgetChoice === "median" && (
                      <div className="mt-3 space-y-2 w-full flex flex-col items-center text-center">
                        <p className="text-sm text-muted-foreground">
                          Prix suggéré pour confirmation rapide : <strong className="text-foreground">{formatEUR(medianEur)}</strong>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Suggestion médiane indicative. Le chauffeur peut accepter ou proposer un ajustement.
                        </p>
                        <Button type="submit" size="sm" className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white">
                          Réserver à {formatEUR(medianEur)} (confirmation rapide)
                        </Button>
                      </div>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBudgetChoice("custom")}
                    className={cn(
                      "text-center p-5 rounded-2xl border-2 transition-all flex flex-col items-center",
                      budgetChoice === "custom"
                        ? "border-blue-500/60 bg-blue-500/10"
                        : "border-border bg-muted/30 hover:border-blue-500/40 hover:bg-blue-500/5"
                    )}
                  >
                    <span className="text-sm font-semibold text-foreground mb-2">
                      Proposer un autre budget
                    </span>
                    {budgetChoice === "custom" && (
                      <div className="mt-3 w-full flex flex-col items-stretch text-center">
                        <Label htmlFor="budget" className="text-xs text-muted-foreground block text-left mb-1">Mon budget</Label>
                        <div className="relative w-full max-w-full">
                          <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                          <Input
                            id="budget"
                            type="number"
                            placeholder="45"
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                            className="w-full pl-9 pr-3 h-10 bg-background border-border rounded-xl text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">Montant en euros</p>
                        {isBudgetAboveRange && (
                          <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">Budget supérieur aux tarifs habituels.</p>
                        )}
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="mb-8">
              <Label className="text-foreground font-medium mb-2 block">Vos coordonnées</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Email et téléphone permettent aux chauffeurs de vous recontacter. Au moins l’un des deux est requis.
              </p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="client-name" className="text-muted-foreground text-sm">Votre nom</Label>
                  <span className="text-xs text-muted-foreground/80 ml-1.5">(facultatif)</span>
                  <Input
                    id="client-name"
                    type="text"
                    placeholder="Ex: Jean Dupont"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="mt-1 h-12 bg-background border-border rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="client-email" className="text-muted-foreground text-sm">Email</Label>
                  <Input
                    id="client-email"
                    type="email"
                    placeholder="vous@exemple.fr"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="mt-1 h-12 bg-background border-border rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="client-phone" className="text-muted-foreground text-sm">Téléphone</Label>
                  <Input
                    id="client-phone"
                    type="tel"
                    placeholder="Ex: 06 12 34 56 78"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="mt-1 h-12 bg-background border-border rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="mb-8">
              <Label className="text-foreground font-medium mb-4 block">Options supplémentaires</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {additionalOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedOptions.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleOption(option.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200 ${
                        isSelected
                          ? "bg-primary/10 border-primary/60 text-foreground shadow-sm"
                          : "bg-background/80 border-border/80 text-muted-foreground hover:border-primary/40 hover:bg-muted/50"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? "text-primary" : ""}`} />
                      <span className="text-xs font-medium text-center">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-8 space-y-2">
              <Label htmlFor="notes" className="text-foreground font-medium">
                Notes supplémentaires <span className="text-muted-foreground font-normal">(facultatif)</span>
              </Label>
              <textarea
                id="notes"
                rows={3}
                placeholder="Informations particulières pour le chauffeur..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex items-start gap-3 mb-6 p-4 sm:p-5 bg-muted/40 border border-border/50 rounded-2xl min-w-0">
              <Checkbox
                id="terms"
                className="mt-0.5 shrink-0 size-5 border-2 border-primary bg-background data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                checked={termsAccepted}
                onCheckedChange={(c) => setTermsAccepted(c === true)}
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed min-w-0 flex-1 cursor-pointer font-normal block">
                J&apos;accepte que ma demande soit transmise aux chauffeurs du réseau Corail (mise en relation, prix conclu avec le chauffeur).
                <br />
                J&apos;accepte les{" "}
                <Link href="/cgu" className="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">CGU</Link>
                {" "}et la{" "}
                <Link href="/confidentialite" className="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">Politique de confidentialité</Link>.
              </label>
            </div>

            {submitStatus === "success" && (
              <div className="mb-6 p-4 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 text-center">
                Votre réservation a bien été envoyée. Les chauffeurs à proximité la verront et pourront vous répondre.
              </div>
            )}
            {submitStatus === "error" && submitError && (
              <div className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-center">
                {submitError}
              </div>
            )}
            <Button
              type="submit"
              size="lg"
              disabled={submitStatus === "loading"}
              className="w-full h-14 text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl shadow-lg shadow-primary/20 transition-shadow disabled:opacity-70"
            >
              {submitStatus === "loading" ? "Envoi en cours…" : budgetChoice === "median" && indicativeRange ? `Réserver à ${formatEUR(medianEur)} (confirmation rapide)` : "Réserver ma course"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
