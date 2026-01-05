# 🚀 Roadmap Corail App - Du Top 20% au Top 1%

**Score actuel : 25/70 (Top 20%)**  
**Objectif : 65/70 (Top 1%)**

---

## 📋 PHASE 1 - Quick Wins (1-2 semaines) [+15 points]

### 1️⃣ Performance Immédiate (+5 pts) ⭐⭐

**Durée : 2-3 jours**

#### A. React.memo sur tous les composants

```typescript
// ❌ Avant
export default function BadgeCard({ badge }) {
  return <View>...</View>;
}

// ✅ Après
import React, { memo } from 'react';

export default memo(BadgeCard, (prev, next) => {
  return prev.badge.id === next.badge.id && 
         prev.badge.earned_at === next.badge.earned_at;
});
```

#### B. useMemo / useCallback dans les hooks

```typescript
// Dans useRides.ts
const filteredRides = useMemo(() => {
  return rides.filter(r => r.status === 'ACTIVE');
}, [rides]);

const handleClaimRide = useCallback(async (rideId: string) => {
  await apiClient.claimRide(rideId);
}, []);
```

#### C. FlatList optimisé

```typescript
<FlatList
  data={rides}
  renderItem={renderRide}
  keyExtractor={(item) => item.id}
  // 🚀 Optimisations
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
  removeClippedSubviews={true}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

#### D. Image lazy loading

```bash
npm install react-native-fast-image
```

```typescript
import FastImage from 'react-native-fast-image';

<FastImage
  source={{ uri: imageUrl, priority: FastImage.priority.normal }}
  resizeMode={FastImage.resizeMode.cover}
  style={{ width: 200, height: 200 }}
/>
```

---

### 2️⃣ UX Polish (+5 pts) ⭐⭐

**Durée : 2-3 jours**

#### A. Haptic Feedback

```bash
npm install react-native-haptic-feedback
```

```typescript
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const handlePress = () => {
  ReactNativeHapticFeedback.trigger('impactLight', {
    enableVibrateFallback: true,
    ignoreAndroidSystemSettings: false,
  });
  // Votre action...
};
```

#### B. Skeleton Loaders

```bash
npm install react-native-skeleton-placeholder
```

```typescript
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

{loading ? (
  <SkeletonPlaceholder>
    <SkeletonPlaceholder.Item flexDirection="row" alignItems="center">
      <SkeletonPlaceholder.Item width={60} height={60} borderRadius={30} />
      <SkeletonPlaceholder.Item marginLeft={20}>
        <SkeletonPlaceholder.Item width={120} height={20} />
        <SkeletonPlaceholder.Item marginTop={6} width={80} height={15} />
      </SkeletonPlaceholder.Item>
    </SkeletonPlaceholder.Item>
  </SkeletonPlaceholder>
) : (
  <RideCard ride={ride} />
)}
```

#### C. Toast Notifications

```bash
npm install react-native-toast-message
```

```typescript
import Toast from 'react-native-toast-message';

Toast.show({
  type: 'success',
  text1: 'Course publiée !',
  text2: 'Vous avez gagné 1 crédit 🎉',
  visibilityTime: 3000,
  topOffset: 60,
});
```

---

### 3️⃣ Monitoring Basique (+5 pts) ⭐

**Durée : 1-2 jours**

#### A. Sentry (Crash Reporting)

```bash
npm install @sentry/react-native
npx @sentry/wizard -i reactNative
```

```typescript
// App.tsx
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: 1.0,
});

export default Sentry.wrap(App);
```

#### B. Firebase Analytics

```bash
npm install @react-native-firebase/analytics
```

```typescript
import analytics from '@react-native-firebase/analytics';

// Track events
await analytics().logEvent('ride_published', {
  ride_id: rideId,
  visibility: 'PUBLIC',
  credits_earned: 1,
});

// Track screens
await analytics().logScreenView({
  screen_name: 'RideDetail',
  screen_class: 'RideDetailScreen',
});
```

#### C. Logger Structuré

```typescript
// src/services/logger.ts
import * as Sentry from '@sentry/react-native';

export const logger = {
  info: (message: string, data?: any) => {
    if (__DEV__) console.log(`ℹ️ ${message}`, data);
    Sentry.addBreadcrumb({ message, data, level: 'info' });
  },
  
  error: (message: string, error: Error, data?: any) => {
    if (__DEV__) console.error(`❌ ${message}`, error, data);
    Sentry.captureException(error, { extra: { message, ...data } });
  },
  
  warn: (message: string, data?: any) => {
    if (__DEV__) console.warn(`⚠️ ${message}`, data);
    Sentry.addBreadcrumb({ message, data, level: 'warning' });
  },
};

// Utilisation
logger.info('Ride claimed', { rideId, userId });
logger.error('Failed to load rides', error, { userId });
```

---

## 📋 PHASE 2 - Solidité (3-4 semaines) [+15 points]

### 4️⃣ Tests (+8 pts) ⭐⭐⭐

**Durée : 1-2 semaines**

#### A. Setup Jest + React Native Testing Library

```bash
npm install --save-dev @testing-library/react-native @testing-library/jest-native
```

```javascript
// jest.config.js
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo)/)',
  ],
};
```

#### B. Tests Unitaires des Hooks

```typescript
// src/hooks/__tests__/useRides.test.ts
import { renderHook, waitFor } from '@testing-library/react-native';
import { useRides } from '../useRides';

jest.mock('../../services/api');

describe('useRides', () => {
  it('should load rides on mount', async () => {
    const { result } = renderHook(() => useRides('user123', 5));
    
    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.rides.length).toBeGreaterThan(0);
    });
  });

  it('should claim ride successfully', async () => {
    const { result } = renderHook(() => useRides('user123', 5));
    
    await waitFor(() => expect(result.current.loading).toBe(false));
    
    await result.current.claimRide('ride123');
    
    expect(apiClient.claimRide).toHaveBeenCalledWith('ride123');
  });
});
```

#### C. Tests d'Intégration des Screens

```typescript
// src/screens/__tests__/RideDetailScreen.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import RideDetailScreen from '../RideDetailScreen';

describe('RideDetailScreen', () => {
  const mockRide = {
    id: 'ride123',
    pickup_address: 'Paris',
    dropoff_address: 'Lyon',
    price_cents: 5000,
  };

  it('should display ride details', () => {
    const { getByText } = render(
      <RideDetailScreen ride={mockRide} onBack={jest.fn()} />
    );
    
    expect(getByText('Paris')).toBeTruthy();
    expect(getByText('Lyon')).toBeTruthy();
    expect(getByText('50.00€')).toBeTruthy();
  });

  it('should call onBack when back button pressed', () => {
    const onBack = jest.fn();
    const { getByTestId } = render(
      <RideDetailScreen ride={mockRide} onBack={onBack} />
    );
    
    fireEvent.press(getByTestId('back-button'));
    expect(onBack).toHaveBeenCalled();
  });
});
```

#### D. Tests E2E avec Detox

```bash
npm install --save-dev detox
npx detox init
```

```javascript
// e2e/publishRide.test.js
describe('Publish Ride Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should publish a ride successfully', async () => {
    // Login
    await element(by.id('email-input')).typeText('user@corail.com');
    await element(by.id('password-input')).typeText('password');
    await element(by.id('login-button')).tap();

    // Navigate to create ride
    await element(by.id('create-ride-button')).tap();

    // Fill form
    await element(by.id('pickup-input')).typeText('Paris');
    await element(by.id('dropoff-input')).typeText('Lyon');
    await element(by.id('price-input')).typeText('50');

    // Submit
    await element(by.id('publish-button')).tap();

    // Verify success
    await expect(element(by.text('Course publiée !'))).toBeVisible();
  });
});
```

---

### 5️⃣ CI/CD (+4 pts) ⭐⭐⭐

**Durée : 3-5 jours**

#### A. GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run tests
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build-ios:
    runs-on: macos-latest
    needs: test
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Build iOS
        run: eas build --platform ios --non-interactive

  build-android:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Build Android
        run: eas build --platform android --non-interactive
```

#### B. EAS Build Configuration

```json
// eas.json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD123456"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

---

### 6️⃣ Sécurité Renforcée (+3 pts) ⭐⭐

**Durée : 2-3 jours**

#### A. Secure Storage (Keychain)

```bash
npm install react-native-keychain
```

```typescript
// src/services/secureStorage.ts
import * as Keychain from 'react-native-keychain';

export const secureStorage = {
  async setItem(key: string, value: string) {
    await Keychain.setGenericPassword(key, value, {
      service: `corail.${key}`,
    });
  },

  async getItem(key: string): Promise<string | null> {
    const credentials = await Keychain.getGenericPassword({
      service: `corail.${key}`,
    });
    return credentials ? credentials.password : null;
  },

  async removeItem(key: string) {
    await Keychain.resetGenericPassword({ service: `corail.${key}` });
  },
};

// Utilisation
await secureStorage.setItem('authToken', token);
const token = await secureStorage.getItem('authToken');
```

#### B. Biométrie (Face ID / Touch ID)

```bash
npm install react-native-biometrics
```

```typescript
import ReactNativeBiometrics from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics();

// Vérifier la disponibilité
const { available, biometryType } = await rnBiometrics.isSensorAvailable();

if (available) {
  const { success } = await rnBiometrics.simplePrompt({
    promptMessage: 'Confirmez votre identité',
  });
  
  if (success) {
    // Authentifié !
  }
}
```

#### C. Code Obfuscation

```bash
npm install --save-dev react-native-obfuscating-transformer
```

```javascript
// metro.config.js
const obfuscatingTransformer = require('react-native-obfuscating-transformer');

module.exports = {
  transformer: {
    babelTransformerPath: obfuscatingTransformer,
  },
};
```

---

## 📋 PHASE 3 - Excellence (1-2 mois) [+10 points]

### 7️⃣ Animations Natives (+3 pts) ⭐⭐⭐⭐

**Durée : 1 semaine**

```bash
npm install react-native-reanimated react-native-gesture-handler
```

```typescript
// Animated Badge Card
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';

export function AnimatedBadgeCard({ badge }: Props) {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const handlePress = () => {
    scale.value = withSequence(
      withSpring(1.1, { damping: 10 }),
      withSpring(1, { damping: 10 })
    );
  };
  
  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity onPress={handlePress}>
        <BadgeCard badge={badge} />
      </TouchableOpacity>
    </Animated.View>
  );
}
```

---

### 8️⃣ Offline-First (+4 pts) ⭐⭐⭐⭐

**Durée : 1-2 semaines**

```bash
npm install @tanstack/react-query @react-native-async-storage/async-storage
```

```typescript
// src/hooks/useRidesQuery.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';

export function useRidesQuery() {
  return useQuery({
    queryKey: ['rides'],
    queryFn: () => apiClient.getRides(),
    staleTime: 30 * 1000, // 30 secondes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
}

export function useClaimRideMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (rideId: string) => apiClient.claimRide(rideId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rides'] });
    },
    // Optimistic update
    onMutate: async (rideId) => {
      await queryClient.cancelQueries({ queryKey: ['rides'] });
      
      const previousRides = queryClient.getQueryData(['rides']);
      
      queryClient.setQueryData(['rides'], (old: any) =>
        old.map((r: any) => r.id === rideId ? { ...r, status: 'CLAIMED' } : r)
      );
      
      return { previousRides };
    },
  });
}
```

```typescript
// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 heures
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

persistQueryClient({
  queryClient,
  persister: asyncStoragePersister,
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* ... */}
    </QueryClientProvider>
  );
}
```

---

### 9️⃣ Features Pro (+3 pts) ⭐⭐⭐

**Durée : 1 semaine**

#### A. Push Notifications

```bash
npm install @react-native-firebase/messaging
```

```typescript
// src/services/notifications.ts
import messaging from '@react-native-firebase/messaging';

export async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    const token = await messaging().getToken();
    // Envoyer le token à Supabase
    await apiClient.updateFCMToken(token);
  }
}

// Écouter les notifications
messaging().onMessage(async remoteMessage => {
  Toast.show({
    type: 'info',
    text1: remoteMessage.notification?.title,
    text2: remoteMessage.notification?.body,
  });
});
```

#### B. Deep Linking

```typescript
// App.tsx
import { Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

const linking = {
  prefixes: ['corail://', 'https://corail.app'],
  config: {
    screens: {
      RideDetail: 'ride/:id',
      GroupDetail: 'group/:id',
      Profile: 'profile',
    },
  },
};

<NavigationContainer linking={linking}>
  {/* ... */}
</NavigationContainer>
```

#### C. Code Push (OTA Updates)

```bash
npm install react-native-code-push
```

```typescript
import codePush from 'react-native-code-push';

const codePushOptions = {
  checkFrequency: codePush.CheckFrequency.ON_APP_RESUME,
  installMode: codePush.InstallMode.ON_NEXT_RESUME,
};

export default codePush(codePushOptions)(App);
```

---

## 📊 Tracking Progress

Créez un fichier `PROGRESS.md` pour suivre votre avancement :

```markdown
# Progress Tracker

## Phase 1 - Quick Wins [0/15]
- [ ] 1️⃣ Performance (0/5)
  - [ ] React.memo
  - [ ] useMemo/useCallback
  - [ ] FlatList optimized
  - [ ] Image lazy loading
- [ ] 2️⃣ UX Polish (0/5)
  - [ ] Haptic feedback
  - [ ] Skeleton loaders
  - [ ] Pull-to-refresh
  - [ ] Toast notifications
- [ ] 3️⃣ Monitoring (0/5)
  - [ ] Sentry
  - [ ] Firebase Analytics
  - [ ] Structured logger

## Phase 2 - Solidité [0/15]
... (à compléter)
```

---

## 🎯 Résumé

| Phase | Points | Temps | Difficulté | Priorité |
|-------|--------|-------|------------|----------|
| **Phase 1** | +15 | 1-2 semaines | ⭐⭐ | 🔥 HAUTE |
| **Phase 2** | +15 | 3-4 semaines | ⭐⭐⭐ | 🔸 MOYENNE |
| **Phase 3** | +10 | 1-2 mois | ⭐⭐⭐⭐ | 🔹 BASSE |

**Total : +40 points → 65/70 (Top 1%)** 🏆

---

## 💡 Conseil Final

**Approche recommandée :**
1. Commencez par **Phase 1** (quick wins, impact visible immédiatement)
2. Ensuite **Phase 2** (solidité, confiance long-terme)
3. Enfin **Phase 3** (excellence, différenciation compétitive)

**Ne sautez pas les tests (Phase 2) !** C'est ce qui sépare vraiment une app amateur d'une app professionnelle.

Bonne chance ! 🚀

