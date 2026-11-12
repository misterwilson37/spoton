// bp3-layout-test.mjs — the real bp3-layout.js (Balanced Placement III's spacing math).
// node bp3-layout-test.mjs
import { check, section, finish } from './harness.mjs';
import * as L from '../bp3-layout.js';

// a tiny seeded random so failures can be replayed
function rng(seed) { return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32); }
const centres = a => Object.fromEntries(Object.entries(a.geom.centers).map(([k, v]) => [k, { ...v }]));

section("Jake's examples (two small a, b and one big C)");
{
    const A = { id: 'a', size: 60 }, B = { id: 'b', size: 60 }, C = { id: 'C', size: 150 };
    const show = an => an.layouts.map(l => `${l.arr.dir}:${l.arr.groups.map(g => g.join('/')).join('|')}`);
    const tight = L.analyse([A, B, C], { x: 0, y: 0, w: 300, h: 210 });
    check('tight 300×210: only "a/b stacked beside C" works', tight.layouts.length === 1 &&
        tight.layouts[0].arr.groups.some(g => g.length === 2), show(tight));
    check('tight: that stack gets full marks (no symmetric option exists)', tight.layouts[0].lopsided === false);
    const wide = L.analyse([A, B, C], { x: 0, y: 0, w: 420, h: 210 });
    // a row = all three centres on one horizontal line (however the arrangement describes it)
    const row = wide.layouts.find(l => new Set(Object.values(l.geom.centers).map(c => Math.round(c.y))).size === 1);
    check('wide 420×210: a side-by-side row works', !!row, show(wide));
    const sym = wide.good.find(l => l.arr.dir === 'columns' && l.arr.groups.map(g => g[0]).join('') === 'aCb');
    const lop = wide.good.find(l => l.arr.dir === 'columns' && l.arr.groups.map(g => g[0]).join('') === 'abC');
    check('wide: a C b is symmetric (asym 0)', sym && sym.asym === 0);
    check('wide: a b C is lopsided', lop && lop.asym > wide.bestAsym);
    const perfectSym = L.scorePlacement([A, B, C], { x: 0, y: 0, w: 420, h: 210 }, centres(sym), wide);
    const perfectLop = L.scorePlacement([A, B, C], { x: 0, y: 0, w: 420, h: 210 }, centres(lop), wide);
    check('a C b placed perfectly scores 100', perfectSym.score === 100, perfectSym.score);
    check(`a b C placed perfectly passes but not full (${perfectLop.score})`, perfectLop.score === 100 - L.LOPSIDED_PENALTY);
}
section('Four shapes: a C D b and C a b D are both symmetric; D b a C too');
{
    const s = [{ id: 'a', size: 50 }, { id: 'b', size: 52 }, { id: 'C', size: 100 }, { id: 'D', size: 98 }];
    const arr = order => ({ dir: 'columns', groups: order.split('').map(x => [x]) });
    const as = o => L.asymmetry(arr(o), id => s.find(x => x.id === id).size);
    check('a C D b → 0', as('aCDb') === 0);
    check('C a b D → 0', as('CabD') === 0);
    check('D b a C → 0', as('DbaC') === 0);
    check('a b C D → lopsided', as('abCD') > 0);
}
section('2×2 grid of equal squares: several pairings, one picture');
{
    const sq = 'abcd'.split('').map(id => ({ id, size: 70 }));
    const an = L.analyse(sq, { x: 0, y: 0, w: 260, h: 260 });
    const grids = an.good.filter(a => a.arr.groups.length === 2 && a.arr.groups.every(g => g.length === 2));
    check(`many grid arrangements work (${grids.length})`, grids.length >= 6);
    check('…but they are one picture for the thumbnails', an.layouts.filter(l => l.arr.groups.length === 2 && l.arr.groups.every(g => g.length === 2)).length === 1);
}
section('Arrangement count');
{
    let c = 0; for (const _ of L.arrangements(['a', 'b', 'c', 'd', 'e'])) c++;
    check('5 shapes → 3840 arrangements (1920 per direction)', c === 3840, c);
}

section('Generated puzzles — 300 per round, every round');
{
    const r = rng(42);
    for (let round = 0; round < L.ROUNDS.length; round++) {
        let ok = 0, perfect = 0, centreFail = 0, fit = 0, ratioOk = 0, stackRule = 0, trayOk = 0, ms = 0, gaveAway = 0;
        const N = 300, cfg = L.ROUNDS[round];
        for (let i = 0; i < N; i++) {
            const t0 = performance.now();
            const p = L.makePuzzle(round, r);
            const an = p.analysis;
            if (an.good.length) ok++;
            // the most symmetric working layout, placed exactly, is a perfect 100
            const best = an.layouts[0];
            const t1 = performance.now();
            const sc = L.scorePlacement(p.shapes, p.rect, centres(best), an);
            ms = Math.max(ms, t1 - t0 + (performance.now() - t1));
            if (sc.score === 100) perfect++;
            // shapes inside the stage, min size respected
            const inStage = p.shapes.every(s => s.size >= L.MIN_SHAPE) &&
                p.rect.x >= 0 && p.rect.y >= 0 && p.rect.x + p.rect.w <= L.STAGE.w && p.rect.y + p.rect.h <= L.STAGE.h;
            if (inStage) fit++;
            const sizes = p.shapes.map(s => s.size), ratio = Math.max(...sizes) / Math.min(...sizes);
            if (ratio >= cfg.ratio[0] * 0.9 && ratio <= cfg.ratio[1] * 1.1) ratioOk++;
            if (cfg.plan !== 'stack' || !an.good.some(a => a.arr.groups.every(g => g.length === 1))) stackRule++;
            // tray: shapes start outside the rectangle and don't overlap each other
            const box = s => { const c = p.start[s.id]; return { l: c.x - s.size / 2, r: c.x + s.size / 2, t: c.y - s.size / 2, b: c.y + s.size / 2 }; };
            const R = { l: p.rect.x, r: p.rect.x + p.rect.w, t: p.rect.y, b: p.rect.y + p.rect.h };
            const hit = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
            const bs = p.shapes.map(box);
            if (bs.every(b => !hit(b, R) && b.l >= 0 && b.t >= 0 && b.r <= L.STAGE.w && b.b <= L.STAGE.h) &&
                bs.every((a, i) => bs.every((b, j) => i === j || !hit(a, b)))) trayOk++;
            // spacing by CENTRES (the classic mistake) should cost points when sizes differ
            if (best.arr.groups.length > 2 && ratio > 1.4) {
                const cols = best.arr.dir === 'columns';
                const along = cols ? p.rect.w : p.rect.h, start0 = cols ? p.rect.x : p.rect.y;
                const k = best.arr.groups.length;
                const placed = centres(best);
                best.arr.groups.forEach((g, gi) => g.forEach(id => {
                    const c = start0 + along * (gi + 1) / (k + 1);
                    if (cols) placed[id].x = c; else placed[id].y = c;
                }));
                const sc2 = L.scorePlacement(p.shapes, p.rect, placed, an);
                if (sc2.score < 100) centreFail++; else gaveAway++;
            }
        }
        console.log(`    round ${round + 1}: n=${cfg.n} plan=${cfg.plan} slowest ${ms.toFixed(1)}ms`);
        check(`round ${round + 1}: every puzzle has a working layout`, ok === N, ok);
        check(`round ${round + 1}: best layout placed exactly scores 100`, perfect === N, perfect);
        check(`round ${round + 1}: rectangle on the stage, shapes ≥ ${L.MIN_SHAPE}`, fit === N, fit);
        check(`round ${round + 1}: size ratio within the round's range`, ratioOk === N, ratioOk);
        check(`round ${round + 1}: "stack" rounds can't be solved with one row`, stackRule === N, stackRule);
        check(`round ${round + 1}: starting shapes sit in the tray, not overlapping`, trayOk === N, trayOk);
        check(`round ${round + 1}: centre-spacing never scores a full 100`, gaveAway === 0, gaveAway);
        check(`round ${round + 1}: puzzle + scoring under 250ms`, ms < 250, ms.toFixed(0));
    }
}

section('Wrong layout costs the layout penalty and points to a working one');
{
    const s = [{ id: 'a', size: 60 }, { id: 'b', size: 60 }, { id: 'C', size: 150 }];
    const rect = { x: 0, y: 0, w: 300, h: 210 };
    const an = L.analyse(s, rect);
    const rowArr = an.all.find(a => a.arr.dir === 'columns' && a.arr.groups.length === 3 && a.fits);
    const sc = L.scorePlacement(s, rect, centres(rowArr), an);
    check(`row in the tight rectangle is not ok (score ${sc.score})`, !sc.ok && sc.score <= 100 - L.LAYOUT_PENALTY);
    check('…and the nearest working layout is offered', !!sc.nearestGood && sc.nearestGood.ok);
    const bars = L.measuredGaps(sc.match.arr, s, rect, centres(rowArr), sc.match.geom);
    const expect = sc.match.arr.groups.length + 1 + sc.match.arr.groups.reduce((t, g) => t + g.length + 1, 0);
    check(`measured gaps: one bar per gap (${expect})`, bars.length === expect, bars.length);
    check('measured main gaps equal the planned gap when placed exactly',
        bars.filter(b => b.axis === 'main').every(b => Math.abs(b.len - b.target) < 0.01));
}

finish('bp3-layout-test');
