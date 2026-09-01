# HANDOFF — Leaderboard outage: missing composite indexes

**Session:** "the leaderboard won't load" → repo-wide fix
**Claude instance:** Binny (continuing from the Picture Perfect session — same
typefounder-naming convention, same instance)
**Date:** 2026-08-28/29
**Files changed:** 8 game files (patch bumps) + `formattrainer.html` (patch),
plus new `firestore.indexes.json` and an updated `README.md`.

---

## 1. What was actually wrong

Not a code bug in Find the Center. **Two Firestore composite indexes on the
`scores` collection were missing.** Every game filters by `gameId` and sorts by
`score` — that shape needs a composite index; Firestore only auto-indexes a
single field. `leaderboard.html` was the one page immune to this, because it
sorts by `score` alone with no `gameId` filter, which is exactly why "index
loads, in-game leaderboard doesn't" was the reported symptom.

Confirmed with a browser-console diagnostic that ran the identical query shape
against `find-the-center`, `balanced-placement`, `picture-perfect`, and
`sweet-spot` — all four failed identically with `failed-precondition`, which
rules out anything specific to one game (a Firestore composite index is keyed
on collection + field sequence, not on the filter value, so it can't be broken
for one `gameId` and fine for another).

Two indexes were required, not one — the audit script below found a second
query shape (`getPlayerRank()`'s `score >` comparison, and Format Trainer's
ascending sort for its timed levels) that needed its own index in the opposite
sort direction. Both are now built and verified live on real data — see §6.

## 2. Diagnostic tooling delivered this session

Three console scripts, all read-only, all still valid to keep around:

- `leaderboard-diagnostic.js` — runs the failing query shape against four
  `gameId`s plus the no-filter `leaderboard.html` shape, to distinguish
  "index-wide" from "one game." Decoded the returned `create_composite` URL to
  confirm both index requirement and field order.
- `write-check.js` — orders by `timestamp` only (single-field, works even with
  no composite index) to prove writes were landing throughout the outage. 17
  real `find-the-center` documents, 14 in the trailing 200, all numeric
  `score`.
- `verify-ascending-index.js` — exercises the second index's exact query
  shapes (`getPlayerRank`'s inequality, Format Trainer's ascending sort)
  independently, since the first script never calls either.

All three ran clean on real data. Both indexes confirmed `Enabled`, not just
`Building`.

## 3. Second, independent bug found while diagnosing

Not the outage's root cause, but it made the outage worse and harder to
diagnose live. In every game's `handleScoreSubmit()`:

```js
const scores = await loadLeaderboard();
renderLeaderboard(scores, scoreId);
```

`loadLeaderboard()` already renders on success *and* on failure (writing an
error message into the DOM on the catch path). This second call ran
unconditionally afterward and **overwrote whatever `loadLeaderboard()` had just
written** — including its own error message — with `renderLeaderboard([])`'s
"No scores yet. Be the first!"

Net effect: a student submits a score during the outage, sees "✓ Score saved!"
(true — writes were never broken), directly above a leaderboard claiming no one
has ever played this game (false — it's the same index failure, just
relabeled). That combination reads exactly like data loss, which is why you
suspected scores weren't being recorded even though they were.

## 4. The fix, applied identically across 9 files

**`loadLeaderboard(highlightId = null)`** (8 games; `formattrainer.html` has a
different shape, see §5):

```js
function describeFirestoreError(error) {
    if (error && error.code === 'failed-precondition') {
        return 'Leaderboard is temporarily unavailable (index building). Try again shortly.';
    }
    if (error && error.code === 'permission-denied') {
        return 'You do not have permission to view scores right now.';
    }
    return 'Error loading leaderboard.';
}

async function loadLeaderboard(highlightId = null) {
    const leaderboardList = document.getElementById('leaderboardList');
    if (!db) { /* unchanged */ }

    let scores;
    try {
        const q = query(collection(db, 'scores'), where('gameId', '==', '<id>'),
                         orderBy('score', 'desc'), limit(10));
        const snapshot = await getDocs(q);
        scores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Load leaderboard error:', error);
        leaderboardList.innerHTML = `<p class="...">${describeFirestoreError(error)}</p>`;
        return [];
    }

    // Rendering happens outside the try/catch: a render bug can never be
    // reported to a student as a database problem, and a query failure can
    // never get silently overwritten by "No scores yet" a moment later.
    renderLeaderboard(scores, highlightId);
    return scores;
}
```

Three structural changes, all load-bearing:

1. `error.code` is inspected and turned into an actual sentence instead of a
   generic "Error loading leaderboard" string that meant nothing to you when
   you hit it.
2. The `snapshot.empty` special case is gone — it's redundant now that
   `renderLeaderboard([])` already shows "No scores yet" on its own, and having
   two near-identical "no scores" strings (loadLeaderboard's and
   renderLeaderboard's) had already drifted apart in wording in a couple of
   files (Balanced Placement II said "Be the first!" in one and not the other).
   Single source of truth now — Rule 9.
3. `renderLeaderboard()` moved **outside** the `try`. Previously a bug inside
   `renderLeaderboard` itself (a bad template string, a null field) would have
   been caught by the same `catch` and reported as "Error loading leaderboard,"
   which would have sent you looking at Firestore for a rendering bug.

**Call sites.** Every `handleScoreSubmit()` that did
`const scores = await loadLeaderboard(); renderLeaderboard(scores, scoreId);`
now does `await loadLeaderboard(scoreId);` — one call, no clobber. Balanced
Placement II and Picture Perfect compute a client-side rank from the returned
top-10 array (`scores.findIndex(...)`), so those keep `const scores =
await loadLeaderboard(scoreId);` and just drop the now-redundant second
`renderLeaderboard` call.

Bare `loadLeaderboard();` calls at `endGame()` (no highlight) needed no
changes — the new signature defaults `highlightId` to `null`.

**Sweet Spot** additionally never had the `if (!db)` guard the other seven
games have on `loadLeaderboard()`. Added it for consistency — if Firebase
fails to initialize, it now shows "Leaderboard unavailable" like every sibling
instead of throwing inside `collection(db, ...)` and falling into the generic
catch path.

## 5. Format Trainer — different shape, same underlying bug

Format Trainer shows four leaderboards at once in a single modal (`Basic
Speed`, `MLA Speed`, `Random Speed`, `Streak`). Its `loadScores()` returned a
bare array on both success-with-no-data and failure — genuinely
indistinguishable to the caller, so an index outage would have shown all four
cards as "No scores yet" with zero indication anything was wrong.

Changed `loadScores()` to return `{ data, error }`:

```js
async function loadScores(gameId, sortDir='asc', max=10) {
    if (!db) return { data: [], error: null };
    try {
        const q = query(collection(db,'scores'), where('gameId','==',gameId),
                         orderBy('score',sortDir), limit(max));
        const snap = await getDocs(q);
        return { data: snap.docs.map(d => d.data()), error: null };
    } catch(e) {
        console.error('Load scores error:', e);
        return { data: [], error: describeFirestoreError(e) };
    }
}
```

`showLeaderboardModal()` now branches per card: `error` set → shows the reason
in red; `error` null and `data` empty → "No scores yet" as before; otherwise
renders the rows. `describeFirestoreError()` here returns the shorter card-form
strings ("Leaderboard unavailable (index building)") since it's rendering
inline in a small card, not a full sentence line.

Format Trainer's `saveScore()` write path was already honest (shows "Error
saving" when the write fails) — that half didn't need a fix, only the read
side did.

## 6. Verification

- `node --check` on the extracted `<script type="module">` body of all 9
  files — clean.
- Structural scan confirming: `describeFirestoreError` present in all 9;
  exactly one `renderLeaderboard(` call site outside its own definition in
  each of the 8 standard-shape files; no leftover double-call pattern
  anywhere; `formattrainer.html`'s `loadScores` and modal both updated
  together with no orphaned old-shape call left behind.
- **Live, on real data, run by you**: both diagnostic scripts came back fully
  green — `A`/`B`/`C`/`D` in the first script, `getPlayerRank` shape and
  Format Trainer ascending shape in the second (`0 docs` on the Format Trainer
  line is a data fact, not a failure — nobody's played `ft-basic-speed` yet).
- `firestore.indexes.json` validated as parseable JSON. Not deployable from
  this workflow (no CLI) — it's reference documentation only, called out
  explicitly in the README so a future recreation of the project doesn't
  silently drop back into this exact outage.

## 7. What I did not touch

- `admin.html` uses the same `gameId ==` + `orderBy(score)` query shape (lines
  ~3950, ~4070) and was almost certainly throwing the same error during the
  outage, but it's a large (5,500-line) internal tool you didn't report a
  symptom on, so I left it alone this session. Both indexes now cover its
  query shape too, so it should already be fixed as a side effect of the index
  creation — worth a quick look next time you're in there, but I did not audit
  its error-handling code.
- `migration.html` — marked "complete, consider archiving" in the README
  already; didn't touch it.
- Firestore security rules — untouched. `permission-denied` is now surfaced
  distinctly from `failed-precondition` in the UI, so if rules are ever the
  actual problem it won't masquerade as a missing index again.
- Data schema drift (`uid` vs `userId`, and inconsistent extra fields) flagged
  in an earlier session — real, but out of scope for an index/error-handling
  patch. Separate cleanup pass if you want it.

## 8. Suggested next steps

1. Play a full round on two or three of the games (not just Find the Center)
   to confirm the fix in the field, not just via the diagnostic scripts.
2. Skim `admin.html`'s two leaderboard-adjacent query sites for the same
   double-render pattern, since it shares the vintage of code these games did
   before this pass.
3. If you want the `uid`/`userId` schema drift cleaned up, that's a distinct
   session — touches every game's `submitScore()`, not just the leaderboard
   read path this session covered.
