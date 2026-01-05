# 🎨 Guide des Alertes Personnalisées Corail

## ✅ Problèmes résolus

### 1️⃣ **Création de groupes** ✅
- **Avant** : `handleCreateGroup` affichait juste une alerte sans créer le groupe
- **Après** : Appelle `apiClient.createGroup()` et recharge la liste

### 2️⃣ **Design des alertes** ✅
- Nouveau composant `CustomAlert` avec le thème Corail (rouge/orange)
- Suppression des icônes de téléphone natives
- Design élégant et cohérent

---

## 🎨 Nouveau système d'alertes

### Composants créés

#### 1. `CustomAlert.tsx`
Alerte personnalisée avec :
- **Thème Corail** : Dégradés rouge/orange (#ff6b47 → #f97316)
- **4 types** : success, error, warning, info
- **Icônes colorées** : Checkmark (vert), Close (rouge), Warning (orange), Info (bleu)
- **Boutons personnalisés** : Default, Cancel, Destructive
- **Blur effect** sur iOS
- **Design moderne** : Coins arrondis, ombres, bordures subtiles

#### 2. `AlertProvider.tsx`
Provider React Context pour gérer les alertes globalement

---

## 📖 Comment utiliser

### Option A : Migration progressive (Recommandé)

Gardez `Alert.alert` pour l'instant, les alertes fonctionnent déjà.

Pour migrer progressivement vers le nouveau design :

```typescript
// 1. Envelopper App.tsx avec AlertProvider
import { AlertProvider } from './src/components/AlertProvider';

export default function App() {
  return (
    <AlertProvider>
      {/* Votre app */}
    </AlertProvider>
  );
}

// 2. Dans vos composants, utiliser le hook
import { useAlert } from '../components/AlertProvider';

function MyComponent() {
  const { showAlert } = useAlert();

  const handleAction = () => {
    showAlert({
      title: 'Succès',
      message: 'Groupe créé avec succès !',
      type: 'success',
      buttons: [
        { text: 'OK', style: 'default' }
      ]
    });
  };
}
```

### Option B : Remplacement global (Plus rapide)

Créer un fichier `src/utils/alert.ts` :

```typescript
import { Alert as RNAlert } from 'react-native';

// Pour l'instant, utiliser Alert natif
// TODO: Migrer vers CustomAlert progressivement
export const Alert = RNAlert;
```

Puis dans tous les fichiers, remplacer :
```typescript
import { Alert } from 'react-native';
// Par :
import { Alert } from '../utils/alert';
```

---

## 🎯 Types d'alertes

### Success (Vert)
```typescript
showAlert({
  title: 'Succès',
  message: 'Opération réussie !',
  type: 'success'
});
```

### Error (Rouge)
```typescript
showAlert({
  title: 'Erreur',
  message: 'Une erreur est survenue',
  type: 'error'
});
```

### Warning (Orange)
```typescript
showAlert({
  title: 'Attention',
  message: 'Veuillez vérifier les informations',
  type: 'warning'
});
```

### Info (Bleu)
```typescript
showAlert({
  title: 'Information',
  message: 'Nouvelle fonctionnalité disponible',
  type: 'info'
});
```

---

## 🎨 Personnalisation des boutons

### Bouton unique (par défaut)
```typescript
showAlert({
  title: 'Succès',
  message: 'Groupe créé !',
  buttons: [
    { text: 'OK', style: 'default' }
  ]
});
```

### Deux boutons (Annuler + Confirmer)
```typescript
showAlert({
  title: 'Confirmation',
  message: 'Êtes-vous sûr de vouloir supprimer ?',
  type: 'warning',
  buttons: [
    { 
      text: 'Annuler', 
      style: 'cancel',
      onPress: () => console.log('Annulé')
    },
    { 
      text: 'Supprimer', 
      style: 'destructive',
      onPress: () => handleDelete()
    }
  ]
});
```

### Styles de boutons

- **`default`** : Dégradé rouge/orange (#ff6b47 → #f97316)
- **`cancel`** : Gris (#64748b → #475569)
- **`destructive`** : Rouge (#ef4444 → #dc2626)

---

## 🚀 Migration des Alert existants

### Avant
```typescript
Alert.alert('Succès', 'Groupe créé avec succès !');
```

### Après
```typescript
showAlert({
  title: 'Succès',
  message: 'Groupe créé avec succès !',
  type: 'success'
});
```

---

## 📝 TODO : Migration complète

Pour une expérience utilisateur cohérente, migrer tous les `Alert.alert` :

### Fichiers à migrer
- [ ] `App.tsx` (nombreux Alert.alert)
- [ ] `GroupsScreen.tsx` ✅ (déjà fait)
- [ ] `CreateRideScreen.tsx`
- [ ] `MyQuotesScreen.tsx`
- [ ] `PersonalRidesScreen.tsx`
- [ ] `RideDetailScreen.tsx`
- [ ] `ToolsScreen.tsx`
- [ ] Tous les autres écrans

### Commande de recherche
```bash
grep -r "Alert.alert" src/ --include="*.tsx" --include="*.ts"
```

---

## 🎨 Design System

### Couleurs principales
- **Primary** : #ff6b47 → #f97316 (Dégradé rouge/orange)
- **Success** : #10b981 (Vert)
- **Error** : #ef4444 (Rouge)
- **Warning** : #f59e0b (Orange)
- **Info** : #0ea5e9 (Bleu)
- **Cancel** : #64748b (Gris)

### Typographie
- **Title** : 20px, Bold (700)
- **Message** : 15px, Regular (400)
- **Button** : 16px, SemiBold (600)

### Espacement
- **Padding** : 24px
- **Border Radius** : 24px (container), 12px (buttons)
- **Gap** : 12px entre les boutons

---

## 🔧 Dépendances

Assurez-vous d'avoir installé :
```bash
npm install expo-blur
# ou
yarn add expo-blur
```

---

## 📱 Aperçu

```
┌─────────────────────────────────────┐
│                                     │
│            ✓ (Vert)                │
│                                     │
│            Succès                   │
│                                     │
│     Groupe créé avec succès !      │
│                                     │
│  ┌───────────────────────────────┐ │
│  │           OK                  │ │ ← Dégradé rouge/orange
│  └───────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

---

## ✨ Avantages

1. **Design cohérent** : Toutes les alertes ont le même style
2. **Thème Corail** : Couleurs de l'app (rouge/orange)
3. **Pas d'icônes de téléphone** : Design épuré
4. **Élégant** : Blur, ombres, animations
5. **Flexible** : 4 types, 3 styles de boutons
6. **Accessible** : Contraste élevé, textes lisibles

---

## 🎯 Prochaines étapes

1. ✅ Créer `CustomAlert` et `AlertProvider`
2. ⏳ Envelopper App.tsx avec `AlertProvider`
3. ⏳ Migrer progressivement les `Alert.alert`
4. ⏳ Ajouter des animations (slide-in, fade)
5. ⏳ Ajouter un son optionnel (success/error)

