# 🧪 Test Profils VTC - Guide Rapide

## ✅ Ce qui a été créé (SANS TOUCHER À L'EXISTANT)

### 📂 Fichiers
- ✅ `database/vtc_profiles.sql` → Script SQL (nouvelle table)
- ✅ `corail-quotes-web/app/vtc/[slug]/page.tsx` → Page profil VTC
- ✅ `corail-quotes-web/app/vtc/[slug]/not-found.tsx` → Page 404
- ✅ `corail-quotes-web/INSTALL_VTC_DEPS.sh` → Script installation dépendances

### 🔒 Sécurité
- ✅ Tout est isolé (nouveau dossier `/vtc`, nouvelle table `vtc_profiles`)
- ✅ 0 modification du code existant
- ✅ Réversible en 2 secondes (supprimer la table + le dossier)

---

## 🚀 Comment tester (3 étapes)

### Étape 1 : Créer la table dans Supabase

1. Ouvre **Supabase Dashboard** : https://supabase.com/dashboard
2. Va dans **SQL Editor**
3. Copie-colle le contenu de `database/vtc_profiles.sql`
4. Clique sur **Run**

✅ **Résultat attendu** : "Success. No rows returned"

---

### Étape 2 : Créer un profil de test

Dans Supabase, **Table Editor** > **vtc_profiles** > **Insert row** :

```
slug: test-vtc
display_name: Jean Dupont
bio: Chauffeur VTC professionnel à Toulouse. Service premium depuis 10 ans.
phone: +33612345678
whatsapp: 33612345678
email: jean.dupont@vtc.com
services: ["Aéroport", "Mariage", "VIP", "Longue distance"]
zone_city: Toulouse
is_public: true
user_id: [TON USER ID - trouve-le dans la table users]
```

✅ **Résultat attendu** : Une nouvelle ligne apparaît dans la table

---

### Étape 3 : Tester le site web

#### A. Installer les dépendances

```bash
cd /Users/idriss.ouazzani/Cursor/corail-quotes-web
./INSTALL_VTC_DEPS.sh
```

#### B. Lancer le serveur

```bash
npm run dev
```

#### C. Ouvrir dans le navigateur

```
http://localhost:3000/vtc/test-vtc
```

---

## ✅ Résultat attendu

Tu devrais voir :

```
╔════════════════════════════════════════╗
║  🅲  Corail                            ║
╠════════════════════════════════════════╣
║                                        ║
║  [Photo gradient avec "J"]             ║
║                                        ║
║  Jean Dupont                           ║
║  📍 Toulouse                            ║
║                                        ║
║  Chauffeur VTC professionnel à         ║
║  Toulouse. Service premium depuis      ║
║  10 ans.                               ║
║                                        ║
║  SERVICES PROPOSÉS                     ║
║  [Aéroport] [Mariage] [VIP]            ║
║  [Longue distance]                     ║
║                                        ║
║  ME CONTACTER                          ║
║  [💬 WhatsApp]                         ║
║  [📞 Appeler]                          ║
║  [✉️  Email]                           ║
║                                        ║
╚════════════════════════════════════════╝

Corail est un outil professionnel pour VTC.
Les réservations se font directement avec le chauffeur.
Corail n'est pas responsable du transport.
```

---

## 🎯 Test des fonctionnalités

### 1. Bouton WhatsApp
Clique sur "WhatsApp" → Doit ouvrir WhatsApp avec un message pré-rempli

### 2. Bouton Appeler
Clique sur "Appeler" → Doit lancer l'app téléphone avec le numéro

### 3. Bouton Email
Clique sur "Email" → Doit ouvrir le client email

### 4. Analytics
Recharge la page plusieurs fois → Va dans Supabase, vérifie que `view_count` augmente

### 5. Profil inexistant
Essaie `http://localhost:3000/vtc/inexistant` → Doit afficher la page 404 élégante

### 6. Profil non-public
Dans Supabase, mets `is_public = false` → La page doit afficher "Profil introuvable"

---

## ❌ Si ça ne marche pas

### Erreur "Table vtc_profiles does not exist"
→ Tu n'as pas exécuté le SQL dans Supabase (Étape 1)

### Erreur "lucide-react not found"
→ Tu n'as pas lancé `INSTALL_VTC_DEPS.sh` (Étape 3A)

### Page blanche
→ Regarde les logs du serveur Next.js (terminal)
→ Vérifie que `is_public = true` dans Supabase

### "User not found" ou erreur user_id
→ Remplace `user_id` par un vrai ID de la table `users`

---

## 🗑️ Comment tout annuler (si tu changes d'avis)

```sql
-- Dans Supabase SQL Editor :
DROP TABLE IF EXISTS vtc_profiles CASCADE;
DROP FUNCTION IF EXISTS increment_profile_view CASCADE;
```

```bash
# Supprimer les fichiers web :
rm -rf /Users/idriss.ouazzani/Cursor/corail-quotes-web/app/vtc
rm /Users/idriss.ouazzani/Cursor/corail-quotes-web/INSTALL_VTC_DEPS.sh
```

---

## 📊 Statistiques après test

Une fois que tu as testé, vérifie dans Supabase :

```sql
SELECT 
  slug, 
  display_name, 
  view_count, 
  last_viewed_at 
FROM vtc_profiles;
```

Tu devrais voir que `view_count` a augmenté à chaque visite !

---

## 🚀 Prochaines étapes (après validation)

1. ✅ **Si le test fonctionne** :
   - On déploie en production (Vercel + Supabase prod)
   - On ajoute l'interface dans l'app mobile (créer/éditer profil)
   - On ajoute le partage (lien + QR code)
   - On ajoute les analytics dans l'app

2. ❌ **Si ça ne marche pas** :
   - Envoie-moi les logs d'erreur
   - On debug ensemble
   - 0 risque pour l'existant (tout est isolé)

---

**🎯 Lance le test et dis-moi ce que tu vois !** 🚀



