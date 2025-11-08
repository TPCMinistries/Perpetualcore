import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Keep users logged in across sessions
        persistSession: true,
        // Automatically refresh tokens before they expire
        autoRefreshToken: true,
        // Detect session changes in other tabs
        detectSessionInUrl: true,
        // Store session in localStorage for persistence
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
      cookies: {
        // Extend cookie lifetime to 30 days
        options: {
          maxAge: 60 * 60 * 24 * 30, // 30 days in seconds
          path: '/',
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        },
      },
    }
  );
}
