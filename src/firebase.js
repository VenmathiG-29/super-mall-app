// src/firebase.js

/**
 * Comprehensive Firebase setup and configuration for SuperMall
 * Features included:
 * - Modular Firebase v9+ SDK usage
 * - Authentication (Email/Password, OAuth providers)
 * - Firestore real-time & batch operations
 * - Storage for media uploads
 * - Cloud Messaging setup for push notifications
 * - User presence and session management toolkit
 */

import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  getDocs,
  onSnapshot,
  writeBatch,
  orderBy,
  where,
  limit,
  startAfter,
  endBefore,
  serverTimestamp,
} from "firebase/firestore";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Your project's Firebase config (replace with your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyExampleKey1234567890",
  authDomain: "supermall-2025.firebaseapp.com",
  projectId: "supermall-2025",
  storageBucket: "supermall-2025.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdefghijklmno",
  measurementId: "G-EXAMPLEMEASURE"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Auth exports and helpers
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User signed in:", user.uid);
  } else {
    console.log("User signed out");
  }
});

async function loginWithEmail(email, password) {
  return await signInWithEmailAndPassword(auth, email, password);
}

async function registerWithEmail(email, password, displayName) {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(userCred.user, { displayName });
  }
  await sendEmailVerification(userCred.user);
  return userCred;
}

async function signOutUser() {
  return await signOut(auth);
}

async function signInWithGoogle() {
  return await signInWithPopup(auth, googleProvider);
}

async function sendPasswordReset(email) {
  return await sendPasswordResetEmail(auth, email);
}

// Firestore exports and helpers
const db = getFirestore(app);

function getCollectionRef(collectionName) {
  return collection(db, collectionName);
}

function getDocumentRef(collectionName, docId) {
  return doc(db, collectionName, docId);
}

async function getDocument(collectionName, docId) {
  const refDoc = getDocumentRef(collectionName, docId);
  const docSnap = await getDoc(refDoc);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
}

async function setDocument(collectionName, docId, data) {
  const refDoc = getDocumentRef(collectionName, docId);
  await setDoc(refDoc, data, { merge: true });
}

async function updateDocument(collectionName, docId, data) {
  const refDoc = getDocumentRef(collectionName, docId);
  await updateDoc(refDoc, data);
}

async function deleteDocument(collectionName, docId) {
  await deleteDoc(getDocumentRef(collectionName, docId));
}

async function queryCollection(collectionName, conditions = [], options = {}) {
  let q = query(getCollectionRef(collectionName), ...conditions);
  if (options.orderBy) q = query(q, orderBy(...options.orderBy));
  if (options.limit) q = query(q, limit(options.limit));
  return await getDocs(q);
}

// Real-time listener for collection or document
function listenToCollection(collectionName, conditions = [], callback) {
  const q = query(getCollectionRef(collectionName), ...conditions);
  return onSnapshot(q, callback);
}

function listenToDocument(collectionName, docId, callback) {
  const refDoc = getDocumentRef(collectionName, docId);
  return onSnapshot(refDoc, callback);
}

// Batch writes
function createBatch() {
  return writeBatch(db);
}

// Storage exports and helpers
const storage = getStorage(app);

async function uploadFile(path, file) {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}

async function deleteFile(path) {
  const storageRef = ref(storage, path);
  try {
    await deleteObject(storageRef);
  } catch (error) {
    console.warn("Failed to delete file:", error);
  }
}

// Cloud Messaging (Push Notifications)
const messaging = getMessaging(app);

async function getMessagingToken(vapidKey) {
  try {
    return await getToken(messaging, { vapidKey });
  } catch (error) {
    console.error("Error getting FCM token:", error);
  }
}

function onMessageListener(callback) {
  onMessage(messaging, callback);
}

// Exported APIs
export {
  app,
  auth,
  db,
  storage,
  messaging,

  loginWithEmail,
  registerWithEmail,
  signOutUser,
  signInWithGoogle,
  sendPasswordReset,

  getCollectionRef,
  getDocumentRef,
  getDocument,
  setDocument,
  updateDocument,
  deleteDocument,
  queryCollection,
  listenToCollection,
  listenToDocument,
  createBatch,

  uploadFile,
  deleteFile,

  getMessagingToken,
  onMessageListener,
};
