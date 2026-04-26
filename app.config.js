/**
 * Configuration Expo dynamique avec variables d'environnement
 * Charge les variables .env UNIQUEMENT en local (pas pour les builds EAS)
 */

// Charger .env UNIQUEMENT en local (pas pendant les builds EAS)
// En build EAS, les variables viennent des secrets EAS
if (!process.env.EAS_BUILD) {
  require('dotenv').config();
}

module.exports = {
  expo: {
    name: 'Corail',
    slug: 'corail-vtc-marketplace',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    // Splash natif : même base que src/theme/launchScreen.ts (LAUNCH_SPLASH_BACKGROUND)
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0c4a6e',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.corail.vtcmarketplace',
      buildNumber: '1',
      config: {
        usesNonExemptEncryption: false,
      },
      infoPlist: {
        NSCameraUsageDescription: 'Corail utilise la caméra pour votre photo de profil, par ex. un selfie pour votre avatar.',
        NSPhotoLibraryUsageDescription: 'Corail utilise la photothèque pour choisir une image de profil, par ex. votre avatar chauffeur ou utilisateur.',
        NSPhotoLibraryAddUsageDescription: 'Corail peut enregistrer une image dans la photothèque uniquement sur votre demande, par ex. un reçu ou une capture d\'écran.',
        NSLocationWhenInUseUsageDescription: 'Corail utilise votre position pour afficher les courses à proximité et les lieux de prise en charge, par ex. les trajets disponibles près de vous.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0c4a6e',
      },
      package: 'com.corail.vtcmarketplace',
      versionCode: 8,
      /** Réduit le chevauchement clavier / champs (ex. devis en détail d’annonce) */
      softwareKeyboardLayoutMode: 'resize',
      // Empêche une dépendance (ex. Sentry, Play Services) d’ajouter AD_ID au manifeste final.
      permissions: [
        'INTERNET',
        'ACCESS_NETWORK_STATE',
        'VIBRATE',
        'RECEIVE_BOOT_COMPLETED',
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'com.google.android.gms.permission.AD_ID',
      ],
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    scheme: 'corail',
    extra: {
      // Variables d'environnement accessibles via expo-constants
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      sentryDsn: process.env.SENTRY_DSN,
      eas: {
        projectId: 'ef302189-99d0-418c-8ea1-b9fed58b1453',
      },
    },
    plugins: [
      '@react-native-community/datetimepicker',
      'expo-web-browser',
      [
        'expo-build-properties',
        {
          android: {
            // Version minimale Android 8.0 (API 26) - recommandé pour Play Store
            minSdkVersion: 26,
            compileSdkVersion: 35,
            targetSdkVersion: 35,
          },
        },
      ],
      // Garantit que AD_ID est dans le manifeste (EAS Build peut ignorer expo.android.permissions)
      './plugins/withAdIdPermission.js',
    ],
  },
};

