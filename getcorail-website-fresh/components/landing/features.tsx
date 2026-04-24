import {
  CheckCircle2,
  Lock,
  Smartphone,
  CreditCard,
  Clock,
  Star,
} from "lucide-react";

const features = [
  {
    icon: CheckCircle2,
    title: "Réseau structuré",
    description: "Les chauffeurs déclarent leurs documents professionnels (licence, identité).",
  },
  {
    icon: Lock,
    title: "Données protégées",
    description: "Vos échanges et données personnelles sont sécurisés.",
  },
  {
    icon: Smartphone,
    title: "Application dédiée",
    description: "Demandes de course et confirmations, tout au même endroit.",
  },
  {
    icon: CreditCard,
    title: "Tarif choisi à la demande",
    description: "Vous indiquez votre budget ou le tarif recommandé ; le chauffeur confirme au tarif convenu.",
  },
  {
    icon: Clock,
    title: "Demande flexible",
    description: "Envoyez votre demande à l'avance ou au dernier moment.",
  },
  {
    icon: Star,
    title: "Relation directe",
    description: "Contrat et paiement directement avec le chauffeur de votre choix.",
  },
];

export function Features() {
  return (
    <section id="fonctionnalites" className="py-28 lg:py-40 relative bg-gradient-to-b from-background via-muted/20 to-background overflow-x-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 min-w-0">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center min-w-0">
          {/* App Screenshots */}
          <div className="relative order-2 lg:order-1 min-w-0">
            <div className="flex justify-center gap-3 sm:gap-6 flex-wrap sm:flex-nowrap">
              <div className="card-hover w-[140px] sm:w-[180px] lg:w-[220px] relative rounded-[1.25rem] sm:rounded-[1.75rem] overflow-hidden shadow-2xl shadow-black/10 ring-1 ring-border/50 shrink-0 transition-all duration-300">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/app-factures.jpeg"
                  alt="Corail - Factures"
                  className="object-cover w-full h-auto"
                />
              </div>
              <div className="card-hover w-[140px] sm:w-[180px] lg:w-[220px] relative sm:-mt-10 rounded-[1.25rem] sm:rounded-[1.75rem] overflow-hidden shadow-2xl shadow-black/10 ring-1 ring-border/50 shrink-0 transition-all duration-300">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/app-outils.jpeg"
                  alt="Corail - Outils"
                  className="object-cover w-full h-auto"
                />
              </div>
            </div>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-2/3 h-24 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2 min-w-0">
            <p className="text-primary font-medium tracking-[0.2em] uppercase text-xs mb-6">
              L&apos;application
            </p>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-medium text-foreground mb-6 leading-[1.15] tracking-tight break-words">
              Une app pour les chauffeurs
            </h2>

            <p className="text-foreground/60 text-base sm:text-lg lg:text-xl leading-relaxed mb-12 min-w-0">
              Recevez les demandes de course (site ou en direct), répondez avec vos tarifs, gérez vos devis et factures. Tout pour piloter votre activité au quotidien.
            </p>

            <div className="grid grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-8 min-w-0">
              {features.map((feature) => (
                <div key={feature.title} className="card-hover flex gap-3 sm:gap-4 p-4 rounded-2xl -m-4 hover:bg-muted/30 transition-all duration-300 group min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                    <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-foreground mb-1.5 text-sm sm:text-base">
                      {feature.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-foreground/55 leading-relaxed break-words">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
