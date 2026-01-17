# 📦 Installer expo-image pour le preview d'image

## ⚠️ Problème npm

Si tu as l'erreur :
```
npm error Your cache folder contains root-owned files
```

## ✅ Solution

### Option 1 : Réparer npm (recommandé)

```bash
sudo chown -R $(whoami) ~/.npm
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp
npm install expo-image
```

### Option 2 : Utiliser npx (si Option 1 ne marche pas)

```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp
npx expo install expo-image
```

### Option 3 : Via Expo Go (le plus simple)

Si tu utilises Expo Go, `expo-image` est **déjà inclus** ! Pas besoin d'installer.

## 🧪 Après installation

Relance l'app et le preview fonctionnera ! 🎉

`expo-image` est beaucoup plus robuste que `React Native Image` et gère parfaitement les URLs Supabase.



