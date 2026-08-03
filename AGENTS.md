# Musicianship Lab

## Purpose

Musicianship Lab is a practical, browser-based collection of tools for learning and applying harmony on keyboard and guitar. It emphasizes usable musical actions rather than abstract reference material:

- recognize, spell, play, and name chords
- learn triads and inversions
- connect chords through smooth keyboard and guitar voice leading
- learn fretboard chord-tone locations and movable triad shapes
- identify MIDI notes, intervals, chords, voicings, and harmonic context
- save useful chord discoveries and focused keyboard practice sets
- practice efficiently with minimal setup friction

When extending the product, connect theory to real playing, songwriting, arranging, bass movement, sequencing, and harmonic hearing where relevant. Do not add speculative tools or navigation placeholders.

## Preservation requirement

Preserve every currently working tool, route, saved setting, migration, theory rule, renderer, accessibility behavior, and tested workflow unless a task explicitly replaces it.

In particular:

- do not remove working features merely because their code is legacy or hidden
- do not expose retired navigation merely because its implementation remains in the file
- preserve old stable exercise IDs and saved-state migrations where practical
- keep noninteractive diagram consumers noninteractive when changing quiz diagrams
- keep MIDI optional for workflows that already support manual reveal or naming
- do not silently change a selected key, chord, inversion, string set, fret range, exact shape, or progression
- avoid unrelated refactors in the monolithic application; shared state makes broad changes risky
- test the affected workflow and its shared consumers before reporting completion

## Current user-facing navigation

The home screen contains three areas.

### Keyboard

Keyboard opens directly into **Chord Practice**; it intentionally skips a one-card landing page.

Chord Practice includes:

- Individual Chords and Progression practice
- prompt directions: chord to play, notes to name, diagram to name, or mixed
- roots from all 12 pitch classes, selected roots, or the diatonic chords of a major key
- filter-based pools and exact Custom Sets
- Random and Listed Order for custom sets
- named saved practice sets with load, rename, duplicate, and delete
- Guided, Standard, and Challenge difficulty
- manual naming controls and MIDI performance grading
- compact piano diagrams with chord-tone, note-name, both, or no labels
- optional exact-register grading, reveal-on-incorrect, Roman numerals, response timing, auto advance, and session statistics
- progression presets and custom ordered progressions
- manually selected inversions or automatically generated nearest voicings
- progression preview, editing, movement hints, repeat behavior, and persistence

Chord Practice exposes these 16 practice chord types:

- major, minor, diminished, augmented, sus2, sus4
- dominant 7, major 7, minor 7, minor-major 7, half-diminished 7, diminished 7
- add9, minor add9, major 6, minor 6

Old Keyboard routes for Recognize Triads, Play the Chord, and Keyboard Voice Leading redirect or migrate into Chord Practice. Do not restore those as separate top-level destinations unless explicitly requested.

### Fretboard

The Fretboard landing page contains exactly two primary tools, in this order:

1. **Voice Leading**
2. **Triad Shapes**

The compact Fretboard tool switcher appears only after a primary tool is open. The last-used primary Fretboard tool is saved. Retired standalone Fretboard Practice and Key Study destinations remain hidden.

#### Fretboard Voice Leading

Voice Leading connects exact three-string triad shapes through playable progressions. Its normal setup flow is:

1. choose a major key
2. choose one adjacent three-string set
3. choose the starting diatonic chord
4. choose the preferred starting inversion
5. choose a fret range
6. leave Starting Location on Auto or deliberately choose an exact shape
7. choose an ascending, descending, common, or custom progression
8. generate and study the complete route

Starting Location defaults to **Auto**. Auto should find a valid physical shape, substitute another inversion when necessary, update the visible inversion, respect fret/open-position constraints, and avoid blocking errors when any valid solution exists.

**Choose Exact Shape** is an advanced opt-in. It activates only when the user explicitly selects it or uses **Start Route Here** from Shape Library. Stale or incompatible saved state must not force exact mode.

The generated route has:

- **Route** and **Shape Library** internal views
- **Study**, which shows every compact diagram at once without tracking a playhead
- **Recall**, which hides diagrams/exact frets until the same route is revealed
- optional movement details and a route-detail dialog with diagram, notes, TAB, and adjacent movement context
- one **Back to Settings** action that preserves current musical choices

Fretboard Cycle mode is retired. Old saved `cycle` state migrates to Study. Do not remove similarly named Keyboard progression-cycle behavior.

#### Shape Library

Shape Library is an internal view of Fretboard Voice Leading, not a standalone home destination. It reuses the former Key Study generation and rendering logic.

It shares key, string set, fret range, open-position setting, selected chord, and selected inversion with Route. It can show diatonic chord/inversion cards, fretboard diagrams, note names, R/3/♭3/5 labels, fret numbers, roots, TAB, play-through controls, and shape details. **Start Route Here** transfers the exact displayed frets into Voice Leading and deliberately activates exact-shape mode.

Switching between Route and Shape Library must not regenerate or discard a valid current route.

#### Triad Shapes

Triad Shapes has **Study** and **Quiz** modes built from one canonical collection of exactly 24 movable shapes:

- four adjacent string sets: EAD, ADG, DGB, GBE
- two qualities: major and minor
- three inversions: root position, first inversion, second inversion

Study filters by string set, quality, and inversion and labels chord tones as R, 3 or ♭3, and 5.

Quiz filters the same collection, asks for root/third/fifth locations, supports finite or continuous sessions, records score and missed categories, persists an in-progress session, and uses real accessible marker buttons. A marker activation must submit once by mouse, touch, Enter, or Space; reveal all labels; preserve marker geometry; focus Next Shape; and lock further answers for that question.

The quiz markers depend on an invariant `translate(-50%, -50%)` centering transform. The marker-specific active rule must continue to override the global pressed-button movement rule. This is regression-tested because losing the centering transform moves the target during the pointer lifecycle and cancels clicks.

### Explore

#### Chord Identifier

Chord Identifier listens to one or more MIDI notes and reports:

- a single note or interval when fewer than three notes are present
- best chord symbol/name and alternate candidates
- exact played notes, unique tones, bass, root, inversion, slash bass, formula, doublings, omissions, and extra tones
- optional major-key context with Roman numeral and harmonic function
- held-last-result and sustain-following preferences

Its formula library is broader than Chord Practice. It covers triads, suspended and added-tone chords, sixth chords, seventh chords, ninths, elevenths, thirteenths, and several altered dominants. Identification is heuristic and ranked; ambiguous collections can legitimately produce multiple candidates or no useful chord label.

#### Favorite Chords

Favorite Chords stores Chord Identifier discoveries in browser storage. A favorite can include a preferred interpretation, title, note, key context, and optionally the exact MIDI voicing. The library supports search, filters, sorting, editing, duplication, deletion, and Play to Match.

## Retained legacy/internal modules

The file still contains working implementation and migration support for older surfaces:

- the editable timed Triad Trainer and its 21 C-major sample items
- the two-stage Keyboard Voice-Leading screen and guided progression/cycle engine
- standalone Fretboard Practice generation/statistics
- former Key Study settings and play-through code
- legacy mode controls and route aliases

These are not current top-level destinations. Some functions are reused by current tools, some support old URLs/saved state, and many are directly covered by regression tests. Inspect call sites and tests before deleting or consolidating any of them.

## Architecture and framework

This is a dependency-free static web application.

- Framework: none
- Language: plain HTML, CSS, and browser JavaScript
- Packaging: one self-contained application file
- Server runtime: none required for normal use
- Package manager: npm is used only as a command runner; there are no package dependencies
- External libraries/assets/fonts: none
- Build system: dependency-free Node scripts copy and validate the static application; there is no bundler or transpiler

`outputs/index.html` contains all markup, responsive styling, theory data, state, renderers, event handlers, persistence, migrations, and startup logic. JavaScript runs in a strict-mode IIFE and uses imperative DOM updates plus module-level mutable state.

The application exposes a frozen internal `MUSICIANSHIP_ENGINE` and a broad `window.__voiceLeadingTrainerTests` test API. The latter is an intentional seam for the Node regression harness; renaming or removing exported functions can break tests even when the visible UI still loads.

### Repository map

- `AGENTS.md` — project knowledge and implementation rules
- `README.md` — local use, build, verification, and publishing instructions
- `outputs/index.html` — source of truth and standalone application
- `tests/voice-leading.test.js` — Node regression harness for the whole application
- `package.json` — dependency-free development, build, test, preview, and verification commands
- `deployment.config.json` — canonical repository name, Pages base path, public URL, and generated direct routes
- `scripts/build.mjs` — validates and copies the application into `dist/`
- `scripts/serve.mjs` and `scripts/static-server.mjs` — dependency-free local HTTP server
- `scripts/check-pages.mjs` — artifact checks for the production subdirectory and direct route entry points
- `.github/workflows/deploy-pages.yml` — GitHub Actions build, test, verification, and Pages deployment

There is no framework configuration, lockfile, `CNAME`, or checked-in real-browser end-to-end test. `dist/` is generated and ignored; never edit or commit it as the source of truth.

## Shared engines and components

Prefer extending these shared implementations instead of duplicating them:

- major-key spelling and diatonic chord generation
- chord formula and Chord Identifier analysis
- chord/inversion object creation
- keyboard voicing generation, recognition, grading, and voice-movement scoring
- progression optimization and deterministic tie-breaking
- piano-keyboard SVG data and renderer
- standard-tuning fretboard note mapping
- fretboard voicing search, range/open-position filtering, and route optimization
- shared full-size/compact fretboard SVG renderer
- TAB generation
- canonical movable Triad Shapes model
- navigation registry, stable route IDs, breadcrumbs, and Continue Last Session
- MIDI input/device handling, active-note tracking, grading, and auto advance
- localStorage persistence and migration

Changes to a shared renderer must be checked in every consumer. In particular, fretboard diagrams are used by legacy Practice, Shape Library, Voice Leading route/detail cards, and Triad Shapes Study/Quiz. Piano diagrams are used by Chord Practice prompts and answers.

## Navigation and stable IDs

The application uses screen hiding/showing rather than a client-side routing framework. `EXERCISE_REGISTRY`, `NAVIGATION_AREAS`, and `NAVIGATION_TOOLS` define stable IDs and aliases.

Important current IDs include:

- `keyboard.chord_practice`
- `fretboard.voice_leading`
- `fretboard.voice_leading.route`
- `fretboard.voice_leading.shape_library`
- `fretboard.triad_shapes.study`
- `fretboard.triad_shapes.quiz`
- `theory.chord_identifier`
- `chord_library.favorites_view`

Legacy IDs such as `keyboard.triad_display`, `keyboard.voice_leading`, `keyboard.play_chord`, `fretboard.triads`, and `fretboard.key_study` remain aliases/migration inputs.

Initial routing is inferred from `location.pathname`, `location.search`, and `location.hash` with regular expressions. Query-string routes are safest for static hosting, for example:

- `index.html?exercise=keyboard.chord_practice`
- `index.html?exercise=fretboard.voice_leading`
- `index.html?exercise=fretboard.triad_shapes.study`
- `index.html?exercise=fretboard.triad_shapes.quiz`

The app does not use `history.pushState` and does not require URL changes during ordinary navigation.

The production build also creates physical `index.html` entry points for the supported Keyboard Chord Practice, Fretboard Voice Leading, and Triad Shapes study/quiz paths. Keep `deployment.config.json` and the route parser aligned when adding a new public direct route.

## MIDI input and note detection

MIDI uses the browser Web MIDI API through `navigator.requestMIDIAccess()`.

### Connection behavior

- permission is requested only after the user selects Enable MIDI
- available inputs populate a device selector
- the preferred input ID is saved
- connect/disconnect state changes refresh the selector
- unsupported and permission-denied states are shown without crashing
- MIDI is optional except for performance/listening actions that inherently require played notes

### Message and active-note model

- Note On is status `0x90` with velocity greater than zero
- Note Off is status `0x80`, or Note On with zero velocity
- sustain is Control Change `0xB0`, controller 64, with values 64 or above treated as pedal down
- pressed notes and sustained notes are stored separately and merged into a unique active-MIDI-note set
- a signature of sorted MIDI note numbers suppresses duplicate grading of the same held voicing
- normal trainer evaluation waits 220 ms for a chord to settle
- Chord Identifier/Favorite matching waits 110 ms for more responsive free playing
- standard trainer prompts require exactly the expected number of notes; extra notes block grading until released

Sustain behavior is configurable globally for trainers and separately for Chord Identifier. Releasing the pedal rebuilds the active set and may trigger reevaluation.

### Recognition and grading

MIDI note numbers are sorted low to high. Pitch class is MIDI modulo 12; the lowest note determines inversion/bass.

Three answer modes exist in the shared MIDI settings:

- **Chord Notes**: pitch-class set must match; inversion and octave do not matter
- **Exact Voicing**: ordered pitch classes must match; octave transposition is allowed
- **Exact Register**: exact sorted MIDI note numbers must match

Editable legacy Triad prompts fall back from Exact Register to Exact Voicing because they contain note spellings but no octave/register. Current Chord Practice uses Exact Voicing unless its Require Exact Register option is enabled. Keyboard Voice Leading uses Exact Voicing unless the global answer mode is Exact Register.

Chord Practice can recognize all 16 supported practice types. Legacy Triad and Keyboard Voice-Leading grading recognize exact major, minor, and diminished triads. Chord Identifier uses the larger formula engine and supports one-note, interval, chord, and ambiguous-collection results.

Live note spelling comes from the active theoretical key when available; otherwise the identifier uses its default flat-oriented pitch-class names. Do not replace spelled notes with enharmonic shortcuts when a selected key provides the correct spelling.

## Music-theory rules and assumptions

### Keys and spelling

The core key engine supports these 12 major keys:

- C, G, D, A, E, B, F-sharp
- D-flat, A-flat, E-flat, B-flat, F

Major scales use offsets `[0, 2, 4, 5, 7, 9, 11]`. Notes are spelled by diatonic letter plus the accidental needed to reach the pitch class, preserving spellings such as E-sharp in F-sharp major and G-flat in D-flat major.

Major-key diatonic triads are:

- I major
- ii minor
- iii minor
- IV major
- V major
- vi minor
- vii° diminished

`referenceChords` contains all seven. The keyboard and guitar voice-leading progression pools intentionally use I through vi and omit vii° unless a specific feature explicitly supports it.

Editable note parsing currently accepts letter names plus ASCII `#` and `b`. Do not assume Unicode ♯/♭ tokens are parsed by the legacy editable-list MIDI grader.

### Keyboard voicings and movement

- legacy triad voice-leading candidates stay between MIDI 48 and 72 (C3–C5)
- triad voices are strictly ordered low to high and do not cross
- inversion is determined by the bass pitch class
- local closest-voicing priority is: minimum total semitone movement, more common tones, fewer moving voices, smaller largest leap, less register drift, then deterministic inversion/MIDI ordering
- optimized progressions accumulate those musical costs across the whole route rather than choosing every step independently
- unequal-cardinality movement uses a six-semitone add/remove penalty

### Fretboard voicings and movement

- tuning is standard E2–A2–D3–G3–B3–E4, represented by MIDI `[40, 45, 50, 55, 59, 64]`
- supported adjacent three-string sets are EAD, ADG, DGB, and GBE
- generated frets are limited to 0–12
- each voicing places one chord tone on each selected string
- sounding notes must remain strictly low to high
- the bass chord tone must match the requested inversion
- generated shapes must contain the requested triad pitch-class set
- open strings are excluded unless Include Open Positions is enabled
- range filters are 0–4, 5–8, 9–12, or Any
- default maximum fret span is four; Voice Leading can select three, four, or five
- in guitar voice leading, each voice stays on the same string and movement is measured primarily as fret distance
- Stay in Range is strict; Prefer Range may use fallback candidates

Triad Shapes are neutral movable interval shapes, not separate stored copies for every fret or root.

### Chord identification

Chord Identifier candidates are scored by exactness, root/bass presence, diatonic context, omissions, extra tones, and formula complexity. Some extended formulas allow omitted fifths and other conventional omissions. A result is an interpretation, not a proof; preserve alternate candidates and uncertainty rather than forcing a single label.

## Persistence

Settings and user data are stored in `localStorage`; there is no account, cloud sync, or server database.

Current keys include:

- `triad-trainer-c-major-items`
- `voice-leading-selected-key`
- `voice-leading-settings`
- `music-trainer-midi-settings`
- `music-trainer-selected-mode`
- `play-the-chord-settings`
- `chord-practice-saved-sets`
- `fretboard-trainer-settings`
- `fretboard-key-study-settings`
- `fretboard-voice-leading-settings`
- `fretboard-triad-shapes-settings`
- `fretboard-last-tool`
- `chord-identifier-settings`
- `chord-library-favorites`
- `musicianship-last-session`

Saved state includes schema/migration handling for Chord Practice, Triad Shapes, favorites, legacy mode aliases, old Fretboard Cycle state, stale routes, and accidental exact-start state. Preserve tolerant loading and automatic recovery. Storage failures should leave the current visit usable.

Data is tied to the browser origin. Opening the file directly, using a localhost server, and visiting GitHub Pages create different storage origins, so saved data does not automatically move between them.

## Running and building

### Normal use

No installation or server is required. Open `outputs/index.html` directly in a modern browser.

### Local HTTP development

Use a static server when testing browser security, MIDI, URL routing, pointer behavior, or deployment-like behavior:

```bash
npm run dev
```

Then open:

```text
http://127.0.0.1:4173/
```

No `npm install` is required. Any equivalent static server is acceptable. Do not treat `file://` component testing as equivalent to a real browser test when the bug concerns pointer, focus, layout, permissions, origin, or browser event delivery.

### Build

Edit `outputs/index.html` directly; it remains the application source of truth. Build the GitHub Pages artifact with:

```bash
npm run build
```

The build validates `deployment.config.json`, rejects root-relative asset references that would escape the project base path, copies the application to `dist/index.html`, writes `dist/.nojekyll`, and generates physical entry points for supported direct routes. It does not transform or bundle application code. Preview the production layout with:

```bash
npm run preview
```

Then open `http://127.0.0.1:4173/musicianship-lab/`. Do not introduce a framework or runtime dependency merely for deployment.

## Tests

The test file reads the inline application script, executes it in a Node `vm` context, and supplies a synthetic DOM, timers, localStorage, location, and optional MIDI navigator. It exercises navigation, migrations, persistence, theory, spelling, voicing and route calculations, renderers, MIDI grading, device lifecycle, Chord Identifier, Favorites, Chord Practice, legacy modules, Fretboard Voice Leading, Shape Library, and Triad Shapes.

No npm install is required. Run the complete suite with Node 20 or newer:

```bash
npm test
```

Focused early-exit scopes are available:

```bash
MUSICIANSHIP_TEST_SCOPE=triad-shapes node tests/voice-leading.test.js
MUSICIANSHIP_TEST_SCOPE=progression-builder node tests/voice-leading.test.js
```

To additionally generate the compact fretboard renderer preview at `/tmp/fretboard-diagram-preview.html`:

```bash
node tests/voice-leading.test.js --render-fretboard-preview
```

The synthetic harness is broad but is not a layout engine or real browser. For pointer geometry, focus, computed CSS, Web MIDI permissions, responsive layout, or actual browser lifecycle issues, add/run a localhost browser test or perform and report explicit real-browser verification. Never describe harness-only verification as browser verification.

Run the complete production verification with:

```bash
npm run verify
```

This runs the build, the full regression suite, and the Pages artifact checks. `npm run check:pages` assumes `dist/` already exists. The Pages check verifies the production entry-point files and route tokens; it is not an HTTP delivery test or a rendered-browser interaction test.

## GitHub Pages deployment requirements

Planned deployment identity:

- repository name: `musicianship-lab`
- project base path: `/musicianship-lab/`
- public URL: `https://lighthousedesigns.github.io/musicianship-lab/`

The local project folder may retain a different name; local folder naming is not part of the deployment contract.

`deployment.config.json` is the canonical deployment configuration. `npm run build` publishes the application into `dist/` so that `dist/index.html` is at the root of the Pages artifact. The public artifact must resolve:

```text
https://lighthousedesigns.github.io/musicianship-lab/index.html
```

and the directory URL above must load the same file.

`.github/workflows/deploy-pages.yml` runs on every push to `main` and on manual dispatch. It uses Node 24 to build, run the regression suite, check the Pages paths, configure Pages, upload `dist/`, and deploy through the `github-pages` environment. It requires only built-in `contents: read`, `pages: write`, and `id-token: write` permissions; do not add secrets.

The GitHub repository must use **Settings → Pages → Build and deployment → GitHub Actions**. The workspace was not a Git repository when deployment scaffolding was added, so initial repository creation, first commit, remote setup, and first push are separate one-time publishing steps.

Because this is a project site, future asset and link paths must be relative or explicitly respect `/musicianship-lab/`; do not assume the domain root `/`. The current application has no separate asset paths. The build deliberately fails on a new root-relative JavaScript, CSS, image, font, or CSS `url()` reference.

Query/hash routes from the Pages root remain compatible. The build also generates real directory entry points for:

- `/musicianship-lab/keyboard/chord-practice/`
- `/musicianship-lab/fretboard/voice-leading/`
- `/musicianship-lab/fretboard/triad-shapes/study/`
- `/musicianship-lab/fretboard/triad-shapes/quiz/`

Do not assume another arbitrary deep path will work. Add deliberate route parsing, a `deployment.config.json` direct-route entry, and verification when exposing another public path.

GitHub Pages provides the intended HTTPS origin, but Web MIDI still depends on browser support, user permission, and a connected device. Moving from local use to the Pages origin also starts a new localStorage namespace.

The workflow verifies the build, regression suite, base-path configuration, route tokens, and physical direct-route entry points automatically. Before calling a public deployment fully verified, also check in a real supported browser:

- the home screen at `/musicianship-lab/`
- direct query routes for Chord Practice, Fretboard Voice Leading, and both Triad Shapes views
- Fretboard diagrams, piano diagrams, TAB, keyboard controls, and responsive layout
- localStorage persistence on the deployed origin
- MIDI permission/device behavior in a supported browser over HTTPS
- the full Node regression suite

## Known limitations and fragile areas

- The entire UI and engine live in a roughly 15,000-line HTML file with shared mutable state. Small changes can have distant effects.
- Tests use a synthetic DOM and do not currently include checked-in Playwright/Cypress browser coverage.
- Web MIDI availability and permission behavior are browser/device dependent.
- All user data is local to one browser origin; there is no sync, backup, import/export, or account recovery.
- Chord identification is heuristic, particularly for rootless, omitted-tone, or ambiguous extended voicings.
- The legacy editable Triad list has flexible labels but requires exactly three parseable note tokens for MIDI grading and has no encoded octave.
- Exact Register cannot be enforced for those legacy editable prompts and falls back to Exact Voicing.
- Several hidden legacy screens and storage keys remain intertwined with current migrations and tests.
- Direct routing is regex-based. Only paths generated from `deployment.config.json` are guaranteed to receive a physical `index.html` from GitHub Pages.
- Build validation and deployment CI exist, but there is no linting, type checking, checked-in real-browser end-to-end suite, or automated accessibility audit.
- Fretboard route generation has many interacting constraints: inversion, exact/auto start, string set, fret range, open strings, span, and strict/preferred range behavior. Preserve automatic recovery paths.
- Shared CSS applies pressed-state movement to ordinary buttons. Absolutely positioned controls that use `transform` for geometry must explicitly preserve their transform in `:active` state; Triad Shapes Quiz already has this protection and a regression assertion.
- Compact diagrams must remain small enough to show several route cards at once; improve readability through typography/contrast rather than enlarging the component.

## Working style

Before changing behavior:

1. read this file
2. inspect the relevant markup, state, handlers, shared engine functions, persistence, and tests
3. trace all consumers of a shared renderer or theory function
4. preserve unrelated working behavior and user data

For small changes, inspect only the affected paths first and run focused tests during iteration. Run the full suite for substantial/shared changes or when explicitly requested. Use real browser verification when the failure depends on actual layout or events.

For every completed task report:

- files changed
- behavior changed
- persistence or migration changes
- tests added or updated
- exact test commands and results
- real-browser checks when relevant
- known limitations or unverified behavior

## Product decision hierarchy

When implementation details conflict, prioritize:

1. get the user into meaningful practice quickly
2. preserve musical correctness and explicit spelling
3. preserve every working tool and compatible saved state
4. keep the interface clear and direct
5. reuse shared logic and renderers
6. retain advanced controls without burdening the default workflow

Do not:

- make exact Fretboard starting-shape selection mandatory
- block route generation when another inversion can work
- show generic errors when the actual constraint is known
- restore retired Fretboard Practice, standalone Key Study, Recognize Triads, or Keyboard Voice Leading navigation without an explicit product decision
- remove hidden legacy logic without proving it has no current consumer, migration role, or regression coverage
- add placeholder tools or empty dashboards
- enlarge compact fretboard diagrams merely to improve label readability
- duplicate theory, MIDI, voicing, diagram, TAB, navigation, or persistence logic
- report a shared or browser-sensitive change as complete without proportionate verification
