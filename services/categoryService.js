// src/services/categoryService.js

import { firestore } from '../firebase.js';
import { logAction } from '../utils/logger.js';

const categoriesCollection = firestore.collection('categories');

export async function getAllCategories() {
  try {
    const snapshot = await categoriesCollection.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    logAction('Error fetching categories', { error });
    throw error;
  }
}

export async function getCategoryById(categoryId) {
  try {
    const doc = await categoriesCollection.doc(categoryId).get();
    if (!doc.exists) throw new Error('Category not found');
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    logAction('Error fetching category by ID', { categoryId, error });
    throw error;
  }
}

export async function createCategory(data) {
  try {
    const docRef = await categoriesCollection.add(data);
    logAction('Created category', { id: docRef.id });
    return { id: docRef.id, ...data };
  } catch (error) {
    logAction('Error creating category', { error });
    throw error;
  }
}

export async function updateCategory(id, data) {
  try {
    await categoriesCollection.doc(id).update(data);
    logAction('Updated category', { id });
  } catch (error) {
    logAction('Error updating category', { id, error });
    throw error;
  }
}

export async function deleteCategory(id) {
  try {
    await categoriesCollection.doc(id).delete();
    logAction('Deleted category', { id });
  } catch (error) {
    logAction('Error deleting category', { id, error });
    throw error;
  }
}
