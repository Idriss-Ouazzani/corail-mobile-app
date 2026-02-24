import Image from "next/image";
import Link from "next/link";
import { FileText, Calendar, Share2, UserCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const memberBenefits = [
  { icon: UserCircle, label: "D'une page professionnelle dédiée" },
  { icon: FileText, label: "D'outils de devis et facturation" },
  { icon: Calendar, label: "D'un planning intégré" },
  { icon: Share2, label: "D'un système de partage entre confrères" },
];

export function DriversSection() {
  return (
    <section id="chauffeurs" className="py-28 lg:py-40 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-1/2 bg-gradient-to-b from-transparent via-primary/10 to-transparent hidden lg:block" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Driver Images */}
          <div className="relative order-2 lg:order-1">
            <div className="grid grid-cols-3 gap-5">
              <div className="col-span-2 aspect-[4/5] relative rounded-2xl overflow-hidden shadow-xl shadow-black/10 ring-1 ring-border/50">
                <Image
                  src="/images/driver-1.jpg"
                  alt="Chauffeur du réseau Corail"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              </div>
              <div className="space-y-5">
                <div className="aspect-square relative rounded-2xl overflow-hidden shadow-lg ring-1 ring-border/40">
                  <Image
                    src="/images/driver-2.jpg"
                    alt="Chauffeur du réseau Corail"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="aspect-square relative rounded-2xl overflow-hidden shadow-lg ring-1 ring-border/40">
                  <Image
                    src="/images/driver-3.jpg"
                    alt="Chauffeur du réseau Corail"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Content — aligné visuellement sur Features et le reste du site */}
          <div className="order-1 lg:order-2 min-w-0">
            <p className="text-primary font-medium tracking-[0.2em] uppercase text-xs mb-6">
              Ambition
            </p>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-medium text-foreground mb-6 leading-[1.15] tracking-tight">
              Construire le plus grand réseau indépendant
            </h2>

            <p className="text-foreground/60 text-base sm:text-lg lg:text-xl leading-relaxed mb-10 min-w-0">
              Corail développe un réseau national structuré de chauffeurs privés.
            </p>

            <p className="text-foreground/80 font-medium mb-4 text-sm">Chaque membre dispose :</p>
            <div className="grid grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-6 mb-10 min-w-0">
              {memberBenefits.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex gap-3 sm:gap-4 p-4 rounded-2xl -m-4 hover:bg-muted/30 transition-colors group min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <p className="text-sm sm:text-base text-foreground/70 leading-relaxed pt-1.5 min-w-0">
                      {item.label}
                    </p>
                  </div>
                );
              })}
            </div>

            <p className="text-foreground/70 text-base lg:text-lg leading-relaxed mb-10">
              Un réseau organisé, pensé pour durer.
            </p>

            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-10 h-14 text-base font-medium shadow-xl shadow-primary/20 transition-all hover:shadow-primary/30">
              <Link href="/devenir-chauffeur" className="inline-flex items-center gap-2">
                Rejoindre le réseau
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
