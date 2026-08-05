'use strict';

class DnsLookupTool {
  static resolvers = [
    { name: 'Google Public DNS', url: 'https://dns.google/resolve' },
    { name: 'Cloudflare DNS', url: 'https://cloudflare-dns.com/dns-query' }
  ];

  static typeNames = {
    1: 'A',
    2: 'NS',
    5: 'CNAME',
    6: 'SOA',
    12: 'PTR',
    15: 'MX',
    16: 'TXT',
    28: 'AAAA',
    33: 'SRV',
    257: 'CAA'
  };

  static statusNames = {
    0: 'NOERROR',
    1: 'FORMERR',
    2: 'SERVFAIL',
    3: 'NXDOMAIN',
    4: 'NOTIMP',
    5: 'REFUSED'
  };

  static controller = null;

  static handleKeydown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.lookup();
    }
  }

  static async lookup() {
    const message = document.getElementById('dns-message');
    const button = document.getElementById('dns-query-button');
    const resultsElement = document.getElementById('dns-results');
    let controller = null;

    try {
      const domain = this.normalizeDomain(document.getElementById('dns-domain-input').value);
      const type = document.getElementById('dns-record-type').value;

      if (this.controller) this.controller.abort();
      controller = new AbortController();
      this.controller = controller;
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      message.className = 'mb-2';
      message.textContent = `Checking ${type} propagation for ${domain}...`;
      button.disabled = true;
      resultsElement.style.display = 'none';

      let results;
      try {
        results = await Promise.all(this.resolvers.map(async resolver => {
          try {
            const response = await this.query(resolver.url, domain, type, controller.signal);
            return { resolver: resolver.name, response };
          } catch (error) {
            if (error.name === 'AbortError') throw error;
            return { resolver: resolver.name, error: error.message };
          }
        }));
      } finally {
        clearTimeout(timeoutId);
      }

      const comparison = this.compare(results);
      this.render(domain, type, results, comparison);

      message.className = comparison.consistent ? 'mb-2 success' : 'mb-2 error';
      message.textContent = comparison.message;
    } catch (error) {
      if (this.controller !== controller) return;

      message.className = 'mb-2 error';
      message.textContent = error.name === 'AbortError'
        ? 'The DNS checks timed out. Please try again.'
        : error.message;
      resultsElement.style.display = 'none';
    } finally {
      if (this.controller === controller) {
        button.disabled = false;
        this.controller = null;
      }
    }
  }

  static async query(resolverUrl, domain, type, signal) {
    const params = new URLSearchParams({ name: domain, type });
    const response = await fetch(`${resolverUrl}?${params}`, {
      headers: { Accept: 'application/dns-json' },
      cache: 'no-store',
      signal
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  static normalizeDomain(input) {
    let value = input.trim();
    if (!value) throw new Error('Please enter a domain.');

    try {
      const url = new URL(value.includes('://') ? value : `http://${value}`);
      value = url.hostname;
    } catch (error) {
      throw new Error('Please enter a valid domain, for example example.com.');
    }

    value = value.toLowerCase().replace(/\.$/, '');
    if (!value || value.length > 253) throw new Error('Please enter a valid domain.');

    const valid = value.split('.').every(label =>
      label.length > 0 && label.length <= 63 &&
      /^[a-z0-9_-]+$/i.test(label) &&
      !label.startsWith('-') && !label.endsWith('-')
    );
    if (!valid) throw new Error('Please enter a valid domain, for example example.com.');

    return value;
  }

  static compare(results) {
    const signatures = results.map(result => {
      if (result.error) return `ERROR:${result.error}`;
      if (result.response.Status !== 0) return `STATUS:${result.response.Status}`;

      return (result.response.Answer || [])
        .map(record => `${record.type}:${record.data}`)
        .sort()
        .join('|');
    });

    const allSuccessful = results.every(result => !result.error && result.response.Status === 0);
    const consistent = allSuccessful && new Set(signatures).size === 1;

    if (consistent) {
      return {
        consistent: true,
        message: `Propagation is consistent across ${results.length}/${results.length} resolvers.`
      };
    }

    const completed = results.filter(result => !result.error).length;
    return {
      consistent: false,
      message: `DNS results differ or could not be confirmed (${completed}/${results.length} resolvers responded).`
    };
  }

  static render(domain, queryType, results, comparison) {
    const body = document.getElementById('dns-records-body');
    body.replaceChildren();

    results.forEach(result => {
      const status = result.error
        ? 'ERROR'
        : (this.statusNames[result.response.Status] || `STATUS ${result.response.Status}`);
      const answers = result.response?.Answer || [];

      if (!answers.length) {
        this.appendRow(body, [result.resolver, status, queryType, '—', result.error || 'No record']);
        return;
      }

      answers.forEach(record => {
        this.appendRow(body, [
          result.resolver,
          status,
          this.typeNames[record.type] || String(record.type),
          `${record.TTL}s`,
          record.data
        ]);
      });
    });

    const checkedAt = new Date().toLocaleString();
    document.getElementById('dns-summary').textContent =
      `Domain: ${domain} | Type: ${queryType} | Checked: ${checkedAt} | ${comparison.consistent ? 'Consistent' : 'Difference detected'}`;

    const raw = {
      domain,
      type: queryType,
      checkedAt: new Date().toISOString(),
      results
    };
    document.getElementById('dns-raw-output').value = JSON.stringify(raw, null, 2);
    document.getElementById('dns-results').style.display = 'block';
  }

  static appendRow(body, values) {
    const row = document.createElement('tr');
    values.forEach(value => {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.appendChild(cell);
    });
    body.appendChild(row);
  }

  static clear() {
    if (this.controller) this.controller.abort();
    this.controller = null;
    document.getElementById('dns-query-button').disabled = false;
    document.getElementById('dns-domain-input').value = '';
    document.getElementById('dns-record-type').value = 'A';
    document.getElementById('dns-message').textContent = '';
    document.getElementById('dns-message').className = 'mb-2';
    document.getElementById('dns-records-body').replaceChildren();
    document.getElementById('dns-raw-output').value = '';
    document.getElementById('dns-results').style.display = 'none';
  }

  static async copyJson() {
    const output = document.getElementById('dns-raw-output').value;
    if (!output) return;

    const message = document.getElementById('dns-message');
    try {
      await navigator.clipboard.writeText(output);
      message.className = 'mb-2 success';
      message.textContent = 'Copied JSON to clipboard.';
    } catch (error) {
      message.className = 'mb-2 error';
      message.textContent = 'Could not copy to the clipboard.';
    }
  }
}
