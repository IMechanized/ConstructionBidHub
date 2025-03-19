import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PwaInstallHook {
  isInstallable: boolean;
  install: () => Promise<void>;
  isIOS: boolean;
  isStandalone: boolean;
}

export function usePwaInstall(): PwaInstallHook {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if the device is iOS
    const checkIOS = () => {
      const ua = window.navigator.userAgent;
      const iOS = /iPad|iPhone|iPod/.test(ua);
      setIsIOS(iOS);
    };

    // Check if app is already installed
    const checkStandalone = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandalone);
    };

    checkIOS();
    checkStandalone();

    const handler = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Store the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      console.log('PWA installation prompt event captured');
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkStandalone);

    // Log PWA installation status
    console.log('PWA Install Hook initialized:', {
      isIOS,
      isStandalone,
      isInstallable: deferredPrompt !== null
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkStandalone);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) {
      console.log('No installation prompt available');
      return;
    }

    try {
      // Show the install prompt
      console.log('Triggering install prompt');
      await deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      console.log('Installation prompt result:', outcome);

      // Clear the deferredPrompt for the next time
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('Error during PWA installation:', error);
    }
  };

  return { isInstallable, install, isIOS, isStandalone };
}