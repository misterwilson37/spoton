// =============================================
// bp3-layout.js v2.1.0 — the spacing math for Balanced Placement III.
// Pure functions, no page code, so it can be tested on its own and reused by
// Balanced Placement IV (lines of text are just more boxes).
//
// Words used here:
//   shape        { id, size, kind }  — every shape's box is size × size.
//   arrangement  { dir, groups }     — groups are laid out along the MAIN axis;
//                the shapes inside a group are stacked along the CROSS axis.
//                dir 'columns': groups go left→right, each group stacks top→bottom.
//                dir 'rows':    groups go top→bottom, each group runs left→right.
//   rect         { x, y, w, h }      — the container.
//
// The rule (agreed with Jake, Nov 2026; v2 after the first classroom playthroughs):
//   1. Groups are evenly spaced along the main axis (edges, not centers).
//   2. Shapes inside a group are evenly spaced and the group is centred.
//   3. Every layout gets a QUALITY out of 100 — no pass/fail cliffs:
//        − gaps:    how far the gaps across and the gaps inside stacks drift from each
//                   other (free up to 15%, then up to −30; cramped gaps slope to −40 at half of MIN_GAP)
//        − balance: each mirror pair (a C b, C a b D) loses points in proportion to how
//                   different the two sides are (a near-twin swapped costs a point or two;
//                   a lone shape beside a whole stack costs up to −25)
//   4. The student is judged on the layout THEY built (the one nearest their shapes) and
//      loses only the difference between it and the best layout this rectangle allows.
//   v1 picked whichever layout scored highest instead, so a perfect diamond got re-read as
//   "everything stacked down one side" — that is what Jake saw.
// =============================================

export const VERSION = '2.1.0';
export const GAP_FREE = 0.15;       // gaps within 15% of each other cost nothing
export const GAP_FULL = 0.75;       // …and cost the full GAP_WEIGHT by 75%
export const GAP_WEIGHT = 30;
export const SYM_FREE = 0.15;       // mirror partners within 15% of each other's size are twins
export const SYM_FULL = 0.65;
export const SYM_WEIGHT = 25;       // per mirror pair, at worst
export const CRAMPED = 40;          // gaps at half of MIN_GAP or tighter (sloped from MIN_GAP down)
export const MAX_PENALTY = 45;
export const FULL_MARKS_WITHIN = 2; // layouts this close to the best one count as "full marks"
export const PX_PER_POINT = 1;      // precision: lose 1 point per logical px of average miss
export const MIN_GAP = 14;          // logical units; tighter than this is too cramped to judge

const sum = a => a.reduce((t, v) => t + v, 0);
const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b), 1e-9);

// ---------- enumeration ----------

function* permutations(a) {
    if (a.length <= 1) { yield a.slice(); return; }
    for (let i = 0; i < a.length; i++) {
        const rest = a.slice(0, i).concat(a.slice(i + 1));
        for (const p of permutations(rest)) yield [a[i], ...p];
    }
}

// Every ordered list of ordered groups, each exactly once: a permutation cut
// into consecutive blocks. 5 shapes → 120 × 16 = 1920 per direction.
export function* arrangements(ids) {
    const n = ids.length;
    for (const perm of permutations(ids)) {
        for (let mask = 0; mask < (1 << (n - 1)); mask++) {
            const groups = [[perm[0]]];
            for (let i = 1; i < n; i++) {
                if (mask & (1 << (i - 1))) groups.push([perm[i]]);
                else groups[groups.length - 1].push(perm[i]);
            }
            yield { dir: 'columns', groups };
            yield { dir: 'rows', groups };
        }
    }
}

// ---------- geometry ----------

// v2.1: pieces may be any rectangle. dimOf(id) returns { w, h } — or a plain number for a
// square (Balanced III's shapes), which is what every older caller passes.
const asDims = dimOf => id => { const v = dimOf(id); return typeof v === 'number' ? { w: v, h: v } : v; };
const shapeDims = s => ({ w: s.w ?? s.size, h: s.h ?? s.size });
// along the main axis / across it, for this arrangement's direction
const lenOf = (dir, d) => dir === 'columns' ? d.w : d.h;
const depOf = (dir, d) => dir === 'columns' ? d.h : d.w;

export function geometry(arr, dimOf, rect) {
    const D = asDims(dimOf);
    const cols = arr.dir === 'columns';
    const sizeOf = id => depOf(arr.dir, D(id));          // size along the cross axis
    const along = cols ? rect.w : rect.h, across = cols ? rect.h : rect.w;
    const mainStart = cols ? rect.x : rect.y, crossStart = cols ? rect.y : rect.x;
    const lens = arr.groups.map(g => Math.max(...g.map(id => lenOf(arr.dir, D(id)))));
    const depths = arr.groups.map(g => sum(g.map(sizeOf)));
    const gMain = (along - sum(lens)) / (arr.groups.length + 1);
    const gIns = arr.groups.map((g, i) => (across - depths[i]) / (g.length + 1));
    const centers = {};
    let m = mainStart + gMain;
    arr.groups.forEach((g, gi) => {
        const mc = m + lens[gi] / 2;
        let c = crossStart + gIns[gi];
        for (const id of g) {
            const s = sizeOf(id);
            const cc = c + s / 2;
            centers[id] = cols ? { x: mc, y: cc } : { x: cc, y: mc };
            c += s + gIns[gi];
        }
        m += lens[gi] + gMain;
    });
    return { gMain, gIns, lens, depths, centers };
}

const ramp = (x, free, full) => Math.max(0, Math.min(1, (x - free) / (full - free)));

// How well this arrangement's gaps can match. off = the worst relative mismatch between
// the gap across and the tightest group (the frame) or any stacked group's inside gap.
export function evaluate(arr, geom) {
    const fits = geom.gMain > 0 && geom.gIns.every(g => g > 0);
    const frame = Math.min(...geom.gIns);
    const stacksOff = arr.groups.map((g, i) => g.length > 1 ? rel(geom.gIns[i], geom.gMain) : 0);
    const off = Math.max(rel(frame, geom.gMain), ...stacksOff);
    // too tight to see: a slope too (0 at MIN_GAP, all of CRAMPED at half of it)
    const tightest = Math.min(geom.gMain, ...geom.gIns);
    const cramped = tightest < MIN_GAP;
    const gapPenalty = Math.max(GAP_WEIGHT * ramp(off, GAP_FREE, GAP_FULL), CRAMPED * ramp(MIN_GAP - tightest, 0, MIN_GAP / 2));
    return { fits, off, cramped, gapPenalty };
}

// How lopsided, as a number of "whole" mirror mismatches (0 = perfectly balanced).
// Groups are compared by (length, depth); pieces inside a group by width AND height.
// opts.leftRightOnly (Balanced IV): only left↔right mirroring counts; top↔bottom is reading
// order on a poster (title first), not something to balance.
export function asymmetry(arr, dimOf, opts = {}) {
    const D = asDims(dimOf);
    const skipGroups = opts.leftRightOnly && arr.dir === 'rows';      // groups run top→bottom
    const skipInside = opts.leftRightOnly && arr.dir === 'columns';   // pieces stack top→bottom
    const L = id => lenOf(arr.dir, D(id)), C = id => depOf(arr.dir, D(id));
    const miss = (a, b) => ramp(rel(a, b), SYM_FREE, SYM_FULL);
    let bad = 0;
    const gs = arr.groups;
    for (let i = 0; i < (skipGroups ? 0 : Math.floor(gs.length / 2)); i++) {
        const a = gs[i], b = gs[gs.length - 1 - i];
        const la = Math.max(...a.map(L)), lb = Math.max(...b.map(L));
        const da = sum(a.map(C)), db = sum(b.map(C));
        bad += Math.max(miss(la, lb), miss(da, db));
    }
    for (const g of gs) {
        for (let i = 0; i < (skipInside ? 0 : Math.floor(g.length / 2)); i++) {
            const p = D(g[i]), q = D(g[g.length - 1 - i]);
            bad += Math.max(miss(p.w, q.w), miss(p.h, q.h));
        }
    }
    return bad;
}

// Same picture? Two arrangements that put same-size shapes in the same spots
// (or mirror images of each other) count as one layout for the thumbnails.
export function pictureKey(geom, shapes, rect, mirrors = true) {
    const pts = shapes.map(s => ({ x: geom.centers[s.id].x - rect.x, y: geom.centers[s.id].y - rect.y, s: `${Math.round(shapeDims(s).w / 4)}x${Math.round(shapeDims(s).h / 4)}` }));
    const keyOf = f => pts.map(p => f(p)).map(p => `${Math.round(p.x / 4)},${Math.round(p.y / 4)},${p.s}`).sort().join(';');
    const keys = [keyOf(p => p)];
    if (mirrors) {
        keys.push(keyOf(p => ({ ...p, x: rect.w - p.x })));
        keys.push(keyOf(p => ({ ...p, y: rect.h - p.y })));
        keys.push(keyOf(p => ({ ...p, x: rect.w - p.x, y: rect.h - p.y })));
    }
    return keys.sort()[0];
}

// Every arrangement with its geometry and quality.
// opts.extra(arr, geom) → extra penalty points for a game's own rules (Balanced IV: reading order).
export function analyse(shapes, rect, opts = {}) {
    const dims = Object.fromEntries(shapes.map(s => [s.id, shapeDims(s)]));
    const dimOf = id => dims[id];
    const all = [];
    for (const arr of arrangements(shapes.map(s => s.id))) {
        const geom = geometry(arr, dimOf, rect);
        const ev = evaluate(arr, geom);
        if (!ev.fits) { all.push({ arr, geom, ...ev }); continue; }
        const asym = asymmetry(arr, dimOf, opts);
        const symPenalty = SYM_WEIGHT * asym;
        const extraPenalty = opts.extra ? opts.extra(arr, geom) : 0;
        all.push({ arr, geom, ...ev, asym, symPenalty, extraPenalty, quality: 100 - ev.gapPenalty - symPenalty - extraPenalty });
    }
    const fitting = all.filter(a => a.fits);
    const best = Math.max(...fitting.map(a => a.quality));
    for (const a of fitting) {
        a.penalty = Math.min(MAX_PENALTY, Math.round(best - a.quality));
        a.ok = a.penalty <= FULL_MARKS_WITHIN;
    }
    const good = fitting.filter(a => a.ok);
    // One entry per distinct picture, best first (for the "layouts that work" strip).
    const seen = new Set(), layouts = [];
    for (const a of [...fitting].sort((p, q) => q.quality - p.quality)) {
        if (a.penalty > 10) break;
        const k = pictureKey(a.geom, shapes, rect);
        if (!seen.has(k)) { seen.add(k); layouts.push({ ...a, key: k, lopsided: !a.ok }); }
    }
    return { all, good, best, layouts, opts };
}

// ---------- scoring a student's placement ----------

// placed: { id: {x, y} } — centers where the student left each shape.
export function scorePlacement(shapes, rect, placed, analysis = analyse(shapes, rect)) {
    const dist = a => sum(shapes.map(s => Math.hypot(placed[s.id].x - a.geom.centers[s.id].x, placed[s.id].y - a.geom.centers[s.id].y))) / shapes.length;
    // The layout the student built = the nearest one. Two descriptions of nearly the same
    // picture (within 3 units) → the better one, so ties never go against the student.
    let mine = null, md = Infinity;
    for (const a of analysis.all) {
        if (!a.fits) continue;
        const d = dist(a);
        if (d < md - 3 || (Math.abs(d - md) <= 3 && a.quality > mine.quality)) { mine = a; md = Math.min(md, d); }
    }
    let precision = Math.max(0, 100 - md * PX_PER_POINT);
    // opts.gapWeight (Balanced IV): also score the gaps themselves — the average miss of each
    // measured gap, compared to the size of the even gap. Off-by-8 where the gap should be 8
    // is a big miss even though every piece is only a little out of place.
    let gapMiss = 0;
    const gw = analysis.opts && analysis.opts.gapWeight;
    if (gw) {
        const bars = measuredGaps(mine.arr, shapes, rect, placed, mine.geom);
        // two separate checks, the worse one counts: the gaps that should match each other,
        // and whether each lone piece is centred (so neither waters the other down)
        const mean = a => a.length ? a.reduce((t, v) => t + v, 0) / a.length : 0;
        const spacing = mean(bars.filter(b => !b.single).map(b => Math.abs(b.len - b.target)));
        const centring = mean(bars.filter(b => b.single).map(b => Math.abs(b.len - bars.find(o => o !== b && o.single && o.group === b.group).len) / 2));
        gapMiss = Math.max(spacing, centring) / Math.max(mine.geom.gMain, 10);
        precision = Math.max(0, precision - Math.min(40, gw * gapMiss));
    }
    const score = Math.max(0, Math.round(precision - mine.penalty));
    // which part of the penalty is which (for the message under the score)
    const bestA = analysis.all.find(a => a.fits && a.penalty === 0);
    const gapPart = Math.max(0, Math.round(mine.gapPenalty - bestA.gapPenalty));
    const extraPart = Math.max(0, Math.round(mine.extraPenalty - bestA.extraPenalty));
    const symPart = Math.max(0, mine.penalty - gapPart - extraPart);
    const result = {
        score, precision: Math.round(precision), meanDist: md, gapMiss, penalty: mine.penalty,
        ok: mine.ok, gapPart, symPart, extraPart,
        lopsided: !mine.ok && symPart > gapPart && symPart >= extraPart,
        match: mine, key: pictureKey(mine.geom, shapes, rect),
    };
    // A layout well short of the best: show the nearest full-marks one.
    if (mine.penalty > 5) {
        let near = null, nd = Infinity;
        for (const a of analysis.good) { const d = dist(a); if (d < nd) { nd = d; near = a; } }
        result.nearestGood = near;
    }
    return result;
}

// The gaps the student actually left, for the arrangement they were matched to.
// Each bar: { x1, y1, x2, y2, len, target } in the same units as rect.
export function measuredGaps(arr, shapes, rect, placed, geom) {
    const cols = arr.dir === 'columns';
    const dims = Object.fromEntries(shapes.map(s => [s.id, shapeDims(s)]));
    const halfM = id => (cols ? dims[id].w : dims[id].h) / 2, halfC = id => (cols ? dims[id].h : dims[id].w) / 2;
    const M = p => cols ? p.x : p.y, C = p => cols ? p.y : p.x;
    const mainStart = cols ? rect.x : rect.y, mainEnd = mainStart + (cols ? rect.w : rect.h);
    const crossStart = cols ? rect.y : rect.x, crossEnd = crossStart + (cols ? rect.h : rect.w);
    const bar = (m1, m2, c, alongMain, target) => {
        const [a, b] = [m1, m2];
        return alongMain
            ? (cols ? { x1: a, y1: c, x2: b, y2: c } : { x1: c, y1: a, x2: c, y2: b })
            : (cols ? { x1: c, y1: a, x2: c, y2: b } : { x1: a, y1: c, x2: b, y2: c });
    };
    const bars = [];
    // main axis: rect edge | group | gap | group | ... | rect edge, measured at the rect's middle line
    const ext = arr.groups.map(g => ({
        lo: Math.min(...g.map(id => M(placed[id]) - halfM(id))),
        hi: Math.max(...g.map(id => M(placed[id]) + halfM(id))),
    }));
    const midCross = (crossStart + crossEnd) / 2;
    let prev = mainStart;
    ext.forEach((e, i) => {
        // keep the bar off the shapes: put it beside the stack's middle line
        bars.push({ ...bar(prev, e.lo, midCross, true), len: e.lo - prev, target: geom.gMain, axis: 'main' });
        prev = e.hi;
    });
    bars.push({ ...bar(prev, mainEnd, midCross, true), len: mainEnd - prev, target: geom.gMain, axis: 'main' });
    // cross axis, inside each group, at the group's centre line
    arr.groups.forEach((g, gi) => {
        const line = (ext[gi].lo + ext[gi].hi) / 2;
        let p = crossStart;
        for (const id of g) {
            const lo = C(placed[id]) - halfC(id);
            bars.push({ ...bar(p, lo, line, false), len: lo - p, target: geom.gIns[gi], axis: 'cross', group: gi, single: g.length === 1 });
            p = C(placed[id]) + halfC(id);
        }
        bars.push({ ...bar(p, crossEnd, line, false), len: crossEnd - p, target: geom.gIns[gi], axis: 'cross', group: gi, single: g.length === 1 });
    });
    return bars;
}

// ---------- making puzzles ----------

// Difficulty by round (1-based). ratio = largest/smallest shape size.
export const ROUNDS = [
    { n: 3, ratio: [1.0, 1.3], plan: 'row' },
    { n: 3, ratio: [1.1, 1.4], plan: 'row' },
    { n: 3, ratio: [1.2, 1.6], plan: 'any' },
    { n: 3, ratio: [1.5, 2.0], plan: 'stack' },
    { n: 4, ratio: [1.3, 2.0], plan: 'any' },
    { n: 4, ratio: [1.5, 2.2], plan: 'stack' },
    { n: 4, ratio: [1.6, 2.5], plan: 'any' },
    { n: 5, ratio: [1.8, 2.6], plan: 'stack' },
    { n: 5, ratio: [2.0, 3.0], plan: 'any' },
    { n: 5, ratio: [2.2, 3.0], plan: 'any' },
];

// The play area, in logical units (the canvas is drawn at 600 × 450 and scaled).
export const STAGE = { w: 600, h: 450 };
export const MIN_SHAPE = 28;     // smallest shape a finger can grab
const PAD = 10;

const COLORS = ['#3b82f6', '#f59e0b', '#ec4899', '#10b981', '#a78bfa'];

function compositions(n, k) { // ways to split n shapes into k ordered groups (sizes)
    if (k === 1) return [[n]];
    const out = [];
    for (let first = 1; first <= n - k + 1; first++) for (const r of compositions(n - first, k - 1)) out.push([first, ...r]);
    return out;
}

// Build one puzzle BACKWARDS: pick a layout + gap, then size the rectangle so that
// layout works. Other layouts may work too — that's allowed.
// The four margins around a centred rectangle. Each shape starts at a random spot in a
// margin it fits in, biggest first. Shapes may overlap each other a little (a messy pile is
// fine) but each keeps most of itself visible, so none hides another. null = no room.
export function scatter(shapes, rect, rnd = Math.random) {
    const strips = [
        { x0: PAD, x1: STAGE.w - PAD, y0: PAD, y1: rect.y - PAD },                       // above
        { x0: PAD, x1: STAGE.w - PAD, y0: rect.y + rect.h + PAD, y1: STAGE.h - PAD },     // below
        { x0: PAD, x1: rect.x - PAD, y0: PAD, y1: STAGE.h - PAD },                       // left
        { x0: rect.x + rect.w + PAD, x1: STAGE.w - PAD, y0: PAD, y1: STAGE.h - PAD },     // right
    ];
    const start = {}, placed = [];
    for (const s of [...shapes].sort((a, b) => b.size - a.size)) {
        const fits = strips.filter(t => t.x1 - t.x0 >= s.size && t.y1 - t.y0 >= s.size);
        if (!fits.length) return null;
        let best = null, bestGap = -Infinity;
        for (let i = 0; i < 80; i++) {
            const t = fits[Math.floor(rnd() * fits.length)];
            const c = { x: t.x0 + s.size / 2 + rnd() * (t.x1 - t.x0 - s.size), y: t.y0 + s.size / 2 + rnd() * (t.y1 - t.y0 - s.size) };
            // how much room to the nearest shape already placed (negative = overlap)
            const gap = Math.min(Infinity, ...placed.map(o => Math.max(Math.abs(c.x - o.c.x), Math.abs(c.y - o.c.y)) - (s.size + o.size) / 2));
            if (gap >= 6) { best = c; break; }
            if (gap > bestGap) { bestGap = gap; best = c; }
        }
        // a little overlap is fine; burying a shape is not
        if (placed.some(o => Math.max(Math.abs(best.x - o.c.x), Math.abs(best.y - o.c.y)) < 0.6 * (s.size + o.size) / 2)) return null;
        start[s.id] = best;
        placed.push({ c: best, size: s.size });
    }
    return start;
}

export function makePuzzle(roundIndex, rnd = Math.random) {
    const cfg = ROUNDS[Math.min(roundIndex, ROUNDS.length - 1)];
    const pick = a => a[Math.floor(rnd() * a.length)];
    const between = (a, b) => a + rnd() * (b - a);
    for (let tries = 0; tries < 800; tries++) {
        const wide = rnd() < 0.5;
        const n = cfg.n;
        let groupSizes;
        if (cfg.plan === 'row' || (cfg.plan === 'any' && rnd() < 0.3)) groupSizes = Array(n).fill(1);
        else {
            const opts = [];
            for (let k = 2; k < n; k++) opts.push(...compositions(n, k));
            groupSizes = pick(opts);
        }
        const ratio = between(cfg.ratio[0], cfg.ratio[1]);
        const lo = 60, hi = 60 * ratio;
        const g = between(16, 30);
        // stacked groups all share one across-span; their sizes are scaled to fill it
        const multis = groupSizes.filter(m => m > 1);
        let across, groupsOfSizes = [];
        if (multis.length) {
            const m0 = multis[0];
            const first = Array.from({ length: m0 }, () => between(lo, hi));
            across = sum(first) + (m0 + 1) * g;
        } else across = null;
        let bad = false;
        for (const m of groupSizes) {
            if (m === 1) { groupsOfSizes.push([null]); continue; }
            const raw = Array.from({ length: m }, () => between(lo, hi));
            const f = (across - (m + 1) * g) / sum(raw);
            const sized = raw.map(v => v * f);
            if (sized.some(v => v < lo * 0.95 || v > hi * 1.05)) { bad = true; break; }
            groupsOfSizes.push(sized);
        }
        if (bad) continue;
        // singletons: any size that still fits the frame (often the exact fit, like Jake's example)
        const singles = groupsOfSizes.filter(gs => gs[0] === null).length;
        groupsOfSizes = groupsOfSizes.map(gs => {
            if (gs[0] !== null) return gs;
            if (across === null) return [between(lo, hi)];
            const cap = Math.min(hi * 1.05, across - 2 * g);
            if (cap < lo) { bad = true; return gs; }
            return [rnd() < 0.5 ? cap : between(lo, cap)];
        });
        if (bad) continue;
        if (across === null) across = Math.max(...groupsOfSizes.map(gs => gs[0])) + 2 * g;
        const flat = groupsOfSizes.flat();
        const actual = Math.max(...flat) / Math.min(...flat);
        if (actual < cfg.ratio[0] * 0.95 || actual > cfg.ratio[1] * 1.05) continue;
        const along = sum(groupsOfSizes.map(gs => Math.max(...gs))) + (groupSizes.length + 1) * g;

        // Fit to the stage: the rectangle sits in the CENTRE; loose shapes start scattered
        // in the margins around it (they may overlap each other a little, never the rectangle).
        const rw = wide ? along : across, rh = wide ? across : along;
        const maxS = Math.max(...flat);
        let scale = Math.min((STAGE.w - 2 * PAD) / rw, (STAGE.h - 2 * PAD) / rh);
        // shrink until the biggest shape fits in the widest margin
        const margin = k => Math.max((STAGE.w - rw * k) / 2, (STAGE.h - rh * k) / 2);
        while (scale > 0.05 && margin(scale) < maxS * scale + 2 * PAD) scale *= 0.97;
        scale *= between(0.92, 1);
        if (Math.min(...flat) * scale < MIN_SHAPE) continue;
        if (g * scale < MIN_GAP + 4) continue;

        const rect = { w: rw * scale, h: rh * scale };
        rect.x = (STAGE.w - rect.w) / 2;
        rect.y = (STAGE.h - rect.h) / 2;
        const ids = 'abcde'.slice(0, n).split('');
        const shuffledIds = [...ids].sort(() => rnd() - 0.5);
        const shapes = flat.map((s, i) => ({ id: shuffledIds[i], size: Math.round(s * scale), kind: rnd() < 0.5 ? 'circle' : 'square' }))
            .sort((p, q) => p.id.localeCompare(q.id))
            .map((s, i) => ({ ...s, color: COLORS[i] }));

        const analysis = analyse(shapes, rect);
        if (!analysis.good.length || analysis.best < 80) continue;
        if (cfg.plan === 'stack') {
            // teach the stack: lining everything up in one row must NOT work here
            const rowWorks = analysis.all.some(a => a.fits && a.penalty <= 5 && a.arr.groups.every(gr => gr.length === 1));
            if (rowWorks) continue;
        }
        const start = scatter(shapes, rect, rnd);
        if (!start) continue;
        return { round: roundIndex + 1, rect, shapes, start, wide, analysis };
    }
    throw new Error('could not make a puzzle for round ' + (roundIndex + 1));
}
