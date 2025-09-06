// src/services/offerService.js

import { firestore } from '../firebase.js';
import { logAction } from '../utils/logger.js';

const offersCollection = firestore.collection('offers');

export async function getAllOffers() {
  try {
    const snapshot = await offersCollection.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    logAction('Error fetching all offers', { error });
    throw error;
  }
}

export async function getOffersByFloorId(floorId) {
  try {
    const snapshot = await offersCollection.where('floorId', '==', floorId).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    logAction('Error fetching offers by floor', { floorId, error });
    throw error;
  }
}

export async function redeemOffer(offerId) {
  try {
    // Add business logic for redeeming an offer (validation, update user cart/status)
    logAction('Offer redeemed', { offerId });
  } catch (error) {
    logAction('Error redeeming offer', { offerId, error });
    throw error;
  }
}

export async function shareOffer(offerId) {
  try {
    // Generate and return shareable link or handle social shares
    logAction('Offer shared', { offerId });
  } catch (error) {
    logAction('Error sharing offer', { offerId, error });
    throw error;
  }
}
