import { useEffect, useRef } from 'react';

export function UpdateNotifier() {
  const isReloadingRef = useRef(false);

  useEffect(() => {
    const handleUpdateAvailable = (event: Event) => {
      if (isReloadingRef.current) return;
      
      const customEvent = event as CustomEvent;
      const registration = customEvent.detail?.registration;
      
      console.log('Update available - automatically activating new version');
      
      if (registration && registration.waiting) {
        isReloadingRef.current = true;
        
        // Set up listener for when new service worker takes control
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('New service worker activated - reloading page');
          window.location.reload();
        }, { once: true });
        
        // Tell the waiting service worker to activate
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    };

    window.addEventListener('sw-update-available', handleUpdateAvailable);

    return () => {
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
    };
  }, []);

  return null;
}
