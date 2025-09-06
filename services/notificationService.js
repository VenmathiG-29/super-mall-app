// src/services/notificationService.js

import { firestore, messaging } from '../firebase.js';
import { logAction } from '../utils/logger.js';

export async function subscribeToNotifications() {
  try {
    const token = await messaging.getToken({ vapidKey: 'YOUR_PUBLIC_VAPID_KEY' });
    const userId = getCurrentUserId();
    await firestore.collection('notifications').doc(userId).set({ token, subscribedAt: new Date() });
    logAction('User subscribed to notifications', { userId, token });
    return token;
  } catch (error) {
    logAction('Error subscribing to notifications', { error });
    throw error;
  }
}

export async function sendNotification(userId, title, body, data = {}) {
  try {
    // Use Firebase Cloud Messaging API or backend server integration
    logAction('Notification sent', { userId, title, body, data });
  } catch (error) {
    logAction('Error sending notification', { userId, error });
    throw error;
  }
}

function getCurrentUserId() {
  // Your user auth logic here
  return 'sampleUserId';
}
