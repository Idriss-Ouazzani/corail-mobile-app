# 🔥 Améliorations Planning - Vue Semaine + Navigation

## Modifications à apporter au PlanningScreen.tsx

Vu la taille du fichier (935 lignes), je vais créer un guide des modifications à faire.

### 1. Modifier le type viewMode (ligne ~44)
```typescript
const [viewMode, setViewMode] = useState<'calendar' | 'day' | 'week'>('calendar');
```

### 2. Ajouter les fonctions de navigation (après ligne 49)
```typescript
// Navigation entre jours
const goToPreviousDay = () => {
  const currentDate = new Date(selectedDate);
  currentDate.setDate(currentDate.getDate() - 1);
  setSelectedDate(currentDate.toISOString().split('T')[0]);
};

const goToNextDay = () => {
  const currentDate = new Date(selectedDate);
  currentDate.setDate(currentDate.getDate() + 1);
  setSelectedDate(currentDate.toISOString().split('T')[0]);
};

// Navigation entre semaines
const goToPreviousWeek = () => {
  const currentDate = new Date(selectedDate);
  currentDate.setDate(currentDate.getDate() - 7);
  setSelectedDate(currentDate.toISOString().split('T')[0]);
};

const goToNextWeek = () => {
  const currentDate = new Date(selectedDate);
  currentDate.setDate(currentDate.getDate() + 7);
  setSelectedDate(currentDate.toISOString().split('T')[0]);
};

const goToToday = () => {
  setSelectedDate(new Date().toISOString().split('T')[0]);
};

// Obtenir les jours de la semaine courante
const getWeekDays = () => {
  const current = new Date(selectedDate);
  const firstDayOfWeek = new Date(current);
  const dayOfWeek = current.getDay();
  const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek; // Lundi = premier jour
  firstDayOfWeek.setDate(current.getDate() + diff);

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(firstDayOfWeek);
    day.setDate(firstDayOfWeek.getDate() + i);
    weekDays.push({
      date: day.toISOString().split('T')[0],
      dayName: day.toLocaleDateString('fr-FR', { weekday: 'short' }),
      dayNumber: day.getDate(),
      isToday: day.toISOString().split('T')[0] === new Date().toISOString().split('T')[0],
      isSelected: day.toISOString().split('T')[0] === selectedDate,
    });
  }
  return weekDays;
};
```

### 3. Modifier getDayEvents pour accepter une date optionnelle
```typescript
const getDayEvents = (date?: string) => {
  const targetDate = date || selectedDate;
  return events.filter(event => 
    event.start_time.startsWith(targetDate)
  ).sort((a, b) => 
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );
};
```

### 4. Créer renderWeekView() (à ajouter avant renderDayView)
Voir fichier séparé WEEK_VIEW_COMPONENT.tsx

### 5. Ajouter le bouton "Semaine" dans le toggle (ligne ~425)
```typescript
<TouchableOpacity
  style={[styles.viewModeButton, viewMode === 'week' && styles.viewModeButtonActive]}
  onPress={() => setViewMode('week')}
  activeOpacity={0.7}
}>
  <Ionicons 
    name="calendar-outline" 
    size={18} 
    color={viewMode === 'week' ? '#fff' : '#64748b'} 
  />
  <Text style={[styles.viewModeText, viewMode === 'week' && styles.viewModeTextActive]}>
    Semaine
  </Text>
</TouchableOpacity>
```

### 6. Ajouter navigation dans renderDayView (avant le Header jour sélectionné)
```typescript
<View style={styles.dayNavigation}>
  <TouchableOpacity onPress={goToPreviousDay} style={styles.navButton} activeOpacity={0.7}>
    <Ionicons name="chevron-back" size={24} color="#ff6b47" />
  </TouchableOpacity>
  <View style={styles.dayNavigationCenter}>
    <Text style={styles.dayHeaderText}>...</Text>
    <Text style={styles.dayHeaderCount}>...</Text>
  </View>
  <TouchableOpacity onPress={goToNextDay} style={styles.navButton} activeOpacity={0.7}>
    <Ionicons name="chevron-forward" size={24} color="#ff6b47" />
  </TouchableOpacity>
</View>
```

### 7. Ajouter le rendu de la vue semaine (ligne ~470)
```typescript
{viewMode === 'week' && renderWeekView()}
```

### 8. Ajouter les styles (à la fin du StyleSheet)
Voir WEEK_VIEW_STYLES.ts

---

**Voulez-vous que je crée les fichiers complets ou que je fasse les modifications directement ?**

