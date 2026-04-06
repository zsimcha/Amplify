import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

let supabaseInstance;

if (!url || !key) {
  console.error("CRITICAL ERROR: Supabase environment variables are missing.");
  supabaseInstance = {
    rpc: () => Promise.reject(new Error("Database connection not configured.")),
    from: () => ({ select: () => Promise.reject(new Error("Database connection not configured.")) })
  };
} else {
  // We use the trimmed versions here
  supabaseInstance = createClient(url, key);
}

export const supabase = supabaseInstance;