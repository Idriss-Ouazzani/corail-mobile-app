import { MapPin, MessageSquare, Car } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: MapPin,
    title: "Envoyez votre demande",
    description: "Adresses, date, heure et éventuellement un budget indicatif. La demande part vers le réseau.",
  },
  {
    number: "02",
    icon: MessageSquare,
    title: "Les chauffeurs vous répondent",
    description: "Les chauffeurs du réseau reçoivent votre demande et vous envoient leur proposition (tarif, véhicule, etc.).",
  },
  {
    number: "03",
    icon: Car,
    title: "Vous choisissez",
    description: "Vous acceptez la proposition qui vous convient. La relation et le contrat sont entre vous et le chauffeur.",
  },
];

export function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="py-28 lg:py-40 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/15 to-background" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-20 lg:mb-24">
          <p className="text-primary font-medium tracking-[0.2em] uppercase text-xs mb-6">
            Processus simple
          </p>
          <h2 className="font-serif text-4xl lg:text-5xl xl:text-6xl font-medium text-foreground mb-6 tracking-tight">
            Comment ça marche
          </h2>
          <p className="text-foreground/60 text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed">
            Une demande, des réponses, un choix. Corail met en relation ; vous et le chauffeur faites le reste.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-10 lg:gap-14">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="relative group">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-[55%] w-[90%] h-px bg-gradient-to-r from-primary/30 via-primary/20 to-transparent" />
                )}
                
                <div className="text-center">
                  <div className="relative inline-block mb-8">
                    <div className="w-28 h-28 rounded-3xl bg-card border border-border/60 flex items-center justify-center shadow-lg shadow-black/5 group-hover:shadow-xl group-hover:border-primary/20 transition-all duration-300">
                      <Icon className="w-12 h-12 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shadow-md">
                      {step.number}
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-xl lg:text-2xl text-foreground mb-4 tracking-tight">{step.title}</h3>
                  <p className="text-foreground/55 leading-relaxed max-w-sm mx-auto text-sm lg:text-base">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
