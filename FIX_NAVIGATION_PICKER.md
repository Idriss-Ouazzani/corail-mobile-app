# 🔧 Corrections Navigation + Affichage Preneur

## 🎯 Problèmes identifiés

### 1. **Voir qui a pris ma course**
❌ Actuellement : Dans l'onglet "Publiées", on ne voit pas clairement si la course a été prise  
✅ Solution : Afficher un badge "PRISE" + nom du preneur dans le détail

### 2. **Doublon "Prises" confus**
Structure actuelle dans "Mes Courses" :
- **Prises** (claimed) : Courses que j'ai prises (je suis picker)
- **Publiées** (published) : Courses que j'ai publiées (je suis créateur)
- **Personnelles** (personal) : Mes courses Uber/Bolt

❌ Problème : Pas clair
✅ Solution : Renommer pour clarifier

### 3. **Navigation cassée**
❌ Bouton "mes courses" dans suivi → ne va pas au bon endroit  
❌ Clic sur une course dans "prochaines courses" → ne s'ouvre pas  
❌ Clic sur une course dans l'agenda → ne s'ouvre pas  
❌ Retour → ne revient pas à l'endroit d'origine

---

## 🔧 Solutions à implémenter

### **Fix 1 : Badge "PRISE" dans l'onglet Publiées**

#### A. Dans `MyRidesList.tsx` (section published)
```tsx
// Afficher clairement si la course a été prise
{activePublished.map((ride) => (
  <RideCard
    key={ride.id}
    ride={ride}
    onPress={() => onRidePress(ride)}
    badge={ride.status === 'CLAIMED' ? 'PRISE' : 'PUBLIÉE'} // Nouveau
    badgeColor={ride.status === 'CLAIMED' ? '#10b981' : '#6366f1'}
  />
))}
```

#### B. Mise à jour de `RideCard.tsx`
Ajouter un badge optionnel pour afficher "PRISE" ou "PUBLIÉE"

---

### **Fix 2 : Afficher le preneur dans RideDetailScreen**

```tsx
{/* Nouvelle section : Preneur */}
{ride.status === 'CLAIMED' && ride.picker && (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Pris par</Text>
    <View style={styles.pickerCard}>
      {/* Infos du preneur */}
      <View style={styles.pickerInfo}>
        <View style={styles.pickerHeader}>
          <Ionicons name="person-circle" size={40} color="#6366f1" />
          <View style={styles.pickerDetails}>
            <Text style={styles.pickerName}>{ride.picker.full_name}</Text>
            {ride.picker.rating && (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={16} color="#fbbf24" />
                <Text style={styles.ratingText}>
                  {ride.picker.rating.toFixed(1)} ({ride.picker.total_reviews} avis)
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Boutons contact */}
      <View style={styles.contactButtons}>
        {/* WhatsApp */}
        <TouchableOpacity
          style={[styles.contactButton, styles.whatsappButton]}
          onPress={() => {
            const phone = ride.picker.phone?.replace(/\s+/g, '');
            Linking.openURL(`whatsapp://send?phone=${phone}`);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="logo-whatsapp" size={24} color="#fff" />
          <Text style={styles.contactButtonText}>WhatsApp</Text>
        </TouchableOpacity>

        {/* Appel */}
        <TouchableOpacity
          style={[styles.contactButton, styles.callButton]}
          onPress={() => {
            Linking.openURL(`tel:${ride.picker.phone}`);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="call" size={24} color="#fff" />
          <Text style={styles.contactButtonText}>Appeler</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
)}
```

---

### **Fix 3 : Clarifier les noms des onglets**

#### Dans `MyRidesTabBar.tsx`
```tsx
// AVANT (confus)
claimed → "Prises"
published → "Publiées"
personal → "Personnelles"

// APRÈS (clair)
claimed → "Prises par moi"    // Courses que j'ai prises
published → "Mes publications" // Courses que j'ai publiées
personal → "Uber/Bolt"         // Mes courses externes
```

---

### **Fix 4 : Navigation vers le détail de la course**

#### A. Depuis "Prochaines courses" (DashboardScreen)
```tsx
// Actuellement : onPress={() => { /* rien */ }}
// Corriger pour ouvrir le détail

onPress={(ride) => {
  setSelectedRide(ride);
  setShowRideDetail(true);
}}
```

#### B. Depuis l'Agenda (PlanningScreen)
```tsx
// Actuellement : ouvre EventModal
// Corriger pour ouvrir RideDetailScreen

onEventPress={(event) => {
  if (event.event_type === 'RIDE') {
    // Charger la course complète et ouvrir le détail
    const rideId = event.id.replace('marketplace-', '');
    loadRideDetail(rideId);
  }
}}
```

#### C. Bouton "Mes courses" dans Suivi
```tsx
// AVANT
onNavigateToCourses={() => setCurrentScreen('courses')}

// APRÈS (aller directement sur l'onglet "myrides")
onNavigateToCourses={() => {
  setCurrentScreen('courses');
  setCoursesTab('myrides'); // Aller directement sur "Mes Courses"
}}
```

---

### **Fix 5 : Gestion du retour**

Utiliser un système de **navigation stack** simple :

```typescript
// Dans App.tsx
const [navigationStack, setNavigationStack] = useState<string[]>(['dashboard']);

const navigateTo = (screen: string) => {
  setNavigationStack([...navigationStack, screen]);
  setCurrentScreen(screen);
};

const goBack = () => {
  if (navigationStack.length > 1) {
    const newStack = [...navigationStack];
    newStack.pop();
    const previousScreen = newStack[newStack.length - 1];
    setNavigationStack(newStack);
    setCurrentScreen(previousScreen);
  }
};

// Passer goBack à tous les écrans
<RideDetailScreen
  ride={selectedRide}
  onBack={goBack} // Au lieu de setShowRideDetail(false)
/>
```

---

## 🚀 Plan d'implémentation (Baby Steps)

### **Étape 1 : Afficher le preneur (15 min)** ✅
1. Ajouter la section "Pris par" dans `RideDetailScreen.tsx`
2. Boutons WhatsApp + Appel
3. Tester avec une course claimed

### **Étape 2 : Badge PRISE/PUBLIÉE (15 min)** ✅
1. Modifier `RideCard.tsx` pour accepter un badge
2. Utiliser le badge dans `MyRidesList.tsx`
3. Tester l'affichage

### **Étape 3 : Clarifier les noms (5 min)** ✅
1. Renommer les labels dans `MyRidesTabBar.tsx`
2. Tester l'affichage

### **Étape 4 : Fix navigation prochaines courses (10 min)** ✅
1. Ajouter `onRidePress` dans `DashboardScreen.tsx`
2. Connecter au `setSelectedRide` + `setShowRideDetail`
3. Tester le clic

### **Étape 5 : Fix navigation agenda (20 min)** ✅
1. Modifier `PlanningScreen.tsx` pour détecter les RIDE
2. Charger le détail complet de la course
3. Ouvrir `RideDetailScreen`
4. Tester le clic

### **Étape 6 : Fix bouton "Mes courses" (5 min)** ✅
1. Modifier dans `DashboardScreen.tsx`
2. Ajouter `setCoursesTab('myrides')`
3. Tester

### **Étape 7 : Navigation stack (30 min)** ⚠️ Optionnel
1. Implémenter le système de stack
2. Remplacer tous les `onBack`
3. Tester tous les flux

---

## ✅ Prêt à commencer ?

Je commence par **Étape 1 : Afficher le preneur** ?  
C'est le plus important et le plus simple (15 min). 🚀

Ensuite on fait les autres corrections une par une.

