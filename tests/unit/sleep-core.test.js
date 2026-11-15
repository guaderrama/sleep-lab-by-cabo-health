'use strict';
// Unit tests for js/sleep-core.js (pure logic). Run: npm run test:unit
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../../js/sleep-core.js');

const night = (o) => Object.assign({ bed: '23:00', sol: 15, wakes: 1, waso: 20, finalWake: '06:45', outOfBed: '07:00', nap: 0, rested: 3, free: false }, o);

test('clock helpers wrap around midnight', () => {
  assert.equal(C.parseHM('7:05'), 425);
  assert.equal(C.parseHM('24:00'), null);
  assert.equal(C.parseHM('abc'), null);
  assert.equal(C.fmtHM(-30), '23:30');
  assert.equal(C.fmtHM(1440 + 61), '01:01');
});

test('date keys are timezone-proof and weekdays are right', () => {
  assert.equal(C.addDays('2026-03-07', 2), '2026-03-09');
  assert.equal(C.addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(C.daysBetween('2026-11-01', '2026-11-15'), 14);
  assert.equal(C.weekday('2026-11-15'), 0); // Sunday
  assert.equal(C.weekday('2026-11-13'), 5); // Friday
  assert.equal(C.isKey('2026-02-30'), false);
});

test('night metrics across midnight', () => {
  const m = C.entryMetrics(night());
  assert.equal(m.tib, 8 * 60);            // 23:00 -> 07:00
  assert.equal(m.tst, 465 - 15 - 20);     // 23:00 -> 06:45 minus latency and awake time
  assert.equal(Math.round(m.se * 1000), Math.round(430 / 480 * 1000));
  assert.equal(m.onsetRel, 660 + 15);     // 23:15 on the noon-based line
  assert.equal(m.ema, 15);
});

test('night metrics when going to bed after midnight', () => {
  const m = C.entryMetrics(night({ bed: '01:30', finalWake: '08:00', outOfBed: '08:10', sol: 10, waso: 0 }));
  assert.equal(m.bedRel, 13 * 60 + 30);
  assert.equal(m.tib, 6 * 60 + 40);
  assert.equal(m.tst, 6 * 60 + 30 - 10);
});

test('entry validation catches impossible nights', () => {
  assert.deepEqual(C.validateEntry(night()), []);
  assert.deepEqual(C.validateEntry({ bed: '23:00' }), ['missing']);
  assert.ok(C.validateEntry(night({ outOfBed: '06:00', finalWake: '06:45' })).includes('outOfBedBeforeWake'));
  assert.ok(C.validateEntry(night({ sol: 300, waso: 200 })).includes('awakeTooLong'));
  assert.ok(C.validateEntry(night({ bed: '06:30', finalWake: '06:45' })).includes('nightLength'));
});

test('sanitizeEntry keeps only valid fields and clamps numbers', () => {
  const e = C.sanitizeEntry({ bed: '7:5', finalWake: '15:00', outOfBed: '15:10', sol: '9999', rested: 9, junk: '<script>' });
  assert.equal(e, null); // '7:5' is not a valid time
  const ok = C.sanitizeEntry({ bed: '23:00', finalWake: '07:00', outOfBed: '07:10', sol: '9999', rested: 9, junk: 'x' });
  assert.equal(ok.sol, 600);
  assert.equal(ok.rested, 5);
  assert.equal(ok.junk, undefined);
  assert.equal(ok.waso, 0);
});

function week(startKey, nights, overrides) {
  const diary = {};
  for (let i = 0; i < nights; i++) diary[C.addDays(startKey, i)] = night(overrides ? overrides(i) : {});
  return diary;
}

test('summary averages and consolidated nights', () => {
  const diary = week('2026-11-01', 7, (i) => (i < 3 ? { sol: 45 } : { sol: 10, waso: 10 }));
  const items = C.entriesInRange(diary, '2026-11-01', '2026-11-07');
  const s = C.summarize(items);
  assert.equal(s.n, 7);
  assert.equal(s.consolidated, 4);
  assert.equal(s.avgTIB, 480);
});

test('regularity index: identical days score 100, shifted days score less', () => {
  const same = C.entriesInRange(week('2026-11-01', 8), '2026-11-01', '2026-11-08');
  assert.deepEqual(C.sleepRegularityIndex(same), { sri: 100, pairs: 7 });

  const shifted = week('2026-11-01', 8, (i) => (i % 2 ? { bed: '01:00', finalWake: '09:00', outOfBed: '09:15' } : {}));
  const r = C.sleepRegularityIndex(C.entriesInRange(shifted, '2026-11-01', '2026-11-08'));
  // Alternate nights differ 23:15-01:15 and 06:45-09:00: 255 of 1440 min mismatch
  // -> p = 0.823 -> SRI = 200 * 0.823 - 100 = 65
  assert.equal(r.sri, 65);

  assert.equal(C.sleepRegularityIndex(C.entriesInRange(week('2026-11-01', 1), '2026-11-01', '2026-11-01')), null);
});

test('social jet lag compares free and work days', () => {
  const diary = week('2026-11-02', 7, (i) => (i >= 5 ? { bed: '01:00', finalWake: '09:00', outOfBed: '09:15', free: true, sol: 15, waso: 0 } : { sol: 15, waso: 0 }));
  const sj = C.socialJetlag(C.entriesInRange(diary, '2026-11-02', '2026-11-08'));
  // work mid-sleep ~03:00, free ~05:07 -> about two hours
  assert.ok(sj.minutes >= 110 && sj.minutes <= 135, 'got ' + sj.minutes);
  assert.equal(sj.laterOnFree, true);
});

test('initial window: average sleep + 30 min, at least 6 h, gentle starts 30 min below time in bed', () => {
  const std = C.initialWindow({ avgTST: 330, avgTIB: 480 }, 'standard');
  assert.equal(std.window, 360);   // 330 + 30
  assert.equal(std.phase, 'titrate');
  const floor = C.initialWindow({ avgTST: 240, avgTIB: 480 }, 'standard');
  assert.equal(floor.window, 360); // never under 6 h
  const gentle = C.initialWindow({ avgTST: 330, avgTIB: 480 }, 'gentle');
  assert.equal(gentle.window, 450);
  assert.equal(gentle.target, 360);
  assert.equal(gentle.phase, 'compress');
  const noRestriction = C.initialWindow({ avgTST: 440, avgTIB: 460 }, 'standard');
  assert.equal(noRestriction.window, 465); // capped at current time in bed (rounded)
});

test('weekly review follows the BBTI rule and the 6 h floor', () => {
  const good = { n: 6, consolidated: 5 };
  const bad = { n: 6, consolidated: 2 };
  assert.deepEqual(C.weeklyReview({ window: 360, target: 360, phase: 'titrate' }, good), { decision: 'expand', window: 375, phase: 'titrate' });
  assert.deepEqual(C.weeklyReview({ window: 390, target: 360, phase: 'titrate' }, bad), { decision: 'reduce', window: 375, phase: 'titrate' });
  assert.deepEqual(C.weeklyReview({ window: 360, target: 360, phase: 'titrate' }, bad), { decision: 'holdFloor', window: 360, phase: 'titrate' });
  assert.equal(C.weeklyReview({ window: 540, target: 360, phase: 'titrate' }, good).decision, 'holdCap');
  assert.equal(C.weeklyReview({ window: 400, target: 360, phase: 'titrate' }, { n: 3, consolidated: 3 }).decision, 'needData');
});

test('gentle mode compresses toward the target, then titrates', () => {
  let st = { window: 450, target: 360, phase: 'compress' };
  const bad = { n: 7, consolidated: 1 };
  let r = C.weeklyReview(st, bad);
  assert.deepEqual(r, { decision: 'compress', window: 420, phase: 'compress' });
  r = C.weeklyReview({ window: 375, target: 360, phase: 'compress' }, bad);
  assert.deepEqual(r, { decision: 'compress', window: 360, phase: 'titrate' });
  r = C.weeklyReview({ window: 420, target: 360, phase: 'compress' }, { n: 7, consolidated: 6 });
  assert.deepEqual(r, { decision: 'expand', window: 435, phase: 'titrate' });
});

test('program week counting', () => {
  assert.equal(C.programWeek('2026-11-01', '2026-11-01'), 1);
  assert.equal(C.programWeek('2026-11-01', '2026-11-08'), 2);
  assert.equal(C.programWeek('2026-11-01', '2026-12-31'), 7); // finished
  assert.equal(C.bedtimeFor('06:30', 390), '00:00');
});

test('caffeine cutoff: dose and half-life adjustments', () => {
  assert.equal(C.caffeineCutoffHours({ caffeine: 'one' }), 8.8);
  assert.equal(C.caffeineCutoffHours({ caffeine: 'two' }), 13.2);
  assert.equal(C.caffeineCutoffHours({ caffeine: 'one', contraceptive: true }), 13.2);
  assert.equal(C.caffeineCutoffHours({ caffeine: 'one', smoker: true }), 5.3);
  assert.equal(C.caffeineCutoffHours({ caffeine: 'one', pregnant: true, contraceptive: true }), 17.6);
  assert.equal(C.caffeineCutoffHours({ caffeine: 'none' }), null);
});

test('night plan timeline', () => {
  const p = C.planNight({ wake: '07:00', need: 480, latency: 15, caffeine: 'one' });
  assert.equal(p.bedtime, '22:45');
  const byId = Object.fromEntries(p.items.map((i) => [i.id, i]));
  assert.equal(byId.caffeine.time, '13:57'); // 22:45 - 8.8 h
  assert.equal(byId.dim.time, '19:45');
  assert.equal(byId.bath.time, '20:45');
  assert.equal(byId.bath.until, '21:45');
  assert.equal(byId.exercise.time, '18:45');
  assert.deepEqual(p.items.map((i) => i.id), ['wake', 'light', 'caffeine', 'exercise', 'dinner', 'dim', 'bath', 'bed']);

  const strict = C.planNight({ wake: '07:00', need: 480, latency: 15, caffeine: 'two', pregnant: true });
  assert.equal(strict.items.find((i) => i.id === 'caffeine').none, true);

  const prog = C.planNight({ wake: '06:30', bedtime: '00:15', caffeine: 'none' });
  assert.equal(prog.bedtime, '00:15');
  assert.equal(prog.items.some((i) => i.id === 'caffeine'), false);
});

test('calendar file is valid, daily, folded and escaped', () => {
  const ics = C.buildICS([
    { uid: 'a@sleeplab', title: 'Hora de dormir, sin pantallas; ya', time: '23:50', minutes: 15, description: 'Línea uno\nLínea dos' },
    { uid: 'b@sleeplab', title: 'X'.repeat(120), time: '07:00', minutes: 10 }
  ], { startKey: '2026-11-15', stamp: '20261115T120000Z' });
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n'));
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
  assert.ok(ics.includes('DTSTART:20261115T235000'));
  assert.ok(ics.includes('DTEND:20261116T000500')); // crosses midnight
  assert.ok(ics.includes('RRULE:FREQ=DAILY'));
  assert.ok(ics.includes('SUMMARY:Hora de dormir\\, sin pantallas\\; ya'));
  assert.ok(ics.includes('DESCRIPTION:Línea uno\\nLínea dos'));
  for (const line of ics.split('\r\n')) assert.ok(Buffer.byteLength(line, 'utf8') <= 75, 'line too long: ' + line);
  assert.equal((ics.match(/BEGIN:VALARM/g) || []).length, 2);
});

test('initial check routes', () => {
  assert.equal(C.routeCheck({ main: 'good' }).route, 'optimize');
  assert.equal(C.routeCheck({ main: 'onset', nights: 'few' }).route, 'optimize');
  assert.equal(C.routeCheck({ main: 'unrefreshed', nights: 'most' }).route, 'optimize');
  const reset = C.routeCheck({ main: 'maintenance', nights: 'most', duration: 'gt3m' });
  assert.equal(reset.route, 'reset');
  assert.equal(reset.acute, false);
  assert.equal(C.routeCheck({ main: 'onset', nights: 'most', duration: 'lt3m' }).acute, true);
  const gentle = C.routeCheck({ main: 'onset', nights: 'most', duration: 'gt3m', flags: ['snore', 'rls', 'mood', 'bogus'] });
  assert.equal(gentle.route, 'gentle');
  assert.deepEqual(gentle.gates, ['snore', 'mood']);
  assert.deepEqual(gentle.notes, ['apnea', 'rls', 'crisis']);
  const rlsOnly = C.routeCheck({ main: 'onset', nights: 'most', duration: 'gt3m', flags: ['rls'] });
  assert.equal(rlsOnly.route, 'reset'); // restless legs shows a notice but does not block
});

test('sanitizeData survives garbage and keeps valid parts', () => {
  assert.deepEqual(C.sanitizeData(null), C.emptyData());
  assert.deepEqual(C.sanitizeData('nope'), C.emptyData());
  const d = C.sanitizeData({
    diary: { '2026-11-01': night(), 'bad-key': night(), '2026-11-02': { bed: 'x' } },
    program: { phase: 'active', baselineStart: '2026-10-20', start: '2026-10-27', rise: '6:30', window: 100, reviews: [{ at: '2026-11-03', decision: 'evil' }, { at: 'x' }] },
    night: { wake: '25:00', need: 9999, caffeine: 'lots', smoker: 'yes' },
    check: { answers: { main: 'onset', flags: ['snore', '<img>'] } },
    closeDay: { at: '2026-11-01', todos: 'a'.repeat(5000) }
  });
  assert.deepEqual(Object.keys(d.diary), ['2026-11-01']);
  assert.equal(d.program.rise, '06:30');
  assert.equal(d.program.window, 360);
  assert.equal(d.program.reviews.length, 1);
  assert.equal(d.program.reviews[0].decision, 'hold');
  assert.equal(d.night.wake, '07:00');
  assert.equal(d.night.need, 600);
  assert.equal(d.night.caffeine, 'one');
  assert.equal(d.night.smoker, false);
  assert.deepEqual(d.check.answers.flags, ['snore']);
  assert.equal(d.closeDay.todos.length, 2000);
});

test('diary CSV export', () => {
  const csv = C.diaryToCSV({ '2026-11-02': night(), '2026-11-01': night({ free: true }) });
  const lines = csv.trim().split('\r\n');
  assert.equal(lines.length, 3);
  assert.ok(lines[1].startsWith('2026-11-01,23:00,15,1,20,06:45,07:00,0,3,1,480,430,90'));
});
