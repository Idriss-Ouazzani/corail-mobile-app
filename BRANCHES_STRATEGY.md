# 🌳 Stratégie des Branches Git

## 📋 Vue d'ensemble

Ce document explique la structure des branches du projet Corail et comment naviguer entre les différentes versions de l'app.

---

## 🌿 Structure des branches

### 1️⃣ `main` (Production)
**Rôle** : Branche de production stable
- Contient la version déployée sur les stores
- Ne jamais commit directement dessus sans test
- Merge uniquement depuis `assistant-pivot` après validation

### 2️⃣ `marketplace-v1` (Archive - NE PAS TOUCHER ⚠️)
**Rôle** : Sauvegarde de la version marketplace originale
- ✅ **Gelée le 29 décembre 2025**
- 🔒 **Branche protégée** - Ne plus modifier
- 📦 Archive de référence de la marketplace P2P

**Fonctionnalités incluses** :
- ✅ Marketplace de courses entre VTC
- ✅ Système de crédits Corail
- ✅ Système de badges gamification
- ✅ Groupes VTC
- ✅ Panel Admin de vérification
- ✅ Authentification Firebase + Google
- ✅ Backend FastAPI + Databricks

**Quand l'utiliser** :
- Pour référence technique
- Pour réactiver la marketplace plus tard
- Pour comparer avec la version Assistant

**Comment y accéder** :
```bash
git checkout marketplace-v1
```

### 3️⃣ `assistant-pivot` (Développement actif 🚧)
**Rôle** : Nouvelle version "Assistant VTC" en développement
- 🚀 **Branche de travail active**
- 🎯 Pivot vers l'assistant personnel pour VTC
- 🔄 Se merge régulièrement vers `main` après tests

**Nouvelles fonctionnalités prévues** :
- 📱 QR Code professionnel
- 🚗 Gestion de courses externes (Uber, Bolt, Direct)
- 📊 Dashboard personnel avec stats
- 📅 Planning/calendrier
- 🔔 Notifications & rappels
- 🏪 Marketplace en fonctionnalité secondaire (pas core)

**Comment y accéder** :
```bash
git checkout assistant-pivot
```

---

## 🔄 Workflow de développement

### Développement quotidien :
```bash
# Travailler sur assistant-pivot
git checkout assistant-pivot
git add .
git commit -m "Feat: ..."
git push origin assistant-pivot
```

### Déployer en production :
```bash
# Merger vers main après tests
git checkout main
git merge assistant-pivot
git push origin main
```

### Revenir à la marketplace originale :
```bash
# Pour référence uniquement (lecture seule)
git checkout marketplace-v1
```

---

## 📊 Comparaison des versions

| Fonctionnalité | Marketplace v1 | Assistant (en dev) |
|----------------|----------------|-------------------|
| **Core focus** | Échange de courses P2P | Assistant personnel VTC |
| **QR Code** | ❌ | ✅ |
| **Stats personnelles** | Basique | ✅ Avancées |
| **Courses externes** | ❌ | ✅ (Uber/Bolt/Direct) |
| **Planning** | ❌ | ✅ |
| **Marketplace** | ✅ Core | ✅ Secondaire |
| **Crédits Corail** | ✅ | ✅ (réutilisé) |
| **Badges** | ✅ | ✅ (réutilisé) |
| **Groupes** | ✅ | ✅ (réutilisé) |
| **Admin Panel** | ✅ | ✅ (réutilisé) |

---

## 🎯 Stratégie de transition

### Phase 1 : Développement Assistant (3 semaines)
- Branche : `assistant-pivot`
- Focus : QR Code, Dashboard, Enregistrement courses
- Marketplace reste présente mais secondaire

### Phase 2 : Tests & Validation (1 semaine)
- Tests utilisateurs sur `assistant-pivot`
- Corrections de bugs
- Optimisations

### Phase 3 : Déploiement (1 jour)
- Merge `assistant-pivot` → `main`
- Déploiement stores
- Communication utilisateurs

### Phase 4 : Activation Marketplace (quand >100 users)
- Marketplace déjà présente dans le code
- Simplement la mettre en avant dans l'UI
- Notifications push pour promouvoir la feature

---

## ⚠️ Règles importantes

### ❌ NE JAMAIS :
- Modifier la branche `marketplace-v1` (archive protégée)
- Force push sur `main`
- Supprimer des branches sans backup

### ✅ TOUJOURS :
- Développer sur `assistant-pivot`
- Tester avant de merger vers `main`
- Commit avec des messages clairs
- Documenter les changements majeurs

---

## 🔖 Tags importants

Pour faciliter la navigation dans l'historique :

```bash
# Créer un tag pour la version marketplace finale
git tag -a marketplace-final -m "Version finale marketplace avant pivot assistant"
git push origin marketplace-final

# Plus tard, pour revenir à ce point précis
git checkout marketplace-final
```

---

## 📞 Support

En cas de problème avec les branches :
1. Ne pas paniquer
2. Ne rien forcer
3. Demander de l'aide avant de faire des opérations destructives

---

**Dernière mise à jour** : 29 décembre 2025
**Créé par** : Assistant IA
**Version** : 1.0

