# 📥 Téléchargement rapide des logos

## 🎯 Liens directs

### 1. Google Maps Logo
```
https://www.google.com/images/branding/product/2x/maps_96dp.png
```
**→ Télécharger et renommer en** `google-maps.png`

---

### 2. Waze Logo
```
https://upload.wikimedia.org/wikipedia/commons/d/d9/Waze_logo.svg
```
**→ Convertir SVG → PNG (512x512px) et renommer en** `waze.png`

**Ou utiliser ce PNG direct** :
```
https://logos-world.net/wp-content/uploads/2020/11/Waze-Logo.png
```

---

### 3. Apple Maps Logo

**Recherche Google Images** :
```
"apple maps logo png transparent 512x512"
```

**Ou télécharge depuis** :
- https://icon-icons.com/icon/apple-maps/154797
- https://www.iconfinder.com/icons/317750/maps_apple_icon

**→ Renommer en** `apple-maps.png`

---

### 4. Carte de fond

**Utilise l'image que tu as envoyée** ou télécharge :

**Option 1 : Shutterstock** (payant mais pro)
```
https://www.shutterstock.com/search/city+map+pattern
```

**Option 2 : Gratuit**
- https://unsplash.com/s/photos/city-map
- https://www.freepik.com/search?format=search&query=city+map+vector

**Option 3 : Génère ta propre carte**
1. Va sur https://snazzymaps.com/
2. Choisis un style noir et blanc
3. Screenshot et enregistre

**→ Renommer en** `map-background.png`

---

## ⚡ Installation rapide

```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp

# Créer les dossiers
mkdir -p assets/logos

# Télécharger (exemple avec curl)
cd assets/logos
curl -o google-maps.png "https://www.google.com/images/branding/product/2x/maps_96dp.png"

# Puis ajouter manuellement les autres logos
```

---

## 📐 Spécifications techniques

| Fichier | Format | Taille | Fond |
|---------|--------|--------|------|
| `map-background.png` | PNG | 1200x600px | Noir/blanc |
| `google-maps.png` | PNG | 512x512px | Transparent |
| `waze.png` | PNG | 512x512px | Transparent |
| `apple-maps.png` | PNG | 512x512px | Transparent |

---

## 🎨 Alternative : Créer les logos toi-même

### Avec Figma/Photoshop

1. Crée un carré 512x512px
2. Fond transparent
3. Ajoute le logo centré (≈400x400px)
4. Exporte en PNG

### Avec AI (Stable Diffusion, Midjourney)

**Prompt** :
```
"Google Maps logo, clean, simple, official design, PNG, transparent background, 4K"
```

---

## ✅ Checklist finale

- [ ] `assets/map-background.png` ajouté
- [ ] `assets/logos/google-maps.png` ajouté
- [ ] `assets/logos/waze.png` ajouté
- [ ] `assets/logos/apple-maps.png` ajouté
- [ ] Relancé Metro Bundler (`npx expo start --clear`)
- [ ] Testé l'app

---

**Besoin d'aide ?** Si les liens ne fonctionnent pas, recherche directement sur Google Images :
- "google maps logo png"
- "waze logo png"
- "apple maps logo png"

Et filtre par : **Transparent** + **Grande taille**

