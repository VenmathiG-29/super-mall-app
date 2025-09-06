// src/components/Offer/OfferList.js

import {
  getAllOffers,
  redeemOffer,
  logAction,
  shareOffer,
  filterOffersByCategory,
  filterOffersByShop,
  filterOffersByExpiry,
} from '../../services/offerService.js';

export default class OfferList {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.offers = [];
    this.filters = {
      category: null,
      shopId: null,
      validOnly: true,
      minDiscount: 0,
    };
    this.searchTerm = '';
    this.sortOrder = 'expiryAsc'; // expiryAsc, discountDesc, newest
    this.pageSize = 20;
    this.currentPage = 0;
    this.loading = false;
    this.endReached = false;
    this.init();
  }

  async init() {
    this.offers = await getAllOffers();
    this.applyFiltersAndRender(true);
    this.attachEvents();

    window.addEventListener('scroll', () => {
      if (this.loading || this.endReached) return;
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
        this.loadNextPage();
      }
    });
  }

  attachEvents() {
    // Search input
    const searchInput = document.getElementById('offerSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value.toLowerCase();
        this.resetPagination();
        this.applyFiltersAndRender(true);
        logAction('Offer search', { term: this.searchTerm });
      });
    }

    // Filter and sort controls can similarly be wired here (not shown for brevity)
  }

  resetPagination() {
    this.currentPage = 0;
    this.endReached = false;
    this.container.innerHTML = '';
  }

  loadNextPage() {
    this.loading = true;
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    const nextPageOffers = this.filteredOffers.slice(start, end);
    if (!nextPageOffers.length) {
      this.endReached = true;
      this.loading = false;
      return;
    }
    this.render(nextPageOffers);
    this.currentPage++;
    this.loading = false;
  }

  applyFiltersAndRender(reset = false) {
    let filtered = this.offers;

    if (this.filters.category) {
      filtered = filterOffersByCategory(filtered, this.filters.category);
    }
    if (this.filters.shopId) {
      filtered = filterOffersByShop(filtered, this.filters.shopId);
    }
    if (this.filters.validOnly) {
      filtered = filterOffersByExpiry(filtered, new Date());
    }
    if (this.filters.minDiscount) {
      filtered = filtered.filter((o) => o.discount >= this.filters.minDiscount);
    }
    if (this.searchTerm) {
      filtered = filtered.filter(
        (o) =>
          o.title.toLowerCase().includes(this.searchTerm) ||
          (o.description && o.description.toLowerCase().includes(this.searchTerm))
      );
    }

    // Sorting
    switch (this.sortOrder) {
      case 'expiryAsc':
        filtered.sort((a, b) => new Date(a.expiry) - new Date(b.expiry));
        break;
      case 'discountDesc':
        filtered.sort((a, b) => b.discount - a.discount);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    if (reset) {
      this.filteredOffers = filtered;
      this.resetPagination();
      this.loadNextPage();
    } else {
      this.render(filtered);
    }
  }

  render(offers) {
    if (!offers.length && this.container.innerHTML === '') {
      this.container.innerHTML = '<p>No offers match your criteria.</p>';
      return;
    }

    offers.forEach((offer) => {
      const expired = new Date(offer.expiry) < new Date();
      const offerCard = document.createElement('div');
      offerCard.className = `offer-card ${expired ? 'expired' : ''}`;
      offerCard.innerHTML = `
        <h3>${offer.title}</h3>
        <p class="offer-description">${offer.description || ''}</p>
        <p>Discount: <strong>${offer.discount}%</strong></p>
        <p>Valid until: <time datetime="${offer.expiry}">${new Date(offer.expiry).toLocaleDateString()}</time></p>
        <button class="redeem-offer-btn" data-offerid="${offer.id}" ${expired ? 'disabled' : ''}>Redeem</button>
        <button class="share-offer-btn" data-offerid="${offer.id}">Share</button>
      `;
      this.container.appendChild(offerCard);
    });

    this.container.querySelectorAll('.redeem-offer-btn').forEach((btn) => {
      btn.onclick = async (e) => {
        const offerId = e.target.dataset.offerid;
        try {
          await redeemOffer(offerId);
          alert('Offer redeemed! Check your cart for discounted items.');
          logAction('Offer redeemed', { offerId });
        } catch (err) {
          alert('Failed to redeem offer: ' + err.message);
          logAction('Offer redeem failed', { offerId, error: err.message });
        }
      };
    });

    this.container.querySelectorAll('.share-offer-btn').forEach((btn) => {
      btn.onclick = (e) => {
        const offerId = e.target.dataset.offerid;
        shareOffer(offerId).then(() => {
          alert('Offer link copied to clipboard!');
          logAction('Offer shared', { offerId });
        });
      };
    });
  }
}
