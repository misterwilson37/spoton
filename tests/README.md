# SpotOn tests

Not part of the website. Run by a Claude session with a shell (Jake has no CLI).

    npm i
    npm test            # static tests, then the emulator tests (Firestore + Storage, needs Java)
    npm run build:css   # rebuild ../tailwind.css after adding Tailwind classes

| Harness | Checks |
|---|---|
| privacy-promises-test.mjs | Every promise in privacy.html / SECURITY.md against the code and rules |
| self-hosted-assets-test.mjs | No outside loads but the Firebase SDK; font files exist; tailwind.css is fresh |
| rules-test.mjs | The real firestore.rules / storage.rules and the real score-save.js, in the emulator |
| purge-retention-test.mjs | The real privacy-tools.js on seeded data, in the emulator |

`register.mjs` maps the pages' `www.gstatic.com/firebasejs/11.6.1/...` imports to the
npm `firebase` package, so the site's own modules run unmodified in Node.
Mutation-verify any new guard: break the code, watch the test go red, restore.
