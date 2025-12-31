# 🔍 Debug erreur 404 sur la page devis

## ✅ Bonne nouvelle
Le devis **EST créé** dans Supabase avec succès !

```
Token: c03171781a01
ID: quote-ffbf7047
Driver ID: bOZOPZC6nadDRfklWBa2hH4As443
```

## ❌ Problème
La page web Vercel retourne 404 quand on ouvre le lien.

## 🔎 Cause probable
La page Next.js fait une requête avec un JOIN vers la table `users` pour récupérer `company_name` :

```sql
SELECT *, users!quotes_driver_id_fkey (full_name, company_name, phone)
FROM quotes
WHERE token = 'c03171781a01'
```

**Le problème** : Votre utilisateur n'a probablement pas de `company_name` dans la table `users`.

## ✅ Solution rapide

### Option 1 : Ajouter company_name à votre utilisateur (2 min)

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet **Corail**
3. Cliquez sur **Table Editor** (menu gauche)
4. Sélectionnez la table **users**
5. Trouvez votre ligne (ID = `bOZOPZC6nadDRfklWBa2hH4As443`)
6. Cliquez pour éditer
7. Dans la colonne **company_name**, ajoutez : `VTC Idriss` (ou le nom de votre société)
8. Sauvegardez

### Option 2 : Rendre company_name optionnel dans la page web

Je peux modifier la page Next.js pour ne pas exiger company_name.

---

## 🧪 Test après correction

Une fois company_name ajouté, testez ce lien :
https://corail-quotes-web.vercel.app/q/c03171781a01

Ça devrait afficher le devis ! 🎉

