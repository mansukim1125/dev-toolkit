'use strict';

async function loadHTMLTemplate(id) {
  const alreadyLoaded = document.getElementById(id);
  if (alreadyLoaded) {
    return alreadyLoaded;
  }

  // HTML 템플릿 로드
  const response = await fetch(`tools/${id}/index.html`);
  const html = await response.text();

  // DOM으로 파싱
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // 수정된 HTML을 templates에 삽입 (head + body 모두 포함)
  const templatesContainer = document.getElementById('templates');
  templatesContainer.innerHTML += doc.head.innerHTML + doc.body.innerHTML;

  // template 요소 찾아서 script 태그 로드
  const template = doc.querySelector('template');
  if (template) {
    const scripts = template.content.querySelectorAll('script');
    scripts.forEach(script => {
      const scriptElement = document.createElement('script');

      // type 속성이 있으면 복사 (module 등)
      const attributeNames = script.getAttributeNames();
      for (const attrName of attributeNames) {
        if (attrName !== 'src') {
          scriptElement.setAttribute(attrName, script.getAttribute(attrName));
        }
      }

      // src가 있으면 외부 스크립트
      const src = script.getAttribute('src');
      if (src) {
        // CDN URL (http:// 또는 https://로 시작)은 그대로 사용
        let resolvedSrc = src;
        if (!src.startsWith('http://') && !src.startsWith('https://')) {
          // 상대 경로만 절대 경로로 변경
          resolvedSrc = new URL(src, `${window.location.origin}/tools/${id}/index.html`).pathname;
        }
        scriptElement.src = resolvedSrc;
      } else {
        // inline 스크립트
        scriptElement.textContent = script.textContent;
      }

      document.body.appendChild(scriptElement);
    });
  }

  return document.getElementById(id);
}

// === Helper Functions ===
async function ensureToolPanel(toolId) {
  const mainContainer = document.getElementById('main');
  let panel = mainContainer.querySelector(`[data-tool="${toolId}"]`);

  if (!panel) {
    const template = await loadHTMLTemplate(toolId);
    const clone = template.content.cloneNode(true);
    panel = document.createElement('div');
    panel.setAttribute('data-tool', toolId);
    panel.style.display = 'none';
    panel.appendChild(clone);
    mainContainer.appendChild(panel);
  }

  return panel;
}

// === Tool Registry ===
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

// === Navigation ===
let activeTool = tools[0]?.id;

function renderNav() {
  document.getElementById('nav').innerHTML = tools
    .map(t => `<button onclick="switchTool('${t.id}')" ${t.id === activeTool ? 'disabled' : ''}>${t.name}</button>`)
    .join(' ');
}

async function switchTool(id) {
  const currentToolId = activeTool;
  activeTool = id;
  renderNav();
  await showToolPanel(id, currentToolId);
}

async function showToolPanel(targetToolId, activeToolId) {
  const mainContainer = document.getElementById('main');

  // 활성화된 패널 숨기기
  if (activeToolId) {
    mainContainer.querySelector(`[data-tool="${activeToolId}"]`).style.display = 'none';
  }

  // 선택된 도구 패널 보여주기 (없으면 생성)
  const panel = await ensureToolPanel(targetToolId);
  panel.style.display = 'block';
}

// === Init ===
renderNav();
showToolPanel(activeTool);
