# Spot On! - Perception Games

A collection of educational games testing visual perception, alignment, and attention to detail. Originally built around "Sweet Spot" (text placement on images), now expanded to include multiple game types.

**Current Versions:**
- index.html: v1.0.1
- leaderboard.html: v1.0.0 (NEW)
- admin.html: v2.2.0
- sweetspot.html: v2.0.3
- findthecenter.html: v1.0.2
- perfectalignment.html: v1.0.1
- balancedplacement.html: v1.0.1
- pictureperfect.html: v1.0.1
- findthecenter.html: v1.0.1
- perfectalignment.html: v1.0.0
- balancedplacement.html: v1.0.0
- pictureperfect.html: v1.0.0
- index.html: v1.0.0

---

## Table of Contents

1. [File Structure](#file-structure)
2. [Index Page](#index-page)
3. [Firebase Setup](#firebase-setup)
4. [Configuration Options](#configuration-options)
5. [Admin Panel Guide](#admin-panel-guide)
6. [Games](#games)
7. [Leaderboard System](#leaderboard-system)
8. [Zone System](#zone-system)
9. [Keyboard Shortcuts](#keyboard-shortcuts)
10. [How Scoring Works](#how-scoring-works)
11. [Technical Notes](#technical-notes)
12. [Troubleshooting](#troubleshooting)
13. [Version History](#version-history)

---

## File Structure

```
spot-on-games/
├── index.html             # Landing page with all games (~200 lines)
├── admin.html             # Level editor + score management (~4,000 lines)
├── sweetspot.html         # Sweet Spot game (~1,500 lines)
├── findthecenter.html     # Find the Center game (~760 lines)
├── perfectalignment.html  # Perfect Alignment game (~780 lines)
├── balancedplacement.html # Balanced Placement game (~780 lines)
├── pictureperfect.html    # Picture Perfect game (~780 lines)
├── firebase-config.js     # Firebase credentials (YOU CREATE THIS)
└── README.md              # This file
```

### Required: firebase-config.js

You must create this file with your Firebase project credentials:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

---

## Index Page

The `index.html` file is the main landing page for all games. It features:

- **Project branding** with carolina blue accents
- **Game cards** organized by category:
  - Alignment & Placement Games (Sweet Spot, Find the Center, Perfect Alignment, Balanced Placement)
  - Visual Perception Games (Picture Perfect)
- **Coming Soon placeholders** for future games
- **Discreet admin link** (⚙ icon in footer)

The index page uses a dark theme with black/grey/white base colors and carolina blue (#7BAFD4) as the accent color.

---

## Firebase Setup

### Required Services
- **Authentication**: Google Sign-In (for admin panel and player leaderboard)
- **Firestore**: Database for levels and scores
- **Storage**: Image file storage

### Firestore Structure
```
levels/
  └── {levelId}/
        ├── name: string
        ├── imageUrl: string
        ├── imagePath: string
        ├── crop: { x, y, width, height } | null
        ├── feedback: string
        ├── placementFeedback: string
        ├── goodZones: { white: [], black: [] }
        ├── perfectZones: { white: [], black: [] }
        ├── zoneSets: []  # Raw editor data
        ├── createdAt: timestamp
        └── updatedAt: timestamp

scores/
  └── {scoreId}/
        ├── initials: string (1-3 chars)
        ├── score: number
        ├── email: string
        ├── displayName: string
        ├── uid: string
        ├── levelCount: number
        ├── timestamp: timestamp
        └── flagged: boolean
```

---

## Configuration Options

### DEBUG Mode (admin.html)

Located near the top of the `<script>` section (~line 520):

```javascript
const DEBUG = false;  // Set to true for verbose logging
```

**When DEBUG = true:**
- Console shows detailed logging for:
  - Text measurement calculations
  - Auto-crop calculations
  - Polygon creation steps
  - Auto Perfect placement algorithm
  - Sign-in flow
  - Initialization steps
- Migration tab becomes visible

**When DEBUG = false (default):**
- Clean console output
- Only actual errors logged
- Migration tab hidden

---

## Admin Panel Guide

### Views

1. **Crop View**: Set the 4:3 crop region of uploaded images
2. **Zone View**: Define good zones (polygons) and perfect zones (rectangles)

### Tabs

1. **Level Editor**: Main editing interface
2. **All Levels**: Browse/load/delete existing levels
3. **Scores**: View and manage leaderboard scores
4. **Migration**: (Hidden unless DEBUG=true) Bulk operations

### Zone Sets

Each level can have multiple **Zone Sets**. Each set contains:
- **Color**: White or Black (text color for that zone)
- **Good Zones**: Polygons where text placement earns partial credit
- **Perfect Zone**: Rectangle where text placement earns full credit
- **Feedback fields**: Custom hints for students

### Per-Set Visibility

Each zone set has an eyeball (👁) toggle button:
- Click to hide/show individual sets while editing
- Helps manage complex levels with multiple overlapping zones
- This is UI-only state; not saved with the level

### Global Zone Visibility Toggle

The "ZONES" button toggles between:
- **Zones visible**: Full editing UI with all overlays
- **Zones hidden**: Text-only preview mode (can still drag text)

### Unsaved Changes Protection

The editor tracks when you've made changes that haven't been saved:
- **Switch Tabs**: Prompts when leaving editor tab (e.g., to "All Levels")
- **New Level**: Prompts if you have unsaved changes
- **Load Level**: Prompts if you have unsaved changes
- **Close Tab/Browser**: Browser shows a warning dialog
- Changes are marked as saved after successful save or load

### Save Validation

When saving, the editor validates your zone sets:
- Warns if a zone set has no good zones
- Warns if a perfect zone center is outside all good zones in its set
- You can still save with warnings (after confirmation)

---

## Games

### Sweet Spot (sweetspot.html)
An educational game teaching students to identify optimal text placement on images. Students click to place text, choosing between white and black text colors for readability.

- 10 randomly selected levels per game
- Scoring based on placement precision (0-100 per level)
- Requires admin-created levels via Level Editor

### Find the Center (findthecenter.html)
A simple geometry game where players click to find the centroid of randomly generated quadrilaterals.

- 10 rounds of random shapes
- Perfect click = 100 points
- Points decrease by 0.5 per pixel from true center
- No admin setup required - shapes are procedurally generated

### Perfect Alignment (perfectalignment.html)
A drag-and-drop game where players align shapes by their centers. Sequel to Find the Center with progressive difficulty.

- 10 rounds of increasing difficulty
- Drag the blue shape to align with the gray target
- Shapes get smaller and mismatched in later rounds
- Points decrease by 0.75 per pixel from perfect alignment
- No admin setup required - shapes are procedurally generated

### Balanced Placement (balancedplacement.html)
A spacing and centering game where players position two shapes equally within a container.

- 10 rounds with randomly oriented containers (wide or tall)
- Drag both shapes into the rectangle
- Space them equally along the long side
- Center them on the short side
- Points based on total distance from ideal positions
- No admin setup required - containers are procedurally generated

### Picture Perfect (pictureperfect.html)
An image inspection game where players identify distorted images. Originally "Aspect Ratio Detective".

- 10 rounds with different images
- Each image is shown either correctly, stretched horizontally, stretched vertically, or pixelated
- Players must identify what's wrong (or confirm it's correct)
- 100 points per correct answer
- **Requires admin setup**: Add images via the "PP Images" tab in admin.html
- Images stored in Firestore `picture-perfect-images` collection
- Supports any image URL (Pexels, Unsplash, Firebase Storage, etc.)

---

## Leaderboard System

### Player Experience (sweetspot.html)

**Before Playing:**
- Optional Google Sign-in on start screen
- Can play without signing in, but won't save score

**After Game:**
- Signed-in players enter 3-letter initials
- Built-in profanity filter rejects common bad words
- Score saved to Firestore with `gameId: 'sweet-spot'`
- Top 10 leaderboard shown (filtered to Sweet Spot only)
- Personal rank displayed

**Tiered Feedback:**
| Score | Feedback | Color |
|-------|----------|-------|
| 95+ | "✓ Perfect!" | Blue |
| 90-94 | "✓ Excellent!" | Blue |
| 80-89 | "✓ Great placement!" | Blue |
| 70-79 | "✓ Good placement!" | Blue |
| 60-69 | "• Okay, but could be better." | Orange |
| <60 | "• Needs improvement." | Orange |

### Admin Experience (admin.html)

**Universal Leaderboard Tab:**

Supports multiple games from a single interface.

| Filter | Options |
|--------|---------|
| Game | All Games / Sweet Spot / (future games) |
| Player | Search by email or name |
| Status | All / Flagged Only / Unflagged Only |
| Limit | 50, 100, 500, or 1000 |

**Table Columns:**
Rank, Game, Initials, Score, Email, Name, Date, Actions

**Actions:**
- 🚩 Flag/unflag suspicious entries
- × Delete individual scores
- Export CSV (respects current filters)

**Automatic Flagging:**
Scores are auto-flagged if initials match profanity patterns, but still saved. Admin can review flagged entries and delete if needed.

### Firestore Structure

```
scores/
  └── {scoreId}/
        ├── gameId: "sweet-spot"     # Identifies which game
        ├── initials: "ABC"
        ├── score: 847
        ├── email: "student@school.edu"
        ├── displayName: "Student Name"
        ├── photoURL: "..."
        ├── uid: "firebase-user-id"
        ├── levelCount: 10
        ├── timestamp: serverTimestamp
        └── flagged: false
```

### Profanity Filter

The filter checks initials against ~40 common inappropriate patterns. It's intentionally conservative - some borderline cases may get through but will be auto-flagged for admin review.

---

## Zone System

### Good Zones (Polygons)

- Drawn as freeform polygons (click to add points, click start to close)
- Student gets **70 points** for placing text fully inside
- Supports legacy rectangle format (auto-converted on load)

### Perfect Zones (Rectangles)

- Always rectangles (sized to fit the "Read This Text" preview)
- Student gets **80-100 points** based on precision
- Must be fully contained within a good zone

### Auto Perfect Feature

Automatically places a perfect zone inside a selected good zone:
1. Tries to center at polygon centroid first
2. If centroid doesn't fit, searches for best position via grid sampling
3. Reports error if zone is too small/narrow for text

**Collision Detection** (three checks):
- All 4 rectangle corners must be inside the polygon
- No polygon vertices can be inside the rectangle
- No polygon edges can intersect rectangle edges (handles concave shapes)

### Text Size Measurement

The admin panel dynamically measures rendered text to ensure:
- Yellow dotted preview box matches actual text bounds
- Auto Perfect creates correctly-sized rectangles
- Perfect zone minimum size enforced during manual drawing

---

## Keyboard Shortcuts

### Zone Editor (admin.html)

| Key | Action |
|-----|--------|
| `Ctrl+Z` / `Cmd+Z` | Undo |
| `Ctrl+Y` / `Cmd+Shift+Z` | Redo |
| `Delete` / `Backspace` | Delete selected zone or vertex |
| `Escape` | Cancel polygon drawing, deselect vertex |
| `Arrow Keys` | Nudge selected zone/vertex by 1% |
| `Shift + Arrow Keys` | Fine nudge by 0.1% |

### Drawing Modes

| Mode | Behavior |
|------|----------|
| **Select** | Click zones to select, drag to move, drag handles to resize |
| **+ Good Zone** | Click to add polygon points, click start point to close |
| **+ Perfect Zone** | Click and drag to draw rectangle |

---

## How Scoring Works

### Placement Scoring (game.html)

**Base Scores:**
| Placement | Base Points |
|-----------|-------------|
| Perfect zone, dead center (< 2% from center) | 100 |
| Perfect zone, fully inside | 95 |
| Perfect zone, 75%+ overlap | 90 |
| Perfect zone, partial overlap | 80-89 |
| Good zone only | 70 |
| Wrong color (would work with other color) | 0 + hint |
| Outside all zones | 0 |

**Outside Penalty:**
The score is reduced by the percentage of text that falls outside any good zone.

Example: Text overlaps perfect zone (base score 82) but 43% is outside good zones:
- Final score = 82 - 43 = **39 points**

If the penalty reduces the score to 0, it's treated as an incorrect placement.

### "No Good Spot" Scoring

- Correct identification: **100 points**
- Wrong (a spot existed): **0 points** + color hint

### Visual Feedback

- **Confetti**: Score ≥ 90
- **Fireworks**: Score = 100
- **Score popup**: Animated number at click location
- **Directional arrows**: Point toward perfect zone when in good zone

---

## Technical Notes

### Text Rendering

- Font: Century Gothic (with fallbacks)
- Game text: `font-size: 3.5rem` with `white-space: nowrap`
- Admin preview: `fontSize = canvasHeight * 0.09`
- Two lines: "Read" and "This Text"

### Aspect Ratio

- All images cropped/displayed at **4:3** aspect ratio
- Crop is stored as percentages of original image
- Auto-crop calculates optimal region for non-4:3 images

### Coordinate System

All zone coordinates stored as **percentages (0-100)** of the display area:
- Allows responsive display at any resolution
- `percentToPixel()` and `pixelToPercent()` convert as needed

### Legacy Format Support

Old levels with rectangle-based good zones are automatically converted:
```javascript
// Legacy: { x, y, width, height }
// Current: { points: [{x,y}, {x,y}, {x,y}, {x,y}] }
```

### Polygon Hit Testing

Uses ray casting algorithm for point-in-polygon tests. The `pointInPolygon()` function exists in both admin.html and game.html.

---

## Troubleshooting

### "Text wraps to 3 lines in game"
Fixed in v1.9.0 with `white-space: nowrap`. If it recurs, check that the CSS is present on `#textOverlay`.

### "Auto Perfect places zone in wrong spot"
The algorithm avoids polygon vertices. If the shape is very irregular, it may place the zone in an unexpected but technically valid location. Use manual placement for tricky shapes.

### "Yellow and blue boxes are different sizes"
Both should use `measureTextDimensions()`. If they differ, check that the function is being called on canvas resize.

### "Can't select perfect zone when good zone is selected"
Fixed in v1.9.0. Perfect zone now takes click priority. If clicking the perfect zone does nothing, ensure it's not hidden (check eyeball toggle).

### "Arrow keys don't work"
- Make sure a zone or vertex is selected
- Make sure zones are visible (toggle shows "ZONES" not struck through)
- Click on the canvas first to ensure it has focus

### "Migration tab missing"
Set `DEBUG = true` to show it. It's hidden by default since migration is typically a one-time operation.

---

## Version History

### Index v1.0.0
- New landing page for all games
- Dark theme with carolina blue accents
- Game cards organized by category
- Coming Soon placeholders for future games
- Discreet admin link in footer

### Sweet Spot v2.0.2
- Added "How to Play" box to match other games
- Removed "THE" from title (now just "Sweet Spot")
- Removed admin link from start screen (now in index.html)

### Admin v2.2.0 (Current)
- **Major Tab Restructure**: Now organized as Sweet Spot → Picture Perfect → Leaderboards
- Sweet Spot has sub-tabs: Level Editor and All Levels
- Picture Perfect tab manages PP images
- Leaderboards tab for score management
- Sub-tabs bar appears only when Sweet Spot is active

### All Games v1.0.x Updates
- Added navigation links: "← All Games" and "🏆 Leaderboard" 
- Toned down glow effects for better readability
- Consistent design across all games

### Leaderboard v1.0.0 (NEW)
- Student-facing public leaderboard page
- Filter by game with color-coded badges
- Shows only rank, initials, game, and score (no email/admin features)
- Top 100 scores displayed

### Index v1.0.1
- Added leaderboard link in header
- Toned down glow effect

### Admin v2.1.0
- **Rebranded**: "Sweet Spot Level Editor" → "Spot On! Admin"
- Updated login overlay and header to show "SPOT ON!" branding
- Changed "EDITOR" badge to "ADMIN"
- "Play Game" button now links to index.html ("Back to Games")
- Fixed duplicate escapeHtml function causing potential errors

### Admin v2.0.5
- Added Picture Perfect to game dropdown and GAME_NAMES map
- New "PP Images" tab for managing Picture Perfect images
- Add images by URL (supports Pexels, Unsplash, any direct image link)
- Enable/disable individual images
- "Seed Default Images" button to add 10 starter portrait images
- Image grid with hover controls

### Picture Perfect v1.0.0
- New game: identify if images are correct, stretched, or pixelated
- Renamed from "Aspect Ratio Detective"
- Start screen with Google sign-in
- Leaderboard with `gameId: 'picture-perfect'`
- Loads images from Firestore `picture-perfect-images` collection
- Fallback to hardcoded images if Firestore is empty
- Keyboard shortcuts: 1-4 for quick answers, Space for next
- Shows correct answer when wrong (redraws image correctly)

### Admin v2.0.4
- Added Balanced Placement to game dropdown and GAME_NAMES map

### Balanced Placement v1.0.0
- New game: place two shapes with equal spacing in a container
- Start screen with Google sign-in
- Leaderboard with `gameId: 'balanced-placement'`
- Tiered feedback and per-shape directional hints
- Layout optimized (feedback in center row, no page shift)

### Admin v2.0.3
- Added Perfect Alignment to game dropdown and GAME_NAMES map

### Perfect Alignment v1.0.0
- New game: drag shapes to align their centers
- Start screen with Google sign-in
- Leaderboard with `gameId: 'perfect-alignment'`
- Tiered feedback and directional hints
- Layout optimized (feedback in center row, no page shift)

### Find the Center v1.0.1
- Fixed layout shift when feedback appears
- Moved feedback display between Round and Total Score
- Updated footer credit: "Originally coded by Gemini, leaderboard by Claude"

### Admin v2.0.2
- Added Find the Center to game dropdown and GAME_NAMES map
- Individual file versioning now in effect

### Sweet Spot v2.0.1
- Renamed game.html to sweetspot.html for multi-game support
- Added `gameId: 'sweet-spot'` to all score submissions
- Leaderboard now filters by game (ready for additional games)
- Universal admin Leaderboard tab with:
  - Game filter dropdown
  - Player search (searches email and name)
  - Status filter (All/Flagged/Unflagged)
  - Limit selector
- Tiered feedback messages based on score:
  - 95+: "Perfect!"
  - 90-94: "Excellent!"
  - 80-89: "Great placement!"
  - 70-79: "Good placement!"
  - 60-69: "Okay, but could be better." (orange text)
  - Below 60: "Needs improvement." (orange text)
- CSV export respects current filters and includes Game column
- **Added Find the Center game** (findthecenter.html)
  - Originally created by Gemini, enhanced with leaderboard
  - Uses `gameId: 'find-the-center'`
  - Light theme (complements Sweet Spot's dark theme)

### Find the Center v1.0.1
- Fixed layout shift when feedback appears
- Moved feedback display between Round and Total Score
- Updated footer credit: "Originally coded by Gemini, leaderboard by Claude"

### v2.0.0 🎉
**Major Feature: Leaderboard System**
- Google Sign-in for players (optional, needed to save score)
- 3-letter initials entry after game
- Built-in profanity filter with ~40 blocked patterns
- Top 10 leaderboard display on game over screen
- Player rank display ("Your rank: #47")
- Admin "Scores" tab with full score management
- Filter scores: All, Flagged Only, Unflagged Only
- Flag/unflag suspicious entries
- Delete individual scores
- Export up to 1000 scores to CSV
- Auto-flagging of scores with suspicious initials

### v1.9.7
- Added scoring penalty for text outside good zones
- Score is reduced by the percentage of text falling outside any good zone
- Uses grid sampling (10x10) to calculate text coverage in polygon zones
- If penalty reduces score to 0, placement is treated as incorrect

### v1.9.6
- Added unsaved changes prompt when switching away from editor tab
- Fixes issue where clicking "All Levels" didn't warn about unsaved work

### v1.9.5
- Fixed "wrong color" detection to work with polygon zones
- Now checks both good zones AND perfect zones for other color
- Moved game buttons up next to instructions for better visibility
- Feedback now says "Try black text here" instead of generic "other color"

### v1.9.4
- Fixed concave polygon edge case in Auto Perfect algorithm
- Added line segment intersection detection
- Rectangle placement now checks for polygon edges crossing through

### v1.9.3
- Added redo functionality (`Ctrl+Y` / `Cmd+Shift+Z`)
- Added save validation (warns about empty zone sets, misplaced perfect zones)
- Added unsaved changes protection:
  - Prompt when creating new level with unsaved changes
  - Prompt when loading a level with unsaved changes
  - Browser warning when closing tab with unsaved changes
- Added feedback when trying to delete with zones hidden
- Unified text sizing: game.html now uses dynamic 9% height like admin

### v1.9.2
- Added `DEBUG` flag for console logging
- Removed unused code (`canvasScale`, `GOOD_MIN_MARGIN`, `textOverlapsZone`)
- Fixed arrow key nudge to update sidebar for all zone types
- Hidden Migration tab (visible only in DEBUG mode)

### v1.9.1
- Per-set visibility toggles (eyeball buttons)

### v1.9.0
- Text dragging works when zones hidden
- Perfect zone click priority over good zones
- Clicking outside zones deselects zone but keeps set selected
- Fixed game text wrapping with `white-space: nowrap`

### v1.8.9
- Tightened text height measurement (2.2× instead of 2.5×)

### v1.8.8
- Dynamic text measurement for consistent sizing
- Yellow preview box uses same dimensions as perfect zone

### v1.8.7
- Fixed Auto Perfect collision detection (bidirectional check)
- Polygon vertices inside rectangle now detected

### v1.8.6
- Arrow key navigation for zones/vertices
- Shift+Arrow for fine 0.1% nudge
- Yellow bounding box for text preview
- Debug logging for Auto Perfect

### v1.8.0 - v1.8.5
- Text size calibration iterations
- Auto Perfect algorithm improvements

### Earlier versions
- Polygon-based good zones
- Undo system (Ctrl+Z)
- Shift-key constraints for drawing
- Zone visibility toggle
- Per-set visibility controls

---

## Future Considerations

Items identified during code review that could be addressed:

1. ~~**No redo functionality**~~ - ✅ Implemented in v1.9.3
2. ~~**No save validation**~~ - ✅ Implemented in v1.9.3
3. ~~**Text size sync**~~ - ✅ Implemented in v1.9.3
4. ~~**Concave polygon edge cases**~~ - ✅ Fixed in v1.9.4

All identified issues have been addressed!

---

## Contact / Credits

Developed for educational use in teaching visual design principles.
