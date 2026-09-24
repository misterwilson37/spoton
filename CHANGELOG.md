# Changelog — SpotOn

## Sept 2026 — Privacy round (Figgins)

- Scores no longer store email, name or photo; one shared writer (`score-save.js` 1.0.0)
  saves a public score and a private `players/{uid}` email record.
- Games: Balanced Placement, Balanced Placement II, Find the Center, Format Frenzy,
  Perfect Alignment, Spot the Format 2.2.0; Picture Perfect 2.3.0; Sweet Spot 2.4.0;
  Format Trainer 0.11.0.
- firestore.rules / storage.rules 2.0.0 (now kept in the repo).
- admin.html 2.6.0 — database-checked admin gate, Privacy tab, emails from `players`.
- privacy.html 1.0.0 and SECURITY.md — new. Privacy link on every page.
- index.html 2.3.0, leaderboard.html 1.4.0, games.css 2.1.0, firebase-config.js 1.1.0.
- Self-hosted fonts (`fonts/`) and built `tailwind.css`, replacing Google Fonts and the
  Tailwind CDN.
- privacy-tools.js 1.0.0 and `tests/` — new.
- migration.html removed.

## Aug 2026 — Leaderboard indexes (Binny)

See `HANDOFF-leaderboard-indexes.md` and README "Version History".
