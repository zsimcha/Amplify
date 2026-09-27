// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';
import { parseAuthRedirectError } from './authRedirect';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables! Please check your Vercel settings or local .env file."
  );
}

// Read before createClient: supabase-js consumes the auth redirect params from
// the URL as it initializes, so this is the only reliable moment to see why an
// email link failed.
export const authRedirectError = typeof window !== 'undefined'
  ? parseAuthRedirectError(window.location)
  : null;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
