# Spot On! — Visual Perception Games

A collection of educational games that train visual perception skills: alignment, spacing, balance, and formatting recognition. Built for classroom use on iPads, Chromebooks, laptops, and phones. Deployed via GitHub Pages at **spoton.misterwilson.org**.

## Games

### Alignment & Formatting

| Game | Version | File | Description |
|------|---------|------|-------------|
| **Spot the Format** | 2.1.0 | spottheformat.html | Identify text formatting: horizontal/vertical alignment, line spacing, indentation. |
| **Format Frenzy** | 2.1.0 | formatfrenzy.html | Timed challenge — identify all 4 formatting properties before the bomb explodes. Timer accelerates each round. |
| **Format Trainer** | 0.10.0 | formattrainer.html | Practice formatting step-by-step. 6 levels covering basic and MLA format with speed and streak modes. Uses time-based scoring (lower is better), isolated from the unified leaderboard. |

### Centering & Layout

| Game | Version | File | Description |
|------|---------|------|-------------|
| **Find the Center** | 2.1.0 | findthecenter.html | Click the exact center of randomly generated quadrilaterals. |
| **Perfect Alignment** | 2.1.0 | perfectalignment.html | Drag shapes to align centers. Shapes get smaller and mismatched as rounds progress. |
| **Balanced Placement** | 2.1.0 | balancedplacement.html | Position two shapes with equal spacing inside containers. |
| **Balanced Placement II** | 2.1.0 | balancedplacement2.html | Place images and text with equal spacing. Alignment rules determine which side elements belong on. |
| **Sweet Spot** | 2.3.0 | sweetspot.html | Find the perfect placement for text on curated images. Polygon scoring zones. |

### Visual Perception

| Game | Version | File | Description |
|------|---------|------|-------------|
| **Picture Perfect** | 2.1.0 | pictureperfect.html | Spot the defects — is each image correct, stretched, or pixelated? |

## Site Files

| File | Version | Description |
|------|---------|-------------|
| **index.html** | 2.2.0 | Dynamic game index, loads from Firestore `site-config/index` with hardcoded FALLBACK_DATA. |
| **admin.html** | 2.5.6 | Admin panel: Sweet Spot level editor, Picture Perfect image manager, site/index config, leaderboards. |
| **leaderboard.html** | 1.2.0 | Unified leaderboard across all 8 higher-is-better games. Format Trainer scores are filtered out of the "All Games" view. |
| **migration.html** | 1.0.0 | One-shot tool for migrating from `ellisbell-c185c` → `spot-on-games`. Migration complete. Consider archiving. |
| **firebase-config.js** | — | ES-module-only config for the `spot-on-games` Firebase project. |
| **games.css** | 2.0.0 | Shared stylesheet. Defines `.btn-*`, `.nav-links`, `.game-wrapper`, `.canvas-container`, `.leaderboard`, `.screen`, etc. |

## Architecture

### Firebase

Single project: **`spot-on-games`**. All files use the modern **modular SDK v11.6.1** imported as ES modules. No compat SDK usage anywhere in the codebase.

Every page that touches Firebase loads it this way:

```html
<script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
    import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
    import { getFirestore, collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
    import { firebaseConfig } from "./firebase-config.js";

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    // ...
</script>
```

### Firestore Collections

| Collection | Purpose | Written By | Read By |
|------------|---------|------------|---------|
| `scores` | All leaderboard entries. Schema: `{ gameId, initials, score, uid, timestamp, ... }` | All games | leaderboard.html, every game (own gameId only) |
| `levels` | Sweet Spot level data (image URL, polygon zones, feedback text) | admin.html | sweetspot.html |
| `picture-perfect-images` | Picture Perfect image pool | admin.html | pictureperfect.html |
| `bp2-content` | Balanced Placement II curated image/text pool | admin.html | balancedplacement2.html |
| `site-config` | Index page layout (categories, games, order, enabled flag) | admin.html | index.html |

### gameIds in the `scores` collection

Canonical gameId strings, higher-is-better unless noted:

- `sweet-spot`
- `find-the-center`
- `perfect-alignment`
- `balanced-placement`
- `balanced-placement-ii`
- `picture-perfect`
- `spot-the-format`
- `format-frenzy` (score is time in seconds — higher still wins because it represents a faster *per-round* average in the current scoring)
- `ft-basic`, `ft-mla`, `ft-basic-speed`, `ft-mla-speed`, `ft-random-speed` — Format Trainer time-based modes, **lower is better**
- `ft-streak` — Format Trainer streak mode, higher is better

The unified leaderboard (`leaderboard.html`) uses a `KNOWN_GAME_IDS` allowlist to exclude the Format Trainer time-based IDs from the "All Games" view, since mixing asc-sorted and desc-sorted scores in one ranked list is incoherent. Per-game filter buttons in the leaderboard only cover the 8 main games; Format Trainer shows its own per-level leaderboard in-game.

### Required Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /levels/{levelId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null;
    }
    match /picture-perfect-images/{imageId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null;
    }
    match /bp2-content/{contentId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null;
    }
    match /site-config/{configId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null;
    }
    match /scores/{scoreId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;
    }
  }
}
```

## Cross-Platform Compatibility

- **Desktop**: Mouse and keyboard. Space advances rounds; `1`-`4` select answers in Picture Perfect.
- **iPad**: Touch-optimized (minimum 44×44px targets). All games allow pinch-zoom — no `user-scalable=no` anywhere in the codebase.
- **Phone**: Portrait and landscape supported. Dynamic viewport units (`100dvh`) handle mobile browser chrome.

### Touch-action rules (games.css)

Only two `touch-action` rules exist, scoped cleanly:
- `canvas { touch-action: none; }` — canvases handle drag/click natively
- `.game-wrapper { touch-action: pan-y; }` — page scroll allowed outside canvas

## Admin Panel

Accessible via the `⚙` link in the footer of index.html, or directly at admin.html. Signed-in users can:

- **Site / Index**: Add/remove/reorder games, manage categories, enable/disable games, apply special styling (e.g., fire theme for Format Frenzy). Writes to `site-config/index`.
- **Sweet Spot**: Level editor with polygon zone drawing, image crop tool, feedback text per level. Writes to `levels`.
- **Picture Perfect**: Image pool manager with preview/edit modal. Writes to `picture-perfect-images`.
- **Balanced Placement II**: Content pool manager for curated images and text. Writes to `bp2-content`.
- **Leaderboards**: View, flag, and delete scores for any game.

## Authentication

Google Sign-In via Firebase Auth popup (`GoogleAuthProvider` + `signInWithPopup`). Scoring requires sign-in. Sign-out is a single `✕` in the user badge. Every game implements the same auth UI, derived from the `.user-badge` component in games.css.

## Adding a New Game

1. Create the game HTML. Use an existing game like `findthecenter.html` as a template for the Firebase/auth/score/leaderboard boilerplate.
2. Link `games.css`. Keep game-specific styles in a short inline `<style>` block.
3. Choose a unique gameId in kebab-case (e.g., `new-game`).
4. Include the standard nav header:
   ```html
   <div class="nav-links">
       <a href="index.html" class="nav-link">← All Games</a>
       <a href="leaderboard.html" class="nav-link">🏆 Leaderboard</a>
   </div>
   ```
5. Add the game to `site-config/index` via the admin panel.
6. Add the gameId to `GAME_NAMES` and `GAME_CLASSES` in `leaderboard.html` with a filter button (if the game is higher-is-better and belongs in the unified view).

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Space** | Advance to next round / start / restart |
| **1–4** | Select answer (Picture Perfect) |
| **Enter** | Submit initials on Game Over screen |

## Version History

### Apr 2026 — Infrastructure cleanup

Full Firebase SDK migration: all games moved from compat v10.7.1 (multiple script tags loading `firebase.*` globals) to modular v11.6.1 (ES-module imports). Unified `firebase-config.js` as a single-purpose ES module. Unified auth/Firestore call patterns across every game.

- **Sweet Spot 2.3.0** — modular Firebase; dropped unused Storage SDK reference; simplified `init()` error handling.
- **Find the Center 2.1.0**, **Balanced Placement 2.1.0**, **Perfect Alignment 2.1.0**, **Picture Perfect 2.1.0**, **Balanced Placement II 2.1.0**, **Spot the Format 2.1.0**, **Format Frenzy 2.1.0** — modular Firebase migration.
- **Picture Perfect 2.1.0**, **Balanced Placement II 2.1.0**, **Format Trainer 0.10.0** — also removed `user-scalable=no` viewport restriction (accessibility fix — pinch-zoom now allowed).
- **Format Trainer 0.10.0** — first versioned release. Nav standardized to shared `.nav-links`/`.nav-link` classes. Added the `🏆 Leaderboard` link it was previously missing.
- **Index 2.2.0** — added Format Trainer to FALLBACK_DATA.
- **Leaderboard 1.2.0** — added `balanced-placement-ii` to known game IDs and filter buttons (new lavender badge); added `KNOWN_GAME_IDS` allowlist so the "All Games" view excludes Format Trainer's time-based scores from the top list; initial query expanded from 100 to 200 to keep the filtered display full.
- **Migration 1.0.0** — version-stamped. Migration from ellisbell-c185c → spot-on-games is complete. Consider moving this file out of the deployed site.

### Earlier

See git log. Prior state: mixed compat/modular SDKs, inline firebase-config dual-mode (ES export + CommonJS) that silently broke classic-script loads, scattered game IDs, Format Trainer not yet in the index.

---

*Games created with Claude & Gemini • Enhanced for the classroom*
