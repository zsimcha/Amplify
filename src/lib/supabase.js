import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// These logs will help you see if the keys are missing in the Vercel logs
console.log("Supabase Connection - URL exists:", !!url);
console.log("Supabase Connection - Key exists:", !!key);

let supabaseInstance;

if (!url || !key) {
  // If keys are missing, we create a "mock" object so the app doesn't 
  // crash on load, but will show an error when a user tries to checkout.
  console.error("CRITICAL ERROR: Supabase environment variables are missing.");
  supabaseInstance = {
    rpc: () => Promise.reject(new Error("Database connection not configured. Please check environment variables."))
  };
} else {
  supabaseInstance = createClient(url, key);
}

// Always export from the top level
export const supabase = supabaseInstance;