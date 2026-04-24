import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ChevronLeft, Mail } from "lucide-react";

export const metadata = {
  title: "Support | Corail",
  description: "Assistance pour les chauffeurs utilisant Corail. Contact et FAQ.",
};

const FAQ = [
  {
    question: "Comment créer ma page professionnelle ?",
    answer: "Créez votre compte dans l'application puis complétez votre profil dans l'onglet « Ma Page Pro ».",
  },
  {
    question: "Comment recevoir des réservations ?",
    answer: "Partagez le lien de votre page professionnelle avec vos clients.",
  },
  {
    question: "Comment modifier mes informations ?",
    answer: "Accédez à Paramètres > Profil dans l'application.",
  },
] as const;

export default function SupportPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Header />
      <main className="max-w-3xl mx-auto px-6 lg:px-8 pt-32 pb-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Retour à l&apos;accueil
        </Link>

        <h1 className="font-serif text-3xl sm:text-4xl font-medium text-foreground mb-2">
          Support Corail
        </h1>
        <p className="text-muted-foreground mb-12">
          Assistance pour les chauffeurs utilisant Corail.
        </p>

        {/* Contact direct */}
        <section className="mb-14">
          <p className="text-sm text-foreground/80 mb-4">
            Pour toute question ou assistance :
          </p>
          <a
            href="mailto:contact@getcorail.com"
            className="inline-flex items-center gap-2 text-primary font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-lg transition-colors"
          >
            <Mail className="w-5 h-5 shrink-0" />
            contact@getcorail.com
          </a>
          <p className="mt-3 text-sm text-muted-foreground">
            Nous répondons sous 24 à 48h ouvrées.
          </p>
        </section>

        {/* FAQ */}
        <section className="mb-14">
          <h2 className="text-lg font-bold text-foreground mb-6">Questions fréquentes</h2>
          <ul className="space-y-6">
            {FAQ.map((item) => (
              <li key={item.question} className="border-b border-border pb-6 last:border-0 last:pb-0">
                <h3 className="text-sm font-semibold text-foreground mb-2">{item.question}</h3>
                <p className="text-sm text-foreground/80 leading-relaxed">{item.answer}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Mention légale minimale */}
        <footer className="pt-8 border-t border-border text-center text-sm text-muted-foreground space-y-1">
          <p className="font-medium text-foreground/90">Corail – Réseau indépendant de chauffeurs privés</p>
          <p>France</p>
          <a
            href="mailto:contact@getcorail.com"
            className="text-primary hover:underline"
          >
            contact@getcorail.com
          </a>
        </footer>
      </main>
      <Footer />
    </div>
  );
}
