"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarIcon, Clock, Baby, Wifi, Briefcase, PawPrint, Users, ArrowRight, Sparkles } from "lucide-react";
import { AddressAutocomplete, type AddressSuggestion } from "./AddressAutocomplete";
import { calculateDistanceKm } from "@/lib/distance";
import { computeIndicativeRange, formatEUR } from "@/lib/pricing";
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
      setSubmitError("Indiquez au moins votre email ou votre téléphone pour recevoir la confirmation de votre réservation.");
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
            <span className="text-sm font-medium">Réservation</span>
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl font-medium text-foreground mb-5 tracking-tight">
            Réservez simplement
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Indiquez votre trajet. Vous voyez une <strong className="text-foreground/90">estimation indicative</strong> (non contractuelle) : le chauffeur vous envoie un devis.
            <br />
            <span className="text-foreground/80 font-medium">Paiement auprès du chauffeur.</span>
          </p>
        </div>

        <div className="max-w-3xl mx-auto min-w-0 px-2 sm:px-0">
          <form className="form-focus-ring bg-card/80 backdrop-blur-sm border border-border/80 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl shadow-black/5 overflow-hidden min-w-0 max-w-full" onSubmit={handleSubmit}>
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

              {/* Mobile / tablet (dont iOS) : champs natifs date + heure pour éviter bugs Radix sur iOS et troncature sur Android */}
              <div className="grid grid-cols-[1fr_1fr] gap-3 lg:hidden min-w-0 col-span-full">
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
                <div className="space-y-2 w-full min-w-[7rem]">
                  <Label htmlFor="time-native" className="text-foreground font-medium">Heure</Label>
                  <div className="relative w-full min-w-[7rem] overflow-visible rounded-xl border border-border bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0 h-12">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none shrink-0 z-10" />
                    <input
                      id="time-native"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full min-w-[6rem] h-full pl-11 pr-2 rounded-xl bg-transparent border-0 text-foreground text-sm focus:outline-none focus:ring-0 [color-scheme:dark] box-border"
                    />
                  </div>
                </div>
              </div>

              {/* Desktop (lg+) : calendrier et liste d'heures (Radix) */}
              <div className="space-y-2 hidden lg:block">
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

              <div className="space-y-2 hidden lg:block">
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
              <div className="mb-8 p-4 rounded-2xl border border-border/80 bg-muted/20">
                <p className="text-sm font-medium text-foreground">Estimation indicative (non contractuelle)</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Fourchette usuelle : {formatEUR(indicativeRange.low)} – {formatEUR(indicativeRange.high)}. Le tarif retenu sera sur le devis du professionnel.
                </p>
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
                J&apos;accepte que ma demande soit transmise aux chauffeurs du réseau Corail. Le tarif sera porté sur le devis.
                <br />
                J&apos;accepte les{" "}
                <Link href="/cgu" className="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">CGU</Link>
                {" "}et la{" "}
                <Link href="/confidentialite" className="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">Politique de confidentialité</Link>.
              </label>
            </div>

            {submitStatus === "success" && (
              <div className="mb-6 p-4 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 text-center space-y-1">
                <p className="font-semibold">Devis en cours</p>
                <p className="text-sm">
                  Votre demande est visible par les chauffeurs. Vous recevrez un devis par email dès qu’un tarif sera proposé.
                </p>
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
              {submitStatus === "loading" ? "Envoi en cours…" : "Envoyer ma demande de devis"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
