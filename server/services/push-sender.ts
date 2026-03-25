/**
 * Web Push Sender Service
 * Sends VAPID-based push notifications to subscribed devices
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
  type?: string;
}

/**
 * Send a push notification to all subscribed devices for a given user
 */
export async function sendPushToUser(userId: number, payload: PushPayload): Promise<void> {
  ensureConfigured();
  if (!isConfigured) return;

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
