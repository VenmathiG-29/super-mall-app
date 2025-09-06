// src/components/Shop/ShopDetails.js

import {
  getShopById,
  getShopOffers,
  getShopProducts,
  logAction,
  addToCart,
  addToWishlist,
  removeFromWishlist,
  isProductWishlisted
} from "../../services/shopService.js";

import { renderRatingStars } from "../../utils/uiHelpers.js";

export default class ShopDetails {
  constructor(containerId, shopId) {
    this.container = document.getElementById(containerId);
    this.shopId = shopId;
    this.shop = null;
    this.products = [];
    this.activeProduct = null;
    this.userWishlist = new Set(); // Products wishlisted by user
    this.init();
  }

  async init() {
    logAction("ShopDetails component initialized", { shopId: this.shopId });
    this.shop = await getShopById(this.shopId);
    this.products = await getShopProducts(this.shopId);
    // Fetch user's wishlist to mark products
    this.userWishlist = new Set(await isProductWishlisted(this.products.map(p => p.id)));

    this.activeProduct = this.products.length ? this.products[0] : null;
    this.render();
    this.attachEvents();
  }

  render() {
    if (!this.shop) {
      this.container.innerHTML = "<p>Shop details not found.</p>";
      return;
    }

    // Shop main info
    const shopInfo = `
      <section class="shop-info">
        <h2>${this.shop.name}</h2>
        <p>${this.shop.description || "No description available."}</p>
        <p>Category: ${this.shop.category.name}</p>
        <p>Location: ${this.shop.location || "N/A"}</p>
        <p>Status: <strong>${this.shop.isOpen ? "Open" : "Closed"}</strong></p>
        <div class="shop-offers">${this.renderOffers()}</div>
        <button id="backToListBtn">Back to Shop List</button>
      </section>
    `;

    // Product viewer + selector
    const productListHtml = this.products.map(product => {
      const wishlisted = this.userWishlist.has(product.id);
      return `
        <div class="product-summary" data-productid="${product.id}">
          <img src="${product.imageURL}" alt="${product.name}" class="product-thumb" />
          <h3>${product.name}</h3>
          <p>${product.shortDescription}</p>
          <p>Price: ₹${product.price.toFixed(2)}</p>
          <button class="wishlist-btn" data-productid="${product.id}">
            ${wishlisted ? "💖 Remove from Wishlist" : "🤍 Add to Wishlist"}
          </button>
          <button class="view-product-btn" data-productid="${product.id}">View Details</button>
        </div>
      `;
    }).join("");

    const productViewer = this.activeProduct ? this.renderProductDetails(this.activeProduct) : "<p>No products available</p>";

    this.container.innerHTML = `
      ${shopInfo}
      <section class="products-list">${productListHtml}</section>
      <section class="product-viewer">${productViewer}</section>
    `;
  }

  renderOffers() {
    const offers = getShopOffers(this.shopId) || [];
    if (!offers.length) return "<p>No current offers</p>";
    return `
      <h3>Current Offers</h3>
      <ul>
        ${offers.map(offer => `<li>${offer.title}: ${offer.description}</li>`).join('')}
      </ul>
    `;
  }

  renderProductDetails(product) {
    const wishlisted = this.userWishlist.has(product.id);
    const ratingAvg = product.rating ? product.rating.toFixed(1) : "N/A";
    const ratingStars = renderRatingStars(product.rating || 0);
    return `
      <h2>${product.name}</h2>
      <img src="${product.imageURL}" alt="${product.name}" class="product-image" />
      <p>${product.description}</p>
      <p>Price: ₹${product.price.toFixed(2)}</p>
      <p>Availability: ${product.inStock ? "In Stock" : "Out of Stock"}</p>
      <div class="product-rating" aria-label="Rating: ${ratingAvg} out of 5 stars">${ratingStars} (${product.reviewsCount || 0} reviews)</div>
      <button id="addToCartBtn" ${product.inStock ? "" : "disabled"}>Add to Cart</button>
      <button class="wishlist-btn" data-productid="${product.id}">
        ${wishlisted ? "💖 Remove from Wishlist" : "🤍 Add to Wishlist"}
      </button>
      <section class="product-variants">
        ${this.renderVariants(product)}
      </section>
      <section class="related-products">
        ${this.renderRelatedProducts(product.relatedProductIds)}
      </section>
    `;
  }

  renderVariants(product) {
    if (!product.variants || product.variants.length === 0) return "";
    return `
      <h4>Available Options</h4>
      <select id="variantSelect">
        ${product.variants.map(variant => `<option value="${variant.id}">${variant.name} - ₹${variant.price.toFixed(2)}</option>`).join("")}
      </select>
    `;
  }

  renderRelatedProducts(relatedProductIds = []) {
    if (relatedProductIds.length === 0) return "";
    // For demo, just list IDs; in actual app fetch and render related products
    return `
      <h4>Related Products</h4>
      <ul>
        ${relatedProductIds.map(pid => `<li>Product #${pid}</li>`).join('')}
      </ul>
    `;
  }

  attachEvents() {
    // Back button to shop list (app-specific SPA nav)
    const backBtn = this.container.querySelector("#backToListBtn");
    if (backBtn) {
      backBtn.onclick = () => {
        // Custom routing/navigation code here
        logAction("Back to shop list clicked", { shopId: this.shopId });
      }
    }

    // Product wishlist buttons (dynamic event delegation)
    this.container.querySelectorAll(".wishlist-btn").forEach(btn => {
      btn.onclick = async (e) => {
        const productId = e.target.dataset.productid;
        if (this.userWishlist.has(productId)) {
          await removeFromWishlist(productId);
          this.userWishlist.delete(productId);
          logAction("Removed product from wishlist", { productId });
        } else {
          await addToWishlist(productId);
          this.userWishlist.add(productId);
          logAction("Added product to wishlist", { productId });
        }
        this.render(); // re-render to update UI state
      };
    });

    // View product details buttons
    this.container.querySelectorAll(".view-product-btn").forEach(btn => {
      btn.onclick = (e) => {
        const productId = e.target.dataset.productid;
        const product = this.products.find(p => p.id === productId);
        if (product) {
          this.activeProduct = product;
          this.render();
          logAction("Viewed product details", { productId });
        }
      };
    });

    // Add to cart button
    const addToCartBtn = this.container.querySelector("#addToCartBtn");
    if (addToCartBtn) {
      addToCartBtn.onclick = async () => {
        if (this.activeProduct && this.activeProduct.inStock) {
          await addToCart(this.activeProduct.id);
          logAction("Added product to cart", { productId: this.activeProduct.id });
          alert("Product added to cart!");
        }
      };
    }

    // Variant selector change
    const variantSelect = this.container.querySelector("#variantSelect");
    if (variantSelect) {
      variantSelect.onchange = (e) => {
        // Update UI and pricing based on variant selected
        // Implementation depends on your data model
        logAction("Variant selected", { selectedVariantId: e.target.value });
      };
    }
  }
}
