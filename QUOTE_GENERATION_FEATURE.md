# 📄 Fonctionnalité : Génération Automatique de Devis

## 🎯 Vue d'ensemble

Cette fonctionnalité permet de générer automatiquement un devis lors de la création d'une course personnelle. Le devis est lié à la course et son statut peut être suivi dans les détails de la course.

## ✨ Fonctionnalités

### 1. Toggle "Générer un devis" dans la création de course

**Emplacement** : `CreateRideScreen.tsx` - Section "Client (optionnel)"

**Comportement** :
- Le toggle n'apparaît que si le nom ET le téléphone du client sont renseignés
- Lorsqu'activé, un devis est automatiquement créé lors de la création de la course
- Le devis est envoyé par WhatsApp au client (fonctionnalité backend)

**Validation** :
- Si le toggle est activé mais que le nom ou le téléphone manque, une erreur est affichée
- Le devis est créé AVANT la course pour pouvoir lier les deux

### 2. Affichage du devis dans les détails de course

**Emplacement** : `RideDetailScreen.tsx` - Section "Devis"

**Informations affichées** :
- **Référence du devis** : Les 8 premiers caractères de l'ID en majuscules
- **Statut du devis** avec badge coloré :
  - 📤 **Envoyé** (SENT) - Bleu
  - 👁️ **Vu** (VIEWED) - Violet
  - ✅ **Validé** (ACCEPTED) - Vert
  - ❌ **Refusé** (REFUSED) - Rouge
- **Lien web** : Bouton pour ouvrir le devis en ligne (`https://corail.app/devis/{token}`)

## 🗄️ Base de données

### Modifications de la table `rides`

**Nouvelles colonnes** (Migration 015) :
```sql
- quote_id: TEXT              -- ID du devis associé
- quote_token: TEXT           -- Token public pour accéder au devis
- quote_status: TEXT          -- Statut: SENT, VIEWED, ACCEPTED, REFUSED
- client_name: TEXT           -- Nom du client
- client_phone: TEXT          -- Téléphone du client
```

### Types TypeScript

**Interface `Ride`** (`src/types/index.ts`) :
```typescript
export interface Ride {
  // ... autres champs
  quote_id?: string | null;
  quote_status?: 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REFUSED' | null;
  quote_token?: string | null;
  client_name?: string;
  client_phone?: string;
}
```

## 🔄 Flux de création

1. **Utilisateur remplit le formulaire de course**
   - Adresses de départ/arrivée
   - Prix, date, heure
   - Nom et téléphone du client

2. **Toggle "Générer un devis" activé**
   - Validation des champs client

3. **Création du devis** (API)
   ```typescript
   const quote = await apiClient.createQuote({
     client_name: clientName,
     client_phone: clientPhone,
     pickup_address: pickup,
     dropoff_address: dropoff,
     scheduled_date: 'YYYY-MM-DD',
     scheduled_time: 'HH:MM:SS',
     price_cents: priceInCents,
     notes: `Distance: ${distance} km`
   });
   ```

4. **Création de la course avec référence au devis**
   ```typescript
   const rideData = {
     // ... autres champs
     quote_id: quote.id,
     quote_token: quote.token,
     quote_status: 'SENT',
     client_name: clientName,
     client_phone: clientPhone
   };
   ```

5. **Confirmation à l'utilisateur**
   - "Course et devis créés avec succès !"
   - Ou "Course créée avec succès !" (sans devis)

## 📱 Interface utilisateur

### Toggle de génération de devis

```
┌─────────────────────────────────────────────────┐
│ 📄  Générer un devis                    ⚪→⚫   │
│     Envoi automatique par WhatsApp              │
└─────────────────────────────────────────────────┘
```

**Styles** :
- Fond : `rgba(245, 158, 11, 0.1)` (orange clair)
- Bordure : `rgba(245, 158, 11, 0.3)`
- Switch actif : `#f59e0b` (orange)

### Carte de devis dans les détails

```
┌─────────────────────────────────────────────────┐
│ Devis                                           │
│ ┌─────────────────────────────────────────────┐ │
│ │ 📄  Réf: ABCD1234                           │ │
│ │     ✅ Validé                               │ │
│ │     ─────────────────────────────────────   │ │
│ │     🔗 Voir le devis en ligne              │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## 🔧 Fichiers modifiés

1. **`src/screens/CreateRideScreen.tsx`**
   - Ajout du state `generateQuote`
   - Ajout du toggle UI après les champs client
   - Modification de `handleCreate` pour créer le devis
   - Ajout des styles pour le toggle

2. **`src/screens/RideDetailScreen.tsx`**
   - Ajout de la section "Devis" conditionnelle
   - Affichage de la référence, statut et lien
   - Ajout des styles pour la carte de devis

3. **`src/types/index.ts`**
   - Ajout des champs `quote_id`, `quote_token`, `quote_status`
   - Ajout des champs `client_name`, `client_phone`

4. **`supabase/migrations/015_add_quote_token_and_status.sql`**
   - Migration pour ajouter les nouvelles colonnes

## 🚀 Déploiement

### 1. Appliquer la migration Supabase

```bash
# Via Supabase CLI
supabase db push

# Ou manuellement dans le dashboard Supabase
# Exécuter le contenu de 015_add_quote_token_and_status.sql
```

### 2. Vérifier les colonnes

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rides' 
  AND column_name IN ('quote_id', 'quote_token', 'quote_status', 'client_name', 'client_phone');
```

### 3. Tester la fonctionnalité

1. Créer une nouvelle course personnelle
2. Renseigner nom et téléphone du client
3. Activer le toggle "Générer un devis"
4. Vérifier que le devis est créé
5. Consulter les détails de la course
6. Vérifier l'affichage de la section "Devis"

## 📝 Notes importantes

- Le devis est créé **avant** la course pour pouvoir lier les deux
- Si la création du devis échoue, la course est quand même créée (sans devis)
- Le lien du devis utilise le `quote_token` (pas l'ID)
- Le statut du devis peut être mis à jour via webhook (quand le client consulte/valide)

## 🔮 Améliorations futures

- [ ] Copier automatiquement le lien du devis dans le presse-papier
- [ ] Envoyer le devis par SMS en plus de WhatsApp
- [ ] Permettre de générer un devis après la création de la course
- [ ] Afficher l'historique des modifications du statut du devis
- [ ] Notification push quand le client consulte/valide le devis
- [ ] Statistiques sur les taux de conversion des devis

