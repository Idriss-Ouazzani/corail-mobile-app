import { ShieldCheck, Lock, Server, Handshake } from "lucide-react";

const trustItems = [
  {
    icon: Handshake,
    title: "Mise en relation uniquement",
    description: "Corail met en contact clients et chauffeurs. Pas de transporteur : chaque chauffeur est indépendant.",
  },
  {
    icon: ShieldCheck,
    title: "Chauffeurs vérifiés",
    description: "Vérification des licences VTC et identité des membres du réseau.",
  },
  {
    icon: Lock,
    title: "Données protégées",
    description: "Vos données personnelles et échanges sont sécurisés.",
  },
  {
    icon: Server,
    title: "Hébergement UE",
    description: "Données en Europe, conforme RGPD.",
  },
];

export function TrustSection() {
  return (
    <section className="py-24 bg-card border-y border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {trustItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-medium text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-foreground/50 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
