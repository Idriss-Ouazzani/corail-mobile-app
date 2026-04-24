import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="py-32 lg:py-40">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-serif text-4xl lg:text-6xl font-medium text-foreground mb-8 leading-tight tracking-tight">
            Rejoignez le{" "}
            <span className="text-primary">réseau</span>
          </h2>

          <div className="space-y-6 mb-12 text-center max-w-lg mx-auto">
            <p className="text-foreground/60 text-lg leading-relaxed">
              <strong className="text-foreground/90">Vous êtes client ?</strong>
              <br />
              <Link href="#reserver" className="text-primary font-medium underline underline-offset-2 hover:no-underline">Réservez via le site</Link> — votre demande est transmise aux chauffeurs du réseau Corail et vous recevez une confirmation par mail.
            </p>
            <p className="text-foreground/60 text-lg leading-relaxed">
              <strong className="text-foreground/90">Vous êtes chauffeur ?</strong>
              <br />
              Téléchargez l&apos;application : vous aurez une page professionnelle dédiée sur laquelle vos clients pourront réserver directement avec vous.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="#reserver"
              className="btn-primary-glow btn-press inline-flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground font-medium rounded-full hover:bg-primary/90 transition-all shadow-2xl shadow-primary/25"
            >
              Réserver un trajet
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
