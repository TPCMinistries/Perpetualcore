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
        getAll() {
          if (typeof document === 'undefined') return [];
          return document.cookie.split('; ').map(cookie => {
            const [name, ...rest] = cookie.split('=');
            return { name, value: rest.join('=') };
          });
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Extend cookie lifetime to 30 days for persistent sessions
            const maxAge = 60 * 60 * 24 * 30; // 30 days
            const cookieOptions = [
              `${name}=${value}`,
              `Max-Age=${maxAge}`,
              'Path=/',
              'SameSite=Lax',
              process.env.NODE_ENV === 'production' ? 'Secure' : '',
            ].filter(Boolean).join('; ');

            if (typeof document !== 'undefined') {
              document.cookie = cookieOptions;
            }
          });
        },
      },
    }
  );
}
