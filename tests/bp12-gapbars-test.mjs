// bp12-gapbars-test.mjs — the measuring lines (gap-bars.js) in Balanced Placement I and II,
// in headless Chromium with Firebase stubbed. node bp12-gapbars-test.mjs
// Screenshots: tests/.screens/bp1-bars-*.png, bp2-bars-*.png
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
}).listen(8772);
const BASE = 'http://127.0.0.1:8772';

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
    return { ctx, page, errors, outside };
}


// The container = bounding box of the container colour (#3a3a3a) on the canvas.
async function findRect(page) {
    return page.evaluate(() => {
        const c = document.getElementById('gameCanvas'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
        for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
            const i = (y * c.width + x) * 4;
            if (d[i] === 58 && d[i + 1] === 58 && d[i + 2] === 58) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
        }
        return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
    });
}
// how many canvas pixels are exactly a bar colour
const barPixels = page => page.evaluate(() => {
    const c = document.getElementById('gameCanvas'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    const n = { green: 0, amber: 0, red: 0 };
    for (let i = 0; i < d.length; i += 4) {
        if (d[i] === 34 && d[i + 1] === 197 && d[i + 2] === 94) n.green++;
        else if (d[i] === 251 && d[i + 1] === 191 && d[i + 2] === 36) n.amber++;
        else if (d[i] === 239 && d[i + 1] === 68 && d[i + 2] === 68) n.red++;
    }
    return n;
});
async function drag(page, a, b) {
    const box = await page.locator('#gameCanvas').boundingBox();
    await page.mouse.move(box.x + a.x, box.y + a.y); await page.mouse.down();
    await page.mouse.move(box.x + b.x, box.y + b.y, { steps: 6 }); await page.mouse.up();
}

const browser = await chromium.launch();

section('Balanced Placement I: perfect placement → every bar green');
for (let round = 1; round <= 3; round++) {
    const { ctx, page, errors, outside } = await open(browser, { viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1 });
    await page.goto(BASE + '/balancedplacement.html');
    await page.click('#startGameBtn');
    const r = await findRect(page);
    const W = await page.evaluate(() => document.getElementById('gameCanvas').width);
    const H = await page.evaluate(() => document.getElementById('gameCanvas').height);
    const rad = Math.min(r.w, r.h) * 0.20, wide = r.w >= r.h;
    const gap = ((wide ? r.w : r.h) - 4 * rad) / 3;
    const t1 = wide ? { x: r.x + gap + rad, y: r.y + r.h / 2 } : { x: r.x + r.w / 2, y: r.y + gap + rad };
    const t2 = wide ? { x: r.x + 2 * gap + 3 * rad, y: r.y + r.h / 2 } : { x: r.x + r.w / 2, y: r.y + 2 * gap + 3 * rad };
    await drag(page, { x: rad * 1.5, y: H / 2 - rad * 1.5 }, t1);
    await drag(page, { x: W - rad * 1.5, y: H / 2 + rad * 1.5 }, t2);
    await page.click('#submitButton');
    const n = await barPixels(page), score = await page.textContent('#totalScore');
    check(`round try ${round} (${wide ? 'wide' : 'tall'}): score ${score}, bars all green (${JSON.stringify(n)})`, n.green > 50 && n.amber === 0 && n.red === 0);
    await page.screenshot({ path: join(SHOTS, `bp1-bars-${round}.png`) });
    // a sloppy round: second shape nudged 25px → its neighbouring gaps go red
    await page.click('#nextButton');
    const r2 = await findRect(page);
    const rad2 = Math.min(r2.w, r2.h) * 0.20, wide2 = r2.w >= r2.h;
    const gap2 = ((wide2 ? r2.w : r2.h) - 4 * rad2) / 3;
    const H2 = H;
    const u1 = wide2 ? { x: r2.x + gap2 + rad2, y: r2.y + r2.h / 2 } : { x: r2.x + r2.w / 2, y: r2.y + gap2 + rad2 };
    const u2 = wide2 ? { x: r2.x + 2 * gap2 + 3 * rad2 + 25, y: r2.y + r2.h / 2 } : { x: r2.x + r2.w / 2, y: r2.y + 2 * gap2 + 3 * rad2 + 25 };
    await drag(page, { x: rad2 * 1.5, y: H2 / 2 - rad2 * 1.5 }, u1);
    await drag(page, { x: W - rad2 * 1.5, y: H2 / 2 + rad2 * 1.5 }, u2);
    await page.click('#submitButton');
    const n2 = await barPixels(page);
    check(`round try ${round}: 25px off → red bars appear (${JSON.stringify(n2)})`, n2.red > 20);
    await page.screenshot({ path: join(SHOTS, `bp1-bars-${round}-off.png`) });
    check('no script errors', errors.length === 0, errors.join(' | '));
    check('no outside requests', outside.length === 0, outside.join(' '));
    await ctx.close();
}

section('Balanced Placement II: bars drawn after Submit');
for (let round = 1; round <= 3; round++) {
    const { ctx, page, errors, outside } = await open(browser, { viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1 });
    await page.goto(BASE + '/balancedplacement2.html');
    await page.waitForTimeout(300);
    await page.click('#startGameBtn');
    await page.waitForTimeout(300);
    const r = await findRect(page);
    const W = await page.evaluate(() => document.getElementById('gameCanvas').width);
    const H = await page.evaluate(() => document.getElementById('gameCanvas').height);
    const wide = r.w >= r.h;
    const a = wide ? { x: r.x + r.w * 0.28, y: r.y + r.h / 2 } : { x: r.x + r.w / 2, y: r.y + r.h * 0.28 };
    const b = wide ? { x: r.x + r.w * 0.72, y: r.y + r.h / 2 } : { x: r.x + r.w / 2, y: r.y + r.h * 0.72 };
    await drag(page, { x: W * 0.12, y: H * 0.25 }, a);
    await drag(page, { x: W * 0.88, y: H * 0.75 }, b);
    await page.click('#submitButton');
    const n = await barPixels(page);
    check(`try ${round} (${wide ? 'wide' : 'tall'}): bars drawn (${JSON.stringify(n)})`, n.green + n.amber + n.red > 50);
    await page.screenshot({ path: join(SHOTS, `bp2-bars-${round}.png`) });
    check('no script errors', errors.length === 0, errors.join(' | '));
    check('no outside requests', outside.length === 0, outside.join(' '));
    await ctx.close();
}

await browser.close();
srv.close();
finish('bp12-gapbars-test');
