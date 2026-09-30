import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Configure VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY antes de iniciar la aplicación.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
