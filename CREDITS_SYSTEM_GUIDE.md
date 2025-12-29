# 🪸 Système de Crédits Corail - Guide d'installation

Ce guide vous explique comment implémenter le système de crédits Corail qui remplace les commissions.

---

## 📊 Règles du système

```
📊 SYSTÈME DE CRÉDITS CORAIL :

✅ +1 crédit   → Publier une course
✅ +1 crédit   → Quand votre course est prise ET terminée (bonus)
❌ -1 crédit   → Prendre une course publiée par un autre

💡 Total : +2 crédits par course publiée et validée
```

---

## 🎯 Objectif

Encourager le partage de courses : plus vous publiez, plus vous gagnez de crédits pour prendre des courses !

---

## 📋 Étapes d'installation

### **Étape 1 : Exécuter le script SQL dans Databricks**

1. **Ouvrir le SQL Editor de Databricks**
   - Aller sur votre workspace Databricks
   - Cliquer sur "SQL Editor" dans la barre latérale

2. **Copier le contenu du fichier**
   ```bash
   backend/add_credits_system.sql
   ```

3. **Coller dans le SQL Editor et exécuter**
   - Le script va :
     - Ajouter la colonne `credits` à la table `users`
     - Attribuer 5 crédits de départ à tous les utilisateurs existants
     - Créer la table `credits_history` pour le suivi (optionnel)

4. **Vérifier l'installation**
   ```sql
   -- Voir les crédits de tous les utilisateurs
   SELECT id, full_name, email, credits, subscription_tier
   FROM io_catalog.corail.users
   ORDER BY credits DESC;
   ```

---

### **Étape 2 : Déployer le backend mis à jour**

Le backend a été mis à jour avec :
- ✅ Endpoint `GET /api/v1/credits` pour récupérer les crédits
- ✅ Logique +1 crédit lors de la création d'une course
- ✅ Logique -1 crédit lors de la prise d'une course (avec vérification)
- ✅ Logique +1 crédit bonus quand une course est terminée

#### **Si vous utilisez Render.com :**

```bash
# Commit et push les changements
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp
git add backend/
git commit -m "✨ Système de crédits Corail"
git push origin main
```

Render redéploiera automatiquement le backend.

#### **Si vous utilisez Databricks Apps :**

Redéployez l'application via l'interface Databricks Apps.

---

### **Étape 3 : Mettre à jour l'application mobile**

L'application mobile a été mise à jour avec :
- ✅ Affichage des crédits dans le profil (avec icône C élégante)
- ✅ Vérification des crédits avant de prendre une course
- ✅ Rechargement automatique des crédits après chaque action
- ✅ Suppression de toutes les références aux commissions

**Pas de changement requis** - Rechargez simplement l'app dans Expo Go :
```bash
# Dans votre terminal Expo
# Shake le téléphone → Reload
```

---

## 🧪 Tester le système

### **Test 1 : Vérifier les crédits initiaux**

1. Ouvrir l'app
2. Aller dans "Profil"
3. Vérifier que vous avez **5 crédits** (ou le montant configuré)

### **Test 2 : Publier une course (+1 crédit)**

1. Créer une nouvelle course
2. Vérifier le message : "Course créée avec succès ! +1 crédit 🪸"
3. Aller dans "Profil" → Crédits doivent avoir augmenté de +1

### **Test 3 : Prendre une course (-1 crédit)**

1. Aller dans "Marketplace"
2. Sélectionner une course publiée par un autre utilisateur
3. Cliquer "Prendre cette course"
4. Vérifier le message : "Course réclamée ! -1 crédit 🪸"
5. Aller dans "Profil" → Crédits doivent avoir diminué de -1

### **Test 4 : Crédits insuffisants**

1. Prendre des courses jusqu'à arriver à 0 crédit
2. Essayer de prendre une autre course
3. Vérifier le message d'erreur : "Crédits insuffisants. Publiez des courses pour gagner des crédits !"

### **Test 5 : Bonus de course terminée (+1 crédit)**

1. Un autre utilisateur prend votre course
2. Cet utilisateur marque la course comme terminée
3. Vous recevez +1 crédit supplémentaire (total +2 pour la course)

---

## 🔍 Requêtes SQL utiles

### **Voir tous les utilisateurs et leurs crédits**
```sql
SELECT 
  id,
  full_name,
  email,
  credits,
  subscription_tier
FROM io_catalog.corail.users
ORDER BY credits DESC;
```

### **Statistiques des crédits**
```sql
SELECT 
  MIN(credits) as min_credits,
  MAX(credits) as max_credits,
  AVG(credits) as avg_credits,
  COUNT(*) as total_users
FROM io_catalog.corail.users;
```

### **Ajuster manuellement les crédits d'un utilisateur**
```sql
UPDATE io_catalog.corail.users
SET credits = 10
WHERE email = 'votre.email@example.com';
```

### **Voir l'historique des crédits (si table créée)**
```sql
SELECT 
  user_id,
  amount,
  reason,
  balance_after,
  created_at
FROM io_catalog.corail.credits_history
ORDER BY created_at DESC
LIMIT 50;
```

---

## ✨ Fonctionnalités implémentées

### **Backend**
- ✅ Colonne `credits` dans table `users`
- ✅ Endpoint `GET /api/v1/credits`
- ✅ +1 crédit lors de `POST /api/v1/rides` (création)
- ✅ -1 crédit lors de `POST /api/v1/rides/{id}/claim` (avec vérification >= 1)
- ✅ +1 crédit bonus lors de `POST /api/v1/rides/{id}/complete`
- ✅ Suppression de `commission_enabled` partout

### **Frontend (Mobile)**
- ✅ Composant `CreditsIcon` avec icône C élégante
- ✅ Affichage des crédits dans le profil utilisateur
- ✅ Vérification avant de prendre une course
- ✅ Rechargement automatique après création/prise de course
- ✅ Suppression de toutes les références aux commissions
- ✅ Messages avec emoji corail 🪸

---

## 🚀 Prochaines étapes (optionnel)

### **1. Badges et récompenses**
- 🏆 Badge "Partageur" : 10+ courses publiées
- 🌟 Badge "Contributeur" : 50+ crédits gagnés

### **2. Historique des transactions**
- 📊 Page "Historique des crédits"
- 📈 Graphique de l'évolution des crédits

### **3. Système de "crédit premium"**
- 💎 Acheter des crédits via IAP (In-App Purchase)
- 🎁 Bonus crédits pour les abonnés Premium/Platinum

---

## 🐛 Dépannage

### **Problème : Les crédits ne s'affichent pas**

1. Vérifier que le script SQL a bien été exécuté :
   ```sql
   DESCRIBE io_catalog.corail.users;
   -- Doit afficher une colonne "credits"
   ```

2. Vérifier que le backend est à jour :
   ```bash
   git log --oneline -1
   # Doit afficher le commit "Système de crédits Corail"
   ```

3. Vérifier les logs du backend (Render ou Databricks Apps)

### **Problème : Erreur 402 "Crédits insuffisants"**

C'est normal ! Publiez des courses pour gagner des crédits 🪸

### **Problème : Les crédits ne se mettent pas à jour**

1. Vérifier les logs de l'app mobile
2. Forcer le rechargement de l'app
3. Vérifier manuellement dans Databricks :
   ```sql
   SELECT credits FROM io_catalog.corail.users WHERE id = 'VOTRE_FIREBASE_UID';
   ```

---

## 📞 Support

En cas de problème, vérifier :
1. Les logs backend (Render.com ou Databricks Apps)
2. Les logs de l'app mobile (Console Expo)
3. La structure de la base de données (SQL Editor)

---

**Bon lancement du système de crédits Corail ! 🪸✨**


