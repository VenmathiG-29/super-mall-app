// src/utils/filterHelpers.js
/**
 * Comprehensive filtering and search helpers for various e-commerce data types.
 * Supports multi-criteria filtering, numeric range filters, fuzzy search, sorting etc.
 */

import Fuse from "fuse.js";

// Generic fuzzy search on items by multiple keys
export function fuzzySearch(items, searchTerm, options = {}) {
  if (!searchTerm) return items;
  const fuse = new Fuse(items, {
    threshold: 0.3,
    keys: options.keys || ["name", "description", "category", "brand"],
    ...options
  });
  return fuse.search(searchTerm).map(result => result.item);
}

// Filter shops by multiple optional criteria
export function filterShops(shops, filterOpts) {
  let results = shops;

  if (filterOpts.categories?.length) {
    results = results.filter(shop => filterOpts.categories.includes(shop.category?.id));
  }
  if (filterOpts.location) {
    results = results.filter(shop => shop.location === filterOpts.location);
  }
  if (filterOpts.openNow) {
    results = results.filter(shop => shop.isOpen === true);
  }
  if (filterOpts.hasOffers) {
    results = results.filter(shop => (shop.offers?.length || 0) > 0);
  }
  if (filterOpts.minRating) {
    results = results.filter(shop => (shop.rating || 0) >= filterOpts.minRating);
  }
  return results;
}

export function filterByMultipleCategories(items, categories) {
  return items.filter(item => categories.includes(item.category?.id));
}

// Sort helpers
export function sortShopsByRating(shops) {
  return [...shops].sort((a, b) => (b.rating || 0) - (a.rating || 0));
}

export function sortShopsByDistance(shops, userLocation) {
  return [...shops].sort((a, b) => {
    const distA = calculateDistance(userLocation, a.locationCoords);
    const distB = calculateDistance(userLocation, b.locationCoords);
    return distA - distB;
  });
}

function calculateDistance(locA, locB) {
  if (!locA || !locB) return Number.MAX_SAFE_INTEGER;
  const R = 6371; // Earth radius in km
  const dLat = deg2rad(locB.lat - locA.lat);
  const dLon = deg2rad(locB.lng - locA.lng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(deg2rad(locA.lat)) * Math.cos(deg2rad(locB.lat)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

export function filterOffers(offers, filters) {
  let filtered = offers;
  if (filters.category) {
    filtered = filtered.filter(o => o.category === filters.category);
  }
  if (filters.validOnly) {
    const today = new Date();
    filtered = filtered.filter(o => new Date(o.expiry) >= today);
  }
  if (filters.minDiscount) {
    filtered = filtered.filter(o => o.discount >= filters.minDiscount);
  }
  return filtered;
}

export function sortProductsByRating(products) {
  return [...products].sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
}

export function sortProductsByPrice(products, ascending = true) {
  return [...products].sort((a, b) => ascending ? (a.price - b.price) : (b.price - a.price));
}

export function searchProducts(products, term) {
  return fuzzySearch(products, term, { keys: ["name", "description", "brand", "sku"] });
}
