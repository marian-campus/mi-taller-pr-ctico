import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Clean variables (remove quotes and whitespace)
const supabaseUrl = rawUrl?.trim().replace(/^["'](.+)["']$/, '$1');
const supabaseAnonKey = rawKey?.trim().replace(/^["'](.+)["']$/, '$1');

// Advanced Diagnostic
if (rawKey) {
  console.log(`🔍 [Diagnostic] Raw Key Length: ${rawKey.length}`);
  if (rawKey !== supabaseAnonKey) {
    console.warn('⚠️ [Diagnostic] Key had quotes or whitespace that were removed automatically.');
  }
  console.log(`🔍 [Diagnostic] Final Key Format: ${supabaseAnonKey?.startsWith('eyJ') ? 'JWT OK' : 'INVALID (Starts with: ' + supabaseAnonKey?.substring(0, 3) + '...)'}`);
}

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = '❌ Error: Variables de entorno no detectadas. Verifica la configuración en Vercel (deben incluir el prefijo VITE_).';
  console.error(errorMessage);
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      // Persist session in localStorage so mobile users don't log in every time
      persistSession: true,
      // Automatically refresh the JWT token before it expires
      autoRefreshToken: true,
      // Detect auth state from URL hash (needed for email confirmation links)
      detectSessionInUrl: true,
      // Use localStorage for persistence across browser close/reopen
      storage: window.localStorage,
    }
  }
);
