# 📱 Compatibilité Android - Corail App

## ⚠️ Problème avec Android 6

**Android 6 (API 23, sorti en 2015) peut poser problème** pour plusieurs raisons :

### 1. Expo SDK 54
- Expo SDK 54 supporte **Android 7.0+ (API 24)** minimum par défaut
- Android 6 (API 23) n'est **pas supporté** par Expo SDK 54
- Si tu installes l'app sur Android 6, tu risques l'erreur **"failed to analyse the package"**

### 2. Bibliothèques modernes
- Firebase, Supabase, et autres dépendances modernes peuvent ne pas fonctionner correctement sur Android 6
- Certaines fonctionnalités peuvent manquer ou causer des crashes

### 3. Play Store
- Google Play recommande fortement **Android 8.0 (API 26)** minimum
- Les nouvelles apps doivent cibler des versions récentes

---

## ✅ Solution recommandée : Android 8.0+ (API 26)

**Configuration actuelle :**
- `minSdkVersion: 26` (Android 8.0)
- Compatible avec Play Store
- Supporte ~95% des appareils Android actifs
- Compatible avec toutes les bibliothèques modernes

**Avantages :**
- ✅ Pas de problèmes de compatibilité
- ✅ Toutes les fonctionnalités modernes disponibles
- ✅ Conforme aux exigences Play Store
- ✅ Meilleures performances et sécurité

**Inconvénients :**
- ❌ Les appareils Android 6 et 7 ne pourront pas installer l'app
- Mais c'est seulement ~5% des utilisateurs Android

---

## 🔧 Si tu veux vraiment supporter Android 6

**ATTENTION :** Ce n'est **pas recommandé** car :

1. **Expo SDK 54 ne supporte pas officiellement Android 6**
2. **Risque de bugs** avec les bibliothèques modernes
3. **Plus de maintenance** nécessaire
4. **Play Store peut rejeter** l'app si trop de problèmes

### Option : Forcer Android 6 (non recommandé)

Si tu veux quand même essayer, modifie `app.config.js` :

```javascript
plugins: [
  // ...
  [
    'expo-build-properties',
    {
      android: {
        minSdkVersion: 23, // Android 6.0 - NON RECOMMANDÉ
        compileSdkVersion: 34,
        targetSdkVersion: 34,
      },
    },
  ],
],
```

**Puis installe le plugin :**
```bash
npx expo install expo-build-properties
```

**Risques :**
- L'app peut ne pas compiler
- L'app peut crasher sur Android 6
- Certaines fonctionnalités peuvent ne pas marcher
- Play Store peut rejeter l'app

---

## 📊 Statistiques Android (2024)

| Version Android | API Level | % d'appareils | Supporté ? |
|----------------|-----------|---------------|------------|
| Android 6 (Marshmallow) | 23 | ~2% | ❌ Non recommandé |
| Android 7 (Nougat) | 24-25 | ~3% | ⚠️ Limite |
| Android 8 (Oreo) | 26-27 | ~8% | ✅ Oui |
| Android 9 (Pie) | 28 | ~12% | ✅ Oui |
| Android 10+ | 29+ | ~75% | ✅ Oui |

**Conclusion :** En supportant Android 8.0+, tu couvres **~95% des utilisateurs Android**.

---

## 🎯 Recommandation finale

**Utilise Android 8.0 (API 26) minimum** :

1. ✅ Compatible avec Expo SDK 54
2. ✅ Compatible avec toutes tes bibliothèques
3. ✅ Conforme aux exigences Play Store
4. ✅ Couvre 95% des utilisateurs
5. ✅ Moins de bugs et de maintenance

**Si un testeur a Android 6 :**
- Explique-lui que l'app nécessite Android 8.0 minimum
- Propose-lui de tester sur un appareil plus récent
- Ou mets à jour son appareil si possible

---

## 🔄 Comment changer la version minimale

### Installer le plugin (si pas déjà fait)
```bash
npx expo install expo-build-properties
```

### Configuration actuelle (Android 8.0+)
Le fichier `app.config.js` contient déjà :
```javascript
plugins: [
  [
    'expo-build-properties',
    {
      android: {
        minSdkVersion: 26, // Android 8.0
        compileSdkVersion: 34,
        targetSdkVersion: 34,
      },
    },
  ],
],
```

### Pour changer à Android 6 (non recommandé)
Change `minSdkVersion: 26` en `minSdkVersion: 23`

---

## ✅ Checklist

- [x] Configuration Android 8.0+ (API 26) dans `app.config.js`
- [ ] Plugin `expo-build-properties` installé
- [ ] Build testé avec la nouvelle configuration
- [ ] Testeurs informés de la version minimale requise

---

## 🚀 Prochaines étapes

1. **Installer le plugin** :
   ```bash
   npx expo install expo-build-properties
   ```

2. **Lancer un build de test** :
   ```bash
   eas build --platform android --profile production
   ```

3. **Tester sur un appareil Android 8.0+** pour vérifier que tout fonctionne

4. **Si tout est OK**, publier sur Play Store avec cette configuration

---

**💡 Conseil :** Ne te complique pas la vie avec Android 6. Android 8.0+ est le standard aujourd'hui et couvre presque tous les utilisateurs actifs.

