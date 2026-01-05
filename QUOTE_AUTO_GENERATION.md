# ✨ Génération Automatique de Devis depuis une Course Personnelle

## 📋 Fonctionnalités Ajoutées

### 1. Toggle "Générer un devis automatiquement"
- **Emplacement** : Écran "Créer une course" (mode `PERSONAL`)
- **Comportement** :
  - Si activé, les champs "Nom du client" et "Téléphone du client" deviennent **obligatoires**
  - Un message d'aide s'affiche : "Un devis professionnel sera créé et vous pourrez l'envoyer au client par WhatsApp"

### 2. Validation Automatique
- Si le toggle est activé, le système vérifie que :
  - ✅ Nom du client renseigné
  - ✅ Téléphone du client renseigné
- Sinon, affiche une erreur : "Le nom et le téléphone du client sont requis pour générer un devis"

### 3. Création Automatique du Devis
- Après la création de la course, si le toggle est activé :
  - 📄 Crée automatiquement un devis via `apiClient.createQuote()`
  - 🔗 Génère un token unique et une URL publique
  - ✅ Affiche un message de succès : "Course et devis créés ! Vous pouvez maintenant l'envoyer via WhatsApp."

### 4. Numéro de Carte VTC
- **Migration SQL** : `008_add_vtc_card_number.sql`
  - Ajoute le champ `vtc_card_number` à la table `users`
- **Affichage** : Le numéro de carte VTC est maintenant affiché sur la page web du devis (si renseigné)
- **Profil** : Le chauffeur peut renseigner son numéro VTC dans "Informations personnelles"

---

## 🚀 Utilisation

### Étape 1 : Créer une course personnelle
1. Aller dans **Courses > Mes Courses**
2. Cliquer sur **"Créer une course"**
3. Remplir les informations de la course (départ, arrivée, prix, date/heure)

### Étape 2 : Activer le devis
1. Remplir **Nom du client** et **Téléphone du client**
2. Activer le toggle **"Générer un devis automatiquement"**
3. Cliquer sur **"Créer la course"**

### Étape 3 : Envoyer le devis
1. Un message de confirmation s'affiche
2. Le devis est créé automatiquement
3. Vous pouvez ensuite l'envoyer via WhatsApp depuis l'écran "Créer un devis" (dans "Outils")

---

## 🗂️ Fichiers Modifiés

### Mobile App
- `src/screens/CreateRideScreen.tsx`
  - Ajout du state `generateQuote`
  - Ajout du toggle dans l'UI
  - Modification de `handleCreate` pour créer le devis automatiquement
  - Validation des champs client si devis activé

### Base de Données
- `supabase/migrations/008_add_vtc_card_number.sql`
  - Ajout du champ `vtc_card_number` à la table `users`

### Page Web Devis
- `corail-quotes-web/app/q/[token]/page.tsx`
  - Récupération du champ `vtc_card_number`
  - Affichage conditionnel de la carte VTC

---

## 📝 Notes Techniques

### Données du Devis
Le devis est créé avec les informations suivantes :
```typescript
{
  client_name: string,
  client_phone: string,
  pickup_address: string,
  dropoff_address: string,
  scheduled_date: string, // Format: YYYY-MM-DD
  scheduled_time: string, // Format: HH:MM:SS
  price_cents: number,
  notes: string | undefined // Ex: "Distance: 25 km"
}
```

### Gestion des Erreurs
- Si la création du devis échoue, l'erreur est loggée dans la console
- Un message d'erreur s'affiche à l'utilisateur
- La course est quand même créée (le devis est optionnel)

---

## ✅ Tests à Effectuer

1. **Créer une course sans devis** : Vérifier que tout fonctionne normalement
2. **Créer une course avec devis** :
   - Sans nom/téléphone → Erreur attendue
   - Avec nom/téléphone → Devis créé automatiquement
3. **Vérifier l'affichage du devis** : Ouvrir le lien généré sur mobile
4. **Vérifier la carte VTC** : Si renseignée dans le profil, elle doit s'afficher sur le devis

---

## 🔄 Prochaines Étapes (Optionnel)

- [ ] Ajouter un écran "Mes Devis" pour voir l'historique
- [ ] Permettre de renvoyer un devis depuis l'historique
- [ ] Ajouter des statistiques sur les devis (acceptés, refusés, en attente)
- [ ] Notification push quand un client accepte un devis

