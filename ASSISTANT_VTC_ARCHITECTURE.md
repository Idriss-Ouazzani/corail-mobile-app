# 🎯 Architecture "Assistant VTC" - Nouvelle structure de l'app

## 📱 Vue d'ensemble

L'application Corail a été **complètement restructurée** pour passer d'une **marketplace-first** à un **assistant professionnel VTC**.

---

## 🗂️ Structure de navigation

### **Bottom Tabs (4 écrans principaux)**

```
┌─────────────────────────────────────────────────┐
│  📊 Dashboard  │  🚗 Courses  │  + │  🛠️ Outils  │  👤 Profil  │
└─────────────────────────────────────────────────┘
```

---

## 1. 📊 **Dashboard** (Nouvel accueil)

**Objectif :** Vue d'ensemble de l'activité du chauffeur VTC

### **Sections :**

#### **A. Header**
- Salutation : "Bonjour, [Nom]"
- Badge Crédits Corail

#### **B. Revenus**
- 📅 **Aujourd'hui** : Revenus du jour + nombre de courses
- 📆 **Cette semaine** : Revenus 7 derniers jours

#### **C. Aperçu rapide** (3 widgets)
- 🚗 **Courses** : Nombre total complétées
- 🏃 **Km parcourus** : Distance totale
- 📈 **Prix moyen** : Revenu moyen par course

#### **D. Revenus par source**
- Liste des sources (Uber, Bolt, Direct, Corail)
- Icon + Nom + Nb courses + Revenu total

#### **E. Prochaines courses planifiées**
- Liste des courses avec status `SCHEDULED`
- Date/heure, adresses départ/arrivée

#### **F. Accès rapides**
- **QR Code Pro** (gradient orange)
- **Enregistrer une course** (gradient violet)

### **Fichier :**
```
src/screens/DashboardScreen.tsx
```

### **Props :**
```typescript
{
  userFullName: string;
  userCredits: number;
  onNavigateToCourses: () => void;
  onNavigateToTools: () => void;
  onOpenQRCode: () => void;
}
```

---

## 2. 🚗 **Courses** (3 tabs)

**Objectif :** Centraliser toutes les courses (Marketplace + Historique)

### **Tabs :**

#### **Tab 1 : Marketplace Corail**
- Courses disponibles sur la marketplace
- Filtres (ville, type véhicule, prix)
- Bouton FAB pour créer une course

#### **Tab 2 : Mes Courses Corail**
- Sous-tabs : "Prises" et "Publiées"
- Historique des courses marketplace
- Status, prix, détails

#### **Tab 3 : Historique complet**
- **Toutes les sources** : Uber, Bolt, Direct, Marketplace
- Intègre `PersonalRidesScreen`
- Stats par source
- Export (futur)

### **Fichier :**
```
src/screens/CoursesScreen.tsx
```

### **Props :**
```typescript
{
  marketplaceContent: React.ReactNode;
  myRidesContent: React.ReactNode;
  historyContent: React.ReactNode;
}
```

### **Contenu des tabs :**
- **marketplaceContent** : `renderMarketplace()` (App.tsx)
- **myRidesContent** : `renderMyRides()` (App.tsx)
- **historyContent** : `<PersonalRidesScreen />`

---

## 3. 🛠️ **Outils**

**Objectif :** Regrouper les outils professionnels VTC

### **Outils principaux** (disponibles) :

#### **A. QR Code Pro**
- Génère vCard avec coordonnées VTC
- Partage/sauvegarde
- B2B compliance (contact direct)

#### **B. Mes Courses**
- Enregistrement manuel courses externes
- Uber, Bolt, Direct Client
- Historique et statistiques

### **Outils à venir** (Coming soon) :

#### **C. Planning**
- Organiser emploi du temps
- Calendrier des courses
- Notifications rappels

#### **D. Statistiques avancées**
- Graphiques détaillés
- Export PDF
- Analyse de revenus

#### **E. Notifications intelligentes**
- Rappels de courses
- Alertes de proximité
- Suggestions

#### **F. Export comptable**
- Export CSV/Excel
- Pour comptable
- Déclarations fiscales

### **Fichier :**
```
src/screens/ToolsScreen.tsx
```

### **Props :**
```typescript
{
  onOpenQRCode: () => void;
  onOpenPersonalRides: () => void;
}
```

---

## 4. 👤 **Profil**

**Objectif :** Informations personnelles, badges, admin

### **Sections :**

- **Infos utilisateur** : Nom, email, crédits
- **Badges** : Early Adopter, Serial Publisher, etc.
- **Outils professionnels** : QR Code, Mes Courses
- **Administration** : Panel admin (si `is_admin`)
- **Paramètres** : Infos perso, notifications, aide
- **Déconnexion**

### **Fichier :**
```
App.tsx (renderProfile)
```

---

## 📐 Architecture technique

### **App.tsx - État principal**

```typescript
const [currentScreen, setCurrentScreen] = useState<
  'dashboard' | 'courses' | 'tools' | 'profile'
>('dashboard');
```

### **Rendu conditionnel**

```typescript
{currentScreen === 'dashboard' && <DashboardScreen ... />}
{currentScreen === 'courses' && <CoursesScreen ... />}
{currentScreen === 'tools' && <ToolsScreen ... />}
{currentScreen === 'profile' && renderProfile()}
```

### **Bottom Navigation**

```typescript
<TouchableOpacity onPress={() => setCurrentScreen('dashboard')}>
  <Ionicons name="analytics" /> // Dashboard
</TouchableOpacity>

<TouchableOpacity onPress={() => setCurrentScreen('courses')}>
  <Ionicons name="car-sport" /> // Courses
</TouchableOpacity>

<TouchableOpacity onPress={() => setShowCreateRide(true)}>
  <Ionicons name="add" /> // FAB central
</TouchableOpacity>

<TouchableOpacity onPress={() => setCurrentScreen('tools')}>
  <Ionicons name="construct" /> // Outils
</TouchableOpacity>

<TouchableOpacity onPress={() => setCurrentScreen('profile')}>
  <Ionicons name="person" /> // Profil
</TouchableOpacity>
```

---

## 🎨 Design System

### **Couleurs principales**

```typescript
Background: #0f172a
Cards: #1e293b
Borders: #334155
Primary: #6366f1 (violet)
Secondary: #ff6b47 (orange)
Text primary: #e2e8f0
Text secondary: #cbd5e1
Text tertiary: #94a3b8
Text disabled: #64748b
```

### **Typographie**

```typescript
Title: 28px, font-weight 700, letter-spacing 0.5
Subtitle: 18px, font-weight 700, letter-spacing 0.3
Body: 15px, font-weight 600
Caption: 13px, font-weight 600
Small: 11px, font-weight 600
```

### **Composants réutilisables**

- **Cartes** : border-radius 16px, border #334155
- **Boutons** : border-radius 12px, gradient
- **Badges** : border-radius 8-10px, padding 8-10px
- **Tabs** : border-radius 12px, background #1e293b

---

## 🔄 Flux utilisateur

### **Parcours principal**

```
1. Connexion → Vérification profil → Dashboard
2. Dashboard → Vue d'ensemble activité
3. Courses → Marketplace + Mes courses + Historique
4. Outils → QR Code, Enregistrement, etc.
5. Profil → Badges, Admin, Paramètres
```

### **Actions rapides**

```
Dashboard → QR Code (1 tap)
Dashboard → Enregistrer course (1 tap)
Dashboard → Voir courses (1 tap)
Outils → QR Code (1 tap)
Outils → Enregistrer course (1 tap)
```

---

## 📊 Données affichées

### **Dashboard**

**Sources de données :**
- `apiClient.getPersonalRidesStats()` : Stats globales
- `apiClient.listPersonalRides({ status: 'SCHEDULED' })` : Prochaines courses
- `userCredits` : Badge crédits

**Calculs :**
- Revenus du jour/semaine (TODO: filtres backend)
- Prix moyen : `total_revenue / completed_rides`
- Stats par source : API déjà implémentée

### **Courses (Tab Historique)**

**Source de données :**
- `apiClient.listPersonalRides()` : Toutes courses
- `apiClient.getPersonalRidesStats()` : Stats par source

---

## 🚀 Évolutions futures

### **Dashboard**
- [ ] Graphiques interactifs (Chart.js / Victory Native)
- [ ] Export PDF du dashboard
- [ ] Comparaison mois précédent
- [ ] Objectifs mensuels

### **Courses**
- [ ] Filtres avancés (date, source, prix)
- [ ] Export CSV/Excel
- [ ] Synchronisation automatique Uber/Bolt API
- [ ] Import depuis CSV

### **Outils**
- [ ] Planning/Calendrier intégré
- [ ] Notifications push intelligentes
- [ ] Gestion des dépenses (carburant, entretien)
- [ ] Calcul des impôts

### **Profil**
- [ ] Objectifs et badges avancés
- [ ] Historique de connexion
- [ ] Paramètres avancés (thème, langue)

---

## 🏆 Avantages de la nouvelle architecture

✅ **Orientation "Assistant"** : App positionné comme outil pro, pas juste marketplace  
✅ **Vue d'ensemble** : Dashboard avec toutes les infos clés  
✅ **Centralisation** : Toutes les courses au même endroit  
✅ **Extensibilité** : Facile d'ajouter de nouveaux outils  
✅ **UX cohérente** : Design harmonisé sur tous les écrans  
✅ **Performance** : Données chargées à la demande  
✅ **Scalabilité** : Architecture modulaire

---

## 📁 Structure des fichiers

```
src/
├── screens/
│   ├── DashboardScreen.tsx          ✨ NOUVEAU
│   ├── CoursesScreen.tsx            ✨ NOUVEAU
│   ├── ToolsScreen.tsx              ✨ NOUVEAU
│   ├── PersonalRidesScreen.tsx      (intégré dans Courses/Tab3)
│   ├── QRCodeScreen.tsx             (accès depuis Dashboard et Outils)
│   ├── RideDetailScreen.tsx         (modal)
│   ├── CreateRideScreen.tsx         (modal, FAB)
│   └── ...
├── components/
│   ├── RideCard.tsx
│   ├── CoralLogo.tsx
│   ├── CreditsBadge.tsx
│   └── ...
└── services/
    ├── api.ts
    ├── firebase.ts
    └── ...
```

---

## 🧪 Tests recommandés

### **Dashboard**
1. ✅ Affichage correct des revenus
2. ✅ Stats par source visibles
3. ✅ Prochaines courses chargées
4. ✅ Boutons accès rapides fonctionnels
5. ✅ Pull-to-refresh opérationnel

### **Courses**
1. ✅ 3 tabs accessibles
2. ✅ Marketplace affiche courses disponibles
3. ✅ Mes Courses affiche prises/publiées
4. ✅ Historique affiche toutes sources
5. ✅ Navigation entre tabs fluide

### **Outils**
1. ✅ QR Code s'ouvre correctement
2. ✅ Enregistrer course accessible
3. ✅ Outils "Coming soon" visibles
4. ✅ Design cohérent

### **Profil**
1. ✅ Badges affichés
2. ✅ Admin panel si `is_admin`
3. ✅ Déconnexion fonctionne

---

## 📝 Notes de migration

**De Marketplace-First à Assistant VTC :**

| Avant | Après |
|-------|-------|
| Accueil = Stats marketplace | Dashboard = Vue d'ensemble globale |
| Marketplace = Tab principal | Courses = Tab avec marketplace + historique |
| Mes Courses = Tab séparé | Courses/Tab 2 (Mes Courses Corail) |
| Profil > Mes Courses (external) | Courses/Tab 3 (Historique complet) |
| Pas d'outils centralisés | Outils = Section dédiée |

---

**✅ Migration réussie ! App complètement orientée "Assistant VTC" 🚀**

