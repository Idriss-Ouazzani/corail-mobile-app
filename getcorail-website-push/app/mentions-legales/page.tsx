import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ChevronLeft } from "lucide-react";

export const metadata = {
  title: "Mentions légales | Corail",
  description: "Mentions légales du site getcorail.com et du service Corail VTC.",
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

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3">
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      <p className="text-sm text-foreground/90 whitespace-pre-line">{value}</p>
    </div>
  );
}

export default function MentionsLegalesPage() {
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
          Mentions légales
        </h1>
        <p className="text-sm text-muted-foreground italic mb-10">
          Dernière mise à jour : 4 janvier 2026
        </p>

        <div className="prose prose-invert max-w-none text-foreground/80">
          <Section title="1. Éditeur du site et du service">
            <InfoBlock label="Nom du projet" value="Corail" />
            <InfoBlock label="Site web" value="https://getcorail.com" />
            <InfoBlock label="Contact" value="contact@getcorail.com" />
            <p className="text-sm leading-relaxed italic text-muted-foreground mt-4">
              Ce site et l&apos;application sont actuellement exploités en phase de test. Les informations
              légales complètes (forme juridique, SIREN, SIRET, siège social, directeur de publication)
              seront publiées dès l&apos;immatriculation de l&apos;éditeur.
            </p>
          </Section>

          <Section title="2. Hébergement">
            <p className="text-sm font-medium text-foreground/90">Site web getcorail.com :</p>
            <InfoBlock
              label="Hébergeur"
              value="Vercel Inc.\n340 S Lemon Ave #4133\nWalnut, CA 91789, USA\nwww.vercel.com"
            />
            <p className="text-sm font-medium text-foreground/90 mt-4">Base de données et backend :</p>
            <InfoBlock
              label="Hébergeur"
              value="Supabase Inc.\nServeurs situés en Union Européenne\nwww.supabase.com"
            />
          </Section>

          <Section title="3. Propriété intellectuelle">
            <p className="text-sm leading-relaxed">
              L&apos;ensemble de ce site et de l&apos;application (design, code source, logo, marque &quot;Corail&quot;,
              textes, images) est la propriété exclusive de Corail et est protégé par le droit français
              et international sur la propriété intellectuelle.
            </p>
            <p className="text-sm leading-relaxed">
              Toute reproduction, représentation, modification, publication, adaptation de tout ou partie
              des éléments du site ou de l&apos;application, quel que soit le moyen ou le procédé utilisé,
              est interdite, sauf autorisation écrite préalable.
            </p>
          </Section>

          <Section title="4. Protection des données personnelles">
            <p className="text-sm leading-relaxed">
              Conformément au RGPD et à la loi Informatique et Libertés, vous disposez de droits sur
              vos données personnelles.
            </p>
            <InfoBlock label="Responsable de traitement" value="Corail" />
            <InfoBlock label="Délégué à la protection des données (DPO)" value="contact@getcorail.com" />
            <InfoBlock
              label="Finalité des traitements"
              value="Gestion des comptes, mise en relation entre chauffeurs et clients, support"
            />
            <p className="text-sm leading-relaxed mt-3">
              Pour plus d&apos;informations, consultez notre{" "}
              <Link href="/confidentialite" className="text-primary underline">Politique de confidentialité</Link>.
            </p>
            <p className="text-sm leading-relaxed">
              <strong className="text-foreground">Vos droits :</strong> accès, rectification, effacement, portabilité,
              limitation, opposition. Contact : <a href="mailto:contact@getcorail.com" className="text-primary underline">contact@getcorail.com</a>.
            </p>
            <p className="text-sm leading-relaxed">
              Réclamation : CNIL — <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary underline">www.cnil.fr</a>.
            </p>
          </Section>

          <Section title="5. Cookies et traceurs">
            <p className="text-sm leading-relaxed">
              Le site getcorail.com peut utiliser des cookies techniques et des analytics (Vercel Analytics).
              L&apos;application mobile n&apos;utilise pas de cookies. Vous pouvez gérer vos préférences dans
              les paramètres de votre navigateur.
            </p>
          </Section>

          <Section title="6. Législation applicable">
            <p className="text-sm leading-relaxed">
              Les présentes mentions légales sont régies par le droit français. En cas de litige,
              les tribunaux français seront compétents.
            </p>
            <Bullet>Loi pour la confiance dans l&apos;économie numérique (LCEN) du 21 juin 2004</Bullet>
            <Bullet>Règlement Général sur la Protection des Données (RGPD)</Bullet>
            <Bullet>Loi Informatique et Libertés modifiée</Bullet>
            <Bullet>Code des transports (activité VTC)</Bullet>
          </Section>

          <Section title="7. Limitation de responsabilité">
            <p className="text-sm leading-relaxed">
              Corail s&apos;efforce d&apos;assurer l&apos;exactitude et la mise à jour des informations diffusées,
              mais ne peut garantir l&apos;exactitude, la précision ou l&apos;exhaustivité de ces informations.
            </p>
            <p className="text-sm leading-relaxed">Corail ne saurait être tenue responsable :</p>
            <Bullet>Des interruptions de service (maintenance, pannes, cas de force majeure)</Bullet>
            <Bullet>Des dommages directs ou indirects résultant de l&apos;utilisation du site ou de l&apos;app</Bullet>
            <Bullet>Des litiges entre utilisateurs ou avec des tiers</Bullet>
            <Bullet>Des pertes de données en cas de problème technique</Bullet>
          </Section>

          <Section title="8. Contact">
            <p className="text-sm leading-relaxed">Pour toute question concernant ces mentions légales :</p>
            <InfoBlock label="Email général" value="contact@getcorail.com" />
            <InfoBlock label="Support technique" value="contact@getcorail.com" />
            <InfoBlock label="Questions juridiques" value="contact@getcorail.com" />
            <InfoBlock label="Protection des données" value="contact@getcorail.com" />
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
