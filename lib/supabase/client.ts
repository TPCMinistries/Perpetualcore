import { createBrowserClient } from '@supabase/ssr';
import { Database } from './database.types';

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
            // Match the Edge middleware cookie scope. In production on
            // *.perpetualcore.com the middleware writes auth cookies scoped to
            // `.perpetualcore.com` (for cross-subdomain SSO). If the browser
            // writes the SAME cookie host-only, the browser ends up holding two
            // copies with the same name but different domain scopes; @supabase/ssr
            // chunks the session token across cookies and reconstructs a broken
            // session from the mismatched copies — server-side auth.uid() comes
            // back empty and the user is bounced to /orgs/new. Writing the same
            // apex domain here keeps it to ONE cookie. Stays host-only on
            // localhost and Vercel preview hosts.
            const host =
              typeof window !== 'undefined' ? window.location.hostname : '';
            const cookieDomain =
              process.env.NODE_ENV === 'production' &&
              host.endsWith('perpetualcore.com')
                ? '.perpetualcore.com'
                : '';
            const cookieOptions = [
              `${name}=${value}`,
              `Max-Age=${maxAge}`,
              'Path=/',
              'SameSite=Lax',
              cookieDomain ? `Domain=${cookieDomain}` : '',
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
