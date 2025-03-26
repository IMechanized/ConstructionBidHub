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
      
      // Force unregister previous service workers to ensure updates are applied
      await navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          console.log('Service Worker: Unregistering old service worker');
          registration.unregister();
        }
      });
      
      // Add cache buster to ensure we get the most recent version
      const swVersion = '1.1.0';
      const registration = await navigator.serviceWorker.register(`/sw.js?v=${swVersion}`, {
        scope: '/',
        type: 'classic',
        updateViaCache: 'none' // Don't use cache for the service worker
      });

      if (registration.active) {
        console.log('Service Worker: Active', registration);
      } else if (registration.installing) {
        console.log('Service Worker: Installing', registration);
      } else if (registration.waiting) {
        console.log('Service Worker: Waiting', registration);
      }

      registration.addEventListener('statechange', (e) => {
        console.log('Service Worker: State changed to', (e.target as ServiceWorker).state);
      });

    } catch (error) {
      console.error('Service Worker: Registration failed', error);
    }
  } else {
    console.log('Service Worker: Not supported in this browser');
  }
}

// Start service worker registration after the app has loaded
window.addEventListener('load', registerServiceWorker);