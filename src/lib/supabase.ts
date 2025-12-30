/**
 * Supabase Client - Remplace Databricks
 */

import { createClient } from '@supabase/supabase-js';

// ⚠️ Vos credentials Supabase (safe pour commit - clé publique) gitleaks:allow
const SUPABASE_URL = 'https://qeheawdjlwlkhnwbhqcg.supabase.co'; // gitleaks:allow
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlaGVhd2RqbHdsa2hud2JocWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMTY3NTMsImV4cCI6MjA4MjY5Mjc1M30.Eb9798W9FD92SNr4KI6W70heZ08hjwl0bbjeXHQU8ds'; // gitleaks:allow

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase credentials not configured!');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
