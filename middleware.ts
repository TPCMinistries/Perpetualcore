import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { isIPAllowed, getOrgIdForUser } from '@/lib/compliance/ip-check';
import {
  extractUTMFromURL,
  serializeUTM,
  generateAnonymousId,
  generateSessionId,
  UTM_COOKIE_NAME,
  ANON_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  UTM_MAX_AGE,
} from '@/lib/analytics/utm-store';

// Blanket API rate limiter — 200 requests per minute per IP
// Individual routes can enforce stricter limits on top of this
let apiRateLimiter: Ratelimit | null = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    apiRateLimiter = new Ratelimit({
      redis: new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL.trim(),
        token: process.env.UPSTASH_REDIS_REST_TOKEN.trim(),
      }),
      limiter: Ratelimit.fixedWindow(200, '60 s'),
      prefix: 'mw:api',
      analytics: true,
    });
  }
} catch {
  // Silently fall back to no rate limiting if Redis is unavailable
}

// Hosts that map to the RFP Engine product surface.
// Production: rfp.perpetualcore.com
// Local dev:  rfp.localhost:3001 (add to /etc/hosts: 127.0.0.1 rfp.localhost)
function isRfpHost(host: string | null): boolean {
  if (!host) return false;
  const h = host.toLowerCase().split(':')[0];
  return h === 'rfp.perpetualcore.com' || h === 'rfp.localhost';
}

// Paths the RFP subdomain serves directly (post-auth product routes).
// Anything not matched here gets rewritten under /rfp/* for the marketing surface.
//
// `/dashboard` is INTENTIONALLY OMITTED: that is the legacy Perpetual Core
// SaaS dashboard (purple gradient "Simple/Full Mode" onboarding, Atlas exec
// assistant, etc.) and must never render on the RFP product host. The
// post-login redirect target for rfp.* is `/orgs`, which routes to the
// caller's first org's discovery feed (or /orgs/new for net-new users).
function isRfpAppPath(pathname: string): boolean {
  return (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/accept-invite') ||
    pathname.startsWith('/orgs') ||
    pathname.startsWith('/org/') ||
    pathname.startsWith('/contact-sales') ||
    pathname === '/privacy' ||
    pathname === '/terms' ||
    pathname.startsWith('/rfp')
  );
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host');
  const pathname = request.nextUrl.pathname;

  // ── RFP host: redirect legacy /dashboard/* to /orgs ──
  // Bookmarked or auto-redirected requests to /dashboard land in the legacy
  // Perpetual Core SaaS, which is not the RFP product. Send them to /orgs
  // which routes to their first org or /orgs/new.
  if (isRfpHost(host) && pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone();
    url.pathname = '/orgs';
    url.search = '';
    return NextResponse.redirect(url, 307);
  }

  // ── Subdomain rewrite: rfp.* serves the RFP Engine product surface ──
  // Marketing routes get rewritten under /rfp/* so they share the RFP layout.
  // App + auth routes pass through so SSO works across subdomains.
  if (isRfpHost(host) && !isRfpAppPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = `/rfp${pathname === '/' ? '' : pathname}`;
    return NextResponse.rewrite(url);
  }

  // Allow public access to specific pages
  if (
    request.nextUrl.pathname === '/presentation' ||
    request.nextUrl.pathname.startsWith('/invite/') ||
    request.nextUrl.pathname.startsWith('/auth/callback')
  ) {
    return NextResponse.next();
  }

  // Rate limit API routes, then pass through (skip cron + webhook routes)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (
      apiRateLimiter &&
      !request.nextUrl.pathname.startsWith('/api/cron/') &&
      !request.nextUrl.pathname.startsWith('/api/webhooks/')
    ) {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || 'unknown';
      const result = await apiRateLimiter.limit(`mw:${ip}`);
      if (!result.success) {
        const reset = Math.ceil((result.reset - Date.now()) / 1000);
        return NextResponse.json(
          { error: 'Too many requests', retryAfter: reset },
          {
            status: 429,
            headers: {
              'Retry-After': reset.toString(),
              'X-RateLimit-Limit': result.limit.toString(),
              'X-RateLimit-Remaining': '0',
            },
          }
        );
      }
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Cross-subdomain SSO: scope auth cookies to .perpetualcore.com in production
  // so signing in on perpetualcore.com persists on rfp.perpetualcore.com (and any
  // future product subdomain). Stays unset locally to avoid breaking localhost.
  const hostname = (host || '').toLowerCase().split(':')[0];
  const cookieDomain =
    process.env.NODE_ENV === 'production' && hostname.endsWith('perpetualcore.com')
      ? '.perpetualcore.com'
      : undefined;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Extend cookie lifetime to 30 days for persistent sessions
          const extendedOptions = {
            ...options,
            maxAge: 60 * 60 * 24 * 14, // 14 days
            path: '/',
            sameSite: 'lax' as const,
            secure: process.env.NODE_ENV === 'production',
            ...(cookieDomain ? { domain: cookieDomain } : {}),
          };

          request.cookies.set({
            name,
            value,
            ...extendedOptions,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...extendedOptions,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser();

  // --- Analytics: UTM capture + anonymous/session ID cookies ---
  // Capture UTM params from URL on first visit (don't overwrite existing)
  const utmParams = extractUTMFromURL(request.nextUrl);
  if (utmParams && !request.cookies.get(UTM_COOKIE_NAME)?.value) {
    const referer = request.headers.get('referer') || undefined;
    response.cookies.set(UTM_COOKIE_NAME, serializeUTM({ ...utmParams, referrer: referer }), {
      maxAge: UTM_MAX_AGE,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
    });
  }

  // Ensure anonymous ID cookie exists for visitor tracking
  if (!request.cookies.get(ANON_COOKIE_NAME)?.value) {
    response.cookies.set(ANON_COOKIE_NAME, generateAnonymousId(), {
      maxAge: UTM_MAX_AGE,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  // Ensure session ID cookie exists (expires with browser session)
  if (!request.cookies.get(SESSION_COOKIE_NAME)?.value) {
    response.cookies.set(SESSION_COOKIE_NAME, generateSessionId(), {
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  // IP Whitelist + Session Duration checks for authenticated users
  if (user) {
    try {
      const orgId = await getOrgIdForUser(user.id);
      if (orgId) {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
          || request.headers.get('x-real-ip')
          || 'unknown';
        const { allowed } = await isIPAllowed(ip, orgId);
        if (!allowed) {
          return NextResponse.json(
            { error: 'Access denied: IP not whitelisted' },
            { status: 403 }
          );
        }

        // Session duration enforcement
        const sessionCreatedAt = user.last_sign_in_at || user.created_at;
        if (sessionCreatedAt) {
          const sessionAge = Date.now() - new Date(sessionCreatedAt).getTime();
          const sessionAgeHours = sessionAge / (1000 * 60 * 60);
          // Default max session: 24 hours. Enterprise orgs can configure via session_policies table.
          // We check a generous limit here; fine-grained control is in the session_policies API.
          if (sessionAgeHours > 720) { // 30 days hard cap
            await supabase.auth.signOut();
            const redirectUrl = request.nextUrl.clone();
            redirectUrl.pathname = '/login';
            redirectUrl.searchParams.set('error', 'Session expired. Please sign in again.');
            redirectUrl.search = redirectUrl.searchParams.toString();
            return NextResponse.redirect(redirectUrl);
          }
        }
      }
    } catch {
      // Fail open on IP/session check errors to avoid lockout
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
