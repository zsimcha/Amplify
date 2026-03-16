import { createClient } from '@supabase/supabase-js';

// .trim() removes any accidental invisible spaces or newlines
const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

console.log("Supabase Connection - URL exists:", !!url);
console.log("Supabase Connection - Key exists:", !!key);

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