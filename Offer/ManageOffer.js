// src/components/Offer/ManageOffer.js

import {
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,
  logAction,
  uploadOfferImage,
} from '../../services/offerService.js';

export default class ManageOffer {
  constructor(formId, previewId) {
    this.form = document.getElementById(formId);
    this.previewContainer = document.getElementById(previewId);
    this.currentOfferId = null;
    this.init();
  }

  init() {
    this.attachFormSubmit();
    this.attachImageUpload();
  }

  async loadOfferData(offerId) {
    this.currentOfferId = offerId;
    if (!offerId) {
      this.resetForm();
      return;
    }
    try {
      const offer = await getOfferById(offerId);
      if (!offer) throw new Error('Offer not found');
      this.form.elements['offerTitle'].value = offer.title;
      this.form.elements['offerDescription'].value = offer.description;
      this.form.elements['offerDiscount'].value = offer.discount;
      this.form.elements['offerStartDate'].value = offer.startDate ? new Date(offer.startDate).toISOString().substring(0,10) : '';
      this.form.elements['offerEndDate'].value = offer.endDate ? new Date(offer.endDate).toISOString().substring(0,10) : '';
      this.form.elements['offerCategory'].value = offer.categoryId;
      this.form.elements['offerShop'].value = offer.shopId;
      this.form.elements['offerActive'].checked = offer.isActive;
      if(offer.imageURL) {
        this.previewContainer.innerHTML = `<img src="${offer.imageURL}" alt="Offer Image" style="max-width: 200px;" />`;
      }
      logAction('Loaded offer for editing', { offerId });
    } catch (error) {
      alert("Error loading offer data");
      logAction('Error loading offer', { error: error.message });
    }
  }

  attachFormSubmit() {
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validate inputs
      const title = this.form.elements['offerTitle'].value.trim();
      const discount = parseFloat(this.form.elements['offerDiscount'].value);
      if (!title) {
        alert("Offer title is required");
        return;
      }
      if (isNaN(discount) || discount <= 0) {
        alert("Discount must be a positive number");
        return;
      }

      // Gather form data
      const offerData = {
        title,
        description: this.form.elements['offerDescription'].value.trim(),
        discount,
        startDate: this.form.elements['offerStartDate'].value,
        endDate: this.form.elements['offerEndDate'].value,
        categoryId: this.form.elements['offerCategory'].value,
        shopId: this.form.elements['offerShop'].value,
        isActive: this.form.elements['offerActive'].checked,
      };

      try {
        if (this.currentOfferId) {
          await updateOffer(this.currentOfferId, offerData);
          logAction('Offer updated', { offerId: this.currentOfferId });
        } else {
          const newOffer = await createOffer(offerData);
          this.currentOfferId = newOffer.id;
          logAction('Offer created', { offerId: this.currentOfferId });
        }
        alert('Offer saved successfully');
        this.loadOfferData(this.currentOfferId);
      } catch (error) {
        alert('Error saving offer: ' + error.message);
        logAction('Error saving offer', { error: error.message });
      }
    });
  }

  attachImageUpload() {
    const imageInput = this.form.elements['offerImage'];
    imageInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Basic validation
      if (!file.type.startsWith('image/')) {
        alert('Only image files are allowed!');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be under 5MB');
        return;
      }

      try {
        const imageUrl = await uploadOfferImage(this.currentOfferId, file);
        this.previewContainer.innerHTML = `<img src="${imageUrl}" alt="Offer Image" style="max-width: 200px;" />`;
        logAction('Uploaded offer image', { offerId: this.currentOfferId });
      } catch (error) {
        alert('Error uploading image: ' + error.message);
        logAction('Error uploading offer image', { error: error.message });
      }
    });
  }

  resetForm() {
    this.currentOfferId = null;
    this.form.reset();
    this.previewContainer.innerHTML = '';
  }

  async deleteCurrentOffer() {
    if (!this.currentOfferId) {
      alert("No offer selected to delete");
      return;
    }
    if (confirm("Are you sure you want to delete this offer? This action cannot be undone.")) {
      try {
        await deleteOffer(this.currentOfferId);
        logAction('Deleted offer', { offerId: this.currentOfferId });
        this.resetForm();
        alert('Offer deleted successfully');
      } catch (error) {
        alert('Error deleting offer: ' + error.message);
        logAction('Error deleting offer', { error: error.message });
      }
    }
  }
}
