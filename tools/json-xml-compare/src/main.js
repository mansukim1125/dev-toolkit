'use strict';

class JsonXmlCompareTool {
  static parseInput(input, format) {
    if (format === 'json') {
      return JSON.parse(input);
    } else if (format === 'xml') {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(input, 'text/xml');

      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        throw new Error('Invalid XML: ' + parseError.textContent);
      }

      return this.xmlToJson(xmlDoc.documentElement);
    }
    throw new Error('Unsupported format');
  }

  static xmlToJson(xml) {
    const obj = {};

    if (xml.nodeType === 1) {
      if (xml.attributes.length > 0) {
        obj['@attributes'] = {};
        for (let j = 0; j < xml.attributes.length; j++) {
          const attribute = xml.attributes.item(j);
          obj['@attributes'][attribute.nodeName] = attribute.nodeValue;
        }
      }
    } else if (xml.nodeType === 3) {
      obj.text = xml.nodeValue.trim();
    }

    if (xml.hasChildNodes()) {
      for (let i = 0; i < xml.childNodes.length; i++) {
        const item = xml.childNodes.item(i);
        const nodeName = item.nodeName;

        if (item.nodeType === 3) {
          const text = item.nodeValue.trim();
          if (text) {
            return text;
          }
        } else {
          if (typeof obj[nodeName] === 'undefined') {
            obj[nodeName] = this.xmlToJson(item);
          } else {
            if (typeof obj[nodeName].push === 'undefined') {
              const old = obj[nodeName];
              obj[nodeName] = [];
              obj[nodeName].push(old);
            }
            obj[nodeName].push(this.xmlToJson(item));
          }
        }
      }
    }

    return obj;
  }

  static compareObjects(left, right, path = '') {
    const differences = [];

    const leftKeys = new Set(Object.keys(left || {}));
    const rightKeys = new Set(Object.keys(right || {}));
    const allKeys = new Set([...leftKeys, ...rightKeys]);

    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key;
      const leftValue = left?.[key];
      const rightValue = right?.[key];

      if (!leftKeys.has(key)) {
        differences.push({
          path: currentPath,
          type: 'missing_left',
          left: undefined,
          right: rightValue
        });
      } else if (!rightKeys.has(key)) {
        differences.push({
          path: currentPath,
          type: 'missing_right',
          left: leftValue,
          right: undefined
        });
      } else if (typeof leftValue !== typeof rightValue) {
        differences.push({
          path: currentPath,
          type: 'type_mismatch',
          left: leftValue,
          right: rightValue
        });
      } else if (typeof leftValue === 'object' && leftValue !== null && rightValue !== null) {
        if (Array.isArray(leftValue) && Array.isArray(rightValue)) {
          if (leftValue.length !== rightValue.length) {
            differences.push({
              path: currentPath,
              type: 'array_length_mismatch',
              left: leftValue.length,
              right: rightValue.length
            });
          } else {
            for (let i = 0; i < leftValue.length; i++) {
              const arrayDiffs = this.compareObjects(leftValue[i], rightValue[i], `${currentPath}[${i}]`);
              differences.push(...arrayDiffs);
            }
          }
        } else {
          const nestedDiffs = this.compareObjects(leftValue, rightValue, currentPath);
          differences.push(...nestedDiffs);
        }
      } else if (leftValue !== rightValue) {
        differences.push({
          path: currentPath,
          type: 'value_mismatch',
          left: leftValue,
          right: rightValue
        });
      }
    }

    return differences;
  }

  static formatDifference(diff) {
    const formatValue = (val) => {
      if (val === undefined) return '<없음>';
      if (typeof val === 'object') return JSON.stringify(val);
      return String(val);
    };

    const typeLabels = {
      'missing_left': '왼쪽에 없음',
      'missing_right': '오른쪽에 없음',
      'type_mismatch': '타입 불일치',
      'value_mismatch': '값 불일치',
      'array_length_mismatch': '배열 길이 불일치'
    };

    return `
      <div style="border-left: 3px solid #ff6b6b; padding: 10px; margin: 5px 0; background-color: #fff5f5;">
        <strong>경로:</strong> ${diff.path}<br>
        <strong>타입:</strong> ${typeLabels[diff.type]}<br>
        <strong>왼쪽:</strong> ${formatValue(diff.left)}<br>
        <strong>오른쪽:</strong> ${formatValue(diff.right)}
      </div>
    `;
  }

  static compare() {
    try {
      document.getElementById('compare-error').textContent = '';
      document.getElementById('compare-result').innerHTML = '';

      const leftInput = document.getElementById('left-input').value.trim();
      const rightInput = document.getElementById('right-input').value.trim();
      const leftFormat = document.getElementById('left-format').value;
      const rightFormat = document.getElementById('right-format').value;

      if (!leftInput || !rightInput) {
        throw new Error('양쪽 입력란에 데이터를 입력해주세요.');
      }

      const leftParsed = this.parseInput(leftInput, leftFormat);
      const rightParsed = this.parseInput(rightInput, rightFormat);

      const differences = this.compareObjects(leftParsed, rightParsed);

      if (differences.length === 0) {
        document.getElementById('compare-result').innerHTML =
          '<div style="color: green; font-weight: bold;">✓ 두 데이터가 완전히 일치합니다!</div>';
      } else {
        const resultHtml = `
          <div style="color: #d63031; font-weight: bold; margin-bottom: 10px;">
            ${differences.length}개의 차이점이 발견되었습니다:
          </div>
          ${differences.map(diff => this.formatDifference(diff)).join('')}
        `;
        document.getElementById('compare-result').innerHTML = resultHtml;
      }
    } catch (e) {
      document.getElementById('compare-error').textContent = '오류: ' + e.message;
    }
  }

  static clear() {
    document.getElementById('left-input').value = '';
    document.getElementById('right-input').value = '';
    document.getElementById('compare-error').textContent = '';
    document.getElementById('compare-result').innerHTML = '';
    document.getElementById('left-format').value = 'json';
    document.getElementById('right-format').value = 'json';
  }
}
