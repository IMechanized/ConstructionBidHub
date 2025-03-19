if (typeof process === 'undefined') {
  (window as any).process = { env: {} };
}

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize the React app
createRoot(document.getElementById("root")!).render(<App />);

// Register service worker
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      console.log('Service Worker: Registration starting...');

      // Only unregister service workers in development
      if (import.meta.env.DEV) {
        await navigator.serviceWorker.getRegistrations().then(function(registrations) {
          for(let registration of registrations) {
            console.log('Service Worker: Unregistering old service worker');
            registration.unregister();
          }
        });
      }

      // Wait for the page to load
      await new Promise(resolve => {
        if (document.readyState === 'complete') {
          resolve(undefined);
        } else {
          window.addEventListener('load', () => resolve(undefined));
        }
      });

      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        type: 'classic',
        updateViaCache: 'none'
      });

      // Log registration state
      if (registration.active) {
        console.log('Service Worker: Active', registration);
      } else if (registration.installing) {
        console.log('Service Worker: Installing', registration);
      } else if (registration.waiting) {
        console.log('Service Worker: Waiting', registration);
      }

      // Handle updates
      registration.addEventListener('statechange', (e) => {
        console.log('Service Worker: State changed to', (e.target as ServiceWorker).state);
      });

      // Check for updates every hour
      setInterval(async () => {
        try {
          await registration.update();
          console.log('Service Worker: Checked for updates');
        } catch (error) {
          console.error('Service Worker: Update check failed:', error);
        }
      }, 60 * 60 * 1000);

    } catch (error) {
      console.error('Service Worker: Registration failed', error);
    }
  } else {
    console.log('Service Worker: Not supported in this browser');
  }
}

// Start service worker registration
registerServiceWorker();