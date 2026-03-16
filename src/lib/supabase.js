import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logs: Check your browser console for these!
console.log("Config Check - URL:", SUPABASE_URL);
console.log("Config Check - KEY:", SUPABASE_ANON_KEY);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("CRITICAL: Supabase environment variables are missing!");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);