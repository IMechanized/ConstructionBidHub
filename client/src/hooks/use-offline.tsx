import { useState, useEffect } from 'react';

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

  useEffect(() => {
    // Initial value for lastOnline from localStorage
    const storedLastOnline = localStorage.getItem('fcb-last-online');
    if (storedLastOnline) {
      setLastOnline(new Date(storedLastOnline));
    }

    // Event listeners for online/offline status
    const handleOnline = () => {
      setIsOffline(false);
      const now = new Date();
      setLastOnline(now);
      localStorage.setItem('fcb-last-online', now.toISOString());
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection periodically (every 30 seconds)
    const intervalId = setInterval(() => {
      // Using fetch to make a tiny request to determine if we're actually online
      // even if navigator.onLine might report true
      fetch('/api/health', { 
        method: 'HEAD',
        // Short timeout to avoid hanging
        signal: AbortSignal.timeout(3000) 
      })
        .then(() => {
          if (isOffline) {
            handleOnline();
          }
        })
        .catch(() => {
          if (!isOffline) {
            handleOffline();
          }
        });
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [isOffline]);

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
  // Check if we're offline
  if (!navigator.onLine) {
    if (fallbackData !== undefined) {
      return fallbackData;
    }
    throw new Error('You are currently offline');
  }

  try {
    // Try the fetch operation
    return await fetchFn();
  } catch (error) {
    // If we have fallback data, use it when the fetch fails
    if (fallbackData !== undefined) {
      return fallbackData;
    }
    throw error;
  }
}