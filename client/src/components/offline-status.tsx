import { useState, useEffect } from 'react';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useOffline } from '@/hooks/use-offline';

/**
 * A component that displays the current offline/online status
 * Appears as a toast-like notification when the status changes
 */
export function OfflineStatus() {
  const { isOffline, lastOnline } = useOffline();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    // Show the notification when the status changes
    setVisible(true);
    setClosing(false);

    // Auto-hide the notification after 5 seconds if online
    // Keep it visible if offline
    const timer = !isOffline ? setTimeout(() => {
      setClosing(true);
      setTimeout(() => setVisible(false), 300); // Match the transition duration
    }, 5000) : null;

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOffline]);

  // Don't render anything if not visible
  if (!visible) return null;

  const formatLastOnline = () => {
    if (!lastOnline) return 'Unknown';
    
    const now = new Date();
    const diffMs = now.getTime() - lastOnline.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  return (
    <div 
      className={cn(
        "fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 transition-all duration-300",
        closing ? "opacity-0 transform translate-y-2" : "opacity-100 transform translate-y-0"
      )}
    >
      <Alert variant={isOffline ? "destructive" : "default"}>
        {isOffline ? (
          <WifiOff className="h-4 w-4" />
        ) : (
          <Wifi className="h-4 w-4" />
        )}
        <AlertTitle>
          {isOffline ? "You are offline" : "Back online"}
        </AlertTitle>
        <AlertDescription>
          {isOffline ? (
            <>
              Your internet connection is unavailable. Some features may be limited.
              {lastOnline && (
                <div className="text-xs mt-1">
                  Last connected: {formatLastOnline()}
                </div>
              )}
            </>
          ) : (
            "Your internet connection has been restored."
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}

/**
 * A component that shows a small indicator in the header when offline
 */
export function OfflineIndicator() {
  const { isOffline } = useOffline();
  
  if (!isOffline) return null;
  
  return (
    <div className="flex items-center gap-1.5 text-sm bg-destructive/20 text-destructive rounded-full py-1 px-2.5">
      <WifiOff className="h-3.5 w-3.5" />
      <span className="font-medium">Offline</span>
    </div>
  );
}