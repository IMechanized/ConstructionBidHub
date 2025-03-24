import { QueryClient, QueryFunction } from "@tanstack/react-query";

class OfflineError extends Error {
  constructor(message = "You are currently offline") {
    super(message);
    this.name = "OfflineError";
  }
}

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
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // If the error is a network error and we're offline
      if (error instanceof TypeError && !isOnline()) {
        throw new OfflineError();
      }
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
      // Set a default callback for offline errors
      onError: (error) => {
        if (error instanceof OfflineError) {
          console.warn('Query failed because device is offline');
        }
      },
    },
    mutations: {
      retry: false,
      // Set a default callback for offline errors
      onError: (error) => {
        if (error instanceof OfflineError) {
          console.warn('Mutation failed because device is offline');
        }
      },
    },
  },
});

// Export the offline error for use in components
export { OfflineError };
