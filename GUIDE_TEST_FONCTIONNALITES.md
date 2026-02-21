# Guide de test des fonctionnalités récentes

Comment tester dans l’app les fonctionnalités implémentées (getGroup, createPlanningEvent, notification → Devis, SMS devis).

---

## 1. Notification « Devis » → ouverture de l’écran Mes Devis

**Comportement attendu :** quand l’utilisateur reçoit une notification de type « devis accepté » ou « devis refusé » et appuie dessus, l’écran **Mes Devis** s’ouvre.

**Comment tester :**

1. Lancer l’app et te connecter.
2. Aller dans **Profil** → **Paramètres** (ou **Notifications** selon le menu).
3. Descendre jusqu’aux boutons de test.
4. Appuyer sur **« Test : notif devis (ouvre Mes Devis au tap) »**.
5. Attendre ~1 seconde : une notification « Devis accepté » doit apparaître.
6. **Mettre l’app en arrière-plan** (ou verrouiller l’écran), puis **appuyer sur la notification**.
7. L’app doit se rouvrir et l’écran **Mes Devis** doit s’afficher.

Si l’app est déjà au premier plan au moment du tap, l’écran Mes Devis peut s’ouvrir par-dessus l’écran actuel (modale).

---

## 2. getGroup(groupId)

**Comportement :** récupère le détail d’un groupe (nom, description, nombre de membres, etc.) par son ID.

**Comment tester :**

- **Depuis l’UI :** Ouvre **Profil** → **Groupes** → clique sur un groupe. L’écran de détail utilise déjà `getGroupMembers` et `getGroupPendingInvitations`. Pour vérifier `getGroup` spécifiquement, tu peux temporairement l’appeler au chargement de cet écran et logger le résultat (voir ci‑dessous).
- **En dev (optionnel) :** Dans `GroupDetailScreen.tsx`, au début de `loadMembers` (ou dans un `useEffect`), ajoute :
  ```ts
  const groupDetail = await apiClient.getGroup(group.id);
  console.log('getGroup result:', groupDetail);
  ```
  Puis ouvre un groupe depuis la liste et regarde les logs : tu dois voir l’objet retourné par `getGroup` (id, name, description, memberCount, color, icon).

---

## 3. createPlanningEvent(event)

**Comportement :** crée un événement dans le planning (table `planning_events`).

**Comment tester :**

- L’écran Planning actuel affiche les événements (courses, etc.) mais il n’y a pas encore de bouton « Ajouter un événement » qui appellerait `createPlanningEvent`. Pour tester quand même :
  1. Ouvre la console / logs de l’app.
  2. Depuis un écran qui a accès à `apiClient`, appelle par exemple (en temporaire, ex. dans un `useEffect` ou un bouton de debug) :
     ```ts
     await apiClient.createPlanningEvent({
       title: 'Test événement',
       event_type: 'OTHER',
       start_time: new Date().toISOString(),
       end_time: new Date(Date.now() + 3600000).toISOString(),
       notes: 'Test depuis l’app',
     });
     ```
  3. Va dans **Outils** → **Planning** et rafraîchis : le nouvel événement peut apparaître si l’écran charge bien les événements pour la plage de dates concernée.

Pour une vraie utilisation, il faudra ajouter dans l’UI un flux « Créer un événement » qui appelle `apiClient.createPlanningEvent(...)` avec les champs saisis.

---

## 4. SMS après création de devis (Edge Function send-quote-sms)

**Comportement :** à la création d’un devis avec un **numéro de téléphone client**, l’app appelle l’Edge Function Supabase `send-quote-sms`. Si la fonction n’existe pas ou échoue, la création du devis reste réussie (on log juste un warning).

**Comment tester :**

1. **Créer un devis avec un numéro :**
   - Va dans **Outils** (ou l’entrée qui mène à la création de devis).
   - Crée un devis en renseignant **téléphone client** (ex. ton numéro de test) en plus des autres champs obligatoires.
   - Envoie le devis.
2. **Vérifier l’appel côté app :**
   - Dans les logs Metro/console, cherche un message du type :  
     `⚠️ SMS non envoyé (Edge Function send-quote-sms absente ou erreur):`  
     → cela confirme que l’app a bien tenté d’appeler l’Edge Function.
3. **Vérifier côté Supabase (si tu as déployé la fonction) :**
   - Dans le dashboard Supabase : **Edge Functions** → logs de `send-quote-sms`.
   - Si la fonction est déployée avec un fournisseur SMS (ex. Twilio), le client doit recevoir un SMS avec le lien du devis.

Pour que le SMS parte vraiment, il faut déployer l’Edge Function `send-quote-sms` et configurer le fournisseur SMS (Twilio, etc.) dans la fonction.

---

## Récap

| Fonctionnalité              | Où tester dans l’app                          |
|----------------------------|-----------------------------------------------|
| Notification → Mes Devis   | Paramètres / Notifications → bouton « Test : notif devis » |
| getGroup                   | Ouvrir un groupe (détail) ; optionnel : appel + log dans GroupDetailScreen |
| createPlanningEvent        | Appel temporaire depuis le code (ou futur bouton « Ajouter événement ») |
| SMS devis                  | Créer un devis avec un numéro de téléphone, puis vérifier les logs / Edge Functions |
