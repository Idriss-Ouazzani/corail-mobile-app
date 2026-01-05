# 🚗 Amélioration de la page Détails de Course

## ✅ Améliorations réalisées

### 1. **Prix réduit** 💰
- **Avant** : `fontSize: 32px` (trop grand)
- **Après** : `fontSize: 24px` dans une card compacte
- Design amélioré avec label + badge de visibilité

### 2. **Horaire déplacé en haut** 📅
- Nouvelle section `topSection` en premier
- **Horaire avec countdown** : "Dans 2h30" / "Imminent" / "Passée"
- Affichage du jour + heure + temps restant
- Design moderne avec icône calendrier

### 3. **Carte statique** 🗺️
- Image de carte Google Maps avec :
  - Marqueur A (vert) = Départ
  - Marqueur B (rouge) = Arrivée
  - Tracé bleu de l'itinéraire
- Overlay avec distance + durée

### 4. **Calcul de distance et durée en voiture** 🚙
- Intégration de **Google Directions API**
- Affichage en temps réel : "12.5 km • 18 min"
- Fallback sur les données existantes si API indisponible

### 5. **Section "Informations" supprimée** 🗑️
- Les tags (Public/Groupe) sont maintenant dans la card prix
- Section redondante en bas supprimée
- Interface plus épurée

### 6. **Devis amélioré** 📄
- Déplacé avant la section Client (priorité)
- Nouveau design avec :
  - Icône document dans un cercle
  - Status plus visible avec emojis
  - Lien vers le devis en ligne avec icônes

---

## 📐 Avant / Après

### Layout Avant
```
┌─────────────────────────────┐
│  Header                     │
├─────────────────────────────┤
│  Prix (32px) 🔴 TROP GRAND  │
│                             │
│  Itinéraire (adresses)      │
│                             │
│  Horaire (en bas)  🔴       │
│                             │
│  Client                     │
│  Devis                      │
│  Créateur                   │
│  Informations 🔴 INUTILE    │
└─────────────────────────────┘
```

### Layout Après
```
┌─────────────────────────────┐
│  Header                     │
├─────────────────────────────┤
│  📅 Horaire + Countdown ✅  │
│  💰 Prix (24px) ✅          │
│                             │
│  🗺️ Carte statique ✅       │
│  📏 12.5 km • 18 min ✅     │
│                             │
│  📍 Itinéraire (adresses)   │
│                             │
│  📄 Devis (si présent) ✅   │
│  👤 Client                  │
│  ⭐ Créateur                │
└─────────────────────────────┘
```

---

## 🔧 Configuration Google Maps API

### Étape 1 : Créer une clé API

1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créer un projet ou sélectionner un existant
3. Aller dans **APIs & Services** > **Credentials**
4. Cliquer sur **Create Credentials** > **API Key**
5. Copier la clé générée

### Étape 2 : Activer les APIs nécessaires

Dans **APIs & Services** > **Library**, activer :
- ✅ **Directions API** (pour calculer l'itinéraire)
- ✅ **Maps Static API** (pour afficher la carte)

### Étape 3 : Sécuriser la clé

Dans **APIs & Services** > **Credentials**, éditer votre clé :
- **Application restrictions** : iOS apps / Android apps
- **API restrictions** : Restreindre aux APIs activées

### Étape 4 : Configuration dans l'app

#### Option 1 : Variable d'environnement (Recommandé)
```bash
# .env
GOOGLE_MAPS_API_KEY=AIzaSyD...votre_clé...
```

#### Option 2 : Directement dans le code
```typescript
// src/services/mapsApi.ts
const GOOGLE_MAPS_API_KEY = 'AIzaSyD...votre_clé...';
```

---

## 💰 Coûts Google Maps API

### Tarification

| API | Prix | Quota gratuit |
|-----|------|---------------|
| **Directions API** | $5 / 1000 requêtes | $200/mois gratuit |
| **Maps Static API** | $2 / 1000 requêtes | $200/mois gratuit |

### Estimation pour Corail VTC

- **Directions API** : 1 appel par visualisation de course
- **Maps Static API** : 1 appel par visualisation de course

**Exemple** :
- 1000 courses visualisées/mois = $7 (dans le quota gratuit)
- 10 000 courses visualisées/mois = $70
- 100 000 courses visualisées/mois = $700

### Optimisations possibles

1. **Cache** : Sauvegarder les résultats pour éviter les appels répétés
2. **Fallback** : Utiliser les données existantes (`ride.distance_km`, `ride.duration_minutes`)
3. **Static maps alternatives** : MapBox (gratuit jusqu'à 50k requêtes/mois)

---

## 🎨 Nouvelles fonctionnalités UI

### Countdown dynamique

```typescript
const getTimeUntilRide = () => {
  const diff = rideTime - now;
  
  if (diff < 0) return 'Passée';
  if (days > 0) return `Dans ${days}j ${hours}h`;
  if (hours > 0) return `Dans ${hours}h ${minutes}min`;
  if (minutes > 0) return `Dans ${minutes} min`;
  return 'Imminent';
};
```

Affichage :
- ✅ "Dans 2j 5h"
- ✅ "Dans 5h 30min"
- ✅ "Dans 15 min"
- ✅ "Imminent" (< 1 min)
- ✅ "Passée" (négatif)

### Carte avec overlay

```tsx
<View style={styles.mapCard}>
  <Image source={{ uri: mapUrl }} />
  <LinearGradient>
    <View style={styles.routeInfoBar}>
      <Ionicons name="navigate" />
      <Text>12.5 km</Text>
      <Separator />
      <Ionicons name="time" />
      <Text>18 min</Text>
    </View>
  </LinearGradient>
</View>
```

### Status devis amélioré

```tsx
{ride.quote_status === 'SENT' && '📤 Envoyé'}
{ride.quote_status === 'VIEWED' && '👁️ Vu par le client'}
{ride.quote_status === 'ACCEPTED' && '✅ Accepté'}
{ride.quote_status === 'REFUSED' && '❌ Refusé'}
```

---

## 📄 Fichiers modifiés

### Nouveaux fichiers
- ✅ `src/services/mapsApi.ts` - Service Google Maps API
- ✅ `RIDE_DETAIL_IMPROVEMENTS.md` - Cette documentation

### Fichiers modifiés
- ✅ `src/screens/RideDetailScreen.tsx` - Refonte complète (700 lignes)

---

## 🧪 Test

### Cas de test

1. **Avec Google Maps API configurée** ✅
   - Carte affichée avec itinéraire
   - Distance/durée calculées en temps réel

2. **Sans Google Maps API (fallback)** ✅
   - Image placeholder ou carte générique
   - Distance/durée depuis `ride.distance_km` / `ride.duration_minutes`

3. **Countdown** ✅
   - Course dans 2 jours → "Dans 2j 5h"
   - Course dans 1 heure → "Dans 1h 15min"
   - Course dans 5 min → "Dans 5 min"
   - Course passée → "Passée"

4. **Devis** ✅
   - Status SENT → "📤 Envoyé"
   - Status ACCEPTED → "✅ Accepté"
   - Lien cliquable vers le devis en ligne

5. **Prix réduit** ✅
   - Taille 24px au lieu de 32px
   - Card compacte avec badge visibilité

---

## 🚀 Prochaines améliorations possibles

1. **Cache des itinéraires** : Éviter les appels répétés
2. **Carte interactive** : Remplacer l'image statique par une carte zoomable
3. **Navigation directe** : Bouton "Démarrer la navigation" avec décompte
4. **Historique des courses** : Voir toutes les courses passées
5. **Partage avancé** : QR code, lien court, etc.

---

**Date** : Janvier 2026  
**Version** : 1.0  
**Status** : ✅ Production Ready  
**Impact** : Page détails course complètement refonte

