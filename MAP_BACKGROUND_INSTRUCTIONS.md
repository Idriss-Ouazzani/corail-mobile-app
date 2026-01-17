# 🗺️ Ajouter l'image de fond de carte

## 🎯 L'app fonctionne MAINTENANT !

Le code est prêt et fonctionne avec un **fallback** (fond simple).

Pour avoir la **vraie carte floutée**, suis ces étapes :

---

## 📥 Étape 1 : Sauvegarde l'image

### Option A : Image que tu as envoyée dans le chat

1. **Clique-droit** sur l'image de carte que tu as envoyée
2. **"Enregistrer l'image sous..."**
3. **Nomme-la** : `map-background.png`
4. **Sauvegarde dans** : `/Users/idriss.ouazzani/Cursor/Corail-mobileapp/assets/`

### Option B : Télécharge une carte similaire

```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp/assets

# Télécharge une carte de ville
curl -o map-background.png "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200"
```

### Option C : Utilise une image existante

Si tu as déjà une image de carte noir et blanc sur ton Mac, copie-la :

```bash
cp ~/Downloads/ta-carte.png /Users/idriss.ouazzani/Cursor/Corail-mobileapp/assets/map-background.png
```

---

## 🔄 Étape 2 : Redémarre l'app

```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp
npx expo start --clear
```

Puis **recharge l'app** :
- Secoue le téléphone → **"Reload"**
- Ou appuie sur `r` dans le terminal

---

## ✅ Résultat

### Avant (sans image) :
- Fond simple avec icône grise
- Boutons colorés fonctionnels ✅

### Après (avec image) :
- **Vraie carte floutée en fond** 🗺️
- Effet BlurView professionnel
- Boutons colorés au-dessus
- Look premium ! ✨

---

## 📐 Spécifications image

| Propriété | Valeur recommandée |
|-----------|-------------------|
| **Format** | PNG ou JPG |
| **Taille** | 1200x600px minimum |
| **Style** | Noir et blanc, lignes de rue |
| **Poids** | < 1MB |

---

## 🐛 Dépannage

### L'image ne s'affiche pas

1. Vérifie le nom : **exactement** `map-background.png`
2. Vérifie le dossier : `assets/` (pas `assets/logos/`)
3. Redémarre Metro : `npx expo start --clear`

### L'app crash

L'app **ne devrait PAS crasher** ! Le fallback est là pour ça.

Si elle crash quand même :
```bash
npx expo start --clear
```

---

## 💡 Alternative : Reste avec le fallback

Si tu veux garder le fond simple (sans image) :

**✅ C'est déjà fonctionnel !**

Les boutons marchent, c'est juste que le fond n'a pas de carte visible.

---

## 📄 Checklist

- [ ] Image sauvegardée dans `assets/map-background.png`
- [ ] Metro redémarré (`npx expo start --clear`)
- [ ] App rechargée (secoue → Reload)
- [ ] Carte visible en fond ✨

---

**Status actuel** : ✅ L'app fonctionne avec ou sans l'image !

Ajoute juste l'image quand tu veux pour avoir le look final 🎨



