'use strict';

const tools = [
  { id: 'base64', name: 'Base64' },
  { id: 'json-prettier', name: 'JSON Prettier' },
  { id: 'env-converter', name: 'Env Converter' },
  { id: 'json-xml-compare', name: 'JSON/XML Compare' },
  { id: 'jwt', name: 'JWT' },
  { id: 'cron-parser', name: 'Cron Parser' },
  { id: 'timezone-converter', name: 'Timezone Converter' },
  { id: 'image-converter', name: 'Image Converter' },
  { id: 'url-encode-decode', name: 'URL Encode/Decode' },
];

let activeTool = tools[0]?.id;

function renderNav() {
  document.getElementById('nav').innerHTML = tools
    .map(t => `<button onclick="switchTool('${t.id}')" ${t.id === activeTool ? 'disabled' : ''}>${t.name}</button>`)
    .join(' ');
}

function switchTool(id) {
  activeTool = id;
  renderNav();
  document.getElementById('tool-frame').src = `tools/${id}/index.html`;
}

renderNav();
switchTool(activeTool);
