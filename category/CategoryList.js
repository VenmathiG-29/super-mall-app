// src/components/Category/CategoryList.js

import {
  getAllCategories,
  logAction,
} from '../../services/categoryService.js';

export default class CategoryList {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.categories = [];
    this.searchTerm = '';
    this.init();
  }

  async init() {
    this.categories = await getAllCategories();
    this.render();
    this.attachEvents();
    logAction('CategoryList initialized');
  }

  attachEvents() {
    const searchInput = document.getElementById('categorySearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value.toLowerCase();
        this.render();
      });
    }
  }

  render() {
    const filteredCategories = this.categories.filter(cat =>
      cat.name.toLowerCase().includes(this.searchTerm) ||
      (cat.description && cat.description.toLowerCase().includes(this.searchTerm))
    );

    if (filteredCategories.length === 0) {
      this.container.innerHTML = '<p>No categories found.</p>';
      return;
    }

    const html = filteredCategories.map(cat => `
      <div class="category-card" data-id="${cat.id}">
        <h3>${cat.name}</h3>
        <p>${cat.description || 'No description available'}</p>
        <p>Number of Products: ${cat.productCount || 0}</p>
      </div>
    `).join('');

    this.container.innerHTML = html;
  }
}
