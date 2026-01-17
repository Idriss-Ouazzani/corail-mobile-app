# 📱 Intégration Profil VTC - Guide d'implémentation

## ✅ Ce qui est créé

### 1️⃣ **Backend complet**
- ✅ Table `vtc_profiles` dans Supabase
- ✅ Fonctions API dans `supabaseApi.ts` :
  - `getMyVTCProfile()`
  - `createVTCProfile(data)`
  - `updateVTCProfile(data)`
  - `deleteVTCProfile()`
- ✅ Fonctions wrapper dans `api.ts`

### 2️⃣ **UI Screen complet**
- ✅ `VTCPublicProfileScreen.tsx` créé
- ✅ Composant `VTCProfilePhotoUpload.tsx` créé
- ✅ Formulaire complet avec tous les champs
- ✅ Validation et sauvegarde
- ✅ Boutons Partager / Voir le profil

---

## 🔗 Comment intégrer dans l'app

### Étape 1 : Ajouter la route dans la navigation

Dans votre fichier de navigation (probablement `src/navigation/index.tsx` ou similaire), ajoutez :

```typescript
import { VTCPublicProfileScreen } from '@/screens/VTCPublicProfileScreen';

// Dans votre Stack.Navigator ou Modal :
<Stack.Screen 
  name="VTCPublicProfile" 
  component={VTCPublicProfileScreen}
  options={{
    title: 'Ma Page Publique',
    headerShown: true,
  }}
/>
```

### Étape 2 : Ajouter un bouton dans le Dashboard ou Settings

**Option A : Dans le Dashboard (DashboardScreen.tsx)**

```typescript
// Ajouter dans la section "Outils" ou "Plus"
<TouchableOpacity
  style={styles.toolCard}
  onPress={() => navigation.navigate('VTCPublicProfile')}
  activeOpacity={0.7}
>
  <View style={styles.toolIcon}>
    <Ionicons name="globe-outline" size={24} color="#6366f1" />
  </View>
  <View style={styles.toolContent}>
    <Text style={styles.toolTitle}>Ma Page Publique</Text>
    <Text style={styles.toolSubtitle}>
      Créez votre vitrine VTC
    </Text>
  </View>
  <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
</TouchableOpacity>
```

**Option B : Dans un écran Settings (si vous en avez un)**

```typescript
<TouchableOpacity
  style={styles.menuItem}
  onPress={() => navigation.navigate('VTCPublicProfile')}
>
  <Ionicons name="globe-outline" size={22} color="#6366f1" />
  <Text style={styles.menuText}>Ma Page Publique</Text>
  <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
</TouchableOpacity>
```

---

## 📋 Checklist d'intégration

### Backend
- [x] Table `vtc_profiles` créée dans Supabase
- [x] Colonnes véhicule/langues/équipements ajoutées
- [x] Storage bucket `vtc-profiles` créé
- [x] Policies RLS configurées
- [x] Fonctions API créées

### Frontend
- [x] `VTCPublicProfileScreen.tsx` créé
- [x] `VTCProfilePhotoUpload.tsx` créé
- [x] Fonctions API intégrées
- [ ] Route ajoutée dans la navigation
- [ ] Bouton ajouté dans Dashboard/Settings
- [ ] Testé en dev

---

## 🧪 Test de la fonctionnalité

### 1. Ouvrir la page
```typescript
// Dans votre navigateur de dev ou via un bouton
navigation.navigate('VTCPublicProfile');
```

### 2. Créer un profil
- Remplir le formulaire
- Générer un slug (ex: `jean-dupont`)
- Ajouter une photo (optionnel)
- Sauvegarder

### 3. Vérifier le profil public
- Cliquer sur "Voir mon profil"
- Devrait ouvrir : `https://corail-quotes-web.vercel.app/vtc/jean-dupont`
- Vérifier que toutes les infos s'affichent correctement

### 4. Tester le partage
- Cliquer sur "Partager"
- Devrait ouvrir le menu de partage natif
- Le lien devrait être correct

---

## 🎨 Personnalisation (optionnel)

### Modifier les couleurs
Dans `VTCPublicProfileScreen.tsx`, cherchez :
```typescript
colors={['#6366f1', '#4f46e5']} // Bouton principal
```

### Modifier le domaine du lien
Si tu as un domaine custom :
```typescript
// Chercher et remplacer
const url = `https://corail-quotes-web.vercel.app/vtc/${profile.slug}`;
// Par
const url = `https://corail.app/vtc/${profile.slug}`;
```

### Ajouter des champs
1. Ajouter la colonne dans Supabase :
```sql
ALTER TABLE vtc_profiles ADD COLUMN mon_champ TEXT;
```

2. Ajouter dans l'interface TypeScript
3. Ajouter un champ dans le formulaire
4. Ajouter dans la page web `/vtc/[slug]/page.tsx`

---

## 📊 Analytics

Les vues sont automatiquement trackées dans `vtc_profiles.view_count`.

Pour voir les stats :
```sql
SELECT 
  display_name, 
  slug, 
  view_count, 
  last_viewed_at 
FROM vtc_profiles 
ORDER BY view_count DESC;
```

---

## ❓ Dépannage

### "Profil introuvable"
→ Vérifier que `is_public = true` dans Supabase

### "Identifiant déjà utilisé"
→ Le slug doit être unique. Proposer un slug alternatif (jean-dupont-2)

### "Photo ne s'affiche pas"
→ Vérifier que le bucket `vtc-profiles` est public et que les policies RLS sont OK

### Navigation ne fonctionne pas
→ Vérifier que la route `VTCPublicProfile` est bien ajoutée dans le Stack.Navigator

---

## 🚀 Prochaines améliorations (optionnel)

1. **QR Code** : Générer un QR Code du lien pour l'imprimer
2. **Templates de services** : Liste pré-définie au lieu de texte libre
3. **Multi-photos** : Galerie de photos du véhicule
4. **Avis clients** : Section avis/témoignages
5. **Calendrier de disponibilité** : Afficher ses dispos

---

## 📝 Notes importantes

- ✅ La page web est déjà déployée sur Vercel
- ✅ Les profils sont automatiquement accessibles via `corail.app/vtc/[slug]`
- ✅ Le partage fonctionne sur WhatsApp, SMS, Email, etc.
- ✅ Aucun impact sur les fonctionnalités existantes
- ✅ Totalement optionnel pour les VTC (pas obligatoire)

---

**🎉 Une fois intégré, les VTC pourront partager leur profil public et attirer de nouveaux clients sans qu'ils installent l'app !**



