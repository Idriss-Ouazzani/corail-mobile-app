/**
 * Supabase Client - Remplace Databricks
 */

import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Charger les variables depuis expo-constants (fonctionne avec EAS Build)
const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl;
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('⚠️ Supabase credentials not configured!');
  console.error('SUPABASE_URL:', SUPABASE_URL);
  console.error('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'Present' : 'Missing');
  throw new Error('Missing Supabase configuration. Please check your app.config.js');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
