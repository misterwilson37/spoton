// bp4-browser-test.mjs — plays Balanced Placement IV in headless Chromium (Firebase stubbed).
// node bp4-browser-test.mjs   Screenshots: tests/.screens/bp4-*.png
import { createRequire } from 'node:module';
import http from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { check, section, finish, ROOT } from './harness.mjs';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const SHOTS = join(ROOT, 'tests', '.screens'); mkdirSync(SHOTS, { recursive: true });

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml' };
const srv = http.createServer((req, res) => {
    const f = join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!f.startsWith(ROOT) || !existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' });
    res.end(readFileSync(f));
}).listen(8773);
const BASE = 'http://127.0.0.1:8773';

const STUBS = {
    'firebase-app.js': 'export const initializeApp = () => ({});',
    'firebase-auth.js': `export const getAuth = () => ({}); export class GoogleAuthProvider {}
        export const signInWithPopup = async () => {}; export const signOut = async () => {};
        export const onAuthStateChanged = (a, cb) => setTimeout(() => cb(null), 0);`,
    'firebase-firestore.js': `export const getFirestore = () => ({}); export const collection = () => ({});
        export const query = () => ({}); export const where = () => ({}); export const orderBy = () => ({});
        export const limit = () => ({}); export const getDocs = async () => { throw Object.assign(new Error('offline'), { code: 'unavailable' }); };
        export const addDoc = async () => ({ id: 'x' }); export const setDoc = async () => {}; export const doc = () => ({});
        export const serverTimestamp = () => null;`,
};

async function open(browser, ctxOpts) {
    const ctx = await browser.newContext(ctxOpts);
    const page = await ctx.newPage();
    const errors = [], outside = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/offline|Load leaderboard/.test(m.text())) errors.push(m.text()); });
    await page.route('**/*', r => {
        const url = r.request().url();
        const m = url.match(/^https:\/\/www\.gstatic\.com\/firebasejs\/11\.6\.1\/(firebase-[a-z]+\.js)$/);
        if (m && STUBS[m[1]]) return r.fulfill({ contentType: 'text/javascript', body: STUBS[m[1]] });
        if (url.startsWith(BASE)) return r.continue();
        outside.push(url); return r.abort();
    });
    await page.goto(BASE + '/balancedplacement4.html');
    return { ctx, page, errors, outside };
}


async function toScreen(page, p) {
    const b = await page.locator('#gameCanvas').boundingBox();
    return { x: b.x + p.x * b.width / 600, y: b.y + p.y * b.height / 450 };
}
async function dragMouse(page, from, to) {
    const a = await toScreen(page, from), b = await toScreen(page, to);
    await page.mouse.move(a.x, a.y); await page.mouse.down();
    await page.mouse.move((a.x + b.x) / 2, (a.y + b.y) / 2, { steps: 4 });
    await page.mouse.move(b.x, b.y, { steps: 4 }); await page.mouse.up();
}
async function dragTouch(page, cdp, from, to) {
    const a = await toScreen(page, from), b = await toScreen(page, to);
    const pt = p => [{ x: p.x, y: p.y, id: 1 }];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(a) });
    for (let i = 1; i <= 6; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt({ x: a.x + (b.x - a.x) * i / 6, y: a.y + (b.y - a.y) * i / 6 }) });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
const state = page => page.evaluate(() => {
    const r = __bp4.round;
    return { pieces: r.pieces.map(p => ({ id: p.id, role: p.role, w: p.w, h: p.h })), pos: __bp4.pos, page: r.page, shape: r.shape, kind: r.kind, poster: r.poster.id,
             best: r.analysis.layouts[0].geom.centers };
});
// Pieces may overlap. Like a student, grab each piece by a spot where it's actually visible
// (not covered by a piece on top), and drop it so that its centre lands on the target.
const visibleSpot = (page, id) => page.evaluate(id => {
    const r = __bp4.round, pos = __bp4.pos, order = __bp4.drawOrder;
    const box = pid => { const p = r.pieces.find(q => q.id === pid); return { x: pos[pid].x, y: pos[pid].y, w: p.w, h: p.h }; };
    const inside = (b, x, y) => Math.abs(x - b.x) <= b.w / 2 + 4 && Math.abs(y - b.y) <= b.h / 2 + 4;
    const me = box(id), above = order.slice(order.indexOf(id) + 1).map(box);
    for (let fy = 0.5; fy >= 0.08; fy -= 0.07) for (const sy of [1, -1]) for (let fx = 0.5; fx >= 0.08; fx -= 0.07) for (const sx of [1, -1]) {
        const x = me.x + sx * (0.5 - fx) * me.w, y = me.y + sy * (0.5 - fy) * me.h;
        if (x < 1 || y < 1 || x > 599 || y > 449) continue;
        if (!above.some(b => inside(b, x, y))) return { x, y, dx: x - me.x, dy: y - me.y };
    }
    return null;
}, id);
async function placeAll(page, targets, drag) {
    // 1. clear the page: top piece first, each to its own corner/edge of the stage
    const corners = [{ x: 0, y: 0 }, { x: 600, y: 450 }, { x: 600, y: 0 }, { x: 0, y: 450 }, { x: 300, y: 0 }, { x: 300, y: 450 }];
    let order = await page.evaluate(() => [...__bp4.drawOrder].reverse());
    for (let i = 0; i < order.length; i++) {
        const g = await visibleSpot(page, order[i]);
        if (g) await drag({ x: g.x, y: g.y }, { x: corners[i].x + g.dx, y: corners[i].y + g.dy });
    }
    // 2. place them, top of the parked pile first
    const ids = (await state(page)).pieces.map(p => p.id), done = new Set();
    for (let pass = 0; pass < 4 && done.size < ids.length; pass++) {
        order = await page.evaluate(() => [...__bp4.drawOrder].reverse());
        for (const id of order) {
            if (done.has(id)) continue;
            const g = await visibleSpot(page, id);
            if (!g) continue;
            await drag({ x: g.x, y: g.y }, { x: targets[id].x + g.dx, y: targets[id].y + g.dy });
            done.add(id);
        }
    }
    if (done.size < ids.length) {
        const st = await page.evaluate(() => ({ pos: __bp4.pos, order: __bp4.drawOrder, sizes: __bp4.round.pieces.map(p => [p.id, Math.round(p.w), Math.round(p.h)]) }));
        console.log('    [test] could not grab:', ids.filter(i => !done.has(i)).join(','), JSON.stringify(st));
    }
}
const submit = async page => { await page.click('#submitButton'); return page.evaluate(() => ({ score: __bp4.result.score, ok: __bp4.result.ok, penalty: __bp4.result.penalty, extra: __bp4.result.extraPart })); };
const waitRound = page => page.waitForFunction(() => window.__bp4 && __bp4.round);

const browser = await chromium.launch();

section('Desktop: play all 10 rounds, placing the best layout by mouse');
{
    const { ctx, page, errors, outside } = await open(browser, { viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1 });
    await page.goto(BASE + '/balancedplacement4.html');
    await page.screenshot({ path: join(SHOTS, 'bp4-start.png') });
    await page.click('#startGameBtn');
    await waitRound(page);
    const scores = [], posters = new Set(), shapes = { tall: 0, wide: 0 };
    for (let r = 1; r <= 10; r++) {
        const s = await state(page);
        posters.add(s.poster); shapes[s.shape]++;
        await page.screenshot({ path: join(SHOTS, `bp4-round${r}-before.png`) });
        await placeAll(page, s.best, (a, b) => dragMouse(page, a, b));
        const placed = (await state(page)).pos;
        const misses = s.pieces.map(p => `${p.id}:${Math.round(Math.hypot(placed[p.id].x - s.best[p.id].x, placed[p.id].y - s.best[p.id].y))}`).join(' ');
        const res = await submit(page);
        scores.push(res.score);
        check(`round ${r} (${s.kind}, ${s.shape}, ${s.poster}): best layout by mouse scores ≥ 97 (${res.score})`, res.score >= 97 && res.ok, misses + ' ' + JSON.stringify(s.pieces.map(p => [p.id, Math.round(p.w), Math.round(p.h)])));
        await page.screenshot({ path: join(SHOTS, `bp4-round${r}-after.png`), fullPage: true });
        await page.click('#nextButton');
    }
    check(`10 different posters (${posters.size})`, posters.size === 10);
    check(`both page shapes, 5 each (${JSON.stringify(shapes)})`, shapes.tall === 5 && shapes.wide === 5);
    check('game over screen after round 10', await page.locator('#gameOverScreen.active').count() === 1);
    const total = await page.textContent('#finalScore');
    check(`final score is the sum of rounds (${total})`, Number(total) === scores.reduce((a, b) => a + b, 0));
    check('no script errors', errors.length === 0, errors.join(' | '));
    check('no requests to outside websites', outside.length === 0, outside.join(' '));
    await ctx.close();
}

section('All 20 poster pictures load as images in the browser');
{
    const { ctx, page, errors } = await open(browser, { viewport: { width: 800, height: 600 } });
    await page.goto(BASE + '/balancedplacement4.html');
    const loaded = await page.evaluate(async () => {
        const { POSTERS, artSVG } = await import('./bp4-posters.js');
        const one = id => new Promise(res => { const i = new Image(); i.onload = () => res(i.naturalWidth === 300); i.onerror = () => res(false);
            i.src = URL.createObjectURL(new Blob([artSVG(id)], { type: 'image/svg+xml' })); });
        const r = await Promise.all(POSTERS.map(p => one(p.id)));
        return POSTERS.filter((p, i) => !r[i]).map(p => p.id);
    });
    check(`every picture loads (${loaded.length ? 'failed: ' + loaded.join(', ') : 'all 20'})`, loaded.length === 0);
    check('no script errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
}

section('Mistakes cost points');
{
    const { ctx, page, errors } = await open(browser, { viewport: { width: 1280, height: 1000 } });
    await page.goto(BASE + '/balancedplacement4.html');
    await page.click('#startGameBtn');
    await waitRound(page);
    let res = await submit(page);
    check(`the messy first draft, untouched, scores low (${res.score})`, res.score <= 50);
    await page.screenshot({ path: join(SHOTS, 'bp4-messy.png'), fullPage: true });
    await page.click('#nextButton');
    // round 2: swap the title and tagline spots → reading-order penalty
    const s = await state(page);
    const swapped = JSON.parse(JSON.stringify(s.best));
    [swapped.title, swapped.tagline] = [s.best.tagline, s.best.title];
    await placeAll(page, swapped, (a, b) => dragMouse(page, a, b));
    res = await submit(page);
    check(`tagline above the title loses the "title first" points (${res.score}, −${res.penalty})`, res.score <= 85 && res.extra > 0);
    await page.screenshot({ path: join(SHOTS, 'bp4-title-second.png'), fullPage: true });
    check('no script errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
}

section('Phone (iPhone 13): touch dragging');
{
    const { ctx, page, errors, outside } = await open(browser, { ...devices['iPhone 13'] });
    const cdp = await ctx.newCDPSession(page);
    await page.goto(BASE + '/balancedplacement4.html');
    await page.click('#startGameBtn');
    await waitRound(page);
    const s = await state(page);
    await placeAll(page, s.best, (a, b) => dragTouch(page, cdp, a, b));
    const res = await submit(page);
    check(`touch round scores ≥ 95 (${res.score})`, res.score >= 95);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    check('no sideways scrolling on the phone', !overflow);
    await page.screenshot({ path: join(SHOTS, 'bp4-phone.png'), fullPage: true });
    check('no script errors', errors.length === 0, errors.join(' | '));
    check('no requests to outside websites', outside.length === 0, outside.join(' '));
    await ctx.close();
}

await browser.close();
srv.close();
finish('bp4-browser-test');
