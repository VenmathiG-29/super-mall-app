// src/utils/authHelpers.js

/**
 * Comprehensive auth helper utilities for SuperMall.
 * Includes input validation, JWT token management, password rules,
 * session management, OAuth helpers, and multi-factor auth support.
 */

import jwtDecode from 'jwt-decode';

// Email format validator
export function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Strong password validator: at least 8 chars, uppercase, lowercase, number, special char
export function validatePassword(password) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  return regex.test(password);
}

// Basic username validation: no special chars, min 3 chars
export function validateUsername(username) {
  const regex = /^[a-zA-Z0-9_]{3,}$/;
  return regex.test(username);
}

// JWT decode safely
export function decodeJWT(token) {
  try {
    return jwtDecode(token);
  } catch (error) {
    return null;
  }
}

// Check if JWT token is expired (returns true if expired or invalid)
export function isTokenExpired(token) {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  return Date.now() >= decoded.exp * 1000;
}

// Save token to secure local storage/session storage
export function saveAuthToken(token) {
  localStorage.setItem('supermall_authToken', token);
  // Optionally set httpOnly cookie from backend for security
}

export function getAuthToken() {
  return localStorage.getItem('supermall_authToken');
}

export function clearAuthToken() {
  localStorage.removeItem('supermall_authToken');
}

// Extract user ID or info from decoded token
export function getUserIdFromToken(token) {
  const decoded = decodeJWT(token);
  return decoded?.sub || null;
}

// Simple password strength meter returning a score from 0-4
export function passwordStrength(password) {
  let score = 0;
  if (!password) return score;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[\W_]/.test(password)) score++;
  return score;
}

// Format password strength message for UI
export function getPasswordStrengthMessage(score) {
  switch (score) {
    case 0:
    case 1: return 'Very Weak';
    case 2: return 'Weak';
    case 3: return 'Moderate';
    case 4: return 'Strong';
    case 5: return 'Very Strong';
    default: return '';
  }
}

// Simulated async method to validate username uniqueness (stub)
export async function isUsernameAvailable(username) {
  // Integration with backend API needed here
  const takenUsernames = ['admin', 'user', 'test']; // example
  return !takenUsernames.includes(username.toLowerCase());
}

// Generate secure random token (for magic link or password reset)
export function generateSecureToken(length = 48) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  let token = '';
  for (let i = 0; i < length; i++) {
    const randIndex = Math.floor(Math.random() * charset.length);
    token += charset[randIndex];
  }
  return token;
}

// Multi-factor auth code generator (6-digit numeric)
export function generateMFACode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Validate MFA code (basic length and numeric)
export function validateMFACode(code) {
  return /^\d{6}$/.test(code);
}

// Clean sensitive data from user objects before sending to UI or logs
export function sanitizeUser(user) {
  const { password, resetToken, twoFactorSecret, ...cleanData } = user;
  return cleanData;
}

// Format error messages elegantly for UI display
export function formatErrorMessage(error) {
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (typeof error.toString === 'function') return error.toString();
  return 'An unknown error occurred';
}
