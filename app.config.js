/**
 * Configuration Expo dynamique avec variables d'environnement
 * Charge les variables .env UNIQUEMENT en local (pas pour les builds EAS)
 */

// Charger .env UNIQUEMENT en local (pas pendant les builds EAS)
// En build EAS, les variables viennent des secrets EAS
if (!process.env.EAS_BUILD) {
  require('dotenv').config();
  console.log('🔧 [app.config.js] Loading .env file (local dev)...');
} else {
  console.log('🔧 [app.config.js] Using EAS secrets (build environment)...');
}

// Debug: Afficher les variables d'environnement
console.log('🔧 FIREBASE_API_KEY:', process.env.FIREBASE_API_KEY ? '✅ Present' : '❌ Missing');
console.log('🔧 SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Present' : '❌ Missing');
console.log('🔧 SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Present' : '❌ Missing');

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
      config: {
        usesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0c4a6e',
      },
      package: 'com.corail.vtcmarketplace',
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
    ],
  },
};

