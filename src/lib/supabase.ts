import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

export const supabaseConfigured = url.length > 0 && anonKey.length > 0 && !url.includes('YOUR_PROJECT');

let client: SupabaseClient | undefined;

export function getSupabase(): SupabaseClient {
  if (!supabaseConfigured) {
    throw new Error(
      'Supabase není nakonfigurováno: zkopíruj `.env.example` na `.env` a doplň VITE_SUPABASE_URL a VITE_SUPABASE_ANON_KEY.'
    );
  }
  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}
