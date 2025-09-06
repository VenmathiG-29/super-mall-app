// src/utils/logger.js
/**
 * Enhanced logger with multi-level support, structured JSON output,
 * context enrichment, error serialization, log filtering, and extensibility.
 */

const LOG_LEVELS = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
  FATAL: 50
};

let currentLogLevel = LOG_LEVELS.DEBUG; // default log level

// Add timestamp, level, message, and optional metadata in structured JSON
function formatLog(levelName, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const baseLog = {
    timestamp,
    level: levelName,
    message,
    ...meta
  };
  if (meta.error && meta.error instanceof Error) {
    baseLog.error = {
      name: meta.error.name,
      message: meta.error.message,
      stack: meta.error.stack
    };
    delete baseLog.meta; // avoid duplication
  }
  return JSON.stringify(baseLog);
}

const Logger = {
  setLevel(levelName) {
    if (LOG_LEVELS[levelName] !== undefined) {
      currentLogLevel = LOG_LEVELS[levelName];
    }
  },
  debug(message, meta) {
    if (currentLogLevel <= LOG_LEVELS.DEBUG) {
      console.debug(formatLog('DEBUG', message, meta));
    }
  },
  info(message, meta) {
    if (currentLogLevel <= LOG_LEVELS.INFO) {
      console.info(formatLog('INFO', message, meta));
    }
  },
  warn(message, meta) {
    if (currentLogLevel <= LOG_LEVELS.WARN) {
      console.warn(formatLog('WARN', message, meta));
    }
  },
  error(message, meta) {
    if (currentLogLevel <= LOG_LEVELS.ERROR) {
      console.error(formatLog('ERROR', message, meta));
    }
  },
  fatal(message, meta) {
    if (currentLogLevel <= LOG_LEVELS.FATAL) {
      console.error(formatLog('FATAL', message, meta));
    }
  }
};

export function logAction(message, meta = {}) {
  // You can add extra contextual info here (userId, requestId, etc)
  Logger.info(message, meta);
}

export default Logger;


// src/utils/authHelpers.js
/**
 * Advanced auth helpers with token handling, password validation,
 * session management, and user identity utilities.
 */

import jwtDecode from 'jwt-decode'; // assume this package is installed

export function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function validatePassword(password) {
  // Minimum 8 char, uppercase, lowercase, number, special char
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  return regex.test(password);
}

export function jwtDecodePayload(token) {
  try {
    return jwtDecode(token);
  } catch (e) {
    return null;
  }
}

export function isTokenExpired(token) {
  const payload = jwtDecodePayload(token);
  if (!payload || !payload.exp) return true;
  return Date.now() > payload.exp * 1000;
}

export function storeSession(token) {
  localStorage.setItem('authToken', token);
}

export function getSession() {
  return localStorage.getItem('authToken');
}

export function clearSession() {
  localStorage.removeItem('authToken');
}

export function isLoggedIn() {
  const token = getSession();
  return token && !isTokenExpired(token);
}


// src/utils/filterHelpers.js
/**
 * Extensive filter helpers for products, shops, offers and more.
 * Supports multi-criteria filtering, fuzzy search, numeric range filters,
 * and flexible category & location filtering.
 */

import Fuse from 'fuse.js'; // for fuzzy search - npm install fuse.js

export function filterShops(shops, filters) {
  let results = shops;

  if (filters.categories && filters.categories.length) {
    results = results.filter(shop => filters.categories.includes(shop.category?.id));
  }
  if (filters.location) {
    results = results.filter(shop => shop.location === filters.location);
  }
  if (filters.openNow) {
    results = results.filter(shop => shop.isOpen);
  }
  if (filters.hasOffers) {
    results = results.filter(shop => shop.offers && shop.offers.length > 0);
  }
  if (filters.minRating) {
    results = results.filter(shop => (shop.rating || 0) >= filters.minRating);
  }

  return results;
}

export function filterByMultipleCategories(items, categories) {
  return items.filter(item => categories.includes(item.category?.id));
}

export function searchShops(shops, searchTerm) {
  if (!searchTerm) return shops;
  const fuse = new Fuse(shops, { keys: ['name', 'category.name', 'location'], threshold: 0.3 });
  return fuse.search(searchTerm).map(result => result.item);
}

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

function calculateDistance(loc1, loc2) {
  if (!loc1 || !loc2) return Number.MAX_SAFE_INTEGER;
  const R = 6371; // Earth radius in km
  const dLat = deg2rad(loc2.lat - loc1.lat);
  const dLon = deg2rad(loc2.lng - loc1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(loc1.lat)) * Math.cos(deg2rad(loc2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
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

export function fuzzySearchProducts(products, keyword) {
  if (!keyword) return products;
  const fuse = new Fuse(products, { keys: ['name', 'description', 'brand'], threshold: 0.3 });
  return fuse.search(keyword).map(res => res.item);
}
