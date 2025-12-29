# 🔧 Fix : Adaptation à la table groups existante

## 🐛 **Le problème**

L'erreur Databricks :
```
[UNRESOLVED_COLUMN.WITH_SUGGESTION] A column, variable, or function parameter 
with name `icon` cannot be resolved. Did you mean one of the following? 
[`id`, `name`, `description`, `owner_id`, `created_at`].
```

**Cause :** La table `groups` existe DÉJÀ dans Databricks avec une structure différente !

---

## ✅ **La solution**

### **Différences identifiées :**

| Mon script | Table existante Databricks |
|------------|----------------------------|
| `creator_id` | `owner_id` ✅ |
| `icon` | ❌ N'existe pas |
| `updated_at` | ❌ N'existe pas |

---

## 📋 **Étapes à suivre**

### **1️⃣ Exécuter le script de correction**

**Fichier :** `backend/fix_groups_tables.sql`

Ce script va :
- ✅ Ajouter la colonne `icon` à la table existante
- ✅ Ajouter la colonne `updated_at`
- ✅ Créer la table `group_members`
- ✅ Insérer des données de test

**Exécution :**
1. Ouvre **Databricks SQL Editor**
2. Copie tout le contenu de `fix_groups_tables.sql`
3. Colle dans l'éditeur
4. Clique sur **"Run All"** ▶️

---

### **2️⃣ Backend adapté automatiquement**

J'ai modifié le backend pour utiliser `owner_id` au lieu de `creator_id` :

**Changements :**
- ✅ Modèle `Group` : `creator_id` → `owner_id`
- ✅ Requête `GET /api/v1/groups` : `SELECT g.owner_id`
- ✅ Requête `POST /api/v1/groups` : `INSERT INTO groups (owner_id, ...)`
- ✅ Requête `GET /api/v1/groups/{id}` : `SELECT owner_id`

---

### **3️⃣ Commit & Déployer**

**Commandes :**
```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp

git add -A

git commit -m "🔧 Fix: Adapter backend à la table groups existante

- Utilise owner_id au lieu de creator_id
- Ajoute colonnes icon et updated_at via ALTER TABLE
- Script fix_groups_tables.sql pour adaptation
- Backend 100% compatible avec structure existante"

git push origin main
```

**Puis déployer sur Render :**
1. https://dashboard.render.com
2. `corail-backend`
3. **"Manual Deploy"** → **"Deploy latest commit"**
4. Attends 2-3 minutes

---

## 🧪 **Vérification**

### **Dans Databricks SQL Editor :**

**Voir la structure de la table :**
```sql
DESCRIBE TABLE io_catalog.corail.groups;
```

**Tu devrais voir :**
```
id               STRING
name             STRING
description      STRING
owner_id         STRING  ← CETTE COLONNE
icon             STRING  ← AJOUTÉE PAR LE SCRIPT
created_at       TIMESTAMP
updated_at       TIMESTAMP  ← AJOUTÉE PAR LE SCRIPT
```

**Voir les groupes :**
```sql
SELECT * FROM io_catalog.corail.groups WHERE id LIKE 'group-%';
```

**Voir les membres :**
```sql
SELECT 
  g.name,
  gm.role,
  gm.email
FROM group_members gm
JOIN groups g ON gm.group_id = g.id
WHERE g.id LIKE 'group-%';
```

---

## 🎯 **Résultat attendu**

Après avoir exécuté le script et déployé le backend :

1. ✅ Table `groups` a maintenant les colonnes `icon` et `updated_at`
2. ✅ Table `group_members` existe avec toutes les colonnes nécessaires
3. ✅ 3 groupes de test créés :
   - 🚕 VTC Toulouse Centre
   - ✈️ Spécialistes Aéroport
   - ⭐ VTC Premium Toulouse
4. ✅ Membres et invitations de test insérés
5. ✅ Backend utilise `owner_id` partout

---

## 📊 **Architecture finale**

```sql
-- Table groups
CREATE TABLE groups (
  id STRING,
  name STRING,
  description STRING,
  owner_id STRING,      ← Colonne existante Databricks
  icon STRING,          ← Ajoutée par notre script
  created_at TIMESTAMP,
  updated_at TIMESTAMP  ← Ajoutée par notre script
);

-- Table group_members (nouvelle)
CREATE TABLE group_members (
  id STRING,
  group_id STRING,      ← FK vers groups.id
  user_id STRING,       ← FK vers users.id
  email STRING,
  role STRING,          ← ADMIN, MEMBER
  status STRING,        ← ACTIVE, PENDING, REJECTED, LEFT
  invited_by STRING,
  invited_at TIMESTAMP,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 🐛 **Si ça ne marche toujours pas**

### **Erreur : "icon cannot be resolved"**
**Cause :** Le script `ALTER TABLE` n'a pas été exécuté.
**Solution :** Exécute manuellement :
```sql
ALTER TABLE io_catalog.corail.groups 
ADD COLUMN IF NOT EXISTS icon STRING DEFAULT '👥';
```

### **Erreur : "owner_id cannot be resolved" dans le backend**
**Cause :** Le backend n'a pas été redéployé avec les nouvelles modifications.
**Solution :** 
1. Vérifie que le commit est sur GitHub
2. Redéploie sur Render
3. Attends 2-3 minutes

### **Erreur : "group_members does not exist"**
**Cause :** La table n'a pas été créée.
**Solution :** Exécute le `CREATE TABLE group_members` du script.

---

## ✅ **Checklist**

- [ ] Script `fix_groups_tables.sql` exécuté dans Databricks
- [ ] Commande `DESCRIBE TABLE groups` montre les colonnes `icon` et `updated_at`
- [ ] Table `group_members` existe
- [ ] 3 groupes de test visibles
- [ ] Backend committé et poussé sur GitHub
- [ ] Backend redéployé sur Render
- [ ] Tester création d'un groupe via l'app → ✅ Fonctionne !

---

🎉 **Une fois tout fait, les groupes seront 100% fonctionnels !**


