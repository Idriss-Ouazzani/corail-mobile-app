# 📊 Firebase Analytics - Quick Start

**5 minutes pour démarrer !**

---

## ✅ Installation (DÉJÀ FAIT)

```bash
npm install @react-native-firebase/analytics
```

---

## 🎯 Événements Disponibles

### Rides
```typescript
import analytics from './src/services/analytics';

// Course publiée
await analytics.trackRidePublished({
  rideId: 'ride_123',
  visibility: 'PUBLIC',
  vehicleType: 'STANDARD',
  priceCents: 5000,
  distanceKm: 50,
  creditsEarned: 1,
});

// Course réclamée
await analytics.trackRideClaimed({
  rideId: 'ride_123',
  visibility: 'PUBLIC',
  priceCents: 5000,
  creditsSpent: 1,
});

// Course terminée
await analytics.trackRideCompleted({
  rideId: 'ride_123',
  priceCents: 5000,
  distanceKm: 50,
  durationMinutes: 60,
  bonusEarned: 1,
});
```

### Devis
```typescript
// Devis créé
await analytics.trackQuoteCreated({
  quoteId: 'quote_123',
  priceCents: 5000,
  distanceKm: 50,
});

// Devis envoyé
await analytics.trackQuoteSent({
  quoteId: 'quote_123',
  method: 'whatsapp',
});
```

### Crédits
```typescript
// Crédit gagné
await analytics.trackCreditEarned({
  amount: 1,
  reason: 'ride_published',
  newBalance: 5,
});

// Crédit dépensé
await analytics.trackCreditSpent({
  amount: 1,
  reason: 'ride_claimed',
  newBalance: 4,
});
```

### Navigation
```typescript
// Changement d'écran (automatique dans App.tsx)
await analytics.trackScreenView('Dashboard', 'DashboardScreen');
```

---

## 📈 Accéder au Dashboard

1. [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet Corail
3. Menu **Analytics** → **Dashboard**

---

## 🔍 DebugView (Temps Réel)

Pour voir les événements en temps réel :

1. Firebase Console → Analytics → **DebugView**
2. Lancez l'app en dev
3. Les événements apparaissent instantanément

---

## 💡 Mode Dev vs Prod

### Dev (par défaut)
```typescript
const ENABLED = !__DEV__; // false en dev
```

**Résultat :**
- ❌ Événements NON envoyés à Firebase
- ✅ Logs console : `📊 [Analytics/Dev] event_name`

### Prod
```typescript
const ENABLED = true;
```

**Résultat :**
- ✅ Événements envoyés à Firebase
- ❌ Pas de logs console

---

## 📚 Documentation Complète

Voir `FIREBASE_ANALYTICS_GUIDE.md` pour :
- 25+ événements disponibles
- KPIs recommandés
- Exemples de rapports
- Configuration avancée
- Troubleshooting

---

## 🎉 C'est tout !

Analytics est **100% configuré** et **prêt à l'emploi** ! 🚀

**Coût : 0€ / mois - GRATUIT À VIE !** 🎉




