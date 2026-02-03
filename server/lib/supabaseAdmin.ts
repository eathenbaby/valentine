import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

let supabaseAdmin: SupabaseClient | null = null;

if (SUPABASE_URL && SERVICE_ROLE_KEY) {
    supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
    });
    console.log("[supabaseAdmin] initialized");
} else {
    console.warn(
        "[supabaseAdmin] WARNING: SUPABASE service role key not set. Server-side user verification disabled.",
    );
}

export async function getUserById(id: string) {
    if (!supabaseAdmin) return null;
    try {
        // Uses the Admin API to fetch user metadata
        const { data, error } = await (supabaseAdmin.auth as any).admin.getUserById(id);
        if (error) {
            console.error("[supabaseAdmin] getUserById error:", error);
            return null;
        }
        return data?.user ?? null;
    } catch (err) {
        console.error("[supabaseAdmin] unexpected error fetching user:", err);
        return null;
    }
}

export { supabaseAdmin };
