# 🎯 Fonctionnalité : Validation manuelle des courses

## 📋 Besoins utilisateur

### 1. **Paramètre de validation**
Lors de la publication d'une course, le créateur peut choisir :
- ✅ **Automatique** : La course peut être prise immédiatement par n'importe qui (comme actuellement)
- 🔒 **Validation manuelle** : Le créateur doit valider les demandes

### 2. **Gestion des demandes**
- Voir toutes les demandes de prise de course
- Choisir qui valider
- Notifier les personnes validées/refusées

### 3. **Contact du preneur**
Une fois la course prise/validée :
- Voir le nom complet du preneur
- Contacter via WhatsApp
- Contacter via appel téléphonique

---

## 🏗️ Architecture technique

### Modifications Backend (Supabase)

#### 1. **Nouveaux statuts de course**
```typescript
// AVANT
type RideStatus = 'PUBLISHED' | 'CLAIMED' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED'

// APRÈS
type RideStatus = 
  | 'PUBLISHED'      // Course publiée, disponible
  | 'PENDING'        // Demandes en attente de validation (nouveau)
  | 'CLAIMED'        // Course prise/validée
  | 'COMPLETED'      // Course terminée
  | 'CANCELLED'      // Course annulée
  | 'EXPIRED'        // Course expirée
```

#### 2. **Nouveau champ dans `rides`**
```sql
ALTER TABLE rides ADD COLUMN requires_approval BOOLEAN DEFAULT false;
```

#### 3. **Nouvelle table `ride_requests`**
```sql
CREATE TABLE ride_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES users(id),
  UNIQUE(ride_id, requester_id)
);

CREATE INDEX idx_ride_requests_ride_id ON ride_requests(ride_id);
CREATE INDEX idx_ride_requests_requester_id ON ride_requests(requester_id);
CREATE INDEX idx_ride_requests_status ON ride_requests(status);
```

### Modifications Frontend

#### 1. **Types TypeScript** (`src/types/index.ts`)
```typescript
// Nouveau statut
export type RideStatus = 
  | 'PUBLISHED' 
  | 'PENDING' 
  | 'CLAIMED' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'EXPIRED';

// Statut de demande
export type RideRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// Interface de demande
export interface RideRequest {
  id: string;
  ride_id: string;
  requester_id: string;
  status: RideRequestStatus;
  message?: string;
  created_at: string;
  updated_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  requester?: Partial<User>; // Infos du demandeur
  ride?: Partial<Ride>;       // Infos de la course
}

// Mise à jour de Ride
export interface Ride {
  // ... champs existants
  requires_approval?: boolean; // Nouveau champ
  pending_requests_count?: number; // Nombre de demandes en attente
}
```

#### 2. **API Supabase** (`src/services/supabaseApi.ts`)
Nouvelles méthodes :
- `createRideRequest(rideId, message?)` - Créer une demande
- `getRideRequests(rideId)` - Lister les demandes pour une course
- `getMyRideRequests()` - Mes demandes envoyées
- `approveRideRequest(requestId)` - Approuver une demande
- `rejectRideRequest(requestId, reason?)` - Rejeter une demande

#### 3. **UI/UX**

##### A. **Lors de la publication** (`PublishRideModal.tsx`)
```tsx
// Nouveau toggle
<View>
  <Text>Validation manuelle</Text>
  <Switch 
    value={requiresApproval}
    onValueChange={setRequiresApproval}
  />
  <Text style={styles.hint}>
    {requiresApproval 
      ? "Vous devrez valider les demandes manuellement"
      : "La course sera prise automatiquement par le premier"
    }
  </Text>
</View>
```

##### B. **Lors de la prise de course** (`MarketplaceRidesList.tsx`)
```tsx
// Si requires_approval = true
onPress={() => {
  if (ride.requires_approval) {
    // Ouvrir modal de demande
    showRequestModal(ride);
  } else {
    // Prise automatique (comportement actuel)
    handleClaimRide(ride);
  }
}}

// Modal de demande
<Modal visible={showRequestModal}>
  <Text>Demander cette course</Text>
  <TextInput 
    placeholder="Message pour le créateur (optionnel)"
    value={requestMessage}
    onChangeText={setRequestMessage}
  />
  <Button onPress={sendRequest}>Envoyer la demande</Button>
</Modal>
```

##### C. **Gestion des demandes** (Nouvel écran ou section)
**Option 1 : Nouvel onglet dans la navigation**
```
📱 Bottom Navigation:
- Courses (Marketplace)
- Planning (Mes courses)
- 🆕 Demandes (Ride Requests) <- NOUVEAU
- Profil
```

**Option 2 : Badge sur "Planning" avec section dédiée**
```
Planning
├── Mes courses publiées
│   └── [Course avec 3 demandes] <- Badge "3"
└── 🆕 Demandes à valider (5) <- Section
```

**Option 3 : Modal depuis le détail de la course**
```
RideDetailScreen (ma course publiée)
└── [Bouton "Voir les demandes (3)"]
    └── Modal avec liste des demandes
```

##### D. **Contact du preneur** (`RideDetailScreen.tsx`)
```tsx
{ride.status === 'CLAIMED' && ride.picker && (
  <View style={styles.pickerSection}>
    <Text style={styles.sectionTitle}>Course prise par</Text>
    <View style={styles.pickerCard}>
      <View style={styles.pickerInfo}>
        <Text style={styles.pickerName}>{ride.picker.full_name}</Text>
        <Text style={styles.pickerRating}>⭐ {ride.picker.rating}</Text>
      </View>
      
      <View style={styles.contactButtons}>
        {/* WhatsApp */}
        <TouchableOpacity 
          onPress={() => openWhatsApp(ride.picker.phone)}
          style={styles.contactButton}
        >
          <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
          <Text>WhatsApp</Text>
        </TouchableOpacity>
        
        {/* Appel */}
        <TouchableOpacity 
          onPress={() => openPhone(ride.picker.phone)}
          style={styles.contactButton}
        >
          <Ionicons name="call" size={24} color="#10b981" />
          <Text>Appeler</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
)}
```

---

## 🚀 Plan d'implémentation (Baby Steps)

### **Étape 1 : Types et Backend**
1. ✅ Mettre à jour les types TypeScript
2. ✅ Créer les méthodes API Supabase
3. ✅ Tester les méthodes API

### **Étape 2 : Publication avec validation**
1. ✅ Ajouter le toggle "requires_approval" dans `PublishRideModal`
2. ✅ Mettre à jour `createRide` pour inclure ce paramètre
3. ✅ Tester la publication

### **Étape 3 : Demande de course**
1. ✅ Modifier `handleClaimRide` pour vérifier `requires_approval`
2. ✅ Créer le modal de demande
3. ✅ Implémenter `sendRideRequest`
4. ✅ Tester l'envoi de demandes

### **Étape 4 : Gestion des demandes**
1. ✅ Choisir l'option UI (à discuter)
2. ✅ Créer l'écran/section de gestion
3. ✅ Lister les demandes
4. ✅ Implémenter validation/rejet
5. ✅ Tester le flow complet

### **Étape 5 : Contact du preneur**
1. ✅ Ajouter la section "Preneur" dans `RideDetailScreen`
2. ✅ Implémenter les boutons WhatsApp/Appel
3. ✅ Tester les liens de contact

---

## 🤔 Questions à clarifier

### 1. **Emplacement de la gestion des demandes**
Quelle option préfères-tu ?
- **Option A** : Nouvel onglet "Demandes" dans la navigation (comme un 5ème onglet)
- **Option B** : Section dans "Planning" avec badge de notification
- **Option C** : Bouton dans le détail de chaque course publiée

### 2. **Notifications**
Veux-tu des notifications push pour :
- ✅ Nouvelle demande reçue ?
- ✅ Demande approuvée ?
- ✅ Demande rejetée ?

### 3. **Limite de demandes**
- Un utilisateur peut-il demander plusieurs courses en même temps ?
- Limiter à X demandes en attente maximum ?

### 4. **Message lors de la demande**
- Message obligatoire ou optionnel ?
- Limite de caractères ?

### 5. **Auto-annulation**
- Rejeter automatiquement les autres demandes quand une est approuvée ?
- Ou laisser le créateur rejeter manuellement ?

---

## 📊 Estimation

| Étape | Temps estimé | Complexité |
|-------|-------------|------------|
| Étape 1 : Types & Backend | 30 min | 🟢 Facile |
| Étape 2 : Publication | 20 min | 🟢 Facile |
| Étape 3 : Demande | 45 min | 🟡 Moyen |
| Étape 4 : Gestion | 1h30 | 🔴 Complexe |
| Étape 5 : Contact | 30 min | 🟢 Facile |
| **TOTAL** | **~3h30** | |

---

## ✅ Prêt à commencer ?

Dis-moi :
1. Quelle option UI tu préfères pour la gestion des demandes (A, B ou C) ?
2. Réponses aux questions de clarification ci-dessus
3. Je commence par l'étape 1 ? 🚀

