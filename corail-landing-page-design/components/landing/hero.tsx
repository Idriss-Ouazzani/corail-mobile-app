import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-bg.jpg"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/92 to-background/50" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-24">
        <div className="max-w-2xl">
          <p className="text-primary font-medium tracking-[0.2em] uppercase text-xs mb-6">
            Portail de mise en relation
          </p>

          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-medium text-foreground leading-[1.08] tracking-tight mb-8">
            Comme un{" "}
            <span className="text-primary">corail</span>
            <br />
            un réseau qui grandit ensemble
          </h1>

          <p className="text-xl text-foreground/70 leading-relaxed mb-12">
            Chauffeurs privés indépendants, reliés par des outils gratuits pour travailler ensemble 
            et offrir le meilleur service. Les clients envoient une demande ; le réseau répond.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="#reserver"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground font-medium rounded-full hover:bg-primary/90 transition-all shadow-2xl shadow-primary/25"
            >
              Réserver une course
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#chauffeurs"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 border border-foreground/25 text-foreground font-medium rounded-full hover:bg-foreground/5 transition-all"
            >
              Rejoindre le réseau chauffeurs
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
