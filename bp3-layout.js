// =============================================
// bp3-layout.js v1.0.0 — the spacing math for Balanced Placement III.
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
// The rule (agreed with Jake, Nov 2026):
//   1. Groups are evenly spaced along the main axis (edges, not centers).
//   2. Shapes inside a group are evenly spaced and the group is centred.
//   3. The tightest group sets the "frame" gap; the gap along the main axis must
//      roughly match it, and every stacked group's gap must too (within TOL).
//   4. Order: mirror-symmetric sizes (a C b, C a b D) is full marks. A layout that
//      works but is lopsided (a b C) is a pass, not full marks — UNLESS no
//      symmetric layout works for that rectangle, then lopsided is the best there is.
// =============================================

export const VERSION = '1.0.0';
export const TOL = 0.25;            // "roughly equal" gaps. Tune after classroom play.
export const SYM_TOL = 0.15;        // two sizes "match" for mirror symmetry
export const LAYOUT_PENALTY = 40;   // a layout whose gaps can't all match
export const LOPSIDED_PENALTY = 20; // works, but a more symmetric layout was available
export const PX_PER_POINT = 1;
export const MIN_GAP = 14;          // a layout with gaps tighter than this (logical units) is cramped, not "working"      // precision: lose 1 point per logical px of average miss

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

export function geometry(arr, sizeOf, rect) {
    const cols = arr.dir === 'columns';
    const along = cols ? rect.w : rect.h, across = cols ? rect.h : rect.w;
    const mainStart = cols ? rect.x : rect.y, crossStart = cols ? rect.y : rect.x;
    const lens = arr.groups.map(g => Math.max(...g.map(sizeOf)));
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

// Does this arrangement follow the spacing rule?
export function evaluate(arr, geom) {
    const fits = geom.gMain > 0 && geom.gIns.every(g => g > 0);
    const frame = Math.min(...geom.gIns);
    const off = rel(frame, geom.gMain);
    const stacksOff = arr.groups.map((g, i) => g.length > 1 ? rel(geom.gIns[i], geom.gMain) : 0);
    const ok = fits && geom.gMain >= MIN_GAP && off <= TOL && stacksOff.every(o => o <= TOL);
    return { ok, fits, off: Math.max(off, ...stacksOff) };
}

// How lopsided: the number of mirror pairs whose sizes don't match.
// Groups are compared by (length, depth); shapes inside a group by size.
export function asymmetry(arr, sizeOf) {
    const match = (a, b) => rel(a, b) <= SYM_TOL;
    let bad = 0;
    const gs = arr.groups;
    for (let i = 0; i < Math.floor(gs.length / 2); i++) {
        const a = gs[i], b = gs[gs.length - 1 - i];
        const la = Math.max(...a.map(sizeOf)), lb = Math.max(...b.map(sizeOf));
        const da = sum(a.map(sizeOf)), db = sum(b.map(sizeOf));
        if (!match(la, lb) || !match(da, db)) bad++;
    }
    for (const g of gs) {
        for (let i = 0; i < Math.floor(g.length / 2); i++) {
            if (!match(sizeOf(g[i]), sizeOf(g[g.length - 1 - i]))) bad++;
        }
    }
    return bad;
}

// Same picture? Two arrangements that put same-size shapes in the same spots
// (or mirror images of each other) count as one layout for the thumbnails.
export function pictureKey(geom, shapes, rect, mirrors = true) {
    const pts = shapes.map(s => ({ x: geom.centers[s.id].x - rect.x, y: geom.centers[s.id].y - rect.y, s: s.size }));
    const keyOf = f => pts.map(p => f(p)).map(p => `${Math.round(p.x / 4)},${Math.round(p.y / 4)},${Math.round(p.s / 4)}`).sort().join(';');
    const keys = [keyOf(p => p)];
    if (mirrors) {
        keys.push(keyOf(p => ({ ...p, x: rect.w - p.x })));
        keys.push(keyOf(p => ({ ...p, y: rect.h - p.y })));
        keys.push(keyOf(p => ({ ...p, x: rect.w - p.x, y: rect.h - p.y })));
    }
    return keys.sort()[0];
}

// Every arrangement with its geometry and verdict.
export function analyse(shapes, rect) {
    const size = Object.fromEntries(shapes.map(s => [s.id, s.size]));
    const sizeOf = id => size[id];
    const all = [];
    for (const arr of arrangements(shapes.map(s => s.id))) {
        const geom = geometry(arr, sizeOf, rect);
        const ev = evaluate(arr, geom);
        all.push({ arr, geom, ...ev, asym: asymmetry(arr, sizeOf) });
    }
    const good = all.filter(a => a.ok);
    const bestAsym = good.length ? Math.min(...good.map(a => a.asym)) : 0;
    // One entry per distinct picture, most symmetric first.
    const seen = new Set(), layouts = [];
    for (const a of [...good].sort((p, q) => p.asym - q.asym || p.off - q.off)) {
        const k = pictureKey(a.geom, shapes, rect);
        if (!seen.has(k)) { seen.add(k); layouts.push({ ...a, key: k, lopsided: a.asym > bestAsym }); }
    }
    return { all, good, bestAsym, layouts };
}

// ---------- scoring a student's placement ----------

// placed: { id: {x, y} } — centers where the student left each shape.
export function scorePlacement(shapes, rect, placed, analysis = analyse(shapes, rect)) {
    let best = null;
    for (const a of analysis.all) {
        if (!a.fits) continue;
        const dists = shapes.map(s => Math.hypot(placed[s.id].x - a.geom.centers[s.id].x, placed[s.id].y - a.geom.centers[s.id].y));
        const meanDist = sum(dists) / dists.length;
        const precision = Math.max(0, 100 - meanDist * PX_PER_POINT);
        const lopsided = a.ok && a.asym > analysis.bestAsym;
        const penalty = !a.ok ? LAYOUT_PENALTY : lopsided ? LOPSIDED_PENALTY : 0;
        const score = Math.max(0, Math.round(precision - penalty));
        if (!best || score > best.score || (score === best.score && meanDist < best.meanDist)) {
            best = { score, precision: Math.round(precision), meanDist, penalty, lopsided, ok: a.ok, match: a };
        }
    }
    // A layout that breaks the rule: show the closest one that works instead.
    if (best && !best.ok) {
        let near = null, nd = Infinity;
        for (const a of analysis.good) {
            const d = sum(shapes.map(s => Math.hypot(placed[s.id].x - a.geom.centers[s.id].x, placed[s.id].y - a.geom.centers[s.id].y)));
            if (d < nd) { nd = d; near = a; }
        }
        best.nearestGood = near;
    }
    if (best) best.key = pictureKey(best.match.geom, shapes, rect);
    return best;
}

// The gaps the student actually left, for the arrangement they were matched to.
// Each bar: { x1, y1, x2, y2, len, target } in the same units as rect.
export function measuredGaps(arr, shapes, rect, placed, geom) {
    const size = Object.fromEntries(shapes.map(s => [s.id, s.size]));
    const cols = arr.dir === 'columns';
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
        lo: Math.min(...g.map(id => M(placed[id]) - size[id] / 2)),
        hi: Math.max(...g.map(id => M(placed[id]) + size[id] / 2)),
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
            const lo = C(placed[id]) - size[id] / 2;
            bars.push({ ...bar(p, lo, line, false), len: lo - p, target: geom.gIns[gi], axis: 'cross', group: gi, single: g.length === 1 });
            p = C(placed[id]) + size[id] / 2;
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
const PAD = 14, TRAY_GAP = 10;

const COLORS = ['#3b82f6', '#f59e0b', '#ec4899', '#10b981', '#a78bfa'];

function compositions(n, k) { // ways to split n shapes into k ordered groups (sizes)
    if (k === 1) return [[n]];
    const out = [];
    for (let first = 1; first <= n - k + 1; first++) for (const r of compositions(n - first, k - 1)) out.push([first, ...r]);
    return out;
}

// Build one puzzle BACKWARDS: pick a layout + gap, then size the rectangle so that
// layout works. Other layouts may work too — that's allowed.
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

        // Fit to the stage: rectangle in one part, a tray for the loose shapes in the other.
        const area = wide
            ? { rect: { w: STAGE.w - 2 * PAD, h: 270 }, tray: { x: PAD, y: 270 + 2 * PAD, w: STAGE.w - 2 * PAD, h: STAGE.h - 270 - 3 * PAD } }
            : { rect: { w: 340, h: STAGE.h - 2 * PAD }, tray: { x: 340 + 2 * PAD, y: PAD, w: STAGE.w - 340 - 3 * PAD, h: STAGE.h - 2 * PAD } };
        const rw = wide ? along : across, rh = wide ? across : along;
        let scale = Math.min(area.rect.w / rw, area.rect.h / rh) * between(0.92, 1);
        // the tray must hold every shape in one line
        const trayLong = wide ? area.tray.w : area.tray.h, trayShort = wide ? area.tray.h : area.tray.w;
        scale = Math.min(scale, (trayLong - (n + 1) * TRAY_GAP) / sum(flat), (trayShort - 2 * TRAY_GAP) / Math.max(...flat));
        if (Math.min(...flat) * scale < MIN_SHAPE) continue;
        if (g * scale < MIN_GAP + 4) continue;

        const rect = { w: rw * scale, h: rh * scale };
        rect.x = wide ? (STAGE.w - rect.w) / 2 : PAD + (area.rect.w - rect.w) / 2;
        rect.y = wide ? PAD + (area.rect.h - rect.h) / 2 : (STAGE.h - rect.h) / 2;
        const ids = 'abcde'.slice(0, n).split('');
        const shuffledIds = [...ids].sort(() => rnd() - 0.5);
        const shapes = flat.map((s, i) => ({ id: shuffledIds[i], size: Math.round(s * scale), kind: rnd() < 0.5 ? 'circle' : 'square' }))
            .sort((p, q) => p.id.localeCompare(q.id))
            .map((s, i) => ({ ...s, color: COLORS[i] }));

        const analysis = analyse(shapes, rect);
        if (!analysis.good.length) continue;
        if (cfg.plan === 'stack') {
            // teach the stack: lining everything up in one row must NOT work here
            const rowWorks = analysis.good.some(a => a.arr.groups.every(gr => gr.length === 1));
            if (rowWorks) continue;
        }
        // loose shapes start in the tray, in a random order that gives nothing away
        const trayOrder = [...shapes].sort(() => rnd() - 0.5);
        const total = sum(trayOrder.map(s => s.size));
        const space = (trayLong - total) / (n + 1);
        let p = (wide ? area.tray.x : area.tray.y) + space;
        const start = {};
        for (const s of trayOrder) {
            const c = p + s.size / 2;
            start[s.id] = wide ? { x: c, y: area.tray.y + area.tray.h / 2 } : { x: area.tray.x + area.tray.w / 2, y: c };
            p += s.size + space;
        }
        return { round: roundIndex + 1, rect, shapes, start, tray: area.tray, wide, analysis };
    }
    throw new Error('could not make a puzzle for round ' + (roundIndex + 1));
}
