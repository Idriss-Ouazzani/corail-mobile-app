# 🏆 Système de Badges & Gamification - Corail

## 📋 Vue d'ensemble

Le système de badges gamifie l'expérience utilisateur en récompensant les actions, accomplissements et jalons atteints sur la plateforme.

---

## 🗄️ Structure de la base de données

### Table `badges`
Contient tous les badges disponibles dans l'application.

```sql
io_catalog.vtcmarket.badges
├── id (STRING, PRIMARY KEY)
├── name (STRING) - Nom du badge
├── description (STRING) - Description
├── icon (STRING) - Nom de l'icône Ionicons
├── color (STRING) - Couleur hex (#ff6b47)
├── rarity (STRING) - COMMON | RARE | EPIC | LEGENDARY
├── category (STRING) - ACTIVITY | ACHIEVEMENT | MILESTONE | SPECIAL
├── requirement_description (STRING) - Comment l'obtenir
└── created_at (TIMESTAMP)
```

### Table `user_badges`
Associe les badges obtenus aux utilisateurs.

```sql
io_catalog.vtcmarket.user_badges
├── id (STRING, PRIMARY KEY)
├── user_id (STRING) - ID Firebase du user
├── badge_id (STRING) - Référence à badges.id
├── earned_at (TIMESTAMP) - Date d'obtention
└── progress (INT, nullable) - Pour badges à progression
```

---

## 🎨 Catégories de badges

### 🌟 SPECIAL (Rareté: LEGENDARY)
- **Early Adopter** - Premiers utilisateurs
- **Founder** - Membres fondateurs
- **Platinum VIP** - Abonnés Platinum

### 🚗 ACTIVITY (Rareté: COMMON → EPIC)
- **Première course** - 1 course publiée
- **5 courses** - 5 courses publiées
- **Serial Publisher** - 25+ courses
- **Centurion** - 100+ courses

### 🏆 ACHIEVEMENT (Rareté: RARE → LEGENDARY)
- **Driver of the Month** - Performance exceptionnelle
- **Étoile Parfaite** - Note 5.0/5 avec 10+ avis
- **Populaire** - 50+ avis reçus

### 🎯 MILESTONE (Rareté: RARE → EPIC)
- **Millionaire** - 1000 crédits accumulés
- **Professionnel** - 100 courses terminées
- **Réactif** - Temps de réponse < 5 min
- **Fidèle** - 30 jours consécutifs
- **Vétéran** - 1 an sur la plateforme

### 🌐 COMMUNITY (Rareté: RARE)
- **Community Builder** - Groupe avec 10+ membres
- **Entraide** - 50+ courses partagées en groupe

---

## 📊 Niveaux de rareté

### Gradients de couleurs

```typescript
COMMON: ['#64748b', '#475569', '#334155']     // Gris
RARE: ['#0ea5e9', '#0284c7', '#0369a1']       // Bleu
EPIC: ['#a855f7', '#9333ea', '#7c3aed']       // Violet
LEGENDARY: ['#fbbf24', '#f59e0b', '#d97706']  // Or
```

### Effets visuels
- **LEGENDARY & EPIC**: Effet de brillance (shine effect)
- **Tous**: Bordure colorée selon rareté
- **Tous**: Ombre portée et badge de rareté

---

## 🚀 Installation

### 1. Créer les tables Databricks

Exécute le script SQL dans **Databricks SQL Editor** :

```bash
backend/create_badges_system.sql
```

Ce script va :
- ✅ Créer la table `badges`
- ✅ Créer la table `user_badges`
- ✅ Insérer 17 badges prédéfinis
- ✅ Créer une vue `v_user_badges_with_details`
- ✅ Attribuer des badges de test à des utilisateurs

### 2. Vérifier l'installation

```sql
-- Voir tous les badges disponibles
SELECT * FROM io_catalog.vtcmarket.badges ORDER BY rarity DESC;

-- Voir les badges d'un utilisateur
SELECT * FROM io_catalog.vtcmarket.v_user_badges_with_details 
WHERE user_id = 'ton-user-id';

-- Compter les badges par rareté
SELECT rarity, COUNT(*) as count 
FROM io_catalog.vtcmarket.badges 
GROUP BY rarity;
```

---

## 🎨 Composants UI

### BadgeCard Component
Affiche un badge avec son style selon la rareté.

```typescript
<BadgeCard 
  badge={badge} 
  size="small" | "medium" | "large" 
/>
```

**Tailles disponibles** :
- `small`: 70x70px (sans texte)
- `medium`: 100x120px (nom + rareté)
- `large`: 140x160px (nom + description + rareté)

### Intégration dans le Profile

```typescript
// Affichage horizontal scrollable
<ScrollView horizontal>
  {userBadges.map(badge => (
    <BadgeCard key={badge.id} badge={badge} size="medium" />
  ))}
</ScrollView>
```

---

## 🔧 Backend API (À implémenter)

### Endpoints à créer

```python
# Dans backend/app/main.py

@app.get("/api/v1/users/{user_id}/badges")
async def get_user_badges(user_id: str):
    """Récupérer les badges d'un utilisateur"""
    query = """
        SELECT * FROM io_catalog.vtcmarket.v_user_badges_with_details
        WHERE user_id = :user_id
        ORDER BY earned_at DESC
    """
    # ...

@app.post("/api/v1/users/{user_id}/badges/{badge_id}")
async def award_badge(user_id: str, badge_id: str):
    """Attribuer un badge à un utilisateur"""
    # ...

@app.get("/api/v1/badges")
async def get_all_badges():
    """Liste de tous les badges disponibles"""
    # ...
```

---

## 🎯 Logique d'attribution automatique

### Exemples de triggers

```python
# Après création d'une course
if user_rides_count == 1:
    award_badge(user_id, "badge-first-ride")
elif user_rides_count == 5:
    award_badge(user_id, "badge-5-rides")
elif user_rides_count == 25:
    award_badge(user_id, "badge-serial-publisher")

# Après accumulation de crédits
if total_credits >= 1000:
    award_badge(user_id, "badge-1000-credits")

# Vérification mensuelle
if is_driver_of_month(user_id):
    award_badge(user_id, "badge-driver-month")
```

---

## 📱 Expérience utilisateur

### Affichage dans l'app

1. **Profile** : Section dédiée avec scroll horizontal
2. **Notifications** : Toast lors de l'obtention d'un nouveau badge
3. **Page dédiée** (future) : Galerie de tous les badges avec progression

### Animations possibles

- ✨ Animation d'apparition lors de l'obtention
- 🎊 Confettis pour badges LEGENDARY
- 📊 Barre de progression pour badges avec paliers

---

## 🧪 Tests

### Requêtes SQL de test

```sql
-- Attribuer un badge de test
INSERT INTO io_catalog.vtcmarket.user_badges (id, user_id, badge_id, earned_at)
VALUES (
  'test-badge-001',
  'ton-user-id-firebase',
  'badge-early-adopter',
  CURRENT_TIMESTAMP()
);

-- Supprimer les badges de test
DELETE FROM io_catalog.vtcmarket.user_badges WHERE id LIKE 'test-%';
```

---

## 🔮 Évolutions futures

### Badges à progression
```sql
ALTER TABLE io_catalog.vtcmarket.user_badges 
ADD COLUMNS (
  progress INT,
  max_progress INT
);
```

### Badges saisonniers
- Halloween 🎃
- Noël 🎄
- Été ☀️

### Badges cachés
- Secret achievements débloqués par des actions spéciales

### Système de points
- Chaque rareté rapporte des points
- Classement des utilisateurs par points

---

## 📚 Badges disponibles au lancement

| Badge | Rareté | Catégorie | Critère |
|-------|--------|-----------|---------|
| Early Adopter | LEGENDARY | SPECIAL | Inscrit avant 31/01/2025 |
| Founder | LEGENDARY | SPECIAL | Membre fondateur |
| Platinum VIP | LEGENDARY | SPECIAL | Abonnement Platinum |
| Première course | COMMON | ACTIVITY | 1 course |
| 5 courses | COMMON | ACTIVITY | 5 courses |
| Serial Publisher | RARE | ACTIVITY | 25 courses |
| Centurion | EPIC | ACTIVITY | 100 courses |
| Driver of the Month | EPIC | ACHIEVEMENT | Performance mensuelle |
| Étoile Parfaite | EPIC | ACHIEVEMENT | Note 5.0/5 (10+ avis) |
| Populaire | RARE | ACHIEVEMENT | 50+ avis |
| Millionaire | EPIC | MILESTONE | 1000 crédits |
| Professionnel | RARE | MILESTONE | 100 courses terminées |
| Réactif | RARE | MILESTONE | Réponse < 5 min |
| Community Builder | RARE | SPECIAL | Groupe 10+ membres |
| Entraide | RARE | SPECIAL | 50+ courses en groupe |
| Fidèle | RARE | MILESTONE | 30 jours consécutifs |
| Vétéran | EPIC | MILESTONE | 1 an d'ancienneté |

---

## 🎉 C'est prêt !

Le système de badges est maintenant opérationnel. Les utilisateurs peuvent voir leurs badges dans le profil, et tu peux facilement en ajouter de nouveaux en les insérant dans la table `badges`.

**Prochaines étapes** :
1. ✅ Tables créées
2. ✅ UI implémentée
3. ⏳ API backend (à implémenter)
4. ⏳ Logique d'attribution automatique
5. ⏳ Notifications push lors de l'obtention

---

**🪸 Corail - Gamification System v1.0**


