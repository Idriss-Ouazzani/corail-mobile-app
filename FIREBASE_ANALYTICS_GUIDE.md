# 📊 Firebase Analytics - Guide Complet Corail

**100% GRATUIT et ILLIMITÉ ! 🎉**

---

## 🎯 Pourquoi Firebase Analytics ?

### ✅ Avantages

- **Gratuit à vie** - Aucune limite d'événements
- **Dashboard Google Analytics 4** - Insights puissants
- **Intégration native** - Déjà dans Firebase
- **Événements automatiques** - `first_open`, `session_start`, etc.
- **Export BigQuery** - Analyses avancées (gratuit)
- **+3 points** sur la roadmap Top 1% !

### 📊 Ce qu'on track

**25+ événements business :**
- ✅ Courses (published, claimed, completed, deleted)
- ✅ Courses personnelles (created)
- ✅ Devis (created, sent, accepted)
- ✅ Crédits (earned, spent)
- ✅ Badges (earned)
- ✅ Groupes (created, invitation sent/accepted)
- ✅ Navigation (screen views)
- ✅ Actions UX (QR code shared, filters applied, search)

---

## 🚀 Installation (DÉJÀ FAIT ✅)

```bash
npm install @react-native-firebase/analytics
```

---

## 📁 Architecture

```
src/
├── services/
│   └── analytics.ts          ✅ Service principal (25+ fonctions)
├── contexts/
│   └── AuthContext.tsx        ✅ User properties tracking
└── App.tsx                    ✅ Événements business + screens
```

---

## 🎯 Événements Trackés

### 1️⃣ Rides (Courses Marketplace)

#### `ride_published` - Course publiée
```typescript
await analytics.trackRidePublished({
  rideId: 'ride_123',
  visibility: 'PUBLIC',
  vehicleType: 'STANDARD',
  priceCents: 5000,
  distanceKm: 50,
  creditsEarned: 1,
});
```

**Propriétés :**
- `ride_id` (string)
- `visibility` (PUBLIC | GROUP | PERSONAL)
- `vehicle_type` (STANDARD | ELECTRIC | VAN | PREMIUM | LUXURY)
- `price_cents` (number)
- `price_eur` (number) - Calculé automatiquement
- `distance_km` (number)
- `credits_earned` (number)

---

#### `ride_claimed` - Course réclamée
```typescript
await analytics.trackRideClaimed({
  rideId: 'ride_123',
  visibility: 'PUBLIC',
  priceCents: 5000,
  creditsSpent: 1,
  timeToClaimSeconds: 120, // Temps entre publication et claim
});
```

**Propriétés :**
- `ride_id` (string)
- `visibility` (string)
- `price_cents` (number)
- `price_eur` (number)
- `credits_spent` (number)
- `time_to_claim_seconds` (number) - **Métrique clé !**

---

#### `ride_completed` - Course terminée
```typescript
await analytics.trackRideCompleted({
  rideId: 'ride_123',
  priceCents: 5000,
  distanceKm: 50,
  durationMinutes: 60,
  bonusEarned: 1,
});
```

**Propriétés :**
- `ride_id` (string)
- `price_cents` (number)
- `price_eur` (number)
- `distance_km` (number)
- `duration_minutes` (number)
- `bonus_earned` (number)

---

#### `ride_deleted` - Course supprimée
```typescript
await analytics.trackRideDeleted({
  rideId: 'ride_123',
  visibility: 'PUBLIC',
  reason: 'user_action',
});
```

---

### 2️⃣ Personal Rides (Courses Personnelles)

#### `personal_ride_created` - Course personnelle créée
```typescript
await analytics.trackPersonalRideCreated({
  rideId: 'personal_123',
  source: 'UBER',
  priceCents: 5000,
  hasQuote: true,
});
```

**Propriétés :**
- `ride_id` (string)
- `source` (UBER | BOLT | HEETCH | OTHER)
- `price_cents` (number)
- `price_eur` (number)
- `has_quote` (boolean)

---

### 3️⃣ Quotes (Devis)

#### `quote_created` - Devis créé
```typescript
await analytics.trackQuoteCreated({
  quoteId: 'quote_123',
  priceCents: 5000,
  distanceKm: 50,
});
```

#### `quote_sent` - Devis envoyé
```typescript
await analytics.trackQuoteSent({
  quoteId: 'quote_123',
  method: 'whatsapp', // whatsapp | sms | email
});
```

#### `quote_accepted` - Devis accepté
```typescript
await analytics.trackQuoteAccepted({
  quoteId: 'quote_123',
  priceCents: 5000,
});
```

---

### 4️⃣ Credits & Badges

#### `credit_earned` - Crédit gagné
```typescript
await analytics.trackCreditEarned({
  amount: 1,
  reason: 'ride_published', // ride_published | ride_completed | bonus
  newBalance: 5,
});
```

#### `credit_spent` - Crédit dépensé
```typescript
await analytics.trackCreditSpent({
  amount: 1,
  reason: 'ride_claimed',
  newBalance: 4,
});
```

#### `badge_earned` - Badge débloqué
```typescript
await analytics.trackBadgeEarned({
  badgeId: 'badge_123',
  badgeName: 'Premier Pas',
  rarity: 'COMMON',
});
```

---

### 5️⃣ Groups (Groupes)

#### `group_created` - Groupe créé
```typescript
await analytics.trackGroupCreated({
  groupId: 'group_123',
  groupName: 'VTC Paris',
});
```

#### `invitation_sent` - Invitation envoyée
```typescript
await analytics.trackInvitationSent({
  groupId: 'group_123',
  method: 'email', // email | phone
});
```

#### `invitation_accepted` - Invitation acceptée
```typescript
await analytics.trackInvitationAccepted({
  groupId: 'group_123',
});
```

---

### 6️⃣ Navigation & UX

#### `screen_view` - Changement d'écran (AUTOMATIQUE)
```typescript
await analytics.trackScreenView('Dashboard', 'DashboardScreen');
```

**Screens trackés automatiquement :**
- Dashboard
- Courses (Marketplace + My Rides + History)
- Tools
- Profile

---

#### `qr_code_shared` - QR Code partagé
```typescript
await analytics.trackQRCodeShared();
```

#### `filters_applied` - Filtres appliqués
```typescript
await analytics.trackFiltersApplied({
  vehicleTypes: ['STANDARD', 'ELECTRIC'],
  priceRange: [1000, 10000],
  dateRange: ['2024-01-01', '2024-01-31'],
});
```

#### `search` - Recherche effectuée
```typescript
await analytics.trackSearch({
  searchTerm: 'Paris',
  category: 'rides',
  resultsCount: 12,
});
```

---

### 7️⃣ User Properties (Propriétés Utilisateur)

**Définies au login :**
```typescript
await analytics.setUserProperties({
  userId: 'user_123',
  isAdmin: false,
  verificationStatus: 'VERIFIED',
  totalCredits: 5,
});
```

**Propriétés trackées :**
- `is_admin` (true | false)
- `verification_status` (UNVERIFIED | PENDING | VERIFIED)
- `total_credits` (number)

**Nettoyées au logout :**
```typescript
await analytics.clearUserProperties();
```

---

## 📈 Dashboard Analytics

### Accès au Dashboard

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet Corail
3. Menu **Analytics** → **Dashboard**

### Événements en Temps Réel

**Analytics → DebugView** (mode dev uniquement)

Voir les événements en temps réel pendant le développement.

---

### Rapports Disponibles (Gratuits)

#### 1. **Overview** - Vue d'ensemble
- Utilisateurs actifs (jour/semaine/mois)
- Sessions
- Durée moyenne session
- Taux de rétention

#### 2. **Events** - Événements
- Top événements
- Fréquence
- Valeurs moyennes
- Tendances

#### 3. **Conversions** - Conversions
- Funnels personnalisés
- Taux de conversion
- Abandons

#### 4. **Audiences** - Audiences
- Démographie (âge, sexe)
- Localisation (pays, villes)
- Appareils (modèles, OS)
- Langue

#### 5. **User Properties** - Propriétés
- Répartition par propriété
- Comparaisons
- Segments

---

## 🎯 Insights Business Clés

### 1. **Santé du Marketplace**

**Questions :**
- Combien de courses publiées / jour ?
- Quel % de courses sont claimed ?
- Temps moyen avant qu'une course soit prise ?
- Taux de complétion des courses ?

**Événements à analyser :**
```
ride_published → ride_claimed → ride_completed
```

**Métriques :**
- `time_to_claim_seconds` - Vitesse du marketplace
- Taux conversion `published → claimed` - Attractivité
- Taux conversion `claimed → completed` - Fiabilité

---

### 2. **Engagement Utilisateurs**

**Questions :**
- Combien d'utilisateurs actifs / jour ?
- Taux de rétention à 7 jours ?
- Combien de sessions / utilisateur ?
- Durée moyenne session ?

**Événements automatiques :**
- `session_start`
- `user_engagement`
- `first_open`

---

### 3. **Économie Crédits**

**Questions :**
- Combien de crédits gagnés / jour ?
- Combien de crédits dépensés / jour ?
- Balance moyenne par utilisateur ?
- Taux d'utilisation des crédits ?

**Événements à analyser :**
```
credit_earned (reason: ride_published)
credit_earned (reason: ride_completed)
credit_spent (reason: ride_claimed)
```

---

### 4. **Adoption Features**

**Questions :**
- Combien de devis créés / jour ?
- Taux d'acceptation des devis ?
- Combien de courses personnelles créées ?
- Adoption des groupes ?

**Événements à analyser :**
```
quote_created → quote_sent → quote_accepted
personal_ride_created
group_created → invitation_sent → invitation_accepted
```

---

### 5. **Comportement Navigation**

**Questions :**
- Quels écrans sont les plus consultés ?
- Parcours utilisateur typique ?
- Où les utilisateurs décrochent ?

**Événements à analyser :**
```
screen_view (screen_name)
```

**Funnels à créer :**
```
Dashboard → Courses → RideDetail → Claim
Dashboard → Tools → CreateQuote → QuoteSent
```

---

## 🔧 Configuration Avancée

### Désactiver Analytics (RGPD)

```typescript
import analytics from './src/services/analytics';

// Désactiver
await analytics.setAnalyticsEnabled(false);

// Réactiver
await analytics.setAnalyticsEnabled(true);
```

---

### Reset Analytics Data (Testing)

```typescript
await analytics.resetAnalyticsData();
```

---

### Debug Mode (Dev)

Analytics est **désactivé en dev** par défaut pour ne pas polluer les stats.

Pour activer en dev, modifiez `src/services/analytics.ts` :

```typescript
const ENABLED = true; // Au lieu de !__DEV__
```

---

## 📊 Exemples de Rapports Personnalisés

### 1. **Funnel Marketplace**

**Objectif :** Mesurer le taux de conversion du marketplace

**Étapes :**
1. `ride_published` - Course publiée
2. `ride_claimed` - Course réclamée
3. `ride_completed` - Course terminée

**Métriques :**
- Taux conversion étape 1 → 2 : **% de courses claimed**
- Taux conversion étape 2 → 3 : **% de courses complétées**
- Temps moyen étape 1 → 2 : **Vitesse du marketplace**

---

### 2. **Engagement Crédits**

**Objectif :** Comprendre l'économie des crédits

**Événements :**
- `credit_earned` (reason: ride_published)
- `credit_earned` (reason: ride_completed)
- `credit_spent` (reason: ride_claimed)

**Métriques :**
- Crédits gagnés / jour
- Crédits dépensés / jour
- Balance moyenne
- Taux d'utilisation (spent / earned)

---

### 3. **Adoption Devis**

**Objectif :** Mesurer le succès de la feature devis

**Funnel :**
1. `quote_created` - Devis créé
2. `quote_sent` - Devis envoyé
3. `quote_accepted` - Devis accepté

**Métriques :**
- Nombre devis / jour
- Taux d'envoi (sent / created)
- Taux d'acceptation (accepted / sent)
- Méthode d'envoi préférée (whatsapp vs sms vs email)

---

### 4. **Rétention Utilisateurs**

**Objectif :** Mesurer la fidélité des utilisateurs

**Événements automatiques :**
- `first_open` - Première ouverture
- `session_start` - Début session
- `user_engagement` - Engagement

**Métriques :**
- Rétention J+1, J+7, J+30
- Sessions / utilisateur
- Durée moyenne session
- Taux de churn

---

## 🎯 KPIs Recommandés

### 📊 Tableau de Bord Corail

| Métrique | Objectif | Source |
|----------|----------|--------|
| **Utilisateurs actifs / jour** | 50+ | `session_start` |
| **Courses publiées / jour** | 20+ | `ride_published` |
| **Taux de claim** | 80%+ | `ride_claimed / ride_published` |
| **Temps moyen claim** | < 2h | `time_to_claim_seconds` |
| **Taux de complétion** | 95%+ | `ride_completed / ride_claimed` |
| **Rétention J+7** | 40%+ | Automatique |
| **Sessions / utilisateur** | 3+ | Automatique |
| **Devis créés / jour** | 5+ | `quote_created` |
| **Taux acceptation devis** | 60%+ | `quote_accepted / quote_sent` |

---

## 🚀 Prochaines Étapes

### 1. **Créer des Funnels Personnalisés**

Firebase Console → Analytics → Conversions → Create Funnel

**Funnels recommandés :**
- Marketplace: `ride_published → ride_claimed → ride_completed`
- Devis: `quote_created → quote_sent → quote_accepted`
- Onboarding: `first_open → screen_view(Dashboard) → ride_published`

---

### 2. **Configurer des Alertes**

Firebase Console → Analytics → Custom Definitions → Create Alert

**Alertes recommandées :**
- Baisse soudaine de `ride_published` (-20% vs hier)
- Augmentation du temps `time_to_claim_seconds` (+50% vs moyenne)
- Taux de claim < 50%

---

### 3. **Export BigQuery (Gratuit)**

Firebase Console → Project Settings → Integrations → BigQuery

**Analyses SQL avancées :**
```sql
-- Top 10 utilisateurs par courses publiées
SELECT
  user_id,
  COUNT(*) as total_rides
FROM `analytics_events`
WHERE event_name = 'ride_published'
GROUP BY user_id
ORDER BY total_rides DESC
LIMIT 10;
```

---

### 4. **Intégrer Google Data Studio**

Créer des dashboards visuels gratuits avec Google Data Studio.

**Lien :** [datastudio.google.com](https://datastudio.google.com/)

---

## 🎉 Résumé

### ✅ Ce qu'on a fait

1. ✅ Installé `@react-native-firebase/analytics`
2. ✅ Créé service `analytics.ts` (25+ fonctions)
3. ✅ Intégré tracking événements business (rides, devis, crédits, badges, groupes)
4. ✅ Intégré tracking screens (navigation automatique)
5. ✅ Configuré user properties (login/logout)
6. ✅ Désactivé en dev (pour ne pas polluer les stats)

### 📊 Événements Trackés

**25+ événements business :**
- 5 événements rides
- 1 événement personal rides
- 3 événements devis
- 3 événements crédits/badges
- 3 événements groupes
- 4 événements UX
- 2 événements système
- Événements automatiques Firebase (first_open, session_start, etc.)

### 💰 Coût

**0€ / mois - 100% GRATUIT ! 🎉**

### 🏆 Impact

**+3 points sur la roadmap Top 1% !**

```
Avant:  34/70 (Top 10%)
Après:  37/70 (Top 10% solide)
Phase 1: 12/15 points (80% done)
```

---

## 🆘 Troubleshooting

### Analytics ne track pas en dev

**Normal !** Analytics est désactivé en dev par défaut.

Pour activer :
```typescript
// src/services/analytics.ts
const ENABLED = true; // Au lieu de !__DEV__
```

---

### Événements n'apparaissent pas dans le dashboard

**Délai normal :** 24-48h pour les rapports standards

**Solution :** Utilisez **DebugView** pour voir en temps réel :
1. Firebase Console → Analytics → DebugView
2. Lancez l'app en dev
3. Les événements apparaissent instantanément

---

### Erreur "Analytics not initialized"

**Cause :** Firebase pas configuré correctement

**Solution :**
1. Vérifiez `google-services.json` (Android)
2. Vérifiez `GoogleService-Info.plist` (iOS)
3. Rebuild l'app : `npx expo prebuild --clean`

---

## 📚 Ressources

- [Firebase Analytics Docs](https://firebase.google.com/docs/analytics)
- [Google Analytics 4 Dashboard](https://analytics.google.com/)
- [BigQuery Export](https://firebase.google.com/docs/analytics/bigquery-export)
- [Best Practices](https://firebase.google.com/docs/analytics/best-practices)

---

## 🎯 Prochaine Feature

**Skeleton Loaders (+1 pt, 3h) ou React.memo (+2 pts, 1 jour)**

Continuez comme ça, vous serez **Top 1%** bientôt ! 🚀🪸


