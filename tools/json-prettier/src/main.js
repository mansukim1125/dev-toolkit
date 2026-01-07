'use strict';

class JsonPrettierTool {
  static prettifyJson() {
    try {
      document.getElementById('json-error').textContent = '';
      const input = document.getElementById('json-input').value;
      const parsed = JSON.parse(input);
      const indentSize = document.getElementById('indent-size').value;
      const indent = indentSize === 'tab' ? '\t' : parseInt(indentSize);
      document.getElementById('json-output').value = JSON.stringify(parsed, null, indent);
    } catch (e) {
      document.getElementById('json-error').textContent = 'Invalid JSON: ' + e.message;
    }
  }

  static minifyJson() {
    try {
      document.getElementById('json-error').textContent = '';
      const input = document.getElementById('json-input').value;
      const parsed = JSON.parse(input);
      document.getElementById('json-output').value = JSON.stringify(parsed);
    } catch (e) {
      document.getElementById('json-error').textContent = 'Invalid JSON: ' + e.message;
    }
  }

  static clearJson() {
    document.getElementById('json-input').value = '';
    document.getElementById('json-output').value = '';
    document.getElementById('json-error').textContent = '';
  }

  static copyJson() {
    navigator.clipboard.writeText(document.getElementById('json-output').value);
  }
}
