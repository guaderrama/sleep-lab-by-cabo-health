'use strict';
// The service worker install fails as a whole if any precached file is missing.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');

test('every precached file exists', () => {
  const block = /const PRECACHE_ASSETS = \[([\s\S]*?)\];/.exec(sw);
  assert.ok(block, 'PRECACHE_ASSETS not found');
  const files = [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]).filter((f) => f !== '/');
  assert.ok(files.length >= 10);
  for (const f of files) assert.ok(fs.existsSync(path.join(ROOT, f)), 'missing: ' + f);
});

test('the page loads the same local files the service worker precaches', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  for (const f of ['/vendor/gsap/gsap.min.js', '/vendor/gsap/ScrollTrigger.min.js', '/vendor/fontawesome/css/all.min.css',
    '/css/sleep-app.css', '/js/sleep-core.js', '/js/sleep-app.js']) {
    assert.ok(html.includes(f), 'index.html does not reference ' + f);
    assert.ok(sw.includes("'" + f + "'"), 'sw.js does not precache ' + f);
  }
});
