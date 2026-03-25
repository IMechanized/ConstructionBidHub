/**
 * Web Push Sender Service
 * Sends VAPID-based push notifications to subscribed devices,
 * enforcing per-user quiet hours and notification-type preferences.
 */

import webpush from 'web-push';
import { storage } from '../storage.js';

let isConfigured = false;

function ensureConfigured() {
  if (isConfigured) return;
  
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL || 'mailto:support@findconstructionbids.com';

  if (!publicKey || !privateKey) {
    console.warn('[PushSender] VAPID keys not configured. Push notifications will be disabled.');
    return;
  }

  webpush.setVapidDetails(email, publicKey, privateKey);
  isConfigured = true;
  console.log('[PushSender] Web Push configured successfully');
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  type?: 'rfi_response' | 'deadline_reminder' | 'system';
}

/**
 * Checks whether the current server time (adjusted to the user's local timezone)
 * falls within the user's quiet hours window.
 *
 * @param start            HH:mm quiet-hours start in the user's local time
 * @param end              HH:mm quiet-hours end in the user's local time
 * @param utcOffsetMinutes User's UTC offset in minutes (e.g. -300 for UTC-5, +60 for UTC+1).
 *                         Computed client-side as -(new Date().getTimezoneOffset()).
 */
function isInQuietHours(start: string, end: string, utcOffsetMinutes: number): boolean {
  // Convert current UTC time to the user's local wall-clock time
  const nowUtcMs = Date.now();
  const localMs = nowUtcMs + utcOffsetMinutes * 60_000;
  const local = new Date(localMs);
  const current = `${local.getUTCHours().toString().padStart(2, '0')}:${local.getUTCMinutes().toString().padStart(2, '0')}`;

  if (start > end) {
    // Overnight window e.g. "22:00" to "08:00"
    return current >= start || current <= end;
  }
  // Same-day window e.g. "12:00" to "14:00"
  return current >= start && current <= end;
}

/**
 * Send a push notification to all subscribed devices for a given user.
 * Respects quiet hours and per-type preferences stored in the database.
 */
export async function sendPushToUser(userId: number, payload: PushPayload): Promise<void> {
  ensureConfigured();
  if (!isConfigured) return;

  // Enforce server-side notification preferences (quiet hours + type filters)
  try {
    const prefs = await storage.getNotificationPreferences(userId);
    if (prefs) {
      // Check per-type preferences
      const type = payload.type || 'system';
      if (type === 'rfi_response' && !prefs.notifyOnRfiResponse) return;
      if (type === 'deadline_reminder' && !prefs.notifyOnDeadlineReminder) return;

      // Check quiet hours, converting UTC now to the user's local time via their stored offset
      if (prefs.quietHoursEnabled && isInQuietHours(prefs.quietHoursStart, prefs.quietHoursEnd, prefs.utcOffsetMinutes)) {
        console.log(`[PushSender] Suppressing push for user ${userId} — in quiet hours (${prefs.quietHoursStart}–${prefs.quietHoursEnd}, UTC offset: ${prefs.utcOffsetMinutes} min)`);
        return;
      }
    }
  } catch (error) {
    console.error('[PushSender] Failed to load notification preferences for user', userId, error);
    // Fail open: deliver the notification if we can't check preferences
  }

  let subscriptions;
  try {
    subscriptions = await storage.getPushSubscriptionsByUser(userId);
  } catch (error) {
    console.error('[PushSender] Failed to fetch subscriptions for user', userId, error);
    return;
  }

  if (subscriptions.length === 0) return;

  const notification = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/icons/icon-192x192.png',
    badge: payload.badge || '/icons/icon-192x192.png',
    url: payload.url || '/',
    tag: payload.tag || `notification-${Date.now()}`,
    type: payload.type || 'system',
  });

  const sendPromises = subscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        notification
      );
    } catch (error: any) {
      if (error.statusCode === 410 || error.statusCode === 404) {
        // Subscription has expired or is no longer valid — remove it
        console.log('[PushSender] Removing expired subscription for user', userId, sub.endpoint);
        try {
          await storage.deletePushSubscription(sub.endpoint);
        } catch (deleteError) {
          console.error('[PushSender] Failed to delete expired subscription', deleteError);
        }
      } else {
        console.error('[PushSender] Failed to send push notification to', sub.endpoint, error.message || error);
      }
    }
  });

  await Promise.allSettled(sendPromises);
}
