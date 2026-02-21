# Build EAS pour l’App Store (iOS)

Tu as déjà un compte Apple Developer. Ce guide permet de lancer un build production iOS et de le soumettre à l’App Store.

## 1. Prérequis

- Compte **Expo** (expo.dev)
- Compte **Apple Developer** (déjà fait)
- **EAS CLI** installé

## 2. Installer EAS CLI (si besoin)

```bash
npm install -g eas-cli
```

## 3. Se connecter à Expo

```bash
eas login
```

(Utilise le même compte que sur expo.dev.)

## 4. Lancer le build iOS pour l’App Store

```bash
eas build --platform ios --profile production
```

- **Première fois** : EAS te demandera comment gérer les credentials Apple :
  - **« Let EAS handle it »** (recommandé) : EAS crée et gère certificats + provisioning profile.
  - **« I want to use my own »** : tu utilises ton compte Apple Developer (tu devras fournir un App Store Connect API Key ou te connecter via Apple ID).

- Si tu choisis « Let EAS handle it », connecte-toi avec ton **Apple ID** (celui du compte Developer) quand demandé. EAS créera un **Distribution Certificate** et un **Provisioning Profile** pour `com.corail.vtcmarketplace`.

## 5. Après le build

- Le build tourne sur les serveurs Expo (quelques minutes à ~20 min).
- À la fin, tu obtiens un **.ipa** téléchargeable ou un lien.
- Pour **soumettre directement à l’App Store** :

```bash
eas submit --platform ios --profile production
```

Tu devras sélectionner le dernier build ou fournir l’URL du build.  
*(Le profil `submit.production` est déjà présent dans ton `eas.json`.)*

## 6. Côté App Store Connect

1. Va sur [App Store Connect](https://appstoreconnect.apple.com).
2. Crée une **app** si ce n’est pas fait (bundle ID : `com.corail.vtcmarketplace`).
3. Renseigne fiche, captures d’écran, description, confidentialité, etc.
4. Après `eas submit`, la build apparaît dans la section **TestFlight** puis **Soumission pour révision** une fois que tu l’as choisie pour une version.

## Résumé des commandes

```bash
npm install -g eas-cli   # une fois
eas login                # une fois
eas build --platform ios --profile production
# puis après succès (optionnel) :
eas submit --platform ios --profile production
```

## Profil utilisé

- **production** dans `eas.json` :
  - `autoIncrement: true` → le build number iOS est incrémenté automatiquement.
  - `ios.simulator: false` → build pour appareil réel / App Store.
  - Variables d’env (Supabase, Firebase, Sentry, etc.) sont prises depuis les **secrets EAS** (à configurer sur expo.dev si pas déjà fait).

## Secrets EAS (variables d’environnement)

Sur [expo.dev](https://expo.dev) → ton projet → **Secrets**, ajoute les variables utilisées en production (ex. `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `FIREBASE_*`, `SENTRY_DSN`, etc.) pour que le build production les ait bien.
