// bp3-browser-test.mjs — plays Balanced Placement III in headless Chromium.
// node bp3-browser-test.mjs    (uses the machine's preinstalled Playwright)
// Firebase is replaced by small stubs (no sign-in, leaderboard reads fail politely);
// the rest — page, games.css, bp3-layout.js — is the real thing. Every request to any
// other website is blocked and counted. Screenshots: tests/.screens/bp3-*.png
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
}).listen(8771);
const BASE = 'http://127.0.0.1:8771';

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
    await page.goto(BASE + '/balancedplacement3.html');
    return { ctx, page, errors, outside };
}

// logical stage point → screen point
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
const state = page => page.evaluate(() => ({
    shapes: __bp3.puzzle.shapes, pos: __bp3.pos, rect: __bp3.puzzle.rect,
    best: __bp3.puzzle.analysis.layouts[0].geom.centers,
    layouts: __bp3.puzzle.analysis.all.filter(l => l.fits).map(l => ({ lopsided: l.penalty >= 10 && l.symPenalty > l.gapPenalty, penalty: l.penalty, centers: l.geom.centers, groups: l.arr.groups, dir: l.arr.dir })),
    round: __bp3.puzzle.round,
}));
// shapes may start in a pile, so drag the TOP one first (what a student would grab)
async function placeAll(page, targets, drag) {
    const order = await page.evaluate(() => [...__bp3.drawOrder].reverse());
    for (const id of order) {
        const cur = (await state(page)).pos[id];
        await drag(cur, targets[id]);
    }
}
const submit = async page => { await page.click('#submitButton'); return page.evaluate(() => ({ score: __bp3.result.score, ok: __bp3.result.ok, lopsided: __bp3.result.lopsided, penalty: __bp3.result.penalty })); };

const browser = await chromium.launch();

section('Desktop: play all 10 rounds, placing the best layout by mouse');
{
    const { ctx, page, errors, outside } = await open(browser, { viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1 });
    await page.screenshot({ path: join(SHOTS, 'bp3-start.png') });
    await page.click('#startGameBtn');
    const scores = [];
    for (let r = 1; r <= 10; r++) {
        const s = await state(page);
        await page.screenshot({ path: join(SHOTS, `bp3-round${r}-before.png`) });
        await placeAll(page, s.best, (a, b) => dragMouse(page, a, b));
        const res = await submit(page);
        scores.push(res.score);
        const thumbs = await page.locator('.layout-thumb').count();
        check(`round ${r}: best layout by mouse scores ≥ 98 (${res.score}), ${thumbs} layout picture(s)`, res.score >= 98 && res.ok && !res.lopsided && thumbs >= 1);
        check(`round ${r}: your layout is marked in the pictures`, await page.locator('.layout-thumb.yours').count() === 1);
        await page.screenshot({ path: join(SHOTS, `bp3-round${r}-after.png`), fullPage: true });
        await page.click('#nextButton');
    }
    check('game over screen after round 10', await page.locator('#gameOverScreen.active').count() === 1);
    const total = await page.textContent('#finalScore');
    check(`final score is the sum of rounds (${total})`, Number(total) === scores.reduce((a, b) => a + b, 0));
    check('not signed in → "sign in" message, leaderboard failure shown politely',
        await page.locator('#notSignedInMsg:not(.hidden)').count() === 1);
    await page.screenshot({ path: join(SHOTS, 'bp3-gameover.png'), fullPage: true });
    check('no script errors', errors.length === 0, errors.join(' | '));
    check('no requests to outside websites', outside.length === 0, outside.join(' '));
    await ctx.close();
}

section('Mistakes cost points');
{
    const { ctx, page, errors } = await open(browser, { viewport: { width: 1280, height: 1000 } });
    await page.click('#startGameBtn');
    // Round 1: leave everything in the tray
    let res = await submit(page);
    check(`shapes left in the tray score low (${res.score})`, res.score < 30);
    await page.click('#nextButton');
    // Round 2: space by CENTERS instead of edges
    let s = await state(page);
    const best = { centers: s.best };
    // round 2 is always a single row: find which way it runs, then space the CENTRES evenly
    const pts = Object.entries(best.centers);
    const horiz = new Set(pts.map(([, c]) => Math.round(c.y))).size === 1;
    const centersOnly = JSON.parse(JSON.stringify(best.centers));
    pts.sort((a, b) => horiz ? a[1].x - b[1].x : a[1].y - b[1].y).forEach(([id], i) => {
        if (horiz) centersOnly[id].x = s.rect.x + s.rect.w * (i + 1) / (pts.length + 1);
        else centersOnly[id].y = s.rect.y + s.rect.h * (i + 1) / (pts.length + 1);
    });
    await placeAll(page, centersOnly, (a, b) => dragMouse(page, a, b));
    res = await submit(page);
    const sizes = s.shapes.map(x => x.size);
    const differ = Math.max(...sizes) / Math.min(...sizes) > 1.15;
    check(`centre-spaced row scores below a careful one (${res.score}${differ ? '' : ', sizes nearly equal'})`, differ ? res.score < 98 : true);
    await page.screenshot({ path: join(SHOTS, 'bp3-mistake-centers.png'), fullPage: true });
    // Find a round where a lopsided layout works, place it, expect the pass-not-full penalty
    let found = false;
    for (let r = 3; r <= 10 && !found; r++) {
        await page.click('#nextButton');
        s = await state(page);
        const lop = s.layouts.find(l => l.lopsided && l.penalty <= 30);
        if (!lop) {
            await submit(page); continue;
        }
        await placeAll(page, lop.centers, (a, b) => dragMouse(page, a, b));
        res = await submit(page);
        check(`round ${r}: lopsided layout loses its balance points (${res.score}, −${res.penalty}, lopsided=${res.lopsided})`, !res.ok && res.lopsided && res.score <= 92 && res.score >= 100 - 45 - 3);
        await page.screenshot({ path: join(SHOTS, 'bp3-lopsided.png'), fullPage: true });
        found = true;
    }
    if (!found) console.log('    (no lopsided layout came up in this game — random; not a failure)');
    check('no script errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
}

section('Phone (iPhone 13): touch dragging, layout fits the screen');
{
    const { ctx, page, errors, outside } = await open(browser, { ...devices['iPhone 13'] });
    const cdp = await ctx.newCDPSession(page);
    await page.click('#startGameBtn');
    const s = await state(page);
    await placeAll(page, s.best, (a, b) => dragTouch(page, cdp, a, b));
    const after = await state(page);
    const moved = s.shapes.every(sh => Math.hypot(after.pos[sh.id].x - s.best[sh.id].x, after.pos[sh.id].y - s.best[sh.id].y) < 3);
    check('touch drags move every shape to its spot', moved);
    const res = await submit(page);
    check(`touch round scores ≥ 95 (${res.score})`, res.score >= 95);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    check('no sideways scrolling on the phone', !overflow);
    await page.screenshot({ path: join(SHOTS, 'bp3-phone.png'), fullPage: true });
    check('no script errors', errors.length === 0, errors.join(' | '));
    check('no requests to outside websites', outside.length === 0, outside.join(' '));
    await ctx.close();
}

section('Keyboard: space submits and advances');
{
    const { ctx, page } = await open(browser, { viewport: { width: 1280, height: 1000 } });
    await page.keyboard.press('Space');
    check('space starts the game', await page.locator('#gameScreen.active').count() === 1);
    await page.keyboard.press('Space');
    check('space submits', await page.locator('#nextButton:not(.hidden)').count() === 1);
    await page.keyboard.press('Space');
    check('space goes to the next round', (await page.textContent('#roundCounter')) === '2');
    await ctx.close();
}

await browser.close();
srv.close();
finish('bp3-browser-test');
