# 🗺️ Configuration des logos de navigation

## 📦 Assets à ajouter

Tu dois ajouter **4 images** dans ton projet :

### 1️⃣ Image de fond de carte

**Emplacement** : `assets/map-background.png`

**Description** : Une carte de ville en noir et blanc (comme celle que tu as envoyée)

**Spécifications** :
- Format : PNG
- Résolution recommandée : 1200x600px
- Style : Noir et blanc, lignes fines
- Contenu : Plan de ville avec rues

**Où trouver** :
- Utilise l'image que tu as envoyée
- Ou télécharge sur [Shutterstock](https://www.shutterstock.com/search/city+map+pattern)
- Ou génère avec [Snazzy Maps](https://snazzymaps.com/)

---

### 2️⃣ Logo Google Maps

**Emplacement** : `assets/logos/google-maps.png`

**Description** : Logo officiel de Google Maps

**Téléchargement** :
```
https://www.google.com/images/branding/product/2x/maps_96dp.png
```

Ou recherche "google maps logo png transparent" sur Google Images

**Spécifications** :
- Format : PNG transparent
- Taille : 512x512px ou plus
- Fond : Transparent

---

### 3️⃣ Logo Waze

**Emplacement** : `assets/logos/waze.png`

**Description** : Logo officiel de Waze

**Téléchargement** :
Recherche "waze logo png transparent" sur Google Images

Ou utilise ce lien :
```
https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Waze_logo.svg/512px-Waze_logo.svg.png
```

**Spécifications** :
- Format : PNG transparent
- Taille : 512x512px ou plus
- Fond : Transparent

---

### 4️⃣ Logo Apple Maps

**Emplacement** : `assets/logos/apple-maps.png`

**Description** : Logo officiel d'Apple Maps

**Téléchargement** :
Recherche "apple maps logo png transparent" sur Google Images

**Spécifications** :
- Format : PNG transparent
- Taille : 512x512px ou plus
- Fond : Transparent

---

## 📁 Structure des dossiers

```
Corail-mobileapp/
├── assets/
│   ├── map-background.png          ← Carte de fond
│   └── logos/
│       ├── google-maps.png         ← Logo Google Maps
│       ├── waze.png                ← Logo Waze
│       └── apple-maps.png          ← Logo Apple Maps
├── src/
│   └── screens/
│       └── RideDetailScreen.tsx
└── ...
```

---

## ⚙️ Installation

### Étape 1 : Créer les dossiers
```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp
mkdir -p assets/logos
```

### Étape 2 : Ajouter les images

1. **Carte de fond** : `map-background.png` → `assets/`
2. **Logos** : Tous les logos → `assets/logos/`

### Étape 3 : Vérifier

Assure-toi que les fichiers sont bien présents :
```bash
ls -la assets/
ls -la assets/logos/
```

Tu devrais voir :
```
assets/
├── map-background.png
└── logos/
    ├── google-maps.png
    ├── waze.png
    └── apple-maps.png
```

---

## 🔄 Alternative : Utiliser des icônes Ionicons

Si tu ne veux pas télécharger les logos, modifie `RideDetailScreen.tsx` :

```tsx
// Remplace les <Image> par des icônes Ionicons
<View style={styles.mapNavLogoContainer}>
  <Ionicons name="map" size={32} color="#4285F4" />
</View>
```

---

## ✅ Résultat attendu

Une fois les assets ajoutés :

```
┌────────────────────────────┐
│  [CARTE FLOUTÉE]           │
│                            │
│  Ouvrir l'itinéraire:      │
│  ┌──────┐ ┌──────┐ ┌──────┐│
│  │ [📍] │ │ [🧭] │ │ [🗺] ││
│  │ Maps │ │ Waze │ │Plans ││
│  └──────┘ └──────┘ └──────┘│
│                            │
│  📏 12.5 km • 18 min       │
└────────────────────────────┘
```

Avec :
- ✅ Carte réaliste en fond (floutée)
- ✅ Vrais logos colorés dans des cercles blancs
- ✅ Effet de profondeur avec ombres

---

## 📄 Droits d'utilisation

**Est-ce légal ?** ✅ **OUI**

- **Usage fonctionnel** : Tu utilises les logos pour ouvrir leurs apps
- **Pas de confusion** : Tu ne prétends pas être eux
- **Fair use** : C'est un bouton d'action, pas de la publicité

**Sources officielles** :
- [Google Brand Guidelines](https://about.google/brand-resource-center/)
- [Apple Trademark Guidelines](https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html)

---

## 🐛 Dépannage

### Erreur : "Cannot find module '../../assets/map-background.png'"

**Solution** :
1. Vérifie que le fichier existe
2. Redémarre Metro Bundler :
   ```bash
   npx expo start --clear
   ```

### Les logos ne s'affichent pas

**Solution** :
1. Vérifie les chemins des fichiers
2. Assure-toi que les images sont au format PNG
3. Redémarre l'app

### L'app crash au chargement

**Solution** :
Utilise temporairement les icônes Ionicons en attendant d'ajouter les images.

---

**Prêt à tester !** 🚀 Ajoute les 4 images et relance l'app.



