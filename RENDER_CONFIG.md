# ⚙️ Configuration Render.com - Variables d'environnement

## 🔐 Variables à configurer dans Render

Va dans ton service Render → **Environment** → Ajoute ces variables :

### 1️⃣ Databricks Connection (3 variables)
```
DATABRICKS_HOST
Valeur: ton-workspace.cloud.databricks.com
```

```
DATABRICKS_HTTP_PATH
Valeur: /sql/1.0/warehouses/abc123xyz
```

```
DATABRICKS_TOKEN
Valeur: dapi1234567890abcdefghijklmnopqrstuvwxyz
```

### 2️⃣ Catalog & Schema (2 variables)
```
CATALOG
Valeur: io_catalog
```

```
SCHEMA
Valeur: corail
```

### 3️⃣ Firebase Credentials (1 variable) ⚠️ IMPORTANT

**Option A : Variable d'environnement (RECOMMANDÉ pour Render)**
```
FIREBASE_SECRET
Valeur: {"type":"service_account","project_id":"corail-vtc",...TOUT_LE_JSON...}
```
👉 Colle tout le contenu de ton fichier `firebase-key.json` sur une seule ligne

**OU**

**Option B : Secret File**
- Clique sur "Add Secret File"
- Filename: `/etc/secrets/firebase-key.json`
- Contents: Colle tout le contenu de `firebase-key.json`
- Ajoute la variable d'environnement:
```
FIREBASE_CREDENTIALS_PATH
Valeur: /etc/secrets/firebase-key.json
```

---

## 📝 Résumé : Les 6 variables obligatoires

| Variable | Exemple |
|----------|---------|
| `DATABRICKS_HOST` | `e2-demo-field-eng.cloud.databricks.com` |
| `DATABRICKS_HTTP_PATH` | `/sql/1.0/warehouses/abc123` |
| `DATABRICKS_TOKEN` | `dapi123456...` |
| `CATALOG` | `io_catalog` |
| `SCHEMA` | `corail` |
| `FIREBASE_SECRET` | `{"type":"service_account",...}` |

---

## ✅ Une fois configuré :

1. Clique sur **"Save Changes"**
2. Render va automatiquement **redéployer**
3. Surveille les logs !

Tu devrais voir :
```
✅ Firebase initialisé avec FIREBASE_SECRET (Render)
INFO: Uvicorn running on http://0.0.0.0:8000
```


