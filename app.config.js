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
        NSCameraUsageDescription: 'Cette app a besoin d\'accéder à la caméra pour prendre des photos de profil.',
        NSPhotoLibraryUsageDescription: 'Cette app a besoin d\'accéder à vos photos pour sélectionner des images.',
        NSPhotoLibraryAddUsageDescription: 'Cette app a besoin de sauvegarder des photos dans votre galerie.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0c4a6e',
      },
      package: 'com.corail.vtcmarketplace',
      versionCode: 1,
      permissions: [
        'INTERNET',
        'ACCESS_NETWORK_STATE',
        'VIBRATE',
        'RECEIVE_BOOT_COMPLETED',
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
      ],
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    scheme: 'corail',
    extra: {
      // Variables d'environnement accessibles via expo-constants
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
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
      // Fix CocoaPods : Firebase/GoogleUtilities "does not define modules" (modular_headers)
      './plugins/withPodfileModularHeaders.js',
    ],
  },
};

