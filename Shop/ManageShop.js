// src/components/Shop/ManageShop.js

import {
  getShopById,
  createShop,
  updateShop,
  deleteShop,
  uploadShopImage,
  logAction,
} from '../../services/shopService.js';

export default class ManageShop {
  constructor(formId, previewId) {
    this.form = document.getElementById(formId);
    this.previewContainer = document.getElementById(previewId);
    this.currentShopId = null;
    this.init();
  }

  init() {
    this.attachFormSubmit();
    this.attachImageUpload();
  }

  async loadShopData(shopId) {
    this.currentShopId = shopId;
    if (!shopId) {
      this.resetForm();
      return;
    }
    try {
      const shop = await getShopById(shopId);
      if (!shop) throw new Error('Shop not found');
      this.form.elements['shopName'].value = shop.name;
      this.form.elements['shopDescription'].value = shop.description;
      this.form.elements['shopCategory'].value = shop.categoryId;
      this.form.elements['shopLocation'].value = shop.locationName;
      this.form.elements['shopStatus'].checked = shop.isOpen;
      if(shop.imageURL) {
        this.previewContainer.innerHTML = `<img src="${shop.imageURL}" alt="Shop Image" style="max-width: 200px;" />`;
      }
      logAction('Loaded shop for editing', { shopId });
    } catch (error) {
      alert("Error loading shop data");
      logAction('Error loading shop', { error: error.message });
    }
  }

  attachFormSubmit() {
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validate inputs
      if (!this.form.elements['shopName'].value.trim()) {
        alert("Shop Name is required");
        return;
      }

      // Gather form data
      const shopData = {
        name: this.form.elements['shopName'].value.trim(),
        description: this.form.elements['shopDescription'].value.trim(),
        categoryId: this.form.elements['shopCategory'].value,
        locationName: this.form.elements['shopLocation'].value.trim(),
        isOpen: this.form.elements['shopStatus'].checked,
      };

      try {
        let response;
        if (this.currentShopId) {
          // Update existing shop
          response = await updateShop(this.currentShopId, shopData);
          logAction('Shop updated', { shopId: this.currentShopId });
        } else {
          // Create new shop
          response = await createShop(shopData);
          this.currentShopId = response.id;
          logAction('Shop created', { shopId: this.currentShopId });
        }
        alert('Shop saved successfully');
        this.loadShopData(this.currentShopId);
      } catch (error) {
        alert('Error saving shop: ' + error.message);
        logAction('Error saving shop', { error: error.message });
      }
    });
  }

  attachImageUpload() {
    const imageInput = this.form.elements['shopImage'];
    imageInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Optional: Validate file type and size
      if (!file.type.startsWith('image/')) {
        alert('Only image files are allowed!');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size must be under 5MB');
        return;
      }

      try {
        const imageUrl = await uploadShopImage(this.currentShopId, file);
        this.previewContainer.innerHTML = `<img src="${imageUrl}" alt="Shop Image" style="max-width: 200px;" />`;
        logAction('Uploaded shop image', { shopId: this.currentShopId });
      } catch (error) {
        alert('Error uploading image: ' + error.message);
        logAction('Error uploading shop image', { error: error.message });
      }
    });
  }

  resetForm() {
    this.currentShopId = null;
    this.form.reset();
    this.previewContainer.innerHTML = '';
  }

  async deleteCurrentShop() {
    if (!this.currentShopId) return alert("No shop selected to delete.");
    if (confirm("Are you sure you want to delete this shop? This action cannot be undone.")) {
      try {
        await deleteShop(this.currentShopId);
        logAction('Deleted shop', { shopId: this.currentShopId });
        this.resetForm();
        alert('Shop deleted successfully');
      } catch (error) {
        alert('Error deleting shop: ' + error.message);
        logAction('Error deleting shop', { error: error.message });
      }
    }
  }
}
