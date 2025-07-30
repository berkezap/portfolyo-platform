import * as Sentry from '@sentry/nextjs';

// Client-side Sentry initialization
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  release: 'portfolyo-platform@0.1.0',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  environment: process.env.NODE_ENV || 'development',
  debug: false, // Production'da debug kapalı
  beforeSend(event) {
    // Production'da hassas bilgileri temizle
    if (process.env.NODE_ENV === 'production') {
      if (event.level === 'info' || event.level === 'debug') {
        return null;
      }
      // URL'leri temizle
      if (event.request?.url) {
        const url = new URL(event.request.url);
        if (url.pathname.includes('/api/auth/')) {
          return null; // Auth endpoint'lerini gizle
        }
      }
    }
    return event;
  },
});

console.log('🔧 Client Instrumentation: Sentry enabled');

export const onRouterTransitionStart = () => {
  console.log('🔄 Router transition started');
};