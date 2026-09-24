// privacy-tools.js v1.0.0 — the admin page's privacy tools, kept out of admin.html
// so tests/purge-retention-test.mjs can run THIS EXACT FILE against a real
// Firestore emulator. Written by Figgins, Sept 2026 (privacy round).
//
// Four tools, each in two halves — a PLAN (reads only, nothing changes) and an
// APPLY (does exactly what the plan listed). admin.html always shows the plan and
// asks Jake to confirm before calling apply.
//
//   1. Legacy cleanup   — one time. Moves each email off the public score records into
//                         the private players/{uid} record, then strips email, name,
//                         photo and the old "userId" field off every score.
//   2. Delete a student — on a school/parent request. Everything: scores AND the
//                         email link. (The sign-in account itself is deleted in the
//                         Firebase console — no web page can delete someone else's.)
//   3. Retention        — quarterly. A student with no saved score for 24 months has
//                         their email link deleted and their scores made anonymous:
//                         initials and scores stay on the boards, attached to nobody.
//   4. Image hosts      — reads only. Which websites the games' pictures load from.
//
// ⚠️ ORDER MATTERS, and is the same in every tool: the step that would lose the only
// copy of something runs LAST, so a run interrupted halfway (tab closed, network
// drop) leaves everything findable and the tool is safe to run again.

import { collection, getDocs, doc, query, where, writeBatch, deleteField, Timestamp }
    from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export const PRIVACY_TOOLS_VERSION = '1.0.0';

// ⚠️ THE retention period. privacy.html and SECURITY.md state it in words;
// tests/privacy-promises-test.mjs checks all three agree.
export const RETENTION_MONTHS = 24;

// Fields that older versions of the games put on public score records.
export const LEGACY_PERSONAL_FIELDS = ['email', 'displayName', 'photoURL', 'userId'];

const BATCH_LIMIT = 450; // Firestore allows 500 writes per batch; leave headroom.

// ---------- helpers ----------
function ownerOf(score) { return score.uid || score.userId || null; }
function millis(t) { return t && typeof t.toMillis === 'function' ? t.toMillis() : null; }
function normEmail(e) { return String(e || '').trim().toLowerCase(); }

async function readAll(db, name) {
    const snap = await getDocs(collection(db, name));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Runs a list of (batch) => void steps, BATCH_LIMIT per commit, in order.
async function commitSteps(db, steps) {
    for (let i = 0; i < steps.length; i += BATCH_LIMIT) {
        const batch = writeBatch(db);
        steps.slice(i, i + BATCH_LIMIT).forEach(step => step(batch));
        await batch.commit();
    }
    return steps.length;
}

export function retentionCutoff(nowMs = Date.now()) {
    const d = new Date(nowMs);
    d.setMonth(d.getMonth() - RETENTION_MONTHS);
    return d.getTime();
}

// ============================================================
// 1. LEGACY CLEANUP (one time)
// ============================================================
export async function planLegacyScrub(db) {
    const scores = await readAll(db, 'scores');
    const players = new Map((await readAll(db, 'players')).map(p => [p.id, p]));

    const dirty = scores.filter(s => LEGACY_PERSONAL_FIELDS.some(f => f in s));
    const links = new Map();          // uid -> { email, lastMs }
    let emailWithNoAccount = 0;       // an email with no account ID to hang it on

    for (const s of dirty) {
        const uid = ownerOf(s);
        const email = normEmail(s.email);
        if (!email) continue;
        if (!uid) { emailWithNoAccount++; continue; }
        const ms = millis(s.timestamp) ?? 0;
        const cur = links.get(uid) || { email, lastMs: -1 };
        if (ms >= cur.lastMs) { cur.email = email; cur.lastMs = ms; }  // newest score's email
        links.set(uid, cur);
    }
    // Never move a lastPlayed BACKWARD for a student who already has a record.
    for (const [uid, link] of links) {
        const existing = millis(players.get(uid)?.lastPlayed);
        if (existing && existing > link.lastMs) link.lastMs = existing;
    }
    return {
        scoresToClean: dirty.map(s => ({ id: s.id, uid: ownerOf(s) })),
        playersToWrite: [...links].map(([uid, l]) => ({ uid, email: l.email, lastMs: l.lastMs })),
        emailWithNoAccount
    };
}

export async function applyLegacyScrub(db, plan) {
    // Step 1 — copy every email to its private record FIRST.
    const playerSteps = plan.playersToWrite.map(p => batch =>
        batch.set(doc(db, 'players', p.uid),
                  { email: p.email, lastPlayed: Timestamp.fromMillis(p.lastMs) }));
    await commitSteps(db, playerSteps);

    // Step 2 — only then strip the public copies.
    const scoreSteps = plan.scoresToClean.map(s => batch => {
        const change = {};
        LEGACY_PERSONAL_FIELDS.forEach(f => { change[f] = deleteField(); });
        if (s.uid) change.uid = s.uid;       // "userId" scores become "uid" scores
        batch.update(doc(db, 'scores', s.id), change);
    });
    await commitSteps(db, scoreSteps);
    return { playersWritten: playerSteps.length, scoresCleaned: scoreSteps.length };
}

// ============================================================
// 2. DELETE A STUDENT (on request)
// ============================================================
export async function planStudentDelete(db, emailInput) {
    const email = normEmail(emailInput);
    if (!email) throw new Error('No email given');

    const uids = new Set();
    const playerSnap = await getDocs(query(collection(db, 'players'), where('email', '==', email)));
    playerSnap.docs.forEach(d => uids.add(d.id));
    // Scores saved before the legacy cleanup still carry the email directly.
    const legacySnap = await getDocs(query(collection(db, 'scores'), where('email', '==', email)));
    legacySnap.docs.forEach(d => { const o = ownerOf(d.data()); if (o) uids.add(o); });

    const scoreIds = new Set(legacySnap.docs.map(d => d.id));
    for (const uid of uids) {
        for (const field of ['uid', 'userId']) {
            const snap = await getDocs(query(collection(db, 'scores'), where(field, '==', uid)));
            snap.docs.forEach(d => scoreIds.add(d.id));
        }
    }
    return { email, uids: [...uids], playerIds: playerSnap.docs.map(d => d.id), scoreIds: [...scoreIds] };
}

export async function applyStudentDelete(db, plan) {
    // Scores first; the email link LAST, so an interrupted run can be found and repeated.
    await commitSteps(db, plan.scoreIds.map(id => batch => batch.delete(doc(db, 'scores', id))));
    await commitSteps(db, plan.playerIds.map(id => batch => batch.delete(doc(db, 'players', id))));
    return { scoresDeleted: plan.scoreIds.length, playersDeleted: plan.playerIds.length };
}

// ============================================================
// 3. RETENTION (quarterly)
// ============================================================
// "Last active" = the later of the student's newest saved score and their players
// record's lastPlayed. Saving a score is the only thing SpotOn records, so it is the
// only activity there is to count.
export async function planRetention(db, nowMs = Date.now()) {
    const cutoff = retentionCutoff(nowMs);
    const scores = await readAll(db, 'scores');
    const players = await readAll(db, 'players');

    const byUid = new Map();   // uid -> { lastMs, scoreIds: [], email }
    const entry = uid => {
        if (!byUid.has(uid)) byUid.set(uid, { lastMs: null, scoreIds: [], email: '' });
        return byUid.get(uid);
    };
    let undated = 0;
    for (const s of scores) {
        const uid = ownerOf(s);
        if (!uid) continue;                       // already anonymous
        const e = entry(uid);
        e.scoreIds.push(s.id);
        const ms = millis(s.timestamp);
        if (ms === null) { undated++; continue; }
        e.lastMs = Math.max(e.lastMs ?? 0, ms);
    }
    for (const p of players) {
        const e = entry(p.id);
        e.email = p.email || '';
        const ms = millis(p.lastPlayed);
        if (ms !== null) e.lastMs = Math.max(e.lastMs ?? 0, ms);
    }
    const expired = [];
    for (const [uid, e] of byUid) {
        // No date at all → never expired automatically (listed for a human instead).
        if (e.lastMs !== null && e.lastMs < cutoff) {
            expired.push({ uid, email: e.email, lastMs: e.lastMs, scoreIds: e.scoreIds,
                           hasPlayerRecord: players.some(p => p.id === uid) });
        }
    }
    expired.sort((a, b) => a.lastMs - b.lastMs);
    return { cutoffMs: cutoff, expired, undatedScores: undated };
}

export async function applyRetention(db, plan) {
    // Make each expired student's scores anonymous (initials and score stay)…
    const scoreSteps = [];
    for (const s of plan.expired) {
        for (const id of s.scoreIds) {
            scoreSteps.push(batch => {
                const change = { uid: deleteField() };
                LEGACY_PERSONAL_FIELDS.forEach(f => { change[f] = deleteField(); });
                batch.update(doc(db, 'scores', id), change);
            });
        }
    }
    await commitSteps(db, scoreSteps);
    // …then delete the email link LAST.
    const playerSteps = plan.expired.filter(s => s.hasPlayerRecord)
        .map(s => batch => batch.delete(doc(db, 'players', s.uid)));
    await commitSteps(db, playerSteps);
    return { studentsExpired: plan.expired.length, scoresAnonymized: scoreSteps.length,
             playersDeleted: playerSteps.length };
}

// ============================================================
// 4. IMAGE HOSTS (reads only)
// ============================================================
// A picture loaded from another company's website shows that company each student's
// IP address. This lists every website the game content points at.
export async function listImageHosts(db) {
    const hosts = {};  // host -> { count, collections: Set }
    const visit = (value, where) => {
        if (typeof value === 'string') {
            let host = null;
            if (value.startsWith('data:')) host = '(stored inside the database)';
            else if (/^https?:\/\//i.test(value)) {
                try { host = new URL(value).host; } catch { host = null; }
            }
            if (host) {
                hosts[host] = hosts[host] || { count: 0, collections: new Set() };
                hosts[host].count++;
                hosts[host].collections.add(where);
            }
        } else if (value && typeof value === 'object') {
            Object.values(value).forEach(v => visit(v, where));
        }
    };
    for (const name of ['levels', 'picture-perfect-images', 'bp2-content', 'site-config']) {
        (await readAll(db, name)).forEach(d => visit(d, name));
    }
    return Object.entries(hosts)
        .map(([host, h]) => ({ host, count: h.count, collections: [...h.collections] }))
        .sort((a, b) => b.count - a.count);
}
