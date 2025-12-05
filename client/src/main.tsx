if (typeof process === 'undefined') {
  (window as any).process = { env: {} };
}

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const RELOAD_TIMESTAMP_KEY = 'fcb_reload_timestamp';
const RELOAD_COOLDOWN = 60000;

function shouldAttemptReload(): boolean {
  const lastReloadTime = localStorage.getItem(RELOAD_TIMESTAMP_KEY);
  if (lastReloadTime) {
    const elapsed = Date.now() - parseInt(lastReloadTime, 10);
    if (elapsed < RELOAD_COOLDOWN) {
      console.log('Reload cooldown active, skipping auto-reload');
      return false;
    }
  }
  return true;
}

function forceReload() {
  if (!shouldAttemptReload()) {
    return;
  }
  
  console.log('Forcing page reload to fetch fresh assets');
  localStorage.setItem(RELOAD_TIMESTAMP_KEY, Date.now().toString());
  
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
  }
  
  window.location.reload();
}


window.addEventListener('error', (event) => {
  const message = event.message || '';
  const filename = event.filename || '';
  
  const isChunkError = 
    message.includes('Loading chunk') ||
    message.includes('Loading CSS chunk') ||
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Unable to preload CSS') ||
    message.includes('Importing a module script failed') ||
    (filename.includes('/assets/') && message.includes('SyntaxError'));
  
  if (isChunkError) {
    console.error('Chunk loading error detected:', message);
    event.preventDefault();
    forceReload();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const message = reason?.message || reason?.toString() || '';
  
  const isChunkError = 
    message.includes('Loading chunk') ||
    message.includes('Loading CSS chunk') ||
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Unable to preload CSS') ||
    message.includes('Importing a module script failed');
  
  if (isChunkError) {
    console.error('Chunk loading promise rejection:', message);
    event.preventDefault();
    forceReload();
  }
});

createRoot(document.getElementById("root")!).render(<App />);

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log('Hot module replacement active - updated modules will be applied automatically');
  });
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'FORCE_RELOAD') {
      console.log('Received FORCE_RELOAD from service worker');
      forceReload();
    }
    
    if (event.data?.type === 'SW_ACTIVATED') {
      console.log('New service worker activated, version:', event.data.version);
    }
  });

  window.addEventListener('load', () => {
    const swPath = import.meta.env.DEV ? '/dev-sw.js' : '/sw.js';
    
    navigator.serviceWorker.register(swPath)
      .then((registration) => {
        console.log(`Service Worker registered successfully (scope: ${registration.scope})`);
        
        setInterval(() => {
          registration.update();
        }, 5 * 60 * 1000);
        
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New service worker available - auto-activating');
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              
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
  
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      console.log('Page restored from bfcache, checking for updates');
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          registration.update();
        }
      });
    }
  });
}