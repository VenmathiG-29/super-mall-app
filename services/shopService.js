// src/services/shopService.js

import { firestore, storage } from '../firebase.js';
import { logAction } from '../utils/logger.js';

const shopsCollection = firestore.collection('shops');

export async function getAllShops() {
  try {
    const snapshot = await shopsCollection.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    logAction('Error fetching all shops', { error });
    throw error;
  }
}

export async function getShopById(shopId) {
  try {
    const doc = await shopsCollection.doc(shopId).get();
    if (!doc.exists) throw new Error('Shop not found');
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    logAction('Error fetching shop by ID', { shopId, error });
    throw error;
  }
}

export async function getShopOffers(shopId) {
  try {
    const offersSnapshot = await firestore.collection('offers')
      .where('shopId', '==', shopId)
      .get();
    return offersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    logAction('Error fetching shop offers', { shopId, error });
    throw error;
  }
}

export async function setShopFavorite(shopId, favorite = true) {
  try {
    const userId = getCurrentUserId(); // implement your auth user fetch
    const favRef = firestore.collection('users').doc(userId).collection('favorites').doc(shopId);
    if(favorite) {
      await favRef.set({ shopId, addedAt: new Date() });
    } else {
      await favRef.delete();
    }
    logAction('Set shop favorite', { userId, shopId, favorite });
  } catch (error) {
    logAction('Error setting shop favorite', { shopId, error });
    throw error;
  }
}

export async function isShopFavorite() {
  try {
    const userId = getCurrentUserId();
    const favSnapshot = await firestore.collection('users').doc(userId).collection('favorites').get();
    return favSnapshot.docs.map(doc => doc.id);
  } catch (error) {
    logAction('Error fetching favorite shops', { error });
    throw error;
  }
}

export async function getShopInventoryStatus(shopId) {
  try {
    // Aggregate product inventory of a shop
    const productsSnapshot = await firestore.collection('products')
      .where('shopId', '==', shopId)
      .get();
    const inStock = productsSnapshot.docs.some(doc => doc.data().stock > 0);
    return inStock;
  } catch (error) {
    logAction('Error fetching shop inventory', { shopId, error });
    throw error;
  }
}

export async function getShopReviews(shopId) {
  try {
    const reviewsSnapshot = await firestore.collection('reviews')
      .where('shopId', '==', shopId)
      .get();
    return reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    logAction('Error fetching shop reviews', { shopId, error });
    throw error;
  }
}

export async function logAction(action, data = {}) {
  // Replace with your actual logging logic, e.g., send to logging service
  console.log(`[LOG] - ${action}`, data);
}

function getCurrentUserId() {
  // Implement based on your auth system
  // For example: return firebase.auth().currentUser?.uid;
  return 'sampleUserId';
}
