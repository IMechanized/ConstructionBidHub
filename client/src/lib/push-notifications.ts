// Push notification utilities for browser notifications and Web Push (VAPID)

export interface NotificationPermissionState {
  supported: boolean;
  granted: boolean;
  denied: boolean;
  default: boolean;
}

export function getNotificationPermissionState(): NotificationPermissionState {
  if (!("Notification" in window)) {
    return {
      supported: false,
      granted: false,
      denied: false,
      default: true,
    };
  }

  return {
    supported: true,
    granted: Notification.permission === "granted",
    denied: Notification.permission === "denied",
    default: Notification.permission === "default",
  };
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "denied") {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return false;
  }
}

export interface BrowserNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  silent?: boolean;
}

export function showBrowserNotification(options: BrowserNotificationOptions): Notification | null {
  const state = getNotificationPermissionState();
  
  if (!state.supported || !state.granted) {
    return null;
  }

  try {
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || "/favicon.ico",
      badge: options.badge,
      tag: options.tag,
      data: options.data,
      requireInteraction: options.requireInteraction || false,
      silent: options.silent || false,
    });

    // Auto-close after 5 seconds if not requiring interaction
    if (!options.requireInteraction) {
      setTimeout(() => notification.close(), 5000);
    }

    return notification;
  } catch (error) {
    console.error("Error showing notification:", error);
    return null;
  }
}

export function checkNotificationSupport(): boolean {
  return "Notification" in window;
}

export function checkPushSupport(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window;
}

// Store notification preferences in localStorage
const PREFERENCES_KEY = "notification-preferences";

export interface NotificationPreferences {
  browserEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  digestMode: "instant" | "daily" | "weekly" | "never";
  notifyOnRfiResponse: boolean;
  notifyOnDeadlineReminder: boolean;
  notifyOnNewRfp: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm format
  quietHoursEnd: string;   // HH:mm format
}

export const defaultNotificationPreferences: NotificationPreferences = {
  browserEnabled: false,
  pushEnabled: false,
  emailEnabled: true,
  digestMode: "instant",
  notifyOnRfiResponse: true,
  notifyOnDeadlineReminder: true,
  notifyOnNewRfp: true,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
};

export function getNotificationPreferences(): NotificationPreferences {
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    if (stored) {
      return { ...defaultNotificationPreferences, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("Failed to load notification preferences:", error);
  }
  return defaultNotificationPreferences;
}

export function saveNotificationPreferences(preferences: NotificationPreferences): void {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error("Failed to save notification preferences:", error);
  }
}

export function isInQuietHours(preferences: NotificationPreferences): boolean {
  if (!preferences.quietHoursEnabled) {
    return false;
  }

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  
  const start = preferences.quietHoursStart;
  const end = preferences.quietHoursEnd;

  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (start > end) {
    return currentTime >= start || currentTime <= end;
  }

  // Handle same-day quiet hours (e.g., 12:00 to 14:00)
  return currentTime >= start && currentTime <= end;
}

export function shouldShowNotification(
  type: "rfi_response" | "deadline_reminder" | "new_rfp",
  preferences: NotificationPreferences
): boolean {
  // Check if browser notifications are enabled
  if (!preferences.browserEnabled) {
    return false;
  }

  // Check quiet hours
  if (isInQuietHours(preferences)) {
    return false;
  }

  // Check notification type preferences
  switch (type) {
    case "rfi_response":
      return preferences.notifyOnRfiResponse;
    case "deadline_reminder":
      return preferences.notifyOnDeadlineReminder;
    case "new_rfp":
      return preferences.notifyOnNewRfp;
    default:
      return true;
  }
}

// ==========================================
// WEB PUSH (VAPID) SUBSCRIPTION MANAGEMENT
// ==========================================

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function getVapidPublicKey(): Promise<string | null> {
  try {
    const response = await fetch("/api/push-subscriptions/vapid-key");
    if (!response.ok) return null;
    const data = await response.json();
    return data.publicKey || null;
  } catch (error) {
    console.error("Failed to fetch VAPID public key:", error);
    return null;
  }
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (!checkPushSupport()) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    return registration.pushManager.getSubscription();
  } catch (error) {
    console.error("Failed to get current push subscription:", error);
    return null;
  }
}

export async function subscribeToPush(): Promise<boolean> {
  if (!checkPushSupport()) {
    console.warn("Push notifications are not supported in this browser");
    return false;
  }

  try {
    const vapidKey = await getVapidPublicKey();
    if (!vapidKey) {
      console.error("VAPID public key not available");
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    // Send subscription to backend
    const subscriptionJson = subscription.toJSON();
    const response = await fetch("/api/push-subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        endpoint: subscriptionJson.endpoint,
        keys: subscriptionJson.keys,
        userAgent: navigator.userAgent,
      }),
    });

    if (!response.ok) {
      console.error("Failed to save push subscription to server");
      await subscription.unsubscribe();
      return false;
    }

    console.log("Push subscription registered successfully");
    return true;
  } catch (error) {
    console.error("Failed to subscribe to push notifications:", error);
    return false;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (!checkPushSupport()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) return true;

    // Remove from backend first
    const subscriptionJson = subscription.toJSON();
    await fetch("/api/push-subscriptions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ endpoint: subscriptionJson.endpoint }),
    }).catch(err => console.error("Failed to remove push subscription from server:", err));

    // Then unsubscribe from browser
    const success = await subscription.unsubscribe();
    if (success) {
      console.log("Push subscription removed successfully");
    }
    return success;
  } catch (error) {
    console.error("Failed to unsubscribe from push notifications:", error);
    return false;
  }
}

export async function isPushSubscribed(): Promise<boolean> {
  const sub = await getCurrentPushSubscription();
  return sub !== null;
}
