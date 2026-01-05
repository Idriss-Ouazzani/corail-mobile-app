/**
 * TermsOfServiceScreen - Conditions Générales d'Utilisation
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LegalScreen from './LegalScreen';

interface TermsOfServiceScreenProps {
  onBack: () => void;
}

export default function TermsOfServiceScreen({ onBack }: TermsOfServiceScreenProps) {
  return (
    <LegalScreen
      onBack={onBack}
      title="Conditions d'utilisation"
      content={<TermsOfServiceContent />}
    />
  );
}

function TermsOfServiceContent() {
  return (
    <View>
      <Text style={styles.lastUpdated}>Dernière mise à jour : 4 janvier 2026</Text>

      <Section title="1. Présentation du service">
        <Text style={styles.text}>
          Corail VTC est une plateforme de mise en relation exclusivement réservée aux chauffeurs VTC professionnels. 
          Elle permet de :
        </Text>
        <BulletPoint>Publier des courses disponibles</BulletPoint>
        <BulletPoint>Prendre des courses publiées par d'autres chauffeurs</BulletPoint>
        <BulletPoint>Gérer vos courses personnelles</BulletPoint>
        <BulletPoint>Générer des devis clients</BulletPoint>
        <BulletPoint>Créer des groupes de chauffeurs</BulletPoint>
        
        <Text style={styles.important}>
          ⚠️ Important : Corail VTC est un service de mise en relation uniquement (modèle B2B). 
          Nous ne sommes PAS responsables de l'exécution du transport, du paiement entre chauffeurs 
          et clients finaux, ni des litiges qui en découlent.
        </Text>
      </Section>

      <Section title="2. Conditions d'accès">
        <Text style={styles.text}>Pour utiliser Corail VTC, vous devez :</Text>
        <BulletPoint>Être majeur(e) et professionnel(le) VTC</BulletPoint>
        <BulletPoint>Disposer d'une carte VTC valide</BulletPoint>
        <BulletPoint>Fournir un numéro SIREN valide</BulletPoint>
        <BulletPoint>Accepter ces conditions d'utilisation</BulletPoint>
        <BulletPoint>Fournir des informations exactes et à jour</BulletPoint>
        
        <Text style={styles.text}>
          Nous nous réservons le droit de vérifier votre statut professionnel et de refuser 
          ou suspendre votre compte en cas d'informations fausses ou incomplètes.
        </Text>
      </Section>

      <Section title="3. Création de compte">
        <BulletPoint>Vous êtes responsable de la confidentialité de votre mot de passe</BulletPoint>
        <BulletPoint>Un seul compte par personne physique</BulletPoint>
        <BulletPoint>Vous devez notifier immédiatement toute utilisation non autorisée</BulletPoint>
        <BulletPoint>Vous êtes responsable de toutes les activités sur votre compte</BulletPoint>
      </Section>

      <Section title="4. Système de crédits">
        <Text style={styles.subtitle}>Fonctionnement :</Text>
        <BulletPoint>Les crédits (C) sont la monnaie virtuelle de Corail VTC</BulletPoint>
        <BulletPoint>Publier une course = +1 crédit</BulletPoint>
        <BulletPoint>Prendre une course = -1 crédit</BulletPoint>
        <BulletPoint>Les crédits sont achetables via l'application</BulletPoint>
        
        <Text style={styles.subtitle}>Conditions :</Text>
        <BulletPoint>Les crédits ne sont ni remboursables ni échangeables contre de l'argent</BulletPoint>
        <BulletPoint>Ils ne peuvent pas être transférés entre utilisateurs</BulletPoint>
        <BulletPoint>En cas de fermeture de compte, les crédits restants sont perdus</BulletPoint>
        <BulletPoint>Nous nous réservons le droit de modifier le système de crédits avec préavis</BulletPoint>
      </Section>

      <Section title="5. Publication et prise de courses">
        <Text style={styles.subtitle}>En publiant une course, vous vous engagez à :</Text>
        <BulletPoint>Fournir des informations exactes (adresses, horaires, tarifs)</BulletPoint>
        <BulletPoint>Honorer la course si elle est prise par un autre chauffeur</BulletPoint>
        <BulletPoint>Communiquer avec le preneur de course de manière professionnelle</BulletPoint>
        
        <Text style={styles.subtitle}>En prenant une course, vous vous engagez à :</Text>
        <BulletPoint>Réaliser le transport aux conditions indiquées</BulletPoint>
        <BulletPoint>Contacter le créateur de la course rapidement</BulletPoint>
        <BulletPoint>Marquer la course comme terminée une fois effectuée</BulletPoint>
        
        <Text style={styles.important}>
          ⚠️ Le paiement du service de transport s'effectue ENTRE CHAUFFEURS (ou entre chauffeur et client final). 
          Corail VTC n'intervient PAS dans les transactions financières liées au transport.
        </Text>
      </Section>

      <Section title="6. Comportement et sanctions">
        <Text style={styles.text}>Les comportements suivants sont strictement interdits :</Text>
        <BulletPoint>Publier de fausses courses</BulletPoint>
        <BulletPoint>Ne pas honorer une course prise</BulletPoint>
        <BulletPoint>Comportement abusif, harcèlement, discrimination</BulletPoint>
        <BulletPoint>Création de faux comptes</BulletPoint>
        <BulletPoint>Manipulation du système de crédits</BulletPoint>
        <BulletPoint>Utilisation de l'app à des fins illégales</BulletPoint>
        
        <Text style={styles.text}>
          <Text style={styles.bold}>Sanctions :</Text> Avertissement, suspension temporaire, 
          bannissement définitif selon la gravité.
        </Text>
      </Section>

      <Section title="7. Propriété intellectuelle">
        <Text style={styles.text}>
          Tous les éléments de l'application (logo, design, code, textes) sont la propriété 
          exclusive de Corail VTC. Toute reproduction ou utilisation sans autorisation est interdite.
        </Text>
        <BulletPoint>Vous conservez la propriété de vos données (courses, profil, etc.)</BulletPoint>
        <BulletPoint>
          Vous nous accordez une licence pour utiliser vos données dans le cadre du service
        </BulletPoint>
      </Section>

      <Section title="8. Responsabilités et garanties">
        <Text style={styles.subtitle}>Responsabilité de Corail VTC :</Text>
        <BulletPoint>Nous fournissons la plateforme "en l'état"</BulletPoint>
        <BulletPoint>Nous ne garantissons pas une disponibilité 24/7</BulletPoint>
        <BulletPoint>
          Nous ne sommes PAS responsables des litiges entre chauffeurs ou avec les clients finaux
        </BulletPoint>
        <BulletPoint>
          Nous ne sommes PAS responsables des pertes financières liées à l'utilisation de l'app
        </BulletPoint>
        
        <Text style={styles.subtitle}>Votre responsabilité :</Text>
        <BulletPoint>Vous êtes responsable de vos publications et transactions</BulletPoint>
        <BulletPoint>Vous devez disposer des assurances professionnelles obligatoires</BulletPoint>
        <BulletPoint>Vous êtes responsable du respect du code des transports</BulletPoint>
      </Section>

      <Section title="9. Suspension et résiliation">
        <Text style={styles.subtitle}>Nous pouvons suspendre ou résilier votre compte :</Text>
        <BulletPoint>En cas de violation de ces CGU</BulletPoint>
        <BulletPoint>En cas de fraude ou comportement abusif</BulletPoint>
        <BulletPoint>Si votre carte VTC n'est plus valide</BulletPoint>
        <BulletPoint>Pour des raisons de sécurité</BulletPoint>
        
        <Text style={styles.subtitle}>Vous pouvez résilier votre compte à tout moment :</Text>
        <BulletPoint>Via Profil → Paramètres → Supprimer mon compte</BulletPoint>
        <BulletPoint>Les crédits restants seront perdus</BulletPoint>
        <BulletPoint>Vos données seront supprimées sous 30 jours (sauf obligations légales)</BulletPoint>
      </Section>

      <Section title="10. Modifications des CGU">
        <Text style={styles.text}>
          Nous pouvons modifier ces CGU à tout moment. Les modifications importantes vous seront 
          notifiées via l'application. Continuer à utiliser Corail VTC après modification 
          vaut acceptation des nouvelles conditions.
        </Text>
      </Section>

      <Section title="11. Droit applicable et litiges">
        <Text style={styles.text}>
          Ces CGU sont régies par le droit français. En cas de litige, une solution amiable sera 
          recherchée en priorité. À défaut, les tribunaux français seront compétents.
        </Text>
        <BulletPoint>Médiation : <Text style={styles.link}>mediateur@corail.app</Text></BulletPoint>
        <BulletPoint>Plateforme européenne de règlement en ligne : <Text style={styles.link}>ec.europa.eu/odr</Text></BulletPoint>
      </Section>

      <Section title="12. Contact">
        <Text style={styles.text}>Pour toute question sur ces conditions :</Text>
        <BulletPoint>Email : <Text style={styles.link}>legal@corail.app</Text></BulletPoint>
        <BulletPoint>Support : Dans l'app, onglet Profil → Aide & Support</BulletPoint>
        <BulletPoint>Adresse : Corail VTC, [Adresse complète à compléter]</BulletPoint>
      </Section>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          En utilisant Corail VTC, vous acceptez ces conditions d'utilisation.
        </Text>
        <Text style={styles.footerText}>
          © 2026 Corail VTC. Tous droits réservés.
        </Text>
      </View>
    </View>
  );
}

// Composants utilitaires
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function BulletPoint({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bulletPoint}>
      <Text style={styles.bullet}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lastUpdated: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#cbd5e1',
    marginTop: 12,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
    color: '#cbd5e1',
    marginBottom: 12,
  },
  bold: {
    fontWeight: '700',
    color: '#e2e8f0',
  },
  link: {
    color: '#6366f1',
    textDecorationLine: 'underline',
  },
  important: {
    fontSize: 14,
    lineHeight: 22,
    color: '#fbbf24',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#fbbf24',
    marginTop: 12,
    marginBottom: 12,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  bullet: {
    fontSize: 14,
    color: '#6366f1',
    marginRight: 12,
    fontWeight: '700',
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: '#cbd5e1',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
    textAlign: 'center',
  },
});

