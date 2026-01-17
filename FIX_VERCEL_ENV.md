# 🔧 Configurer les variables d'environnement sur Vercel

## 🔴 Problème

La page Next.js sur Vercel ne peut pas se connecter à Supabase car les **variables d'environnement ne sont pas configurées en production**.

## ✅ Solution

### Étape 1 : Aller sur Vercel

1. Va sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Clique sur le projet **`corail-quotes-web`**
3. Va dans **"Settings"** (en haut)
4. Dans le menu de gauche, clique sur **"Environment Variables"**

### Étape 2 : Ajouter les variables

Ajoute ces 2 variables :

#### Variable 1 : NEXT_PUBLIC_SUPABASE_URL

- **Key** : `NEXT_PUBLIC_SUPABASE_URL`
- **Value** : `https://qeheawdjlwlkhnwbhqcg.supabase.co`
- **Environments** : Coche **Production**, **Preview**, **Development**
- Clique "Save"

#### Variable 2 : NEXT_PUBLIC_SUPABASE_ANON_KEY

- **Key** : `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value** : `YOUR_SUPABASE_ANON_KEY` (Supabase > Settings > API)
- **Environments** : Coche **Production**, **Preview**, **Development**
- Clique "Save"

### Étape 3 : Redéployer

Après avoir ajouté les variables, il faut **redéployer** :

1. Va dans l'onglet **"Deployments"**
2. Trouve le dernier déploiement
3. Clique sur les **"..."** à droite
4. Clique **"Redeploy"**
5. Attends 2-3 minutes

### Étape 4 : Tester

Après le redéploiement, va sur :
```
https://corail-quotes-web.vercel.app/vtc/poochi
```

✅ **La page devrait s'afficher !**

---

## 📊 Résumé

**Sans les variables d'environnement**, la page Next.js ne peut pas :
- Se connecter à Supabase
- Récupérer le profil VTC
- Afficher les données

**Avec les variables**, tout fonctionnera ! 🎉

---

## 🧪 Vérification rapide

Tu peux vérifier si les variables sont bien configurées :

1. Va sur Vercel Dashboard → Ton projet
2. Settings → Environment Variables
3. Tu devrais voir :
   - ✅ `NEXT_PUBLIC_SUPABASE_URL`
   - ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Si elles ne sont pas là → C'est le problème !
Si elles sont là → Redéploie quand même pour être sûr

---

**Configure les variables sur Vercel et redéploie !** 🚀



