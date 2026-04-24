import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-medium text-foreground mb-6 leading-tight tracking-tight">
          Prêt à réserver ou à rejoindre le réseau ?
        </h2>
        <p className="text-foreground/60 text-lg lg:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
          Une demande, une confirmation, un trajet. Sans commission.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="#reserver"
            className="btn-primary-glow btn-press inline-flex items-center justify-center gap-3 px-10 py-5 bg-primary text-primary-foreground font-medium rounded-full hover:bg-primary/90 transition-all duration-300 shadow-2xl shadow-primary/25 text-lg"
          >
            Réserver un trajet
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/devenir-chauffeur"
            className="link-underline inline-flex items-center justify-center gap-3 px-10 py-5 border-2 border-foreground/25 text-foreground font-medium rounded-full hover:bg-foreground/5 transition-all duration-300 text-lg"
          >
            Devenir chauffeur
          </Link>
        </div>
      </div>
    </section>
  );
}
