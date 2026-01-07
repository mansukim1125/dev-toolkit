'use strict';

class Base64Tool {
  static encode() {
    try {
      document.getElementById('error').textContent = '';
      const input = document.getElementById('input').value;
      document.getElementById('output').value = btoa(unescape(encodeURIComponent(input)));
    } catch {
      document.getElementById('error').textContent = 'Encoding failed';
    }
  }

  static decode() {
    try {
      document.getElementById('error').textContent = '';
      const input = document.getElementById('input').value;
      document.getElementById('output').value = decodeURIComponent(escape(atob(input)));
    } catch {
      document.getElementById('error').textContent = 'Invalid Base64';
    }
  }

  static clear() {
    document.getElementById('input').value = '';
    document.getElementById('output').value = '';
    document.getElementById('error').textContent = '';
  }

  static copy() {
    navigator.clipboard.writeText(document.getElementById('output').value);
  }
}
