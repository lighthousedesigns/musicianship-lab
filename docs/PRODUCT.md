# Musicianship Lab product reference

This is the current source of truth for the shipped product experience. It was checked against `outputs/index.html`, `tests/voice-leading.test.js`, `package.json`, `deployment.config.json`, and the Pages workflow on 2026-08-03. If behavior changes, update this file with the code and tests.

For engineering rules and commands, see [`../AGENTS.md`](../AGENTS.md). For durable rationale, see [`DECISIONS.md`](DECISIONS.md).

## Purpose

Musicianship Lab is a practical, browser-based collection of tools for learning and applying harmony on keyboard and guitar. It favors usable musical actions over an abstract encyclopedia:

- recognize, spell, name, and play chords and inversions
- connect chords with smooth keyboard and guitar voice leading
- learn movable guitar triad shapes and their chord-tone locations
- identify MIDI notes, intervals, chords, voicings, and major-key context
- save chord discoveries and focused keyboard practice sets
- move quickly from setup into focused practice

The product should connect theory to playing, hearing, songwriting, arranging, bass movement, sequencing, and harmonic choices when relevant.

## Navigation and landing behavior

The home page asks what the user wants to work on and shows three areas in this order:

1. **Keyboard** — opens directly into **Chord Practice** settings. It intentionally skips a one-card Keyboard landing page.
2. **Fretboard** — opens a two-tool landing page with **Voice Leading** first and **Triad Shapes** second. The last-used primary Fretboard tool is saved and marked as the default choice, but the landing page remains visible.
3. **Explore** — opens a landing page with **Chord Identifier** and **Favorite Chords**.

When a valid last session exists, the home page also offers **Continue Last Session** with musical context. Breadcrumbs return to Home or the current area. A compact Fretboard tool switcher appears only after a primary Fretboard tool is open.

The application hides and shows screens rather than using a routing framework or `history.pushState`. Startup may resolve a supported path, query, or hash. Current stable IDs include:

- `keyboard.chord_practice`
- `fretboard.voice_leading`
- `fretboard.voice_leading.route`
- `fretboard.voice_leading.shape_library`
- `fretboard.triad_shapes.study`
- `fretboard.triad_shapes.quiz`
- `theory.chord_identifier`
- `chord_library.favorites_view`

Old Keyboard and Fretboard route IDs remain migration inputs and aliases. They do not represent current top-level destinations.

## Keyboard and piano tools

### Chord Practice

Chord Practice is the only current Keyboard destination. It combines the former Recognize Triads, Play the Chord, and Keyboard Voice Leading destinations into one setup and practice surface.

It has two practice types:

- **Individual Chords** — builds a filtered pool or an exact custom set.
- **Progression** — practices an ordered sequence in the same large keyboard view.

Individual Chords supports four prompt directions:

- See chord → Play
- See notes → Name
- See diagram → Name
- Mixed

The filter pool can use all 12 chromatic roots, selected roots, or diatonic chords in one of the supported major keys. The exact Custom Set builder chooses particular chords and inversions, supports Random or Listed Order, can repeat the list, and stores named practice sets with load, rename, duplicate, and delete actions.

The 16 practice chord types are:

- major, minor, diminished, augmented, sus2, sus4
- dominant 7, major 7, minor 7, minor-major 7, half-diminished 7, diminished 7
- add 9, minor add 9, major 6, minor 6

Available inversions follow chord cardinality: triads expose root, first, and second inversion; four-note chords can expose third inversion. An **Any** inversion filter allows any supported inversion.

Difficulty is Guided, Standard, or Challenge. Options include reveal after an incorrect answer, Roman numerals in Standard mode, response timing, exact-register performance grading, and piano-diagram labels as chord tones, note names, both, or none. Sessions show completed answers, first attempts, average response, current and longest streak, and elapsed length. Optional MIDI auto-advance advances after a correct answer.

Progression mode supports common diatonic progressions and a custom ordered builder. The user can select each inversion manually or ask for nearest voicings. The preview, practice target, piano diagram, and MIDI grading share the same generated voicing. Optional movement hints show how the current voicing relates to the previous one, and the progression may repeat.

Non-performance prompts are answered with on-screen root, chord-type, and inversion controls. Performance prompts can always be revealed and advanced manually for study, but automatic performance grading requires MIDI.

## Guitar and fretboard tools

### Fretboard Voice Leading

Voice Leading connects exact triad shapes across one adjacent three-string set. The normal setup flow is:

1. choose one of the 12 supported major keys
2. choose EAD, ADG, DGB, or GBE
3. choose the starting diatonic chord from I through vi
4. choose the preferred starting inversion
5. choose fret range 0–4, 5–8, 9–12, or Any
6. leave Starting Location on Auto or deliberately choose an exact shape
7. choose an ascending, descending, common, or custom progression
8. generate the complete route

Options include a final tonic, strict **Stay in Range** or fallback-capable **Prefer Range**, a maximum shape span of three, four, or five frets, open positions, and movement details.

Auto is the default starting location. It searches for a valid physical route and may substitute another starting inversion when the preferred inversion cannot produce one; the visible inversion is updated and the substitution is explained. **Choose Exact Shape** is an advanced opt-in. It becomes active only after a deliberate exact choice or **Start Route Here** from Shape Library. Invalid, implicit legacy, or stale exact selections migrate back to Auto.

The generated route has two internal destinations:

- **Route** — the complete optimized progression.
- **Shape Library** — diatonic triad shapes available under the shared settings.

Route has two views:

- **Study** shows every compact diagram at once with no tracked playhead.
- **Recall** keeps the same route but hides diagrams and exact frets until the user reveals them.

**Print Route** opens the browser print dialog with a portrait, print-only sheet containing exactly the route diagrams currently visible. Application navigation and controls are excluded. An unrevealed Recall route cannot be printed until its diagrams are revealed; the browser print dialog can print the sheet or save it as a PDF.

Each route card can open a detail dialog containing its diagram, notes, chord-tone roles, TAB, and movement from the previous and to the next shape. **Back to Settings** preserves the musical choices. Each voice stays on the same string, and route optimization minimizes total fret movement across the complete sequence rather than greedily choosing only the next chord.

### Shape Library

Shape Library is part of Fretboard Voice Leading, not a standalone home tool. It reuses the former Key Study engine and shares key, string set, fret range, open-position preference, selected chord, and selected inversion with Route.

It can show diatonic chord/inversion cards, fretboard diagrams, note names, R/3/♭3/5 labels, fret numbers, roots, TAB, sequence controls, and shape details. **Start Route Here** transfers the displayed frets to Voice Leading and deliberately activates exact-shape mode. Switching between Route and Shape Library must not regenerate or discard an already valid route.

### Triad Shapes

Triad Shapes uses one canonical set of exactly 24 neutral movable shapes:

- four adjacent string sets: EAD, ADG, DGB, GBE
- two qualities: major and minor
- three inversions: root position, first inversion, second inversion

The neutral diagrams use reference frets; moving the entire shape transposes it.

**Study** filters one string set by quality and inversion and labels chord tones as R, 3 or ♭3, and 5.

**Print Shapes** opens the browser print dialog with a portrait, print-only sheet containing exactly the shapes in the current Study filter. The page retains the active string-set, quality, and inversion context while excluding navigation, filters, and quiz content; the browser print dialog can print it or save it as a PDF.

**Quiz** filters the same canonical collection, asks for the root, third, fifth, or a mixed target, and offers 5-, 10-, 20-question, or continuous sessions. It records score and missed categories, saves an in-progress session, and can open a focused study set for missed shapes.

Quiz markers are real accessible buttons. Mouse, touch, Enter, or Space submits once, reveals all three labels without moving the marker geometry, locks the current question, and moves focus to **Next Shape**.

## Explore tools

### Chord Identifier

Chord Identifier opens directly into listening. It requires Web MIDI input and reports:

- a single note when one MIDI note is sounding
- an interval when two notes are sounding
- a best chord interpretation and exact-match alternatives when three or more notes form a useful candidate
- a pitch collection when no conventional chord candidate is strong enough

For chord results it can display the exact played notes, unique tones, bass, root, inversion, slash bass, formula, doubled notes, missing tones, extra tones, confidence, and alternate names. Optional major-key context supplies a Roman numeral, diatonic/non-diatonic status, and harmonic function. Advanced options control held-last-result behavior, sustain following, and the maximum candidate count.

Its formula vocabulary is intentionally broader than Chord Practice. It includes triads, suspended and added-tone chords, sixth chords, sevenths, ninths, elevenths, thirteenths, and several altered dominants. Candidate ranking considers exactness, root and bass evidence, key context, omissions, extra tones, and formula complexity. The result is an interpretation, not a proof.

### Favorite Chords

Favorite Chords stores Chord Identifier discoveries in this browser. A favorite includes a preferred interpretation and may include a custom title, note, key context, alternate interpretations, and exact MIDI voicing.

The library supports search, group/key filters, recent/name/key sorting, detail editing, duplication, deletion, and **Play to Match**. Review and organization work without MIDI; Play to Match requires MIDI. A favorite saved without exact voicing matches chord identity rather than a particular register.

## Shared interface principles

- Start from a musical intention, then reveal detailed controls only where they help.
- Get users into meaningful practice quickly; avoid wrapper pages with only one choice.
- Keep advanced controls available without making them default obstacles.
- Preserve the user’s current musical context when moving between related views or returning to settings.
- Use the same structured musical object for prompts, diagrams, note order, and grading so the UI cannot describe one voicing and grade another.
- Show actionable constraint messages. If a valid fallback exists, recover and explain it instead of presenting a generic failure.
- Keep compact route diagrams small enough for side-by-side study; use typography and contrast for legibility.
- Use real semantic controls, visible focus, heading focus after navigation, `aria-live` feedback, keyboard activation, and reduced-motion behavior.
- Keep noninteractive diagrams noninteractive. Add interactive markers only to the quiz consumer that needs them.
- Preserve explicit choices and compatible saved state. Never silently change key, chord, inversion, string set, range, exact shape, custom set, or progression.
- Keep MIDI enhancement separate from core study and naming workflows whenever the musical task does not inherently require played input.

## Music-theory naming and display conventions

### Keys and spelling

The shared key engine supports these 12 major keys:

- C, G, D, A, E, B, F-sharp
- D-flat, A-flat, E-flat, B-flat, F

Major scales use semitone offsets `[0, 2, 4, 5, 7, 9, 11]`. Each scale degree receives the correct diatonic letter before its accidental is calculated. Key-aware displays therefore preserve spellings such as E-sharp in F-sharp major and G-flat in D-flat major.

Internal note tokens generally use ASCII `#` and `b`. Chord Practice converts symbols to typographic ♯ and ♭ in dedicated displays, while several note readouts retain ASCII spellings. Do not globally normalize display strings without checking every consumer. The legacy editable Triad parser accepts letters plus ASCII `#` and `b`, not arbitrary Unicode accidental tokens.

When no key supplies a spelling, Identifier uses a flat-oriented fallback (`Gb`, not `F#`). Chord Practice's chromatic root list is flat-oriented except that pitch class 6 is `F#`. MIDI octave names use scientific pitch notation, with MIDI 60 displayed as C4.

### Chords, degrees, and inversions

Major-key diatonic triads are I major, ii minor, iii minor, IV major, V major, vi minor, and vii° diminished. Lowercase Roman numerals denote minor quality; `°` denotes diminished; diatonic half-diminished sevenths use `ø7`. Chord Practice may display Roman numerals when a key context exists.

Formula labels use `1`, `3`, `♭3`, `5`, altered fifth/seventh labels, and extensions such as `9`, `11`, and `13`. Triad Shapes uses `R` instead of `1` for the root marker. Chord symbols use concise suffixes such as `m`, `dim`, `aug`, `sus2`, `sus4`, `7`, `maj7`, `m7`, `mMaj7`, `m7b5`, `dim7`, `add9`, `madd9`, `6`, and `m6`.

Inversion is determined by the lowest sounding chord tone. Slash-bass display is used when a chord candidate’s bass differs from its root. Exact voicing comparisons preserve low-to-high note order; voices do not cross in generated keyboard triads, and guitar voices remain assigned to their selected strings.

### Instrument constraints

Keyboard voicings and piano diagrams share the same MIDI notes, pitch classes, spelling, chord-tone roles, and inversion. Legacy triad voice-leading candidates stay within MIDI 48–72.

Fretboard calculations use standard tuning E2–A2–D3–G3–B3–E4, frets 0–12, and adjacent three-string sets. Every generated guitar voicing has one chord tone per selected string, strictly ascending sounding pitches, the requested bass/inversion, and the complete requested triad pitch-class set. Open strings are excluded unless explicitly enabled.

## MIDI and non-MIDI behavior

Web MIDI permission is requested only after **Enable MIDI**. Inputs populate a device selector; the preferred device is saved; connection changes refresh the list; unsupported and denied states are explained without crashing the application.

Note On is status `0x90` with velocity above zero. Note Off is status `0x80`, or Note On with velocity zero. Sustain is Control Change `0xB0`, controller 64, with values 64 and above treated as pedal down. Pressed and sustained notes are tracked separately and merged into a unique active-note set. A sorted-note signature suppresses duplicate grading of an unchanged held voicing.

Trainer evaluation waits 220 ms for a chord to settle; Identifier and Favorite matching wait 110 ms. Graded trainer prompts require exactly the expected note count, and extra notes block grading until released.

The shared MIDI settings expose:

- **Chord Notes** — pitch-class set matches; inversion and octave do not matter.
- **Exact Voicing** — low-to-high pitch-class order matches; octave transposition is allowed.
- **Exact Register** — exact sorted MIDI note numbers match.

Current Chord Practice performance prompts require Exact Voicing unless **Require Exact Register** is enabled. The hidden legacy Keyboard Voice-Leading flow also requires Exact Voicing unless the global answer mode is Exact Register. Legacy editable Triad prompts cannot enforce Exact Register because their data has no octave; they fall back to Exact Voicing.

MIDI is not required for Chord Practice naming prompts, answer reveal, keyboard/fretboard diagrams, Fretboard Voice Leading, Shape Library, Triad Shapes Study/Quiz, Favorite browsing/editing, or ordinary navigation. MIDI is inherently required for Chord Identifier, Favorite Play to Match, and automatic grading of “play this chord” prompts. There is no built-in audio synthesis; “Play Through” in Shape Library advances the visual sequence.

## Persistence

Settings, last-session context, saved practice sets, quiz progress, and favorites use `localStorage`. There is no account, cloud sync, server database, import/export, or recovery service.

Data belongs to one browser origin. Direct file use, localhost, preview under `/musicianship-lab/`, and the GitHub Pages site have different storage namespaces. Saved data does not automatically move between them.

Loaders are deliberately tolerant. They migrate old route/mode names, legacy Keyboard Voice Leading into Chord Practice Progression, standalone Fretboard modes into Voice Leading/Shape Library, old Fretboard Cycle state into Study, incompatible exact-start data into Auto, and older Chord Practice, Triad Shapes, and favorite schemas. Storage failures should leave the current visit usable.

## Current known limitations

- The application is a roughly 15,000-line monolithic HTML file with shared mutable state; small changes can affect distant workflows.
- The broad Node harness uses a synthetic DOM. There is no checked-in real-browser end-to-end suite, layout engine, automated accessibility audit, lint step, or type checker.
- Web MIDI support, secure-context rules, permission behavior, and device behavior vary by browser and hardware.
- All saved data is origin-local. There is no synchronization, backup, import/export, account recovery, or cross-origin migration.
- Chord identification is heuristic, especially for rootless, omitted-tone, altered, or otherwise ambiguous collections.
- Chord Practice exposes 16 curated practice formulas; Identifier recognizes a broader but still finite formula library.
- The current theory UI is major-key centered. The shared key engine has 12 major keys, not a full minor-key or modal key system.
- Guitar generation is limited to standard tuning, adjacent three-string sets, and frets 0–12.
- Direct routing is regex-based. Only the four paths listed in `deployment.config.json` are emitted as physical GitHub Pages entry points; arbitrary deep URLs are not guaranteed.
- The legacy editable Triad list requires exactly three parseable ASCII note tokens and has no encoded register, so Exact Register cannot apply to it.
- There is no built-in audio synthesis or notation staff; feedback is visual and MIDI-input based.
- Build and Pages checks validate artifacts and route tokens, not live HTTP delivery, responsive rendering, focus/pointer geometry, localStorage behavior, or Web MIDI on the deployed origin.
- Hidden legacy modules and migrations remain intertwined with current shared engines and regression coverage, so removing apparently unused code requires call-site and test proof.
