import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook to detect online/offline status and manage app behavior accordingly
 * 
 * @returns {Object} Object containing:
 *   - isOffline: boolean indicating if the app is offline
 *   - lastOnline: Date object of the last time the app was online
 *   - setLastOnline: Function to update the last online timestamp
 */
export function useOffline() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lastOnline, setLastOnline] = useState<Date>(new Date());
  const { toast } = useToast();

  useEffect(() => {
    // Function to handle when the app goes offline
    const handleOffline = () => {
      setIsOffline(true);
      // Show a toast notification
      toast({
        title: "You're offline",
        description: "Some app features may be limited until you reconnect.",
        variant: "destructive",
        duration: 5000,
      });
    };

    // Function to handle when the app comes back online
    const handleOnline = () => {
      setIsOffline(false);
      // Update the last online timestamp
      const now = new Date();
      setLastOnline(now);
      // Show a toast notification
      toast({
        title: "You're back online",
        description: "All app features are now available.",
        variant: "default",
        duration: 3000,
      });
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Clean up event listeners on unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  return { isOffline, lastOnline, setLastOnline };
}

/**
 * Utility function to handle API requests in offline mode
 * 
 * @param {Function} fetchFn The fetch function to execute when online
 * @param {any} fallbackData Optional fallback data to return when offline
 * @returns {Promise<any>} Promise that resolves with data or rejects with error
 */
export async function handleOfflineFetch<T>(
  fetchFn: () => Promise<T>,
  fallbackData?: T
): Promise<T> {
  // Check if we are online
  if (navigator.onLine) {
    try {
      // We're online, so try the fetch
      return await fetchFn();
    } catch (error) {
      // If network error and fallback provided, return fallback
      if (fallbackData !== undefined) {
        console.warn('Network request failed, using fallback data', error);
        return fallbackData;
      }
      throw error;
    }
  } else {
    // We're offline
    if (fallbackData !== undefined) {
      console.warn('Offline mode: Using fallback data');
      return fallbackData;
    }
    
    // No fallback, throw a custom offline error
    throw new OfflineError();
  }
}

/**
 * Custom error class for offline state
 */
export class OfflineError extends Error {
  constructor(message = "You are currently offline") {
    super(message);
    this.name = 'OfflineError';
  }
}