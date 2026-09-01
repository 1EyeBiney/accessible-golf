# MISSION: Overnight run — Accessible Golf v6.25.0

You are an unattended Claude Code session working overnight on this repository.
Brian (the owner, who is blind and verifies by NVDA/JAWS and keyboard) approved
this mission in advance; he is asleep and cannot answer questions. Everything
you need is in this file plus the repo's own documentation. Work steadily,
verify everything, and leave an honest morning report.

## Before touching anything

1. Read `CLAUDE.md` and `ARCHITECTURE.md` in full. They are binding. Read
   `EVALUATION.md` for the evidence behind each task (Brian's bracket notes in
   it define scope; this mission already reflects them).
2. Five rules that must not be learned the hard way tonight:
   - The **audio texture table is locked** (frequencies/wave types in
     CLAUDE.md). Never alter it.
   - Any keybinding you add or change updates **both** `helpMenuText`
     (data_ag.js) **and** `window.getKeyDescription` (input_ag.js).
   - **`node tools/check.js` must pass before every commit.**
   - `calculateShot` is ~1,000 lines with a TDZ minefield — check
     ARCHITECTURE.md's pipeline map before injecting; referencing
     `potentialDist`, `backspinRPM`, `flightPathNarrative`, or
     `totalDistance` above their declarations crashes shots silently.
   - Every `setTimeout` in shot/announce flow goes into `stateTimeouts`.
3. Do not run `/code-review ultra` or any billed cloud service. Do not touch
   `gemini.md` (frozen), `z.old/`, the dotfile scratch files, or
   `assets`-equivalent audio folders except to read.

## Git and version policy (strict)

- FIRST action: `git checkout -b overnight-v6.25`. **All work happens on this
  branch. Never push, merge, or commit to `main` — pushing main deploys the
  live site instantly, and the live site must not change tonight.** Push the
  branch to origin (`git push -u origin overnight-v6.25`) after each phase as
  backup.
- At your first code change: bump `window.AG_VERSION` (physics_core.js line 2)
  to `"v6.25.0"` and sync index.html's `<title>`, version `<div>`, and every
  `?v=` cache-buster to it (tools/check.js enforces this). Bump header
  comments of files as you touch them.
- One commit per milestone, and the commit INCLUDES its `.changelog.md` entry
  (newest-first, unified format: plain-English summary + technical root
  cause/injection points + files touched).
- **Failure policy**: if a phase fails its acceptance gate twice, revert that
  phase's commits, log the failure in ISSUES.md, and move to the next phase.
  Never end a phase with a branch that doesn't boot. If something looks
  catastrophically wrong, stop early and write the morning report instead of
  thrashing.

## Verification toolkit (proven procedures — use these verbatim)

**Local server** (background, from repo root so `audio/` paths resolve):
```
npx --yes http-server -p 8092
```
Then open `http://localhost:8092/` in the browser pane.

**Boot test** (after every phase): load the page, then run in the browser:
```js
document.getElementById('initBtn').click();
await new Promise(r => setTimeout(r, 1500));
JSON.stringify({booted: document.getElementById('game-container').style.display,
  ver: window.AG_VERSION, menu: window.menuOptions.length})
```
Console must show zero errors (`read_console_messages` with onlyErrors).

**Batch sim** (the balance-tuning workhorse). From the booted Clubhouse:
```js
// Load the 4-bot foursome, pick Holodeck Links, start with defaults
window.dispatchEvent(new KeyboardEvent('keydown', {code:'KeyL', shiftKey:true, bubbles:true}));
await new Promise(r => setTimeout(r, 600));
window.menuIndex = 0; window.confirmClubhouseSelection();      // Holodeck Links
await new Promise(r => setTimeout(r, 1200));
window.menuIndex = window.menuOptions.findIndex(o => o.text === 'Start Round!');
window.confirmClubhouseSelection();
await new Promise(r => setTimeout(r, 2000));
for (let i = 0; i < 4; i++) {                                   // pacing -> Simulate
  window.dispatchEvent(new KeyboardEvent('keydown', {code:'KeyP', bubbles:true}));
  await new Promise(r => setTimeout(r, 150));
}
JSON.stringify({pacing: pacingModes[pacingModeIndex]})          // must be "Simulate"
```
Poll until done (keep each browser call under ~40s; repeat as needed):
```js
let w = 0; while (gameMode === 'course' && w < 35000) { await new Promise(r => setTimeout(r, 2000)); w += 2000; }
JSON.stringify({done: gameMode !== 'course', hole: hole,
  totals: players.map(p => (p.roundData||[]).reduce((s,h)=>s+h.strokes,0))})
```
Full scorecard extraction when `gameMode === 'post_round'`:
```js
JSON.stringify(players.map(p => {
  const rd = p.roundData || []; const total = rd.reduce((s,h)=>s+h.strokes,0);
  const c = {birdieOrBetter:0, par:0, bogey:0, double:0, worse:0};
  rd.forEach(h => { const d = h.strokes - h.par;
    if (d <= -1) c.birdieOrBetter++; else if (d===0) c.par++; else if (d===1) c.bogey++;
    else if (d===2) c.double++; else c.worse++; });
  return {name: p.name, skill: p.botSkill, total: total, toPar: total - 72, counts: c};
}))
```
To run another round: `location.reload()`, re-init, repeat. (Baseline measured
2026-08-31 on this exact procedure: Moe 79, Mendi 60, Fallon 61, Bill 70 —
that is the broken state you are fixing.)

**Scripted human swing** (for report/feel checks, on the Holo Range —
Clubhouse → Practice Facilities → The Holo Range):
```js
const kd = c => window.dispatchEvent(new KeyboardEvent('keydown', {code:c, bubbles:true}));
const ku = c => window.dispatchEvent(new KeyboardEvent('keyup', {code:c, bubbles:true}));
kd('ArrowDown');
setTimeout(() => kd('Space'), 1000);
setTimeout(() => ku('ArrowDown'), 3850);          // ~95% power
setTimeout(() => kd('Space'), 4850);
setTimeout(() => kd('ArrowDown'), 7250);          // strike near drop bottom
await new Promise(r => setTimeout(r, 30000));
JSON.stringify({report: lastShotReport.slice(0, 400)})
```

---

## Phase 1 — Make quick-sim actually quick (target: <90s per 18-hole round)

Measured tonight: ~45s/hole in Simulate mode (~14 min/round) despite v4.86's
intent of near-instant. The per-shot physics collapse works; the residue is in
turn/hole transitions. Find every timeout on the Simulate path that is NOT
collapsed when quick-sim is active — grep anchors: `isQuickSim` (all files),
`advanceTurn` delays and `baseDelay` in main_ag.js, `loadHole` transition
timeouts, `delayAnnounceMs` from `playScoringAudioSequence` (physics_core.js),
the idle reminder interval, and the bot-thinking ticker. Collapse each to ≤5ms
when `window.isQuickSim` is true (or when `pacingModes[pacingModeIndex] ===
'Simulate'` — match the existing convention at each site). Do not change any
non-sim path.

**Acceptance:** a 4-bot 18-hole Simulate round on Holodeck Links completes in
under 90 seconds wall-clock; all 4 players have 18 `roundData` entries; zero
console errors. Record the measured time in the changelog entry. Commit.

## Phase 2 — Fix the bot scoring ladder (the load-bearing fix)

Evidence (EVALUATION.md item 1): skill-2 "amateurs" Mendi and Fallon shot 60
and 61 (−12/−11) with 25 birdies between them and 2 bogeys; zero-bias skill-1
Bill shot 70. Cause hypothesis: the v6.12 sniper clamps (±5ms in their
specialty zones) override the skill-tier forced-miss floors (v5.1.8: skill 1
must miss ≥40ms, skill 2 ≥25ms), and bot putting may be near-automatic.

**Locked target bands** (18 holes, par 72, calm, defaults — do not renegotiate):
- Skill 1: total +8 to +16 (80–88)
- Skill 2: total +2 to +8 (74–80)
- Skill 3: total −2 to +4 (70–76)
- Bill the Legend: mid-Skill-1 band (+10 to +14) on holes 1–13 play; his God
  Mode (holes 14–18) stays exactly as designed.
- Mendi/Fallon keep their sniper IDENTITY — the Oracle targeting biases that
  make them attack with wedges/long irons stay — but their EXECUTION obeys the
  skill-2 floor. Personality lives in club selection and aggression, not in
  superhuman timing.

Work:
1. In `calculateShot` (physics_core.js), find the execution-variance order:
   the v5.1.8 skill floors/ceilings, the v6.12 sniper clamp block, and any
   other personality execution overrides. Restructure so tier floors are
   applied LAST — final `impactDiff`/`hingeDiff` can never be tighter than the
   tier floor, whatever personality did first. (Leave God Mode's explicit
   perfection override outside this rule — it is a scripted story beat.)
2. Instrument bot putting: from a sim round's telemetry (`p.roundData[i]` and
   `holeTelemetry` strings, or add a temporary counter), estimate putts per
   hole and three-putt frequency per bot. If skill 1–2 bots essentially never
   miss inside ~10 feet or never three-putt, add skill-scaled putting error
   (pace ±% and/or aim degrees — there is precedent: the v5.45.0 Tournament
   Greens ±8% bot pace scatter) until skill 1 shows roughly 2–4 three-putts a
   round and skill 3 occasionally misses a 5-footer. Remove any temporary
   instrumentation before committing.
3. Tune iteratively with the batch-sim procedure. A candidate tuning passes
   only when **three consecutive rounds** put every bot's total inside its
   band with no zero-bogey cards from skill 1–2. Expect several iterations —
   this is the night's core job; spend the time here.

**Acceptance:** three consecutive passing rounds; record all three scorecards
in the changelog entry (they are the proof). Commit.

## Phase 3 — Post-shot report polish (omit defaults, headline first)

Verbatim current output on a calm day: "Wind pushed it 0 yds nowhere, and
0 yds nowhere." Apply the v4.64 omit-defaults principle to the post-shot
narrative assembly in `calculateShot` (string building only — no physics):
- Suppress wind clauses entirely when both wind components round to 0; same
  for zero lateral-kick clauses.
- Reorder to headline first: result word (Flushed/etc.), total distance,
  finishing lie, distance to target — then the carry/roll/kick anatomy.
- KeyC and Shift+C keep the full detailed report unchanged.

**Acceptance:** scripted calm swing on the range → announcement contains no
zero-value clauses and opens with the headline; then set wind via Shift+W on
the range and confirm a wind clause correctly appears on a windy swing.
Commit.

## Phase 4 — Physics honesty (uneven lies + green roll-out)

### 4a. Uneven lies from where the ball actually is

Today `lieTilt` is set only by cycling the Z-key target onto a landing zone
that declares `tilt` (input_ag.js ~1503), and targeting the pin resets it —
the ball's real position never creates an uneven lie. Fix:
- Add optional per-hole fairway tilt data to the course schema. Keep it
  simple: `tiltZones: [{startY, endY, minX, maxX, tilt}]` per hole (positive
  tilt = ball above feet = hook bias, matching the existing physics comment
  in main_ag.js line ~55).
- On shot resolution (end of `resolveHazardLie` or where the settled position
  is final), derive `lieTilt` from the ball's resting coordinates against the
  hole's tiltZones (0 when none match or none declared).
- Remove the Z-target-driven `lieTilt` assignments (the vestige).
- Announce it as part of the lie wherever `currentLie` is reported after a
  shot and in Tab/quick status: e.g. "Fairway, ball below your feet."
- Make `getSetupReport`, `getCaddyAdvice`, and `getOracleBlueprint` aware
  (the ±80 RPM/degree side-spin the physics already applies — keep magnitudes
  as-is).
- Populate honestly on a handful of holes only: Pebble hole 9 (the
  ocean-sloped fairway its own description references), one or two Pasture
  holes where the lore supports it (e.g. the dogleg corners). Leave other
  holes untouched — flat is a valid design choice.

### 4b. Green roll-out through contours (Brian's own .temp.MD doubt)

Replace the v4.81 single-zone sample (physics_core.js ~985: "Dynamic 3D Green
Topography Engine") with a stepped roll: when the carry lands on the green,
walk the roll-out in 1-yard steps through `greenDictionary` zones the way the
putting gravity engine does (reuse its pattern — the `while` loop over
`activeContours` with `slopeX`/`slopeY` per step). Deliverables:
- A ball landing on the front tier of a multi-tier green feels each tier it
  crosses.
- Backboard behavior (steep upslope) is capped — never more than ~30% of the
  computed roll distance as backward movement — and narrated ("caught the
  slope and spun back").
- The Pin Finder / landing-zone Oracle predictions (`getLandingZoneEffect`)
  stay consistent with actual behavior.

### 4c. Re-verify balance

Physics changes shift scoring. Re-run the Phase 2 acceptance (3 rounds, bands
hold); re-tune lightly if drifted, and say so in the changelog.

**Acceptance:** demonstrate one approach landing front-tier on a two-tier
green (e.g. Turtleback or The Pig Tiers) with logged step coordinates showing
both zones acted; bands still hold; zero console errors. Commit (4a and 4b
may be separate commits).

## Phase 5 — Caddy Academy (9-hole guided teaching course)

Per Brian: "set up this caddy guided practice round as another course so I can
practice, but eventually it will be removed and put elsewhere as part of the
new game process." Design for easy removal: ALL Academy logic lives in
`courses/course_academy.js` plus ONE clearly-marked interceptor block in
input_ag.js — removal must be two deletions plus a script tag. Comment this
intent at both sites.

- New course "Caddy Academy" in `courses/course_academy.js`, registered like
  every course (`window.courses.push`) + script tag with cache-buster in
  index.html (load order: with the other courses). Menu description marks it
  as the guided introduction for new players.
- 9 short, forgiving holes: wide fairways, generous greens, flat or gentle
  contours, calm wind (use the existing per-hole wind override mechanism the
  way Pasture 18 locks wind — a windOverride/generateWind guard keyed to the
  course; hole 4, the wind lesson, sets a fixed moderate crosswind instead).
- One system per hole, taught through the existing hole-description broadcast
  (`loadHole` reads `description`) plus a new `academyKeys` field per hole
  listing the keys unlocked from that hole on:
  1. The swing — ArrowDown press/release/press (par 3, huge green)
  2. Hinge and tempo — Space taps
  3. Clubs — PageUp/PageDown, X
  4. Wind — W (fixed crosswind this hole)
  5. Stance and ball position — Home/End, Shift+Left/Right
  6. Shot styles — S (a short par 4 asking for a pitch)
  7. Targeting — Z, Shift+Z (a layup hole with zones)
  8. Hazards — H (one big friendly bunker)
  9. Putting — B, the cursor, tempo (a contoured green)
- Key deflection, Academy only: at the top of the game-key section of the
  keydown interceptor (AFTER help/scorecard/clubhouse/save-flow blocks, so
  system keys always work), if the active course is Caddy Academy and
  `e.code` is a game key not yet unlocked (union of `academyKeys` through the
  current hole), announce "The caddy will cover that on a later hole." and
  return. Never deflect: arrows during a swing, Escape, ?, F12, Q, Tab,
  Shift+E, or anything on other courses.
- Each hole's `description` is the lesson script in the caddy's plain, warm
  voice — concrete key names, one skill at a time, and a "try it now" prompt.
  KeyD re-reads it (already standard).

**Acceptance:** browser-pane walkthrough: on hole 1, S/Z/H deflect with the
message while ArrowDown works; by hole 6, S works; lessons announce on every
hole load; complete all 9 holes (use dev shortcuts or gimmes where legal) to
post_round with no console errors; load The Pasture afterward and confirm no
deflection leaks outside the Academy. Commit.

## Phase 6 — Small features (cut from the bottom if time runs short)

Each is its own commit with its own changelog entry, in this order:

1. **Brisk mode (opt-in)**: Clubhouse settings toggle + in-round key (pick an
   unused binding; check the key map first; update both help sources).
   Effects: roll/bounce theatre durations ~50%, and the post-shot announce
   uses the Phase 3 headline sentence only (full anatomy stays on KeyC).
   Default behavior untouched. (Per-club tempo is explicitly OUT — Brian
   deferred it.)
2. **Coarse aim**: Ctrl+ArrowLeft/Right = 5° per press (plain arrows stay
   1°). Both help sources. Works in State 0 and while Hazard menu is open
   (the H menu already re-computes on aim change).
3. **Locked-conditions practice**: range-only toggle (unused key) freezing
   wind drift, lie, and target between shots for grooving; announce state
   clearly; `loadHole`/quit clears the lock.
4. **Session timing trends**: extend the Shift+Semicolon quick check with
   session aggregates from existing telemetry: swing count, mean signed
   impact error, mean signed hinge error, and a simple first-half vs
   second-half trend sentence. Session = since page load; no persistence.
5. **Ball identities**: give the six balls mild real physics in `ballTypes`
   (main_ag.js ~612) applied in `calculateShot`: e.g. Title-ish neutral;
   Rock-Flite +10% roll/−15% spin; Semi-Pro V1 +3% carry/+10% dispersion;
   Marshmallow X −3% carry/+15% forgiveness windows; Velcro Tour +15%
   spin/−10% roll; Water Magnet random ±4% carry per shot. Update the
   Shift+Y cycle announce to state the identity. Guardrail: bots keep
   current ball assignments — run one sim round after; bands must still
   hold (default-ball bots should be barely affected).

## Phase 7 — Wrap up (ALWAYS runs, even if you stopped early)

1. Overwrite `MORNING_REPORT.md`: what shipped and what was cut (and why);
   the final three sim scorecards vs. the bands; the exact ear-test script
   for Brian (serve command, which course, which keys to press, what he
   should hear — plain prose, keyboard/NVDA terms only); new ISSUES.md
   entries; and the merge instruction: `git checkout main && git merge
   overnight-v6.25`, `node tools/check.js`, then push (which deploys).
   State explicitly that main was never touched tonight.
2. Update ISSUES.md (anything discovered, anything deferred).
3. Final `node tools/check.js`, final commit, final branch push. Stop.
