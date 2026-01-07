import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error("Erro: Variáveis de ambiente do Supabase não configuradas.");
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: window.localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // Padrão ouro de segurança
  },
  global: {
    // Correção do erro TS2556: Tipagem explícita para evitar falha no spread
    fetch: async (url, options) => {
      try {
        return await fetch(url, options);
      } catch (err) {
        console.error("Supabase Network Error (Offline?):", err);
        throw err;
      }
    },
  },
});