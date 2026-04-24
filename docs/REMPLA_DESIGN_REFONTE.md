# Rempla — Analyse design & proposition de refonte

**Tagline :** *Remplacer, en confiance.*

Ce document analyse le design actuel (référence Corail + bonnes pratiques) et propose une refonte partielle pour faire de Rempla une app **premium, moderne, minimaliste et professionnelle**, inspirée de Stripe, Linear, Notion, Doctolib et Corail.

---

## Contexte produit

- **Titulaires** : publient des offres de remplacement
- **Remplaçants** : cherchent des offres
- **Objectifs** : structure, filtrage intelligent, historique, planning, abonnements cabinets, favoris, notifications ciblées, **export vers Facebook**
- **Deux portails** : « Je cherche un remplaçant » / « Je cherche une offre »

---

## 1️⃣ Amélioration du Design System

### État des lieux (référence Corail)

- **Couleurs** : nombreuses variantes (primary, accent, success, error, warning, info, infoCyan, primaryLight, accentBg, accentBgStrong…) → risque de surcharge.
- **Radius** : 8, 12, 14, 18, 20, 9999 → à simplifier.
- **Ombres** : définies localement (shadowOpacity 0.12, shadowRadius 6, etc.) → pas de tokens.
- **Spacing** : 4, 8, 12, 16, 20, 24, 32 → déjà proche d’une grille 8pt.

### Proposition Rempla

| Domaine | Règle |
|--------|--------|
| **Couleurs secondaires** | Réduire à **4 sémantiques** : `primary`, `secondary`, `success`, `warning`. Supprimer les doublons (ex. info vs accent). |
| **Palette** | **Primary** = couleur de marque (confiance, institutionnel, ex. bleu ardoise #0f172a / #1e3a5f). **Secondary** = complément (ex. teal discret). **Success** = validation, acceptation. **Warning** = attention, rétrocession, délai. |
| **Radius** | 3 niveaux : `radius.sm = 8`, `radius.md = 12`, `radius.lg = 16`. Boutons et cartes = `radius.md`. Badges = `radius.sm`. Modales = `radius.lg`. |
| **Ombres** | 2 niveaux : `shadow.sm` (cartes : elevation 2, blur 6), `shadow.md` (modales / floating : elevation 4, blur 12). Même `shadowColor` et `shadowOpacity` (0.08–0.12). |
| **Spacing** | **Grille 8pt** : 4, 8, 12, 16, 24, 32, 40, 48. Padding sections = 16 ou 24. Gap entre cartes = 12. |
| **Badges** | Un seul style de base : fond `surfaceElevated`, bordure légère, texte `textMuted` ou couleur sémantique, padding horizontal 8, vertical 4, `radius.sm`. Variantes : Long terme (secondary), Ponctuel (neutral), % rétrocession (success ou warning selon valeur). |

Fichier de thème proposé : `rempla/theme.ts` (voir section « Fichiers créés »).

---

## 2️⃣ Amélioration UX

| Zone | Problème | Proposition |
|------|----------|-------------|
| **Hiérarchie des cartes d’offres** | Tout au même niveau visuel. | **Titre (spécialité + ville)** en premier, **période** en bloc mis en avant (dates claires), **rétrocession** en badge unique, **CTA** unique et contrasté (Publier / Accepter / Refuser). Éviter plus de 2 lignes de badges. |
| **CTA** | « Prendre » peut prêter à confusion. | **Titulaire** : « Publier une offre » (principal), « Modifier » (secondaire). **Remplaçant** : « Postuler » ou « Accepter » (principal), « Refuser » (secondaire, discret). Couleur unique pour l’action principale (primary). |
| **Filtres** | Trop d’options = surcharge. | **Filtres essentiels** : Période (date début – date fin), Spécialité, Rétrocession (min/max ou fourchette), Localisation (rayon ou ville). Tri : date, rétrocession. Le reste en « Filtres avancés » (optionnel). |
| **Deux modes utilisateur** | Bascule peu claire. | **Switch en haut de l’accueil** : « Je cherche un remplaçant » | « Je cherche une offre » (segmented control ou onglets). Conserver le choix en session et le rappeler dans le header (sous le logo / titre). |
| **Planning** | Dates peu lisibles. | **Vue semaine** par défaut, **jours en colonnes**, créneaux en lignes. Dates en **chiffre + jour court** (ex. « 15 lun »). Couleur de fond pour « aujourd’hui ». Offres acceptées en bloc coloré (primary light). |
| **Profils** | Peu structurés. | **Blocs** : Identité (photo, nom, spécialité, ville), Disponibilités, Rétrocession habituelle, Historique des remplacements (liste courte), Contact. Style « carte » par bloc, pas de fond pastel. |

---

## 3️⃣ Amélioration Branding

| Aspect | Avant (à éviter) | Après (Rempla) |
|--------|-------------------|----------------|
| **Ton** | Playful, pastel, emojis. | **Institutionnel**, sobre. Texte court, factuel. « Remplacer, en confiance. » en sous-titre. |
| **Couleurs** | Multiples pastels. | **Primaire** bleu ardoise / marine, **blanc / gris clair** pour fonds. Accent unique (teal ou bleu) pour les CTA. Pas de rose/lavande vif. |
| **Typographie** | Mélange de weights. | **Une famille** (ex. Inter ou SF Pro). **Weights** : Regular (body), Medium (sous-titres), Semibold (titres cartes), Bold (titres sections). Tailles : 12, 14, 16, 18, 20, 24. |
| **Logo** | — | **Logo Rempla** sur la page d’accueil : `public/images/rempla-logo.png` (web) ou `assets/images/rempla-logo.png` (React Native). Taille généreuse en haut, pas d’emoji à côté. |

---

## 4️⃣ Refonte partielle proposée

### 4.1 Nouveau layout page Accueil

- **Header** : Logo Rempla (`rempla-logo.png`) centré ou à gauche + tagline « Remplacer, en confiance » en sous-titre.
- **Segmented control** : « Je cherche un remplaçant » | « Je cherche une offre » (pleine largeur, style pill).
- **Bloc principal** selon le mode :
  - **Titulaire** : CTA « Publier une offre » (bouton primary large), puis « Mes offres publiées » (liste courte ou lien).
  - **Remplaçant** : Barre de recherche / filtres rapides (période, spécialité), puis liste « Offres pour vous ».
- **Sections secondaires** : Planning (aperçu 3–5 jours), Favoris (si présents), Notifications (résumé).
- **Footer** : Liens légaux, paramètres. Pas de bandeau coloré.

### 4.2 Nouveau design carte d’offre

- **Conteneur** : Fond `surface`, bordure légère, `radius.md`, `shadow.sm`, padding 16.
- **Ligne 1** : Spécialité (gras) + ville (muted).
- **Ligne 2** : Période (ex. « 12–19 mars 2026 ») en `bodyLarge`, couleur primary si pertinent.
- **Ligne 3** : Badges alignés : **Long terme** ou **Ponctuel**, **% rétrocession** (ex. « 30 % »).
- **Ligne 4** : Cabinet / structure (optionnel, muted).
- **Ligne 5** : CTA unique à droite : « Postuler » ou « Accepter » (bouton primary), ou « Refuser » (lien discret).
- Pas de bordures colorées par type (tout en neutre + badges sémantiques).

### 4.3 Nouveau design profil médecin

- **En-tête** : Photo (cercle 80px), nom (Bold 20), spécialité (Medium 14), ville (muted).
- **Blocs** : Titre de section (Semibold 14), contenu (Regular 14). Bordures entre blocs légères.
- **Disponibilités** : Liste ou chips (dates / créneaux).
- **Rétrocession** : Une ligne « Rétrocession habituelle : X % ».
- **Historique** : Liste de remplacements (date, cabinet, spécialité) avec lien « Voir tout ».
- Style « carte » par bloc : fond `surface`, `radius.md`, padding 16.

### 4.4 Système de badges élégant

- **Composant unique** `Badge` : `paddingHorizontal: 8`, `paddingVertical: 4`, `borderRadius: 8`, `fontSize: 12`, `fontWeight: '600'`.
- **Variantes** : `neutral` (fond surface, texte muted), `primary` (fond primary light, texte primary), `success` (rétrocession), `warning` (ponctuel / court). Pas de bordures épaisses.

### 4.5 Notifications premium

- **Liste** : Fond `surface`, chaque item = carte avec bordure gauche optionnelle (couleur sémantique).
- **Une ligne** : Icône (16–20px), titre (Semibold), sous-titre (muted), date (caption).
- **Actions** : « Voir l’offre » / « Accepter » en lien ou bouton discret, pas de gros boutons colorés dans la liste.

---

## 5️⃣ Feature stratégique : Exporter vers Facebook

### Objectif

Permettre de générer un **post Facebook** et un **visuel partageable** à partir d’une offre Rempla, pour reposter sur les groupes Facebook sans tout ressaisir.

### Spécification

1. **Génération du texte du post**
   - Template structuré, ex. :
     - Titre : « [Spécialité] – Remplacement [date début] au [date fin] »
     - Corps : Ville, rétrocession %, type (long terme / ponctuel), contact (optionnel).
   - Champs pré-remplis depuis l’offre. Option « Copier le texte ».

2. **Génération d’un visuel partageable**
   - Image ou carte (format 1200×630 ou 1080×1080 pour Facebook).
   - Contenu : logo Rempla, spécialité, période, rétrocession, ville, « Publié via Rempla ».
   - Export PNG (téléchargement ou partage direct).

3. **Bouton « Exporter vers Facebook »**
   - Placé sur la fiche offre (côté titulaire) et dans « Mes offres ».
   - Au tap : bottom sheet ou modal avec :
     - **Onglet « Texte »** : zone de texte éditable + bouton **Copier**.
     - **Onglet « Visuel »** : aperçu du visuel + boutons **Télécharger** et **Partager**.
   - Copier : copie du texte dans le presse-papier + toast « Texte copié. Collez-le dans votre post Facebook. »

### Implémentation technique (recommandations)

- **Texte** : template string côté client (ou API légère) avec variables (spécialité, dates, ville, rétrocession).
- **Visuel** : génération côté client avec `react-native-view-shot` ou `html2canvas` (web) pour capturer une vue mise en page ; ou génération serveur (Node + Canvas/Puppeteer) si besoin de logo et polices parfaites.
- **Partage** : `Share.share()` (React Native) ou Web Share API (web) avec `files: [imageFile]` si supporté.

---

## Fichiers créés dans le repo

- **`docs/REMPLA_DESIGN_REFONTE.md`** (ce document)
- **`rempla/theme.ts`** : Design system Rempla (couleurs, spacing, radius, ombres, typo)
- **`rempla/README.md`** : Comment utiliser le thème et où placer le logo
- **`rempla/components/OfferCard.example.tsx`** : Exemple de carte d’offre (badges, CTA)
- **`rempla/components/HomeLayout.example.tsx`** : Exemple de layout Accueil (logo, segmented, CTA)
- **`rempla/exportFacebook.example.ts`** : Template texte pour l’export Facebook (copier/coller)

## Logo

- **Web** : placer le logo dans `public/images/rempla-logo.png` et l’afficher en page d’accueil.
- **React Native** : placer dans `assets/images/rempla-logo.png` et utiliser `require('../assets/images/rempla-logo.png')` ou équivalent.

---

## Résumé des principes

- **Moins de couleurs** : primary, secondary, success, warning + neutres.
- **Radius et ombres** : 3 radius, 2 niveaux d’ombre, tokens centralisés.
- **Grille 8pt** : spacing cohérent.
- **Badges** : un composant, 4 variantes sémantiques.
- **CTA** : un primary par écran, secondaires discrets.
- **Ton** : institutionnel, confiance, pas de pastel playful.
- **Export Facebook** : post formaté + visuel + copier/partager.

Ces choix constituent une **base scalable** pour une marque crédible et une app que les médecins perçoivent comme professionnelle et structurée par rapport aux groupes Facebook.
