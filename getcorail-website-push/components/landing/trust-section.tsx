import { Scale } from "lucide-react";

export function TrustSection() {
  return (
    <section className="py-24 bg-card border-y border-border">
      <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-8">
          <Scale className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-serif text-2xl lg:text-3xl font-medium text-foreground mb-8 tracking-tight">
          Transparence
        </h2>
        <div className="space-y-6 text-foreground/70 text-lg leading-relaxed text-left max-w-2xl mx-auto">
          <p>
            Corail met en relation clients et chauffeurs indépendants.
            Chaque prestation est réalisée sous la responsabilité du chauffeur.
          </p>
          <p>
            Les membres déclarent leurs autorisations professionnelles et documents requis.
          </p>
        </div>
      </div>
    </section>
  );
}
