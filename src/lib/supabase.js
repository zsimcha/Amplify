import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://gloncuhgefzrpuwbzoke.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdsb25jdWhnZWZ6cnB1d2J6b2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTEzMDMsImV4cCI6MjA4NzMyNzMwM30.GyAvJWh0F3Uha4-h33UFjZmZeVtSoTH6i-oQXzxttI8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);