import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check your browser console: if these are undefined, the issue is your environment setup
console.log("Supabase Connection - URL exists:", !!url);
console.log("Supabase Connection - Key exists:", !!key);

if (!url || !key) {
  console.error("CRITICAL ERROR: Supabase environment variables are missing from the build.");
  // Export a "dummy" client to prevent the header crash, but the app will still fail gracefully
  export const supabase = { rpc: () => Promise.reject(new Error("Supabase not configured")) };
} else {
  export const supabase = createClient(url, key);
}