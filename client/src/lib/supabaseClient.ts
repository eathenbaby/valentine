import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // We don't throw here to avoid crashing the SPA in local/dev
  // but log loudly so it's obvious why auth isn't working.
  console.warn(
    "[V4ULT] Supabase URL or anon key missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable verified login."
  );
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as any);

