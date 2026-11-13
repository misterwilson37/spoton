// =============================================
// bp4-layout.js v1.2.0 — builds Balanced Placement IV's rounds: one made-up B-movie
// poster per round, as pieces (title, tagline, picture or film stills, tilted badge) on a
// tall theatre poster (2:3) or a wide billboard (16:9).
//
// The spacing math is Balanced III's (bp3-layout.js): the same even-gaps + balance quality,
// on rectangles. Each round starts from one of a few PRESET layouts that are known to be
// good ("BP4 should have preset ideas of what good already is" — Jake). The pieces are
// sized so that preset has exactly even gaps; every other layout that also works is found
// by bp3-layout's analyse().
//
// Tilted badges are measured by the box they visibly take up (their rotated outline's
// bounding box) — agreed with Jake, Nov 13 2026. No overlapping pieces.
// =============================================

import { analyse, scorePlacement } from './bp3-layout.js';
import { POSTERS } from './bp4-posters.js';

export const VERSION = '1.2.0';
export const STAGE = { w: 600, h: 450 };
export const PAGES = {
    tall: { x: 160, y: 15, w: 280, h: 420 },    // theatre poster, 2:3
    wide: { x: 50, y: 84, w: 500, h: 281.25 },  // billboard, 16:9
};
export const FONTS = {
    title: { family: 'Bangers', weight: 400 },
    tagline: { family: 'Inter', weight: 600 },
    badge: { family: 'Bangers', weight: 400 },
};
export const READING_ORDER_PENALTY = 20;
// The title gets its own line, centred on the page (Jake, Nov 13: a title sharing a line
// with the badge can't be centred over the picture below it). On a billboard with a text
// column beside the picture, the title sits in that column instead — that's fine.
export const TITLE_ALONE_PENALTY = 15;
// Each gap's miss, as a share of the even gap, costs this many points (on top of how far the
// pieces are from their spots). Calibrated on Jake's MAGIC! flyer: gaps of 2 to 18 where 8
// would be even should land in the 60s–70s, not "Perfect!".
export const GAP_WEIGHT = 50;

// What each round asks for. Groups run top→bottom ('rows') or left→right ('columns');
// a group's pieces sit side by side (rows) or stacked (columns).
//   P = the picture, S1..S3 = film stills, T = title, G = tagline, B = badge
const PRESETS = {
    tall: {
        basic: [{ dir: 'rows', groups: [['T'], ['P'], ['G']] }],
        badge: [{ dir: 'rows', groups: [['T'], ['P'], ['G'], ['B']] }, { dir: 'rows', groups: [['B'], ['T'], ['P'], ['G']] }],
        stills: [{ dir: 'rows', groups: [['T'], ['S1', 'S2'], ['G']] }],
        stillsBadge: [{ dir: 'rows', groups: [['T'], ['S1', 'S2'], ['G'], ['B']] }],
    },
    wide: {
        basic: [{ dir: 'columns', groups: [['P'], ['T', 'G']] }, { dir: 'columns', groups: [['T', 'G'], ['P']] }],
        badge: [{ dir: 'columns', groups: [['P'], ['T', 'G', 'B']] }, { dir: 'columns', groups: [['B', 'T', 'G'], ['P']] }],
        stills: [{ dir: 'rows', groups: [['T'], ['S1', 'S2', 'S3'], ['G']] }],
        stillsBadge: [{ dir: 'rows', groups: [['T'], ['S1', 'S2'], ['G'], ['B']] }, { dir: 'rows', groups: [['B'], ['T'], ['S1', 'S2'], ['G']] }],
    },
};
// Rounds come in pairs — one tall poster and one billboard, in random order (Jake, Nov 13:
// "once wide, once tall, then the tilted stuff… the tilted stuff gets to be different sizes").
//   badge: font size range of the badge; tilt: chance the TITLE is tilted too.
export const ROUNDS = [
    { kind: 'basic' }, { kind: 'basic' },
    { kind: 'badge', badge: [13, 18] }, { kind: 'badge', badge: [13, 18] },
    { kind: 'badge', badge: [19, 28], tilt: 1 }, { kind: 'badge', badge: [19, 28], tilt: 1 },
    { kind: 'stills' }, { kind: 'stills' },
    { kind: 'stillsBadge', badge: [13, 28], tilt: 0.5 }, { kind: 'stillsBadge', badge: [13, 28], tilt: 0.5 },
];

// Pictures always sit BEHIND text and badges (Jake: a picture was covering text that still
// needed placing). Draw / pick-up order: pictures first, then everything else in `ids` order.
export function layerOrder(ids, roleOf) {
    return [...ids.filter(id => roleOf(id) === 'pic'), ...ids.filter(id => roleOf(id) !== 'pic')];
}

const ID = { T: 'title', G: 'tagline', B: 'badge', P: 'pic', S1: 'still1', S2: 'still2', S3: 'still3' };

// Reading order: the title has to come before the tagline (above it, or left of it on the
// same line). Everything else may go anywhere.
export function readingOrder(arr, geom) {
    const t = geom.centers.title, g = geom.centers.tagline;
    if (!t || !g) return 0;
    if (g.y < t.y - 4) return READING_ORDER_PENALTY;
    if (Math.abs(g.y - t.y) <= 4 && g.x < t.x) return READING_ORDER_PENALTY;
    return 0;
}
export function titleAlone(arr) {
    if (arr.dir !== 'rows') return 0;
    const g = arr.groups.find(grp => grp.includes('title'));
    return g && g.length > 1 ? TITLE_ALONE_PENALTY : 0;
}
// every poster-only rule, for analyse({ extra })
export const posterRules = (arr, geom) => readingOrder(arr, geom) + titleAlone(arr);

// Text → pieces. measure(text, font, maxWidth) → { lines, w, h } where w/h are the VISIBLE
// ink box (what the student sees), supplied by the page (canvas) or the tests (estimate).
// A tilted piece is measured by the box it visibly takes up: its rotated outline's bounds.
function tiltBox(w, h, angle) {
    const a = Math.abs(angle) * Math.PI / 180;
    return { w: w * Math.cos(a) + h * Math.sin(a), h: w * Math.sin(a) + h * Math.cos(a) };
}
function textPiece(id, role, text, size, maxW, measure, angle = 0) {
    // a tilted title wraps a little narrower so its tilted box still fits the room
    const m = measure(text, { ...FONTS[role], size }, angle ? maxW * 0.86 : maxW);
    const box = angle ? tiltBox(m.w, m.h, angle) : { w: m.w, h: m.h };
    return { id, role, text, size, angle, bw: m.w, bh: m.h, w: box.w, h: box.h, lines: m.lines, ink: m };
}
function badgePiece(text, size, angle, measure) {
    const m = measure(text, { ...FONTS.badge, size }, 1e6);
    const padX = size * 0.55, padY = size * 0.4;
    const bw = m.w + 2 * padX, bh = m.h + 2 * padY;
    return { id: 'badge', role: 'badge', text, size, angle, bw, bh, lines: m.lines, ink: m, ...tiltBox(bw, bh, angle) };
}

// Size every piece so `preset` has exactly even gaps g on this page. Returns pieces or null.
export function build(preset, page, poster, measure, rnd, cfg = {}) {
    const between = (a, b) => a + rnd() * (b - a);
    const rows = preset.dir === 'rows';
    const along = rows ? page.h : page.w, across = rows ? page.w : page.h;
    const stillsRound = preset.groups.flat().some(k => k.startsWith('S'));
    const widePage = page.w > page.h;
    const titleSize = widePage ? between(22, 28) : stillsRound ? between(38, 46) : between(30, 38);
    const tagSize = between(12.5, 14.5);
    const badgeSize = cfg.badge ? between(cfg.badge[0], cfg.badge[1]) : between(14, 17);
    const angle = (rnd() < 0.5 ? -1 : 1) * between(5, 14);
    const titleAngle = rnd() < (cfg.tilt || 0) ? (rnd() < 0.5 ? -1 : 1) * between(3, 7) : 0;
    const has = k => preset.groups.some(g => g.includes(k));
    const badge = has('B') ? badgePiece(poster.badge, badgeSize, angle, measure) : null;
    const pics = preset.groups.flat().filter(k => k === 'P' || k.startsWith('S'));
    let best = null;
    // scan the gap; keep the one whose pictures come out closest to a pleasant shape
    for (let g = 17; rows && g <= along * 0.12; g += 1) {
        const pieces = {};
        if (badge) pieces.B = badge;
        // text first (it wraps to the room it has)
        for (const grp of preset.groups) {
            for (const k of grp) {
                if (k !== 'T' && k !== 'G') continue;
                // room across for this text: its group shares the cross axis in 'rows'
                let room;
                if (rows) {
                    const others = grp.filter(o => o !== k).map(o => o === 'B' ? badge.w : 0);
                    room = across - (grp.length + 1) * g - others.reduce((a, b) => a + b, 0);
                } else room = along * 0.42; // a text column on a billboard
                if (k === 'G' && rows && grp.length === 1) room *= 0.86;
                pieces[k] = k === 'T' ? textPiece('title', 'title', poster.title, titleSize, room, measure, titleAngle)
                                      : textPiece('tagline', 'tagline', poster.tagline, tagSize, room, measure);
                if (pieces[k].w > room + 0.5) { pieces.bad = true; }
            }
        }
        if (pieces.bad) continue;
        // then the pictures fill what is left so every gap is g
        let pw, ph;
        if (rows) {
            const picGroup = preset.groups.find(grp => grp.some(k => pics.includes(k)));
            const n = picGroup.length;
            pw = (across - (n + 1) * g) / n;
            const otherH = preset.groups.filter(grp => grp !== picGroup)
                .map(grp => Math.max(...grp.map(k => pieces[k].h))).reduce((a, b) => a + b, 0);
            ph = along - (preset.groups.length + 1) * g - otherH;
        } else {
            // columns: the text column's stack fixes g; the picture column fills the rest
            const textGroup = preset.groups.find(grp => !grp.includes('P'));
            const stackH = textGroup.map(k => pieces[k].h).reduce((a, b) => a + b, 0);
            const gText = (across - stackH) / (textGroup.length + 1);
            if (Math.abs(gText - g) > 0.5) continue;
            g = gText;
            const colW = Math.max(...textGroup.map(k => pieces[k].w));
            ph = across - 2 * g;
            pw = along - 3 * g - colW;
        }
        if (pw < 60 || ph < 50) continue;
        const aspect = pw / ph, want = pics.length > 1 ? 0.85 : (rows ? 1.25 : 1.15);
        if (aspect < (pics.length > 1 ? 0.55 : 0.62) || aspect > 1.9) continue;
        const cost = Math.abs(Math.log(aspect / want));
        if (!best || cost < best.cost) best = { cost, g, pieces, pw, ph };
        if (!rows) break;
    }
    if (!rows) {
        // billboard: the text column's stack sets g. Try text sizes and column widths and keep
        // the one whose gap is near a tenth of the height and whose picture has a good shape.
        const textGroup = preset.groups.find(grp => !grp.includes('P'));
        for (let ts = 24; ts <= 46; ts += 2) for (const frac of [0.34, 0.38, 0.42, 0.46]) {
            const colRoom = along * frac, pieces = {};
            if (badge) pieces.B = badge;
            pieces.T = textPiece('title', 'title', poster.title, ts, colRoom, measure, titleAngle);
            pieces.G = textPiece('tagline', 'tagline', poster.tagline, tagSize, colRoom * 0.92, measure);
            const stackH = textGroup.map(k => pieces[k].h).reduce((a, b) => a + b, 0);
            const g = (across - stackH) / (textGroup.length + 1);
            const colW = Math.max(...textGroup.map(k => pieces[k].w));
            const ph = across - 2 * g, pw = along - 3 * g - colW;
            if (g < 16 || pw < 60 || ph < 50) continue;
            const aspect = pw / ph;
            if (aspect < 0.62 || aspect > 1.9) continue;
            const cost = Math.abs(Math.log(g / (across * 0.1))) + 0.5 * Math.abs(Math.log(aspect / 1.15));
            if (!best || cost < best.cost) best = { cost, g, pieces, pw, ph };
        }
    }
    if (!best) return null;
    const out = [];
    for (const k of preset.groups.flat()) {
        if (best.pieces[k]) out.push(best.pieces[k]);
        else out.push({ id: ID[k], role: 'pic', still: k === 'P' ? 0 : Number(k[1]) - 1, w: best.pw, h: best.ph });
    }
    return { pieces: out, g: best.g };
}

// Messy start: a first draft — the pieces dropped roughly into some OTHER, clearly worse
// layout, then knocked about (some hang off the page). Rerolled until it would score
// 50 or less if submitted untouched.
function messyStart(pieces, page, analysis, rnd) {
    const poor = analysis.all.filter(a => a.fits && a.penalty >= 15);
    const pool = poor.length ? poor : analysis.all.filter(a => a.fits && !a.ok);
    let start = null;
    for (let tries = 0; tries < 25; tries++) {
        const pick = pool.length ? pool[Math.floor(rnd() * pool.length)] : null;
        start = {};
        for (const p of pieces) {
            const c = pick ? pick.geom.centers[p.id] : { x: page.x + page.w / 2, y: page.y + page.h / 2 };
            const j = () => (rnd() - 0.5) * 0.4 * Math.min(page.w, page.h);
            start[p.id] = {
                x: Math.min(STAGE.w - p.w / 2, Math.max(p.w / 2, c.x + j())),
                y: Math.min(STAGE.h - p.h / 2, Math.max(p.h / 2, c.y + j())),
            };
        }
        if (buried(pieces, start)) continue;
        if (scorePlacement(pieces, page, start, analysis).score <= 50) break;
    }
    return start;
}

// True if any piece is mostly hidden under pieces drawn after it (start draw order = the
// pieces' order). A student can't grab what they can't see: each piece keeps ≥ 40% showing.
export function buried(piecesIn, at) {
    const byId = Object.fromEntries(piecesIn.map(p => [p.id, p]));
    const pieces = layerOrder(piecesIn.map(p => p.id), id => byId[id].role).map(id => byId[id]);
    for (let i = 0; i < pieces.length; i++) {
        const p = pieces[i], c = at[p.id];
        let shown = 0, n = 0;
        for (let a = 0; a < 8; a++) for (let b = 0; b < 8; b++) {
            const x = c.x - p.w / 2 + (a + 0.5) * p.w / 8, y = c.y - p.h / 2 + (b + 0.5) * p.h / 8;
            n++;
            if (!pieces.slice(i + 1).some(q => Math.abs(x - at[q.id].x) <= q.w / 2 && Math.abs(y - at[q.id].y) <= q.h / 2)) shown++;
        }
        if (shown / n < 0.4) return true;
    }
    return false;
}

export function shufflePosters(rnd = Math.random) {
    const a = [...POSTERS];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
}

// One round. shape: 'tall' | 'wide'.
export function makeRound(roundIndex, poster, shape, measure, rnd = Math.random) {
    let cfg = ROUNDS[Math.min(roundIndex, ROUNDS.length - 1)];
    const kind = cfg.kind;
    const page = PAGES[shape];
    const presets = PRESETS[shape][kind];
    for (let tries = 0; tries < 120; tries++) {
        // a long title + long tagline + big badge sometimes can't fit: after 60 tries, ease off
        if (tries === 60) cfg = { ...cfg, badge: cfg.badge ? [13, 17] : undefined, tilt: 0 };
        const preset = presets[Math.floor(rnd() * presets.length)];
        const built = build(preset, page, poster, measure, rnd, cfg);
        if (!built) continue;
        const analysis = analyse(built.pieces, page, { extra: posterRules, leftRightOnly: true, gapWeight: GAP_WEIGHT });
        // the preset itself must be one of the best layouts for this page
        const presetIds = { dir: preset.dir, groups: preset.groups.map(g => g.map(k => ID[k])) };
        const same = a => a.arr.dir === presetIds.dir && JSON.stringify(a.arr.groups) === JSON.stringify(presetIds.groups);
        const mine = analysis.all.find(same);
        if (!mine || !mine.fits || mine.penalty > 3) continue;
        return {
            round: roundIndex + 1, kind, shape, page, poster, pieces: built.pieces, gap: built.g,
            preset: presetIds, analysis, start: messyStart(built.pieces, page, analysis, rnd),
        };
    }
    throw new Error(`could not build round ${roundIndex + 1} (${kind}, ${shape}) for ${poster.id}`);
}

// Ten rounds, ten different posters. Each pair of rounds is one tall poster and one
// billboard, in random order.
export function planGame(rnd = Math.random) {
    const posters = shufflePosters(rnd).slice(0, ROUNDS.length);
    const shapes = [];
    for (let i = 0; i < ROUNDS.length / 2; i++) shapes.push(...(rnd() < 0.5 ? ['tall', 'wide'] : ['wide', 'tall']));
    return posters.map((p, i) => ({ poster: p, shape: shapes[i] }));
}

// For the tests (Node has no canvas): a rough text measurer, close enough to Bangers / Inter.
export function estimateMeasure(text, font, maxW) {
    const per = font.family === 'Bangers' ? 0.45 : 0.56;
    const words = text.split(' '), lines = [];
    let cur = '';
    for (const w of words) {
        const t = cur ? cur + ' ' + w : w;
        if (cur && t.length * per * font.size > maxW) { lines.push(cur); cur = w; } else cur = t;
    }
    if (cur) lines.push(cur);
    const lh = font.size * 1.12, asc = font.size * 0.72, desc = font.family === 'Bangers' ? font.size * 0.04 : font.size * 0.2;
    const ls = lines.map(t => ({ text: t, left: 0, right: t.length * per * font.size, ascent: asc, descent: desc }));
    return { lines: ls, w: Math.max(...ls.map(l => l.right)), h: (lines.length - 1) * lh + asc + desc, lineHeight: lh };
}
