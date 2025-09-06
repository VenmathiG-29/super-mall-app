// src/components/Dashboard/UserDashboard.js

import {
  getUserOrders,
  getUserWishlist,
  getUserProfile,
  logAction,
  cancelOrder,
  reorderProduct,
} from '../../services/userService.js';

export default class UserDashboard {
  constructor(containerId, userId) {
    this.container = document.getElementById(containerId);
    this.userId = userId;
    this.orders = [];
    this.wishlist = [];
    this.profile = null;
    this.init();
  }

  async init() {
    logAction('UserDashboard initialized', { userId: this.userId });
    this.profile = await getUserProfile(this.userId);
    this.orders = await getUserOrders(this.userId);
    this.wishlist = await getUserWishlist(this.userId);
    this.render();
    this.attachEvents();
  }

  render() {
    if (!this.profile) {
      this.container.innerHTML = '<p>User profile not found.</p>';
      return;
    }
    
    const orderRows = this.orders.length ? this.orders.map(order => `
      <tr>
        <td>${order.id}</td>
        <td>${new Date(order.date).toLocaleDateString()}</td>
        <td>${order.status}</td>
        <td>${order.total.toFixed(2)}</td>
        <td>
          ${order.status === 'Pending' ? `<button class="cancel-order-btn" data-orderid="${order.id}">Cancel</button>` : ''}
          <button class="reorder-btn" data-orderid="${order.id}">Reorder</button>
        </td>
      </tr>`).join('') : '<tr><td colspan="5">No orders found</td></tr>';

    const wishlistHtml = this.wishlist.length ? this.wishlist.map(item => `
      <li>${item.name} - ₹${item.price.toFixed(2)}</li>
    `).join('') : '<li>Your wishlist is empty.</li>';

    this.container.innerHTML = `
      <section class="user-profile">
        <h2>Welcome, ${this.profile.name}</h2>
        <p>Email: ${this.profile.email}</p>
        <p>Member since: ${new Date(this.profile.joinDate).toLocaleDateString()}</p>
      </section>
      
      <section class="user-orders">
        <h3>Your Orders</h3>
        <table>
          <thead><tr><th>Order ID</th><th>Date</th><th>Status</th><th>Total (₹)</th><th>Actions</th></tr></thead>
          <tbody>${orderRows}</tbody>
        </table>
      </section>
      
      <section class="user-wishlist">
        <h3>Your Wishlist</h3>
        <ul>${wishlistHtml}</ul>
      </section>
    `;
  }

  attachEvents() {
    this.container.querySelectorAll('.cancel-order-btn').forEach(btn => {
      btn.onclick = async (e) => {
        const orderId = e.target.dataset.orderid;
        if (confirm('Are you sure you want to cancel this order?')) {
          await cancelOrder(orderId);
          logAction('Order cancelled', { orderId, userId: this.userId });
          alert('Order cancelled successfully.');
          this.init();
        }
      };
    });

    this.container.querySelectorAll('.reorder-btn').forEach(btn => {
      btn.onclick = async (e) => {
        const orderId = e.target.dataset.orderid;
        await reorderProduct(orderId);
        logAction('Order reordered', { orderId, userId: this.userId });
        alert('Order placed again successfully.');
      };
    });
  }
}
