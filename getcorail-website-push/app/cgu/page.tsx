import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ChevronLeft } from "lucide-react";

export const metadata = {
  title: "Conditions générales d'utilisation | Corail",
  description: "Conditions générales d'utilisation du site getcorail.com et de l'application Corail VTC.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-foreground mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="text-primary shrink-0">•</span>
      <span className="text-foreground/80 text-sm leading-relaxed">{children}</span>
    </div>
  );
}

function Important({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200/90 text-sm leading-relaxed">
      {children}
    </div>
  );
}

export default function CGUPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Header />
      <main className="max-w-3xl mx-auto px-6 lg:px-8 pt-32 pb-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ChevronLeft className="w-4 h-4" />
          Retour à l&apos;accueil
        </Link>

        <h1 className="font-serif text-3xl font-medium text-foreground mb-2">
          Conditions générales d&apos;utilisation
        </h1>
        <p className="text-sm text-muted-foreground italic mb-10">
          Dernière mise à jour : 4 janvier 2026
        </p>

        <div className="prose prose-invert max-w-none text-foreground/80">
          <Section title="1. Présentation du service">
            <p className="text-sm leading-relaxed">
              Corail est une plateforme de mise en relation : le site getcorail.com permet aux clients
              d&apos;envoyer une demande de course ; l&apos;application est réservée aux chauffeurs VTC professionnels.
            </p>
            <Bullet>Publier des courses disponibles</Bullet>
            <Bullet>Prendre des courses publiées par d&apos;autres chauffeurs</Bullet>
            <Bullet>Gérer vos courses personnelles</Bullet>
            <Bullet>Générer des devis clients</Bullet>
            <Bullet>Créer des groupes de chauffeurs</Bullet>
            <Important>
              Corail est un service de mise en relation uniquement. Nous ne sommes pas responsables
              de l&apos;exécution du transport, du paiement entre chauffeurs et clients, ni des litiges qui en découlent.
            </Important>
          </Section>

          <Section title="2. Conditions d'accès">
            <p className="text-sm leading-relaxed">Pour utiliser l&apos;application Corail (chauffeurs), vous devez :</p>
            <Bullet>Être majeur(e) et professionnel(le) VTC</Bullet>
            <Bullet>Disposer d&apos;une carte VTC valide</Bullet>
            <Bullet>Fournir un numéro SIREN valide</Bullet>
            <Bullet>Accepter ces conditions d&apos;utilisation</Bullet>
            <Bullet>Fournir des informations exactes et à jour</Bullet>
            <p className="text-sm leading-relaxed">
              Nous nous réservons le droit de vérifier votre statut professionnel et de refuser
              ou suspendre votre compte en cas d&apos;informations fausses ou incomplètes.
            </p>
          </Section>

          <Section title="3. Création de compte">
            <Bullet>Vous êtes responsable de la confidentialité de votre mot de passe</Bullet>
            <Bullet>Un seul compte par personne physique</Bullet>
            <Bullet>Vous devez notifier toute utilisation non autorisée</Bullet>
            <Bullet>Vous êtes responsable de toutes les activités sur votre compte</Bullet>
          </Section>

          <Section title="4. Système de crédits (application)">
            <p className="text-sm font-medium text-foreground/90">Fonctionnement :</p>
            <Bullet>Les crédits (C) sont la monnaie virtuelle de Corail</Bullet>
            <Bullet>Publier une course = +1 crédit</Bullet>
            <Bullet>Prendre une course = -1 crédit</Bullet>
            <p className="text-sm font-medium text-foreground/90 mt-4">Conditions :</p>
            <Bullet>Les crédits ne sont ni remboursables ni échangeables contre de l&apos;argent</Bullet>
            <Bullet>Ils ne peuvent pas être transférés entre utilisateurs</Bullet>
            <Bullet>En cas de fermeture de compte, les crédits restants sont perdus</Bullet>
          </Section>

          <Section title="5. Publication et prise de courses">
            <p className="text-sm font-medium text-foreground/90">En publiant une course, vous vous engagez à :</p>
            <Bullet>Fournir des informations exactes (adresses, horaires, tarifs)</Bullet>
            <Bullet>Honorer la course si elle est prise par un autre chauffeur</Bullet>
            <p className="text-sm font-medium text-foreground/90 mt-4">En prenant une course, vous vous engagez à :</p>
            <Bullet>Réaliser le transport aux conditions indiquées</Bullet>
            <Bullet>Contacter le créateur de la course rapidement</Bullet>
            <Bullet>Marquer la course comme terminée une fois effectuée</Bullet>
            <Important>
              Le paiement du service de transport s&apos;effectue entre chauffeurs (ou entre chauffeur et client).
              Corail n&apos;intervient pas dans les transactions financières liées au transport.
            </Important>
          </Section>

          <Section title="6. Comportement et sanctions">
            <p className="text-sm leading-relaxed">Les comportements suivants sont strictement interdits :</p>
            <Bullet>Publier de fausses courses</Bullet>
            <Bullet>Ne pas honorer une course prise</Bullet>
            <Bullet>Comportement abusif, harcèlement, discrimination</Bullet>
            <Bullet>Création de faux comptes</Bullet>
            <Bullet>Utilisation du service à des fins illégales</Bullet>
            <p className="text-sm leading-relaxed">
              <strong className="text-foreground">Sanctions :</strong> avertissement, suspension temporaire,
              bannissement définitif selon la gravité.
            </p>
          </Section>

          <Section title="7. Propriété intellectuelle">
            <p className="text-sm leading-relaxed">
              Tous les éléments du site et de l&apos;application (logo, design, code, textes) sont la propriété
              exclusive de Corail. Toute reproduction ou utilisation sans autorisation est interdite.
            </p>
            <Bullet>Vous conservez la propriété de vos données (courses, profil, etc.)</Bullet>
            <Bullet>Vous nous accordez une licence pour utiliser vos données dans le cadre du service</Bullet>
          </Section>

          <Section title="8. Responsabilités et garanties">
            <p className="text-sm font-medium text-foreground/90">Responsabilité de Corail :</p>
            <Bullet>Nous fournissons la plateforme &quot;en l&apos;état&quot;</Bullet>
            <Bullet>Nous ne sommes pas responsables des litiges entre chauffeurs ou avec les clients</Bullet>
            <Bullet>Nous ne sommes pas responsables des pertes financières liées à l&apos;utilisation du service</Bullet>
            <p className="text-sm font-medium text-foreground/90 mt-4">Votre responsabilité :</p>
            <Bullet>Vous êtes responsable de vos publications et transactions</Bullet>
            <Bullet>Vous devez disposer des assurances professionnelles obligatoires</Bullet>
            <Bullet>Vous êtes responsable du respect du code des transports</Bullet>
          </Section>

          <Section title="9. Suspension et résiliation">
            <p className="text-sm leading-relaxed">Nous pouvons suspendre ou résilier votre compte :</p>
            <Bullet>En cas de violation de ces CGU</Bullet>
            <Bullet>En cas de fraude ou comportement abusif</Bullet>
            <Bullet>Si votre carte VTC n&apos;est plus valide</Bullet>
            <p className="text-sm leading-relaxed mt-3">Vous pouvez résilier votre compte à tout moment via l&apos;application. Les crédits restants seront perdus ; vos données seront supprimées sous 30 jours (sauf obligations légales).</p>
          </Section>

          <Section title="10. Modifications des CGU">
            <p className="text-sm leading-relaxed">
              Nous pouvons modifier ces CGU à tout moment. Les modifications importantes vous seront
              notifiées via l&apos;application ou le site. Continuer à utiliser Corail après modification
              vaut acceptation des nouvelles conditions.
            </p>
          </Section>

          <Section title="11. Droit applicable et litiges">
            <p className="text-sm leading-relaxed">
              Ces CGU sont régies par le droit français. En cas de litige, une solution amiable sera
              recherchée en priorité. À défaut, les tribunaux français seront compétents.
            </p>
            <Bullet>Médiation : <a href="mailto:contact@getcorail.com" className="text-primary underline">contact@getcorail.com</a></Bullet>
            <Bullet>Plateforme européenne de règlement en ligne : <a href="https://ec.europa.eu/odr" target="_blank" rel="noopener noreferrer" className="text-primary underline">ec.europa.eu/odr</a></Bullet>
          </Section>

          <Section title="12. Contact">
            <p className="text-sm leading-relaxed">Pour toute question sur ces conditions :</p>
            <Bullet>Email : <a href="mailto:contact@getcorail.com" className="text-primary underline">contact@getcorail.com</a></Bullet>
            <Bullet>Support : dans l&apos;app, onglet Profil → Aide & Support</Bullet>
          </Section>

          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground space-y-1">
            <p>En utilisant Corail (site ou application), vous acceptez ces conditions d&apos;utilisation.</p>
            <p>© 2026 Corail. Tous droits réservés.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
