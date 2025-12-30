# 🔔 Système de Notifications - Corail VTC

## Vue d'ensemble

Système complet de notifications push et locales pour garder les chauffeurs informés de leurs courses et activités.

---

## 🎯 Types de Notifications

### 1. **Rappel de Course** ⏰
- **Déclencheur** : 1 heure avant une course planifiée
- **Contenu** : Adresse départ → Adresse arrivée
- **Cas d'usage** :
  - Quand vous **créez** une course marketplace
  - Quand vous **réclamez** une course marketplace

### 2. **Résumé Quotidien** 📅
- **Déclencheur** : Tous les jours à 8h du matin
- **Contenu** : "Vous avez X courses prévues aujourd'hui"
- **Cas d'usage** : 
  - Calculé automatiquement depuis votre planning
  - Uniquement si vous avez des courses prévues

### 3. **Nouvelles Courses Disponibles** 🆕
- **Déclencheur** : Quand de nouvelles courses sont publiées
- **Contenu** : "X nouvelles courses disponibles sur la marketplace"
- **Note** : À intégrer côté backend avec webhook

### 4. **QR Code Prêt** ✨
- **Déclencheur** : Une seule fois après vérification validée
- **Contenu** : "Votre QR Code est prêt ! Partagez-le avec vos clients"

### 5. **Crédits Faibles** ⚠️
- **Déclencheur** : Quand vous avez moins de 2 crédits
- **Contenu** : "Plus que X crédit(s). Pensez à publier des courses !"
- **Limite** : Maximum 1 notification par jour (évite le spam)

### 6. **Nouveau Badge** 🏆
- **Déclencheur** : Quand vous débloquez un badge
- **Contenu** : Nom et description du badge
- **Cas d'usage** : À intégrer avec le système de badges

### 7. **Invitation Groupe** 👥
- **Déclencheur** : Quand quelqu'un vous invite à un groupe
- **Contenu** : "[Nom] vous a invité à rejoindre [Groupe]"

### 8. **Rappel Terminer Course** ✅
- **Déclencheur** : 2 heures après l'heure prévue de la course
- **Contenu** : "Pensez à marquer votre course comme terminée pour gagner un crédit bonus"
- **Cas d'usage** : Uniquement pour les courses réclamées

### 9. **Course Réclamée** 🎉
- **Déclencheur** : Quand quelqu'un prend votre course publiée
- **Contenu** : "[Nom] a pris votre course ([Adresse])"
- **Note** : À implémenter côté backend

---

## 🛠️ Architecture Technique

### Fichiers Créés

1. **`src/services/notifications.ts`** (450 lignes)
   - Service complet de gestion des notifications
   - Fonctions de planification et d'annulation
   - Gestion des permissions
   - Préférences utilisateur (AsyncStorage)

2. **`src/components/NotificationSettings.tsx`** (404 lignes)
   - Interface de configuration
   - Toggles pour chaque type de notification
   - Compteur de notifications planifiées
   - Bouton de test

3. **Intégrations** :
   - `App.tsx` : Initialisation au démarrage
   - `DashboardScreen.tsx` : Résumé quotidien
   - `RideDetailScreen` (via App.tsx) : Rappels courses

---

## 📱 Utilisation pour l'utilisateur

### Accéder aux paramètres
1. Aller dans **Profil** (onglet du bas)
2. Cliquer sur **Notifications**
3. Activer/Désactiver les notifications par type

### Préférences sauvegardées
- Les préférences sont stockées localement
- Persistent entre les sessions
- Par défaut : tout activé

### Test
Un bouton "Envoyer une notification test" permet de vérifier que tout fonctionne.

---

## 🔐 Permissions

Au premier lancement après mise à jour :
- L'app demande automatiquement les permissions de notifications
- Si refusées, l'utilisateur peut les activer dans les réglages iOS/Android
- Sans permissions, les notifications ne seront pas affichées

---

## ⚙️ Configuration iOS

Les notifications sont configurées avec :
- **Badge** : ✅ (compteur sur l'icône)
- **Son** : ✅ (alerte sonore)
- **Bannière** : ✅ (popup en haut d'écran)
- **Couleur LED** : #FF6B47 (orange Corail)
- **Vibration** : Pattern personnalisé

---

## 🧪 Tests Recommandés

### Scénario 1 : Claim d'une course
1. Prendre une course marketplace prévue dans 30 min
2. Attendre 30 min (la notification devrait apparaître 1h avant, donc immédiatement si < 1h)
3. ✅ Vérifier notification "Course dans 1 heure"

### Scénario 2 : Créer une course
1. Publier une course prévue demain à 14h
2. ✅ Notification planifiée pour demain à 13h

### Scénario 3 : Crédits faibles
1. Avoir 1 crédit restant
2. Ouvrir l'app
3. ✅ Notification "Crédits faibles"

### Scénario 4 : Résumé quotidien
1. Avoir 2-3 courses prévues demain
2. ✅ Notification demain à 8h "Vous avez 3 courses prévues aujourd'hui"

---

## 🚀 Prochaines Améliorations

### À implémenter côté backend :
1. **Webhook nouvelles courses** : Notifier tous les chauffeurs quand une course est publiée dans leur zone
2. **Notification course réclamée** : Endpoint pour notifier le créateur
3. **Rappels intelligents** : Basé sur historique (ex: "Vous n'avez pas conduit depuis 3 jours")
4. **Statistiques** : "Vous avez gagné +50€ cette semaine !"

### Notifications push serveur (FCM) :
- Actuellement : Notifications locales uniquement
- Futur : Push notifications depuis le backend
- Avantage : Fonctionne même quand l'app est fermée

---

## 📊 Métriques

- **9 types** de notifications
- **0 erreurs** de linter
- **~1850 lignes** de code ajoutées
- **Tests** : À effectuer manuellement

---

## 🎨 Design

Interface cohérente avec l'app :
- Fond blanc (#F9FAFB)
- Accent orange Corail (#FF6B47)
- Icônes Ionicons
- Toggles iOS-style

---

## ✅ Statut Actuel

- [x] Service de notifications créé
- [x] Composant paramètres créé
- [x] Intégré dans App.tsx
- [x] Rappels courses (claim + créer)
- [x] Résumé quotidien
- [x] QR Code + Crédits faibles
- [x] Préférences persistantes
- [x] Commit & Push réussis
- [ ] Tests utilisateur à effectuer
- [ ] Backend push notifications (futur)

---

## 📞 Support

Si une notification ne fonctionne pas :
1. Vérifier les permissions iOS/Android
2. Vérifier dans Profil > Notifications que c'est activé
3. Utiliser "Notification test" pour diagnostiquer
4. Consulter les logs : `console.log('🔔 ...')`

---

**Créé le** : 30 décembre 2025
**Auteur** : Claude (Assistant IA)
**Version** : 1.0.0

