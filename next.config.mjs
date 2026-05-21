import withPWAInit from '@ducanh2912/next-pwa';

// Polyfill 'self' for server-side builds (must be at top level)
if (typeof self === 'undefined') {
  global.self = global;
}

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development', // Enable in production only
  register: true,
  skipWaiting: true,
  sw: 'service-worker.js',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
      },
    },
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-data',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-images',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern: /\.(?:js|css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
      },
    },
    {
      // Exclude voice API from caching - audio streams don't cache well
      urlPattern: /^https:\/\/.*\/api\/voice\/.*/i,
      handler: 'NetworkOnly',
    },
    {
      urlPattern: /^https:\/\/.*\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 16,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
    // Modern formats for better performance
    formats: ['image/avif', 'image/webp'],
    // Enable lazy loading by default
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // Enable optimized package imports for better tree-shaking
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    // Enable instrumentation for server-side polyfills
    instrumentationHook: true,
  },

  // Compiler optimizations
  compiler: {
    // Remove console.logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Production optimizations
  swcMinify: true,
  compress: true,
  reactStrictMode: true,

  // Skip TypeScript checking during build - codebase is too large for Vercel's memory limits
  // Type checking is handled by: IDE (real-time), ESLint (via @typescript-eslint), and CI
  // The "Map maximum size exceeded" error occurs during Next.js type checking on large codebases
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Performance optimizations
  poweredByHeader: false,
  generateEtags: true,

  // Webpack optimizations
  webpack: (config, { isServer, dev }) => {
    // No special webpack configuration needed - pdf-parse v2 works with standard bundling
    if (isServer) {
      // Polyfill 'self' for server-side builds
      if (typeof self === 'undefined') {
        global.self = global;
      }
    }

    // Production optimizations disabled - using Next.js defaults
    // Custom splitChunks was causing chunk loading issues

    return config;
  },

  // 301 redirects for retired routes per BRAND_ARCHITECTURE §7
  async redirects() {
    // /industries/* → /solutions/* canonical. The site previously had two
    // URL patterns for the same vertical pages (e.g. /industries/law-firm
    // and /solutions/law-firms), causing keyword cannibalization. We've
    // designated /solutions/* as canonical; /industries/* now 301s here.
    const industryToSolution = [
      ["law-firm", "law-firms"],
      ["healthcare", "healthcare"],
      ["sales", "sales"],
      ["consulting", "consulting"],
      ["education", "education"],
      ["real-estate", "real-estate"],
      ["accounting", "accountants"],
      ["marketing-agency", "agencies"],
      ["it-services", "it-services"],
      ["financial-advisory", "financial-advisors"],
      ["non-profit", "non-profits"],
      ["church", "churches"],
    ];

    return [
      ...industryToSolution.map(([from, to]) => ({
        source: `/industries/${from}`,
        destination: `/solutions/${to}`,
        permanent: true,
      })),
      {
        // Legacy "Transformation Stack" page → studio engagements
        source: "/consulting",
        destination: "/studio/engagements",
        permanent: true,
      },
      {
        // /productivity-guide consolidated into /lead-magnet
        // (one opt-in surface, one promised deliverable: the buyer's guide)
        source: "/productivity-guide",
        destination: "/lead-magnet",
        permanent: true,
      },
      {
        // Legacy "Guided Implementation" page → studio process
        // (Session 2 built /studio/process; redirect now points to its
        // canonical destination.)
        source: "/consultation",
        destination: "/studio/process",
        permanent: true,
      },
      {
        // RFP Engine product card → live RFP marketing surface.
        // Preserves the live SEO at /rfp (the (rfp-marketing) route
        // group) while letting /products/rfp-engine be a valid card
        // target from /products. Per Session 3 brief Step 5: option
        // (b) chosen so the live live page remains the canonical URL
        // and we don't fork content. DO NOT touch (rfp-marketing).
        source: "/products/rfp-engine",
        destination: "/rfp",
        permanent: true,
      },
      {
        // /contact alias → existing /contact-sales surface.
        // The brief specifies CTAs like /contact?product=vellum on
        // /products/vellum; we don't have a /contact route, so this
        // 308 forwards to /contact-sales while preserving the
        // ?product=<slug> query string. If a dedicated /contact page
        // gets built later, this redirect can be removed.
        source: "/contact",
        destination: "/contact-sales",
        permanent: true,
      },
    ];
  },

  // Headers for better caching and security
  async headers() {
    // Security headers applied to all routes
    const securityHeaders = [
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN',
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(self), geolocation=(), interest-cohort=()',
      },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://apis.google.com https://www.googletagmanager.com https://www.google-analytics.com https://cdn.sentry.io https://client.crisp.chat",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://client.crisp.chat",
          "img-src 'self' data: blob: https: http:",
          "font-src 'self' https://fonts.gstatic.com data: https://client.crisp.chat",
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://api.openai.com https://api.anthropic.com https://*.sentry.io https://www.google-analytics.com https://vitals.vercel-insights.com https://client.crisp.chat wss://client.relay.crisp.chat",
          "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://client.crisp.chat",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'self'",
          "upgrade-insecure-requests",
        ].join('; '),
      },
    ];

    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // API routes - prevent caching of sensitive data
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
