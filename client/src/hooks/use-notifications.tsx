import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Notification } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from './use-auth';

function isVercelEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname.includes('vercel.app') || 
         hostname.includes('findconstructionbids.com') ||
         hostname.includes('.vercel.app');
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const isVercel = useMemo(() => isVercelEnvironment(), []);

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    enabled: !!user,
    staleTime: isVercel ? 60000 : 30000,
    refetchInterval: isVercel ? 60000 : false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: 'always',
    gcTime: isVercel ? 120000 : 60000,
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return apiRequest('PATCH', `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('PATCH', '/api/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return apiRequest('DELETE', `/api/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  useEffect(() => {
    if (!user) return;
    
    if (isVercel) {
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected for notifications');
        setIsConnected(true);
        
        ws.send(JSON.stringify({
          type: 'auth',
          userId: user.id.toString()
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'notification') {
            queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
            console.log('New notification received:', message.data);
          } else if (message.type === 'auth_success') {
            console.log('WebSocket authentication successful');
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      setSocket(ws);

      return () => {
        ws.close();
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }, [user, queryClient, isVercel]);

  // Helper functions
  const markAsRead = useCallback((notificationId: number) => {
    markAsReadMutation.mutate(notificationId);
  }, [markAsReadMutation]);

  const markAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  const deleteNotification = useCallback((notificationId: number) => {
    deleteNotificationMutation.mutate(notificationId);
  }, [deleteNotificationMutation]);

  // Computed values
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const hasUnread = unreadCount > 0;

  return {
    notifications,
    isLoading,
    isConnected,
    unreadCount,
    hasUnread,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeletingNotification: deleteNotificationMutation.isPending,
  };
}