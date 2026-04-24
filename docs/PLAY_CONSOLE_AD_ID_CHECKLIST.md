# Checklist : déclaration identifiant publicitaire (Google Play)

Alignement avec les exigences officielles pour passer l’examen sans erreur « Déclaration incomplète ».

Référence : [Advertising ID - Play Console Help](https://support.google.com/googleplay/android-developer/answer/6048248)

---

## 1. Côté app (déjà en place)

- [x] **Manifeste** : la permission `com.google.android.gms.permission.AD_ID` est déclarée dans `app.config.js` → section `expo.android.permissions`.
- [x] **Cible Android** : l’app cible Android 13+ (targetSdkVersion 35) → la déclaration est obligatoire.

Règle Google : *« When apps update their target to Android 13 or above they need to declare [the AD_ID permission] in the manifest file. »*

---

## 2. Côté Play Console (à faire avant d’envoyer pour examen)

1. **Où aller**  
   Play Console → ton app → **Contenu de l’application** (menu gauche, en bas) → **Identifiant publicitaire**.

2. **Modifier la déclaration**  
   Clique sur **« Modifier la déclaration »**.

3. **Question : « Votre appli utilise-t-elle un identifiant publicitaire ? »**  
   Choisir **Oui**.  
   (Si le manifeste contient la permission AD_ID, la réponse doit être « Oui », sinon Google affiche « déclaration incomplète ».)

4. **À quelles fins votre appli utilise-t-elle l’identifiant publicitaire ?**  
   Cocher **uniquement** ce qui correspond à l’app, par exemple :
   - **Analytics** (notre cas : service analytics dans l’app, même no-op)
   - Ne pas cocher « Publicité » si l’app n’affiche pas de pubs.

5. **Enregistrer / Soumettre**  
   Valider la déclaration (bouton Enregistrer ou équivalent) pour qu’elle soit prise en compte à l’examen.

---

## 3. Ordre recommandé avant un build

1. Vérifier que `app.config.js` contient bien `com.google.android.gms.permission.AD_ID` dans `expo.android.permissions`.
2. Lancer le build EAS (ex. `eas build --platform android --profile <profil>`).
3. **Avant** d’envoyer la version pour examen : compléter la déclaration identifiant publicitaire comme ci‑dessus (Oui + buts, ex. Analytics).
4. Uploader l’AAB sur la piste voulue (ex. Alpha / production).
5. Envoyer les modifications pour examen.

---

## 4. En cas de doute

- **« Ma déclaration est déjà sur Non »**  
  Si le manifeste a la permission AD_ID (ou qu’une dépendance l’ajoute), Google exige que la déclaration soit **Oui**. Passer à « Oui » + but(s) (ex. Analytics) aligne manifeste et déclaration.

- **« Je n’utilise pas la pub »**  
  Choisir « Oui » avec uniquement **Analytics** (ou autre but pertinent) est conforme. Tu n’as pas à cocher « Publicité » si tu n’affiches pas de publicité.

- **Référence**  
  [Advertising ID - Play Console Help](https://support.google.com/googleplay/android-developer/answer/6048248)
