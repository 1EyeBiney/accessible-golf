# Accessible Golf: rules for Claude Code

Read this first every session. This file is the operational layer; the distilled
engine reference is ARCHITECTURE.md; the full historical record is `gemini.md`
(frozen — see Documentation below). Open questions live in ISSUES.md.

## What this is and who it's for

A web-based, audio-first golf simulation built strictly for screen-reader and
keyboard-only players, live at https://1eyebiney.github.io/accessible-golf/.
Brian is blind and verifies with NVDA/JAWS and a real keyboard — nothing visual
counts as verification from him. Write summaries in plain prose and say what to
test by ear and keyboard. The visual HUD (dashboard, swing meter, marquee,
scorecard table) exists for sighted spectators only and is `aria-hidden`.

## Prime Directives (never violate)

- **No standard inputs.** Never `<input>`, `<select>`, or form fields of any
  kind. All interaction is keyboard events against the focus-trapped
  `#game-container`; `role="application"` sits on `<body>` so JAWS hands raw
  keys to the page.
- **Every action produces definitive audio** — Web Audio API synthesis, an MP3,
  or `window.announce(...)` (which feeds both the assertive ARIA live region and
  the visual marquee, stripping markdown for TTS).
- **State lives in JS variables, never read back from the DOM.** The swing is a
  state machine: `swingState` 0 Idle → 1 Back Hinge → 2 Back Power → 3 Down →
  4 Impact → 5 Flight.
- **The audio texture table is locked.** Hinge pings 600Hz triangle (0.15s);
  power curve 300→1050Hz sine; milestones 25% 220Hz square / 50% 440Hz triangle
  / 75% 660Hz triangle double-pulse / 100% 1200Hz (square double-chirp per
  v5.6.0); over-torque 150Hz sawtooth; impact drop descending sine from
  `100 + finalPower * 8` Hz to 100Hz. Do not alter frequencies or wave types.

## Architecture contract

Nine modules, vanilla JS, no build system, no dependencies, no framework.
Strict `<script>` load order in index.html:

`data_ag.js` → `courses/*.js` → `audio_core.js` → `golf_audio_bank.js` →
`physics_core.js` → `physics_collisions.js` → `ui_ag.js` → `input_ag.js` →
`main_ag.js` (last — it calls everything else).

Cross-module calls go through explicit `window.*` globals only. Courses
self-register via `window.courses.push({...})`; adding a course means a new
file in `courses/` **plus** a script tag in index.html (with cache-buster).
See ARCHITECTURE.md for what each module owns.

## Code conventions

- UTF-8 encoding for every source file (this bit us: main_ag.js was UTF-16 for
  months, invisible to every text tool; `tools/check.js` now rejects UTF-16).
- `window.AG_VERSION` in physics_core.js line 2 is the single version source of
  truth. Every release syncs the `<title>`, the version `<div>`, and every
  script tag's `?v=` cache-buster in index.html to it, and bumps the header
  comment of each touched file. A cache-buster that doesn't get bumped is worse
  than none — it *guarantees* stale modules.
- All MP3 variety pools use the grab-bag pattern: shuffle an index array, pop
  per play, refill and reshuffle when empty, so every clip cycles before any
  repeats.
- Bot voice assets follow `audio/bots/{prefix}_{tier}{scenario}{n}.mp3`
  (tier `g`ood/`a`verage; scenario `dart`/`approach`/`drive`); prefixes are
  registered only in `window.audioVoices` in audio_core.js — adding a
  commentator is one dictionary entry plus the MP3s.
- Every `setTimeout` in the shot/announce pipeline is pushed into
  `stateTimeouts`; `loadHole` clears them all as an atomic kill switch.

## Recurring bug classes (each burned this project at least once)

1. **`let` TDZ inside `calculateShot`** — the function is ~1,000 lines and
   injection position matters. Referencing `potentialDist`, `backspinRPM`,
   `flightPathNarrative`, or `totalDistance` above their declaration crashes
   the whole shot silently (the 20s watchdog then masks it as a "freeze").
   Check ARCHITECTURE.md's pipeline map before injecting anything.
2. **Module-scope vs window-scope** — audio_core.js keeps its audio elements as
   module-locals; touching `window.currentBgAmbient` from another file edits a
   stale copy. Rule: state mutation lives in a function inside the owning
   module, exposed on `window` (e.g. `hotSwapAmbient`, `stopAllCourseAudio`).
3. **Falsy guards eating legitimate zeros** — `!h.offset` skipped a
   center-fairway hazard because its offset was `0`. Use `=== undefined`.
4. **`const` mutated later** — declaring pipeline variables `const` crashes
   when a downstream interceptor applies `*=`. Physics scalars that any
   interceptor might touch are `let`.
5. **Screen-reader timing** — premature keyup events (JAWS), TTS overlap, and
   ghost timers. Respect the pacing system (character-length TTS delays), the
   `waitForDuckToClear`-style handoffs, and the `stateTimeouts` discipline.
6. **Stale cache** — see the version rule above.

## Deployment truth, and the rule it forces

GitHub Pages serves the `main` branch root directly (legacy build). **Pushing
to main IS deploying** — live in about a minute, no CI, no checks, no staging.

Therefore, before every commit: `node tools/check.js` passes clean. After every
push: load the actual live URL in the browser, confirm the version strings and
a clean console. "Works locally" is not done; only the live site counts —
and anything touching announce flow or key handling additionally gets flagged
for Brian's own NVDA/JAWS pass in the session summary.

## Documentation

- `.changelog.md` is the single running log, newest-first. Every change gets
  one entry carrying BOTH the plain-English summary and the technical detail
  (root cause, files touched, injection points) that gemini.md's addenda used
  to hold.
- `gemini.md` is frozen as of the 2026-08-31 handover — the historical archive
  of the Gemini era (through v6.22.0). Never append to it; when it conflicts
  with the code, the code is the authority.
- ISSUES.md holds open questions and deferred items.
- The dotfiles (`.keybin_5.12.MD`, `.temp.MD`, `.strokes.MD`, the old sound
  testers, the xlsx sheets) and `z.old/` are Brian's scratch/reference — never
  treat them as authority, never delete them.

## Verification workflow

- Local preview: `.claude/launch.json` runs `npx serve . -l 8080` from the repo
  root (so relative `audio/` paths resolve). Drive the game by keyboard in the
  browser pane; check the console for errors on boot and after a swing.
- Keybinding authority is `helpMenuText` in data_ag.js and
  `window.getKeyDescription` in input_ag.js — keep both in sync when adding or
  changing any binding, or blind players lose discoverability.
- The headless telemetry simulator (pacing mode "Simulate" + 4 bots) can play a
  full 18 in seconds — useful for smoke-testing physics changes without audio.
