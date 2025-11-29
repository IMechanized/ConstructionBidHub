if (typeof process === 'undefined') {
  (window as any).process = { env: {} };
}

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize the React app
createRoot(document.getElementById("root")!).render(<App />);

// Enable hot module replacement in development
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log('Hot module replacement active - updated modules will be applied automatically');
  });
}

// Register service worker for PWA capabilities and offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Use dev-sw.js in development, sw.js in production
    const swPath = import.meta.env.DEV ? '/dev-sw.js' : '/sw.js';
    
    navigator.serviceWorker.register(swPath)
      .then((registration) => {
        console.log(`Service Worker registered successfully (scope: ${registration.scope})`);
        
        // Check for updates periodically (every 5 minutes)
        setInterval(() => {
          registration.update();
        }, 5 * 60 * 1000);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              console.log('New service worker available - dispatching event for auto-activation');
              
              // Dispatch custom event that UpdateNotifier will handle
              window.dispatchEvent(new CustomEvent('sw-update-available', {
                detail: { registration }
              }));
            }
          });
        });
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}
