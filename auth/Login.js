// src/components/Auth/Login.js

import {
  loginUser,
  sendTwoFactorCode,
  verifyTwoFactorCode,
  logAction,
} from '../../services/authService.js';

export default class Login {
  constructor(formId) {
    this.form = document.getElementById(formId);
    this.twoFactorInput = null;
    this.userEmail = '';
    this.init();
  }

  init() {
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleLogin();
    });
  }

  async handleLogin() {
    const email = this.form.elements['email'].value.trim();
    const password = this.form.elements['password'].value;

    // Basic client-side validation
    if (!this.validateEmail(email)) {
      this.showError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      this.showError('Password must be at least 6 characters long.');
      return;
    }

    try {
      this.userEmail = email;
      const loginResult = await loginUser(email, password);
      logAction('User login attempt', { email, success: loginResult.success });

      if (loginResult.twoFactorRequired) {
        this.showTwoFactorInput();
        await sendTwoFactorCode(email);
        logAction('2FA code sent', { email });
      } else if (loginResult.success) {
        alert('Login successful!');
        // Redirect to user dashboard or homepage
      } else {
        this.showError(loginResult.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      this.showError('An unexpected error occurred. Please try again.');
      logAction('Login error', { email, error: error.message });
    }
  }

  async verifyTwoFactor() {
    const code = this.twoFactorInput.value.trim();
    if (!code || code.length !== 6) {
      this.showError('Please enter a valid 6-digit code.');
      return;
    }
    try {
      const verified = await verifyTwoFactorCode(this.userEmail, code);
      logAction('2FA verification attempt', { email: this.userEmail, verified });
      if (verified) {
        alert('Two-factor authentication successful! Redirecting...');
        // Redirect to user dashboard or homepage
      } else {
        this.showError('Invalid code. Please try again.');
      }
    } catch (error) {
      this.showError('Error verifying code. Please try again.');
      logAction('2FA error', { email: this.userEmail, error: error.message });
    }
  }

  showTwoFactorInput() {
    // Create 2FA input dynamically if not present
    if (!this.twoFactorInput) {
      const div = document.createElement('div');
      div.innerHTML = `
        <label for="twoFactorCode">2FA Code</label>
        <input type="text" id="twoFactorCode" maxlength="6" />
        <button id="verify2FAButton">Verify</button>
        <div id="errorMsg" role="alert" style="color:red; margin-top:5px;"></div>
      `;
      this.form.appendChild(div);
      this.twoFactorInput = div.querySelector('#twoFactorCode');
      const verifyBtn = div.querySelector('#verify2FAButton');
      verifyBtn.onclick = (e) => {
        e.preventDefault();
        this.verifyTwoFactor();
      };
    }
  }

  validateEmail(email) {
    // Simple regex for email validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
