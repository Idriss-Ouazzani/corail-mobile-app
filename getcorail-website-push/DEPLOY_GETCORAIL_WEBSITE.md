# Déployer le site web vers getcorail-website (GitHub + Vercel)

---

## ⚠️ OBLIGATOIRE : auteur Git pour Vercel

**L’utilisateur Git doit être `idriss-ouazzani` (mydrissouazzani@gmail.com), pas `idrissouazzani-databricks`.**

Sinon Vercel refuse : *"Git author idrissouazzani-databricks must have access to the project on Vercel to create deployments."*

Avant tout `git commit` dans le clone **getcorail-website**, exécuter :

```bash
cd getcorail-website
git config user.name "idriss-ouazzani"
git config user.email "mydrissouazzani@gmail.com"
```

(Vérifier avec `git log -1 --format="%an <%ae>"` avant de push.)

---

**Deux repos GitHub, deux dossiers en local :**

| Repo GitHub           | En local (dans ce projet)     | Rôle              |
|-----------------------|-------------------------------|-------------------|
| **corail-mobile-app** | racine du projet (`corail-mobileapp/`) | App mobile        |
| **getcorail-website** | dossier `corail-landing-page-design/`   | Site web (Vercel) |

Le dossier **corail-landing-page-design** = le contenu du repo **getcorail-website**. Même chose, nom de dossier différent en local.

**Commandes selon ce que tu veux pousser :**

- **Pousser l’app mobile** (depuis la racine du projet) :
  ```bash
  cd /chemin/vers/corail-mobileapp
  git add .
  git commit -m "..."
  git push origin <ta-branche>
  ```
  → va dans le repo **corail-mobile-app** sur GitHub.

- **Pousser le site web** (mettre à jour getcorail-website + Vercel) :  
  le contenu à pousser est dans `corail-landing-page-design/`, mais le repo c’est **getcorail-website**. Il faut copier ce dossier dans un clone de getcorail-website puis push (étapes ci‑dessous).

---

## Pourquoi la page devis ne marchait pas

Si tu vois **« Envoi… »** brièvement sur le bouton en cliquant, c’est **l’ancienne version** (JavaScript fetch) qui tourne encore. La version actuelle utilise des **formulaires HTML** : les boutons affichent toujours « Accepter le devis » et « Refuser », et **sous les boutons** tu dois voir la ligne :

**« Version formulaire · En cliquant, la page se recharge après envoi. »**

- **Tu ne vois pas cette phrase** → le site en ligne n’a pas la bonne version. Il faut bien pousser le contenu de `corail-landing-page-design` vers le repo getcorail-website puis redéployer.
- **Tu la vois** → la bonne version est déployée. Si le clic ne fait toujours rien, ouvrir F12 → onglet **Réseau** → recliquer : regarder la requête POST et le statut (302 = OK, 400/500 = erreur).

## Étapes pour pousser le site web vers getcorail-website

À exécuter **à la racine du projet** (dossier corail-mobileapp, là où se trouve le dossier `corail-landing-page-design`) :

```bash
# 1. Aller à la racine du projet (repo corail-mobile-app en local)
cd /Users/idriss.ouazzani/Cursor/Corail-mobileapp

# 2. Supprimer l’ancien clone getcorail-website s’il existe
rm -rf getcorail-website

# 3. Cloner le repo getcorail-website (site web) dans un dossier getcorail-website
git clone https://github.com/Idriss-Ouazzani/getcorail-website.git getcorail-website

# 4. Copier le contenu de corail-landing-page-design (= site web) dans le clone
cp -R corail-landing-page-design/* getcorail-website/
cp -R corail-landing-page-design/.env* getcorail-website/ 2>/dev/null || true

# 5. Aller dans le clone et configurer Git (OBLIGATOIRE pour Vercel : auteur idriss-ouazzani)
cd getcorail-website
git config user.name "idriss-ouazzani"
git config user.email "mydrissouazzani@gmail.com"

# 6. Commit et push vers le repo getcorail-website (pas corail-mobile-app)
git add .
git status
git commit -m "fix: devis formulaire + redirect + marqueur version"
git push origin main
```

Après le `git push`, c’est le repo **getcorail-website** sur GitHub qui est mis à jour, et Vercel redéploie le site.

## Vérifications après déploiement

1. **Vercel** : Dashboard → ton projet getcorail-website → **Deployments** → le dernier déploiement doit être **Ready** et correspondre au commit que tu viens de pousser.
2. **Page devis** : ouvre le lien d’un devis en **navigation privée** (ou Ctrl+F5). Tu dois voir sous les boutons : **« Version formulaire · En cliquant, la page se recharge après envoi. »**
3. **Variables d’environnement Vercel** : pour ce projet, **Settings** → **Environment Variables** → vérifier que **NEXT_PUBLIC_SUPABASE_URL** et **SUPABASE_SERVICE_ROLE_KEY** sont bien renseignées (sinon l’API accept/refuse renverra une erreur).

## Anciens devis

Les **anciens devis restent valides** : pas besoin d’en créer un nouveau. Le token du lien ne change pas.
