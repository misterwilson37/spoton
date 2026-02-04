# Spot On! - Visual Perception Games

A collection of educational games designed to train visual perception skills like alignment, spacing, balance, and formatting recognition. Built for classroom use on iPads, computers, and phones.

## Games

### Alignment & Placement Games

| Game | Version | Description |
|------|---------|-------------|
| **Sweet Spot** | - | Find the perfect placement for text on images. Curated levels with scoring zones. |
| **Find the Center** | - | Click to find the exact center of randomly generated quadrilaterals. |
| **Perfect Alignment** | - | Drag shapes to align their centers perfectly. Progressive difficulty. |
| **Balanced Placement** | - | Position two shapes with equal spacing inside containers. |
| **Spot the Format** | 1.1.1 | Identify text formatting: horizontal/vertical alignment, line spacing, and indentation. |
| **Format Frenzy** | 1.1.1 | Timed challenge! Identify ALL 4 formatting properties before the bomb explodes. |

### Visual Perception Games

| Game | Version | Description |
|------|---------|-------------|
| **Picture Perfect** | - | Spot the defects! Is each image correct, stretched, or pixelated? |

## Site Files

| File | Version | Description |
|------|---------|-------------|
| **index.html** | 2.0.0 | Dynamic game index, loads from Firestore |
| **admin.html** | 2.4.0 | Admin panel for all games |
| **leaderboard.html** | 1.0.2 | Combined leaderboard for all games |

## Features

### Cross-Platform Compatibility
- **Desktop**: Full keyboard support (Space to advance), mouse interaction
- **iPad**: Touch-optimized buttons (44x44px minimum), responsive layout
- **Phone**: Works in portrait/landscape, touch-friendly

### Admin Panel (admin.html)
- **Sweet Spot**: Level editor with polygon zone drawing, crop tool
- **Picture Perfect**: Image management with preview/edit modal
- **Site / Index**: Manage game categories and listings dynamically
- **Leaderboards**: View and manage scores for all games

### Dynamic Index
The index page loads game configuration from Firestore (`site-config/index`), allowing you to:
- Add/remove/reorder games without code changes
- Enable/disable games
- Organize games into categories
- Apply special styling (e.g., fire theme for Format Frenzy)

Falls back to hardcoded data if Firestore is unavailable.

## Firebase Setup

### Firestore Collections
- `levels/` - Sweet Spot level data
- `picture-perfect-images/` - Picture Perfect image pool
- `scores/` - Leaderboard scores for all games
- `site-config/` - Index page configuration

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

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Space** | Advance to next round / Start game / Restart |
| **1-4** | Select answer (Picture Perfect) |

## Version History

### February 4, 2025
- **Spot the Format 1.1.1** / **Format Frenzy 1.1.1**: Increased touch target size for better iPad/phone compatibility
- **Index 2.0.0**: Dynamic loading from Firestore
- **Admin 2.4.0**: Site/Index configuration tab, Picture Perfect image preview/edit modal
- **Spot the Format 1.1.0** / **Format Frenzy 1.1.0**: Responsive font sizing, balanced randomization, explanatory feedback, manual Next Round button

### February 3, 2025
- Initial release of Spot the Format and Format Frenzy games
- Picture Perfect image management in admin

## Development Notes

### Adding a New Game
1. Create the game HTML file
2. Go to Admin → Site / Index → Add Game
3. Fill in name, URL, description, category, tags
4. Game appears on index immediately

### Touch Target Guidelines
- Minimum 44x44px for all interactive elements
- Use `padding: 0.625rem` (10px) on icon buttons for proper touch targets

---

*Games created with Claude & Gemini • Enhanced for the classroom*
