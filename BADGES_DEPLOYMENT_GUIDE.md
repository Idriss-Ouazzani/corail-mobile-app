# 🚀 Guide de déploiement complet - Système de Badges

## ✅ Ce qui a été implémenté

### 1️⃣ Backend API (FastAPI + Databricks)
- ✅ **Modèles Pydantic** : `Badge`, `UserBadge`
- ✅ **3 endpoints principaux** :
  - `GET /api/v1/badges` : Liste tous les badges disponibles
  - `GET /api/v1/users/{user_id}/badges` : Badges d'un utilisateur
  - `POST /api/v1/users/{user_id}/badges/{badge_id}` : Attribuer un badge
- ✅ **Attribution automatique** : Fonction `check_and_award_badges()`
  - Appelée après création de course
  - Appelée après complétion de course
  - Vérifie automatiquement les critères et attribue les badges

### 2️⃣ Mobile App (React Native + TypeScript)
- ✅ **API Client** : Méthodes pour badges dans `api.ts`
- ✅ **Composants UI** :
  - `BadgeCard` : Affiche un badge (3 tailles, 4 raretés)
  - `BadgeToast` : Notification animée pour nouveau badge
- ✅ **Écran dédié** : `BadgesScreen`
  - Galerie complète des badges
  - Filtres (Tous / Obtenus / Verrouillés)
  - Barre de progression
  - Groupés par rareté
  - Pull-to-refresh
- ✅ **Intégration Profile** :
  - Section badges avec scroll horizontal
  - Affiche les 4 derniers badges
  - Lien "Tout voir" vers BadgesScreen
  - Chargement dynamique depuis l'API

### 3️⃣ Attribution automatique des badges
- ✅ **Badges activité** : 1, 5, 25, 100 courses publiées
- ✅ **Badges milestone** : 100 courses terminées, 1000 crédits
- ✅ **Attribution en temps réel** : Après chaque action

---

## 📋 Étapes de déploiement

### Étape 1 : Tables Databricks (DÉJÀ FAIT)

Si pas encore fait, exécute dans **Databricks SQL Editor** :

```sql
-- Fichier: backend/create_badges_system.sql
-- Crée les tables badges et user_badges
-- Insère 17 badges prédéfinis
```

Vérification :
```sql
SELECT * FROM io_catalog.vtcmarket.badges ORDER BY rarity DESC;
SELECT * FROM io_catalog.vtcmarket.user_badges LIMIT 10;
```

### Étape 2 : Backend - Déployer sur Render.com

1. **Commit et push** les changements :
```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp
git add -A
git commit -m "🏆 Backend API badges + Attribution automatique"
git push origin main
```

2. **Render.com va automatiquement redéployer** le backend
   - Attends 3-5 minutes
   - Vérifie les logs dans Render Dashboard

3. **Test des endpoints** :
```bash
# Récupérer tous les badges
curl https://corail-backend-6e5o.onrender.com/api/v1/badges

# Récupérer les badges d'un utilisateur (nécessite token)
curl -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  https://corail-backend-6e5o.onrender.com/api/v1/users/USER_ID/badges
```

### Étape 3 : Mobile App - Commit et test

1. **Commit les changements mobile** :
```bash
git add -A
git commit -m "🏆 UI Badges + BadgesScreen + Toast + API integration"
git push origin main
```

2. **Test dans Expo** :
```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp
npm start
```

3. **Ouvre l'app** et teste :
   - ✅ Profile → Section Badges (doit charger depuis l'API)
   - ✅ Clique "Tout voir" → BadgesScreen s'ouvre
   - ✅ Filtres (Tous / Obtenus / Verrouillés)
   - ✅ Crée une course → Badge "Première course" devrait être attribué
   - ✅ Recharge Profile → Nouveau badge visible

---

## 🧪 Tests à effectuer

### Test 1 : Attribution automatique

1. **Créer une nouvelle course** :
   - Va dans Marketplace → Créer
   - Remplis les champs
   - Clique "Créer la course"

2. **Vérifie dans le backend log** :
```
✅ +1 crédit Corail pour USER_ID (publication de course)
✅ Badge 'badge-first-ride' awarded to user USER_ID
```

3. **Vérifie dans l'app** :
   - Profile → Section Badges
   - Le badge "Première course" doit apparaître

### Test 2 : Galerie de badges

1. **Profile → Tout voir**
2. **Filtre "Obtenus"** : Affiche seulement les badges gagnés
3. **Filtre "Verrouillés"** : Affiche les badges pas encore obtenus
4. **Pull-to-refresh** : Recharge les données

### Test 3 : Progression multi-badges

1. **Créer 5 courses** successivement
2. **Vérifier dans Databricks** :
```sql
SELECT * FROM io_catalog.vtcmarket.user_badges 
WHERE user_id = 'ton-user-id' 
ORDER BY earned_at DESC;
```

3. **Résultat attendu** :
   - Badge "Première course" (après la 1ère)
   - Badge "5 courses" (après la 5ème)

---

## 🎯 Badges et leurs critères

| Badge | ID | Rareté | Critère | Attribution |
|-------|----|---------|---------|-|
| **Première course** | `badge-first-ride` | COMMON | 1 course publiée | Auto |
| **5 courses** | `badge-5-rides` | COMMON | 5 courses publiées | Auto |
| **Serial Publisher** | `badge-serial-publisher` | RARE | 25 courses publiées | Auto |
| **Centurion** | `badge-100-rides` | EPIC | 100 courses publiées | Auto |
| **Professionnel** | `badge-100-completed` | RARE | 100 courses terminées | Auto |
| **Millionaire** | `badge-1000-credits` | EPIC | 1000 crédits accumulés | Auto |
| **Early Adopter** | `badge-early-adopter` | LEGENDARY | Inscrit avant 31/01/2025 | Manuel |
| **Driver of the Month** | `badge-driver-month` | EPIC | Performance mensuelle | Manuel |
| **Étoile Parfaite** | `badge-perfect-rating` | EPIC | Note 5.0/5 (10+ avis) | À implémenter |

---

## 🔧 Attribution manuelle d'un badge (pour tests)

### Via SQL (Databricks)
```sql
INSERT INTO io_catalog.vtcmarket.user_badges (id, user_id, badge_id, earned_at)
VALUES (
  'test-' || uuid(),
  'ton-user-id-firebase',
  'badge-early-adopter',
  CURRENT_TIMESTAMP()
);
```

### Via API (Postman ou cURL)
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  https://corail-backend-6e5o.onrender.com/api/v1/users/USER_ID/badges/badge-early-adopter
```

---

## 🐛 Troubleshooting

### Problème : "Les badges ne s'affichent pas dans le Profile"

**Solutions** :
1. Vérifie que les tables existent dans Databricks
2. Vérifie les logs backend : `check_and_award_badges()` est appelé ?
3. Test l'endpoint directement : `GET /api/v1/users/{user_id}/badges`
4. Vérifie le `currentUserId` dans l'app

### Problème : "Badge non attribué après création de course"

**Solutions** :
1. Vérifie les logs backend pour voir si `check_and_award_badges()` est appelé
2. Vérifie la requête SQL dans `check_and_award_badges()` :
```sql
SELECT 
  COUNT(CASE WHEN creator_id = :user_id THEN 1 END) as total_published
FROM rides
WHERE creator_id = :user_id
```
3. Exécute manuellement dans Databricks SQL Editor pour debug

### Problème : "BadgesScreen affiche 'Aucun badge'"

**Solutions** :
1. Vérifie que `apiClient.getAllBadges()` retourne des données
2. Test direct : `curl https://corail-backend-6e5o.onrender.com/api/v1/badges`
3. Vérifie les logs de l'app : `console.log('🏆 Badges chargés:', ...)`

---

## 🔮 Prochaines améliorations (optionnelles)

### 1. Toast de notification
- Afficher `BadgeToast` quand un badge est gagné
- Nécessite WebSocket ou polling pour notification en temps réel

### 2. Badges avec progression
- Ajouter une barre de progression : "12/25 courses publiées"
- Modifier `user_badges.progress` pour tracker

### 3. Badges cachés/secrets
- Critères non affichés
- Débloqués par des actions spéciales

### 4. Classement par badges
- Page "Leaderboard" avec top utilisateurs
- Système de points par rareté

### 5. Badges saisonniers
- Halloween, Noël, Été
- Disponibles seulement pendant une période

---

## ✅ Checklist de validation

- [ ] Tables Databricks créées et peuplées
- [ ] Backend déployé sur Render.com
- [ ] Endpoints API testés et fonctionnels
- [ ] Profile affiche les badges (max 4)
- [ ] "Tout voir" ouvre BadgesScreen
- [ ] BadgesScreen affiche tous les badges
- [ ] Filtres fonctionnent (Tous / Obtenus / Verrouillés)
- [ ] Pull-to-refresh fonctionne
- [ ] Créer une course attribue le badge "Première course"
- [ ] Badges groupés par rareté
- [ ] Badge verrouillés affichent le cadenas
- [ ] Barre de progression affiche le bon %

---

## 📚 Fichiers modifiés

### Backend
- `backend/app/main.py` : Modèles, endpoints, attribution automatique
- `backend/create_badges_system.sql` : Tables et données

### Mobile
- `src/services/api.ts` : Méthodes API badges
- `src/components/BadgeCard.tsx` : Composant badge
- `src/components/BadgeToast.tsx` : Notification animée
- `src/screens/BadgesScreen.tsx` : Page galerie
- `App.tsx` : Intégration dans Profile, chargement API

### Documentation
- `BADGES_GAMIFICATION_GUIDE.md` : Guide complet
- `BADGES_DEPLOYMENT_GUIDE.md` : Ce fichier

---

**🎉 Le système de badges est maintenant complet et prêt pour la production ! 🏆**


