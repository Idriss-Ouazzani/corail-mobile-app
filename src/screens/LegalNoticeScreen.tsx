/**
 * LegalNoticeScreen - Mentions Légales
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LegalScreen from './LegalScreen';

interface LegalNoticeScreenProps {
  onBack: () => void;
}

export default function LegalNoticeScreen({ onBack }: LegalNoticeScreenProps) {
  return (
    <LegalScreen
      onBack={onBack}
      title="Mentions légales"
      content={<LegalNoticeContent />}
    />
  );
}

function LegalNoticeContent() {
  return (
    <View>
      <Text style={styles.lastUpdated}>Dernière mise à jour : 4 janvier 2026</Text>

      <Section title="1. Éditeur de l'application">
        <InfoBlock label="Nom du projet" value="Corail VTC" />
        <InfoBlock label="Contact" value="contact@corail.app" />
        <Text style={styles.disclaimer}>
          Cette application est actuellement exploitée en phase de test, sans activité commerciale et sans structure juridique immatriculée. Les informations légales complètes (forme juridique, SIREN, SIRET, siège social, directeur de publication) seront publiées dès l'immatriculation de l'éditeur (micro-entreprise, société, etc.). En l'état, aucun revenu n'est généré par ce service.
        </Text>
      </Section>

      <Section title="2. Hébergement">
        <Text style={styles.subtitle}>Application mobile :</Text>
        <InfoBlock 
          label="Hébergeur" 
          value="Expo (Vercel Inc.)\n340 S Lemon Ave #4133\nWalnut, CA 91789, USA" 
        />
        
        <Text style={styles.subtitle}>Base de données :</Text>
        <InfoBlock 
          label="Hébergeur" 
          value="Supabase Inc.\nServeurs situés en Union Européenne\nwww.supabase.com" 
        />
        
        <Text style={styles.subtitle}>Authentification :</Text>
        <InfoBlock 
          label="Hébergeur" 
          value="Google Firebase\nGoogle LLC, 1600 Amphitheatre Parkway\nMountain View, CA 94043, USA" 
        />

        <Text style={styles.subtitle}>Site web (devis et profils publics) :</Text>
        <InfoBlock 
          label="Hébergeur" 
          value="Vercel Inc.\n340 S Lemon Ave #4133\nWalnut, CA 91789, USA\nwww.vercel.com" 
        />
      </Section>

      <Section title="3. Propriété intellectuelle">
        <Text style={styles.text}>
          L'ensemble de cette application (design, code source, logo, marque "Corail VTC", 
          textes, images) est la propriété exclusive de Corail VTC et est protégé par le 
          droit français et international sur la propriété intellectuelle.
        </Text>
        <Text style={styles.text}>
          Toute reproduction, représentation, modification, publication, adaptation de tout 
          ou partie des éléments de l'application, quel que soit le moyen ou le procédé utilisé, 
          est interdite, sauf autorisation écrite préalable.
        </Text>
        <Text style={styles.text}>
          La marque "Corail VTC" est une marque déposée. Toute utilisation non autorisée 
          constitue une contrefaçon passible de sanctions pénales.
        </Text>
      </Section>

      <Section title="4. Protection des données personnelles">
        <Text style={styles.text}>
          Conformément au Règlement Général sur la Protection des Données (RGPD) et à la 
          loi Informatique et Libertés, vous disposez de droits sur vos données personnelles.
        </Text>
        <InfoBlock label="Responsable de traitement" value="Corail VTC" />
        <InfoBlock label="Délégué à la protection des données (DPO)" value="dpo@corail.app" />
        <InfoBlock 
          label="Finalité des traitements" 
          value="Gestion des comptes, mise en relation entre chauffeurs, facturation, support client" 
        />
        <InfoBlock label="Base légale" value="Exécution du contrat, intérêt légitime, consentement" />
        <InfoBlock 
          label="Destinataires des données" 
          value="Personnel habilité de Corail VTC, sous-traitants (Firebase, Supabase, Stripe, Sentry)" 
        />
        <InfoBlock label="Durée de conservation" value="Durée du compte + 30 jours après suppression (sauf obligations légales comptables)" />
        
        <Text style={styles.text}>
          Pour plus d'informations, consultez notre <Text style={styles.link}>Politique de confidentialité</Text>.
        </Text>
        
        <Text style={styles.text}>
          <Text style={styles.bold}>Vos droits :</Text> accès, rectification, effacement, portabilité, 
          limitation, opposition. Contact : <Text style={styles.link}>privacy@corail.app</Text>
        </Text>
        
        <Text style={styles.text}>
          Vous pouvez déposer une réclamation auprès de la CNIL : www.cnil.fr
        </Text>
      </Section>

      <Section title="5. Cookies et traceurs">
        <Text style={styles.text}>
          L'application mobile Corail VTC n'utilise PAS de cookies. En revanche, nous utilisons :
        </Text>
        <BulletPoint>
          <Text style={styles.bold}>Analytics :</Text> Firebase Analytics pour mesurer l'usage 
          de l'app (données anonymisées)
        </BulletPoint>
        <BulletPoint>
          <Text style={styles.bold}>Monitoring :</Text> Sentry pour détecter et corriger les bugs
        </BulletPoint>
        
        <Text style={styles.text}>
          Vous pouvez désactiver l'analytics dans Paramètres → Confidentialité et données.
        </Text>
      </Section>

      <Section title="6. Crédits et technologies">
        <Text style={styles.subtitle}>Technologies utilisées :</Text>
        <BulletPoint>React Native & Expo (framework mobile)</BulletPoint>
        <BulletPoint>TypeScript (langage de programmation)</BulletPoint>
        <BulletPoint>Firebase (authentification)</BulletPoint>
        <BulletPoint>Supabase (base de données PostgreSQL)</BulletPoint>
        <BulletPoint>Stripe (paiements)</BulletPoint>
        <BulletPoint>Next.js (site web devis)</BulletPoint>
        <BulletPoint>API Adresse Gouv & Nominatim (recherche d'adresses)</BulletPoint>
        <BulletPoint>OSRM (calcul d'itinéraires)</BulletPoint>
        
        <Text style={styles.subtitle}>Icônes et design :</Text>
        <BulletPoint>Ionicons (icônes)</BulletPoint>
        <BulletPoint>Expo Vector Icons</BulletPoint>
        <BulletPoint>Design original Corail VTC</BulletPoint>
      </Section>

      <Section title="7. Législation applicable">
        <Text style={styles.text}>
          Les présentes mentions légales sont régies par le droit français. En cas de litige, 
          les tribunaux français seront compétents.
        </Text>
        <BulletPoint>
          <Text style={styles.bold}>Loi pour la confiance dans l'économie numérique (LCEN)</Text> du 21 juin 2004
        </BulletPoint>
        <BulletPoint>
          <Text style={styles.bold}>Règlement Général sur la Protection des Données (RGPD)</Text> du 27 avril 2016
        </BulletPoint>
        <BulletPoint>
          <Text style={styles.bold}>Loi Informatique et Libertés</Text> du 6 janvier 1978 modifiée
        </BulletPoint>
        <BulletPoint>
          <Text style={styles.bold}>Code des transports</Text> (activité VTC)
        </BulletPoint>
      </Section>

      <Section title="8. Limitation de responsabilité">
        <Text style={styles.text}>
          Corail VTC s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées, 
          mais ne peut garantir l'exactitude, la précision ou l'exhaustivité de ces informations.
        </Text>
        <Text style={styles.text}>
          Corail VTC ne saurait être tenue responsable :
        </Text>
        <BulletPoint>Des interruptions de service (maintenance, pannes, cas de force majeure)</BulletPoint>
        <BulletPoint>Des dommages directs ou indirects résultant de l'utilisation de l'application</BulletPoint>
        <BulletPoint>
          Des litiges entre utilisateurs ou avec des tiers (clients finaux, autres chauffeurs)
        </BulletPoint>
        <BulletPoint>Des pertes de données en cas de problème technique</BulletPoint>
        <BulletPoint>De l'utilisation frauduleuse ou abusive de l'application par des tiers</BulletPoint>
      </Section>

      <Section title="9. Contact">
        <Text style={styles.text}>Pour toute question concernant ces mentions légales :</Text>
        <InfoBlock label="Email général" value="contact@corail.app" />
        <InfoBlock label="Support technique" value="support@corail.app" />
        <InfoBlock label="Questions juridiques" value="legal@corail.app" />
        <InfoBlock label="Protection des données" value="privacy@corail.app" />
        <InfoBlock label="Signalement d'abus" value="abuse@corail.app" />
      </Section>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © 2026 Corail VTC. Tous droits réservés.
        </Text>
        <Text style={styles.footerText}>
          Version de l'application : 1.0.0
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

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoBlock}>
      <Text style={styles.infoLabel}>{label} :</Text>
      <Text style={styles.infoValue}>{value}</Text>
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
  disclaimer: {
    fontSize: 14,
    lineHeight: 22,
    color: '#94a3b8',
    marginTop: 8,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  bold: {
    fontWeight: '700',
    color: '#e2e8f0',
  },
  link: {
    color: '#6366f1',
    textDecorationLine: 'underline',
  },
  infoBlock: {
    marginBottom: 12,
    paddingLeft: 8,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    lineHeight: 20,
    color: '#e2e8f0',
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



