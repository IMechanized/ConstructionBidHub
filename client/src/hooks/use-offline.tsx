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
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [lastOnline, setLastOnline] = useState<Date | null>(
    navigator.onLine ? new Date() : null
  );

  useEffect(() => {
    // Initial check for online/offline status
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOffline(!online);
      
      if (online) {
        setLastOnline(new Date());
        // Store the last online time in localStorage for cross-session reference
        localStorage.setItem('lastOnline', new Date().toISOString());
      }
    };

    // Load last online time from localStorage if available
    const storedLastOnline = localStorage.getItem('lastOnline');
    if (storedLastOnline && !lastOnline) {
      setLastOnline(new Date(storedLastOnline));
    }

    // Add event listeners for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Initial status check
    updateOnlineStatus();

    // Cleanup
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [lastOnline]);

  return {
    isOffline,
    lastOnline,
    setLastOnline
  };
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
  if (!navigator.onLine) {
    // If we have fallback data, return it
    if (fallbackData !== undefined) {
      return Promise.resolve(fallbackData);
    }
    
    // Otherwise reject with a custom offline error
    return Promise.reject(new Error('You are currently offline'));
  }
  
  // We're online, proceed with the original fetch
  try {
    return await fetchFn();
  } catch (error) {
    // If the fetch fails and we have fallback data, return it
    if (fallbackData !== undefined) {
      return fallbackData;
    }
    
    // Otherwise just propagate the error
    throw error;
  }
}