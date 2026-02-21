# Instructions de déploiement - Page suppression de compte

## Fichiers à copier dans GitHub

### 1. Fichier `src/index.ts`
Va sur : https://github.com/Idriss-Ouazzani/delete-account-page/blob/main/src/index.ts

Colle ce contenu :
```typescript
import express from 'express';
import path from 'path';

const app = express();
const port = process.env.PORT || 3000;

// Servir les fichiers statiques depuis le dossier public
app.use(express.static('public'));

// Route pour servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Route catch-all pour servir index.html sur toutes les routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
```

### 2. Fichier `public/index.html`
Va sur : https://github.com/Idriss-Ouazzani/delete-account-page

Crée ou édite le fichier `public/index.html` et colle le contenu du fichier `delete-account.html` de ce projet.

### 3. Vérifier `package.json`
Assure-toi que `express` est dans les dépendances :
```json
"dependencies": {
  "express": "^4.18.2",
  ...
}
```

## Une fois fait
Vercel redéploiera automatiquement et ça devrait fonctionner !
