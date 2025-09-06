// src/components/Dashboard/AdminDashboard.js

import {
  getAllOrders,
  getAllUsers,
  getSalesStats,
  getTopProducts,
  updateOrderStatus,
  logAction,
} from '../../services/adminService.js';

export default class AdminDashboard {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.orders = [];
    this.users = [];
    this.salesStats = null;
    this.topProducts = [];
    this.init();
  }

  async init() {
    logAction('AdminDashboard initialized');
    this.orders = await getAllOrders();
    this.users = await getAllUsers();
    this.salesStats = await getSalesStats();
    this.topProducts = await getTopProducts();
    this.render();
    this.attachEvents();
  }

  render() {
    const orderRows = this.orders.length ? this.orders.map(order => `
      <tr>
        <td>${order.id}</td>
        <td>${order.customerName}</td>
        <td>${new Date(order.date).toLocaleDateString()}</td>
        <td>${order.status}</td>
        <td>${order.total.toFixed(2)}</td>
        <td>
          <select class="order-status-select" data-orderid="${order.id}">
            <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
            <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
            <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
            <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
      </tr>
    `).join('') : '<tr><td colspan="6">No orders found</td></tr>';

    const userCount = this.users.length;
    const totalSales = this.salesStats ? this.salesStats.totalSales.toFixed(2) : 'N/A';

    const topProductsHtml = this.topProducts.length ? this.topProducts.map(p => `
      <li>${p.name} - ₹${p.totalSales.toFixed(2)}</li>
    `).join('') : '<li>No products sold yet</li>';

    this.container.innerHTML = `
      <section class="admin-stats">
        <h2>Admin Dashboard</h2>
        <p>Total Users: ${userCount}</p>
        <p>Total Sales: ₹${totalSales}</p>
      </section>
      <section class="orders-management">
        <h3>Recent Orders</h3>
        <table>
          <thead>
            <tr><th>Order ID</th><th>Customer</th><th>Date</th><th>Status</th><th>Total (₹)</th><th>Update Status</th></tr>
          </thead>
          <tbody>${orderRows}</tbody>
        </table>
      </section>
      <section class="top-products">
        <h3>Top Selling Products</h3>
        <ul>${topProductsHtml}</ul>
      </section>
    `;
  }

  attachEvents() {
    this.container.querySelectorAll('.order-status-select').forEach(select => {
      select.onchange = async (e) => {
        const orderId = e.target.dataset.orderid;
        const newStatus = e.target.value;
        await updateOrderStatus(orderId, newStatus);
        logAction('Order status updated', { orderId, newStatus });
        alert(`Order ${orderId} status changed to ${newStatus}`);
      };
    });
  }
}
