# Progressive Web App (PWA) Guide

The Perpetual Core Platform is now a fully-featured Progressive Web App, allowing users to install it on their devices like a native application.

## 🚀 Features

### Installation
Users can install the Perpetual Core Platform on:
- **Desktop**: Chrome, Edge, Safari (macOS)
- **Mobile**: iOS Safari, Chrome (Android)
- **Tablets**: All modern browsers

### Capabilities

1. **Offline Support** (via Service Worker)
   - Cached static assets
   - Offline fallback pages
   - Background sync capability

2. **App-Like Experience**
   - Full-screen mode (no browser chrome)
   - Custom splash screen
   - Native app feel

3. **Performance**
   - Smart caching strategies
   - Faster repeat visits
   - Reduced data usage

4. **Native Features**
   - Add to home screen
   - Push notifications (ready)
   - Share target API
   - App shortcuts

## 📱 Installation Instructions

### Desktop (Chrome/Edge)
1. Visit the Perpetual Core Platform
2. Look for the install icon in the address bar
3. Click "Install" when prompted
4. The app will be added to your applications

### iOS
1. Open Safari and navigate to the platform
2. Tap the Share button
3. Select "Add to Home Screen"
4. Name the app and tap "Add"

### Android
1. Open Chrome and visit the platform
2. Tap the menu (three dots)
3. Select "Add to Home Screen"
4. Confirm the installation

## ⚙️ Configuration

### Manifest (`/public/manifest.json`)

The manifest defines how the PWA appears and behaves:

```json
{
  "name": "AI Operating System",
  "short_name": "Perpetual Core",
  "start_url": "/dashboard",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
}
```

### Caching Strategies

We use different caching strategies for optimal performance:

1. **CacheFirst**: Static assets (images, fonts)
   - Checks cache first, then network
   - Best for assets that rarely change

2. **NetworkFirst**: API calls, Supabase data
   - Tries network first, falls back to cache
   - Ensures fresh data when online

3. **StaleWhileRevalidate**: JavaScript, CSS
   - Serves cached version immediately
   - Updates cache in background

### Service Worker Configuration

Located in `next.config.mjs`:

```javascript
const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  sw: 'service-worker.js',
  runtimeCaching: [...]
});
```

## 🎯 App Shortcuts

Quick actions available from the app icon:

1. **AI Chat** - Start a new conversation
2. **Documents** - View documents
3. **Tasks** - Manage tasks

Access these by:
- **Desktop**: Right-click the app icon
- **Mobile**: Long-press the app icon

## 📤 Share Target

The PWA can receive shared content from other apps:

- Share text → Creates a new document
- Share images → Uploads to documents
- Share PDFs → Imports to system

## 🔔 Push Notifications (Ready)

Infrastructure is in place for push notifications:

```typescript
// Future implementation
if ('Notification' in window) {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    // Register push subscription
  }
}
```

## 🛠️ Development

### Testing PWA Features

1. **Build the app:**
   ```bash
   npm run build
   npm start
   ```

2. **Test with Lighthouse:**
   - Open Chrome DevTools
   - Go to Lighthouse tab
   - Run PWA audit

3. **Check Service Worker:**
   - Open DevTools → Application
   - View Service Workers section
   - Check Cache Storage

### Disable PWA in Development

PWA is automatically disabled in development mode to avoid caching issues.

To test PWA features locally:
```bash
npm run build
npm start
```

### Clear Cache

If you need to clear the service worker cache:

```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
});

caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key));
});
```

## 📊 Performance Metrics

Expected PWA scores (Lighthouse):

- **Performance**: 90+
- **Accessibility**: 95+
- **Best Practices**: 95+
- **SEO**: 100
- **PWA**: 100

## 🎨 Icons

PWA icons are located in `/public/icons/`:

Required sizes:
- 72x72, 96x96, 128x128, 144x144
- 152x152, 192x192, 384x384, 512x512

Icon formats:
- PNG with transparency
- Purpose: `maskable any` (adaptive icons)

### Generating Icons

Use tools like:
- [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

## 🔒 Security Considerations

1. **HTTPS Required**
   - PWAs only work on HTTPS
   - Service workers require secure context

2. **Cache Security**
   - Don't cache sensitive data
   - Clear auth tokens on logout
   - Use network-first for user data

3. **Update Strategy**
   - Service worker auto-updates on page load
   - `skipWaiting: true` for immediate updates
   - Clear old caches on activation

## 📈 Analytics

Track PWA-specific metrics:

```javascript
// Track installation
window.addEventListener('beforeinstallprompt', (e) => {
  // Analytics: PWA install prompt shown
});

window.addEventListener('appinstalled', (e) => {
  // Analytics: PWA installed
});

// Track standalone usage
if (window.matchMedia('(display-mode: standalone)').matches) {
  // User is using PWA, not browser
}
```

## 🐛 Troubleshooting

### App Won't Install
- Check HTTPS is enabled
- Verify manifest.json is accessible
- Ensure service worker is registered
- Check browser console for errors

### Updates Not Applying
- Hard refresh (Cmd/Ctrl + Shift + R)
- Unregister service worker manually
- Clear browser cache

### Icons Not Showing
- Verify icon paths in manifest.json
- Check icon file sizes match manifest
- Clear cache and reinstall

## 📚 Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Workbox](https://developers.google.com/web/tools/workbox)

## 🎯 Future Enhancements

Potential PWA features to add:

1. **Background Sync**
   - Sync data when connection restored
   - Queue failed requests

2. **Periodic Background Sync**
   - Fetch latest notifications
   - Update content in background

3. **Web Share API**
   - Share content from the app
   - Native share sheet integration

4. **File System Access**
   - Save/open files directly
   - Better document management

5. **Badging API**
   - Show unread count on app icon
   - System notification badges
