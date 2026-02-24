import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ChevronLeft } from "lucide-react";

export const metadata = {
  title: "Politique de confidentialité | Corail",
  description: "Politique de confidentialité et protection des données personnelles - Corail VTC.",
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

export default function ConfidentialitePage() {
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
          Politique de confidentialité
        </h1>
        <p className="text-sm text-muted-foreground italic mb-10">
          Dernière mise à jour : 4 janvier 2026
        </p>

        <div className="prose prose-invert max-w-none text-foreground/80">
          <Section title="1. Introduction">
            <p className="text-sm leading-relaxed">
              Corail (&quot;nous&quot;, &quot;notre&quot;, &quot;nos&quot;) s&apos;engage à protéger et respecter votre vie privée.
              Cette politique explique comment nous collectons, utilisons, partageons et protégeons vos données
              lorsque vous utilisez notre site getcorail.com et notre application mobile.
            </p>
            <p className="text-sm leading-relaxed">
              Corail est un service de mise en relation entre chauffeurs VTC professionnels et clients.
              Nous ne sommes pas responsables du transport lui-même.
            </p>
          </Section>

          <Section title="2. Données collectées">
            <p className="text-sm font-medium text-foreground/90">Données d&apos;identification :</p>
            <Bullet>Nom complet</Bullet>
            <Bullet>Adresse email</Bullet>
            <Bullet>Numéro de téléphone</Bullet>
            <Bullet>Numéro SIREN (chauffeurs)</Bullet>
            <Bullet>Numéro de carte VTC professionnelle (chauffeurs)</Bullet>
            <Bullet>Photo de profil (optionnelle)</Bullet>

            <p className="text-sm font-medium text-foreground/90 mt-4">Données d&apos;activité :</p>
            <Bullet>Demandes de course (site) et courses créées, publiées, prises (app)</Bullet>
            <Bullet>Adresses de départ et d&apos;arrivée</Bullet>
            <Bullet>Historique des transactions de crédits</Bullet>
            <Bullet>Devis créés et partagés</Bullet>
            <Bullet>Groupes auxquels vous appartenez</Bullet>

            <p className="text-sm font-medium text-foreground/90 mt-4">Données techniques :</p>
            <Bullet>Modèle d&apos;appareil et système d&apos;exploitation</Bullet>
            <Bullet>Adresse IP</Bullet>
            <Bullet>Logs d&apos;utilisation et d&apos;erreurs</Bullet>
          </Section>

          <Section title="3. Utilisation des données">
            <p className="text-sm leading-relaxed">Nous utilisons vos données pour :</p>
            <Bullet>Créer et gérer votre compte</Bullet>
            <Bullet>Traiter les demandes de course (site) et la mise en relation (app)</Bullet>
            <Bullet>Envoyer des notifications importantes</Bullet>
            <Bullet>Améliorer nos services</Bullet>
            <Bullet>Assurer la sécurité et prévenir la fraude</Bullet>
            <Bullet>Respecter nos obligations légales</Bullet>
          </Section>

          <Section title="4. Partage des données">
            <p className="text-sm leading-relaxed">
              Vos données personnelles sont partagées uniquement dans les cas suivants :
            </p>
            <Bullet>
              <strong className="text-foreground">Avec d&apos;autres chauffeurs :</strong> nom, téléphone et email
              visibles par les chauffeurs qui prennent ou publient des courses que vous gérez.
            </Bullet>
            <Bullet>
              <strong className="text-foreground">Prestataires :</strong> Supabase (base de données), Sentry (monitoring), etc.
            </Bullet>
            <Bullet>
              <strong className="text-foreground">Obligations légales :</strong> si requis par la loi ou une autorité judiciaire.
            </Bullet>
            <p className="text-sm leading-relaxed">Nous ne vendons jamais vos données à des tiers.</p>
          </Section>

          <Section title="5. Vos droits (RGPD)">
            <p className="text-sm leading-relaxed">Conformément au RGPD, vous disposez des droits suivants :</p>
            <Bullet><strong className="text-foreground">Droit d&apos;accès :</strong> obtenir une copie de vos données</Bullet>
            <Bullet><strong className="text-foreground">Droit de rectification :</strong> corriger vos données inexactes</Bullet>
            <Bullet><strong className="text-foreground">Droit à l&apos;effacement :</strong> supprimer votre compte et vos données</Bullet>
            <Bullet><strong className="text-foreground">Droit à la portabilité :</strong> exporter vos données</Bullet>
            <Bullet><strong className="text-foreground">Droit d&apos;opposition et de limitation</strong></Bullet>
            <p className="text-sm leading-relaxed mt-3">
              Pour exercer ces droits : dans l&apos;app, Profil → Paramètres → Confidentialité et données,
              ou contactez-nous à <a href="mailto:contact@getcorail.com" className="text-primary underline">contact@getcorail.com</a>.
            </p>
          </Section>

          <Section title="6. Conservation des données">
            <Bullet><strong className="text-foreground">Compte actif :</strong> données conservées tant que votre compte existe</Bullet>
            <Bullet><strong className="text-foreground">Compte supprimé :</strong> données anonymisées sous 30 jours (sauf obligations légales : 10 ans)</Bullet>
            <Bullet><strong className="text-foreground">Logs techniques :</strong> 12 mois maximum</Bullet>
          </Section>

          <Section title="7. Sécurité">
            <p className="text-sm leading-relaxed">Nous mettons en œuvre des mesures de sécurité :</p>
            <Bullet>Chiffrement des données en transit (HTTPS/TLS)</Bullet>
            <Bullet>Authentification sécurisée</Bullet>
            <Bullet>Row Level Security sur la base de données</Bullet>
            <Bullet>Accès restreint aux données internes</Bullet>
          </Section>

          <Section title="8. Cookies et tracking">
            <p className="text-sm leading-relaxed">
              Le site getcorail.com peut utiliser des cookies techniques et analytics (Vercel Analytics).
              L&apos;application mobile n&apos;utilise pas de cookies. Vous pouvez gérer les préférences dans les paramètres de votre navigateur ou de l&apos;app.
            </p>
          </Section>

          <Section title="9. Transferts internationaux">
            <p className="text-sm leading-relaxed">
              Vos données sont hébergées en Union Européenne (Supabase EU). Certains sous-traitants
              peuvent traiter des données hors UE avec des garanties appropriées (clauses contractuelles types).
            </p>
          </Section>

          <Section title="10. Modifications">
            <p className="text-sm leading-relaxed">
              Nous pouvons modifier cette politique. Vous serez notifié des changements importants
              via l&apos;application ou le site. La date de mise à jour est indiquée en haut de cette page.
            </p>
          </Section>

          <Section title="11. Contact">
            <p className="text-sm leading-relaxed">Pour toute question :</p>
            <Bullet>Email : <a href="mailto:contact@getcorail.com" className="text-primary underline">contact@getcorail.com</a></Bullet>
            <Bullet>DPO : <a href="mailto:contact@getcorail.com" className="text-primary underline">contact@getcorail.com</a></Bullet>
            <p className="text-sm leading-relaxed mt-3">
              Vous pouvez déposer une réclamation auprès de la CNIL :{" "}
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary underline">www.cnil.fr</a>.
            </p>
          </Section>

          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © 2026 Corail. Tous droits réservés.
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
