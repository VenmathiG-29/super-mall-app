// src/services/wishlistService.js

import { firestore } from '../firebase.js';
import { logAction } from '../utils/logger.js';

export async function getUserWishlist() {
  try {
    const userId = getCurrentUserId();
    const wishSnapshot = await firestore.collection('users').doc(userId).collection('wishlist').get();
    return wishSnapshot.docs.map(doc => doc.id);
  } catch (error) {
    logAction('Error fetching user wishlist', { error });
    throw error;
  }
}

export async function addToWishlist(productId) {
  try {
    const userId = getCurrentUserId();
    await firestore.collection('users').doc(userId).collection('wishlist').doc(productId).set({ addedAt: new Date() });
    logAction('Added to wishlist', { userId, productId });
  } catch (error) {
    logAction('Error adding to wishlist', { productId, error });
    throw error;
  }
}

export async function removeFromWishlist(productId) {
  try {
    const userId = getCurrentUserId();
    await firestore.collection('users').doc(userId).collection('wishlist').doc(productId).delete();
    logAction('Removed from wishlist', { userId, productId });
  } catch (error) {
    logAction('Error removing from wishlist', { productId, error });
    throw error;
  }
}

function getCurrentUserId() {
  // Your actual user auth integration here
  return 'sampleUserId';
}
