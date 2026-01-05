# 👥 Système de Gestion de Groupes - Guide Complet

## 🚧 État actuel

### ❌ Problèmes identifiés

1. **Badges disparus** : Section badges n'apparaît pas (probablement `userBadges.length === 0`)
2. **Données mock dans GroupDetailScreen** : Hassan Al Masri et 4 autres personnes hardcodés
3. **Pas de vraie gestion de membres** : Impossible d'inviter, accepter, refuser, quitter

---

## ✅ Solutions implémentées

### 1️⃣ Migration SQL créée

**Fichier** : `supabase/migrations/017_group_invitations.sql`

**Nouvelles tables** :
- `group_invitations` : Invitations pour rejoindre un groupe

**Nouvelles colonnes** :
- `groups.color` : Couleur du groupe
- `groups.icon` : Icône du groupe

**RLS (Row Level Security)** :
- Utilisateurs peuvent voir leurs invitations
- Admins peuvent créer des invitations
- Invités peuvent répondre à leurs invitations

---

### 2️⃣ API complète créée

**Fonctions dans `supabaseApi.ts`** :

#### `getGroupMembers(groupId)`
- Récupère tous les membres d'un groupe
- Retourne : `id`, `name`, `email`, `phone`, `role`, `isAdmin`, `isCurrentUser`

#### `inviteToGroup({ groupId, email?, phone? })`
- Invite un utilisateur par email ou téléphone
- Vérifie que l'inviteur est admin
- Cherche si l'utilisateur existe déjà
- Crée une invitation PENDING

#### `getMyGroupInvitations()`
- Récupère toutes les invitations en attente de l'utilisateur
- Basé sur `invitee_id` ou `invitee_email`

#### `respondToInvitation(invitationId, accept)`
- Accepte ou refuse une invitation
- Si accepté → ajoute l'utilisateur comme MEMBER
- Met à jour le statut de l'invitation

#### `leaveGroup(groupId)`
- Permet à un utilisateur de quitter un groupe
- Vérifie qu'il n'est pas le seul admin
- Supprime l'entrée `group_members`

#### `removeMemberFromGroup(groupId, userId)`
- Permet à un admin de retirer un membre
- Vérifie que l'utilisateur actuel est admin
- Supprime le membre du groupe

---

## 📋 Prochaines étapes

### 🔴 URGENT : À faire maintenant

1. **Appliquer la migration SQL** dans Supabase Dashboard
   ```sql
   -- Copier/coller le contenu de 017_group_invitations.sql
   ```

2. **Refaire GroupDetailScreen** avec les vraies données
   - Remplacer les données mock
   - Utiliser `getGroupMembers()`
   - Afficher si l'utilisateur est admin
   - Boutons fonctionnels (Inviter, Quitter, Retirer)

3. **Corriger les badges**
   - Vérifier pourquoi `userBadges.length === 0`
   - Ajouter des logs dans `loadBadges`
   - S'assurer que l'utilisateur a des badges assignés dans Supabase

4. **Créer écran d'invitations**
   - Afficher les invitations en attente
   - Boutons Accepter / Refuser
   - Notifications push

---

## 🎨 Design des permissions

### Rôles

- **ADMIN** : Créateur du groupe ou promu admin
  - Peut inviter des membres
  - Peut retirer des membres
  - Peut promouvoir d'autres membres en admin
  - Peut supprimer le groupe

- **MEMBER** : Membre régulier
  - Peut voir les membres
  - Peut inviter des membres (si activé)
  - Peut quitter le groupe

### Restrictions

- ❌ Un utilisateur ne peut pas quitter s'il est le seul admin
- ❌ Un membre ne peut pas retirer d'autres membres
- ❌ Un admin ne peut pas se retirer lui-même s'il est le seul admin

---

## 📱 Flux d'invitation

### Scénario 1 : Utilisateur existant

```
Admin clique "Inviter" 
  → Entre email utilisateur
  → Système trouve l'utilisateur dans la DB
  → Crée invitation avec invitee_id
  → Utilisateur reçoit notification
  → Utilisateur accepte/refuse
  → Si accepté → ajouté au groupe
```

### Scénario 2 : Utilisateur non inscrit

```
Admin clique "Inviter"
  → Entre email/téléphone
  → Système ne trouve pas l'utilisateur
  → Crée invitation avec invitee_email/phone seulement
  → Email/SMS envoyé avec lien d'inscription
  → Utilisateur s'inscrit
  → Au premier login → invitations associées automatiquement
  → Utilisateur accepte/refuse
```

---

## 🗄️ Structure de la base de données

### Table `groups`
```sql
id                TEXT PRIMARY KEY
name              TEXT NOT NULL
description       TEXT
creator_id        TEXT (FK users)
is_public         BOOLEAN
color             TEXT
icon              TEXT
created_at        TIMESTAMPTZ
updated_at        TIMESTAMPTZ
```

### Table `group_members`
```sql
id                UUID PRIMARY KEY
group_id          TEXT (FK groups)
user_id           TEXT (FK users)
role              TEXT ('ADMIN' | 'MEMBER')
joined_at         TIMESTAMPTZ
```

### Table `group_invitations`
```sql
id                TEXT PRIMARY KEY
group_id          TEXT (FK groups)
inviter_id        TEXT (FK users)
invitee_email     TEXT
invitee_phone     TEXT
invitee_id        TEXT (FK users) nullable
status            TEXT ('PENDING' | 'ACCEPTED' | 'REFUSED')
created_at        TIMESTAMPTZ
responded_at      TIMESTAMPTZ
```

---

## 🔧 Utilisation de l'API

### Exemple : Inviter un membre

```typescript
import { apiClient } from '../services/api';

// Inviter par email
await apiClient.inviteToGroup({
  groupId: 'group-abc123',
  email: 'user@example.com'
});

// Inviter par téléphone
await apiClient.inviteToGroup({
  groupId: 'group-abc123',
  phone: '+33612345678'
});
```

### Exemple : Récupérer les membres

```typescript
const members = await apiClient.getGroupMembers('group-abc123');

// Résultat :
[
  {
    id: 'user1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+33612345678',
    role: 'ADMIN',
    isAdmin: true,
    isCurrentUser: true,
    joined_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 'user2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'MEMBER',
    isAdmin: false,
    isCurrentUser: false,
    joined_at: '2024-01-16T14:20:00Z'
  }
]
```

### Exemple : Quitter un groupe

```typescript
try {
  await apiClient.leaveGroup('group-abc123');
  Alert.alert('Succès', 'Vous avez quitté le groupe');
} catch (error) {
  if (error.message.includes('seul administrateur')) {
    Alert.alert('Erreur', 'Nommez un autre admin avant de quitter');
  }
}
```

---

## 📊 Statistiques

```
Fichiers modifiés : 3
Nouvelles fonctions API : 6
Lignes de code ajoutées : ~350
Migration SQL : 1 fichier

Fonctionnalités ajoutées :
✅ Invitations de groupe
✅ Gestion des membres
✅ Permissions ADMIN/MEMBER
✅ Quitter un groupe
✅ Retirer des membres
```

---

## ⚠️ Important

**AVANT de tester** :
1. Appliquer la migration `017_group_invitations.sql` dans Supabase
2. Refaire `GroupDetailScreen.tsx` (actuellement avec données mock)
3. Créer l'écran des invitations en attente
4. Configurer les notifications push pour les invitations

---

## 🎯 TODO immédiat

- [ ] Appliquer migration SQL
- [ ] Refaire GroupDetailScreen
- [ ] Corriger affichage badges
- [ ] Créer écran invitations
- [ ] Ajouter notifications push
- [ ] Tests end-to-end

