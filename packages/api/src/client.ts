import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { getAuthStorage, isWebAuth } from './authStorage';
import type { Database } from './types';

let supabaseClient: SupabaseClient<Database> | null = null;

function getSupabaseConfig() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey || anonKey === 'your-anon-key') {
    throw new Error(
      'Missing Supabase env vars. Copy .env.example to apps/mobile/.env and set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }

  return { url, anonKey };
}

export { getSupabaseConfig };

export function createSupabaseClient(): SupabaseClient<Database> {
  if (supabaseClient) return supabaseClient;

  const { url, anonKey } = getSupabaseConfig();

  supabaseClient = createClient<Database>(url, anonKey, {
    auth: {
      storage: getAuthStorage(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: isWebAuth(),
    },
  });

  return supabaseClient;
}

export function getSupabaseClient(): SupabaseClient<Database> {
  return createSupabaseClient();
}
