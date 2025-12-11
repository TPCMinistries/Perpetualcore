export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Polyfill 'self' for server-side rendering
    if (typeof globalThis.self === 'undefined') {
      (globalThis as any).self = globalThis;
    }

    // Initialize Sentry for server-side
    await import('./sentry.server.config');

    // Setup graceful shutdown handling
    const { setupGracefulShutdown } = await import('@/lib/server/graceful-shutdown');
    setupGracefulShutdown();
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Initialize Sentry for edge runtime
    await import('./sentry.edge.config');
  }
}

// Export onRequestError handler for Sentry
export const onRequestError = async (
  err: { digest: string } & Error,
  request: {
    path: string;
    method: string;
    headers: { [key: string]: string };
  },
  context: {
    routerKind: 'Pages Router' | 'App Router';
    routePath: string;
    routeType: 'render' | 'route' | 'action' | 'middleware';
    renderSource?: 'react-server-components' | 'react-server-components-payload' | 'server-rendering';
    revalidateReason?: 'on-demand' | 'stale' | undefined;
    renderType?: 'dynamic' | 'dynamic-resume';
  }
) => {
  // Only import Sentry when needed
  const Sentry = await import('@sentry/nextjs');

  Sentry.captureException(err, {
    extra: {
      digest: err.digest,
      path: request.path,
      method: request.method,
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
      renderSource: context.renderSource,
    },
    tags: {
      routeType: context.routeType,
      routerKind: context.routerKind,
    },
  });
};
