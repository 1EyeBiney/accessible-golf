# Accessible Golf — engine reference

The distilled, stable knowledge from the Gemini era (gemini.md, frozen), verified
against the code at v6.23/v6.24. The addenda describe intent; **the code is the
authority** — when this file and the code disagree, fix this file. Line numbers
drift; function names don't, so navigate by grep.

## Module map (load order = dependency order)

| File | Owns |
|---|---|
| `data_ag.js` | `windLevels`, `shotStyles` (Full/Pitch/Chip/Bump & Run/Flop...), `clubs` (Driver→Putter: baseDistance, loft, rollPct), `window.greenDictionary` contour registry, `helpMenuText` (keybinding authority #1), `rosterPresets`. Initializes `window.courses = window.courses \|\| []`. |
| `courses/*.js` | One course each (`course_holodeck`, `course_scrapyard`, `course_pebble`, `course_pasture`), self-registering via `window.courses.push({...})`. |
| `audio_core.js` | `window.announce` (ARIA + marquee, strips `#*` for TTS), Web Audio primitives (`playTone`, `playNoise`, `playSweep`, `playPanTone`, `playEcho`, `playChord`), environmental two-track system (`playEnvironment` music+ambient, module-local `currentBgMusic`/`currentBgAmbient`), `hotSwapAmbient`, `stopAllCourseAudio`, clubhouse music rooms (`playClubhouseMusic`, `triggerDoorTransition`, `stopClubhouseMusic`), volume setters (`updateMusicVolume`, `updateAmbientVolume`), duck/mishap system (`triggerDuckEvent`, `waitForDuckToClear`), `window.audioVoices` registry, bot audio signatures. |
| `golf_audio_bank.js` | ~100 categorized synthesized cues behind `window.playGolfSound(cueId)` (e.g. `ui_nav_03`, `bunker_33`, `hazard_03`). |
| `physics_core.js` | `window.AG_VERSION` (line 2 — version source of truth). `calculateShot` (the ~1,000-line heart), wind (`generateWind`/`driftWind`/`applyDivergentWind`), `getSetupReport`, `initPutting`, `finishPutt` (nested in the putting flow), scoring audio (`playScoringAudioSequence`), `autoEquipBestClub`, `autoSetFocus` (note: a second copy lives in main_ag.js — the alphabetized indices are canonical), Oracles: `getCaddyAdvice` (human) and `getOracleBlueprint` (bot AI), Bill's God Mode watchdog. |
| `physics_collisions.js` | `getTerrainAt(x,y)` (flight-time terrain), `getLandingZoneEffect`, `resolveTreeCollisions`, `resolveHazardLie(ctx)` (the authoritative settle — AABB hazards, water, green check, all Pasture gimmick interceptors). |
| `ui_ag.js` | `updateDashboard`, scorecard (`showScorecard`/`renderScorecard`/`announceScorecardCell` — invisible 2D array for ARIA, HTML table for spectators), `buildClubhouseMenu` + `announceClubhouse` + `confirmClubhouseSelection` (wizard state machine), `drawMeter` (canvas swing meter), `openHelpMenu`. |
| `input_ag.js` | The one `keydown` and one `keyup` listener; `getKeyDescription` (keybinding authority #2); `copyToClipboard` (secure-context + `execCommand` fallback); save-slot interactive flow. |
| `main_ag.js` | Global state declarations (top of file), `initGame`, `loadHole`, `advanceTurn` + turn manager, `initPlayers`/`saveActivePlayer`/`loadActivePlayer`, `takeAITurn`, swing sequence (`startBackswing` → `startPowerPhase` → `startDownswing` → `startImpactPhase`), save system (`saveGame`/`loadGame`/`getSaveSlotInfo`), `focusModes`/`difficultyLevels`/`roughConditions`/`ballTypes`, the `window.courseData` scope-merging getter, universal ambient router (inside `advanceTurn`), idle reminder. |

## State machines

- **Swing:** `swingState` 0 Idle → 1 Back Hinge → 2 Back Power → 3 Down Hinge →
  4 Impact Drop → 5 Flight. ArrowDown press starts backswing, release locks
  power and starts downswing, press again at drop bottom strikes. Spacebar taps
  set `hingeTimeBack`/`hingeTimeDown`. `window.swingControlMode = 'hold' | 'tap'`
  (KeyK toggles; tap = classic 3-click, keyup returns early in tap mode).
- **Game mode:** `gameMode` ∈ `'clubhouse'`, `'course'`, `'range'` (all practice
  areas — holo range, chipping, pitching), `'putting'`, `'post_round'`.
  Practice isolation: `loadHole` installs a clean "Practice Simulator" stub
  into `window.currentCourse` for range/putting; `saveGame` refuses to run
  outside `'course'`; `initPutting` no-ops on the range; the Pasture gimmick
  interceptors all require `gameMode === 'course'`.
- **Putting:** entering a green (course mode) sets `isPutting = true`, auto-equips
  putter, forces Touch focus. Power = position of `puttTargetDist` cursor
  (always swing to the 100% tone); Spacebar = tempo. Gravity engine simulates
  1-yard steps through `greenDictionary` contours (`startY`/`endY` brackets with
  `slopeX`/`slopeY`); cup has `captureRadius` + `captureSpeedLimit`; good tempo
  widens the speed limit (Touch Magnetism tiers). Post-loop resting-spot check
  catches balls dying into the cup.
- **Input interceptor priority** (top of the `keydown` listener, in order):
  F5/F6 native pass-through → F12 Explore Mode toggle → Explore Mode intercept
  (announce key, don't execute) → Help menu → Scorecard → Clubhouse →
  save-slot selection/confirm flows → quit/mulligan/gimme confirmations →
  game keys (gated by `swingState`).

## `calculateShot` pipeline (the TDZ map)

Injection position inside `calculateShot` (physics_core.js, `function
calculateShot(autoMiss)`) is load-bearing — `let` declarations create a
temporal dead zone and an early reference crashes the shot silently (the 20s
`SHOT_RECOVERY_TIMEOUT_MS` watchdog then resets state, masking it as a freeze).
Current order of the load-bearing declarations (grep for them, don't trust line
numbers): `chokeMod` / `loftDistMod` / `potentialDist` (hoisted v6.02.1) →
`backspinRPM` → `totalDistance` → `rollDistance` → `carryDistance` →
`startX`/`startY` (pre-mutation origin) → `flightPathNarrative` (hoisted
v5.84.4) → interceptor zone (Acorn Dome, magnetic gates, etc. sit here, BEFORE
the absolute coordinate resync) → `ballX/ballY` absolute resync from origin
(v5.44.2) → `resolveHazardLie(ctx)` → narrative/telemetry assembly.

Collision flow: `getTerrainAt` classifies terrain during flight math;
`resolveHazardLie` is the authoritative final-lie resolver. Its AABB loop uses
unified `carryHit`/`rollHit` booleans (v5.81.0 — a carried hazard and a
rolled-into hazard hit the same interceptor chain), `=== undefined` guards so
`offset: 0` hazards work (v5.76.0), and `rollStopTriggered` doubles as the
double-strike guard when one ball overlaps two hazard boxes (v5.82.0).
Dimension-less hazard objects (`{ type: "..." }` only) are spectating flags,
skipped by geometry but read by gimmick interceptors.

## Global state worth knowing

- **Players:** `players[]`, `currentPlayerIndex`; per-player isolation of
  `roundData`, `roundHighlights`, `currentHoleStats`, difficulty, caddy level,
  ball, focus, bot profile. `saveActivePlayer()` flushes live globals into the
  player object; `loadActivePlayer(index)` restores (always pass the index).
  `advanceTurn` implements away-player-goes-next and honors.
- **Saves:** 3 slots, `localStorage` keys `ag_save_slot_1..3`,
  `window.activeSaveSlot`, `getSaveSlotInfo(slot)`. In-game Save = Q →
  KeyS → slot 1/2/3 → Y/N. Resume = Clubhouse "Resume Round". Legacy
  `ag_save_state` migrates to slot 1 at boot. No auto-load at boot (v6.09.1).
- **Timers:** everything goes into `stateTimeouts`; `loadHole` clears all.
  Watchdogs: 20s shot recovery; 50ms swing-transition cooldown (800ms input
  lock after a swing resolves); Bill's God Mode watchdog.
- **Volumes:** `window.musicVolumeLevels` [0–0.4] (Shift+V) and
  `window.ambientVolumeLevels` [0–1.0] (Shift+B); MP3 playback reads the live
  index at play time.

## Audio systems

- **Grab-bag pattern** (universal for MP3 pools): shuffle index array, pop per
  play, refill+reshuffle when empty. Pools include ducks, cows, roosters,
  splats, cups, toilets, metal clangs, zaps, 8-bit jingles, clubhouse tracks,
  bot voice bags.
- **Ambient router** (in `advanceTurn`): per-hole fields `bgMusic`, `bgAmbient`,
  `bgAmbientPostTee` (all players off tee), `bgAmbientPostHazard` (+
  `hazardSwapY` threshold), `bgAmbientPostGreen` (all players on green) —
  priority PostGreen > PostHazard > PostTee, swapped via `hotSwapAmbient`
  (lives in audio_core.js because the audio elements are module-locals).
- **Clubhouse rooms:** `'vox'` (Trophy Room, 10 tracks) and `'cafe'` (practice,
  4 tracks) under `audio/clubhouse/`; `triggerDoorTransition(room)` plays the
  door sound and switches; practice areas keep café music, course entry calls
  `stopClubhouseMusic`.
- **Bot voices:** `window.audioVoices` maps name → 2-letter prefix (mm, db, ff,
  md, fb, bl). JIT factory in physics_core.js builds 6 bags per character
  (good/average × dart ≤8yd / approach ≥80yd-to-green / drive stroke-1-fairway),
  files `audio/bots/{prefix}_{g|a}{dart|approach|drive}{n}.mp3`.
- **Mishap audio:** `accuracyScore < 80` → `triggerDuckEvent` (Pasture hole 7
  uses its own 12-duck pool; hole 15 missiles suppress via
  `window.skipDuckEvent`); the caddy announce defers through
  `waitForDuckToClear`.

## Course data schema

Hole object: `number`, `par`, `distance`, `pinX/pinY/pinZ` (Z = elevation,
1yd ≈ 1yd of carry), `greenRadius`, `greenType` (key into `greenDictionary`),
`fairwayWidth`/`approachWidth`, `hazards[]` (AABB: `type`, `distance`, `depth`,
`offset`, `width`, optional `name`; or dimension-less spectating flags),
`trees[]`, `towers[]` (magnetic fields, hole 17), `zones[]`/`landingZones[]`
(Z-key targets), `loreName`, `description` (KeyF), audio fields (see router),
per-hole `windOverride`. Rectangular-green overrides for Pasture 9 and 11 live
in `getTerrainAt`, not data. The Pasture's 18 gimmick interceptors live in
`physics_collisions.js` (tractor, bovine bounce/cow-pie, roosters+loot, mud
bowl, packed earth, box-fan divergent wind, goats, toilet, highway fence,
chicken wire, main drain squelch, water tower backboard, bus, acorn dome,
marquis, magnetic towers, wind tunnel + exit bog) — all gated on course name
AND `gameMode === 'course'`.

## AI / bots

Skill 1–3 with variance floors (skill 1 misses ≥40ms, skill 2 ≥25ms) and
ceilings (skill 3 base 30ms, 15% tee lapse + elite scramble ≤10ms from
trouble). Personalities adjust `adjustedMiss` in `getOracleBlueprint` (Fred
lays up, Dusty overswings, Golden Bear avoids hazards, Lefty flops, Rory bombs
driver, Seve creative short game, Mendi wedge-zone sniper + driver nerf,
Fallon long-iron sniper). **Bill the Legend**: amateur stats holes 1–13, God
Mode holes 14–18 when `billScore >= targetScore - 1` (perfect execution, wind
nullified, 5000-radius cup via watchdog); every readout shows his club as
"Ralph" (dashboard, setup report, telemetry, caddy, turn announcer — 5
override sites). Pacing: Fast/Medium/Slow/Manual/Simulate; delays scale with
`lastShotReport.length` × ms-per-char; Simulate = headless quick-sim (all
audio/TTS suppressed, timeouts collapsed). Roster macros: Shift+L (Moe, Mendi,
Fallon, Bill), Shift+K (Rory, Golden Bear, Lefty, Seve).

## Keybindings

Authority is `helpMenuText` (data_ag.js) + `getKeyDescription` (input_ag.js) —
change both or neither. `?` = context help, F12 = explore mode. The stale
scratch file `.keybin_5.12.MD` is not authority.
