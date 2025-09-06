// src/components/Product/ProductList.js

import {
  getAllProducts,
  addToCart,
  addToWishlist,
  removeFromWishlist,
  isProductWishlisted,
  getProductReviews,
  logAction,
} from "../../services/productService.js";

import {
  filterProducts,
  sortProductsByPrice,
  sortProductsByRating,
  searchProducts,
} from "../../utils/filterHelpers.js";

import { renderRatingStars } from "../../utils/uiHelpers.js";

export default class ProductList {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.products = [];
    this.filteredProducts = [];
    this.filters = {
      category: null,
      priceRange: [0, Infinity],
      availability: true,
      ratingMin: 0,
      brand: null,
      discountOnly: false,
    };
    this.sortOrder = "relevance"; // relevance, priceAsc, priceDesc, rating
    this.searchTerm = "";
    this.pageSize = 24;
    this.currentPage = 0;
    this.loading = false;
    this.endReached = false;
    this.userWishlist = new Set();
    this.init();
  }

  async init() {
    logAction("ProductList initialized");
    this.products = await getAllProducts();
    this.userWishlist = new Set(await isProductWishlisted(this.products.map((p) => p.id)));

    this.attachEvents();
    this.applyFiltersAndRender(true);

    window.addEventListener("scroll", () => {
      if (this.loading || this.endReached) return;
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 200
      ) {
        this.loadNextPage();
      }
    });
  }

  attachEvents() {
    const searchInput = document.getElementById("productSearchInput");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchTerm = e.target.value;
        this.resetPagination();
        this.applyFiltersAndRender(true);
        logAction("Product search", { term: this.searchTerm });
      });
    }

    // You can also attach filter controls here; omitted for brevity
  }

  resetPagination() {
    this.currentPage = 0;
    this.endReached = false;
    this.filteredProducts = [];
    this.container.innerHTML = "";
  }

  applyFiltersAndRender(reset = false) {
    let filtered = filterProducts(this.products, this.filters);
    if (this.searchTerm) {
      filtered = searchProducts(filtered, this.searchTerm);
    }

    switch (this.sortOrder) {
      case "priceAsc":
        filtered = sortProductsByPrice(filtered, true);
        break;
      case "priceDesc":
        filtered = sortProductsByPrice(filtered, false);
        break;
      case "rating":
        filtered = sortProductsByRating(filtered);
        break;
      default:
        // relevance or no sort
        break;
    }

    if (reset) {
      this.filteredProducts = filtered;
      this.resetPagination();
      this.loadNextPage();
    } else {
      this.render(filtered);
    }
  }

  loadNextPage() {
    this.loading = true;
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    const nextPageItems = this.filteredProducts.slice(start, end);
    if (!nextPageItems.length) {
      this.endReached = true;
      this.loading = false;
      return;
    }

    this.render(nextPageItems);
    this.currentPage++;
    this.loading = false;
  }

  render(productArray) {
    if (!productArray.length && this.container.innerHTML === "") {
      this.container.innerHTML = "<p>No products found.</p>";
      return;
    }

    productArray.forEach((product) => {
      const wishlisted = this.userWishlist.has(product.id);
      const ratingStars = renderRatingStars(product.avgRating || 0);
      const discountTag =
        product.discount && product.discount > 0
          ? `<div class="discount-tag">${product.discount}% OFF</div>`
          : "";

      const productCard = document.createElement("div");
      productCard.className = "product-card";
      productCard.setAttribute(
        "aria-label",
        `${product.name}, Price ₹${product.price.toFixed(2)}, ${
          product.inStock ? "In stock" : "Out of Stock"
        }`
      );

      productCard.innerHTML = `
        <div class="product-image-container">
          <img src="${product.imageURL}" alt="${product.name}" />
          ${discountTag}
        </div>
        <h3 class="product-title">${product.name}</h3>
        <p class="product-brand">${product.brand || ""}</p>
        <p class="product-price">₹${product.price.toFixed(2)} ${
        product.pricePerUnit ? `(${product.pricePerUnit} per unit)` : ""
      }</p>
        <div class="product-rating" aria-label="Rating: ${
          product.avgRating || 0
        } out of 5 stars">${ratingStars} (${
        product.reviewsCount || 0
      } reviews)</div>
        <button class="add-to-cart-btn" ${
          product.inStock ? "" : "disabled"
        }>Add to Cart</button>
        <button class="wishlist-toggle-btn" data-id="${product.id}">
          ${wishlisted ? "💖" : "🤍"} Wishlist
        </button>
      `;

      this.container.appendChild(productCard);
    });

    // Add event handlers
    this.container.querySelectorAll(".add-to-cart-btn").forEach((btn, idx) => {
      btn.onclick = async () => {
        const product = productArray[idx];
        if (!product.inStock) return;
        await addToCart(product.id);
        alert(`Added ${product.name} to cart`);
        logAction("Added product to cart", { productId: product.id });
      };
    });

    this.container.querySelectorAll(".wishlist-toggle-btn").forEach((btn) => {
      btn.onclick = async (e) => {
        const productId = e.target.dataset.id;
        const isWishlisted = this.userWishlist.has(productId);

        if (isWishlisted) {
          await removeFromWishlist(productId);
          this.userWishlist.delete(productId);
          logAction("Product removed from wishlist", { productId });
        } else {
          await addToWishlist(productId);
          this.userWishlist.add(productId);
          logAction("Product added to wishlist", { productId });
        }
        this.applyFiltersAndRender(true);
      };
    });
  }
}
