import { Shield, CreditCard, Lock } from "lucide-react";

const badges = [
  { icon: Lock, label: "Données sécurisées" },
  { icon: CreditCard, label: "Paiement direct avec le chauffeur" },
  { icon: Shield, label: "Chauffeurs vérifiés" },
];

export function TrustLogosSection() {
  return (
    <section className="py-16 lg:py-20 border-b border-border/60 bg-muted/10">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <p className="text-center text-sm font-medium text-foreground/50 uppercase tracking-widest mb-10">
          Ils nous font confiance
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12 lg:gap-16 opacity-60">
          {["Entreprises", "Hôtellerie", "Particuliers", "Événements"].map((name) => (
            <span
              key={name}
              className="text-lg font-medium text-foreground/70"
            >
              {name}
            </span>
          ))}
        </div>
        <div className="mt-14 flex flex-wrap justify-center gap-6 sm:gap-8">
          {badges.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-background/80 border border-border/60 text-foreground/80 text-sm font-medium shadow-sm"
            >
              <Icon className="w-4 h-4 text-primary shrink-0" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
