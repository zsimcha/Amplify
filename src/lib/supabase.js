import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debugging log - remove this after you find the issue
console.log("Supabase URL Check:", SUPABASE_URL ? "Loaded" : "UNDEFINED");
console.log("Supabase Key Check:", SUPABASE_ANON_KEY ? "Loaded" : "UNDEFINED");

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase credentials are missing. Check your .env file or hosting settings.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);