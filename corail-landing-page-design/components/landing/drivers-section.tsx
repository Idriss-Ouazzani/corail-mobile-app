import Image from "next/image";
import { Shield, Users, Share2, Receipt, Calendar, QrCode, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const driverFeatures = [
  {
    icon: Shield,
    title: "Réseau vérifié",
    description: "Rejoignez une communauté de chauffeurs privés vérifiés.",
  },
  {
    icon: Share2,
    title: "Partage de courses",
    description: "Travaillez ensemble en partageant vos courses avec vos groupes.",
  },
  {
    icon: Users,
    title: "Groupes de confiance",
    description: "Créez votre réseau de collègues et mutualisez les demandes.",
  },
  {
    icon: Receipt,
    title: "Vos devis, vos factures",
    description: "Outils pour construire vos devis et factures en votre nom.",
  },
  {
    icon: Calendar,
    title: "Planning intégré",
    description: "Visualisez vos courses et organisez votre activité.",
  },
  {
    icon: QrCode,
    title: "QR Code Pro",
    description: "Votre page publique et QR Code pour vos clients.",
  },
];

export function DriversSection() {
  return (
    <section id="chauffeurs" className="py-28 lg:py-40 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-1/2 bg-gradient-to-b from-transparent via-primary/10 to-transparent hidden lg:block" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Driver Images - visuel réseau, pas de données fictives */}
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

          {/* Content */}
          <div className="order-1 lg:order-2">
            <p className="text-primary font-medium tracking-[0.2em] uppercase text-xs mb-6">
              Réseau chauffeurs
            </p>

            <h2 className="font-serif text-4xl lg:text-5xl xl:text-6xl font-medium text-foreground mb-6 leading-[1.1] tracking-tight">
              Outils gratuits pour chauffeurs privés
            </h2>

            <p className="text-foreground/60 text-lg lg:text-xl leading-relaxed mb-12 max-w-lg">
              Rejoignez un réseau de chauffeurs indépendants. Recevez les demandes de courses, 
              répondez avec vos propres tarifs, gérez votre activité avec des outils pensés pour vous.
            </p>

            <div className="grid grid-cols-2 gap-x-8 gap-y-8 mb-12">
              {driverFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="flex gap-4 group">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground mb-1.5">{feature.title}</h3>
                      <p className="text-sm text-foreground/55 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-10 h-14 text-base font-medium shadow-xl shadow-primary/20 transition-all hover:shadow-primary/30">
              Rejoindre Corail
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
