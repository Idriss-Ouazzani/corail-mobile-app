# Audit : bouton Accepter / Refuser le devis (après migration de domaine)

## Problème
Après migration vers getcorail.com, les boutons « Accepter le devis » et « Refuser » ne semblaient plus réagir.

## Causes possibles après migration de domaine

1. **URL des appels API**  
   Un `fetch('/api/...')` en relatif est résolu par le navigateur par rapport à l’**origine actuelle**. En cas de :
   - redirection (ex. getcorail.com → www.getcorail.com),
   - proxy ou CDN,
   - ancien cache,
   l’origine peut ne plus correspondre au déploiement qui sert les routes API, et la requête peut partir vers le mauvais hôte ou renvoyer 404.

2. **Réponse non-JSON**  
   Si le serveur renvoie une page HTML (404, 500, maintenance), `res.json()` peut échouer et le code ne gérait pas ce cas proprement.

3. **Pas de message d’erreur clair**  
   En cas d’échec, l’utilisateur ne voyait pas de retour explicite.

## Modifications effectuées

### 1. URL d’API basée sur l’origine de la page
- **Fichier** : `app/q/[token]/quote-actions.tsx`
- **Changement** : utilisation de `window.location.origin` pour construire l’URL d’appel.
- **Code** : `getApiBase()` retourne `window.location.origin` côté client, puis l’URL devient `getApiBase() + '/api/quotes/' + token + '/accept'` (idem pour refuse).
- **Effet** : la requête part toujours vers le même domaine que celui affiché dans la barre d’adresse (getcorail.com, www.getcorail.com, ou localhost en dev), ce qui évite les erreurs liées au domaine après migration.

### 2. Gestion des réponses non-JSON
- **Changement** : fonction `parseJsonOrNull(res)` qui vérifie `Content-Type: application/json` et ne parse le JSON que si c’est cohérent.
- **Effet** : si le serveur renvoie du HTML (404, 500), on n’entre plus dans un cas où `data.success` est lu sur un objet invalide, et on affiche un message d’erreur explicite.

### 3. Messages d’erreur explicites
- **404** : « Page API introuvable (404). Vérifiez que le site est bien déployé sur ce domaine. »
- **Réponse non-JSON** : « Réponse serveur invalide (XXX). Réessayez ou contactez le support. »
- **Erreur réseau / timeout** : messages déjà présents, conservés.

## Vérifications effectuées (audit)

| Élément | Statut |
|--------|--------|
| Pas de `basePath` dans `next.config.mjs` | OK |
| Pas de middleware qui bloque `/api/*` | OK (aucun middleware) |
| Routes API `app/api/quotes/[token]/accept` et `refuse` | OK, présentes |
| Supabase : `getSupabaseServer()` avec env (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) | OK côté code ; à vérifier dans les variables d’environnement Vercel pour le domaine déployé |
| Composant client : token passé par la page serveur | OK |
| CORS | Pas nécessaire : même origine avec `window.location.origin` |

## À vérifier côté déploiement (getcorail.com)

1. **Variables d’environnement Vercel**  
   Pour le projet relié à getcorail.com, vérifier que sont bien définies :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`  
   (et éventuellement `SUPABASE_URL` si utilisé.)

2. **Domaine**  
   Dans Vercel → Settings → Domains : getcorail.com (et éventuellement www) doit pointer vers ce projet. Pas d’autre hébergement (ex. ancien site statique) qui répondrait sur getcorail.com à la place de Vercel.

3. **Cache navigateur**  
   Après déploiement, tester en navigation privée ou avec vidage du cache pour être sûr d’avoir le nouveau JS (avec `getApiBase()`).

## Résumé
La cause la plus probable après migration de domaine était l’utilisation d’une URL relative pour les appels API, combinée à un possible décalage d’origine (redirect, www, proxy). En forçant l’URL avec `window.location.origin`, les appels vont systématiquement vers le bon hôte. Les autres changements (parsing JSON, messages d’erreur) améliorent la robustesse et le diagnostic si un problème persiste.
