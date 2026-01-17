# 📇 Profils Publics VTC - Guide d'implémentation

## 🎯 Objectif

Permettre aux VTC d'avoir leur **page publique** (carte de visite web) pour capturer de nouveaux clients **sans que les clients n'aient à installer l'app**.

- **URL publique** : `corail.app/vtc/[slug]` (ex: `corail.app/vtc/jean-dupont`)
- **B2B uniquement** : Corail reste un outil pour VTC, pas un intermédiaire
- **0 responsabilité transport** : Le disclaimer est affiché clairement

---

## 📦 Fichiers créés

### 1️⃣ Base de données

**Fichier** : `/database/vtc_profiles.sql`

```sql
-- Nouvelle table vtc_profiles
-- Champs: slug, display_name, bio, photo_url, phone, whatsapp, email, services, zone_city, etc.
-- RLS activé (Row Level Security)
-- Fonction increment_profile_view() pour tracker les vues
```

**✅ À faire** : Exécuter ce SQL dans Supabase

```bash
# Via Supabase Dashboard :
# Settings > SQL Editor > Coller le contenu de vtc_profiles.sql > Run
```

---

### 2️⃣ Site web (Next.js)

**Dossier** : `/corail-quotes-web/app/vtc/`

Fichiers créés :
- `[slug]/page.tsx` → Page profil VTC (publique)
- `[slug]/not-found.tsx` → Page 404 personnalisée

**✅ Rien à faire** : Les fichiers sont isolés, ne cassent rien

---

## 🧪 Test Manuel (AVANT d'aller plus loin)

### Étape 1 : Créer un profil de test

Dans Supabase Dashboard :

```sql
-- Remplacer YOUR_USER_ID par un vrai user_id
INSERT INTO vtc_profiles (
  user_id,
  slug,
  display_name,
  bio,
  phone,
  whatsapp,
  email,
  services,
  zone_city,
  is_public
) VALUES (
  'YOUR_USER_ID',  -- ⚠️ REMPLACER PAR UN VRAI ID
  'test-vtc',
  'VTC Test',
  'Chauffeur professionnel à Toulouse. Service premium, véhicules haut de gamme.',
  '+33612345678',
  '33612345678',
  'test@vtc.com',
  '["Aéroport", "Mariage", "VIP"]'::jsonb,
  'Toulouse',
  true
);
```

### Étape 2 : Lancer le serveur local

```bash
cd /Users/idriss.ouazzani/Cursor/corail-quotes-web
npm run dev
```

### Étape 3 : Ouvrir dans le navigateur

```
http://localhost:3000/vtc/test-vtc
```

**✅ Si ça marche** : Tu devrais voir le profil avec nom, bio, services, boutons WhatsApp/Téléphone/Email

**❌ Si ça ne marche pas** :
- Vérifier que la table `vtc_profiles` existe dans Supabase
- Vérifier que le profil `test-vtc` est bien créé avec `is_public = true`
- Vérifier les logs du serveur Next.js

---

## 📱 Intégration App Mobile (Étape suivante, OPTIONNELLE)

**⚠️ ON NE FAIT PAS ÇA MAINTENANT** (pour ne rien casser)

Une fois que le test web fonctionne, on pourra ajouter dans l'app :

1. **Nouvelle page "Ma Page Publique"** (Settings)
   - Créer/éditer son profil VTC
   - Générer son slug unique
   - Copier le lien `corail.app/vtc/[slug]`
   - Voir les stats (nombre de vues)

2. **Partage facile**
   - Bouton "Partager ma page" (WhatsApp, SMS, Email)
   - QR Code (scan → ouvre la page publique)

---

## 🔒 Sécurité et conformité

### RLS (Row Level Security)
- ✅ Les profils publics sont lisibles par tous (lecture seule)
- ✅ Seul le propriétaire peut modifier son profil
- ✅ Les profils `is_public = false` sont invisibles

### Disclaimer
- ✅ Affiché clairement : "Corail n'est pas responsable du transport"
- ✅ Les réservations se font directement avec le chauffeur

### RGPD
- ✅ Le VTC choisit quelles infos publier (opt-in)
- ✅ Peut désactiver son profil à tout moment (`is_public = false`)

---

## 📊 Analytics (pour le VTC)

Chaque fois qu'un visiteur ouvre la page :
- Compteur `view_count` incrémenté automatiquement
- `last_viewed_at` mis à jour

Le VTC peut voir ces stats dans l'app (à implémenter plus tard).

---

## 🚀 Déploiement Production (Après validation)

### 1. Déployer la BDD

```bash
# Dans Supabase Dashboard :
# SQL Editor > Coller vtc_profiles.sql > Run
```

### 2. Déployer le site web

```bash
cd /Users/idriss.ouazzani/Cursor/corail-quotes-web
git add .
git commit -m "feat: Ajout profils publics VTC"
git push

# Vercel va automatiquement déployer
# Le site sera accessible sur corail.app/vtc/[slug]
```

---

## ❓ Questions / Problèmes

### "La table vtc_profiles n'existe pas"
→ Exécuter `vtc_profiles.sql` dans Supabase

### "RPC function increment_profile_view does not exist"
→ Vérifier que la fonction SQL a bien été créée (elle est dans `vtc_profiles.sql`)

### "Le profil ne s'affiche pas"
→ Vérifier que `is_public = true` dans la BDD

### "Erreur lucide-react"
→ Installer les dépendances : `cd corail-quotes-web && npm install lucide-react`

---

## 📝 Notes importantes

- **0 impact sur l'existant** : Tout est isolé (nouvelle table, nouveau dossier `/vtc`)
- **Testable progressivement** : D'abord le SQL, puis le web, puis l'app
- **Réversible** : Si tu veux annuler, il suffit de supprimer la table `vtc_profiles` et le dossier `/vtc`
- **B2B focus maintenu** : Disclaimer clair, pas de paiement, pas de plateforme de réservation

---

## 🎯 Prochaines étapes (après validation du test)

1. ✅ Tester le SQL + Web (étape actuelle)
2. 🔜 Ajouter l'interface dans l'app mobile (création/édition profil)
3. 🔜 Ajouter le partage (lien + QR code)
4. 🔜 Ajouter les analytics dans l'app (voir les vues)

**Pour l'instant, on attend que tu testes** : crée un profil dans Supabase, lance le serveur local, et ouvre `http://localhost:3000/vtc/test-vtc`.

**Si ça marche bien, on continue. Si ça casse quelque chose, on annule facilement.** 🚀



