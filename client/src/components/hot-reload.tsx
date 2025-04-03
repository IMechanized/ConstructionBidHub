import { useEffect, useRef } from 'react';

/**
 * HotReload component that helps with development by checking for code changes
 * and automatically refreshing the page to show the latest changes.
 * This is only active in development mode.
 */
export function HotReload() {
  // Use a ref to store server start time to avoid useEffect dependency cycle
  const serverStartTimeRef = useRef<number>(0);
  // Track if we've already initialized
  const initializedRef = useRef<boolean>(false);
  // Track if we're currently reloading
  const isReloadingRef = useRef<boolean>(false);
  // Track failed attempts to prevent infinite retries
  const failedAttemptsRef = useRef<number>(0);
  
  useEffect(() => {
    // Only run in development mode
    if (!import.meta.env.DEV) {
      return;
    }
    
    // Skip if we're already reloading
    if (isReloadingRef.current) {
      return;
    }
    
    console.log('🔥 Hot Reload: Component mounted. Auto-refresh is enabled.');
    
    // Function to check if app needs to refresh
    const checkForUpdates = async () => {
      // Skip if we're currently reloading
      if (isReloadingRef.current) {
        return;
      }
      
      try {
        // Create a unique URL to bypass cache
        const timestamp = Date.now();
        const response = await fetch(`/api/health?_=${timestamp}`);
        
        if (response.ok) {
          const data = await response.json();
          
          // Initialize server start time reference on first successful check
          if (!initializedRef.current && data.serverStartTime) {
            serverStartTimeRef.current = data.serverStartTime;
            initializedRef.current = true;
            failedAttemptsRef.current = 0;
            console.log('🔥 Hot Reload: Initialized with server time:', data.serverStartTime);
            return;
          }
          
          // If we've initialized and server time has changed, reload
          if (
            initializedRef.current && 
            data.serverStartTime && 
            data.serverStartTime > serverStartTimeRef.current + 1000 // Add buffer to prevent false positives
          ) {
            isReloadingRef.current = true;
            console.log('🔥 Hot Reload: Server has restarted. Reloading page...');
            window.location.reload();
            return;
          }
          
          // Reset failed attempts counter on success
          failedAttemptsRef.current = 0;
        }
      } catch (error) {
        failedAttemptsRef.current++;
        console.log(`🔥 Hot Reload: Error checking for updates (attempt ${failedAttemptsRef.current})`);
        
        // Only reload if we've established a connection before and have fewer than 3 failed attempts
        if (initializedRef.current && failedAttemptsRef.current < 3) {
          // Server might be down due to a restart - wait a bit longer before trying to reload
          isReloadingRef.current = true;
          console.log('🔥 Hot Reload: Attempting to reload in 2 seconds...');
          
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      }
    };
    
    // First check immediately
    checkForUpdates();
    
    // Then check periodically (5 seconds instead of 3)
    const interval = setInterval(checkForUpdates, 5000);
    
    // Cleanup
    return () => {
      clearInterval(interval);
    };
  }, []); // Empty dependency array to run only once on mount
  
  // No visual output - this is just a background utility
  return null;
}

export default HotReload;