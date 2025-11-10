// Push notification utilities for browser notifications

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

// Store notification preferences in localStorage
const PREFERENCES_KEY = "notification-preferences";

export interface NotificationPreferences {
  browserEnabled: boolean;
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
