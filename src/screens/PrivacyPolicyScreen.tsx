/**
 * PrivacyPolicyScreen - Politique de confidentialité RGPD
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LegalScreen from './LegalScreen';

interface PrivacyPolicyScreenProps {
  onBack: () => void;
}

export default function PrivacyPolicyScreen({ onBack }: PrivacyPolicyScreenProps) {
  return (
    <LegalScreen
      onBack={onBack}
      title="Politique de confidentialité"
      content={<PrivacyPolicyContent />}
    />
  );
}

function PrivacyPolicyContent() {
  return (
    <View>
      <Text style={styles.lastUpdated}>Dernière mise à jour : 4 janvier 2026</Text>

      <Section title="1. Introduction">
        <Text style={styles.text}>
          Corail ("nous", "notre", "nos") s'engage à protéger et respecter votre vie privée. 
          Cette politique de confidentialité explique comment nous collectons, utilisons, partageons 
          et protégeons vos données personnelles lorsque vous utilisez notre application mobile.
        </Text>
        <Text style={styles.text}>
          Corail est un service de mise en relation entre chauffeurs VTC professionnels. 
          Nous ne sommes pas responsables du transport lui-même.
        </Text>
      </Section>

      <Section title="2. Données collectées">
        <Text style={styles.subtitle}>Données d'identification :</Text>
        <BulletPoint>Nom complet</BulletPoint>
        <BulletPoint>Adresse email</BulletPoint>
        <BulletPoint>Numéro de téléphone</BulletPoint>
        <BulletPoint>Numéro SIRET</BulletPoint>
        <BulletPoint>Numéro de carte VTC professionnelle</BulletPoint>
        <BulletPoint>Photo de profil (optionnelle)</BulletPoint>

        <Text style={styles.subtitle}>Données d'activité :</Text>
        <BulletPoint>Courses créées, publiées, prises et terminées</BulletPoint>
        <BulletPoint>Adresses de départ et d'arrivée des courses</BulletPoint>
        <BulletPoint>Historique des transactions de crédits</BulletPoint>
        <BulletPoint>Devis créés et partagés</BulletPoint>
        <BulletPoint>Groupes auxquels vous appartenez</BulletPoint>
        <BulletPoint>Badges et récompenses obtenus</BulletPoint>

        <Text style={styles.subtitle}>Données techniques :</Text>
        <BulletPoint>Modèle d'appareil et système d'exploitation</BulletPoint>
        <BulletPoint>Adresse IP</BulletPoint>
        <BulletPoint>Logs d'utilisation et d'erreurs</BulletPoint>
        <BulletPoint>Données de performance (analytics)</BulletPoint>
      </Section>

      <Section title="3. Utilisation des données">
        <Text style={styles.text}>Nous utilisons vos données pour :</Text>
        <BulletPoint>Créer et gérer votre compte</BulletPoint>
        <BulletPoint>Faciliter la mise en relation entre chauffeurs</BulletPoint>
        <BulletPoint>Traiter les paiements et crédits</BulletPoint>
        <BulletPoint>Envoyer des notifications importantes</BulletPoint>
        <BulletPoint>Améliorer nos services (analytics)</BulletPoint>
        <BulletPoint>Assurer la sécurité et prévenir la fraude</BulletPoint>
        <BulletPoint>Respecter nos obligations légales</BulletPoint>
      </Section>

      <Section title="4. Partage des données">
        <Text style={styles.text}>
          Vos données personnelles sont partagées uniquement dans les cas suivants :
        </Text>
        <BulletPoint>
          <Text style={styles.bold}>Avec d'autres chauffeurs :</Text> Votre nom, téléphone et email 
          sont visibles par les chauffeurs qui prennent ou publient des courses que vous gérez.
        </BulletPoint>
        <BulletPoint>
          <Text style={styles.bold}>Prestataires :</Text> hébergement, monitoring et outils nécessaires au fonctionnement du service.
        </BulletPoint>
        <BulletPoint>
          <Text style={styles.bold}>Obligations légales :</Text> Si requis par la loi ou une autorité judiciaire.
        </BulletPoint>
        <Text style={styles.text}>
          Nous ne vendons JAMAIS vos données à des tiers.
        </Text>
      </Section>

      <Section title="5. Vos droits (RGPD)">
        <Text style={styles.text}>Conformément au RGPD, vous disposez des droits suivants :</Text>
        <BulletPoint>
          <Text style={styles.bold}>Droit d'accès :</Text> Obtenir une copie de vos données
        </BulletPoint>
        <BulletPoint>
          <Text style={styles.bold}>Droit de rectification :</Text> Corriger vos données inexactes
        </BulletPoint>
        <BulletPoint>
          <Text style={styles.bold}>Droit à l'effacement :</Text> Supprimer votre compte et vos données
        </BulletPoint>
        <BulletPoint>
          <Text style={styles.bold}>Droit à la portabilité :</Text> Exporter vos données
        </BulletPoint>
        <BulletPoint>
          <Text style={styles.bold}>Droit d'opposition :</Text> Refuser certains traitements
        </BulletPoint>
        <BulletPoint>
          <Text style={styles.bold}>Droit de limitation :</Text> Restreindre l'utilisation de vos données
        </BulletPoint>
        
        <Text style={styles.text}>
          Pour exercer ces droits, rendez-vous dans Profil → Paramètres → Confidentialité et données, 
          ou contactez-nous à : <Text style={styles.link}>contact@getcorail.com</Text>
        </Text>
      </Section>

      <Section title="6. Conservation des données">
        <BulletPoint>
          <Text style={styles.bold}>Compte actif :</Text> Données conservées tant que votre compte existe
        </BulletPoint>
        <BulletPoint>
          <Text style={styles.bold}>Compte supprimé :</Text> Données anonymisées sous 30 jours 
          (sauf obligations légales comptables : 10 ans)
        </BulletPoint>
        <BulletPoint>
          <Text style={styles.bold}>Logs techniques :</Text> Conservés 12 mois maximum
        </BulletPoint>
      </Section>

      <Section title="7. Sécurité">
        <Text style={styles.text}>
          Nous mettons en œuvre des mesures de sécurité adaptées :
        </Text>
        <BulletPoint>Chiffrement des données en transit</BulletPoint>
        <BulletPoint>Authentification sécurisée</BulletPoint>
        <BulletPoint>Contrôle d'accès aux données</BulletPoint>
        <BulletPoint>Accès restreint aux données internes</BulletPoint>
      </Section>

      <Section title="8. Cookies et tracking">
        <Text style={styles.text}>
          Notre application mobile n'utilise PAS de cookies. Nous utilisons uniquement :
        </Text>
        <BulletPoint>Crash reporting pour corriger les bugs</BulletPoint>
        <Text style={styles.text}>
          Nous n'utilisons pas d'analytics à ce jour. Si nous en activons à l'avenir, 
          vous pourrez gérer vos préférences depuis Paramètres → Confidentialité et données.
        </Text>
      </Section>

      <Section title="9. Transferts internationaux">
        <Text style={styles.text}>
          Vos données sont hébergées en Union européenne. Certains sous-traitants
          peuvent traiter des données hors UE avec des garanties appropriées (clauses contractuelles types).
        </Text>
      </Section>

      <Section title="10. Modifications">
        <Text style={styles.text}>
          Nous pouvons modifier cette politique. Vous serez notifié des changements importants 
          via l'application. La date de mise à jour est indiquée en haut de cette page.
        </Text>
      </Section>

      <Section title="11. Contact">
        <Text style={styles.text}>
          Pour toute question concernant cette politique de confidentialité :
        </Text>
        <BulletPoint>Email : <Text style={styles.link}>contact@getcorail.com</Text></BulletPoint>
        <BulletPoint>DPO : <Text style={styles.link}>contact@getcorail.com</Text></BulletPoint>
        
        <Text style={styles.text}>
          Vous pouvez également déposer une réclamation auprès de la CNIL : 
          <Text style={styles.link}> www.cnil.fr</Text>
        </Text>
      </Section>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © 2026 Corail. Tous droits réservés.
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
  },
});

