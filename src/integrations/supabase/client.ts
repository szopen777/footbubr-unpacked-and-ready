import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Wpisz swój klucz anon skopiowany z Supabase:
const FALLBACK_URL = "https://kwumqkqnwqbfvpzavclv.supabase.co";
const FALLBACK_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3dW1xa3Fud3FiZnZwemF2Y2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MjA4MjAsImV4cCI6MjEwMzM5NjgyMH0.Rxh1CiVkVmXPOLPNLCK_RlQGPy2ieGcEtkczXzyFa2o";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});