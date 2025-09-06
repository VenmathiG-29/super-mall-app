// src/services/locationService.js

import { firestore } from '../firebase.js';
import { logAction } from '../utils/logger.js';

const locationsCollection = firestore.collection('locations');

export async function getAllLocations() {
  try {
    const snapshot = await locationsCollection.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    logAction('Error fetching locations', { error });
    throw error;
  }
}

export async function getUserLocation() {
  try {
    // Use geolocation API or user profile stored location
    if (navigator.geolocation) {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          (err) => reject(err)
        );
      });
    } else {
      throw new Error('Geolocation not supported');
    }
  } catch (error) {
    logAction('Error getting user location', { error });
    throw error;
  }
}

export function onLocationChange(callback) {
  // Example: watchPosition listeners or socket events
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      (pos) => callback({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => logAction('Location watch error', { error: err })
    );
  }
}
