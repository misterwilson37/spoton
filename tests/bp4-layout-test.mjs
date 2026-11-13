// bp4-layout-test.mjs — Balanced Placement IV's round builder (bp4-layout.js) and posters.
// node bp4-layout-test.mjs   (text is measured with estimateMeasure; the browser test uses real fonts)
import { check, section, finish } from './harness.mjs';
import * as B from '../bp4-layout.js';
import * as L from '../bp3-layout.js';
import { POSTERS, artSVG, STILLS } from '../bp4-posters.js';

function rng(seed) { return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32); }
const centres = a => Object.fromEntries(Object.entries(a.geom.centers).map(([k, v]) => [k, { ...v }]));

section('The posters');
{
    check('20 posters', POSTERS.length === 20);
    check('ids are unique', new Set(POSTERS.map(p => p.id)).size === 20);
    check('every poster has a title, tagline, badge and colours', POSTERS.every(p => p.title && p.tagline && p.badge && p.page && p.title_c && p.tag_c && p.badge_c?.length === 2));
    check('no cafeteria jokes (Jake, Nov 13)', !POSTERS.some(p => /cafeteria|lunch lad/i.test(p.title + p.tagline)));
    check('every picture is an SVG drawn here (no outside addresses)', POSTERS.every(p => { const s = artSVG(p.id); return s.startsWith('<svg') && !/https?:\/\/(?!www\.w3\.org)/.test(s) && !/href=/.test(s); }));
    check('3 film-still crops inside the 300×300 picture', STILLS.length === 3 && STILLS.every(s => s.x >= 0 && s.y >= 0 && s.x + s.w <= 300 && s.y + s.h <= 300));
}

section('Every poster × page shape × round type builds, with a preset that gets full marks');
{
    const r = rng(11);
    let built = 0, presetBest = 0, fit = 0, notBuried = 0, messy = 0, n = 0, slow = 0;
    for (const poster of POSTERS) for (const shape of ['tall', 'wide']) for (let round = 0; round < 10; round++) {
        n++;
        const t0 = performance.now();
        let p;
        try { p = B.makeRound(round, poster, shape, B.estimateMeasure, r); built++; } catch { continue; }
        slow = Math.max(slow, performance.now() - t0);
        const mine = p.analysis.all.find(a => a.arr.dir === p.preset.dir && JSON.stringify(a.arr.groups) === JSON.stringify(p.preset.groups));
        if (mine && mine.penalty <= 3) presetBest++;
        const best = p.analysis.layouts[0];
        const inside = p.pieces.every(q => {
            const c = best.geom.centers[q.id];
            return c.x - q.w / 2 >= p.page.x - 0.5 && c.x + q.w / 2 <= p.page.x + p.page.w + 0.5 && c.y - q.h / 2 >= p.page.y - 0.5 && c.y + q.h / 2 <= p.page.y + p.page.h + 0.5;
        });
        if (inside && L.scorePlacement(p.pieces, p.page, centres(best), p.analysis).score === 100) fit++;
        if (!B.buried(p.pieces, p.start)) notBuried++;
        if (L.scorePlacement(p.pieces, p.page, p.start, p.analysis).score <= 50) messy++;
    }
    check(`all ${n} build (${built})`, built === n);
    check(`the preset layout is among the best every time (${presetBest})`, presetBest === n);
    check(`the best layout fits the page and scores 100 when placed exactly (${fit})`, fit === n);
    check(`no piece starts buried under the others (${notBuried})`, notBuried === n);
    check(`the messy start would score 50 or less untouched (${messy}/${n})`, messy >= n * 0.97);
    check(`a round builds in under 300 ms (slowest ${slow.toFixed(0)})`, slow < 300);
}

section('Round plan');
{
    const r = rng(5);
    let ok = 0;
    for (let i = 0; i < 200; i++) {
        const plan = B.planGame(r);
        const ids = new Set(plan.map(x => x.poster.id));
        const pairs = [0, 2, 4, 6, 8].every(i => new Set([plan[i].shape, plan[i + 1].shape]).size === 2);
        if (plan.length === 10 && ids.size === 10 && pairs) ok++;
    }
    check('every game: 10 rounds, 10 different posters, each pair of rounds = one tall + one wide', ok === 200);
    const seen = new Set();
    const r2 = rng(9);
    for (let i = 0; i < 30; i++) B.planGame(r2).forEach(x => seen.add(x.poster.id));
    check(`over 30 games every one of the 20 posters shows up (${seen.size})`, seen.size === 20);
    check('rounds ramp in pairs: basic, small badge, big badge + tilted title, stills, stills + badge',
        B.ROUNDS.map(r => r.kind).join(',') === 'basic,basic,badge,badge,badge,badge,stills,stills,stillsBadge,stillsBadge');
    // badges come in different sizes; titles tilt in rounds 5–6
    const r3 = rng(21), sizes = [], tilted = [];
    for (let i = 0; i < 60; i++) {
        const round = B.makeRound(i % 2 ? 2 : 4, POSTERS[i % 20], i % 3 ? 'tall' : 'wide', B.estimateMeasure, r3);
        sizes.push(round.pieces.find(p => p.role === 'badge').size);
        if (i % 2 === 0) tilted.push(!!round.pieces.find(p => p.role === 'title').angle);
    }
    check(`badge sizes vary a lot (${Math.min(...sizes).toFixed(0)}–${Math.max(...sizes).toFixed(0)})`, Math.max(...sizes) / Math.min(...sizes) > 1.7);
    check('rounds 5–6: the title is tilted', tilted.every(Boolean));
    // pictures are always drawn first (behind text)
    const order = B.layerOrder(['title', 'pic', 'badge', 'still1', 'tagline'], id => id === 'pic' || id.startsWith('still') ? 'pic' : 'text');
    check(`pictures always behind text (${order.join(' < ')})`, order.join(',') === 'pic,still1,title,badge,tagline');
}

section('Rules');
{
    // reading order
    const geom = (t, g) => ({ centers: { title: t, tagline: g } });
    check('tagline below the title: fine', B.readingOrder(null, geom({ x: 100, y: 50 }, { x: 100, y: 200 })) === 0);
    check('tagline above the title: penalty', B.readingOrder(null, geom({ x: 100, y: 200 }, { x: 100, y: 50 })) === B.READING_ORDER_PENALTY);
    check('same line, tagline to the left: penalty', B.readingOrder(null, geom({ x: 300, y: 100 }, { x: 100, y: 100 })) === B.READING_ORDER_PENALTY);
    // top↔bottom isn't "lopsided" on a poster; left↔right is
    const dims = { a: { w: 200, h: 100 }, b: { w: 200, h: 20 }, c: { w: 60, h: 20 } };
    const D = id => dims[id];
    check('poster stack title/picture/tagline: no balance penalty (left↔right only)', L.asymmetry({ dir: 'rows', groups: [['a'], ['b']] }, D, { leftRightOnly: true }) === 0);
    check('…but a big piece beside a small one in a row IS lopsided', L.asymmetry({ dir: 'rows', groups: [['a', 'c']] }, D, { leftRightOnly: true }) > 0.5);
    // a tilted badge is measured by the box it visibly takes up
    const p = B.makeRound(4, POSTERS[0], 'tall', B.estimateMeasure, rng(3)).pieces.find(q => q.role === 'badge');
    const a = Math.abs(p.angle) * Math.PI / 180;
    // rounds 3–4 badges
    check(`badge box = its tilted outline's bounding box (${p.w.toFixed(1)} × ${p.h.toFixed(1)})`,
        Math.abs(p.w - (p.bw * Math.cos(a) + p.bh * Math.sin(a))) < 0.01 && Math.abs(p.h - (p.bw * Math.sin(a) + p.bh * Math.cos(a))) < 0.01 && p.w > p.bw);
}

// Jake's students' flyers (Nov 13), measured from the screenshots in pixels ÷ 5. These check
// that the game's numbers agree with Jake's eye: the flyers as made are badly spaced; the
// same pieces spaced evenly score full marks for that layout.
section("Jake's flyers: the scoring agrees with the eye");
{
    const run = (name, page, pieces, groups, original, maxOriginal) => {
        const arr = { dir: 'rows', groups };
        const D = Object.fromEntries(pieces.map(p => [p.id, { w: p.w, h: p.h }]));
        const even = L.geometry(arr, id => D[id], page);
        const bars = L.measuredGaps(arr, pieces, page, original, even);
        const main = bars.filter(b => b.axis === 'main').map(b => Math.round(b.len));
        // score it the way Balanced IV does, against this one layout
        const fake = { all: [{ arr, geom: even, fits: true, quality: 100, penalty: 0, ok: true, gapPenalty: 0, extraPenalty: 0 }], good: [], opts: { gapWeight: B.GAP_WEIGHT } };
        fake.good = fake.all;
        const asMade = L.scorePlacement(pieces, page, original, fake).score;
        const evenScore = L.scorePlacement(pieces, page, even.centers, fake).score;
        console.log(`    ${name}: gaps top→bottom as made: ${main.join(' · ')}  → even gap would be ${even.gMain.toFixed(0)}`);
        check(`${name}: as made, the gaps vary a lot (${Math.min(...main)}–${Math.max(...main)})`, Math.max(...main) > 2.5 * Math.max(1, Math.min(...main)));
        check(`${name}: as made it would score ${asMade} for this layout; evenly spaced, ${evenScore}`, asMade <= maxOriginal && evenScore === 100);
        const evenBars = L.measuredGaps(arr, pieces, page, even.centers, even);
        check(`${name}: evenly spaced, every gap down the page matches`, evenBars.filter(b => b.axis === 'main').every(b => Math.abs(b.len - even.gMain) < 0.01));
    };
    // MAGIC! CARDS! — one stack: MAGIC!, CARDS!, card picture, description, date band, "paying", P.S.
    const mPage = { x: 0, y: 0, w: 306, h: 394 };
    const box = (id, x1, y1, x2, y2) => ({ id, w: (x2 - x1) / 5, h: (y2 - y1) / 5, cx: ((x1 + x2) / 2 - 22) / 5, cy: ((y1 + y2) / 2 - 18) / 5 });
    const m = [box('magic', 320, 95, 1215, 375), box('cards', 512, 395, 1062, 550), box('card', 158, 585, 1418, 1495),
               box('desc', 180, 1520, 1390, 1700), box('band', 130, 1792, 1445, 1858), box('paying', 488, 1868, 1085, 1915), box('ps', 640, 1938, 932, 1952)];
    run('MAGIC! CARDS!', mPage, m, m.map(p => [p.id]), Object.fromEntries(m.map(p => [p.id, { x: p.cx, y: p.cy }])), 79);
    // YOGA — Jake's fix: banner, YOGA, (GIRLS ONLY), details, the photo strip, caption BELOW the photos
    const yPage = { x: 0, y: 0, w: 290, h: 380 };
    const ybox = (id, x1, y1, x2, y2) => ({ id, w: (x2 - x1) / 5, h: (y2 - y1) / 5, cx: ((x1 + x2) / 2 - 28) / 5, cy: ((y1 + y2) / 2 - 18) / 5 });
    const y = [ybox('banner', 870, 100, 1435, 265), ybox('yoga', 290, 400, 1290, 685), ybox('girls', 535, 710, 1050, 785),
               ybox('details', 290, 812, 1255, 1040), ybox('photos', 28, 1430, 1484, 1900), ybox('caption', 155, 1447, 1398, 1508)];
    run('YOGA', yPage, y, y.map(p => [p.id]), Object.fromEntries(y.map(p => [p.id, { x: p.cx, y: p.cy }])), 75);
}

finish('bp4-layout-test');
