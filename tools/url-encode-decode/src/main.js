'use strict';

class URLEncodeTool {
  static encode() {
    try {
      document.getElementById('error').textContent = '';
      const input = document.getElementById('input').value;
      document.getElementById('output').value = encodeURIComponent(input);
    } catch (error) {
      document.getElementById('error').textContent = 'Encoding failed';
    }
  }

  static decode() {
    try {
      document.getElementById('error').textContent = '';
      const input = document.getElementById('input').value;
      document.getElementById('output').value = decodeURIComponent(input);
    } catch (error) {
      document.getElementById('error').textContent = 'Invalid URL-encoded text';
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
