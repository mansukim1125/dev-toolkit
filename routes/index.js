const express = require('express');
const router = express.Router();
const ejs = require('ejs');
const path = require('path');

const tools = [
  {
    id: 'base64',
    name: 'Base64',
    description: 'Base64 인코딩/디코딩'
  },
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    description: 'JSON 정렬 및 압축'
  },
  {
    id: 'jwt',
    name: 'JWT Decoder',
    description: 'JWT 토큰 디코딩'
  }
];

// Helper function to render with layout
function renderWithLayout(res, view, data = {}) {
  const viewsDir = res.app.get('views');

  ejs.renderFile(path.join(viewsDir, view), data, (err, content) => {
    if (err) {
      return res.status(500).send(err.message);
    }

    ejs.renderFile(path.join(viewsDir, 'layouts/main.ejs'), {
      ...data,
      content
    }, (err, html) => {
      if (err) {
        return res.status(500).send(err.message);
      }
      res.send(html);
    });
  });
}

router.get('/', (req, res) => {
  renderWithLayout(res, 'index.ejs', { tools });
});

module.exports = router;
module.exports.renderWithLayout = renderWithLayout;
