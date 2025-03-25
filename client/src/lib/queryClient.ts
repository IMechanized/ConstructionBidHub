import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { OfflineError } from "@/hooks/use-offline";

// Check if the browser is online
const isOnline = () => {
  return typeof navigator !== 'undefined' && navigator.onLine;
};

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Make an API request with offline handling
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Check if we're offline before making the request
  if (!isOnline()) {
    throw new OfflineError();
  }

  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // If the error is a network error and we're offline
    if (error instanceof TypeError && !isOnline()) {
      throw new OfflineError();
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Check if we're offline before making the request
    if (!isOnline()) {
      throw new OfflineError();
    }

    try {
      console.log(`[QueryClient] Fetching:`, queryKey[0]);
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      console.log(`[QueryClient] Response status:`, res.status);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log('[QueryClient] Returning null for 401 response');
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      console.log(`[QueryClient] Response data:`, data);
      return data;
    } catch (error) {
      // If the error is a network error and we're offline
      if (error instanceof TypeError && !isOnline()) {
        throw new OfflineError();
      }
      console.error('[QueryClient] Error:', error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Export the offline error for use in components
export { OfflineError };
