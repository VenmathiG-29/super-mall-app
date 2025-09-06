// src/components/Shop/ShopList.js

import {
  getAllShops,
  getShopOffers,
  setShopFavorite,
  getShopInventoryStatus,
  getShopReviews,
  logAction,
} from '../../services/shopService.js';
import {
  getUserWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../../services/wishlistService.js';
import { getUserLocation, onLocationChange } from '../../services/locationService.js';
import {
  filterShops,
  sortShopsByRating,
  sortShopsByDistance,
  filterByMultipleCategories
} from '../../utils/filterHelpers.js';

export default class ShopList {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.shops = [];
    this.filteredShops = [];
    this.filters = {
      categories: [],
      location: null,
      openNow: false,
      hasOffers: false,
      minRating: 0,
    };
    this.sortOrder = 'rating';
    this.searchTerm = '';
    this.userLocation = null;
    this.currentPage = 0;
    this.pageSize = 20;
    this.loading = false;
    this.endReached = false;
    this.userWishlist = new Set();
    this.init();
  }

  async init() {
    logAction('ShopList component initialized');
    this.userLocation = await getUserLocation();
    onLocationChange(async (newLocation) => {
      this.userLocation = newLocation;
      this.applyFiltersAndRender();
    });
    this.shops = await getAllShops();
    this.userWishlist = new Set(await getUserWishlist());
    this.loadFiltersFromStorage();
    this.attachEvents();
    this.applyFiltersAndRender(true);

    window.addEventListener('scroll', () => {
      if (this.loading || this.endReached) return;
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
        this.loadNextPage();
      }
    });
  }

  attachEvents() {
    document.getElementById('searchInput').addEventListener('input', (e) => {
      this.searchTerm = e.target.value;
      this.resetPagination();
      this.applyFiltersAndRender(true);
      this.saveFiltersToStorage();
      logAction('Shop search', { term: this.searchTerm });
    });
    document.getElementById('categoryFilter').addEventListener('change', (e) => {
      const selectedOptions = [...e.target.selectedOptions].map(opt => opt.value);
      this.filters.categories = selectedOptions.length ? selectedOptions : [];
      this.resetPagination();
      this.applyFiltersAndRender(true);
      this.saveFiltersToStorage();
      logAction('Shop category filter', { categories: this.filters.categories });
    });
    document.getElementById('locationFilter').addEventListener('change', (e) => {
      this.filters.location = e.target.value;
      this.resetPagination();
      this.applyFiltersAndRender(true);
      this.saveFiltersToStorage();
      logAction('Shop location filter', { location: this.filters.location });
    });
    document.getElementById('openNowFilter').addEventListener('change', (e) => {
      this.filters.openNow = e.target.checked;
      this.resetPagination();
      this.applyFiltersAndRender(true);
      this.saveFiltersToStorage();
      logAction('Shop openNow filter', { openNow: this.filters.openNow });
    });
    document.getElementById('offersFilter').addEventListener('change', (e) => {
      this.filters.hasOffers = e.target.checked;
      this.resetPagination();
      this.applyFiltersAndRender(true);
      this.saveFiltersToStorage();
      logAction('Shop offers filter', { hasOffers: this.filters.hasOffers });
    });
    document.getElementById('sortOrder').addEventListener('change', (e) => {
      this.sortOrder = e.target.value;
      this.resetPagination();
      this.applyFiltersAndRender(true);
      this.saveFiltersToStorage();
      logAction('Shop sort order changed', { sortOrder: this.sortOrder });
    });
  }

  saveFiltersToStorage() {
    const data = {
      filters: this.filters,
      sortOrder: this.sortOrder,
      searchTerm: this.searchTerm
    };
    localStorage.setItem('supermall-shop-filters', JSON.stringify(data));
  }

  loadFiltersFromStorage() {
    const data = JSON.parse(localStorage.getItem('supermall-shop-filters'));
    if (data) {
      this.filters = data.filters || this.filters;
      this.sortOrder = data.sortOrder || this.sortOrder;
      this.searchTerm = data.searchTerm || this.searchTerm;
      // Reflect in UI if needed
    }
  }

  resetPagination() {
    this.currentPage = 0;
    this.endReached = false;
    this.filteredShops = [];
    this.container.innerHTML = '';
  }

  async loadNextPage() {
    this.loading = true;
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    const nextPageShops = this.filteredShops.slice(start, end);
    if (!nextPageShops.length) {
      this.endReached = true;
      this.loading = false;
      return;
    }
    await this.render(nextPageShops);
    this.currentPage++;
    this.loading = false;
  }

  applyFiltersAndRender(reset = false) {
    let filtered = filterShops(this.shops, this.filters);
    if (this.filters.categories.length) {
      filtered = filterByMultipleCategories(filtered, this.filters.categories);
    }
    if (this.searchTerm) {
      filtered = searchShops(filtered, this.searchTerm);
    }
    if (this.sortOrder === 'distance' && this.userLocation) {
      filtered = sortShopsByDistance(filtered, this.userLocation);
    } else if (this.sortOrder === 'rating') {
      filtered = sortShopsByRating(filtered);
    }
    if (reset) {
      this.filteredShops = filtered;
      this.resetPagination();
      this.loadNextPage();
    } else {
      this.render(filtered);
    }
  }

  async render(shopArray) {
    if (!shopArray.length && this.container.innerHTML === '') {
      this.container.innerHTML = '<p>No shops found matching your criteria.</p>';
      return;
    }
    for (const shop of shopArray) {
      const isFavorite = shop.favorite;
      const offers = getShopOffers(shop.id);
      const inventoryStatus = await getShopInventoryStatus(shop.id);
      const reviews = await getShopReviews(shop.id);
      const avgRating = reviews.length ? (reviews.reduce((a,b) => a + b.rating, 0) / reviews.length).toFixed(1) : 'N/A';
      const totalReviews = reviews.length;
      const status = shop.isOpen ? 'Open' : 'Closed';
      const distance = shop.distance ? `${shop.distance.toFixed(1)} km` : 'N/A';
      const ratingStars = this.renderRatingStars(avgRating);

      // Render products for wishlist
      let productListHtml = '';
      if (shop.products && shop.products.length) {
        productListHtml = '<ul>';
        for (const product of shop.products) {
          const wishlisted = this.userWishlist.has(product.id);
          productListHtml += `
            <li>
              ${product.name}
              <button class="wishlist-btn" data-productid="${product.id}">
                ${wishlisted ? '💖 Remove from Wishlist' : '🤍 Add to Wishlist'}
              </button>
            </li>`;
        }
        productListHtml += '</ul>';
      }

      const shopCard = document.createElement('div');
      shopCard.className = 'shop-card';
      shopCard.setAttribute('aria-label', `Shop: ${shop.name}, status: ${status}`);
      shopCard.innerHTML = `
        <h3>${shop.name} <span class="shop-status">${status}</span></h3>
        <p>${shop.category.name} | ${distance}</p>
        <p aria-live="polite" class="inventory-status">
          Inventory: ${inventoryStatus ? 'Available' : 'Out of stock'}
        </p>
        <div class="shop-rating" aria-label="Rating ${avgRating} out of 5 stars">${ratingStars} <small>(${totalReviews} reviews)</small></div>
        <button class="favorite-btn" data-shopid="${shop.id}" aria-pressed="${isFavorite}">${isFavorite ? '★' : '☆'} Favorite</button>
        ${offers.length ? `<div class="shop-offers"><strong>Offers:</strong> ${offers.map(o => o.title).join(', ')}</div>` : ''}
        <button class="view-details-btn" data-shopid="${shop.id}">View Details</button>
        ${productListHtml}
      `;
      this.container.appendChild(shopCard);
    }

    // Shop favorites
    this.container.querySelectorAll('.favorite-btn').forEach(btn => {
      btn.onclick = async (e) => {
        const shopId = e.target.dataset.shopid;
        await setShopFavorite(shopId);
        logAction('Toggled shop favorite', { shopId });
        this.applyFiltersAndRender(true);
      };
    });

    // Product wishlist
    this.container.querySelectorAll('.wishlist-btn').forEach(btn => {
      btn.onclick = async (e) => {
        const productId = e.target.dataset.productid;
        const isWished = this.userWishlist.has(productId);
        if (isWished) {
          await removeFromWishlist(productId);
          logAction('Removed from wishlist', { productId });
          this.userWishlist.delete(productId);
        } else {
          await addToWishlist(productId);
          logAction('Added to wishlist', { productId });
          this.userWishlist.add(productId);
        }
        this.applyFiltersAndRender(true);
      };
    });

    this.container.querySelectorAll('.view-details-btn').forEach(btn => {
      btn.onclick = (e) => {
        const shopId = e.target.dataset.shopid;
        logAction('View shop details', { shopId });
        // SPA navigation etc.
      };
    });
  }

  renderRatingStars(rating) {
    const filledStars = Math.round(rating);
    return Array(5).fill(0).map((_, i) =>
      `<span class="star${i < filledStars ? ' filled' : ''}" aria-hidden="true">${i < filledStars ? '★' : '☆'}</span>`
    ).join('');
  }
}
