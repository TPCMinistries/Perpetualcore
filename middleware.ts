import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

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

export async function middleware(request: NextRequest) {
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
  await supabase.auth.getUser();

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
