'use strict';

class JwtTool {
  static activeTab = 'decode';

  // Tab Management
  static switchTab(tabName) {
    // Hide all tab contents and reset button styles
    ['decode', 'verify', 'generate'].forEach(tab => {
      const content = document.getElementById(`${tab}-tab-content`);
      const button = document.getElementById(`${tab}-tab-btn`);

      if (content) content.style.display = 'none';
      if (button) {
        button.style.backgroundColor = '#f0f0f0';
        button.style.color = '#333';
        button.style.fontWeight = 'normal';
      }
    });

    // Show selected tab and update button style
    const selectedContent = document.getElementById(`${tabName}-tab-content`);
    const selectedButton = document.getElementById(`${tabName}-tab-btn`);

    if (selectedContent) selectedContent.style.display = 'block';
    if (selectedButton) {
      selectedButton.style.backgroundColor = '#007bff';
      selectedButton.style.color = 'white';
      selectedButton.style.fontWeight = 'bold';
    }

    this.activeTab = tabName;
  }

  // Decode Functions
  static decode() {
    try {
      this.clearError('decode');
      const jwt = document.getElementById('decode-jwt-input').value.trim();

      if (!jwt) {
        throw new Error('Please enter a JWT token');
      }

      const parts = jwt.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format. Expected 3 parts separated by dots.');
      }

      // Decode header
      const header = JSON.parse(this.decodeBase64Url(parts[0]));
      document.getElementById('decode-header-output').value = JSON.stringify(header, null, 2);

      // Decode payload
      const payload = JSON.parse(this.decodeBase64Url(parts[1]));
      document.getElementById('decode-payload-output').value = JSON.stringify(payload, null, 2);

      // Signature (display as-is)
      document.getElementById('decode-signature-output').value = parts[2];

      this.showSuccess('decode', 'JWT decoded successfully');
    } catch (error) {
      this.showError('decode', 'Decode failed: ' + error.message);
      // Clear outputs on error
      document.getElementById('decode-header-output').value = '';
      document.getElementById('decode-payload-output').value = '';
      document.getElementById('decode-signature-output').value = '';
    }
  }

  static decodeBase64Url(str) {
    // Convert base64url to base64
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    // Pad with '=' if needed
    while (base64.length % 4) {
      base64 += '=';
    }
    // Decode base64 to string
    try {
      return decodeURIComponent(escape(atob(base64)));
    } catch (e) {
      throw new Error('Invalid base64url encoding');
    }
  }

  // Verify Functions
  static async verify() {
    try {
      this.clearError('verify');
      const jwt = document.getElementById('verify-jwt-input').value.trim();
      const algorithm = document.getElementById('verify-algorithm').value;
      const key = document.getElementById('verify-key-input').value.trim();

      if (!jwt) {
        throw new Error('Please enter a JWT token');
      }

      if (!key) {
        throw new Error('Please enter a secret or public key');
      }

      // Check if jose library is loaded
      if (typeof jose === 'undefined') {
        throw new Error('JWT library not loaded. Please refresh the page.');
      }

      let cryptoKey;
      if (algorithm === 'HS256') {
        // For HMAC, use the secret string directly
        cryptoKey = new TextEncoder().encode(key);
      } else if (algorithm === 'RS256') {
        // For RSA, import the public key
        try {
          cryptoKey = await jose.importSPKI(key, 'RS256');
        } catch (e) {
          throw new Error('Invalid RSA public key format. Expected PEM format starting with -----BEGIN PUBLIC KEY-----');
        }
      } else if (algorithm === 'ES256') {
        // For ECDSA, import the public key
        try {
          cryptoKey = await jose.importSPKI(key, 'ES256');
        } catch (e) {
          throw new Error('Invalid ECDSA public key format. Expected PEM format starting with -----BEGIN PUBLIC KEY-----');
        }
      }

      // Verify the JWT
      const { payload, protectedHeader } = await jose.jwtVerify(jwt, cryptoKey);

      // Display success result
      const resultDiv = document.getElementById('verify-result');
      resultDiv.innerHTML = `
        <div style="color: #28a745; font-weight: bold; font-size: 16px; margin-bottom: 10px;">
          ✓ Signature Valid
        </div>
        <div style="margin-top: 15px;">
          <strong>Algorithm:</strong> ${protectedHeader.alg}
        </div>
        <div style="margin-top: 15px;">
          <strong>Payload:</strong>
          <pre style="background-color: #fff; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-top: 5px; overflow-x: auto;">${JSON.stringify(payload, null, 2)}</pre>
        </div>
      `;

      this.showSuccess('verify', 'JWT signature verified successfully');
    } catch (error) {
      // Display failure result
      const resultDiv = document.getElementById('verify-result');
      resultDiv.innerHTML = `
        <div style="color: #dc3545; font-weight: bold; font-size: 16px; margin-bottom: 10px;">
          ✗ Verification Failed
        </div>
        <div style="margin-top: 10px; color: #666;">
          ${this.escapeHtml(error.message)}
        </div>
      `;

      this.showError('verify', 'Verification failed: ' + error.message);
    }
  }

  // Generate Functions
  static async generate() {
    try {
      this.clearError('generate');
      const payloadStr = document.getElementById('generate-payload').value.trim();
      const algorithm = document.getElementById('generate-algorithm').value;
      const key = document.getElementById('generate-key-input').value.trim();

      if (!payloadStr) {
        throw new Error('Please enter a JSON payload');
      }

      if (!key) {
        throw new Error('Please enter a secret or private key');
      }

      // Parse payload
      let payload;
      try {
        payload = JSON.parse(payloadStr);
      } catch (e) {
        throw new Error('Invalid JSON payload: ' + e.message);
      }

      // Check if jose library is loaded
      if (typeof jose === 'undefined') {
        throw new Error('JWT library not loaded. Please refresh the page.');
      }

      let jwt;
      if (algorithm === 'HS256') {
        // For HMAC, use the secret string directly
        const secret = new TextEncoder().encode(key);
        jwt = await new jose.SignJWT(payload)
          .setProtectedHeader({ alg: 'HS256' })
          .sign(secret);
      } else if (algorithm === 'RS256') {
        // For RSA, import the private key
        try {
          const privateKey = await jose.importPKCS8(key, 'RS256');
          jwt = await new jose.SignJWT(payload)
            .setProtectedHeader({ alg: 'RS256' })
            .sign(privateKey);
        } catch (e) {
          throw new Error('Invalid RSA private key format. Expected PKCS8 PEM format starting with -----BEGIN PRIVATE KEY-----');
        }
      } else if (algorithm === 'ES256') {
        // For ECDSA, import the private key
        try {
          const privateKey = await jose.importPKCS8(key, 'ES256');
          jwt = await new jose.SignJWT(payload)
            .setProtectedHeader({ alg: 'ES256' })
            .sign(privateKey);
        } catch (e) {
          throw new Error('Invalid ECDSA private key format. Expected PKCS8 PEM format starting with -----BEGIN PRIVATE KEY-----');
        }
      }

      // Display generated JWT
      document.getElementById('generate-output').value = jwt;
      this.showSuccess('generate', 'JWT generated successfully');
    } catch (error) {
      this.showError('generate', 'Generation failed: ' + error.message);
      document.getElementById('generate-output').value = '';
    }
  }

  // Utility Functions
  static async copyOutput(elementId) {
    try {
      const element = document.getElementById(elementId);
      const text = element.value;

      if (!text) {
        return;
      }

      await navigator.clipboard.writeText(text);

      // Show temporary success message
      const tabName = elementId.split('-')[0];
      const originalMessage = document.getElementById(`${tabName}-error`).textContent;
      this.showSuccess(tabName, 'Copied to clipboard!');

      // Restore original message after 2 seconds
      setTimeout(() => {
        const errorDiv = document.getElementById(`${tabName}-error`);
        if (errorDiv.textContent === 'Copied to clipboard!') {
          errorDiv.textContent = originalMessage;
        }
      }, 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  }

  static clearTab(tabName) {
    this.clearError(tabName);

    if (tabName === 'decode') {
      document.getElementById('decode-jwt-input').value = '';
      document.getElementById('decode-header-output').value = '';
      document.getElementById('decode-payload-output').value = '';
      document.getElementById('decode-signature-output').value = '';
    } else if (tabName === 'verify') {
      document.getElementById('verify-jwt-input').value = '';
      document.getElementById('verify-key-input').value = '';
      document.getElementById('verify-result').innerHTML = '';
    } else if (tabName === 'generate') {
      document.getElementById('generate-payload').value = '';
      document.getElementById('generate-key-input').value = '';
      document.getElementById('generate-output').value = '';
    }
  }

  static showError(tabName, message) {
    const errorDiv = document.getElementById(`${tabName}-error`);
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.color = 'red';
    }
  }

  static showSuccess(tabName, message) {
    const errorDiv = document.getElementById(`${tabName}-error`);
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.color = '#28a745';
    }
  }

  static clearError(tabName) {
    const errorDiv = document.getElementById(`${tabName}-error`);
    if (errorDiv) {
      errorDiv.textContent = '';
    }
  }

  static updateKeyPlaceholder(tabName) {
    const algorithm = document.getElementById(`${tabName}-algorithm`).value;
    const keyInput = document.getElementById(`${tabName}-key-input`);

    if (algorithm === 'HS256') {
      keyInput.placeholder = 'For HS256: your-256-bit-secret\nExample: my-secret-key-12345';
    } else if (algorithm === 'RS256') {
      if (tabName === 'verify') {
        keyInput.placeholder = 'For RS256: Public key in PEM format\n-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----';
      } else {
        keyInput.placeholder = 'For RS256: Private key in PKCS8 PEM format\n-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----';
      }
    } else if (algorithm === 'ES256') {
      if (tabName === 'verify') {
        keyInput.placeholder = 'For ES256: Public key in PEM format\n-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----';
      } else {
        keyInput.placeholder = 'For ES256: Private key in PKCS8 PEM format\n-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----';
      }
    }
  }

  static escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}
