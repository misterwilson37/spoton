# The Sweet Spot Game

An educational game teaching students to identify optimal text placement on images. Students learn to find areas where text is readable against the background.

**Current Version:** v1.9.4

---

## Table of Contents

1. [File Structure](#file-structure)
2. [Firebase Setup](#firebase-setup)
3. [Configuration Options](#configuration-options)
4. [Admin Panel Guide](#admin-panel-guide)
5. [Zone System](#zone-system)
6. [Keyboard Shortcuts](#keyboard-shortcuts)
7. [How Scoring Works](#how-scoring-works)
8. [Technical Notes](#technical-notes)
9. [Troubleshooting](#troubleshooting)
10. [Version History](#version-history)

---

## File Structure

```
sweet-spot-game/
├── admin.html          # Level editor (3,300+ lines)
├── game.html           # Student-facing game (1,050+ lines)
├── firebase-config.js  # Firebase credentials (YOU CREATE THIS)
└── README.md           # This file
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

## Firebase Setup

### Required Services
- **Authentication**: Google Sign-In (for admin panel)
- **Firestore**: Database for level data
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
3. **Migration**: (Hidden unless DEBUG=true) Bulk operations

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

| Placement | Points |
|-----------|--------|
| Perfect zone, dead center (< 2% from center) | 100 |
| Perfect zone, fully inside | 95 |
| Perfect zone, 75%+ overlap | 90 |
| Perfect zone, partial overlap | 80-89 |
| Good zone only | 70 |
| Wrong color (would work with other color) | 0 + hint |
| Outside all zones | 0 |

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

### v1.9.4 (Current)
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
