import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isAppInstalled = window.matchMedia('(display-mode: standalone)').matches 
                       || window.matchMedia('(display-mode: fullscreen)').matches
                       || window.matchMedia('(display-mode: minimal-ui)').matches
                       || (window.navigator as any).standalone === true;
    
    if (isAppInstalled) {
      console.log('PWA already installed, hiding install prompt');
      setIsInstallable(false);
      return;
    }
    
    // Re-check on visibility change to detect installation
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const isNowInstalled = window.matchMedia('(display-mode: standalone)').matches 
                           || window.matchMedia('(display-mode: fullscreen)').matches
                           || window.matchMedia('(display-mode: minimal-ui)').matches
                           || (window.navigator as any).standalone === true;
        
        if (isNowInstalled && isInstallable) {
          console.log('App was installed while page was hidden');
          setIsInstallable(false);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Handler for the beforeinstallprompt event
    const handler = (e: Event) => {
      console.log('BeforeInstallPrompt event detected');
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Store the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isInstallable]);

  const install = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt for the next time
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const dismiss = () => {
    // Allow user to dismiss the install prompt without installing
    setIsInstallable(false);
  };

  return { isInstallable, install, dismiss };
}
