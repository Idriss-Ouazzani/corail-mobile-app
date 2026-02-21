# 🧹 Nettoyer les Notifications Persistantes

Si vous recevez des notifications "crédits faibles" même avec > 2 crédits, c'est probablement dû à des notifications planifiées qui persistent.

## 🔧 Solution

Ajoutez ce code au démarrage de l'app pour nettoyer toutes les notifications planifiées :

```typescript
import * as Notifications from 'expo-notifications';

// Dans App.tsx ou AuthContext, au démarrage
useEffect(() => {
  const clearOldNotifications = async () => {
    try {
      // Annuler toutes les notifications planifiées
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('✅ Notifications planifiées nettoyées');
    } catch (error) {
      console.error('❌ Erreur nettoyage notifications:', error);
    }
  };
  
  clearOldNotifications();
}, []);
```

## 📱 Alternative : Nettoyer depuis l'appareil

1. **iOS** : Allez dans Réglages > Notifications > Corail > Désactiver puis réactiver
2. **Forcer la suppression des données** : Supprimer et réinstaller l'app

## 🔍 Diagnostic

Ajoutez ce code pour voir toutes les notifications planifiées :

```typescript
import * as Notifications from 'expo-notifications';

const listScheduledNotifications = async () => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  console.log('📋 Notifications planifiées:', scheduled);
};
```

## ✅ Fix Permanent

La condition dans `src/services/notifications.ts` ligne 304 vérifie déjà `credits >= 2` :

```typescript
if (!prefs.enabled || !prefs.lowCredits || credits >= 2) return;
```

Donc si vous avez >= 2 crédits, aucune nouvelle notification ne sera envoyée.

