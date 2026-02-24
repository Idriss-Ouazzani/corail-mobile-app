import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import {
  Inbox,
  PenLine,
  FileText,
  Bell,
  CalendarClock,
  Receipt,
  Share2,
  Store,
  CreditCard,
  Smartphone,
  FileCheck,
  Users,
  Sparkles,
  ArrowRight,
  Download,
  ChevronDown,
} from "lucide-react";

const flowSteps = [
  {
    number: "1",
    icon: Inbox,
    title: "Réception d'une demande client",
    description: "Via le site Corail ou en direct : le client envoie sa demande (trajet, date, budget indicatif). Vous la recevez dans l'app.",
  },
  {
    number: "2",
    icon: PenLine,
    title: "Saisie de la course dans l'app",
    description: "Vous renseignez les détails du trajet dans Corail. Une seule saisie pour tout gérer : devis, planning, facture.",
  },
  {
    number: "3",
    icon: FileText,
    title: "Création du devis et envoi au client",
    description: "Générez le devis en un clic dans l'app et envoyez-le automatiquement au client par email ou lien. Plus besoin de document à la main.",
  },
  {
    number: "4",
    icon: Bell,
    title: "Blocage et rappels automatiques",
    description: "Bloquez le créneau dans votre planning et recevez des rappels pour ne rater aucune course. Organisez-vous efficacement.",
  },
  {
    number: "5",
    icon: Receipt,
    title: "Facture en un clic",
    description: "Une fois la course effectuée, envoyez la facture au client avec un bouton. PDF professionnel, prêt à partager ou à télécharger.",
  },
  {
    number: "6",
    icon: Share2,
    title: "Pas dispo ? Partagez la course",
    description: "Vous n'êtes pas disponible au créneau demandé ? Partagez cette course à votre cercle proche ou à tous les chauffeurs de la région.",
  },
  {
    number: "7",
    icon: Store,
    title: "Dispo ? Saisissez des courses en marketplace",
    description: "Vous avez du temps ? Jetez un œil dans la marketplace pour récupérer des courses publiées par d'autres chauffeurs.",
  },
];

const paymentTools = [
  {
    icon: CreditCard,
    title: "Terminal de paiement",
    description: "Paiement par carte en fin de course, comme en professionnel.",
  },
  {
    icon: Smartphone,
    title: "App de paiement sans contact",
    description: "Recevez les paiements via une app dédiée (CB, mobile) sans terminal physique.",
  },
  {
    icon: FileCheck,
    title: "Devis avec Corail",
    description: "Générez et envoyez vos devis depuis l'app Corail. Le client reçoit un document clair et professionnel.",
  },
];

const promiseItems = [
  {
    icon: Sparkles,
    title: "Votre indépendance",
    description: "Corail vous redonne la main : vous gérez vos tarifs, vos créneaux et votre relation client. Pas d'intermédiaire qui impose ses règles.",
  },
  {
    icon: Users,
    title: "Une vraie communauté",
    description: "L'indépendance ne veut pas dire être seul. Partagez des courses, échangez avec d'autres chauffeurs et développez votre réseau.",
  },
  {
    icon: Sparkles,
    title: "100 % gratuit pour vous",
    description: "Aucun abonnement, aucune commission sur vos courses. Les outils Corail sont gratuits pour les chauffeurs du réseau.",
  },
];

export default function DevenirChauffeurPage() {
  return (
    <div className="min-h-screen">
      <Header />

      <main>
        {/* Hero */}
        <section className="relative pt-32 pb-24 lg:pt-40 lg:pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-background" />
          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
            <p className="text-primary font-medium tracking-[0.2em] uppercase text-xs mb-6">
              Devenir chauffeur privé pro
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-medium text-foreground leading-[1.08] tracking-tight mb-8 max-w-4xl">
              Passez au niveau supérieur avec{" "}
              <span className="text-primary">Corail</span>
            </h1>
            <p className="text-xl text-foreground/70 leading-relaxed mb-10 max-w-2xl">
              De la réception de la demande à la facture, en passant par le devis et le planning : 
              un seul outil pour maximiser vos gains et travailler sereinement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="#"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground font-medium rounded-full hover:bg-primary/90 transition-all shadow-2xl shadow-primary/25"
              >
                Télécharger l&apos;app chauffeur
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#parcours"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 border border-foreground/25 text-foreground font-medium rounded-full hover:bg-foreground/5 transition-all"
              >
                Voir le parcours
                <ChevronDown className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Flow: Votre parcours avec Corail */}
        <section id="parcours" className="py-28 lg:py-40 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/15 to-background" />
          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-20 lg:mb-24">
              <p className="text-primary font-medium tracking-[0.2em] uppercase text-xs mb-6">
                Votre parcours
              </p>
              <h2 className="font-serif text-4xl lg:text-5xl xl:text-6xl font-medium text-foreground mb-6 tracking-tight">
                Du client à la facture, tout est dans Corail
              </h2>
              <p className="text-foreground/60 text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed">
                Un flux simple pour ne rien oublier et rester organisé, de la première demande jusqu&apos;au paiement.
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-0">
              {flowSteps.map((step, index) => {
                const Icon = step.icon;
                const isLast = index === flowSteps.length - 1;
                return (
                  <div key={step.number} className="relative flex gap-6 lg:gap-8">
                    {/* Timeline line */}
                    {!isLast && (
                      <div className="absolute left-[23px] top-14 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary/30 to-transparent" />
                    )}
                    {/* Icon + number */}
                    <div className="relative flex-shrink-0 z-10">
                      <div className="w-12 h-12 rounded-xl bg-card border border-border/60 flex items-center justify-center shadow-lg">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                        {step.number}
                      </div>
                    </div>
                    {/* Content */}
                    <div className="pb-16 lg:pb-20">
                      <h3 className="font-semibold text-xl lg:text-2xl text-foreground mb-2 tracking-tight">
                        {step.title}
                      </h3>
                      <p className="text-foreground/55 leading-relaxed text-sm lg:text-base">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Paiements & outils pro */}
        <section className="py-28 lg:py-40 relative bg-gradient-to-b from-background via-muted/20 to-background">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-16 lg:mb-20">
              <p className="text-primary font-medium tracking-[0.2em] uppercase text-xs mb-6">
                Paiements & outils
              </p>
              <h2 className="font-serif text-4xl lg:text-5xl font-medium text-foreground mb-6 tracking-tight">
                Travaillez comme un pro
              </h2>
              <p className="text-foreground/60 text-lg max-w-2xl mx-auto leading-relaxed">
                Terminal carte, app sans contact ou virement : vous choisissez comment encaisser. 
                Corail s&apos;occupe du devis et de la facture.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
              {paymentTools.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="p-8 rounded-2xl bg-card border border-border/60 shadow-lg hover:border-primary/20 transition-colors"
                  >
                    <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center mb-6">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-semibold text-xl text-foreground mb-3">{item.title}</h3>
                    <p className="text-foreground/55 leading-relaxed text-sm lg:text-base">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* La promesse Corail */}
        <section className="py-28 lg:py-40 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-muted/10 via-background to-primary/5" />
          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-20 lg:mb-24">
              <p className="text-primary font-medium tracking-[0.2em] uppercase text-xs mb-6">
                Notre promesse
              </p>
              <h2 className="font-serif text-4xl lg:text-5xl xl:text-6xl font-medium text-foreground mb-6 tracking-tight">
                Votre indépendance,{" "}
                <span className="text-primary">en communauté</span>
              </h2>
              <p className="text-foreground/60 text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed">
                Corail vous redonne votre indépendance — et cela passe par la création d&apos;une communauté. 
                Le tout 100 % gratuit pour vous.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-10 lg:gap-14">
              {promiseItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="text-center p-8 lg:p-10 rounded-2xl bg-card border border-border/60 shadow-lg hover:shadow-xl hover:border-primary/20 transition-all"
                  >
                    <div className="inline-flex w-16 h-16 rounded-2xl bg-primary/15 items-center justify-center mb-6">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-xl lg:text-2xl text-foreground mb-4">
                      {item.title}
                    </h3>
                    <p className="text-foreground/55 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 lg:py-40">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="font-serif text-4xl lg:text-6xl font-medium text-foreground mb-6 leading-tight tracking-tight">
                Prêt à rejoindre le{" "}
                <span className="text-primary">réseau</span> ?
              </h2>
              <p className="text-foreground/60 text-lg lg:text-xl mb-12 max-w-xl mx-auto leading-relaxed">
                Téléchargez l&apos;application Corail pour chauffeurs. Inscription gratuite, sans engagement.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="#"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground font-medium rounded-full hover:bg-primary/90 transition-all shadow-2xl shadow-primary/25"
                >
                  <Download className="w-5 h-5" />
                  Télécharger l&apos;app
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 border border-foreground/25 text-foreground font-medium rounded-full hover:bg-foreground/5 transition-all"
                >
                  Retour à l&apos;accueil
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
