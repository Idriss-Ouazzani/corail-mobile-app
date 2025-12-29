# 👥 Guide : Mise en place des Groupes

## 🎯 **Objectif**

Implémenter un système complet de groupes avec :
- ✅ Création de groupes
- ✅ Gestion des membres
- ✅ Invitations par email
- ✅ Sauvegarde dans Databricks

---

## 📋 **Étape 1 : Créer les tables dans Databricks**

**Fichier :** `backend/create_groups_tables.sql`

1. Ouvre **Databricks SQL Editor**
2. **Copie tout le contenu** du fichier
3. **Colle dans l'éditeur**
4. Clique sur **"Run All"** ▶️

**Ce script va :**
- ✅ Créer la table `groups`
- ✅ Créer la table `group_members`
- ✅ Insérer 3 groupes de test
- ✅ Insérer des membres et invitations de test

**Vérifier :**
```sql
-- Voir tous les groupes
SELECT * FROM io_catalog.corail.groups;

-- Voir les membres de chaque groupe
SELECT 
  g.name as group_name,
  gm.role,
  gm.status,
  COALESCE(u.full_name, gm.email) as member_name
FROM group_members gm
JOIN groups g ON gm.group_id = g.id
LEFT JOIN users u ON gm.user_id = u.id
ORDER BY g.name, gm.role DESC;

-- Voir les invitations en attente
SELECT 
  g.name,
  gm.email,
  gm.invited_at
FROM group_members gm
JOIN groups g ON gm.group_id = g.id
WHERE gm.status = 'PENDING';
```

---

## 📋 **Étape 2 : Déployer le nouveau backend**

**Fichiers modifiés :**
- `backend/app/main.py` :
  - Ajout des modèles `Group`, `GroupMember`, `CreateGroupRequest`, `InviteToGroupRequest`
  - Nouveaux endpoints :
    - `GET /api/v1/groups` - Liste mes groupes
    - `POST /api/v1/groups` - Créer un groupe
    - `GET /api/v1/groups/{id}` - Détails d'un groupe
    - `POST /api/v1/groups/{id}/invite` - Inviter quelqu'un

**Commandes :**
```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp

git add -A

git commit -m "👥 Backend: Groupes + Invitations

- Tables groups et group_members
- Endpoints CRUD pour groupes
- Système d'invitations (status PENDING)
- Vérification permissions (seuls admins invitent)
- Documentation complète système invitations"

git push origin main
```

**Puis déployer sur Render :**
1. https://dashboard.render.com
2. `corail-backend`
3. **"Manual Deploy"** → **"Deploy latest commit"**
4. Attends 2-3 minutes

---

## 📋 **Étape 3 : Tester les endpoints**

### **3.1 - Obtenir un token Firebase**

Depuis l'app mobile, copie le token depuis les logs :
```
LOG 🔐 Token Firebase récupéré, longueur: 900
```

Ou dans le code :
```tsx
const token = await firebaseAuth.getIdToken();
console.log('Token:', token);
```

### **3.2 - Tester avec curl**

**Créer un groupe :**
```bash
curl -X POST https://corail-backend-6e5o.onrender.com/api/v1/groups \
  -H "Authorization: Bearer TON_TOKEN_FIREBASE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mon Super Groupe",
    "description": "Groupe de test",
    "icon": "🚕"
  }'
```

**Lister mes groupes :**
```bash
curl https://corail-backend-6e5o.onrender.com/api/v1/groups \
  -H "Authorization: Bearer TON_TOKEN_FIREBASE"
```

**Inviter quelqu'un :**
```bash
curl -X POST https://corail-backend-6e5o.onrender.com/api/v1/groups/GROUP_ID/invite \
  -H "Authorization: Bearer TON_TOKEN_FIREBASE" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

---

## 📋 **Étape 4 : Mettre à jour l'app mobile**

### **4.1 - Ajouter les endpoints dans `src/services/api.ts`**

```typescript
// Groupes
async getMyGroups(): Promise<Group[]> {
  const response = await this.client.get('/groups');
  return response.data;
}

async createGroup(group: CreateGroupRequest): Promise<{ success: boolean; group_id: string }> {
  const response = await this.client.post('/groups', group);
  return response.data;
}

async getGroupDetails(groupId: string): Promise<Group> {
  const response = await this.client.get(`/groups/${groupId}`);
  return response.data;
}

async inviteToGroup(groupId: string, email: string): Promise<{ success: boolean }> {
  const response = await this.client.post(`/groups/${groupId}/invite`, { email });
  return response.data;
}
```

### **4.2 - Modifier `GroupsScreen.tsx`**

Remplacer les données mock par des appels API :

```tsx
const [groups, setGroups] = useState<Group[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadGroups();
}, []);

const loadGroups = async () => {
  try {
    setLoading(true);
    const data = await apiClient.getMyGroups();
    setGroups(data);
  } catch (error) {
    Alert.alert('Erreur', 'Impossible de charger les groupes');
  } finally {
    setLoading(false);
  }
};

const handleCreateGroup = async (name: string, description: string, icon: string) => {
  try {
    await apiClient.createGroup({ name, description, icon });
    await loadGroups(); // Recharger
    Alert.alert('Succès', 'Groupe créé !');
  } catch (error) {
    Alert.alert('Erreur', 'Impossible de créer le groupe');
  }
};
```

### **4.3 - Modifier `GroupDetailScreen.tsx`**

```tsx
const handleInvite = async (email: string) => {
  try {
    const result = await apiClient.inviteToGroup(group.id, email);
    Alert.alert('Succès', result.message || 'Invitation envoyée !');
    // Recharger les détails du groupe
    onRefresh();
  } catch (error: any) {
    Alert.alert('Erreur', error.message || 'Impossible d\'inviter');
  }
};
```

---

## 📋 **Étape 5 : Afficher les invitations en attente**

### **5.1 - Ajouter l'endpoint backend**

```python
@app.get("/api/v1/groups/invitations")
async def get_my_invitations(user_id: str = CurrentUser):
    """
    Récupère les invitations en attente pour l'utilisateur
    """
    try:
        query = """
        SELECT 
            gm.id as invitation_id,
            g.id as group_id,
            g.name as group_name,
            g.description,
            g.icon,
            inviter.full_name as invited_by_name,
            gm.invited_at
        FROM group_members gm
        JOIN groups g ON gm.group_id = g.id
        LEFT JOIN users inviter ON gm.invited_by = inviter.id
        WHERE gm.user_id = :user_id AND gm.status = 'PENDING'
        ORDER BY gm.invited_at DESC
        """
        
        invitations = db.execute_query(query, {"user_id": user_id})
        return invitations
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/api/v1/groups/invitations/{invitation_id}/accept")
async def accept_invitation(
    invitation_id: str,
    user_id: str = CurrentUser
):
    """
    Accepter une invitation
    """
    try:
        # Vérifier que l'invitation appartient à l'utilisateur
        check_query = """
        SELECT group_id FROM group_members
        WHERE id = :invitation_id AND user_id = :user_id AND status = 'PENDING'
        """
        check = db.execute_query(check_query, {"invitation_id": invitation_id, "user_id": user_id})
        
        if not check:
            raise HTTPException(status_code=404, detail="Invitation non trouvée")
        
        # Accepter l'invitation
        update_query = """
        UPDATE group_members
        SET status = 'ACTIVE', accepted_at = CURRENT_TIMESTAMP(), updated_at = CURRENT_TIMESTAMP()
        WHERE id = :invitation_id
        """
        db.execute_non_query(update_query, {"invitation_id": invitation_id})
        
        return {
            "success": True,
            "message": "Invitation acceptée"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error accepting invitation: {str(e)}")
```

### **5.2 - Ajouter dans `GroupsScreen.tsx`**

```tsx
// Ajouter une section "Invitations en attente"
{invitations.length > 0 && (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>
      🔔 Invitations en attente ({invitations.length})
    </Text>
    {invitations.map((invitation) => (
      <View key={invitation.invitation_id} style={styles.invitationCard}>
        <Text style={styles.invitationIcon}>{invitation.icon}</Text>
        <View style={styles.invitationInfo}>
          <Text style={styles.invitationName}>{invitation.group_name}</Text>
          <Text style={styles.invitationInviter}>
            Invité par: {invitation.invited_by_name}
          </Text>
        </View>
        <View style={styles.invitationActions}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAcceptInvitation(invitation.invitation_id)}
          >
            <Text style={styles.acceptButtonText}>Accepter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => handleRejectInvitation(invitation.invitation_id)}
          >
            <Text style={styles.rejectButtonText}>Refuser</Text>
          </TouchableOpacity>
        </View>
      </View>
    ))}
  </View>
)}
```

---

## 🐛 **Dépannage**

### **Problème : "Seuls les admins peuvent inviter"**
**Cause :** Tu n'es pas admin du groupe.
**Solution :** Vérifie dans Databricks :
```sql
SELECT * FROM group_members WHERE group_id = 'GROUP_ID' AND user_id = 'TON_USER_ID';
-- Le role doit être 'ADMIN'
```

### **Problème : "Cet utilisateur est déjà membre"**
**Cause :** L'email est déjà dans le groupe.
**Solution :** Normal, c'est la protection contre les doublons !

### **Problème : Le groupe ne se crée pas**
**Cause :** Le backend n'a pas été redéployé.
**Solution :** Vérifie que le commit est sur GitHub et redéploie sur Render.

---

## ✅ **Checklist finale**

- [ ] Tables `groups` et `group_members` créées dans Databricks
- [ ] 3 groupes de test insérés
- [ ] Backend committé et déployé sur Render
- [ ] Endpoints testés avec curl
- [ ] `GroupsScreen` appelle l'API au lieu du mock data
- [ ] Création de groupe fonctionne
- [ ] Invitation fonctionne
- [ ] Les invitations apparaissent en BDD
- [ ] Section "Invitations en attente" affichée
- [ ] Boutons Accepter/Refuser fonctionnent

---

## 📊 **Architecture finale**

```
┌─────────────────┐
│   App Mobile    │
│   (React Native)│
└────────┬────────┘
         │
         │ Firebase Auth Token
         │
         ▼
┌─────────────────┐
│  FastAPI Backend│
│   (Render.com)  │
└────────┬────────┘
         │
         │ SQL Queries
         │
         ▼
┌─────────────────┐
│   Databricks    │
│  ┌───────────┐  │
│  │  groups   │  │
│  ├───────────┤  │
│  │group_mem..│  │
│  ├───────────┤  │
│  │   users   │  │
│  ├───────────┤  │
│  │   rides   │  │
│  └───────────┘  │
└─────────────────┘
```

---

🎊 **Une fois tout ça fait, les groupes seront 100% fonctionnels !**

**Pour les emails/notifications, voir** `INVITATIONS_SYSTEM.md`


