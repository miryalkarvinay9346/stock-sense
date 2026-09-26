import { createClient, SupabaseClient } from "@supabase/supabase-js";

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

let clientInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (clientInstance) return clientInstance;

  const url = envUrl || (typeof window !== "undefined" ? localStorage.getItem("sb_url") || "" : "");
  const key = envKey || (typeof window !== "undefined" ? localStorage.getItem("sb_key") || "" : "");

  if (url && key && url.startsWith("https://") && key.length > 20) {
    clientInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return clientInstance;
  }
  return null;
}

export const isSupabaseConfigured = Boolean(
  (envUrl && envKey && envUrl.startsWith("https://") && envKey.length > 20) ||
    (typeof window !== "undefined" && localStorage.getItem("sb_url"))
);

export const supabase = getSupabase();
