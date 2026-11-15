/*
 * SLEEP_LAB core logic: pure functions with no DOM access, shared by the app
 * (window.SleepCore) and the unit tests (require). Times are 'HH:MM' strings,
 * durations are minutes, dates are 'YYYY-MM-DD' keys in local time.
 *
 * A diary entry is keyed by the MORNING it describes: the night from Sunday to
 * Monday is stored under Monday's date.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SleepCore = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DAY = 1440;

  // ---------- small helpers ----------
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function mod(a, n) { return ((a % n) + n) % n; }
  function round15(min) { return Math.round(min / 15) * 15; }
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
  function mean(arr) { return arr.length ? arr.reduce(function (s, x) { return s + x; }, 0) / arr.length : null; }
  function sd(arr) {
    if (arr.length < 2) return null;
    var m = mean(arr);
    return Math.sqrt(arr.reduce(function (s, x) { return s + (x - m) * (x - m); }, 0) / arr.length);
  }

  // ---------- clock times ----------
  function parseHM(s) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(String(s == null ? '' : s).trim());
    if (!m) return null;
    var h = +m[1], mi = +m[2];
    if (h > 23 || mi > 59) return null;
    return h * 60 + mi;
  }
  function fmtHM(min) {
    var v = mod(Math.round(min), DAY);
    return pad(Math.floor(v / 60)) + ':' + pad(v % 60);
  }

  // ---------- calendar dates (timezone-proof: day numbers via UTC) ----------
  function dateKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseKey(key) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || ''));
    if (!m) return null;
    var y = +m[1], mo = +m[2], d = +m[3];
    var dt = new Date(Date.UTC(y, mo - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
    return { y: y, m: mo, d: d };
  }
  function isKey(key) { return parseKey(key) !== null; }
  function dayNumber(key) {
    var p = parseKey(key);
    if (!p) throw new Error('Invalid date key: ' + key);
    return Math.round(Date.UTC(p.y, p.m - 1, p.d) / 864e5);
  }
  function keyFromDayNumber(n) {
    var dt = new Date(n * 864e5);
    return dt.getUTCFullYear() + '-' + pad(dt.getUTCMonth() + 1) + '-' + pad(dt.getUTCDate());
  }
  function addDays(key, n) { return keyFromDayNumber(dayNumber(key) + n); }
  function daysBetween(a, b) { return dayNumber(b) - dayNumber(a); }
  function weekday(key) { return mod(dayNumber(key) + 4, 7); } // 0 = Sunday (1970-01-01 was a Thursday)

  // ---------- diary ----------
  var LIMITS = { sol: [0, 600], waso: [0, 720], wakes: [0, 30], nap: [0, 600], rested: [1, 5] };

  /*
   * Derived values for one night. Clock times are placed on a line that starts at
   * noon of the previous day, so a night that crosses midnight stays continuous:
   * 23:00 -> 660, 03:00 -> 900, 07:00 -> 1140.
   */
  function entryMetrics(e) {
    if (!e) return null;
    var bed = parseHM(e.bed), fw = parseHM(e.finalWake);
    var oob = parseHM(e.outOfBed != null && e.outOfBed !== '' ? e.outOfBed : e.finalWake);
    if (bed === null || fw === null || oob === null) return null;
    var bedRel = mod(bed - 720, DAY);
    var span = mod(fw - bed, DAY);                  // bed -> final awakening
    var fwRel = bedRel + span;
    var oobRel = fwRel + mod(oob - fw, DAY);
    var sol = clamp(Number(e.sol) || 0, 0, span);
    var waso = clamp(Number(e.waso) || 0, 0, Math.max(0, span - sol));
    var tib = oobRel - bedRel;
    var tst = Math.max(0, span - sol - waso);
    var onsetRel = bedRel + sol;
    return {
      bedRel: bedRel, onsetRel: onsetRel, fwRel: fwRel, oobRel: oobRel,
      midRel: onsetRel + (fwRel - onsetRel) / 2,
      tib: tib, tst: tst, se: tib > 0 ? tst / tib : null,
      sol: sol, waso: waso, wakes: Number(e.wakes) || 0, nap: Number(e.nap) || 0,
      ema: oobRel - fwRel, rested: e.rested == null ? null : Number(e.rested), free: !!e.free
    };
  }

  /* Returns a list of problem codes; an empty list means the entry is usable. */
  function validateEntry(e) {
    var errors = [];
    if (!e || parseHM(e.bed) === null || parseHM(e.finalWake) === null || parseHM(e.outOfBed) === null) {
      return ['missing'];
    }
    var bed = parseHM(e.bed), fw = parseHM(e.finalWake), oob = parseHM(e.outOfBed);
    var span = mod(fw - bed, DAY);
    if (mod(oob - fw, DAY) > 6 * 60) errors.push('outOfBedBeforeWake');
    if (span < 60 || span > 16 * 60) errors.push('nightLength');
    if ((Number(e.sol) || 0) + (Number(e.waso) || 0) > span) errors.push('awakeTooLong');
    return errors;
  }

  function sanitizeEntry(e) {
    if (!e || typeof e !== 'object') return null;
    var out = {};
    var keys = ['bed', 'finalWake', 'outOfBed'];
    for (var i = 0; i < keys.length; i++) {
      var v = parseHM(e[keys[i]]);
      if (v === null) return null;
      out[keys[i]] = fmtHM(v);
    }
    Object.keys(LIMITS).forEach(function (k) {
      if (e[k] == null || e[k] === '') return;
      var n = Number(e[k]);
      if (isFinite(n)) out[k] = clamp(Math.round(n), LIMITS[k][0], LIMITS[k][1]);
    });
    ['sol', 'waso', 'wakes', 'nap'].forEach(function (k) { if (out[k] == null) out[k] = 0; });
    out.free = !!e.free;
    return out;
  }

  /* Entries between two keys (inclusive), oldest first, with their metrics. */
  function entriesInRange(diary, fromKey, toKey) {
    var from = dayNumber(fromKey), to = dayNumber(toKey), out = [];
    Object.keys(diary || {}).forEach(function (key) {
      if (!isKey(key)) return;
      var n = dayNumber(key);
      if (n < from || n > to) return;
      var m = entryMetrics(diary[key]);
      if (m) out.push({ key: key, entry: diary[key], m: m });
    });
    out.sort(function (a, b) { return dayNumber(a.key) - dayNumber(b.key); });
    return out;
  }

  /* "Consolidated" night as used in brief behavioural treatment: under 30 minutes
     to fall asleep and under 30 minutes awake during the night. */
  function isConsolidated(m) { return m.sol < 30 && m.waso < 30; }

  function summarize(items) {
    if (!items || !items.length) return null;
    var ms = items.map(function (i) { return i.m; });
    var sumTST = ms.reduce(function (s, m) { return s + m.tst; }, 0);
    var sumTIB = ms.reduce(function (s, m) { return s + m.tib; }, 0);
    var rested = ms.filter(function (m) { return m.rested != null; }).map(function (m) { return m.rested; });
    return {
      n: ms.length,
      avgTST: Math.round(sumTST / ms.length),
      avgTIB: Math.round(sumTIB / ms.length),
      se: sumTIB > 0 ? sumTST / sumTIB : null,
      avgSOL: Math.round(mean(ms.map(function (m) { return m.sol; }))),
      avgWASO: Math.round(mean(ms.map(function (m) { return m.waso; }))),
      avgWakes: Math.round(mean(ms.map(function (m) { return m.wakes; })) * 10) / 10,
      avgRested: rested.length ? Math.round(mean(rested) * 10) / 10 : null,
      consolidated: ms.filter(isConsolidated).length,
      onsetSD: ms.length >= 3 ? Math.round(sd(ms.map(function (m) { return m.onsetRel; }))) : null,
      avgOnset: fmtHM(mean(ms.map(function (m) { return m.onsetRel; })) + 720),
      avgWake: fmtHM(mean(ms.map(function (m) { return m.fwRel; })) + 720)
    };
  }

  /*
   * Sleep Regularity Index (Phillips et al. 2017): the probability of being in the
   * same state (asleep or awake) at two moments 24 h apart, rescaled so that
   * identical days score 100 and random timing scores about 0.
   * From a diary only the main sleep period is known (onset -> final awakening);
   * time awake inside it and naps are not placed in time, so they are ignored.
   */
  function sleepRegularityIndex(items, epochMin) {
    epochMin = epochMin || 5;
    var byDay = {};
    var intervals = [];
    items.forEach(function (i) {
      var base = dayNumber(i.key) * DAY - 720;
      byDay[dayNumber(i.key)] = base;
      intervals.push([base + i.m.onsetRel, base + i.m.fwRel]);
    });
    function asleep(t) {
      for (var k = 0; k < intervals.length; k++) if (t >= intervals[k][0] && t < intervals[k][1]) return true;
      return false;
    }
    var same = 0, total = 0, pairs = 0;
    Object.keys(byDay).forEach(function (d) {
      d = +d;
      if (byDay[d + 1] === undefined) return;
      pairs++;
      for (var t = byDay[d] + epochMin / 2; t < byDay[d] + DAY; t += epochMin) {
        if (asleep(t) === asleep(t + DAY)) same++;
        total++;
      }
    });
    if (!total) return null;
    return { sri: Math.round(200 * same / total - 100), pairs: pairs };
  }

  /* Social jet lag (Wittmann & Roenneberg): mid-sleep on free days minus work days. */
  function socialJetlag(items) {
    var free = items.filter(function (i) { return i.m.free; });
    var work = items.filter(function (i) { return !i.m.free; });
    if (free.length < 2 || work.length < 2) return null;
    var msf = mean(free.map(function (i) { return i.m.midRel; }));
    var msw = mean(work.map(function (i) { return i.m.midRel; }));
    return { minutes: Math.round(Math.abs(msf - msw)), msf: fmtHM(msf + 720), msw: fmtHM(msw + 720), laterOnFree: msf > msw };
  }

  // ---------- 6-week program (sleep window) ----------
  var PROGRAM = {
    FLOOR: 360,           // never less than 6 h in bed (BBTI manual, Troxel 2012)
    CAP: 540,             // stop expanding at 9 h
    STEP: 15,             // weekly titration step (BBTI)
    COMPRESS_STEP: 30,    // gentle mode: shrink time in bed gradually (sleep compression)
    MIN_BASELINE: 5,      // nights needed in the last 7 days to compute a window
    MIN_REVIEW: 4,        // nights needed in a week to adjust it
    WEEKS: 6
  };

  /*
   * Window = average sleep + 30 min (BBTI), at least 6 h and never more than the
   * current time in bed. Gentle mode starts 30 min below the current time in bed
   * and moves toward that target week by week (sleep compression).
   */
  function initialWindow(baseline, mode) {
    var tibR = Math.max(PROGRAM.FLOOR, round15(baseline.avgTIB));
    var target = Math.min(Math.max(PROGRAM.FLOOR, round15(baseline.avgTST + 30)), tibR);
    var win = mode === 'standard' ? target : Math.max(target, tibR - PROGRAM.COMPRESS_STEP);
    return { window: win, target: target, phase: win > target ? 'compress' : 'titrate' };
  }

  /*
   * Weekly adjustment. Titration follows the BBTI rule: if most nights had under
   * 30 min to fall asleep and under 30 min awake, add 15 min; otherwise take 15 min
   * off, never below 6 h. In gentle mode the window first shrinks toward the target
   * (15-30 min a week) unless sleep is already consolidated.
   */
  function weeklyReview(state, week) {
    var win = state.window, phase = state.phase || 'titrate';
    if (!week || week.n < PROGRAM.MIN_REVIEW) return { decision: 'needData', window: win, phase: phase };
    var consolidated = week.consolidated > week.n / 2;
    if (phase === 'compress') {
      if (consolidated) return { decision: 'expand', window: Math.min(PROGRAM.CAP, win + PROGRAM.STEP), phase: 'titrate' };
      var step = Math.min(PROGRAM.COMPRESS_STEP, Math.max(0, win - state.target));
      var nw = win - step;
      return { decision: step > 0 ? 'compress' : 'hold', window: nw, phase: nw <= state.target ? 'titrate' : 'compress' };
    }
    if (consolidated) {
      return win >= PROGRAM.CAP ? { decision: 'holdCap', window: win, phase: 'titrate' }
        : { decision: 'expand', window: win + PROGRAM.STEP, phase: 'titrate' };
    }
    if (win <= PROGRAM.FLOOR) return { decision: 'holdFloor', window: PROGRAM.FLOOR, phase: 'titrate' };
    return { decision: 'reduce', window: Math.max(PROGRAM.FLOOR, win - PROGRAM.STEP), phase: 'titrate' };
  }

  function bedtimeFor(rise, windowMin) { return fmtHM(parseHM(rise) - windowMin); }

  /* 1-based program week from the start date; WEEKS + 1 means finished. */
  function programWeek(startKey, todayKey) {
    return Math.min(PROGRAM.WEEKS + 1, Math.max(1, Math.floor(daysBetween(startKey, todayKey) / 7) + 1));
  }

  // ---------- "My night" planner ----------
  // Gardiner et al. 2023 (Sleep Med Rev): a 107 mg coffee should be had >= 8.8 h before
  // bed and 217.5 mg >= 13.2 h before, to avoid losing total sleep time.
  var CAFFEINE_HOURS = { one: 8.8, two: 13.2 };
  // Caffeine half-life relative to ~5-6 h: oral contraceptives ~1.5x (Abernethy 1985),
  // smokers ~0.6x (Parsons 1978), late pregnancy ~2x (Knutti 1982). Scaling the cutoff
  // by the half-life keeps the same caffeine left at bedtime. An estimate, labelled so.
  var HALF_LIFE_FACTOR = { contraceptive: 1.5, smoker: 0.6, pregnant: 2.0 };

  function caffeineCutoffHours(p) {
    var base = CAFFEINE_HOURS[p && p.caffeine];
    if (!base) return null;
    var f = 1;
    if (p.pregnant) f *= HALF_LIFE_FACTOR.pregnant;
    else if (p.contraceptive) f *= HALF_LIFE_FACTOR.contraceptive;
    if (p.smoker) f *= HALF_LIFE_FACTOR.smoker;
    return Math.round(base * f * 10) / 10;
  }

  /*
   * Evening plan from wake time and sleep need. Anchors: morning light in the first
   * hour; dim lights from 3 h before bed (Brown 2022); warm bath or shower 1-2 h
   * before (Haghayegh 2019); hard exercise finished 4 h before (Leota 2025);
   * dinner ~3 h before (weak evidence).
   */
  function planNight(p) {
    var wake = parseHM(p.wake);
    if (wake === null) return null;
    var bed = p.bedtime != null ? parseHM(p.bedtime) : mod(wake - (p.need || 480) - (p.latency || 0), DAY);
    if (bed === null) return null;
    var awake = mod(bed - wake, DAY);
    var items = [];
    function add(id, at, extra) {
      var offset = mod(at - wake, DAY);
      var it = { id: id, time: fmtHM(at), offset: offset };
      Object.keys(extra || {}).forEach(function (k) { it[k] = extra[k]; });
      items.push(it);
    }
    add('wake', wake);
    add('light', wake, { until: fmtHM(wake + 60) });
    var cut = caffeineCutoffHours(p);
    if (cut !== null) {
      if (cut * 60 >= awake) items.push({ id: 'caffeine', none: true, hours: cut, offset: 1 });
      else add('caffeine', bed - Math.round(cut * 60), { hours: cut });
    }
    if (awake > 240) add('exercise', bed - 240);
    if (awake > 180) { add('dinner', bed - 180); add('dim', bed - 180); }
    if (awake > 120) add('bath', bed - 120, { until: fmtHM(bed - 60) });
    add('bed', bed);
    var order = ['wake', 'light', 'caffeine', 'exercise', 'dinner', 'dim', 'bath', 'bed'];
    items.sort(function (a, b) { return a.offset - b.offset || order.indexOf(a.id) - order.indexOf(b.id); });
    return { bedtime: fmtHM(bed), wake: fmtHM(wake), awake: awake, caffeineHours: cut, items: items };
  }

  // ---------- calendar export (.ics) ----------
  function icsEscape(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  }
  function utf8Length(ch) {
    var c = ch.codePointAt(0);
    return c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
  }
  /* RFC 5545: lines longer than 75 octets are folded with CRLF + space. */
  function icsFold(line) {
    var out = '', count = 0;
    Array.from(line).forEach(function (ch) {
      var len = utf8Length(ch);
      if (count + len > 75) { out += '\r\n '; count = 1; }
      out += ch; count += len;
    });
    return out;
  }
  function icsDateTime(key, hm) { return key.replace(/-/g, '') + 'T' + hm.replace(':', '') + '00'; }

  /*
   * Daily repeating reminders in floating local time, each with an alert at the
   * event time. events: [{ uid, title, time: 'HH:MM', minutes, description }].
   */
  function buildICS(events, opts) {
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SLEEP_LAB//My Night//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
    events.forEach(function (ev) {
      var start = parseHM(ev.time);
      var endMin = start + (ev.minutes || 15);
      var endKey = endMin >= DAY ? addDays(opts.startKey, 1) : opts.startKey;
      lines.push('BEGIN:VEVENT');
      lines.push('UID:' + ev.uid);
      lines.push('DTSTAMP:' + opts.stamp);
      lines.push('DTSTART:' + icsDateTime(opts.startKey, ev.time));
      lines.push('DTEND:' + icsDateTime(endKey, fmtHM(endMin)));
      lines.push('RRULE:FREQ=DAILY');
      lines.push('SUMMARY:' + icsEscape(ev.title));
      if (ev.description) lines.push('DESCRIPTION:' + icsEscape(ev.description));
      lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEscape(ev.title), 'TRIGGER:PT0M', 'END:VALARM');
      lines.push('END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    return lines.map(icsFold).join('\r\n') + '\r\n';
  }

  // ---------- initial check ----------
  // Any of these keeps the sleep window off (exclusions used in the HABIT trial, the
  // BBTI manual and Somryst's instructions): the person follows the gentle route.
  var GATE_FLAGS = ['snore', 'drowsy', 'riskyJob', 'shift', 'pregnant', 'seizure', 'mood', 'parasomnia', 'falls', 'shortTIB'];
  // Flags that also show a one-line notice.
  var NOTE_FLAGS = { snore: 'apnea', drowsy: 'drowsy', rls: 'rls', mood: 'crisis' };
  var ALL_FLAGS = GATE_FLAGS.concat(['rls']);

  function routeCheck(a) {
    a = a || {};
    var flags = (a.flags || []).filter(function (f) { return ALL_FLAGS.indexOf(f) !== -1; });
    var gates = GATE_FLAGS.filter(function (f) { return flags.indexOf(f) !== -1; });
    var notes = Object.keys(NOTE_FLAGS).filter(function (f) { return flags.indexOf(f) !== -1; })
      .map(function (f) { return NOTE_FLAGS[f]; });
    var insomnia = (a.main === 'onset' || a.main === 'maintenance') && a.nights === 'most';
    var route = !insomnia ? 'optimize' : (gates.length ? 'gentle' : 'reset');
    return { route: route, acute: route === 'reset' && a.duration === 'lt3m', gates: gates, notes: notes, senior: a.senior === true };
  }

  // ---------- stored data ----------
  var NIGHT_DEFAULTS = { wake: '07:00', need: 480, latency: 15, caffeine: 'one', smoker: false, contraceptive: false, pregnant: false };

  function emptyData() {
    return {
      v: 1,
      profile: { senior: null },
      check: null,
      diary: {},
      program: null,
      night: JSON.parse(JSON.stringify(NIGHT_DEFAULTS)),
      closeDay: null,
      meta: { persistAsked: false }
    };
  }

  function pick(v, allowed, fallback) { return allowed.indexOf(v) !== -1 ? v : fallback; }
  function num(v, lo, hi, fallback) {
    var n = Number(v);
    return isFinite(n) && v !== null && v !== '' ? clamp(Math.round(n), lo, hi) : fallback;
  }
  function str(v, max) { return typeof v === 'string' ? v.slice(0, max) : ''; }

  /* Rebuilds a valid data object from anything (stored, imported or corrupted). */
  function sanitizeData(raw) {
    var d = emptyData();
    if (!raw || typeof raw !== 'object') return d;

    if (raw.profile && typeof raw.profile === 'object') {
      d.profile.senior = typeof raw.profile.senior === 'boolean' ? raw.profile.senior : null;
    }

    if (raw.diary && typeof raw.diary === 'object') {
      Object.keys(raw.diary).forEach(function (k) {
        if (!isKey(k)) return;
        var e = sanitizeEntry(raw.diary[k]);
        if (e) d.diary[k] = e;
      });
    }

    var c = raw.check;
    if (c && typeof c === 'object' && c.answers && typeof c.answers === 'object') {
      var a = c.answers;
      var answers = {
        main: pick(a.main, ['good', 'onset', 'maintenance', 'unrefreshed'], 'good'),
        nights: pick(a.nights, ['few', 'most'], 'few'),
        duration: pick(a.duration, ['lt3m', 'gt3m'], 'gt3m'),
        senior: a.senior === true,
        flags: Array.isArray(a.flags) ? a.flags.filter(function (f) { return ALL_FLAGS.indexOf(f) !== -1; }) : []
      };
      d.check = { at: str(c.at, 40), answers: answers };
    }

    var p = raw.program;
    if (p && typeof p === 'object') {
      var phase = pick(p.phase, ['baseline', 'active', 'done'], null);
      if (phase && isKey(p.baselineStart)) {
        var prog = { phase: phase, baselineStart: p.baselineStart };
        if (phase !== 'baseline') {
          if (!isKey(p.start) || parseHM(p.rise) === null) prog = null;
          else {
            prog.start = p.start;
            prog.rise = fmtHM(parseHM(p.rise));
            prog.mode = pick(p.mode, ['gentle', 'standard'], 'gentle');
            prog.window = num(p.window, PROGRAM.FLOOR, PROGRAM.CAP, PROGRAM.FLOOR);
            prog.target = num(p.target, PROGRAM.FLOOR, PROGRAM.CAP, prog.window);
            prog.wphase = pick(p.wphase, ['compress', 'titrate'], 'titrate');
            prog.lastReview = isKey(p.lastReview) ? p.lastReview : p.start;
            prog.baseline = p.baseline && typeof p.baseline === 'object' ? {
              avgTST: num(p.baseline.avgTST, 0, 1440, 0), avgTIB: num(p.baseline.avgTIB, 0, 1440, 0),
              avgSOL: num(p.baseline.avgSOL, 0, 600, 0), avgWASO: num(p.baseline.avgWASO, 0, 720, 0),
              se: isFinite(Number(p.baseline.se)) ? clamp(Number(p.baseline.se), 0, 1) : null, n: num(p.baseline.n, 0, 60, 0)
            } : null;
            prog.reviews = Array.isArray(p.reviews) ? p.reviews.filter(function (r) { return r && isKey(r.at); }).slice(-60).map(function (r) {
              return {
                at: r.at, n: num(r.n, 0, 60, 0), consolidated: num(r.consolidated, 0, 60, 0),
                from: num(r.from, 0, 1440, 0), to: num(r.to, 0, 1440, 0),
                decision: pick(r.decision, ['needData', 'expand', 'compress', 'hold', 'holdCap', 'holdFloor', 'reduce', 'keep'], 'hold')
              };
            }) : [];
          }
        }
        d.program = prog;
      }
    }

    if (raw.night && typeof raw.night === 'object') {
      var n = raw.night;
      d.night = {
        wake: parseHM(n.wake) !== null ? fmtHM(parseHM(n.wake)) : NIGHT_DEFAULTS.wake,
        need: num(n.need, 360, 600, NIGHT_DEFAULTS.need),
        latency: num(n.latency, 0, 120, NIGHT_DEFAULTS.latency),
        caffeine: pick(n.caffeine, ['none', 'one', 'two'], NIGHT_DEFAULTS.caffeine),
        smoker: n.smoker === true, contraceptive: n.contraceptive === true, pregnant: n.pregnant === true
      };
    }

    if (raw.closeDay && typeof raw.closeDay === 'object' && isKey(raw.closeDay.at)) {
      d.closeDay = { at: raw.closeDay.at, todos: str(raw.closeDay.todos, 2000), worries: str(raw.closeDay.worries, 2000) };
    }

    if (raw.meta && typeof raw.meta === 'object') d.meta.persistAsked = raw.meta.persistAsked === true;
    return d;
  }

  function diaryToCSV(diary) {
    var rows = [['date', 'bed', 'minutes_to_fall_asleep', 'awakenings', 'minutes_awake_at_night', 'final_wake', 'out_of_bed',
      'nap_minutes', 'rested_1_5', 'free_day', 'time_in_bed_min', 'total_sleep_min', 'sleep_efficiency_pct']];
    Object.keys(diary || {}).filter(isKey).sort().forEach(function (k) {
      var e = diary[k], m = entryMetrics(e);
      if (!m) return;
      rows.push([k, e.bed, e.sol, e.wakes, e.waso, e.finalWake, e.outOfBed, e.nap, e.rested == null ? '' : e.rested,
        e.free ? 1 : 0, m.tib, m.tst, m.se == null ? '' : Math.round(m.se * 100)]);
    });
    return rows.map(function (r) { return r.join(','); }).join('\r\n') + '\r\n';
  }

  return {
    DAY: DAY, LIMITS: LIMITS, PROGRAM: PROGRAM, CAFFEINE_HOURS: CAFFEINE_HOURS, HALF_LIFE_FACTOR: HALF_LIFE_FACTOR,
    GATE_FLAGS: GATE_FLAGS, ALL_FLAGS: ALL_FLAGS, NIGHT_DEFAULTS: NIGHT_DEFAULTS,
    pad: pad, mod: mod, round15: round15, parseHM: parseHM, fmtHM: fmtHM,
    dateKey: dateKey, isKey: isKey, dayNumber: dayNumber, addDays: addDays, daysBetween: daysBetween, weekday: weekday,
    entryMetrics: entryMetrics, validateEntry: validateEntry, sanitizeEntry: sanitizeEntry, entriesInRange: entriesInRange,
    isConsolidated: isConsolidated, summarize: summarize, sleepRegularityIndex: sleepRegularityIndex, socialJetlag: socialJetlag,
    initialWindow: initialWindow, weeklyReview: weeklyReview, bedtimeFor: bedtimeFor, programWeek: programWeek,
    caffeineCutoffHours: caffeineCutoffHours, planNight: planNight,
    buildICS: buildICS, icsFold: icsFold, routeCheck: routeCheck,
    emptyData: emptyData, sanitizeData: sanitizeData, diaryToCSV: diaryToCSV
  };
});
