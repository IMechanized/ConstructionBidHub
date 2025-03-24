import { useEffect } from 'react';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useOffline } from '@/hooks/use-offline';
import { format } from 'date-fns';

/**
 * A component that displays the current offline/online status
 * Appears as a toast-like notification when the status changes
 */
export function OfflineStatus() {
  const { toast } = useToast();
  const { isOffline, lastOnline } = useOffline();

  // Show toast notification when online/offline status changes
  useEffect(() => {
    if (isOffline) {
      toast({
        title: 'You are offline',
        description: 'The app will continue to work with limited functionality',
        variant: 'destructive',
        duration: 5000,
      });
    } else {
      toast({
        title: 'Back online',
        description: 'All features are now available',
        duration: 3000,
      });
    }
  }, [isOffline, toast]);

  return null; // This component doesn't render anything, just shows toasts
}

/**
 * A component that shows a small indicator in the header when offline
 */
export function OfflineIndicator() {
  const { isOffline, lastOnline } = useOffline();

  if (!isOffline) return null;

  const formattedLastOnline = format(lastOnline, 'MMM d, h:mm a');

  return (
    <Badge 
      variant="destructive" 
      className="flex items-center gap-1 cursor-help"
      title={`Last online: ${formattedLastOnline}`}
    >
      <WifiOff className="h-3 w-3" />
      <span className="hidden sm:inline">Offline</span>
    </Badge>
  );
}