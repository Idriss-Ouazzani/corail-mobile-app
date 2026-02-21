# 📤 Upload du logo Corail sur Supabase Storage

Guide pour héberger le logo et le rendre accessible publiquement dans les emails.

---

## 🎯 **OBJECTIF**

Uploader `assets/corail-logo.png` sur Supabase Storage pour l'utiliser dans les emails.

---

## 📋 **ÉTAPES**

### **Option A : Via le Dashboard Supabase (PLUS FACILE)**

1. Va sur https://supabase.com/dashboard/project/qeheawdjlwlkhnwbhqcg/storage/buckets

2. **Créer un bucket public :**
   - Clique sur **"New bucket"**
   - Name : `public-assets`
   - Public bucket : ✅ **COCHÉ** (important !)
   - Clique sur **"Create bucket"**

3. **Uploader le logo :**
   - Clique sur le bucket `public-assets`
   - Clique sur **"Upload file"**
   - Sélectionne `/Users/idriss.ouazzani/Cursor/Corail-mobileapp/assets/corail-logo.png`
   - Clique sur **"Upload"**

4. **Récupérer l'URL publique :**
   - Clique sur le fichier uploadé `corail-logo.png`
   - Clique sur **"Get public URL"** ou **"Copy URL"**
   - Tu devrais avoir une URL comme :
     ```
     https://qeheawdjlwlkhnwbhqcg.supabase.co/storage/v1/object/public/public-assets/corail-logo.png
     ```

5. **✅ COPIE CETTE URL** - On va l'utiliser dans le template email !

---

### **Option B : Via la CLI (si tu préfères)**

```bash
# 1. Créer le bucket public
supabase storage create public-assets --project-ref qeheawdjlwlkhnwbhqcg --public

# 2. Uploader le logo
supabase storage upload public-assets /Users/idriss.ouazzani/Cursor/Corail-mobileapp/assets/corail-logo.png --project-ref qeheawdjlwlkhnwbhqcg

# 3. Récupérer l'URL
echo "https://qeheawdjlwlkhnwbhqcg.supabase.co/storage/v1/object/public/public-assets/corail-logo.png"
```

---

## ✅ **URL FINALE**

Une fois uploadé, l'URL publique sera :
```
https://qeheawdjlwlkhnwbhqcg.supabase.co/storage/v1/object/public/public-assets/corail-logo.png
```

**📋 Copie cette URL et envoie-la moi pour que je l'intègre dans le template email !**

