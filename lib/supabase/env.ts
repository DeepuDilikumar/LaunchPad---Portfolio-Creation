/**
 * Supabase public config. Both values are safe to expose to the browser;
 * the service-role key must never be read here.
 * Returns null when not configured so the UI can show a clear setup state instead of crashing.
 */
export function getSupabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return { url, key }
}

export function isSupabaseConfigured() {
  return getSupabaseEnv() !== null
}
