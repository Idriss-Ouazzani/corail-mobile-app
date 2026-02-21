/**
 * Supabase Client - Remplace Databricks
 * Sur React Native / Expo : utilisation explicite d'AsyncStorage pour la persistance de session.
 */

import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Charger les variables depuis expo-constants (fonctionne avec EAS Build)
export const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl;
export const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('⚠️ Supabase credentials not configured!');
  console.error('SUPABASE_URL:', SUPABASE_URL);
  console.error('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'Present' : 'Missing');
  throw new Error('Missing Supabase configuration. Please check your app.config.js');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

export default supabase;
