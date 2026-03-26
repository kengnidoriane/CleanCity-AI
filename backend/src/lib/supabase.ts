import { createClient } from '@supabase/supabase-js'

// Lazy initialization — prevents crash when SUPABASE_URL is not set (e.g. during tests)
let _supabase: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env['SUPABASE_URL']!,
      process.env['SUPABASE_KEY']!
    )
  }
  return _supabase
}

// Keep named export for backward compatibility — used in services
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    return getSupabase()[prop as keyof ReturnType<typeof createClient>]
  },
})
