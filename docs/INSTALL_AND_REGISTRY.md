# Installer les deps (laptop Databricks, GitHub, EAS)

## Règle d’or

- **`package-lock.json` est la source de vérité** et doit rester **compatible `registry.npmjs.org`** (URLs `resolved` publiques). C’est ce qui permet à **GitHub Actions**, **EAS Build** et aux autres machines de faire `npm ci` sans proxy interne.
- **Ne pas committer** un `.npmrc` qui force un **registry interne** dans le dépôt (sauf consigne IT pour toute l’équipe).

## Sur ton laptop (proxy / registry interne npm)

1. Demander à IT l’URL du **proxy npm** (le doc PyPI Databricks ne s’applique pas à npm).
2. Configurer **uniquement en local** (utilisateur), par exemple :

   ```bash
   npm config set registry https://<proxy-npm-interne>/...
   ```

   Ou éditer `~/.npmrc` selon la doc interne.

3. Après un `git pull`, installer avec :

   ```bash
   npm ci
   ```

   Puis lancer Expo :

   ```bash
   npm run start
   ```

4. Quand tu **ajoutes ou mets à jour une dépendance**, idéalement :
   - soit tu régénères le lock sur une machine qui résout contre **npmjs.org** (perso / CI) puis tu commit ;
   - soit tu vérifies après coup : `npm run check:lockfile` (voir ci‑dessous).

## Ailleurs (CI, collègue, EAS)

- Pas de proxy Databricks : `npm ci` utilise le lock tel quel → les `resolved` doivent rester `https://registry.npmjs.org/...`.

## Vérification avant commit

```bash
npm run check:lockfile
```

Échoue si le lock référence autre chose que le registry npm public (pour éviter de pousser un lock « interne uniquement »).

Si tu as installé avec le proxy Databricks, il peut rester des lignes `"resolved": "https://npm-proxy.dev.databricks.com/..."`. Avant de pousser sur GitHub, régénère ou corrige pour que les `resolved` pointent vers `https://registry.npmjs.org/...` (même chemin de tarball que le proxy miroir), puis relance `npm run check:lockfile`.

## Expo sans build EAS

- `npm ci` puis `npm run start` (Expo Go / dev client) — aucun besoin d’EAS pour tester le JS.
- Un **build natif** EAS reste nécessaire pour tester des changements natifs / splash / plugins natifs.
