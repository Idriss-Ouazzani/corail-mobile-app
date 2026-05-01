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
  ChevronDown,
  Apple,
} from "lucide-react";

const CORAIL_IOS_APP_STORE_URL =
  "https://apps.apple.com/fr/app/corail/id6759494730";

/** Badge marketing Apple (FR) — guidelines App Store */
const APP_STORE_BADGE_FR_SRC =
  "https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/fr-fr?size=250x83";

/** Badge marketing Google Play (FR) — affiché en attente, grisé */
const GOOGLE_PLAY_BADGE_FR_SRC =
  "https://play.google.com/intl/fr_fr/badges/static/images/badges/fr_badge_web_generic.png";

const iosQrCodeSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
  CORAIL_IOS_APP_STORE_URL
)}`;

function ChauffeurAppDownloads({ className }: { className?: string }) {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10 max-w-2xl ${className ?? ""}`}
    >
      <div className="relative overflow-hidden rounded-2xl border border-stone-200/90 bg-gradient-to-b from-stone-50/95 to-card p-7 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_12px_40px_-12px_rgba(28,25,23,0.12)]">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/[0.06]" aria-hidden />
        <div className="relative flex items-center justify-center gap-2.5 mb-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200/80 bg-white shadow-sm">
            <Apple className="h-5 w-5 text-stone-900" strokeWidth={1.25} aria-hidden />
          </span>
          <div className="text-left">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">
              iPhone &amp; iPad
            </p>
            <p className="font-serif text-lg text-stone-900 tracking-tight">App Store</p>
          </div>
        </div>
        <a
          href={CORAIL_IOS_APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="relative mx-auto mb-6 block w-full max-w-[220px] transition-transform duration-300 hover:scale-[1.02] active:scale-[0.99]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- asset Apple tiers */}
          <img
            src={APP_STORE_BADGE_FR_SRC}
            width={250}
            height={83}
            alt="Télécharger dans l’App Store"
            className="h-[52px] w-auto mx-auto drop-shadow-sm"
          />
        </a>
        <div className="mx-auto mb-5 h-px max-w-[200px] bg-gradient-to-r from-transparent via-stone-300 to-transparent" />
        <a
          href={CORAIL_IOS_APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-xl border border-stone-200/90 bg-white p-2.5 shadow-md ring-1 ring-black/[0.03] transition-shadow hover:shadow-lg"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- QR dynamique tiers */}
          <img
            src={iosQrCodeSrc}
            width={180}
            height={180}
            alt="QR code — Corail sur l’App Store"
            className="rounded-lg"
          />
        </a>
        <p className="mt-5 text-center text-sm leading-relaxed text-stone-600">
          Scannez le code ou utilisez le badge ci-dessus pour ouvrir{" "}
          <span className="font-medium text-stone-800">l’App Store</span>.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-dashed border-stone-300/80 bg-gradient-to-b from-stone-100/40 to-muted/30 p-7 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(120,113,108,0.08),transparent_55%)]" aria-hidden />
        <div className="relative flex items-center justify-center gap-2.5 mb-5 opacity-80 grayscale">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-300/70 bg-white/80">
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              <title>Google Play</title>
              <path
                fill="#5f6368"
                d="M3 3.805v16.39a.97.97 0 001.47.82l9.2-5.24v-.01L3 3.805zm13.18 6.71l-3.15-1.8L3 21.995l13.18-11.48zM14.54 8.3L21 4.61V19.39l-6.46-3.69-3.3 1.88 9.2 5.24A.97.97 0 0023 20.195V3.805a.97.97 0 00-1.26-.93l-9.2 5.24 3 1.22zm-4.84-.5L3 2.005v.01l8.3 4.79-1.6.92z"
              />
            </svg>
          </span>
          <div className="text-left">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-500">
              Android
            </p>
            <p className="font-serif text-lg text-stone-700 tracking-tight">Google Play</p>
          </div>
        </div>
        <div className="relative mx-auto mb-5 flex max-w-[220px] justify-center opacity-55 grayscale contrast-125">
          {/* eslint-disable-next-line @next/next/no-img-element -- asset Google tiers */}
          <img
            src={GOOGLE_PLAY_BADGE_FR_SRC}
            width={564}
            height={168}
            alt="Google Play — bientôt disponible"
            className="h-[52px] w-auto"
          />
        </div>
        <div className="relative mx-auto flex min-h-[156px] max-w-[200px] flex-col items-center justify-center gap-2 rounded-xl border border-stone-300/50 bg-white/40 px-4 py-6 backdrop-blur-[2px]">
          <span className="rounded-full border border-stone-400/40 bg-stone-800/90 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-100 shadow-sm">
            Bientôt disponible
          </span>
          <p className="text-xs leading-relaxed text-stone-500">
            La version Android suivra sous peu.
          </p>
        </div>
      </div>
    </div>
  );
}

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
            <div className="space-y-8">
              <ChauffeurAppDownloads />
              <div className="flex justify-start sm:justify-start">
                <Link
                  href="#parcours"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 border border-foreground/25 text-foreground font-medium rounded-full hover:bg-foreground/5 transition-all"
                >
                  Voir le parcours
                  <ChevronDown className="w-5 h-5" />
                </Link>
              </div>
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
              <p className="text-foreground/60 text-lg lg:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
                Téléchargez l&apos;application Corail pour chauffeurs (iOS). Inscription gratuite, sans engagement.
              </p>
              <ChauffeurAppDownloads className="mx-auto mb-10" />
              <div className="flex flex-col sm:flex-row justify-center gap-4">
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
