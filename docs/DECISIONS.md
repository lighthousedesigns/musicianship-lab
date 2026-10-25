# Musicianship Lab product decisions

This file records durable product and architecture decisions that should guide future work. It is not a changelog. Small UI edits, bug fixes, and implementation details belong in commits and tests, not here.

For the shipped product contract, see [`PRODUCT.md`](PRODUCT.md). For engineering instructions, see [`../AGENTS.md`](../AGENTS.md).

## Practical musicianship over reference breadth

**Decision:** Build tools around actions a musician performs: play, recognize, spell, name, connect, recall, compare, and save chords.

**Rationale:** A theoretically complete reference can still create practice friction. The product is more useful when theory immediately supports playing, hearing, songwriting, arranging, bass movement, and voicing choices.

**Consequences:** New tools need a concrete practice or creative workflow. Do not add empty dashboards, speculative destinations, or encyclopedic content without an application to music-making.

## One clear home hierarchy

**Decision:** Keep three home areas: Keyboard, Fretboard, and Explore. Keyboard goes directly to Chord Practice; Fretboard has exactly two primary tools in the order Voice Leading then Triad Shapes; Explore has Chord Identifier and Favorite Chords.

**Rationale:** A landing page with one card adds friction, while guitar and exploration each have genuinely distinct destinations. Three intent-based areas are easier to scan than a flat list of every historical exercise.

**Consequences:** The Keyboard wrapper is skipped. The Fretboard switcher appears only inside a primary Fretboard tool. New navigation requires a real product decision, not merely the existence of code behind it.

## Consolidated keyboard practice

**Decision:** Chord Practice is the single current Keyboard destination. It owns individual chord practice, recognition/naming prompts, performance prompts, exact custom sets, saved sets, and progression voice-leading work.

**Rationale:** The former Recognize Triads, Play the Chord, and Keyboard Voice Leading destinations shared the same musical objects and produced unnecessary mode fragmentation. One setup lets users change direction or practice type without relearning navigation.

**Consequences:** Old stable IDs migrate or redirect into Chord Practice. Legacy Keyboard Voice Leading becomes Progression practice with Nearest Voicings. Hidden implementations remain only where they serve migration, shared logic, or regression coverage.

## Curated practice vocabulary, broader identification vocabulary

**Decision:** Chord Practice exposes a focused set of 16 chord types, while Chord Identifier uses a broader formula library including extensions and altered dominants.

**Rationale:** A practice pool benefits from deliberate scope and reliable voicing/inversion behavior. Free identification needs broader interpretive coverage because users may play harmonies outside the practice curriculum.

**Consequences:** Do not assume the two catalogs are identical. Expand a catalog only with the required generation, spelling, inversion, diagram, grading, persistence, and regression support.

## Automatic guitar route entry by default

**Decision:** Fretboard Voice Leading starts in Auto location mode. Exact starting shapes are an advanced, explicit choice through Choose Exact Shape or Start Route Here.

**Rationale:** The primary job is to produce a playable route. Requiring a physical starting shape before route generation creates avoidable dead ends, especially when another inversion is valid.

**Consequences:** Auto may substitute a valid inversion, update the visible selection, and explain the change. Stale, incompatible, or implicit legacy exact state recovers to Auto. Exact mode must still preserve a deliberate compatible choice.

## Optimize complete routes, not isolated moves

**Decision:** Keyboard and guitar progression builders choose voicings with deterministic musical costs across the complete route where an optimized route is requested.

**Rationale:** A locally smallest move can create a worse later move. Whole-route optimization better represents usable voice leading and produces repeatable results.

**Consequences:** Prompt, preview, diagram, notes, and grading must all use the same chosen voicing. Tie-breaking stays deterministic. Guitar voices remain on their selected strings; keyboard voices remain ordered and do not cross.

## Shape Library belongs inside Voice Leading

**Decision:** Shape Library is an internal Fretboard Voice Leading destination, not a home tool.

**Rationale:** Shape browsing and route building use the same key, string set, range, chord, inversion, voicing search, diagrams, and TAB. Keeping them together makes a discovered shape immediately useful as a route start.

**Consequences:** Route and Shape Library synchronize relevant settings. Start Route Here activates exact mode deliberately. Moving between the views does not discard a valid route.

## One canonical movable-triad model

**Decision:** Triad Shapes Study and Quiz derive from exactly 24 canonical neutral shapes: four adjacent string sets × two qualities × three inversions.

**Rationale:** One model prevents study cards and quiz questions from drifting apart and teaches transposable relationships rather than memorized copies for every root.

**Consequences:** Filters operate on the same collection. Quiz interaction may add accessible buttons, but shared non-quiz diagrams remain noninteractive. Marker geometry must not move during pointer activation.

## Study and Recall are separate mental jobs

**Decision:** Fretboard Voice Leading Route uses Study to show the whole route and Recall to conceal the same route until reveal. The retired Fretboard Cycle view is not part of current navigation.

**Rationale:** Study supports comparison across all shapes; Recall supports retrieval practice. A playhead and cycle statistics added state without improving those two core jobs.

**Consequences:** Study has no tracked step. Recall does not regenerate the route. Old saved Cycle state migrates to Study, while unrelated Keyboard progression-cycle behavior remains intact.

## Fretboard printing reflects the visible shape set

**Decision:** Voice Leading Route and Triad Shapes Study build a temporary print-only sheet from the same route or filtered shape data that is currently visible. The browser print dialog handles paper printing and PDF saving. Unrevealed Recall diagrams and Quiz questions are not printable.

**Rationale:** A dedicated portrait sheet with a maximum of three diagram columns fits standard PDF pages cleanly without application chrome, while reusing the shared fretboard renderer prevents printed music data from diverging from the screen.

**Consequences:** Print output includes concise session context and only the current visible shapes. It does not persist separate print state, generate files on a server, or introduce another diagram implementation.

## MIDI is optional unless played input is the task

**Decision:** Do not make MIDI a prerequisite for navigation, visual study, manual naming, or answer reveal. Require it only for listening and automatic performance matching.

**Rationale:** Hardware, browser support, permission, and secure-context constraints should not block useful theory and instrument practice.

**Consequences:** Permission is requested only after an explicit action. Unsupported and denied states degrade gracefully. Chord Identifier and Play to Match inherently require MIDI; Chord Practice naming controls, reveal flows, guitar tools, and library management do not.

## Theoretical spelling is part of correctness

**Decision:** Preserve key-aware diatonic note spelling rather than collapsing enharmonic equivalents to a preferred chromatic label.

**Rationale:** F-sharp major needs E-sharp, and D-flat major needs G-flat. Correct spelling communicates scale degree, chord function, and voice movement.

**Consequences:** Shared musical objects carry spelled names alongside pitch classes and MIDI. Tests cover sharp and flat contexts. Display cleanup must not replace theoretically correct names merely because two spellings sound alike.

## Chord identification preserves ambiguity

**Decision:** Treat Chord Identifier output as ranked interpretation, with alternatives and explicit uncertainty.

**Rationale:** Pitch collections can imply multiple roots or formulas, particularly with omissions, extensions, altered tones, or inversions. Forcing one label would overstate certainty.

**Consequences:** Ranking uses musical evidence and a usefulness threshold. The UI may report no clear conventional chord. Favorite Chords stores the user’s preferred interpretation and can retain alternatives.

## Local-first persistence with tolerant migration

**Decision:** Store settings and user-created data in browser `localStorage`, and preserve compatible older schemas automatically.

**Rationale:** The static app needs no account, backend, or network service. Existing users should not lose practice settings or saved discoveries when navigation and schemas evolve.

**Consequences:** Data is origin-specific and not synchronized. Loads must tolerate malformed or unavailable storage. Stable IDs and migration code have product value even when their old screens are hidden.

## Dependency-free static delivery

**Decision:** Keep the application as a self-contained static file built and verified by dependency-free Node scripts, unless a future architectural decision explicitly replaces this model.

**Rationale:** The current product can run locally or on GitHub Pages without installation, a server runtime, third-party availability, or a bundler.

**Consequences:** `outputs/index.html` is source; `dist/` is generated. GitHub Pages uses the configured project subpath. New assets must respect that base path. Broad refactors carry unusual risk because UI and engines share one file and mutable state.

## Stable routes and explicit public entry points

**Decision:** Preserve stable exercise IDs and support query/hash startup routing, while generating physical Pages files only for deliberately supported public paths.

**Rationale:** Old links and saved sessions need continuity, but GitHub Pages cannot serve arbitrary client-side deep routes without matching files or redirects.

**Consequences:** Adding a public path requires a parser rule, `deployment.config.json` entry, and artifact test. Aliases remain migration inputs and do not automatically become visible navigation.

## Shared engines over parallel implementations

**Decision:** Reuse shared key spelling, chord formula, voicing, movement, diagram, TAB, navigation, MIDI, grading, and persistence code.

**Rationale:** Musical correctness depends on the prompt, display, and evaluator agreeing. Duplicate engines drift and create contradictions users can hear or see.

**Consequences:** Shared changes require tracing every consumer and proportionate regression coverage. The frozen engine and test API are supported internal seams, not disposable test scaffolding.

## Unresolved product questions

These are not approved roadmap items; the current repository does not establish an answer:

- whether and when to split the monolithic application into modules or adopt a build architecture
- whether to add checked-in real-browser end-to-end and automated accessibility coverage
- whether users need export/import, backup, synchronization, or accounts for browser-local data
- whether the key system should expand beyond the current 12 major keys
- whether to add non-MIDI input for Chord Identifier or any built-in audio output
- whether additional chord formulas belong in the focused Chord Practice curriculum

Future work should resolve one of these only with a concrete user need, migration impact, and verification plan.
