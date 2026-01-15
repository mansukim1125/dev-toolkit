const express = require('express');
const router = express.Router();
const { renderWithLayout } = require('./index');

// Base64
router.get('/base64', (req, res) => {
  const { input = '', action } = req.query;
  let result = '';
  let error = '';

  if (action === 'encode' && input) {
    try {
      result = Buffer.from(input).toString('base64');
    } catch (e) {
      error = e.message;
    }
  } else if (action === 'decode' && input) {
    try {
      result = Buffer.from(input, 'base64').toString('utf-8');
    } catch (e) {
      error = e.message;
    }
  }

  renderWithLayout(res, 'tools/base64.ejs', {
    title: 'Base64',
    input,
    result,
    error,
    action: action || ''
  });
});

// JSON Formatter
router.get('/json-formatter', (req, res) => {
  const { input = '', action, indent = '2' } = req.query;
  let result = '';
  let error = '';

  if (action === 'prettify' && input) {
    try {
      const parsed = JSON.parse(input);
      const space = indent === 'tab' ? '\t' : parseInt(indent) || 2;
      result = JSON.stringify(parsed, null, space);
    } catch (e) {
      error = 'Invalid JSON: ' + e.message;
    }
  } else if (action === 'minify' && input) {
    try {
      const parsed = JSON.parse(input);
      result = JSON.stringify(parsed);
    } catch (e) {
      error = 'Invalid JSON: ' + e.message;
    }
  }

  renderWithLayout(res, 'tools/json-formatter.ejs', {
    title: 'JSON Formatter',
    input,
    result,
    error,
    action: action || ''
  });
});

// JWT Decoder
router.get('/jwt', (req, res) => {
  const { input = '' } = req.query;
  let header = null;
  let payload = null;
  let error = '';

  if (input) {
    try {
      const parts = input.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }
      header = JSON.parse(Buffer.from(parts[0], 'base64').toString('utf-8'));
      payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
    } catch (e) {
      error = e.message;
    }
  }

  renderWithLayout(res, 'tools/jwt.ejs', {
    title: 'JWT Decoder',
    input,
    header,
    payload,
    error
  });
});

module.exports = router;
