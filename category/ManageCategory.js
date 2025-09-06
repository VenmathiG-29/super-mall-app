// src/components/Category/ManageCategory.js

import {
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  logAction,
} from '../../services/categoryService.js';

export default class ManageCategory {
  constructor(formId) {
    this.form = document.getElementById(formId);
    this.currentCategoryId = null;
    this.init();
  }

  async loadCategory(categoryId) {
    this.currentCategoryId = categoryId;
    if (!categoryId) {
      this.resetForm();
      return;
    }
    try {
      const category = await getCategoryById(categoryId);
      if (!category) throw new Error('Category not found');
      this.form.elements['categoryName'].value = category.name;
      this.form.elements['categoryDescription'].value = category.description || '';
      logAction('Loaded category for editing', { categoryId });
    } catch (error) {
      alert("Error loading category");
      logAction('Error loading category', { error: error.message });
    }
  }

  init() {
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = this.form.elements['categoryName'].value.trim();
      const description = this.form.elements['categoryDescription'].value.trim();

      if (!name) {
        alert('Category name is required');
        return;
      }

      try {
        if (this.currentCategoryId) {
          await updateCategory(this.currentCategoryId, { name, description });
          logAction('Category updated', { categoryId: this.currentCategoryId });
        } else {
          const createdCategory = await createCategory({ name, description });
          this.currentCategoryId = createdCategory.id;
          logAction('Category created', { categoryId: this.currentCategoryId });
        }
        alert('Category saved successfully');
      } catch (error) {
        alert('Error saving category: ' + error.message);
        logAction('Error saving category', { error: error.message });
      }
    });
  }

  resetForm() {
    this.currentCategoryId = null;
    this.form.reset();
  }

  async deleteCategory() {
    if (!this.currentCategoryId) {
      alert("No category selected to delete");
      return;
    }
    if (confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
      try {
        await deleteCategory(this.currentCategoryId);
        logAction('Deleted category', { categoryId: this.currentCategoryId });
        this.resetForm();
        alert('Category deleted successfully');
      } catch (error) {
        alert('Error deleting category: ' + error.message);
        logAction('Error deleting category', { error: error.message });
      }
    }
  }
}
