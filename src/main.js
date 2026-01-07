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
    const scripts = template.content.querySelectorAll('script[src]');
    scripts.forEach(script => {
      const src = script.getAttribute('src');
      // 상대 경로를 절대 경로로 변경
      const resolvedSrc = new URL(src, `${window.location.origin}/tools/${id}/index.html`).pathname;

      // body 끝에 script 태그 추가
      const scriptElement = document.createElement('script');
      scriptElement.src = resolvedSrc;
      document.body.appendChild(scriptElement);
    });
  }

  return document.getElementById(id);
}

// === Helper Functions ===
async function renderFromTemplate(templateId) {
  const template = await loadHTMLTemplate(templateId);
  const clone = template.content.cloneNode(true);
  const div = document.createElement('div');
  div.appendChild(clone);
  return div.innerHTML;
}

// === Tool Registry ===
const tools = [
  { id: 'base64', name: 'Base64' },
  { id: 'json-prettier', name: 'JSON Prettier' },
  { id: 'env-converter', name: 'Env Converter' },
  // 새 도구 추가
];

// === Navigation ===
let activeTool = tools[0]?.id;

function renderNav() {
  document.getElementById('nav').innerHTML = tools
    .map(t => `<button onclick="switchTool('${t.id}')" ${t.id === activeTool ? 'disabled' : ''}>${t.name}</button>`)
    .join(' ');
}

async function switchTool(id) {
  activeTool = id;
  renderNav();
  await renderMain();
}

async function renderMain() {
  const tool = tools.find(t => t.id === activeTool);
  document.getElementById('main').innerHTML = tool ? await renderFromTemplate(tool.id) : '';
}

// === Init ===
renderNav();
renderMain();
