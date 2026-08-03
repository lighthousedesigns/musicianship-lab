# Musicianship Lab

Musicianship Lab is a browser-based collection of practical keyboard, fretboard, chord-recognition, and voice-leading tools. It is a self-contained static application with no backend, account, database, API key, analytics, or third-party runtime dependency.

Planned public site: <https://lighthousedesigns.github.io/musicianship-lab/>

## Current tools

- **Chord Practice** — individual chord and progression practice with diagrams, MIDI grading, manual controls, exact custom sets, saved sets, statistics, and voice-leading options.
- **Fretboard Voice Leading** — playable triad routes with automatic or exact starting shapes, Study and Recall views, and a shared Shape Library.
- **Triad Shapes** — Study and Quiz modes for the 24 canonical movable major/minor triad shapes.
- **Chord Identifier** — identifies notes, intervals, chords, and collections from Web MIDI input.
- **Favorite Chords** — saves identifier results locally and supports play-to-match recall.

Settings and favorites are stored in the current browser using `localStorage`. They are not uploaded or synchronized.

## Requirements

- Node.js 20 or newer for local commands and the production build.
- A modern browser for the application.
- A Web MIDI-compatible browser and user-granted MIDI permission for MIDI features. Web MIDI requires a secure context; the published GitHub Pages HTTPS site provides one. Non-MIDI tools remain available without a MIDI controller or Web MIDI support.

No package installation is required because the project has no npm dependencies.

## Run locally

From the repository root:

```sh
npm run dev
```

Then open <http://127.0.0.1:4173/>. Press `Ctrl+C` in the terminal to stop the server.

The source application can also be opened directly by double-clicking `outputs/index.html`, but the local server is preferred because it more closely matches public hosting.

## Build and verify

Create the production site:

```sh
npm run build
```

This copies the self-contained application to `dist/index.html`, adds `.nojekyll`, and creates physical entry points for supported direct routes under the configured project base path. `dist/` is generated and is not committed.

Preview the production build at the same subdirectory used by GitHub Pages:

```sh
npm run preview
```

Open <http://127.0.0.1:4173/musicianship-lab/>.

Run the regression suite:

```sh
npm test
```

Run the complete local deployment verification:

```sh
npm run verify
```

That command builds the site, runs the existing music-theory and interaction regression suite, and inspects the production entry point and every physical direct-route entry point expected beneath `/musicianship-lab/`.

## Project structure

- `outputs/index.html` — the complete application source and local standalone file.
- `tests/voice-leading.test.js` — dependency-free Node regression suite.
- `docs/PRODUCT.md` — current product behavior, tools, conventions, MIDI behavior, persistence, and limitations.
- `docs/DECISIONS.md` — durable product and architecture decisions with rationale.
- `deployment.config.json` — canonical repository name, Pages base path, public URL, and generated direct routes.
- `scripts/build.mjs` — dependency-free production build.
- `scripts/serve.mjs` — local static server used for development and preview.
- `scripts/check-pages.mjs` — artifact verification of the production base path and direct routes.
- `.github/workflows/deploy-pages.yml` — build, test, and GitHub Pages deployment workflow.
- `AGENTS.md` — concise repository, command, deployment, and do-not-break guidance for future Codex work.

## Publish with GitHub Pages

The repository is `lighthousedesigns/musicianship-lab`. This working folder is on `main`, tracks `origin/main`, and uses `https://github.com/lighthousedesigns/musicianship-lab.git` as its remote. The local folder does not need to have the same name.

1. In the GitHub repository, open **Settings → Pages** and confirm **Build and deployment → Source** is **GitHub Actions**.
2. Push to `main`, or run **Build, test, and deploy GitHub Pages** manually from the Actions tab.
3. After the workflow succeeds, open <https://lighthousedesigns.github.io/musicianship-lab/>.

The workflow does not need repository secrets. It uses GitHub’s built-in Pages permissions to upload and deploy the generated `dist/` artifact.

## Deployment and routing notes

The production base path is `/musicianship-lab/`, defined in `deployment.config.json`. The application currently has no separate JavaScript, CSS, image, or font files; all runtime code and styling are inline. The build fails if a future root-relative asset reference would escape the repository subdirectory.

These direct URLs are generated as physical Pages entry points:

- `/musicianship-lab/keyboard/chord-practice/`
- `/musicianship-lab/fretboard/voice-leading/`
- `/musicianship-lab/fretboard/triad-shapes/study/`
- `/musicianship-lab/fretboard/triad-shapes/quiz/`

Query-string routes at the project root also remain compatible, including `?exercise=keyboard.chord_practice` and `?exercise=fretboard.voice_leading`.

GitHub Pages serves the site over HTTPS, which is necessary for Web MIDI. Web MIDI still depends on browser and device support and a permission grant from the user. The application handles unsupported or denied MIDI access without disabling its non-MIDI features.
