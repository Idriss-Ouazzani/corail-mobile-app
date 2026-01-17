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
