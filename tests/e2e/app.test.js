'use strict';
// End-to-end tests in headless Chromium. Run: npm run test:e2e
// Every request outside the local server is blocked, so the app must work without CDNs.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright');
const { start } = require('../helpers/server');
const C = require('../../js/sleep-core.js');

let server, browser;
test.before(async () => { server = await start(); browser = await chromium.launch(); });
test.after(async () => { await browser.close(); await server.close(); });

async function open(opts = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, locale: opts.locale || 'en-US', serviceWorkers: 'block',
    reducedMotion: opts.reducedMotion || 'no-preference', acceptDownloads: true
  });
  await ctx.route('**/*', (r) => (r.request().url().startsWith(server.url) ? r.continue() : r.abort()));
  if (opts.blockGsap) await ctx.route('**/vendor/gsap/**', (r) => r.abort());
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (d) => d.accept());
  if (opts.time) await page.clock.install({ time: opts.time });
  const seed = { data: opts.data || null, settings: opts.settings || null };
  await page.addInitScript((s) => {
    if (sessionStorage.getItem('seeded')) return;
    if (s.data) localStorage.setItem('sleepLabData', JSON.stringify(s.data));
    if (s.settings) localStorage.setItem('sleepLabSettings', JSON.stringify(s.settings));
    sessionStorage.setItem('seeded', '1');
  }, seed);
  await page.goto(server.url + (opts.path || '/'), { waitUntil: 'load' });
  return { ctx, page, errors };
}
const appData = (page) => page.evaluate(() => window.SleepApp.getData());
const goSleep = (page) => page.click('#bottom-nav [data-view="sleep"]');

function nights(endKey, count, entry) {
  const diary = {};
  for (let i = count - 1; i >= 0; i--) diary[C.addDays(endKey, -i)] = Object.assign({ nap: 0, wakes: 1, free: false, rested: 3 }, entry);
  return diary;
}
function withData(over) { return Object.assign(C.emptyData(), over); }

test('content is visible with every third-party request blocked, using the local libraries', async () => {
  const { ctx, page, errors } = await open();
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('anim')), true, 'local GSAP should load');
  await page.evaluate(() => document.querySelector('#tools .fade-up').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(1500);
  const opacity = await page.evaluate(() => getComputedStyle(document.querySelector('#tools .fade-up')).opacity);
  assert.equal(Number(opacity), 1);
  const iconFont = await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('900 16px "Font Awesome 6 Free"'); });
  assert.equal(iconFont, true, 'Font Awesome should come from /vendor');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('content stays visible when the animation library cannot load', async () => {
  const { ctx, page } = await open({ blockGsap: true });
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('anim')), false);
  const hidden = await page.evaluate(() => [...document.querySelectorAll('.fade-up')]
    .filter((e) => e.offsetParent && Number(getComputedStyle(e).opacity) < 1).length);
  assert.equal(hidden, 0);
  await ctx.close();
});

test('first visit follows the phone language; a saved choice wins', async () => {
  let s = await open({ locale: 'es-MX' });
  assert.equal(await s.page.evaluate(() => document.documentElement.lang), 'es');
  assert.equal((await s.page.textContent('#bottom-nav [data-view="sleep"] span')).trim(), 'Mi sueño');
  await s.ctx.close();
  s = await open({ locale: 'en-US' });
  assert.equal(await s.page.evaluate(() => document.documentElement.lang), 'en');
  await s.ctx.close();
  s = await open({ locale: 'es-MX', settings: { version: 2, language: 'en' } });
  assert.equal(await s.page.evaluate(() => document.documentElement.lang), 'en');
  await s.ctx.close();
});

test('language and night-mode buttons live in the top bar', async () => {
  const { ctx, page } = await open();
  assert.equal(await page.locator('.fab-container').count(), 0);
  await page.click('nav #langToggleBtn');
  assert.equal(await page.evaluate(() => document.documentElement.lang), 'es');
  assert.equal((await page.textContent('#langToggleBtn')).trim(), 'EN');
  await page.click('nav .hdr-btn[aria-label="Toggle Night Mode"]');
  assert.equal(await page.evaluate(() => document.body.classList.contains('night-mode')), true);
  await ctx.close();
});

test('check: insomnia without safety flags leads to the 6-week program', async () => {
  const { ctx, page, errors } = await open();
  assert.match(await page.textContent('#home-sleep-cta'), /Start the check/);
  await goSleep(page);
  await page.click('[data-sl="check-open"]');
  await page.click('[data-sl="check-answer"][data-v="onset"]');
  await page.click('[data-sl="check-answer"][data-v="most"]');
  await page.click('[data-sl="check-answer"][data-v="gt3m"]');
  await page.click('[data-sl="check-answer"][data-v="false"]');
  await page.click('[data-sl="check-finish"]');
  assert.match(await page.textContent('#sl-modal'), /Reset route/);
  await page.click('.sl-sheet-body [data-sl="modal-close"]');
  await page.click('[data-sl="program-baseline"]');
  const d = await appData(page);
  assert.equal(d.check.answers.main, 'onset');
  assert.equal(d.program.phase, 'baseline');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('check: a safety flag selects the gentle route and shows the notices', async () => {
  const { ctx, page } = await open();
  await goSleep(page);
  await page.click('[data-sl="check-open"]');
  await page.click('[data-sl="check-answer"][data-v="maintenance"]');
  await page.click('[data-sl="check-answer"][data-v="most"]');
  await page.click('[data-sl="check-answer"][data-v="gt3m"]');
  await page.click('[data-sl="check-answer"][data-v="true"]');
  await page.check('[data-sl-flag="snore"]');
  await page.check('[data-sl-flag="mood"]');
  await page.click('[data-sl="check-finish"]');
  const text = await page.textContent('#sl-modal');
  assert.match(text, /Gentle route/);
  assert.match(text, /sleep apnea/);
  assert.match(text, /988/);
  assert.match(text, /800 911 2000/);
  await page.click('.sl-sheet-body [data-sl="modal-close"]');
  assert.equal(await page.locator('[data-sl="program-baseline"]').count(), 0, 'no sleep window on the gentle route');
  await ctx.close();
});

test('diary: saves a night and rejects impossible times', async () => {
  const { ctx, page } = await open();
  await goSleep(page);
  await page.click('.sl-card [data-sl="diary-open"]');
  await page.fill('[data-sl-time="bed"]', '23:30');
  await page.click('[data-sl="chip"][data-field="sol"][data-v="30"]');
  await page.fill('[data-sl-time="finalWake"]', '06:30');
  await page.fill('[data-sl-time="outOfBed"]', '06:15');
  await page.click('[data-sl="diary-save"]');
  assert.match(await page.textContent('.sl-error'), /before your final awakening/);
  await page.fill('[data-sl-time="outOfBed"]', '06:45');
  await page.click('[data-sl="diary-save"]');
  const today = await page.evaluate(() => window.SleepCore.dateKey(new Date()));
  const e = (await appData(page)).diary[today];
  assert.equal(e.bed, '23:30');
  assert.equal(e.sol, 30);
  assert.equal(e.outOfBed, '06:45');
  assert.match(await page.textContent('#sl-root'), /You slept/);
  await ctx.close();
});

test('program: window from the logging week, then a weekly review', async () => {
  const day0 = '2026-11-15';
  const data = withData({
    check: { at: 'x', answers: { main: 'onset', nights: 'most', duration: 'gt3m', senior: false, flags: [] } },
    program: { phase: 'baseline', baselineStart: '2026-11-08' },
    // 23:00 -> 06:15, 45 min to fall asleep, 40 min awake, up at 06:30: 350 min asleep, 450 in bed
    diary: nights(day0, 7, { bed: '23:00', sol: 45, waso: 40, finalWake: '06:15', outOfBed: '06:30' })
  });
  const { ctx, page, errors } = await open({ data, time: new Date(day0 + 'T08:00:00') });
  await goSleep(page);
  await page.click('[data-sl="program-start-open"]');
  assert.equal(await page.inputValue('[data-sl-time="rise"]'), '06:30');
  // gentle (default): start 30 min below the current 7 h 30 min in bed
  assert.match(await page.textContent('#sl-preview'), /11:30\sPM/);
  await page.click('[data-sl="program-start"]');
  assert.equal((await appData(page)).program.phase, 'baseline', 'needs the safety confirmation');
  await page.check('#sl-safety');
  await page.click('[data-sl="program-start"]');
  let p = (await appData(page)).program;
  assert.deepEqual([p.phase, p.window, p.target, p.wphase], ['active', 420, 375, 'compress']);
  await page.click('.sl-sheet-head [data-sl="modal-close"]');

  // A week of consolidated nights -> add 15 minutes and switch to titration
  await page.evaluate(() => {
    const C = window.SleepCore, raw = JSON.parse(localStorage.getItem('sleepLabData'));
    for (let i = 0; i < 7; i++) raw.diary[C.addDays('2026-11-16', i)] = { bed: '23:30', sol: 10, wakes: 1, waso: 10, finalWake: '06:20', outOfBed: '06:30', nap: 0, free: false };
    localStorage.setItem('sleepLabData', JSON.stringify(raw));
  });
  await page.clock.setSystemTime(new Date('2026-11-22T08:00:00'));
  await page.reload({ waitUntil: 'load' });
  await goSleep(page);
  await page.click('[data-sl="review-open"]');
  assert.match(await page.textContent('#sl-modal'), /Add 15 minutes/);
  await page.click('[data-sl="review-apply"]');
  p = (await appData(page)).program;
  assert.deepEqual([p.window, p.wphase, p.lastReview, p.reviews.length], [435, 'titrate', '2026-11-22', 1]);
  assert.match(await page.textContent('#home-sleep-cta'), /Week 2 of 6/);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('My night: evening times and a daily calendar file', async () => {
  const data = withData({ night: { wake: '07:00', need: 480, latency: 15, caffeine: 'one', smoker: false, contraceptive: false, pregnant: false } });
  const { ctx, page } = await open({ data });
  await goSleep(page);
  assert.match(await page.textContent('.sl-it-caffeine .sl-time'), /1:57\sPM/);   // 22:45 - 8.8 h
  assert.match(await page.textContent('.sl-it-bed .sl-time'), /10:45\sPM/);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-sl="calendar-night"]')]);
  const ics = fs.readFileSync(await dl.path(), 'utf8');
  assert.match(ics, /RRULE:FREQ=DAILY/);
  assert.match(ics, /DTSTART:\d{8}T224500/);
  assert.match(ics, /SUMMARY:Bedtime/);
  assert.equal(dl.suggestedFilename(), 'sleeplab-mi-noche.ics');
  await ctx.close();
});

test('backup: export, delete everything, restore', async () => {
  const data = withData({ diary: nights('2026-11-10', 3, { bed: '23:00', sol: 20, waso: 10, finalWake: '06:30', outOfBed: '06:45' }) });
  const { ctx, page } = await open({ data });
  await goSleep(page);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-sl="export-json"]')]);
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'sleeplab-')), 'backup.json');
  await dl.saveAs(file);
  assert.equal(JSON.parse(fs.readFileSync(file, 'utf8')).app, 'SLEEP_LAB');
  await page.click('[data-sl="delete-all"]');
  assert.equal(Object.keys((await appData(page)).diary).length, 0);
  await page.setInputFiles('#sl-import-file', file);
  await page.waitForFunction(() => Object.keys(window.SleepApp.getData().diary).length === 3);
  await ctx.close();
});

test('breathing lab: duration and pace change the session and are remembered', async () => {
  const { ctx, page } = await open({ reducedMotion: 'reduce' });
  await page.evaluate(() => window.showView('tools'));
  await page.click('.breath-dur-btn[data-dur="10"]');
  assert.match(await page.textContent('#breathCycleCount'), /0\/60/);
  await page.click('.breath-pace-btn[data-pace="5"]');
  assert.match(await page.textContent('#breathCycleCount'), /0\/50/);
  assert.match(await page.textContent('#breathSummary'), /5 breaths per minute: in 4\.8 s, out 7\.2 s/);
  await page.click('#breath-478');
  assert.equal(await page.isHidden('#breathDurationRow'), true);
  assert.match(await page.textContent('#breathCycleCount'), /0\/4/);
  await page.click('#breath-resonance');
  await page.reload({ waitUntil: 'load' });
  await page.evaluate(() => window.showView('tools'));
  assert.match(await page.textContent('#breathCycleCount'), /0\/50/);
  await ctx.close();
});

test('night tools: dark step-by-step guide, cognitive shuffle and silent pacer', async () => {
  const { ctx, page } = await open();
  await goSleep(page);
  await page.click('[data-sl="cant-open"]');
  assert.equal(await page.locator('.sl-modal-night').count(), 1);
  await page.click('[data-sl="cant-step"][data-arg="2"]');
  await page.click('[data-sl="cant-step"][data-arg="3"]');
  await page.click('[data-sl="shuffle-start"]');
  await page.waitForFunction(() => document.getElementById('sl-word') && document.getElementById('sl-word').textContent !== '…');
  await page.click('[data-sl="pacer-start"]');
  await page.waitForFunction(() => (document.getElementById('sl-pacer-text') || {}).textContent === 'Breathe in');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#sl-modal').count(), 0);
  await ctx.close();
});

test('offline: after one visit the app, its libraries and My Sleep work without a connection', async () => {
  // Real service worker here (no request interception, which would bypass it)
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'en-US', serviceWorkers: 'allow' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(server.url + '/', { waitUntil: 'load' });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(async () => (await caches.keys()).includes('sleeplab-v3'));
  await page.waitForFunction(async () => {
    const cache = await caches.open('sleeplab-v3');
    return !!(await cache.match('/js/sleep-app.js')) && !!(await cache.match('/vendor/fontawesome/webfonts/fa-solid-900.woff2'));
  });
  await ctx.setOffline(true);
  await page.reload({ waitUntil: 'load' });
  assert.equal(await page.evaluate(() => typeof window.SleepCore === 'object' && typeof window.gsap === 'object'), true);
  await goSleep(page);
  assert.match(await page.textContent('#sl-root'), /My Sleep/);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('no script errors in any view, in both languages', async () => {
  const { ctx, page, errors } = await open();
  for (const lang of ['en', 'es']) {
    for (const v of ['home', 'sleep', 'tools', 'learn', 'resources']) {
      await page.evaluate((view) => window.showView(view), v);
      await page.waitForTimeout(100);
    }
    if (lang === 'en') await page.click('#langToggleBtn');
  }
  assert.match(await page.textContent('#sl-root'), /Mi sueño/);
  assert.deepEqual(errors, []);
  await ctx.close();
});
