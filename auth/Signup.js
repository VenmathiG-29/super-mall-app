// src/components/Auth/Signup.js

import {
  registerUser,
  sendEmailVerification,
  logAction,
} from '../../services/authService.js';

export default class Signup {
  constructor(formId) {
    this.form = document.getElementById(formId);
    this.init();
  }

  init() {
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSignup();
    });
  }

  async handleSignup() {
    const email = this.form.elements['email'].value.trim();
    const password = this.form.elements['password'].value;
    const confirmPassword = this.form.elements['confirmPassword'].value;
    const username = this.form.elements['username'].value.trim();

    // Validation with detailed feedback
    if (!username || username.length < 3) {
      this.showError('Username must be at least 3 characters long.');
      return;
    }
    if (!this.validateEmail(email)) {
      this.showError('Please enter a valid email address.');
      return;
    }
    if (!this.validatePassword(password)) {
      this.showError('Password must be at least 8 characters, including a number and special character.');
      return;
    }
    if (password !== confirmPassword) {
      this.showError('Passwords do not match.');
      return;
    }

    try {
      const result = await registerUser(email, password, username);
      logAction('User registration attempt', { email, success: result.success });
      if (result.success) {
        alert('Registration successful! Please verify your email.');
        await sendEmailVerification(email);
      } else {
        this.showError(result.message || 'Registration failed.');
      }
    } catch (error) {
      this.showError('An unexpected error occurred. Please try again.');
      logAction('Registration error', { email, error: error.message });
    }
  }

  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  validatePassword(password) {
    // Minimum 8 chars, at least one number and one special char
    return /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/.test(password);
  }

  showError(msg) {
    let errorDiv = this.form.querySelector('#errorMsg');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.id = 'errorMsg';
      errorDiv.setAttribute('role', 'alert');
      errorDiv.style.color = 'red';
      errorDiv.style.marginTop = '5px';
      this.form.appendChild(errorDiv);
    }
    errorDiv.textContent = msg;
  }
}
