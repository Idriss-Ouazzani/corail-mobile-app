# Déployer le landing vers getcorail-website (GitHub + Vercel)

## Pourquoi la page devis ne marchait pas

Si tu vois **« Envoi… »** brièvement sur le bouton en cliquant, c’est **l’ancienne version** (JavaScript fetch) qui tourne encore. La version actuelle utilise des **formulaires HTML** : les boutons affichent toujours « Accepter le devis » et « Refuser », et **sous les boutons** tu dois voir la ligne :

**« Version formulaire · En cliquant, la page se recharge après envoi. »**

- **Tu ne vois pas cette phrase** → le site en ligne n’a pas la bonne version. Il faut bien pousser le contenu de `corail-landing-page-design` vers le repo getcorail-website puis redéployer.
- **Tu la vois** → la bonne version est déployée. Si le clic ne fait toujours rien, ouvrir F12 → onglet **Réseau** → recliquer : regarder la requête POST et le statut (302 = OK, 400/500 = erreur).

## Étapes pour pousser la bonne version

À exécuter **à la racine du projet** (là où se trouvent `corail-landing-page-design` et le clone `getcorail-website`) :

```bash
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp

# 1. Supprimer l’ancien clone s’il existe
rm -rf getcorail-website

# 2. Cloner le repo du site
git clone https://github.com/Idriss-Ouazzani/getcorail-website.git getcorail-website

# 3. Copier tout le contenu du landing (source de vérité) dans le clone
cp -R corail-landing-page-design/* getcorail-website/
cp -R corail-landing-page-design/.env* getcorail-website/ 2>/dev/null || true

# 4. Configurer l’auteur Git (pour que Vercel accepte le déploiement — compte idriss-ouazzani)
cd getcorail-website
git config user.name "Idriss-ouazzani"
git config user.email "mydrissouazzani@gmail.com"

# 5. Commit et push
git add .
git status
git commit -m "fix: devis formulaire + redirect + marqueur version"
git push origin main
```

## Vérifications après déploiement

1. **Vercel** : Dashboard → ton projet getcorail-website → **Deployments** → le dernier déploiement doit être **Ready** et correspondre au commit que tu viens de pousser.
2. **Page devis** : ouvre le lien d’un devis en **navigation privée** (ou Ctrl+F5). Tu dois voir sous les boutons : **« Version formulaire · En cliquant, la page se recharge après envoi. »**
3. **Variables d’environnement Vercel** : pour ce projet, **Settings** → **Environment Variables** → vérifier que **NEXT_PUBLIC_SUPABASE_URL** et **SUPABASE_SERVICE_ROLE_KEY** sont bien renseignées (sinon l’API accept/refuse renverra une erreur).

## Anciens devis

Les **anciens devis restent valides** : pas besoin d’en créer un nouveau. Le token du lien ne change pas.
