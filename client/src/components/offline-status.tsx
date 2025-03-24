import { useEffect } from 'react';
import { useOffline } from '@/hooks/use-offline';
import { Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * A component that displays the current offline/online status
 * Appears as a toast-like notification when the status changes
 */
export function OfflineStatus() {
  // This component doesn't render anything visible directly
  // It just provides toast notifications via the useOffline hook
  useOffline();
  return null;
}

/**
 * A component that shows a small indicator in the header when offline
 */
export function OfflineIndicator() {
  const { isOffline } = useOffline();

  // If online, don't render anything
  if (!isOffline) {
    return null;
  }

  return (
    <Badge 
      variant="destructive" 
      className={cn(
        "gap-1 px-1.5 py-1 animate-pulse",
        "transition-opacity duration-300"
      )}
    >
      <WifiOff className="h-3 w-3" />
      <span className="text-xs">Offline</span>
    </Badge>
  );
}

/**
 * A component that shows a larger offline banner
 * Useful for displaying at the top of key pages
 */
export function OfflineBanner() {
  const { isOffline, lastOnline } = useOffline();
  
  // Calculate how long ago we were last online
  const getTimeAgo = () => {
    const now = new Date();
    const diff = now.getTime() - lastOnline.getTime();
    
    // Convert to minutes
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    // Convert to hours
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    
    // Convert to days
    const days = Math.floor(hours / 24);
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  if (!isOffline) {
    return null;
  }

  return (
    <div className="bg-destructive/15 border-l-4 border-destructive p-4 mb-6 rounded-r">
      <div className="flex items-center">
        <WifiOff className="h-5 w-5 text-destructive mr-3" />
        <div>
          <h3 className="font-medium text-destructive">You're working offline</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Last connected {getTimeAgo()}. Some features may be limited until you reconnect.
          </p>
        </div>
      </div>
    </div>
  );
}