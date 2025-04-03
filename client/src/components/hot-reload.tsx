import { useEffect, useState } from 'react';

/**
 * HotReload component that helps with development by checking for code changes
 * and automatically refreshing the page to show the latest changes.
 * This is only active in development mode.
 */
export function HotReload() {
  const [lastUpdateCheck, setLastUpdateCheck] = useState<number>(Date.now());
  
  useEffect(() => {
    // Only run in development mode
    if (!import.meta.env.DEV) {
      return;
    }
    
    console.log('🔥 Hot Reload: Component mounted. Auto-refresh is enabled.');
    
    // Function to check if app needs to refresh
    const checkForUpdates = async () => {
      try {
        // Create a unique URL to bypass cache
        const timestamp = Date.now();
        const response = await fetch(`/api/health?_=${timestamp}`);
        
        if (response.ok) {
          const data = await response.json();
          
          // If the server was restarted, reload the page
          if (data.serverStartTime && data.serverStartTime > lastUpdateCheck) {
            console.log('🔥 Hot Reload: Server has restarted. Reloading page...');
            window.location.reload();
          }
          
          setLastUpdateCheck(timestamp);
        }
      } catch (error) {
        console.log('🔥 Hot Reload: Error checking for updates, server might be restarting');
        // Server might be down due to a restart - wait and then refresh
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    };
    
    // Check every 3 seconds
    const interval = setInterval(checkForUpdates, 3000);
    
    // Track navigation events that might indicate a page change
    const handleNavigation = () => {
      console.log('🔥 Hot Reload: Page navigation detected');
      checkForUpdates();
    };
    
    window.addEventListener('popstate', handleNavigation);
    
    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener('popstate', handleNavigation);
    };
  }, [lastUpdateCheck]);
  
  // No visual output - this is just a background utility
  return null;
}

export default HotReload;