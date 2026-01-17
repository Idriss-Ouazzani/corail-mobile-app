# 🗺️ Address Autocomplete V2 - POI First Strategy

## 🎯 Objectifs atteints

1. ✅ **Priorisation des POI** : Gares, aéroports, hôtels en priorité
2. ✅ **Scroll des suggestions** : Plus de truncation, jusqu'à 8 résultats visibles
3. ✅ **Messages intelligents** : Pas d'erreur tant que l'utilisateur tape
4. ✅ **Recherche hybride** : Nominatim (POI) + API Adresse (rues)
5. ✅ **UX améliorée** : Icônes différentes pour POI vs adresses

---

## 🏗️ Architecture

### 1. Service (`src/services/addressApi.ts`)

**Stratégie POI First** :
```
┌─────────────────────────────────────┐
│  User Query: "Gare Toulouse..."     │
└─────────────────┬───────────────────┘
                  │
         ┌────────▼────────┐
         │ isPOIQuery()?   │
         └────┬────────┬───┘
              │        │
          YES │        │ NO
              │        │
    ┌─────────▼──┐  ┌─▼────────────┐
    │ searchPOI  │  │ searchAddress│
    │ (Nominatim)│  │ (API Adresse)│
    └─────────┬──┘  └──┬───────────┘
              │        │
              │   Fallback si < 3
              │        │
         ┌────▼────────▼────┐
         │  Merge + Sort    │
         │  by importance   │
         └─────────┬─────────┘
                   │
         ┌─────────▼─────────┐
         │ Top 8 suggestions │
         └───────────────────┘
```

**Mots-clés POI détectés** :
- Transport : `gare`, `station`, `train`, `aéroport`, `airport`
- Hébergement : `hôtel`, `hotel`
- Santé : `hôpital`, `hospital`
- Éducation : `université`, `university`
- Culture : `musée`, `museum`, `théâtre`, `theater`
- Autres : `mairie`, `stade`, `parc`, `place`, etc.

**Filtres Nominatim stricts** :
```typescript
// ✅ ACCEPTÉ
railway:station        // Gares ferroviaires
aeroway:aerodrome      // Aéroports
tourism:hotel          // Hôtels
amenity:hospital       // Hôpitaux
amenity:university     // Universités

// ❌ REFUSÉ
street (sans numéro)   // Trop générique
city/town (rank ≥ 16)  // Trop général
```

---

### 2. Hook (`src/hooks/useAddressAutocomplete.ts`)

**Features** :
- ⏱️ Debouncing 300ms (évite trop d'appels API)
- 📊 8 suggestions par défaut (vs 5 avant)
- 🚫 Pas d'erreur si 0 résultat (l'utilisateur peut continuer)
- 🔄 Auto-reset si query < 3 caractères

---

### 3. Composant UI (`src/components/AddressAutocomplete.tsx`)

**Améliorations** :
- ✅ **Scroll activé** : `scrollEnabled={true}` + `nestedScrollEnabled={true}`
- 📏 **MaxHeight 320px** : Voir jusqu'à 8 suggestions complètes
- 🎨 **Icônes différentes** :
  - 🏢 Vert (`business`) pour les POI
  - 📍 Bleu (`location`) pour les adresses
- 💬 **Message "Aucun résultat"** : Seulement si query ≥ 3 caractères et loading terminé
- 🎯 **numberOfLines={1}** : Évite le text overflow

---

## 🧪 Cas d'usage

### Exemple 1 : Gare Toulouse Matabiau
```
Input: "Gare Tou"
❌ Avant : "Aucun résultat" immédiat
✅ Après : Continue de taper...

Input: "Gare Toulouse"
✅ Résultat 1: 🏢 Gare de Toulouse-Matabiau (POI)
   Résultat 2: 🏢 Gare Toulouse Saint-Agne (POI)
   Résultat 3: 📍 Rue de la Gare, 31000 Toulouse
```

### Exemple 2 : Aéroport
```
Input: "Aeroport Tou"
✅ Résultat 1: 🏢 Aéroport Toulouse-Blagnac (POI)
   Résultat 2: 🏢 Terminal 1, Aéroport Toulouse
```

### Exemple 3 : Adresse classique
```
Input: "10 rue alsace"
✅ Résultat 1: 📍 10 Rue d'Alsace-Lorraine, 31000 Toulouse
   Résultat 2: 📍 10 Rue d'Alsace, 31200 Toulouse
```

---

## 📦 Types

```typescript
interface AddressSuggestion {
  label: string;              // "Gare de Toulouse-Matabiau, Toulouse..."
  name: string;               // "Gare de Toulouse-Matabiau"
  postcode: string;           // "31000"
  city: string;               // "Toulouse"
  context: string;            // "Haute-Garonne, Occitanie"
  coordinates: {
    lat: number;
    lon: number;
  };
  type: string;               // "railway:station" | "housenumber" | ...
  importance: number;         // Score Nominatim (0-1)
  isPOI?: boolean;            // true si POI
}
```

---

## 🔧 Configuration

### Limites API (gratuites)
- **API Adresse** : Pas de limite (service public français)
- **Nominatim** : Usage raisonnable (~1 req/sec)

### Personnalisation
```typescript
// Dans CreateRideScreen.tsx
<AddressAutocomplete
  label="Point de départ"
  placeholder="Ex: Gare Toulouse-Matabiau"
  value={pickup}
  onSelectAddress={(address) => {
    setPickup(address.label);
    setPickupCoords(address.coordinates);
  }}
/>
```

---

## 🐛 Problèmes résolus

| Problème | Solution |
|----------|----------|
| ❌ "Gare Toulouse" ne trouve rien | ✅ Recherche POI dédiée avec Nominatim |
| ❌ "Aucun résultat" trop tôt | ✅ Message seulement si query ≥ 3 et loading fini |
| ❌ Suggestions tronquées | ✅ ScrollView activé + maxHeight 320px |
| ❌ Rue "Boulevard de la gare" au lieu du POI | ✅ Filtrage strict + scoring POI |

---

## 🚀 Prochaines améliorations possibles

1. **Géolocalisation** : Suggérer "📍 Position actuelle"
2. **Historique** : Garder les 5 dernières adresses utilisées
3. **Favoris** : Ajouter "🏠 Domicile" et "💼 Bureau"
4. **Distance** : Afficher "à 2.5 km de vous"
5. **Cache** : Sauvegarder les résultats pour éviter les appels répétés

---

## 📊 Métriques

- **Ligne de code** : ~300 lignes (service + hook + composant)
- **Dépendances** : 0 nouvelle (API natives gratuites)
- **Performance** : Debouncing 300ms + max 8 suggestions
- **Compatibilité** : iOS + Android + Expo Go

---

**Date** : Janvier 2026  
**Version** : 2.0  
**Status** : ✅ Production Ready



