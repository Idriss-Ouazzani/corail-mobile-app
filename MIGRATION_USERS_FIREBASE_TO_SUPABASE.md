# 🔄 Migration des Utilisateurs Firebase → Supabase

Ce guide explique comment migrer tes utilisateurs existants de Firebase Auth vers Supabase Auth.

---

## ⚠️ Important

- Les **mots de passe** ne peuvent PAS être migrés (Firebase ne les expose pas)
- Les utilisateurs devront **réinitialiser leur mot de passe** après la migration
- **Alternative :** Migration progressive (laisser les deux systèmes coexister temporairement)

---

## 🎯 Option 1 : Migration Complète (Recommandée pour < 100 utilisateurs)

### Étape 1 : Exporter les utilisateurs depuis Firebase

```bash
# Installer Firebase CLI
npm install -g firebase-tools

# Se connecter
firebase login

# Exporter les users (remplace PROJECT_ID)
firebase auth:export users.json --project PROJECT_ID --format=JSON
```

Cela va créer un fichier `users.json` avec tous tes utilisateurs.

### Étape 2 : Exécuter le SQL de setup dans Supabase

Va dans **Supabase Dashboard → SQL Editor** et exécute :

```sql
-- Fichier déjà créé : supabase/migrations/020_setup_auth_policies.sql
```

### Étape 3 : Créer les comptes dans Supabase Auth

Pour chaque utilisateur, tu dois :

1. **Créer le compte** dans Supabase Auth (sans mot de passe)
2. **Envoyer un email de réinitialisation** de mot de passe

#### Script Node.js de migration

Crée un fichier `migrate-users.js` :

```javascript
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_KEY = 'YOUR_SERVICE_ROLE_KEY'; // ⚠️ Pas la anon key !

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function migrateUsers() {
  // Lire le fichier exporté de Firebase
  const firebaseUsers = JSON.parse(fs.readFileSync('users.json', 'utf-8'));
  
  console.log(`📦 ${firebaseUsers.users.length} utilisateurs à migrer`);

  for (const fbUser of firebaseUsers.users) {
    try {
      // Créer l'utilisateur dans Supabase Auth
      const { data, error } = await supabase.auth.admin.createUser({
        email: fbUser.email,
        email_confirm: true, // Confirmer l'email automatiquement
        user_metadata: {
          full_name: fbUser.displayName || '',
          firebase_uid: fbUser.localId, // Garder l'ancien ID pour référence
        },
      });

      if (error) {
        console.error(`❌ Erreur pour ${fbUser.email}:`, error.message);
        continue;
      }

      console.log(`✅ ${fbUser.email} migré (ID Supabase: ${data.user.id})`);

      // Mettre à jour la table public.users avec l'ancien ID Firebase
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          id: data.user.id, // Nouveau ID Supabase
          firebase_uid: fbUser.localId, // Ancien ID (optionnel, pour référence)
        })
        .eq('email', fbUser.email);

      if (updateError) {
        console.warn(`⚠️ Mise à jour public.users pour ${fbUser.email}:`, updateError.message);
      }

      // Envoyer un email de réinitialisation
      await supabase.auth.resetPasswordForEmail(fbUser.email);
      console.log(`📧 Email de réinitialisation envoyé à ${fbUser.email}`);

    } catch (err) {
      console.error(`❌ Erreur inattendue pour ${fbUser.email}:`, err);
    }
  }

  console.log('\n✅ Migration terminée !');
}

migrateUsers();
```

#### Exécuter la migration

```bash
node migrate-users.js
```

### Étape 4 : Communiquer aux utilisateurs

Envoie un email à tous tes utilisateurs :

> **Sujet :** Nouvelle version de Corail - Réinitialisation requise
> 
> Bonjour,
> 
> Nous avons migré vers une nouvelle infrastructure plus performante.
> 
> **Action requise :** Lors de votre prochaine connexion, cliquez sur "Mot de passe oublié ?" pour définir un nouveau mot de passe.
> 
> Merci de votre compréhension !
> 
> L'équipe Corail

---

## 🎯 Option 2 : Migration Progressive (Recommandée pour > 100 utilisateurs)

Si tu as beaucoup d'utilisateurs, tu peux faire une migration "douce" :

1. **Déployer l'app avec Supabase Auth**
2. **Garder Firebase Auth actif** temporairement
3. Les **nouveaux utilisateurs** créent un compte Supabase
4. Les **anciens utilisateurs** recréent leur compte Supabase au premier login
5. Après 1-2 mois, désactiver Firebase Auth

### Implémentation

Dans `LoginScreen.tsx`, ajoute une logique de fallback :

```typescript
const handleSubmit = async () => {
  setLoading(true);
  try {
    // Essayer Supabase d'abord
    try {
      await supabaseAuth.signIn(email.trim(), password);
      onLoginSuccess();
      return;
    } catch (supabaseError) {
      console.log('⚠️ Compte Supabase inexistant, essai Firebase...');
    }

    // Fallback Firebase (ancien système)
    try {
      const fbUser = await firebaseAuth.signIn(email.trim(), password);
      
      // Migrer automatiquement vers Supabase
      await supabaseAuth.signUp(email.trim(), password, fbUser.displayName || '');
      
      Alert.alert(
        'Migration effectuée ! 🎉',
        'Votre compte a été migré vers notre nouvelle plateforme.'
      );
      
      onLoginSuccess();
    } catch (firebaseError) {
      throw firebaseError;
    }
  } catch (error: any) {
    Alert.alert('Erreur', error.message);
  } finally {
    setLoading(false);
  }
};
```

---

## ✅ Vérification

Après la migration, vérifie dans **Supabase Dashboard → Authentication → Users** :

- ✅ Tous les utilisateurs sont présents
- ✅ Les emails sont confirmés
- ✅ Les métadonnées (nom) sont correctes

---

## 🚀 Prochaines Étapes

1. **Exécuter le SQL** : `020_setup_auth_policies.sql`
2. **Choisir une option** de migration (complète ou progressive)
3. **Tester** l'authentification
4. **Déployer** sur production
5. **Cleanup** Firebase Auth (optionnel)

---

## 💬 Besoin d'aide ?

Si tu as des questions ou des problèmes, je suis là pour t'aider ! 🚀

