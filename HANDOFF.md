# HANDOFF — SpotOn

The running handoff for SpotOn. Newest session first. (The August leaderboard-index
session's handoff is kept separately in `HANDOFF-leaderboard-indexes.md`.)

## Session log — names taken

| Instance | Date | Session |
|---|---|---|
| Binny | Aug 2026 | Picture Perfect; leaderboard outage (missing composite indexes) |
| **Figgins** | Sep 24, 2026 | Privacy round (this one) |

**Figgins**, after Vincent Figgins, the English typefounder whose foundry cut one of the
first sans-serif typefaces (1832) — type stripped to what it needs. This round stripped
the score records down to what the leaderboards need. Keeps SpotOn's typefounder naming.

---

## Privacy round — Figgins, Sept 2026

### Why

Jake is bringing SpotOn to the privacy standard TypeThatBook reached (see the
`spoton-compliance-kit` another instance built). A district reviewer's bar: a findable
Privacy & Data Policy with a COPPA section, in the footer or main menu.

### What was found

- **7 of 9 games saved each student's email, Google name and profile-photo link on every
  score**, and `scores` is readable by anyone without signing in (the leaderboard page
  needs that). The boards displayed only initials, but the full records went to every
  browser that opened a leaderboard. (Picture Perfect and Format Trainer saved uid only.)
- Live rules (Jake pasted them) already had an admin allowlist on content and on score
  edit/delete — much better than the README's old copy — but **score create accepted
  any fields**, and **Storage uploads were open to any signed-in account**.
- `admin.html` let any Google account into its UI (rules still blocked the writes).
- Google Fonts on 12 pages and the Tailwind CDN on 9 — outside companies seeing every
  visitor. An unused Analytics `measurementId` in the config.
- `migration.html` still live; the old `ellisbell-c185c` project still holds a copy of the
  pre-migration `scores` (with emails).

### Jake's decisions (Sept 24, 2026)

- Keep **only** email + chosen initials. Emails kept "in case I start having
  accountability for these games one day." No names.
- Emails can go after **2 years**; **keep the initials** → retention anonymises scores
  rather than deleting them.
- "All images are in firestore." (Verify with admin → Privacy → picture sources.)
- Reuse TypeThatBook's contact details: Jake Wilson, privacy@misterwilson.org,
  (615) 379-7226. No mailing address yet.
- Database location: **us-east1 (South Carolina)** — Jake's screenshot of the console.
- Principal's approval: Jake is getting it; policy written assuming it, as it has been
  in use.
- Doesn't care whether anyone outside his classes uses the site → **no teacher consent
  checkbox** (SpotOn has no teacher accounts; the school's approval is the consent).

### What was built

| File | What |
|---|---|
| `score-save.js` 1.0.0 (new) | The only score writer. Public `scores` doc + private `players/{uid}` = `{email, lastPlayed}`. Refuses fields outside `SCORE_FIELDS`. |
| 9 games | Save through `saveScore()`; no `addDoc` import; Privacy link in nav. Format Trainer imports it as `writeScore` (it has its own `saveScore`). |
| `firestore.rules` 2.0.0 (new file) | `validNewScore()` (fixed fields, own uid, 1–3 initials, server time); `players` admin-read; verified-email admin. |
| `storage.rules` 2.0.0 (new file) | Uploads admin-only. Admin list duplicated from firestore.rules (Storage can't call it); a test checks they match. |
| `privacy-tools.js` 1.0.0 (new) | Legacy cleanup, delete a student, retention, picture sources. Plan (reads) → apply. The irreplaceable step always runs last. |
| `admin.html` 2.6.0 | Admin gate asks the database (tries to read `players`) — no admin list in the page. Emails joined from `players`; Name column gone; search by email or initials; Privacy tab. |
| `privacy.html` 1.0.0, `SECURITY.md` (new) | The policy and the security program. Describe practices; never claim compliance. |
| `fonts/`, `tailwind.css` (new) | Self-hosted fonts; built Tailwind, linked **last** in `<head>` to keep the CDN's cascade order. |
| index 2.3.0, leaderboard 1.4.0 | Policy link in footer. |
| games.css 2.1.0 | `.nav-group` so the third nav link sits right. |
| firebase-config.js 1.1.0 | `measurementId` removed. |
| `tests/` (new) | See below. |

### Verification

- `tests/rules-test.mjs` — the real rules + the real `score-save.js` in the emulator: **53/53**.
- `tests/purge-retention-test.mjs` — the real `privacy-tools.js` on seeded legacy data,
  two-student checks, "every activity source" retention case: **35/35**.
- `tests/privacy-promises-test.mjs` — policy ↔ code: **129/129**.
- `tests/self-hosted-assets-test.mjs` — external loads, fonts, Tailwind freshness: **58/58**.
- **Mutation-verified**: opening `players` reads, allowing `email` on scores, ignoring
  score dates in retention, adding `email` to `SCORE_FIELDS`, a game writing
  `email: currentUser.email`, retention 12 months, a page losing its policy link, an
  Analytics ID — each turned the suite red.
- `node --check` on every page's scripts.
- **NOT browser-tested.** No page was opened in a real browser this session. The
  Tailwind swap is the change most likely to show something visual — first thing to
  look at after deploy.

### Deploy order (Jake) — after school

1. Firebase console → spot-on-games → Firestore Database → **Rules** → paste
   `firestore.rules` → Publish. Then **Storage → Rules** → paste `storage.rules` → Publish.
   *Rules first:* the new admin page checks admin status against them.
2. GitHub: upload the zip's files; **delete `migration.html`**.
3. admin.html → **Privacy → Legacy cleanup** → Check → Run cleanup → Check again (should say nothing to do).
4. admin.html → **Privacy → picture sources** — anything yellow means a picture loads
   from another company: tell the next session (policy must name it, or move it).
5. Firebase console → switch to **ellisbell-c185c** → Firestore → Data → ⋮ next to
   `scores` → Delete collection. Only that collection.

Between steps 1 and 2 a student on an old cached page can't save a score (old pages send
the email field the new rules refuse). That's why it's after school.

### Part 2 — outside pictures (same session)

Jake deployed part 1 (rules + files). Picture sources found: Firebase Storage 20
(Sweet Spot levels), images.pexels.com 16 (Picture Perfect), www.gutenberg.org 16
(Balanced II), www.pexels.com 3 (Picture Perfect `sourceUrl` credit links — never loaded
by the game, so the list no longer counts them).

Built: admin.html 2.7.0 + privacy-tools.js 1.1.0 — Privacy → "Move outside pictures into
SpotOn" downloads each picture in the admin's browser, uploads it to
`game-images/moved/{collection}-{id}.{ext}`, then points the record at the copy
(`originalImageUrl` keeps the old address as a credit). Upload first, record second; a
record changed mid-move is left alone. A website that blocks the download (CORS) gets a
per-picture "Open original" + file-upload fallback. Every admin save that sets a picture
address (PP add, PP seed, BP2 add, BP2 edit) now copies the picture in immediately —
a test checks all four save sites do.

Pexels should download automatically (Picture Perfect already loads it with
crossOrigin, which needs CORS). Gutenberg is unknown — may need the manual fallback.
Tests: rules 53/53, purge-retention 48/48 (now includes real emulator uploads),
promises 130/130, assets 58/58. Mutation: dropping one copy-in call turns it red.

### Open items

- **Mailing address** for the policy (COPPA 312.4(d)(1)) — undecided, same as TTB.
- **Principal's approval naming SpotOn** — Jake is getting it.
- **Run "Move outside pictures"**, then "List picture sources" should be all green.
  The policy's "game pictures are stored in Firebase" is only true after that.
- **Quarterly retention** — admin → Privacy → Retention check, plus deleting unused
  sign-in accounts in Firebase console → Authentication (sort by Signed In).
- Format Trainer never loaded a web font (falls back to the system font, unlike every
  other game). Left alone — flag for Jake if he wants it matched.
- From Binny: admin.html's own leaderboard queries still use the old error-handling
  pattern; not touched.

## How to run the tests (a Claude session with a shell)

```
cd tests && npm i && npm test        # static + emulator (needs Java for the emulator)
npm run build:css                    # after adding any Tailwind class to a page
```
