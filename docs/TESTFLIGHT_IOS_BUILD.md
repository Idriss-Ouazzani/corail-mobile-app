# Rebuild Corail pour TestFlight (iOS)

Tu as déjà un compte Apple Developer. Voici comment rebuilder l’app et l’envoyer sur TestFlight.

## Prérequis

- Node.js installé
- Compte [Expo](https://expo.dev) (même compte que le projet EAS)
- Compte **Apple Developer** (99 €/an)
- **EAS CLI** : `npm install -g eas-cli` puis `eas login`

## 1. Lancer un build iOS production

À la racine du projet :

```bash
cd /chemin/vers/Corail-mobileapp
eas build --platform ios --profile production
```

- EAS va builder l’app dans le cloud.
- Tu peux suivre la progression sur [expo.dev](https://expo.dev) → ton projet → Builds.
- À la fin, tu obtiens un fichier `.ipa` (téléchargeable depuis le dashboard Expo).

## 2. Soumettre le build à TestFlight

**Option A – Soumission manuelle**

1. Télécharge l’`.ipa` depuis le dashboard Expo (lien à la fin du build).
2. Ouvre **Transporter** (App Store sur Mac) ou **Xcode** → Window → Organizer.
3. Envoie l’`.ipa` à App Store Connect (le build apparaîtra dans TestFlight après traitement).

**Option B – Soumission automatique avec EAS**

Une fois le build terminé :

```bash
eas submit --platform ios --profile production
```

- EAS te demandera de choisir le **dernier build** (ou un build spécifique).
- Il envoie ce build à App Store Connect pour toi.
- Tu peux aussi lancer build + submit d’un coup :

```bash
eas build --platform ios --profile production --auto-submit
```

(Il faut que le profil `production` dans `eas.json` ait la config de submit si tu utilises `--auto-submit`.)

## 3. Côté Apple (App Store Connect)

1. Va sur [App Store Connect](https://appstoreconnect.apple.com) → ton app Corail.
2. Onglet **TestFlight**.
3. Une fois le build traité (quelques minutes à ~30 min), il apparaît sous “iOS”.
4. Ajoute des testeurs internes (équipe) ou externes (groupes de test).
5. Les testeurs reçoivent une invitation par email et installent via **TestFlight**.

## Résumé des commandes

```bash
# Build iOS production
eas build --platform ios --profile production

# (Optionnel) Soumettre le dernier build à TestFlight
eas submit --platform ios --profile production
```

## Note sur le logo dans le “carré blanc”

Si le **premier écran** (splash natif iOS, carré blanc avec le logo) affiche encore un logo trop petit, c’est l’image **native** utilisée au tout premier lancement : `assets/splash-icon.png`.  
Pour l’agrandir :

- Remplace `assets/splash-icon.png` par une image où le logo Corail est plus grand (même dimensions recommandées, mais logo moins de marge).
- Puis refais un build : `eas build --platform ios --profile production`.

Les changements dans le code (composant `CoralLogo` et écrans Splash/Loading) agrandissent le logo **dès que l’app JavaScript est chargée** ; le tout premier écran blanc dépend uniquement de `splash-icon.png`.
