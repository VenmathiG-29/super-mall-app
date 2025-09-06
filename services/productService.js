// src/services/productService.js

import { firestore } from '../firebase.js';
import { logAction } from '../utils/logger.js';

const productsCollection = firestore.collection('products');

export async function getAllProducts() {
  try {
    const snapshot = await productsCollection.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    logAction('Error fetching all products', { error });
    throw error;
  }
}

export async function getProductById(productId) {
  try {
    const doc = await productsCollection.doc(productId).get();
    if (!doc.exists) throw new Error('Product not found');
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    logAction('Error fetching product by ID', { productId, error });
    throw error;
  }
}

export async function getProductReviews(productId) {
  try {
    const reviewsSnapshot = await firestore.collection('reviews')
      .where('productId', '==', productId)
      .get();
    return reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    logAction('Error fetching product reviews', { productId, error });
    throw error;
  }
}

export async function addToCart(productId, quantity = 1) {
  try {
    const userId = getCurrentUserId();
    // Add to your cart logic (Firestore or backend)
    // Example:
    await firestore.collection('users').doc(userId).collection('cart').doc(productId).set({ quantity }, { merge: true });
    logAction('Added product to cart', { userId, productId, quantity });
  } catch (error) {
    logAction('Error adding product to cart', { productId, error });
    throw error;
  }
}

function getCurrentUserId() {
  // Implement auth user ID retrieval
  return 'sampleUserId';
}
