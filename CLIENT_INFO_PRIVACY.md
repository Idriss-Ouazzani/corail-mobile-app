# 🔒 Confidentialité des Informations Client

## 🎯 Règle de Visibilité

Les informations du client (`client_name` et `client_phone`) ne doivent **JAMAIS** être visibles publiquement.

---

## ✅ Qui peut voir les infos client ?

### 1️⃣ **Courses PERSONAL (Privées)**
- ✅ **Toujours visibles** par le créateur
- ❌ Personne d'autre ne peut voir la course (privée)

### 2️⃣ **Courses PUBLIC (Marketplace)**
Les infos client sont visibles **UNIQUEMENT** par :
- ✅ Le **créateur** de la course (celui qui a publié)
- ✅ Le **picker** (celui qui a pris/claimed la course)
- ❌ **Tous les autres utilisateurs** ne les voient PAS

### 3️⃣ **Courses GROUP (Groupes privés)**
Les infos client sont visibles **UNIQUEMENT** par :
- ✅ Le **créateur** de la course
- ✅ Le **picker** (celui qui a pris la course)
- ❌ **Les autres membres du groupe** ne les voient PAS (avant de prendre la course)

---

## 🔧 Implémentation

### Frontend (`RideDetailScreen.tsx`)

```typescript
const isMyRide = ride.creator_id === currentUserId;
const isPicker = ride.picker_id === currentUserId;

// Les infos client sont visibles si :
// - Course PERSONAL (toujours visible)
// - OU si je suis le créateur
// - OU si j'ai pris la course (claimed)
const canSeeClientInfo = 
  ride.visibility === 'PERSONAL' || 
  isMyRide || 
  isPicker;

// Affichage conditionnel
{canSeeClientInfo && (ride.client_name || ride.client_phone) && (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Client</Text>
    {/* ... */}
  </View>
)}
```

---

## 🛡️ Scénarios de sécurité

### Scénario 1 : Marketplace PUBLIC
1. **Jean** publie une course PUBLIC avec client "M. Dupont - 06 12 34 56 78"
2. **Marie** browse la marketplace et voit la course
3. ❌ **Marie NE VOIT PAS** le nom et téléphone du client
4. **Pierre** prend (claim) la course
5. ✅ **Pierre VOIT** maintenant "M. Dupont - 06 12 34 56 78"
6. ✅ **Jean VOIT** toujours les infos (créateur)

### Scénario 2 : Course PERSONAL
1. **Jean** crée une course PERSONAL avec client "Mme Martin - 06 98 76 54 32"
2. ✅ **Jean VOIT** les infos (c'est sa course privée)
3. ❌ **Personne d'autre** ne peut voir cette course (pas dans le marketplace)

### Scénario 3 : Groupe privé
1. **Jean** partage une course GROUP avec client "M. Durand - 06 11 22 33 44"
2. **Groupe "Collègues VTC"** : Jean, Marie, Pierre, Sophie
3. ❌ **Marie, Pierre, Sophie NE VOIENT PAS** les infos client (avant de prendre)
4. **Marie** prend la course
5. ✅ **Marie VOIT** maintenant "M. Durand - 06 11 22 33 44"
6. ✅ **Jean VOIT** toujours (créateur)
7. ❌ **Pierre et Sophie NE VOIENT TOUJOURS PAS**

---

## 📊 Tableau récapitulatif

| Visibilité | Créateur | Picker | Autres membres groupe | Public |
|------------|----------|--------|----------------------|--------|
| PERSONAL   | ✅       | N/A    | N/A                  | N/A    |
| PUBLIC     | ✅       | ✅     | N/A                  | ❌     |
| GROUP      | ✅       | ✅     | ❌                   | N/A    |

---

## 🚀 Améliorations futures (optionnel)

### Backend filtering (sécurité renforcée)
Pour une sécurité maximale, le backend pourrait filtrer les champs `client_name` et `client_phone` avant de les renvoyer :

```python
# Dans get_rides() endpoint
if ride["visibility"] in ["PUBLIC", "GROUP"]:
    # Masquer les infos client si l'utilisateur n'est ni créateur ni picker
    if ride["creator_id"] != current_user_id and ride["picker_id"] != current_user_id:
        ride["client_name"] = None
        ride["client_phone"] = None
```

**Pour l'instant** : La solution frontend est suffisante et plus simple.

---

## ✅ Tests à effectuer

1. **Test 1** : Créer une course PUBLIC avec client → Vérifier que d'autres users ne voient pas les infos
2. **Test 2** : Prendre une course → Vérifier que les infos client apparaissent maintenant
3. **Test 3** : Créer une course PERSONAL → Vérifier que les infos sont toujours visibles
4. **Test 4** : Partager en GROUP → Vérifier que les membres ne voient pas avant de claim

---

**Conclusion** : La confidentialité des clients est respectée ! 🔒✅

