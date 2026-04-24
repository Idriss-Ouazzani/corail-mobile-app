import { X, Check } from "lucide-react";

const traditional = [
  "Commission sur chaque course",
  "Tarifs imposés",
  "Algorithme décisionnaire",
  "Dépendance",
];

const corail = [
  "0 % de commission",
  "Tarifs librement définis",
  "Aucun algorithme décisionnaire",
  "Indépendance totale, réseau structuré",
];

export function ProblemSolutionSection() {
  return (
    <section className="py-28 lg:py-40 relative bg-gradient-to-b from-background via-muted/20 to-background overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 lg:px-8 text-center">
        <p className="text-primary font-medium tracking-[0.2em] uppercase text-xs mb-6">
          La différence
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-foreground mb-16 tracking-tight leading-snug">
          Le modèle traditionnel vous prélève.
          <br />
          <span className="text-primary">Corail vous structure</span>
          <span className="text-foreground">.</span>
        </h2>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 text-left">
          {/* Modèle traditionnel — carte premium sobre */}
          <div className="group relative rounded-[1.75rem] lg:rounded-[2rem] overflow-hidden bg-card/60 backdrop-blur-sm border border-border/60 p-8 lg:p-10 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.03)_inset] transition-all duration-300 hover:border-border/80 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)]">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-muted/10 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                  <X className="w-7 h-7 text-destructive/90" strokeWidth={2} />
                </div>
                <h3 className="font-serif text-xl lg:text-2xl font-medium text-foreground tracking-tight">Modèle traditionnel</h3>
              </div>
              <ul className="space-y-0">
                {traditional.map((item) => (
                  <li
                    key={item}
                    className="flex gap-4 py-4 border-b border-border/40 last:border-0 items-start"
                  >
                    <X className="w-5 h-5 text-destructive/70 shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-foreground/75 text-[15px] lg:text-base leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Corail — carte premium mise en avant */}
          <div className="group relative rounded-[1.75rem] lg:rounded-[2rem] overflow-hidden bg-gradient-to-b from-primary/10 to-primary/5 backdrop-blur-sm border border-primary/25 p-8 lg:p-10 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.15),0_0_0_1px_var(--primary)_inset] transition-all duration-300 card-hover hover:border-primary/40 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2),0_0_40px_-20px_var(--primary)]">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <Check className="w-7 h-7 text-primary" strokeWidth={2.5} />
                </div>
                <h3 className="font-serif text-xl lg:text-2xl font-medium text-primary tracking-tight">Corail</h3>
              </div>
              <ul className="space-y-0">
                {corail.map((item) => (
                  <li
                    key={item}
                    className="flex gap-4 py-4 border-b border-primary/15 last:border-0 items-start"
                  >
                    <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" strokeWidth={2.5} />
                    <span className="text-foreground/90 text-[15px] lg:text-base leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
