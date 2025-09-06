// src/components/Product/CompareProducts.js

import {
  getProductsByIds,
  logAction,
  addToCart,
  removeFromComparison,
  clearComparison,
  addProductToComparison,
} from '../../services/productService.js';

import { renderRatingStars } from '../../utils/uiHelpers.js';

export default class CompareProducts {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.comparedProductIds = new Set(); // IDs active in comparison
    this.products = [];
    this.maxCompare = 5;
    this.init();
  }

  async init() {
    // Initially load stored comparison from localStorage or empty
    const saved = localStorage.getItem('supermall-compare-products');
    if (saved) {
      this.comparedProductIds = new Set(JSON.parse(saved));
    }
    await this.loadComparedProducts();
    this.render();
    this.attachEvents();
  }

  async loadComparedProducts() {
    if (this.comparedProductIds.size > 0) {
      this.products = await getProductsByIds([...this.comparedProductIds]);
    } else {
      this.products = [];
    }
  }

  attachEvents() {
    // Buttons: remove product from compare, clear all, add product (example placeholders)
    this.container.addEventListener('click', async (e) => {
      if (e.target.classList.contains('remove-compare-btn')) {
        const pid = e.target.dataset.productid;
        this.comparedProductIds.delete(pid);
        await this.saveComparison();
        await this.loadComparedProducts();
        this.render();
        logAction('Removed product from comparison', { productId: pid });
      } else if (e.target.id === 'clearComparisonBtn') {
        this.comparedProductIds.clear();
        await this.saveComparison();
        this.products = [];
        this.render();
        logAction('Cleared all compared products');
      }
    });

    // Example: Listening for adding new products from outside (can also be through another UI component)
    document.addEventListener('addProductToCompare', async (e) => {
      const pid = e.detail.productId;
      if (this.comparedProductIds.size >= this.maxCompare) {
        alert(`You can compare up to ${this.maxCompare} products.`);
        return;
      }
      this.comparedProductIds.add(pid);
      await this.saveComparison();
      await this.loadComparedProducts();
      this.render();
      logAction('Added product to comparison', { productId: pid });
    });
  }

  async saveComparison() {
    localStorage.setItem('supermall-compare-products', JSON.stringify([...this.comparedProductIds]));
  }

  render() {
    if (!this.products.length) {
      this.container.innerHTML = '<p>No products selected for comparison.</p>';
      return;
    }

    // Build comparison table header (product info)
    const headers = this.products
      .map(
        (p) => `
      <th>
        <button class="remove-compare-btn" data-productid="${p.id}" title="Remove ${p.name}">&times;</button>
        <img src="${p.imageURL}" alt="${p.name}" class="compare-product-image"/>
        <p>${p.name}</p>
        <p>₹${p.price.toFixed(2)}</p>
        <button class="add-to-cart-btn" data-productid="${p.id}">Add to Cart</button>
      </th>`
      )
      .join("");

    // Define list of specs/attributes to compare
    const attributes = [
      { key: 'brand', label: 'Brand' },
      { key: 'category', label: 'Category' },
      { key: 'rating', label: 'Rating' },
      { key: 'reviewsCount', label: 'Reviews' },
      { key: 'discount', label: 'Discount' },
      { key: 'availability', label: 'Availability' },
      { key: 'color', label: 'Color' },
      { key: 'weight', label: 'Weight' },
      { key: 'dimensions', label: 'Dimensions' },
      { key: 'warranty', label: 'Warranty' },
      { key: 'material', label: 'Material' },
      // Add more relevant attributes as needed
    ];

    // Build table rows for each attribute with comparison values
    const rows = attributes
      .map(({ key, label }) => {
        const cells = this.products
          .map((p) => {
            let val = p[key];
            if (key === 'rating') {
              val = renderRatingStars(val || 0);
            }
            if (val === undefined || val === null || val === '') val = 'N/A';
            return `<td>${val}</td>`;
          })
          .join("");
        return `<tr><th>${label}</th>${cells}</tr>`;
      })
      .join("");

    this.container.innerHTML = `
      <div class="compare-products-container">
        <table class="compare-products-table" aria-label="Product Comparison Table">
          <thead>
            <tr><th>Feature</th>${headers}</tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <div class="compare-actions">
          <button id="clearComparisonBtn">Clear All</button>
        </div>
      </div>
    `;

    // Wire add-to-cart buttons
    this.container.querySelectorAll('.add-to-cart-btn').forEach((btn) => {
      btn.onclick = async (e) => {
        const pid = e.target.dataset.productid;
        await addToCart(pid);
        alert('Product added to cart.');
        logAction('Added product from compare to cart', { productId: pid });
      };
    });
  }
}
