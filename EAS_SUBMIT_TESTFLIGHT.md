# Publier en beta (TestFlight) après un build EAS

## 1. Soumettre le build à App Store Connect

À la racine du projet :

```bash
eas submit --platform ios --profile production --latest
```

- **`--latest`** : envoie le dernier build iOS production terminé avec succès.
- Sinon, sans `--latest`, EAS te propose de choisir un build dans la liste.

EAS te demandera selon ta config :
- **Apple ID** (compte Developer) + mot de passe ou **App-specific password** si 2FA activée.
- Ou **App Store Connect API Key** (si tu l’as déjà configurée).

Une fois la soumission terminée, le build est envoyé à Apple et apparaît dans **App Store Connect**.

---

## 2. Côté App Store Connect (TestFlight)

1. Va sur [App Store Connect](https://appstoreconnect.apple.com) → **Mes apps**.
2. Ouvre ton app **Corail** (ou crée-la si besoin, avec le bundle ID `com.corail.vtcmarketplace`).
3. Onglet **TestFlight**.
4. Sous **iOS**, ton build apparaît après traitement (souvent 5–15 min). Statut : “En traitement” puis “Prêt à tester”.
5. **Testeurs internes** (jusqu’à 100) : **TestFlight** → **Testeurs internes** → ajouter des membres de ton équipe (rôle Admin, Développeur, etc.).
6. **Testeurs externes** (beta publique ou liste d’emails) : **TestFlight** → **Testeurs externes** → créer un groupe, ajouter des emails. La première fois, Apple peut demander une courte “revue beta” (souvent rapide).

Les testeurs reçoivent un email et installent l’app via l’app **TestFlight** sur iPhone.

---

## Résumé

```bash
# Envoyer le dernier build en prod
eas submit --platform ios --profile production --latest
```

Puis dans App Store Connect → **TestFlight** : attendre “Prêt à tester”, puis ajouter testeurs internes ou externes.
