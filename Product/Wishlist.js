// src/components/Product/Wishlist.js

import {
  getUserWishlist,
  addToWishlist,
  removeFromWishlist,
  shareWishlist,
  logAction,
} from '../../services/wishlistService.js';

import { getProductById } from '../../services/productService.js';
import { renderRatingStars } from '../../utils/uiHelpers.js';

export default class Wishlist {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.wishlist = new Map(); // productId -> product details
    this.init();
  }

  async init() {
    logAction('Wishlist component initialized');
    const productIds = await getUserWishlist();
    await this.loadWishlistDetails(productIds);
    this.render();
    this.attachEvents();
  }

  async loadWishlistDetails(productIds) {
    this.wishlist.clear();
    for (const id of productIds) {
      const product = await getProductById(id);
      if (product) this.wishlist.set(id, product);
    }
  }

  attachEvents() {
    this.container.addEventListener('click', async (e) => {
      const target = e.target;
      if (target.classList.contains('remove-wishlist-btn')) {
        const pid = target.dataset.productid;
        await removeFromWishlist(pid);
        this.wishlist.delete(pid);
        this.render();
        logAction('Removed product from wishlist', { productId: pid });
      } else if (target.id === 'shareWishlistBtn') {
        const shareSuccess = await shareWishlist([...this.wishlist.keys()]);
        if (shareSuccess) alert('Wishlist link copied to clipboard!');
        else alert('Failed to generate share link.');
        logAction('Wishlist shared');
      } else if (target.classList.contains('move-to-cart-btn')) {
        const pid = target.dataset.productid;
        // Assuming addToCart is available globally or imported
        await addToCart(pid);
        await removeFromWishlist(pid);
        this.wishlist.delete(pid);
        this.render();
        alert('Product moved to cart!');
        logAction('Moved product from wishlist to cart', { productId: pid });
      }
    });
  }

  render() {
    if (this.wishlist.size === 0) {
      this.container.innerHTML = '<p>Your wishlist is empty.</p>';
      return;
    }

    const productCards = [...this.wishlist.values()].map(product => {
      const discountBadge = product.discount ? `<div class="discount-badge">${product.discount}% OFF</div>` : '';
      const ratingStars = renderRatingStars(product.avgRating || 0);

      return `
        <div class="wishlist-product-card">
          <img src="${product.imageURL}" alt="${product.name}" class="wishlist-product-image" />
          ${discountBadge}
          <h3>${product.name}</h3>
          <p>Price: ₹${product.price.toFixed(2)}</p>
          <p>Brand: ${product.brand || 'N/A'}</p>
          <div class="rating">${ratingStars} (${product.reviewsCount || 0} reviews)</div>
          <button class="move-to-cart-btn" data-productid="${product.id}">Move to Cart</button>
          <button class="remove-wishlist-btn" data-productid="${product.id}">Remove</button>
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="wishlist-container">
        ${productCards}
        <div class="wishlist-footer">
          <button id="shareWishlistBtn">Share Wishlist</button>
        </div>
      </div>
    `;
  }
}
