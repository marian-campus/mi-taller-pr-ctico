import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = '❌ Error: Variables de entorno no detectadas. Verifica la configuración en Vercel (deben incluir el prefijo VITE_).';
  console.error(errorMessage);
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);
