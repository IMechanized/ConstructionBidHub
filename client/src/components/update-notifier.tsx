import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';

export function UpdateNotifier() {
  const { toast } = useToast();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const handleUpdateAvailable = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Update available event received');
      setUpdateAvailable(true);
      setRegistration(customEvent.detail?.registration || null);
      
      toast({
        title: 'Update Available',
        description: 'A new version is available. Click to refresh and get the latest features.',
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            data-testid="button-refresh-update"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        ),
        duration: Infinity,
      });
    };

    const handleSWUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('SW updated event received, version:', customEvent.detail?.version);
      
      if (!updateAvailable) {
        toast({
          title: 'App Updated',
          description: 'The app has been updated. Refresh to see the latest changes.',
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              data-testid="button-refresh-app"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          ),
          duration: 10000,
        });
      }
    };

    window.addEventListener('sw-update-available', handleUpdateAvailable);
    window.addEventListener('sw-updated', handleSWUpdated);

    return () => {
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
      window.removeEventListener('sw-updated', handleSWUpdated);
    };
  }, [toast, updateAvailable]);

  const handleRefresh = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  };

  return null;
}
