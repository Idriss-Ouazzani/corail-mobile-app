# 🔧 Régler le 404 et le preview d'image

## 🔴 Problème 1 : 404 "Chauffeur introuvable"

### Causes possibles :

1. **Le profil n'est pas sauvegardé** dans la base de données
2. **Le slug est incorrect** ou n'existe pas
3. **`is_public` est false** (la page ne s'affiche que si `is_public = true`)

### ✅ Solution étape par étape :

#### Étape 1 : Vérifier la base de données

1. Va sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Ouvre le "Table Editor"
3. Clique sur la table **`vtc_profiles`**
4. **Vérifie** :
   - Le profil existe-t-il ?
   - Le `slug` correspond-il à l'URL ?
   - `is_public` est-il `true` ? ✅

**Si le profil n'existe PAS** → Il faut le créer dans l'app

#### Étape 2 : Créer/Mettre à jour le profil dans l'app

1. Ouvre l'app
2. Va dans "Outils" → "Ma Page Publique"
3. **Remplis TOUS les champs obligatoires** :
   - ✅ Nom affiché (ex: "Jean Dupont")
   - ✅ Slug (ex: "jean-dupont")
4. Upload une photo (optionnel)
5. **IMPORTANT** : Clique sur **"Créer mon profil"** en bas
6. Attends le message "✅ Succès"

#### Étape 3 : Vérifier dans les logs

Quand tu cliques sur "Créer mon profil", tu devrais voir :

```
💾 Début sauvegarde du profil VTC...
✅ Validation OK
📝 Slug: jean-dupont
📝 Display name: Jean Dupont
🔓 Public: true
🖼️ Photo URL: https://...
☁️ Envoi vers Supabase...
✅ Profil sauvegardé avec succès !
🔗 URL du profil: https://corail-quotes-web.vercel.app/vtc/jean-dupont
```

#### Étape 4 : Vérifier que `is_public` est true

Dans Supabase Table Editor, vérifie que la colonne `is_public` est **cochée** (true).

Si elle est false :
```sql
UPDATE vtc_profiles 
SET is_public = true 
WHERE slug = 'ton-slug';
```

#### Étape 5 : Tester l'URL

Après sauvegarde, clique sur "Voir mon profil" dans l'app.

L'URL sera :
```
https://corail-quotes-web.vercel.app/vtc/ton-slug
```

Si tu vois encore "404 Chauffeur introuvable" :
- Copie le slug exact depuis la table Supabase
- Essaie l'URL manuellement dans Chrome/Safari
- Vérifie que le déploiement Vercel est terminé

---

## 🖼️ Problème 2 : Preview d'image ne fonctionne pas

### Cause :

React Native `Image` ne gère pas bien les URLs Supabase Storage.

### ✅ Solution : Utiliser `expo-image`

#### Option A : Si tu utilises Expo Go

`expo-image` est **déjà inclus** dans Expo Go ! Pas besoin d'installer.

#### Option B : Si tu n'utilises pas Expo Go

```bash
# Réparer npm d'abord (si erreur)
sudo chown -R $(whoami) ~/.npm

# Installer expo-image
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp
npx expo install expo-image
```

Puis je modifierai le code pour utiliser `expo-image` au lieu de `React Native Image`.

#### Alternative temporaire

En attendant `expo-image`, le preview montre maintenant :
- ✅ **Icône verte** avec "Photo OK" après upload
- 💬 Message "Photo uploadée ! Visible sur votre page publique."

La photo sera **visible sur la page web** même si le preview ne fonctionne pas dans l'app.

---

## 🎯 Checklist de debug

### Pour le 404 :

- [ ] As-tu cliqué sur "Créer mon profil" ?
- [ ] Le profil existe dans `vtc_profiles` (Supabase) ?
- [ ] `is_public = true` dans la table ?
- [ ] Le slug correspond à l'URL ?
- [ ] Les logs montrent "✅ Profil sauvegardé" ?

### Pour le preview :

- [ ] expo-image est installé ? (ou Expo Go utilisé ?)
- [ ] L'upload montre "✅ Photo uploadée" ?
- [ ] Les logs montrent "📡 Status: 200" ?
- [ ] La photo s'affiche sur la page web ?

---

## 🚀 Une fois tout réglé

1. ✅ Upload de photo → Fonctionne
2. ✅ Sauvegarde du profil → "✅ Profil créé !"
3. ✅ Page web → Plus de 404 !
4. ✅ Preview (avec expo-image) → L'image s'affiche

**Teste et envoie-moi les logs de sauvegarde !** 🔍



