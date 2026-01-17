# 🔒 Audit de Sécurité - Application Corail

## 🚨 Problèmes de sécurité identifiés

### ❌ **CRITIQUE : Pas de RLS sur les tables principales**

**Fichier :** `database/vtc_profiles_DISABLE_RLS.sql`

```sql
ALTER TABLE vtc_profiles DISABLE ROW LEVEL SECURITY;
```

**Problème :** Le RLS a été désactivé parce que `auth.uid()` ne fonctionne pas avec Firebase Auth.

**Impact :** 
- ⚠️ **N'importe qui peut lire TOUS les profils VTC**
- ⚠️ **N'importe qui peut modifier N'IMPORTE QUEL profil VTC**
- ⚠️ **Données sensibles exposées** (téléphone, email, carte pro, etc.)

### ❌ **CRITIQUE : Sécurité basée sur variable JavaScript côté client**

**Fichier :** `src/services/supabaseApi.ts`

```typescript
let currentUserId: string | null = null;

export const setUserId = (userId: string) => {
  currentUserId = userId;
};

export const getVerificationStatus = async () => {
  if (!currentUserId) throw new Error('User not authenticated');
  // Utilise currentUserId pour les requêtes
}
```

**Problème :** La variable `currentUserId` est définie côté client et peut être manipulée.

**Attack scenario :**
```javascript
// Dans la console du navigateur / debugger React Native
import { setUserId } from './src/services/supabaseApi';
setUserId('ID_AUTRE_UTILISATEUR'); 
// ❌ Maintenant toutes les requêtes utilisent l'ID de la victime
```

**Impact :**
- ⚠️ **Usurpation d'identité possible**
- ⚠️ **Accès aux données d'autres utilisateurs**
- ⚠️ **Modification de données d'autres utilisateurs**

---

## 🔍 **Tables sans RLS (vérifiées)**

| Table | RLS Activé ? | Niveau de risque |
|-------|--------------|------------------|
| `vtc_profiles` | ❌ NON | 🔴 CRITIQUE |
| `users` | ❓ Inconnu | 🔴 CRITIQUE |
| `rides` | ❓ Inconnu | 🔴 CRITIQUE |
| `credits` | ❓ Inconnu | 🔴 CRITIQUE |
| `personal_rides` | ❓ Inconnu | 🟡 MOYEN |
| `quotes` | ❓ Inconnu | 🟡 MOYEN |
| `groups` | ❓ Inconnu | 🟡 MOYEN |
| `push_tokens` | ✅ OUI | ✅ OK |

---

## ✅ **Ce qui est bien sécurisé**

1. **Firebase Authentication** : Authentification robuste côté client ✅
2. **Push tokens** : RLS activé avec policies correctes ✅
3. **HTTPS** : Toutes les communications chiffrées ✅
4. **Consent RGPD** : Système de consentement implémenté ✅
5. **Secrets** : Pas de clés API hardcodées dans le code ✅

---

## 🛠️ **Solutions recommandées**

### **Solution 1 : RLS avec Firebase Custom Claims (RECOMMANDÉ)**

Au lieu d'utiliser `auth.uid()` de Supabase, on utilise les Custom Claims de Firebase.

#### Étape 1 : Créer une fonction RPC dans Supabase

```sql
-- Fonction pour obtenir le user_id depuis le JWT Firebase
CREATE OR REPLACE FUNCTION get_firebase_user_id()
RETURNS TEXT AS $$
BEGIN
  -- Extrait le user_id depuis le JWT Firebase passé dans les headers
  RETURN current_setting('request.jwt.claims', true)::json->>'user_id';
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Étape 2 : Activer RLS sur toutes les tables

```sql
-- VTC Profiles
ALTER TABLE vtc_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all VTC profiles"
  ON vtc_profiles FOR SELECT
  USING (true); -- Lecture publique OK

CREATE POLICY "Users can only update their own profile"
  ON vtc_profiles FOR UPDATE
  USING (user_id = get_firebase_user_id());

CREATE POLICY "Users can only insert their own profile"
  ON vtc_profiles FOR INSERT
  WITH CHECK (user_id = get_firebase_user_id());

-- Users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (id = get_firebase_user_id());

CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (id = get_firebase_user_id());

-- Rides
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published rides"
  ON rides FOR SELECT
  USING (status IN ('PUBLISHED', 'CLAIMED') OR creator_id = get_firebase_user_id() OR picker_id = get_firebase_user_id());

CREATE POLICY "Users can create rides"
  ON rides FOR INSERT
  WITH CHECK (creator_id = get_firebase_user_id());

CREATE POLICY "Users can update their own rides"
  ON rides FOR UPDATE
  USING (creator_id = get_firebase_user_id() OR picker_id = get_firebase_user_id());

-- Credits
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credits"
  ON credits FOR SELECT
  USING (user_id = get_firebase_user_id());

-- Personal Rides
ALTER TABLE personal_rides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own personal rides"
  ON personal_rides FOR ALL
  USING (user_id = get_firebase_user_id());

-- Quotes
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quotes"
  ON quotes FOR SELECT
  USING (created_by = get_firebase_user_id());

CREATE POLICY "Users can create quotes"
  ON quotes FOR INSERT
  WITH CHECK (created_by = get_firebase_user_id());
```

#### Étape 3 : Passer le JWT Firebase à Supabase

**Dans `src/lib/supabase.ts` :**

```typescript
import { createClient } from '@supabase/supabase-js';
import { firebaseAuth } from './firebase';

const supabaseUrl = 'https://your-project.supabase.co';
const supabaseAnonKey = 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: async () => {
      // Obtenir le JWT Firebase
      const user = firebaseAuth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        return {
          Authorization: `Bearer ${token}`,
        };
      }
      return {};
    },
  },
});
```

---

### **Solution 2 : Backend intermédiaire (Plus sécurisé mais plus complexe)**

Créer un backend Node.js/Express qui :
1. Vérifie le token Firebase
2. Fait les requêtes Supabase avec les bonnes permissions
3. Renvoie les données au client

**Avantages :**
- ✅ Sécurité maximale
- ✅ Contrôle total des permissions
- ✅ Possibilité de logger toutes les actions

**Inconvénients :**
- ❌ Complexe à mettre en place
- ❌ Nécessite un serveur dédié
- ❌ Plus lent (hop supplémentaire)

---

### **Solution 3 : Migration vers Supabase Auth (Long terme)**

Abandonner Firebase Auth et utiliser 100% Supabase.

**Avantages :**
- ✅ RLS natif qui fonctionne parfaitement
- ✅ `auth.uid()` fonctionne out-of-the-box
- ✅ Moins de complexité

**Inconvénients :**
- ❌ Nécessite migration de tous les comptes
- ❌ Perte des fonctionnalités Firebase
- ❌ Refonte de toute l'authentification

---

## 🔥 **Vulnérabilités à corriger IMMÉDIATEMENT (Prod)**

### 1. **Vérifier qui peut lire `vtc_profiles`**

**Test actuel :**
```sql
-- N'importe qui peut voir TOUS les profils VTC
SELECT * FROM vtc_profiles; -- ❌ Devrait être restreint
```

**Fix rapide (temporaire) :**
```sql
-- Au moins activer RLS même sans policies parfaites
ALTER TABLE vtc_profiles ENABLE ROW LEVEL SECURITY;

-- Lecture publique OK (profils VTC sont publics)
CREATE POLICY "Anyone can view VTC profiles"
  ON vtc_profiles FOR SELECT
  USING (true);

-- Mais écriture restreinte au propriétaire
CREATE POLICY "Users can only update their own profile"
  ON vtc_profiles FOR UPDATE
  USING (user_id = (SELECT id FROM users WHERE id = current_user_id()));
```

### 2. **Protéger la table `users`**

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Lecture restreinte
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (id = current_user_id());

-- Admins peuvent tout voir
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = current_user_id() AND is_admin = true));
```

### 3. **Protéger les crédits**

```sql
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own credits"
  ON credits FOR SELECT
  USING (user_id = current_user_id());
```

---

## 📊 **Niveau de risque actuel**

| Composant | Risque | Impact |
|-----------|--------|--------|
| **VTC Profiles** | 🔴 CRITIQUE | Données sensibles exposées |
| **Users** | 🔴 CRITIQUE | Usurpation d'identité possible |
| **Credits** | 🔴 CRITIQUE | Manipulation de crédits |
| **Rides** | 🟠 ÉLEVÉ | Vol/modification de courses |
| **Personal Rides** | 🟡 MOYEN | Données privées exposées |
| **Quotes** | 🟡 MOYEN | Devis clients exposés |

**Score global : 🔴 CRITIQUE**

---

## ✅ **Checklist de sécurisation**

### Urgent (Avant prod)
- [ ] Activer RLS sur `vtc_profiles`
- [ ] Activer RLS sur `users`
- [ ] Activer RLS sur `credits`
- [ ] Activer RLS sur `rides`
- [ ] Implémenter `get_firebase_user_id()` ou équivalent
- [ ] Passer le JWT Firebase dans les headers Supabase
- [ ] Tester l'accès en tant qu'utilisateur non-admin
- [ ] Tester l'impossibilité d'accéder aux données d'autres users

### Important (Court terme)
- [ ] RLS sur toutes les autres tables
- [ ] Audit complet des policies
- [ ] Tests de pénétration basiques
- [ ] Logging des actions sensibles
- [ ] Rate limiting sur l'API

### Nice-to-have (Long terme)
- [ ] Backend intermédiaire pour actions sensibles
- [ ] Chiffrement des données sensibles
- [ ] 2FA pour les admins
- [ ] Alertes de sécurité

---

## 🧪 **Tests de sécurité à faire**

### Test 1 : Accès aux données d'autres users

```javascript
// Dans la console développeur
import { supabase } from './src/lib/supabase';

// Essayer de récupérer les données d'un autre utilisateur
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', 'AUTRE_USER_ID')
  .single();

// ❌ Devrait retourner une erreur ou aucune donnée
// ✅ Si data est null/undefined : BON
// 🔴 Si data contient des infos : VULNÉRABILITÉ
```

### Test 2 : Modification de profil d'un autre user

```javascript
// Essayer de modifier le profil VTC d'un autre user
const { error } = await supabase
  .from('vtc_profiles')
  .update({ company_name: 'HACKED' })
  .eq('user_id', 'AUTRE_USER_ID');

// ✅ error devrait être "permission denied"
// 🔴 Si pas d'erreur : VULNÉRABILITÉ CRITIQUE
```

### Test 3 : Manipulation de crédits

```javascript
// Essayer d'ajouter des crédits à son compte
const { error } = await supabase
  .from('credits_ledger')
  .insert({
    user_id: 'MON_USER_ID',
    amount: 9999,
    transaction_type: 'MANUAL',
  });

// ✅ error devrait être "permission denied"
// 🔴 Si pas d'erreur : VULNÉRABILITÉ CRITIQUE
```

---

## 📝 **Recommandations générales**

1. **Principe du moindre privilège** : Chaque user ne doit voir que SES données
2. **Défense en profondeur** : RLS + vérifications côté app + vérifications backend
3. **Audit régulier** : Tests de sécurité mensuels
4. **Logs** : Tracer toutes les actions sensibles
5. **Rate limiting** : Limiter les requêtes par user
6. **Monitoring** : Alertes sur actions suspectes

---

## 🆘 **Que faire MAINTENANT ?**

### Option A : Fix rapide (30 min)

Activer RLS basique sur les tables critiques avec policies permissives, puis affiner.

```sql
-- Script d'urgence
ALTER TABLE vtc_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;

-- Policies permissives temporaires (à affiner)
-- Voir ci-dessus pour les policies détaillées
```

### Option B : Solution complète (2-3 heures)

1. Implémenter `get_firebase_user_id()`
2. Activer RLS sur toutes les tables
3. Créer toutes les policies
4. Tester exhaustivement
5. Documenter

### Option C : Backend sécurisé (1-2 jours)

Créer un backend Node.js/Express qui gère toute la logique Supabase de manière sécurisée.

---

## 💡 **Conseil**

**Pour le MVP/Démo :** Option A (fix rapide)  
**Pour la production :** Option B (solution complète)  
**Pour le scale :** Option C (backend dédié)

---

**🚨 IMPORTANT : Ne pas lancer en production sans avoir sécurisé au minimum les tables critiques (users, credits, vtc_profiles) !**

Les données sensibles (email, téléphone, carte pro, crédits) sont actuellement accessibles par n'importe qui avec un minimum de connaissances techniques.



