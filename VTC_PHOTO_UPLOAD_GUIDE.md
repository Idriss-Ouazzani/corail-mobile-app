# 📸 Photo de Profil VTC - Guide Complet

## 🎯 3 façons d'ajouter une photo

### ✅ Option 1 : URL externe (pour tester maintenant)

**Avantage** : Rapide, pas de setup
**Inconvénient** : Dépend d'un service tiers

#### Via Imgur (gratuit, simple)

1. Va sur [imgur.com](https://imgur.com)
2. Upload ta photo
3. Clique droit sur l'image → "Copier l'adresse de l'image"
4. Dans Supabase :

```sql
UPDATE vtc_profiles 
SET photo_url = 'https://i.imgur.com/XXXXXXX.jpg'
WHERE slug = 'ton-slug';
```

#### Via Google Drive

1. Upload ta photo sur Google Drive
2. Clique droit → "Obtenir le lien"
3. Change `https://drive.google.com/file/d/FILE_ID/view` 
   en `https://drive.google.com/uc?id=FILE_ID`
4. Utilise cette URL dans `photo_url`

---

### ⭐ Option 2 : Supabase Storage (recommandé)

**Avantage** : Hébergé chez nous, contrôle total, rapide
**Inconvénient** : Nécessite un peu de setup

#### A. Setup du bucket (1 fois)

```bash
# Dans Supabase Dashboard :
# SQL Editor > Coller database/vtc_profiles_storage.sql > Run
```

Ou manuellement :
1. Va dans **Storage** > **Create bucket**
2. Nom : `vtc-profiles`
3. Public : ✅ OUI
4. Politique RLS : Définie dans le SQL

#### B. Upload manuel (pour tester)

1. Va dans **Storage** > **vtc-profiles**
2. Crée un dossier avec ton `user_id` (UUID)
3. Upload ta photo, renomme-la `profile.jpg`
4. Clique sur la photo → **Get public URL**
5. Copie l'URL :

```
https://qeheawdjlwlkhnwbhqcg.supabase.co/storage/v1/object/public/vtc-profiles/{user_id}/profile.jpg
```

6. Mets à jour la table :

```sql
UPDATE vtc_profiles 
SET photo_url = 'https://qeheawdjlwlkhnwbhqcg.supabase.co/storage/v1/object/public/vtc-profiles/{user_id}/profile.jpg'
WHERE user_id = '{ton_user_id}';
```

#### C. Upload depuis l'app (plus tard)

J'ai créé le composant `VTCProfilePhotoUpload.tsx` qui gère :
- ✅ Sélection depuis la galerie
- ✅ Upload vers Supabase Storage
- ✅ Mise à jour automatique de `photo_url`
- ✅ Suppression de la photo
- ✅ Preview en temps réel

**Tu l'intégreras dans la future page "Ma Page Publique"**

---

### 🔄 Option 3 : Gravatar (basé sur l'email)

**Avantage** : Synchronisé automatiquement
**Inconvénient** : Nécessite un compte Gravatar

#### Setup

1. Va sur [gravatar.com](https://gravatar.com)
2. Crée un compte avec ton email VTC
3. Upload ta photo
4. Dans le code web, modifier `page.tsx` :

```typescript
// Ajouter un fallback Gravatar
const getPhotoUrl = (profile: VTCProfile) => {
  if (profile.photo_url) return profile.photo_url;
  
  // Fallback Gravatar basé sur l'email
  if (profile.email) {
    const md5 = require('crypto').createHash('md5');
    const hash = md5.update(profile.email.toLowerCase()).digest('hex');
    return `https://www.gravatar.com/avatar/${hash}?s=200&d=mp`;
  }
  
  return null; // Pas de photo
};
```

---

## 📐 Recommandations techniques

### Format de l'image
- **Taille** : 500x500 px (ou plus, carré)
- **Format** : JPG, PNG ou WebP
- **Poids** : < 500 KB (pour la performance)
- **Aspect ratio** : 1:1 (carré)

### Optimisation

Si tu veux optimiser automatiquement les images uploadées :

```typescript
// Dans VTCProfilePhotoUpload.tsx, modifier quality:
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.7, // 0.7 = bon compromis qualité/poids
});
```

---

## 🧪 Test rapide (Option 1 - URL externe)

### Photo de test Unsplash

Pour tester rapidement, utilise une photo Unsplash :

```sql
-- Photo de chauffeur professionnel (exemple)
UPDATE vtc_profiles 
SET photo_url = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
WHERE slug = 'test-vtc';
```

Recharge ta page `http://localhost:3000/vtc/test-vtc` → Tu devrais voir la photo !

---

## 🔧 Dépendances nécessaires (pour l'app mobile)

Si tu veux utiliser `VTCProfilePhotoUpload.tsx` plus tard :

```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp

# Installer expo-image-picker
npx expo install expo-image-picker

# Déjà installé normalement :
# - @supabase/supabase-js
# - expo-file-system (si besoin)
```

---

## 📊 Structure des fichiers Storage

```
vtc-profiles/  (bucket)
├── 550e8400-e29b-41d4-a716-446655440000/  (user_id 1)
│   └── profile.jpg
├── 660f9511-f3ac-52e5-b827-557766551111/  (user_id 2)
│   └── profile.png
└── 770g0622-g4bd-63f6-c938-668877662222/  (user_id 3)
    └── profile.webp
```

**URL publique** :
```
https://qeheawdjlwlkhnwbhqcg.supabase.co/storage/v1/object/public/vtc-profiles/{user_id}/profile.{ext}
```

---

## 🔒 Sécurité RLS

### Qui peut faire quoi ?

| Action | Qui | Condition |
|--------|-----|-----------|
| **Lire** | Tout le monde | Photo publique |
| **Upload** | Propriétaire | Son dossier `{user_id}/` uniquement |
| **Supprimer** | Propriétaire | Son dossier `{user_id}/` uniquement |

### Exemple de test de sécurité

```javascript
// ✅ OK : VTC upload dans son propre dossier
await supabase.storage
  .from('vtc-profiles')
  .upload('MON_USER_ID/profile.jpg', file);

// ❌ INTERDIT : VTC essaie d'upload dans le dossier d'un autre
await supabase.storage
  .from('vtc-profiles')
  .upload('AUTRE_USER_ID/profile.jpg', file);
// → Erreur : "new row violates row-level security policy"
```

---

## 🎨 Affichage dans la page web

### Avec photo

```
╔════════════════════════════════════╗
║  [Photo carrée 200x200]            ║
║                                    ║
║  Jean Dupont                       ║
║  📍 Toulouse                        ║
╚════════════════════════════════════╝
```

### Sans photo (fallback)

```
╔════════════════════════════════════╗
║  [ Gradient + Initiale "J" ]       ║
║                                    ║
║  Jean Dupont                       ║
║  📍 Toulouse                        ║
╚════════════════════════════════════╝
```

Le code dans `page.tsx` gère déjà les 2 cas automatiquement :

```tsx
{typedProfile.photo_url ? (
  <img src={typedProfile.photo_url} alt={typedProfile.display_name} />
) : (
  <div className="initiale-gradient">
    {typedProfile.display_name.charAt(0).toUpperCase()}
  </div>
)}
```

---

## ❓ FAQ

### "Puis-je changer de photo plus tard ?"
✅ Oui, à tout moment (via l'app ou manuellement dans Supabase)

### "La photo sera-t-elle redimensionnée automatiquement ?"
Pas pour l'instant. Le composant `VTCProfilePhotoUpload` utilise `quality: 0.8` mais ne redimensionne pas. Si tu veux du redimensionnement auto, on peut ajouter une Edge Function Supabase.

### "Que se passe-t-il si je supprime mon profil ?"
La photo sera automatiquement supprimée (cascade delete via `user_id`)

### "Puis-je utiliser une photo de ma voiture ?"
Oui, mais je recommande plutôt une photo de toi (crédibilité + confiance pour les clients)

---

## 🚀 Résumé : Quelle option choisir ?

| Besoin | Option | Quand |
|--------|--------|-------|
| **Tester maintenant** | Option 1 (URL externe) | Aujourd'hui |
| **Production** | Option 2 (Supabase Storage) | Après validation |
| **Simplicité** | Option 3 (Gravatar) | Si tu as déjà un compte |

**Mon conseil** : 
1. **Pour tester maintenant** → Utilise Unsplash ou Imgur (Option 1)
2. **Pour la prod** → Setup Supabase Storage (Option 2)
3. **Dans l'app mobile** → Intègre `VTCProfilePhotoUpload.tsx`

---

## 🎯 Prochaines étapes

1. **Maintenant** : Teste avec une URL externe
2. **Si ça marche** : Setup Supabase Storage bucket
3. **Plus tard** : Intègre le composant d'upload dans l'app

**Tu veux que je t'aide à setup le bucket Supabase Storage maintenant ?** 🚀

