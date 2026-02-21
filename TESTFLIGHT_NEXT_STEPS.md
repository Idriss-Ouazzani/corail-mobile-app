# TestFlight : étapes après l’upload

Ton build est en cours de traitement par Apple. Quand c’est terminé (souvent 5–15 min), tu reçois un email et le build apparaît en **« Prêt à tester »**.

## 1. Vérifier le build

- Ouvre : **https://appstoreconnect.apple.com/apps/6759494730/testflight/ios**
- Attends que le statut du build soit **« Prêt à tester »** (plus « En traitement »).

---

## 2. Ajouter des testeurs

### Testeurs internes (recommandé pour commencer)

- Jusqu’à **100** personnes.
- Pas de revue Apple, disponible tout de suite.
- Ils doivent être ajoutés dans **Utilisateurs et accès** avec le rôle **Admin** ou **Développeur** (ou avoir un rôle avec accès à l’app).

**Où :** TestFlight → **Testeurs internes** → **+** pour ajouter des membres de ton équipe.

Chaque testeur reçoit un email et installe l’app via l’app **TestFlight** sur iPhone.

---

### Testeurs externes (amis, clients, bêta publique)

- Jusqu’à **10 000** testeurs par groupe.
- **Première fois** : Apple fait une **revue bêta** (souvent 24–48 h), puis les builds suivants du même groupe sont en général plus rapides.
- Tu crées un **groupe** et tu ajoutes des emails (ou tu actives la bêta publique).

**Où :** TestFlight → **Testeurs externes** → **Créer un groupe** (ex. « Bêta Corail ») → ajouter les adresses email.

Tu peux aussi activer **« Bêta publique »** : un lien public permet à n’importe qui d’installer la bêta (toujours après la revue bêta la première fois).

---

## 3. Infos à remplir (si demandé)

Pour les **testeurs externes**, Apple peut demander :

- **Informations sur la bêta** : description de ce que les testeurs doivent tester (ex. « Test de l’app Corail chauffeurs VTC »).
- **Contact** : email pour les retours.
- **URL de confidentialité** : si ton app collecte des données (ex. page confidentialité de getcorail.com).

Tu remplis ça dans l’écran du groupe de testeurs externes ou quand tu actives la bêta publique.

---

## 4. Plus tard : publier sur l’App Store (pas bêta)

Quand tu veux mettre l’app en vente / en téléchargement public :

1. Dans App Store Connect → ton app → **App Store** (pas TestFlight).
2. Crée une **version** (ex. 1.0.0) si ce n’est pas fait.
3. Renseigne **fiche**, **captures d’écran**, **description**, **confidentialité**, etc.
4. Dans **Build**, choisis le build TestFlight que tu veux (celui que tu viens d’envoyer ou un plus récent).
5. Envoie en **soumission pour révision**.
6. Après validation par Apple (souvent 24–48 h), tu peux **mettre en ligne** l’app.

---

## Résumé

| Étape | Où |
|--------|-----|
| Voir le build prêt | [TestFlight iOS](https://appstoreconnect.apple.com/apps/6759494730/testflight/ios) |
| Ajouter testeurs internes | TestFlight → Testeurs internes → + |
| Ajouter testeurs externes | TestFlight → Testeurs externes → Créer un groupe |
| Plus tard : App Store | App Store → Nouvelle version → Choisir le build → Soumettre |

Une fois le build « Prêt à tester », ajoute tes premiers testeurs en **Testeurs internes**, puis en **Testeurs externes** si tu veux faire tester en plus large.
