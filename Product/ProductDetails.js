// src/components/Product/ProductDetails.js

import {
  getProductById,
  getProductReviews,
  addToCart,
  addToWishlist,
  removeFromWishlist,
  isProductWishlisted,
  logAction,
  getRelatedProducts,
  subscribeStockAlerts,
} from "../../services/productService.js";

import { renderRatingStars } from "../../utils/uiHelpers.js";

export default class ProductDetails {
  constructor(containerId, productId) {
    this.container = document.getElementById(containerId);
    this.productId = productId;
    this.product = null;
    this.reviews = [];
    this.relatedProducts = [];
    this.userWishlisted = false;
    this.init();
  }

  async init() {
    this.product = await getProductById(this.productId);
    if (!this.product) {
      this.container.innerHTML = "<p>Product not found.</p>";
      return;
    }

    this.reviews = await getProductReviews(this.productId);
    this.relatedProducts = await getRelatedProducts(this.productId);
    this.userWishlisted = await isProductWishlisted([this.productId]).then((res) => res.has(this.productId));

    this.render();
    this.attachEvents();
  }

  render() {
    const ratingAvg = this.reviews.length
      ? (this.reviews.reduce((a, b) => a + b.rating, 0) / this.reviews.length).toFixed(1)
      : "N/A";

    const ratingStars = renderRatingStars(ratingAvg);
    const stockStatus = this.product.inStock ? "In Stock" : "Out of Stock";

    let imagesCarouselHtml = "";
    if (this.product.images && this.product.images.length) {
      imagesCarouselHtml = this.product.images.map((imgUrl, idx) => `
        <img src="${imgUrl}" alt="${this.product.name} image ${idx + 1}" class="product-image-slide ${idx === 0 ? 'active' : ''}" />
      `).join("");
    }

    const wishlistBtnLabel = this.userWishlisted ? "💖 Remove from Wishlist" : "🤍 Add to Wishlist";

    this.container.innerHTML = `
      <div class="product-details">
        <div class="images-carousel">${imagesCarouselHtml}</div>
        <div class="product-info">
          <h2>${this.product.name}</h2>
          <p class="brand">Brand: ${this.product.brand || "N/A"}</p>
          <div class="rating" aria-label="Rating ${ratingAvg} out of 5 stars">${ratingStars} (${this.reviews.length} reviews)</div>
          <p class="price">Price: ₹${this.product.price.toFixed(2)}</p>
          ${this.product.discount ? `<p class="discount">Discount: ${this.product.discount}% Off</p>` : ""}
          <p class="stock-status">${stockStatus}</p>
          <p class="description">${this.product.description || "No description available."}</p>
          <div class="variants">${this.renderVariants()}</div>
          <button id="addToCartBtn" ${this.product.inStock ? '' : 'disabled'}>Add to Cart</button>
          <button id="wishlistToggleBtn">${wishlistBtnLabel}</button>
          <button id="subscribeStockBtn" ${this.product.inStock ? 'disabled' : ''}>Notify me when in stock</button>
          <section class="reviews-section">${this.renderReviews()}</section>
          <section class="related-products-section">${this.renderRelatedProducts()}</section>
        </div>
      </div>
    `;
  }

  renderVariants() {
    if (!this.product.variants || this.product.variants.length === 0) return "";
    return `
      <label for="variantSelect">Variants:</label>
      <select id="variantSelect">
        ${this.product.variants
          .map(
            (v) =>
              `<option value="${v.id}" ${v.id === this.product.selectedVariantId ? "selected" : ""}>
                ${v.name} - ₹${v.price.toFixed(2)}
              </option>`
          )
          .join("")}
      </select>
    `;
  }

  renderReviews() {
    if (!this.reviews.length) return "<p>No reviews available.</p>";

    return `
      <h3>Customer Reviews</h3>
      <ul class="reviews-list">
        ${this.reviews
          .map(
            (r) => `
          <li>
            <strong>${r.userName}</strong> - <em>${r.date}</em>
            <div class="review-rating">${renderRatingStars(r.rating)}</div>
            <p>${r.comment}</p>
          </li>
      `
          )
          .join("")}
      </ul>
    `;
  }

  renderRelatedProducts() {
    if (!this.relatedProducts.length) return "";

    return `
      <h3>Related Products</h3>
      <ul class="related-products-list">
        ${this.relatedProducts
          .map(
            (p) =>
              `<li>
                <img src="${p.imageURL}" alt="${p.name}" />
                <p>${p.name}</p>
                <p>₹${p.price.toFixed(2)}</p>
              </li>`
          )
          .join("")}
      </ul>
    `;
  }

  attachEvents() {
    const addToCartBtn = this.container.querySelector("#addToCartBtn");
    if (addToCartBtn) {
      addToCartBtn.onclick = async () => {
        await addToCart(this.product.id);
        logAction("Add to cart clicked", { productId: this.product.id });
        alert("Product added to cart!");
      };
    }

    const wishlistToggleBtn = this.container.querySelector("#wishlistToggleBtn");
    if (wishlistToggleBtn) {
      wishlistToggleBtn.onclick = async () => {
        if (this.userWishlisted) {
          await removeFromWishlist(this.product.id);
          this.userWishlisted = false;
          alert("Removed from wishlist");
          logAction("Removed from wishlist", { productId: this.product.id });
        } else {
          await addToWishlist(this.product.id);
          this.userWishlisted = true;
          alert("Added to wishlist");
          logAction("Added to wishlist", { productId: this.product.id });
        }
        this.render();
      };
    }

    const subscribeStockBtn = this.container.querySelector("#subscribeStockBtn");
    if (subscribeStockBtn) {
      subscribeStockBtn.onclick = async () => {
        await subscribeStockAlerts(this.product.id);
        alert("You will be notified when the product is back in stock.");
        logAction("Subscribed to stock alerts", { productId: this.product.id });
      };
    }

    const variantSelect = this.container.querySelector("#variantSelect");
    if (variantSelect) {
      variantSelect.onchange = (e) => {
        const selectedId = e.target.value;
        // Update product variant
        this.product.selectedVariantId = selectedId;
        // Optionally refresh pricing and images here
        logAction("Variant selected", { variantId: selectedId, productId: this.product.id });
      };
    }

    const imageSlides = this.container.querySelectorAll(".product-image-slide");
    imageSlides.forEach((img, idx) => {
      img.onclick = () => {
        // Swap active image
        this.container.querySelectorAll(".product-image-slide.active").forEach((el) => el.classList.remove("active"));
        img.classList.add("active");
        logAction("Image viewed", { productId: this.product.id, imageIndex: idx });
      };
    });
  }
}
