# 🕐 Système d'Expiration Automatique des Courses

## 📋 Vue d'ensemble

Le système d'expiration automatique empêche les courses dont la date est passée d'apparaître dans la marketplace. Les courses `PUBLISHED` dont le `scheduled_at` est antérieur à l'heure actuelle sont automatiquement marquées comme `EXPIRED`.

---

## 🎯 Comportement

### Statuts des courses
- **`PUBLISHED`** : Course publiée, visible dans la marketplace, date future
- **`EXPIRED`** : Course dont la date est passée (automatiquement mise à jour)
- **`CLAIMED`** : Course prise par un chauffeur
- **`COMPLETED`** : Course terminée
- **`CANCELLED`** : Course annulée

### Règles d'expiration
1. **Déclenchement** : À chaque appel à `GET /api/v1/rides`, le backend vérifie et expire automatiquement les courses
2. **Condition** : `status = 'PUBLISHED'` ET `scheduled_at < NOW()`
3. **Action** : `status` → `EXPIRED`, `updated_at` → timestamp actuel
4. **Visibilité** : Les courses `EXPIRED` sont **cachées** de la marketplace

---

## 🔧 Implémentation Technique

### Backend (FastAPI)

#### Endpoint `GET /api/v1/rides`
```python
# Auto-expiration avant récupération
expire_query = """
UPDATE rides
SET status = 'EXPIRED', updated_at = CURRENT_TIMESTAMP()
WHERE status = 'PUBLISHED' 
AND scheduled_at < CURRENT_TIMESTAMP()
"""
db.execute_query(expire_query)

# Filtrage des résultats (exclut EXPIRED)
query = """
SELECT ... FROM rides r
WHERE r.status != 'EXPIRED'
...
"""
```

### Frontend (React Native)

#### Filtrage Marketplace (`App.tsx`)
```typescript
let filteredRides = rides.filter((ride) => {
  // Exclure les courses EXPIRED
  if (ride.status === 'EXPIRED') return false;
  
  // Ne montrer que les PUBLISHED
  if (ride.status !== 'PUBLISHED') return false;
  
  // Double vérification : date dans le futur
  const scheduledTime = new Date(ride.scheduled_at).getTime();
  const now = Date.now();
  if (scheduledTime < now) return false;
  
  return true;
});
```

#### Type TypeScript (`src/types/index.ts`)
```typescript
export type RideStatus = 
  | 'PUBLISHED' 
  | 'CLAIMED' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'EXPIRED'
```

---

## 🚀 Déploiement

### 1. Exécuter le script SQL initial
```bash
# Sur Databricks SQL Warehouse
backend/add_expired_status.sql
```
Ce script expire manuellement toutes les courses passées existantes.

### 2. Déployer le backend
```bash
git add -A
git commit -m "feat: add ride expiration system"
git push origin assistant-pivot
```
Le backend sur Render sera automatiquement redéployé.

### 3. Déployer le frontend
Aucune action requise, le filtrage est automatique dès le chargement.

---

## ✅ Tests

### 1. Vérifier l'expiration automatique
```sql
-- Databricks : Créer une course avec date passée
INSERT INTO io_catalog.corail.rides (...)
VALUES (..., scheduled_at = '2024-01-01 10:00:00', status = 'PUBLISHED', ...);

-- Après appel API GET /api/v1/rides
-- Vérifier que status = 'EXPIRED'
SELECT id, status, scheduled_at FROM io_catalog.corail.rides WHERE id = '...';
```

### 2. Vérifier l'app mobile
1. Créer une course avec date passée (via SQL)
2. Ouvrir la marketplace dans l'app
3. **La course NE DOIT PAS apparaître**

### 3. Vérifier les statistiques
```sql
SELECT 
  status,
  COUNT(*) as count
FROM io_catalog.corail.rides
GROUP BY status;
```

---

## 🔄 Maintenance

### Expiration manuelle (si nécessaire)
```sql
UPDATE io_catalog.corail.rides
SET status = 'EXPIRED', updated_at = CURRENT_TIMESTAMP()
WHERE status = 'PUBLISHED' 
AND scheduled_at < CURRENT_TIMESTAMP();
```

### Réactiver une course expirée (si erreur)
```sql
UPDATE io_catalog.corail.rides
SET 
  status = 'PUBLISHED',
  scheduled_at = '2025-12-31 15:00:00', -- Nouvelle date future
  updated_at = CURRENT_TIMESTAMP()
WHERE id = 'ride-xxx';
```

---

## 📊 Monitoring

### Requête de surveillance
```sql
-- Courses par statut (dernières 24h)
SELECT 
  status,
  COUNT(*) as count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
FROM io_catalog.corail.rides
WHERE updated_at > CURRENT_TIMESTAMP() - INTERVAL 1 DAY
GROUP BY status
ORDER BY count DESC;
```

### Alertes recommandées
- Si `EXPIRED` > 50% du total → Peu de courses futures publiées
- Si aucune course `PUBLISHED` → Marketplace vide

---

## ❓ FAQ

**Q: Les courses expirées sont-elles supprimées ?**  
R: Non, elles sont conservées avec `status = 'EXPIRED'` pour l'historique.

**Q: Peut-on voir les courses expirées quelque part ?**  
R: Actuellement non, mais on pourrait ajouter un onglet "Historique" pour les admins.

**Q: L'expiration impacte-t-elle les performances ?**  
R: Impact minimal, l'`UPDATE` ne touche que les courses `PUBLISHED` avec date passée (index optimisé).

**Q: Que se passe-t-il si une course CLAIMED expire ?**  
R: Les courses CLAIMED ne sont JAMAIS expirées (le chauffeur doit les effectuer même si date passée).

**Q: Et pour les courses COMPLETED ?**  
R: Les courses COMPLETED ne sont jamais modifiées, elles restent dans leur état final.

---

## 🎉 Avantages

✅ Marketplace toujours à jour automatiquement  
✅ Pas de confusion avec des courses passées  
✅ Amélioration de l'UX (courses pertinentes uniquement)  
✅ Historique conservé (status EXPIRED)  
✅ Aucune action manuelle requise  
✅ Filtrage côté backend ET frontend (double sécurité)  

---

**Dernière mise à jour** : 29 décembre 2024

