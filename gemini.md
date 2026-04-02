### 3. Keybindings & Interactions
- **ArrowDown:** Press to start Backswing. Release to lock `finalPower` and start Downswing. Press again at the bottom of the drop to strike.
- **Spacebar:** Tap during backswing to set `hingeTimeBack`. Tap during downswing to set `hingeTimeDown`. (Emits 880Hz sine tick).

### 4. Audio Texture Rules (Strict)
Do not alter these frequencies or wave types.
- **Hinge Pings:** 600Hz `triangle` (0.15s).
- **Power Curve:** 300Hz to 1050Hz `sine`.
- **Milestones:** 25% (220Hz `square`), 50% (440Hz `triangle`), 75% (660Hz `triangle` double-pulse), 100% (1200Hz `sine`).
- **120% Cap/Over-torque:** 150Hz `sawtooth`.
- **Impact Drop:** Descending `sine` from `100 + (finalPower * 8)Hz` to 100Hz.

### 5. Physics & Math Core
- **The Smash Factor:** Impact accuracy acts as a multiplier. An 80% impact accuracy means the ball only gets 80% of potential distance.
- **Accuracy Buffer:** +/- 60ms is the "Sweet Spot" (96-100% accuracy). Scales down to ~20% accuracy at 400ms off.
- **Hinge Penalty (Fat/Thin):** Evaluated on a quadratic curve. Small misses are forgiven; >120ms misses slash distance severely.
- **Pressure:** Swinging over 105% power shrinks the 60ms accuracy buffer and multiplies lateral dispersion (wider hooks/slices).
# ACCESSIBLE GOLF ENGINE: MASTER WATCHDOG DIRECTIVE

## SYSTEM INSTRUCTION FOR AI AGENTS:
You are the Systems Architect and Lead Developer for the "Accessible Golf Engine," a web-based, audio-first sports simulation designed strictly for screen reader users and keyboard-only players.

### 1. The Prime Directive: Zero Standard Inputs & Visual Reliance
- **No Text Fields**: NEVER use standard `<input>`, `<select>`, or traditional form fields.
- **The Focus Trap**: The application lives inside `<div id="game-container" tabindex="0" role="application">`.
- **Audio Output**: Every action must result in a definitive auditory response via Web Audio API or `aria-live="assertive"` via `window.announce("...")`.

### 2. State Management (The 5-Part Sequence)
Do not read the DOM to determine state.
`let swingState = 0; // 0: Idle, 1: Back Hinge, 2: Back Power, 3: Down Hinge, 4: Impact Drop, 5: Flight Phase`

### 3. Keybindings & Interactions
- **ArrowDown:** Press to start Backswing. Release to lock power and start Downswing. Press again at the bottom of the drop to strike.
- **Spacebar:** Tap during backswing/downswing to set hinge timing. (Emits 880Hz sine tick).
- **PageUp / PageDown:** Cycle through the 11-club array (State 0 only).
- **KeyC:** Triggers the Caddy Report, repeating the last shot's narrative and metrics (State 0 only).

### 4. Audio Texture Rules (Strict)
Do not alter these frequencies or wave types. Base gain is boosted by ~1.4x-1.45x but clamped at 1.0.
- **Hinge Pings:** 600Hz `triangle` (0.15s).
- **Power Curve:** 300Hz to 1050Hz `sine`.
- **Milestones:** 25% (220Hz `square`), 50% (440Hz `triangle`), 75% (660Hz `triangle` double-pulse), 100% (1200Hz `sine`), 120% Cap (150Hz `sawtooth`).
- **Impact Drop:** Descending `sine` from `100 + (finalPower * 8)Hz` to 100Hz.
- **Flight Sequencer:** Strike (`triangle`) -> Flight Wind (`white noise`) -> Landing/Bounces (`sine`) -> Roll (`brown noise`).

### 5. Physics & Math Core
- **The Smash Factor:** Impact accuracy acts as a multiplier on distance.
- **Accuracy Buffer:** +/- 60ms is the "Sweet Spot". Scales down linearly outside this window.
- **Hinge Penalty (Fat/Thin):** Quadratic curve. >120ms misses slash distance severely.
    - Early downswing hinge = Thin (Lower loft, massive roll multiplier). 
    - Late downswing hinge = Fat (High pop-up loft, dead roll).
- **Pressure:** Swinging over 105% power shrinks the 60ms accuracy buffer and multiplies lateral dispersion.
- **Dynamic Bouncing:** Landing audio scales with `rollDistance`. High-loft clubs produce a single thud; low-loft clubs produce multiple cascading, skipping bounces.
### 6. Engine Addendums (v2.4 - v2.7)
- **Trajectory-Aware Bounces (v2.4):** Landing audio differentiates between low-trajectory skips and high-trajectory thuds using a `loftPenalty`.
- **Dynamic Bounce Gaps (v2.5):** `bounceGapMs` scales with `rollDistance` to prevent clustering. Eased timing decay (0.85) and volume decay (0.8) create a realistic settling rhythm.
- **Polyphonic Audio Overlap (v2.6):** Flight wind (`playNoise`) extends 0.3s beyond hang time with an exponential fade, overlapping smoothly with the first bounces to prevent audio cut-offs.
- **Explicit Spin Mechanics (v2.7):** - `backspinRPM` is calculated from base loft, final power, impact accuracy, and `hingeDiff`.
  - `sideSpinRPM` is driven by `impactDiff` (Impact Offset).
  - **Spin-to-Roll Linkage:** Roll distance is dynamically adjusted by `(backspinRPM - 5200) / 550`. High backspin creates negative roll.
  - **Dispersion:** Lateral movement (`lateralX`) is driven by `sideSpinRPM`.
  - **Caddy Report:** Includes Backspin RPM, Side Spin RPM, and shot shape.
### 10. v2.8 Engine Addendum (Wind Dynamics)
- **Wind Generation:** `windX` (crosswind) and `windY` (head/tailwind) are randomized between -15 and 15 mph after every shot via `generateWind()`.
- **Wind Physics:** Wind effect is heavily multiplied by `hangTimeSecs`. 
    - `carryDistance` is adjusted by `(windY * (hangTimeSecs / 1.5))`.
    - `lateralX` (dispersion) is adjusted by `(windX * (hangTimeSecs / 1.2))`.
- **KeyW (Weather Report):** Triggers `window.announce` to read the current wind conditions (Only allowed in `swingState === 0`).
### 12. v2.10 Engine Addendum (Stance Mechanics)
- **Stance State:** `stanceIndex` tracks ball placement (0: Far Forward, 1: Forward, 2: Neutral, 3: Back, 4: Far Back). Resets to 2 (Neutral) after every shot.
- **Keybindings (State 0 Only):** `Home` moves ball forward (decreases index), `End` moves ball back (increases index).
- **Trajectory Physics:** - `dynamicLoft` is modified by `(2 - stanceIndex) * 5` (+10 loft for Far Forward, -10 for Far Back).
    - `backspinRPM` is modified by `(stanceIndex - 2) * 500` (-1000 RPM for Far Forward, +1000 RPM for Far Back).
- **Caddy Report:** Announces stance adjustments pre-shot and includes the stance used in the final shot narrative.
  ### 15. v2.13 Engine Addendum (Course Progression & Game Loop)
- **Game State Variables:** Tracks `hole`, `par`, `distanceToPin`, `strokes`, and `isHoleComplete`.
- **Progression Logic:** `distanceToPin` is updated using absolute math (`Math.abs(distanceToPin - totalDistance)`) after every shot. `strokes` increments per swing.
- **Victory Condition:** If `distanceToPin <= 20`, `isHoleComplete` becomes true. A victory arpeggio plays, the Caddy announces the total strokes, and keyboard inputs are locked to prevent further swinging.
- **Narrative Updates:** Caddy broadcasts now continuously report the current stroke and remaining distance to the pin.
### 17. v2.15 Engine Addendum (Short Game & Chipping Green)
- **Swing Types:** `swingTypeIndex` tracks Full (0), Pitch (1), Chip (2), Flop (3). Modifies distance, loft, spin, and roll multipliers.
- **The Skull Penalty:** A thin Flop shot (`hingeDiff < -50`) overrides normal flop physics, resulting in a low, high-speed line drive.
- **Chipping Green Mode:** `gameMode = 'chipping'`. The engine evaluates shot proximity, then immediately generates a new random `distanceToPin`.
- **Keybindings (State 0 Only):**
  - `KeyT`: Cycles Swing Type.
  - `KeyG`: Prompts travel to Chipping Green.
  - `Shift + KeyG`: Toggles Chipping Green targets between 'short' (5-20) and 'long' (20-80).
### 18. v2.21 - v2.23 Engine Addendum (2D Geometry & Refinement)
- **Auto-Face Pin Navigation (v2.21.3):** The engine uses `Math.atan2(pinX - ballX, pinY - ballY)` to dynamically calculate the target line. `aimAngle = 0` always points directly at the hole.
- **The Rough Lie (v2.22):** - **Timing Penalty:** Rough reduces `forgiveness` windows by 30% (`lieForgivenessMod = 0.7`).
    - **Distance Randomization:** Distance is randomized between 60% and 90% of club potential (`lieMod = 0.6 + Math.random() * 0.3`).
- **Hole Navigation (v2.23):** Using `Digit` keys (1-9) warps to a new hole and resets the active club to the Driver and shot style to "Full."

### 19. v2.25 Engine Addendum (Holodeck Driving Range)
- **Holodeck Range Mode:** `gameMode = 'range'`.
- **Auto-Spawning Targets:** The target flag (`pinY`) automatically snaps to match the active club's `baseDistance` whenever the club is changed.
- **Virtual Lie Toggle (KeyL):** Cycles the ground beneath the player between "Fairway" and "Rough" (Range only).
- **Infinite Loop:** After every shot, `ballX` and `ballY` reset to `(0, 0)`, aim and stance reset, but wind continues to drift.
- **Telemetry Export (Shift + KeyC):** Copies the full `lastShotReport` (including hidden math) to the system clipboard for debugging.

### 20. v2.26 Engine Addendum (Continuous Physics & Spatial Feedback)
- **Continuous Physics Model (v2.26.1):** Replaced hardcoded accuracy "tiers" with smooth linear interpolation.
- **Spin-Based Distance Dampening:** Forward distance is now dampened based on the magnitude of `sideSpinRPM`. 
    - **Scaling:** ~2000 RPM (approx. 200ms error) results in a ~10% distance penalty.
    - **Distance Floor:** Even maximum "shanks" retain at least 25% of the club's potential yardage.
- **Lateral Weighting:** Lateral movement weight increased (`sideSpinRPM / 2400`) to ensure high-spin shots "leak" and "slice" significantly offline.
- **Relative Proximity (v2.26.2):** Range reporting includes directional context relative to the initial target line (e.g., "Finished 15 yards from target, Short-Right").
### 21. v3.41 Engine Addendum (Green Precision & Edge Finder)
- **High-Precision Proximity:** Any shot landing or finishing within 30 yards of the pin triggers the `window.formatProximity` helper, which converts yardages into precise feet and inches.
- **Landing Spot Intelligence:** The engine calculates exact landing coordinates (`landX`, `landY`) relative to the pin before calculating the roll, producing a three-part narrative: "Landed X, Rolled Y, Finished Z."
- **Edge Finder Math:** Pressing `KeyH` (Hazard List) calculates the exact angles (in degrees) required to aim left or right to completely bypass a hazard's bounding box or a tree's radius.

### 22. v3.42 Engine Addendum (Dynamic Roll Physics)
- **Loft-Based Distance Scaling:** Ball placement physically alters launch energy. Lower loft (Back stance) increases forward velocity (`loftDistMod`), while higher loft (Forward stance) reduces total distance in favor of vertical apex.
- **Spin-Dependent Roll:** The `rollDistance` is no longer a flat percentage. It calculates friction via `spinRollMod`—high backspin (from wedges or a Back stance) forces the ball to "check up" quickly, while low spin allows for natural release and run-out.

### 23. v3.43 - v3.44 Engine Addendum (Tactical Hazards & Terrain Friction)
- **Tactical Hybrid Reporting (KeyH):** The Hazard menu combines "Edge Finder" bypass angles with "Aim Line" raycasting, telling the player exactly how many yards to reach and clear an obstacle on their *current* heading. Dynamically updates if the player rotates (Arrow Left/Right) while the menu is open.
- **Continuous Collision (v3.44.1):** Uses AABB (Axis-Aligned Bounding Box) logic to evaluate the entire roll path. If a rolling ball intersects a bunker or water boundary at any point, the roll is immediately intercepted and terminated inside the hazard. 
- **Sand Silencer:** Balls rolling into sand (`currentLie === "Sand"`) no longer trigger the "Fairway Roll" grass audio loop.

### 24. v3.45 - v3.46 Engine Addendum (Caddy Skill System & Course Navigation)
- **Caddy Skill Level:** `caddyLevel` tracks the Caddy's intelligence (1: Rookie, 2: Veteran, 3: Tour Pro). Toggled via `Shift + KeyA`.
- **The Yardage Book (KeyA):** The engine uses semantic trigger zones (Tee, Approach, Greenside, Trouble_Left, Trouble_Right) to pull context-aware strategic advice from a flat-table database based on the current `caddyLevel`.
- **Fairway Descriptions (KeyF):** Reads a custom `fairwayDescription` from the hole data, allowing blind players to understand the spatial layout and "dead space" between target zones.
- **Automatic Green Broadcast:** When a ball finishes on the green, the detailed feet-and-inches proximity report is automatically appended to the ARIA broadcast, eliminating the need to manually query the Caddy.
### 25. v3.50 - v3.51 Engine Addendum (Advanced Caddy Brain)
- **Granular Semantic Triggers:** The `window.getCaddyAdvice` function now prioritizes specific lie and distance combinations over general zones. It tracks advanced states like `Bunker_Fairway`, `Rough_Deep`, `Approach_Scoring` (inside 120 yards), and `Approach_Long`.
- **Flat-Table Database:** The Caddy pulls from a master array of contingencies per hole, allowing for highly specific, localized strategic advice depending on the player's exact geometric location, lie, and active `caddyLevel`.

### 26. v3.60 Engine Addendum (Canvas Swing Meter)
- **60fps Rhythm Bar:** A `<canvas>` element renders a visual representation of the audio physics. It uses `requestAnimationFrame` synced exactly to `performance.now()` to guarantee visual frame-parity with the Web Audio API scheduling.
- **Visual Metronome & Hinges:** The 600Hz triangle pings are drawn as static hash marks. Tapping the Spacebar during the swing draws permanent yellow (backswing) and orange (downswing) markers on the bar to visually map the `hingeDiff`.
- **Freeze Frame:** `lockedImpactTime` permanently freezes the visual impact cursor the exact millisecond the player strikes the ball in State 4.

### 27. v3.61 - v3.62 Engine Addendum (The Spectator HUD)
- **The Marquee:** `window.announce` overrides default behavior to simultaneously push ARIA text to a retro, CSS-animated scrolling marquee at the top of the screen.
- **The Caddy Panel:** The massive `lastShotReport` (including carry, roll, proximity, and hidden telemetry) is routed to a persistent, stylized DOM element upon hole/shot completion, separating it from the core swing prompts.
- **Real-Time Telemetry Dashboard:** A 4-column visual grid permanently displays Target Info, Environment (Wind/Lie), Equipment (Club/Style), and Setup (Aim/Stance). 
- **Input Binding:** `window.updateDashboard()` is wired into every State 0 keydown listener (`PageUp`, `ArrowLeft`, `Home`, `W`, etc.) and the `driftWind()` loop to provide instant, real-time visual feedback to sighted spectators as the player makes adjustments.
### 28. v3.70 - v4.65 Engine Addendum (The Launch Monitor & Physics Parity)
- **The Parabolic Arc:** Tree/Obstacle clearance uses true parabolic projectile motion `(tan(loft) / carry) * dist * (carry - dist)`. The engine correctly alters distance based on Stance Index. `loftDistMod` adds carry for Back stances (delofted, penetrating flight) and reduces carry for Forward stances (high loft, pop-up) by +/- 3% per tick.
- **Base Club Scaling (v4.65.0):** Club `baseDistances` are scaled down (Driver = 230y) to balance against stacking multipliers (110% Power, +10% Power Focus, +6% Stance), keeping maximum human drives around 330 yards.
- **The Predictive Caddy (Level 3):** The `getCaddyAdvice` function runs a "Ghost Simulation." It calculates `loftDistMod`, subtracts spin-induced roll, evaluates wind drift, and applies Stance Alignment side-spin to predict if a shot will clear or curve into an obstacle mid-flight.
- **Flight Path Narratives:** The engine interpolates the ball's mid-air coordinates `(projectedX, projectedY, ballHeightFeet)` exactly as it crosses an obstacle's distance, generating highly specific narratives (e.g., "shaved the left edge by 3 yards").

### 29. v4.0 - v4.3 Engine Addendum (The Short Game & Contour Zones)
- **Putting State:** Landing on the green triggers `isPutting = true`. Controls shift entirely to 2D targeting. The player always swings to the 100% audio mark; power is modulated by moving the `puttTargetDist` past or short of the hole using `-` and `=`.
- **The Braille Green:** `KeyP` toggles "Explore Mode." Arrow keys navigate a 1-yard grid. The engine plays a centered tone, where Pitch = Elevation.
- **Contour Zones:** Greens are not flat planes. `data_ag.js` defines `greenContours` as an array of distance brackets (e.g., `startY`, `endY`, `slopeX`, `slopeY`). 
- **The God Caddy (Putting):** To prevent cognitive overload on complex multi-tier greens, the Level 3 Caddy translates the Contour Zones into a plain-text narrative (e.g., "The first 10 yards break left, then it feeds downhill and right").
- **Touch/Tempo Mechanic:** Hinge timing is replaced by "Tempo" taps during the putt. Perfect tempo widens the "Capture Speed Limit" of the cup, allowing players to "jam it in" on short putts and blast through minor breaks.
### 30. v4.4 - v4.7 Engine Addendum (Putting Physics & The God Caddy)
- **Gravity Engine (Step Simulation):** Putts are simulated in 1-yard steps. At each step, `speedRemaining` is evaluated against `activeContours` (slopeX/slopeY). The ball's `currentHeading` is actively modified by the slopes.
- **Capture Mechanics:** The hole has a `captureRadius` and `captureSpeedLimit`. If the ball crosses the radius but exceeds the speed limit, it lips out. Perfect tempo (`hingeDiff < 50ms`) increases the speed limit, allowing "jammed" putts.
- **The God Mode Caddy:** Runs a 360-degree radial simulation, testing distances and aim angles through the slope matrix to find the exact yardage and degree to sink the putt.

### 31. v4.8 - v4.11 Engine Addendum (Progression, Autosave & Grid Scorecard)
- **State Persistence:** `localStorage` captures all game variables (including `roundData`, `windX`, and `holeTelemetry`).
- **Continuous Loop:** Sinking a putt sets `isHoleComplete = true`. Pressing `Enter` triggers `loadHole(hole + 1)`, resetting states (e.g., `isPutting = false`, `stanceIndex = 2`) without a page refresh.
- **Custom Grid Scorecard:** `Shift + E` opens the scorecard. To avoid focus-loss in screen readers, it uses an invisible 2D JavaScript array (`scorecardGrid`). Arrow keys strictly intercept and announce `(Row Header, Column Header: Value)`. Sighted spectators see a CSS-highlighted HTML table synced to the ARIA coordinates.

### 32. v4.12 - v4.13 Engine Addendum (The Clubhouse & Context-Sensitive Quit)
- **The Clubhouse Menu:** `gameMode = 'clubhouse'`. Acts as a safe state container. Arrow keys navigate an array of options (Resume Session, New Round, Practice Facilities).
- **Context-Sensitive Quit (KeyQ):** If pressed in practice, it instantly returns to the Clubhouse. If pressed mid-round, it intercepts and forces a `KeyS` (Save) or `KeyA` (Abandon) safety check to prevent data loss.

### 33. v4.14 Engine Addendum (Two-Tier Targeting & Oracle Caddy)
- **Fairway Zones (KeyZ):** Cycles through pre-defined strategic `landingZones` on the fairway.
- **Green Micro-Grid (Shift + T):** Activates a 20x20 yard navigable grid. Arrow keys move a targeting square, allowing players to aim for specific slopes or safe zones away from the pin.
- **Oracle Caddy v2:** Level 3 Fairway Caddy. Runs a brute-force physics simulation across 70 permutations (14 clubs * 5 stances) against the `activeTargetType`. Calculates `totalDistance` and exact wind drift to provide a flawless shot blueprint (e.g., "Equip 5 Iron, Back Stance, Aim 3° Right").
### 34. v4.18 Engine Addendum (Audio Priming & Unified Targeting)
- **Audio Priming:** Introduced `window.playEcho` (Sound 37) to "wake up" the browser's audio context during `loadHole` and Clubhouse boot sequences, preventing stuttering on the first shot.
- **Unified Targeting Bindings:** The Green Micro-Grid was remapped from `Shift + T` to `Shift + Z`, unifying all targeting mechanisms (Macro Zones and Micro Grids) under the `Z` key.

### 35. v4.19 Engine Addendum (Stability & Style Streamlining)
- **Engine Restoration (v4.19.0):** Reverted core swing impact logic to direct function calls instead of relying on event-loop timeouts, permanently eliminating the browser-desync "whiff" bug.
- **Advanced Style Cycle:** `KeyS` (Forward) and `Shift + S` (Backward) cycle through styles. The engine now automatically resets to "Normal" after every shot and dynamically reads out the expected 100% distance based on the active club, lie, and stance while cycling.
- **Atomic State Integrity (Ghost Timer Safety):** - Implemented recursive tracking for every single `setTimeout` call (bounces, rolls, caddy reports, transitions) into the `stateTimeouts` array.
    - `loadHole` acts as an atomic "kill switch," immediately clearing all pending timers to prevent state-bleeding between holes.
- **Watchdog Failsafe:** `SHOT_RECOVERY_TIMEOUT_MS` (20s) acts as a heartbeat monitor. If a shot calculation or caddy report stalls, it forces a state reset to `swingState = 0` to prevent the UI from freezing.

### 36. v4.20 Engine Addendum (Fairway Navigation & Auto-Equip)
- **Intelligent Z-Cycle:** Standardized the `Z` key to cycle in a continuous loop: [The Pin] -> [Fairway Zones] -> [Green Zones] -> [The Pin].
- **Target-Locked Auto-Equip:** Cycling targets via `Z` or locking a grid via `Shift + Z` automatically triggers a physics evaluation to instantly hand the player the most mathematically appropriate club for the newly selected distance.
- **Fairway Target Density:** Established the standard of placing invisible landing zones every 80-120 yards along the center `x: 0` line to allow for tactical layup progression.

### 37. v4.21 Engine Addendum (Canopy Physics & Situational Awareness)
- **Quick Status (Tab Key):** A zero-state hotkey that instantly announces the current Hole, Stroke, Distance to Pin, and Lie without triggering the full telemetry Caddy Report.
- **Relative Target Warning:** The `Z` key mathematically compares the `targetY` to the `ballY`. If a landing zone is behind the player, it appends "(Behind you)" to the announcement to prevent accidental backwards shots.
- **Under the Canopy Escape Math:** The Edge Finder (`KeyH`) detects if the player's ball is within 1.2x of a tree's radius. If true, it announces "Under the canopy" and calculates escape angles based on a narrow 1.5-yard trunk rather than the full branch width, allowing for realistic 5-15 degree punch-outs.
- **Tree Deflection Physics:** Replaced the static "vertical drop" penalty. Hitting a tree now retains 15% of the ball's velocity and calculates a randomized 60-degree deflection vector, allowing the ball to bounce realistically away from the trunk.
### 38. v4.23 - v4.24 Engine Addendum (Tactical Realignment & Scorecard Overhaul)
- **Scorecard Arrays:** The Grid Scorecard tracks 8 columns including Terminology (Birdie/Bogey), Drive Distance on Par 4s/5s, and successful Putt Distance.
- **Fractional Analytics:** The totals row calculates FIR and GIR as true fractions (e.g., "5 of 9") instead of binary lists.
- **Oracle Inversion:** The God Caddy putting math properly inverts slope logic, instructing players to aim *against* the break rather than with it.
### 39. v4.25 Engine Addendum (Green Reading & Accessibility)
- **Keyboard Explore Mode (F12):** Toggles `isExploreMode`. Intercepts all keydown events to announce `window.getKeyDescription()` instead of executing standard game logic.
- **Green Reading (Key B):** Translates underlying `slopeX` and `slopeY` values into literal inches for break and elevation to provide intuitive green-reading for screen reader users.
- **Brute-Force Putting Oracle:** The God Caddy (Level 3) simulates a 360-degree spread of exact physics steps through the `activeContours` to find the precise `bestAim` and `bestPace` to hit the bottom of the cup, replacing generic multiplication estimates.
### 40. v4.30 Engine Addendum (Narrative & Journaling)
- **Hole Journaling:** The engine translates raw physics telemetry into natural language upon sinking a putt, storing a broadcast-style summary in `roundData[i].narrative`. 
- **Top 2 Tagging Logic:** Highlights are parsed into a `{ drives: [], approaches: [], putts: [] }` global object. `drives` and `putts` are dynamically sorted in descending order by distance, while `approaches` are sorted in ascending order by proximity. The array is continually `pop()`'d to maintain exactly two premium shots per category.
- **Post-Round State:** Completing the final hole of the active course transitions `gameMode` to `'post_round'`, unlocking the `Shift + N` Share Sheet API.
### 41. v4.31 - v4.34 Engine Addendum (Acoustics & Ball Tech)
- **3D Audio Flight Injection:** The engine utilizes a dynamic loop (`trigger3DFlight`) to simulate the ball traveling through the air. Pitch represents apex/loft (higher frequency = higher arc), and stereo panning tracks lateral dispersion, allowing players to hear the ball slice or hook in real-time.
- **Knock-Off Ball Brands (Shift + Y):** Players can equip different ball types (e.g., "Title-ish", "Rock-Flite"). Each ball overrides the flight and landing `oscillator.type` and frequency, giving them unique acoustic textures (e.g., a "soft" ball lands with a low sine wave, a "hard" ball lands with a high square wave).
- **Theatrical Green Roll:** Physics roll duration is decoupled from distance on green landings (`physics_ag.js`). It artificially stretches to 3.0 - 6.0 seconds to build tension before settling.
- **Proximity Asset Rewards:** The engine triggers external MP3 assets based on approach proximity thresholds (`< 7 yds`, `< 12 yds`, etc.) while dynamically delaying the Caddy TTS using `onloadedmetadata` to prevent audio overlap.

### 42. v4.35 - v4.36 Engine Addendum (Short Game & Touch Magnetism)
- **Scalable Grid Targeting:** Any time a target is `<= 5.0 yards` from the pin (whether on the green or chipping from off it), the cursor increments scale down from 1 yard to `1/3 yard` (1 foot), and all TTS readout values multiply by 3 to report in "feet" for surgical precision.
- **Extreme Break Dampening:** Putts struck with sufficient velocity cut through slope physics. The engine applies a `slopeDampener` of `0.10` (90% reduction) to both `sx` and `sy` for putts inside 3 yards, and `0.35` for putts inside 6 yards, keeping short putts on a realistic line.
- **Linear Touch Magnetism:** The engine utilizes a linear scaling algorithm attached to the `hingeDiff` (Spacebar timing). Nailing a perfect tempo (`< 50ms` variance) applies a 3.0x multiplier to the hole's physical capture radius for approach shots, and a 2.5x multiplier for putts. This bonus linearly bleeds down to 1.0x as the timing error approaches `150ms`.

### 43. v4.37 - v4.39 Engine Addendum (Oracles & Diagnostic Memory)
- **Terrain Probe & Landing Zone Oracle:** The Pin Finder (`Shift + Z`) dynamically probes absolute coordinates to announce surface terrain (e.g., "In the Rough"). If hovering over the Green, it cross-references the `greenDictionary` to provide predictive tactical feedback (e.g., "Landing here kicks left and feeds downhill").
- **Synchronized Putting Oracle:** The God Caddy's brute-force physics simulation is strictly synced to the live physics engine. It applies the `slopeDampener` and `tempoBonus` to its own loops, ensuring aim advice accurately accounts for the ball cutting through breaks on short putts. It outputs advice in feet.
- **Automatic Diagnostic Memory:** To facilitate playtesting, the engine silently runs the Green Reading algorithm and polls the God Caddy at the exact millisecond a putt is struck. 
- **Advanced Putting Telemetry:** The `Shift + C` clipboard export injects these captured reads into a `[Putting Diagnostics]` block alongside the exact Target Cursor location, Touch Magnetism multiplier, Slope Dampener percentage, and Effective Hole Radius (converted to inches).
### 44. v4.40 Engine Addendum (Perspective Audio & Oracle Polish)
- **Line-of-Sight Audio Panning:** The putting audio engine (`panValue`) calculates lateral deviation relative to the player's aim vector, ensuring breaking putts accurately pan left or right of the player's center view.
- **Oracle Arrogance Fix:** The Putting Oracle forces `tempoBonus = 1.0` during its simulations.

### 45. v4.41 Engine Addendum (Contextual Shot Focus & Natural Dispersion)
- **Shot Focus Modes (Key J):** Players can equip 6 Focus modes. The engine auto-equips modes based on context.
- **Risk/Reward Hinge Scaling:** The Spacebar Hinge determines the `focusEffect`. `<50ms` yields 100% of the bonus. `150-250ms+` flips the bonus into a severe penalty.
- **Natural Dispersion Circle:** Perfectly timed fairway shots inherently suffer a base scatter of +/- 1.5% distance and +/- 5% lateral drift based on the club's `maxDispersion`.

### 46. v4.42 Engine Addendum (Global Difficulty Scaling)
- **Difficulty Tiers (Key I):** Added 4 tiers (Casual, Amateur, Pro, Tour) that dynamically scale the engine's strictness.
- **The Reflex Buffer:** Lower difficulties safely absorb human auditory reaction times, allowing players to overswing up to 108% (Amateur) or 112% (Casual) without triggering pressure penalties.

### 47. v4.43 Engine Addendum (Dynamic Timing Diagnostics)
- **The Quick Check (Shift + Semicolon):** The engine maintains a secondary `lastTimingReport` variable isolated from the main Caddy broadcast.
- **Backspin Delta Math:** Calculates a "sterile baseline" backspin for every shot. The Diagnostic Report compares actual generated RPM against this baseline.

### 48. v4.44 - v4.46 Engine Addendum (Multiplayer & Asymmetric Profiles)
- **State Roster:** Converted global single-player sandbox into a `players` array. The engine tracks states independently for up to 4 players.
- **Automated Turn Manager:** `window.advanceTurn()` enforces standard golf etiquette. After every shot, the engine calculates absolute distance to the pin and automatically swaps to the "Away Player".
- **Asymmetric Profiles:** `difficultyIndex`, `caddyLevel`, `activeBallIndex`, `shotStyleIndex`, `isChokedDown`, and the `devPower`/`Hinge`/`Impact` shortcuts are isolated per player.
### 49. v4.47 Engine Addendum (Ghost Swing AI)
- **Bot Profiles:** `initPlayers()` supports `isBot` and `botSkill` (1: Amateur, 2: Pro, 3: Tour).
- **AI Brain (`takeAITurn`):** The Turn Manager automatically detects bot players and queries a silent `getOracleBlueprint()` to determine the optimal club, stance, and aim angle.
- **Automated Execution:** The engine mathematically rolls `botImpact` and `botHinge` variances based on skill level and directly triggers `calculateShot()`.

### 50. v4.48 - v4.48.1 Engine Addendum (AI Intelligence & Pacing)
- **Game Pacing Modes (Key P):** Cycles between Fast, Medium, Slow, and Manual pacing for bot turns. Manual requires the player to press `Spacebar` to let the bot swing, completely preventing ARIA TTS overlap.
- **The Short Game Brain:** For targets inside 100 yards, the `getOracleBlueprint()` iterates through all wedge `shotStyles` (Pitch, Chip, Flop) and calculates fractional `botPower` (e.g., 62%) rather than relying solely on full swings.
- **Long Putt Fallback:** If a putt is too mathematically complex/long for the Oracle to solve, it defaults to a straight aim at the exact target distance pace to guarantee a safe lag putt.
- **Dynamic Cursor Snap:** The AI automatically snaps its `puttTargetDist` to its actual physical distance before calculating putting power to prevent fractional 0% power loops near the hole.
### 51. v4.48.2 Engine Addendum (Multiplayer Polish)
- **Bot Input Lock:** The engine actively blocks human players from pressing `ArrowDown` or `ArrowUp` to initiate swings while it is a bot's turn, preventing sequence breaks and state desynchronization.
- **True Honors:** `resetRosterForHole()` automatically evaluates the scorecard from the previous hole and awards the first tee shot to the player with the lowest score.
- **Roster Persistence:** The `players` array, bot settings, and `currentPlayerIndex` are natively serialized into `localStorage` during `saveGame()`, allowing multiplayer sessions to survive browser refreshes.
### 52. v4.49 - v4.52 Engine Addendum (AI Aggression & Green Transitions)
- **Caddy Aggression Tuning:** The Oracle will actively reject Woods from the fairway if the pin is less than 150 yards away, forcing bots to rely on precision approach irons.
- **Phantom Putter Fix:** `loadActivePlayer()` applies a strict geographic override. If an incoming player's coordinates fall within the `greenRadius`, it forces `isPutting = true` and auto-equips the Putter, preventing AI from executing infinite Driver loops on the green.
- **Hazard Edge Distance:** The Hazard/Sight report (`Key H`) measures the linear distance to the *front edge* of the hazard's bounding box relative to the ball, rather than the center point.

### 53. v4.53 Engine Addendum (Approach Physics & Markdown Telemetry)
- **Loft Bias:** The AI Brain and Fairway Oracle mathematically subtract `(simClub.loft * 0.05)` from their simulated "miss distance" score. This heavily biases bots to attack pins with high-lofted Wedges rather than bumping mathematically equivalent 5-Irons.
- **Approach Magnetism:** The fairway "Hole-Out" capture radius is multiplied by the global difficulty's `impactMod`. On Casual difficulty, the cup expands to over 3 feet for approach shots, provided the player achieves an `accuracyScore >= 90`.
- **Markdown Telemetry:** The `Shift + C` clipboard export strictly formats shot data using Markdown syntax (`### Header`, `**Bold**`, `* List`) for readable pasting into code editors.
- **Putter Auto-Focus:** `autoSetFocus()` immediately locks the engine into the "Touch" focus mechanic the moment the Putter is equipped.

### 54. v4.54 - v4.56 Engine Addendum (Acoustic Signatures, Stimp & Power Scaling)
- **Stimp Meter (Semicolon Key):** Cycles a global `window.stimpSpeed` variable (8 to 14). The gravity engine and Putting Oracle mathematically scale their pace calculations by `(stimpSpeed / 10)`, altering green speeds dynamically.
- **AI Acoustic Signatures:** `playBotWoodsSignature()` utilizes a Promise-based fallback. It attempts to play physical MP3 files (`audio/bots/woods_roar[1-5].mp3`). If the files are missing, it seamlessly falls back to a 5-variant Web Audio API synthesized roar.
- **Wedge Spin Exemption:** Wedges and 9-Irons bypass the forced 10% minimum roll-out rule on Pitch and Chip shots, allowing their extreme backspin to properly check the ball up or spin backward.
- **Power Cap Reduction:** Maximum physical swing power is hard-capped at `110%` (down from 120%). This prevents arcade-style 400+ yard drives, capping mathematically perfect power-focus drives around 330 yards (PGA reality).
- **Massive AI Pacing Buffers:** The base delay before an AI takes its turn is expanded by +5000ms across all pacing modes (Slow pacing now waits 16.5 seconds). This guarantees the ARIA screen reader has ample time to finish reading the long Markdown telemetry before the bot swings.

### 55. v4.57 - v4.65 Engine Addendum (Dynamic TTS Pacing & Telemetry Archives)
- **Character-Length Polling:** The engine dynamically scales AI turn delays to perfectly fit ARIA screen reader output. It calculates the `.length` of the `lastShotReport` (or hole description) and multiplies it by a millisecond variable based on `pacingModeIndex` (Fast: 20ms/char, Medium: 35ms/char, Slow: 55ms/char) to prevent audio clipping or dead silence.
- **Scorecard Archives:** `loadHole()` intercepts and saves the active `holeTelemetry` array directly into `roundData` before wiping the slate. Pressing `C` or `Shift+C` in the Scorecard allows the user to export specific historical hole reports.

### 56. v4.65.0 Engine Addendum (Putting Granularity)
- **Exact Foot Snapping:** To prevent the UI from locking short putts into factors of 3 (3ft, 6ft, 9ft), the Turn Manager and `initPutting` functions now snap to the nearest exact foot using `Math.round(actualDist * 3) / 3`. This preserves decimal yardage for the physics engine while allowing dynamic UI readouts like 4ft or 7ft.

### 57. v4.64 - v4.65 Engine Addendum (Pre-Shot Verbosity)
- **Front-Loading Data:** The `X` key report strictly outputs data in order of importance to reduce ARIA fatigue: Club, Distance, Focus, then Alignment/Address.
- **Omitting Defaults:** Stance Alignment and Ball Address variables are completely omitted from the `X` key TTS broadcast if they are currently set to Neutral. 

### 58. v4.80.0 Engine Addendum (3D Topography Engine)
- **Elevation (`ballZ`, `targetZ`):** Modifies carry distance directly. 1 yard of elevation gain reduces carry by 1 yard.
- **Uneven Lies (`lieTilt`):** Alters clubface dynamics. Ball above feet generates hook spin (-80 RPM per degree); ball below feet generates slice spin.
- **Slope Roll (`landingSlope`):** Alters ground friction. Downslopes (negative values) multiply roll out; upslopes (positive values) act as backboards and dampen roll distance by 5% per degree.

### 59. v4.72.0 - v4.80.0 Engine Addendum (Driver Off Deck & AI Logic)
- **Physics Penalty:** Hitting a Driver from the Fairway triggers a severe penalty: Carry x0.7, Roll x1.5, SideSpin x2.5.
- **AI Selection:** The Oracle searches clubs backwards (Wedges first). Driver is strictly forbidden from the Rough. The AI applies a +50 Danger Penalty to Driver-off-deck shots, making it a desperation-only club.
- **Fractional Power Penalty:** The Oracle adds +20 to the miss score of any Full Swing (Style 0) that requires < 85% power, forcing the AI to select wedges for short yardages.

### 60. v4.80.0 - v4.81.0 Engine Addendum (3D Coordinate Transformations)
- **Global Wind Matrix:** `windX` and `windY` are permanent global map coordinates. The engine uses `relWindY = (windY * Math.cos(finalRad)) + (windX * Math.sin(finalRad))` to dynamically convert map wind into Relative Headwinds/Crosswinds based on the player's active line of sight.
- **Relative Pin Finder:** The Pin Finder grid uses rotation matrices to ensure the Up/Down arrows always navigate Forward/Backward relative to the player's current line of sight, regardless of global map orientation.
- **Dynamic Topography:** The `greenDictionary` slopes are rotated against the ball's final flight vector. A global "False Front" acts as a backboard if approached straight on, but mathematically transforms into a severe lateral kick if approached from the side.

### 61. v4.83.0 Engine Addendum (3D Audio Altimeter & Rangefinder)
- **Altimeter Pings:** The `Z` key triggers rising/falling sine waves based on the elevation difference (`targetZ - ballZ`) to convey verticality without TTS overhead.
- **Dynamic Hang Time:** The Z-axis difference now modifies `hangTimeSecs` (multiplied by 0.04). Downhill targets physically extend the duration of the ball flight audio; uphill targets shorten it.

### 62. v4.84.0 Engine Addendum (UI Optimization)
- **O(1) Scorecard Rendering:** `announceScorecardCell` caches `window.lastHighlightedCell` to update the UI cursor directly, rather than iterating through `table.getElementsByTagName('td')` on every keystroke, which previously caused severe input dropping.

### 63. v4.85.0 Engine Addendum (Multiplayer Data Architecture)
- **Per-Player Telemetry Isolation:** `roundData`, `roundHighlights`, and `currentHoleStats` are now stored directly on each entry in the `players[]` array. `saveActivePlayer` writes these three references into the outgoing player object; `loadActivePlayer` restores them (with safe fallbacks) when the engine switches turns. Bot telemetry can no longer overwrite human player data mid-round.
- **Multiplayer Scorecards:** `KeyP` inside the Grid Scorecard increments `scorecardPlayerIndex`, rebuilding the table using `players[scorecardPlayerIndex].roundData` to allow spectators to review bot telemetry.
- **Score-Open Targeting:** `Shift+E` now sets `scorecardPlayerIndex = currentPlayerIndex` before opening the scorecard, ensuring the human player's own data is shown by default rather than whatever index was left over from a previous session.
- **New Round Reset:** `buildClubhouseMenu`'s "Start New Round" action calls `window.initPlayers()` after clearing the global telemetry arrays, re-seeding every player object's `roundData`, `roundHighlights`, and `currentHoleStats` to their empty defaults.

### 64. v4.86.0 Engine Addendum (Headless Telemetry Simulator)
- **Quick Sim:** Setting `pacingModeIndex` to "Simulate" passes `isSim = true` to `takeAITurn`, which sets `window.isQuickSim = true` before calling `calculateShot`. This bypasses all `trigger3DFlight`, `playPannedThud`, scoring chords, and TTS `window.announce` calls. All inner timeouts (`hangTimeSecs`, `bounceSequenceMs`, `3500ms` green transitions, `4000ms` turn advances) collapse to 0–5ms, reducing a shot's processing time from ~15 seconds to under 20ms.
- **Pre-Round Setup:** The Clubhouse dynamically builds "Course" and "Roster" toggles using `setupCourseIndex` and `setupRosterIndex`. "Simulation (4 Bots)" auto-advances holes via `loadHole(hole + 1)` inside `advanceTurn`'s `allDone` handler, generating a full 18-hole telemetry array in seconds.
### 65. v4.87.0 Engine Addendum (Pine Straw Physics)
- **Terrain Friction:** Hitting off `currentLie === 'Pine Needles'` applies `lieMod = 0.85`, `lieForgivenessMod = 0.7`, and slashes `backspinRPM` by 90% (x0.1) to simulate the lack of friction on the clubface.
- **Roll Physics:** If the hazard AABB collision loop detects the ball intersecting "Pine Needles", the `rollDistance` is multiplied by 1.8 to simulate the slick, frictionless slide of dead pine straw.

### 66. v4.88.0 Engine Addendum (Edge-Weighted Dispersion)
- **Deterministic Spin:** `sideSpinRPM` is no longer a purely random value within an error cone. It is deterministically locked to `impactDiff` (`baseSideSpin = impactDiff * spinMultiplier`), guaranteeing that late impacts slice and early impacts hook.
- **Donut RNG:** Remaining random scatter uses `1.0 - Math.pow(Math.random(), 2)` to push standard deviation toward the outer edges of the error radius, preventing the "Lucky Center" flaw.
- **Hinge Distance Caps:** `hingeDiff > 40` strictly caps `hingeDistanceMod` at 0.85 or lower, preventing the engine's distance RNG from overriding "Fat" shots.

### 67. v4.89.0 Engine Addendum (Master Telemetry Dump)
- **Scorecard Export:** Pressing `Shift + C` inside the Scorecard UI now loops through the entire `players` array and concatenates every player's `roundData` into a single unified Markdown export, rather than only grabbing the actively viewed player.

### 68. v4.90.0 Engine Addendum (Clubhouse Setup Wizard)
- **State Machine Navigation:** `buildClubhouseMenu` now utilizes `clubhouseState` to render a drill-down wizard (Course -> Size -> Roster -> Match Settings). `input_ag.js` maps `ArrowUp/Down` to UI sweep tones (`bunker_03/04`) and maps `Escape` to step backward through the states.
- **Pacing Failsafe:** Initializing a new round explicitly resets `pacingModeIndex = 0` to prevent users from accidentally triggering silent Simulation mode.
- **Round Parameters:** Added `wizardWind`, `wizardStimp`, and `roughConditionIndex` global variables dynamically applied during the "Start Round" sequence.

### 69. v4.91.0 Engine Addendum (Hierarchical Roster Selection)
- **Categorized Bots:** Replaced the flat `roster_slot` menu with a 3-tier hierarchy (`roster_type` -> `roster_bot_amateur` / `roster_bot_tour`) to prevent accidental UX double-clicks and keep menu lengths short. Added Bot Woods as a baseline Tour Pro profile.

### 70. v4.92.0 Engine Addendum (Dynamic Rough & Telemetry)
- **Rough Conditions:** `physics_ag.js` now scales `lieMod` and `lieForgivenessMod` based on the active `roughConditionIndex` set by the Clubhouse wizard. 
- **Telemetry Header:** The `Shift + C` Master Dump in `input_ag.js` now prepends a `# MATCH SETTINGS` block detailing the Course, Wind, Stimp, and Rough Condition to ensure exported data retains its environmental context.

### 71. v5.0.0 Engine Addendum (Pebble Beach & Topography)
- **Pebble Beach Data:** Injected a hyper-realistic 18-hole layout for Pebble Beach into `courses`.
- **Z-Axis Navigation:** Holes like 6 (Uphill), 7 (Downhill), and 14 heavily utilize `pinZ` and `landingZones` with `z` coordinates to force players to manage club selection against gravity.
- **AABB Ocean Mapping:** Holes 4, 5, 6, 9, 10, and 18 map massive `Water` boundaries running parallel to the fairway to mimic the Pacific coastline.

### 73. v5.0.2 Engine Addendum (Menu Hotfix)
- **Duplicate Course Fix:** Removed the hardcoded "Coming Soon" Pebble Beach placeholder from `buildClubhouseMenu` in `main_ag.js` to prevent it from appearing alongside the actual playable course generated from `data_ag.js`.

### 74. v5.0.3 Engine Addendum (Pebble Beach Full Correction)
- **Schema Fix:** Changed `hole` to `number` in the Pebble Beach `data_ag.js` array to prevent initialization crashes.
- **Targeting Fix:** Appended `zones` arrays to all Pebble Beach holes to restore the Z-key targeting system.
- **Menu Syntax Fix:** Replaced the broken `clubhouseState === 'course'` logic block in `main_ag.js` to clear the orphaned duplicate entry and fix a stray bracket syntax error.

### 75. v5.0.4 Engine Addendum (Session Recovery & AI Audio)
- **Boot Recovery:** `initGame` now automatically calls `loadGame()` to pull `localStorage` saves into memory upon browser refresh, ensuring the "Resume Current Round" button successfully populates.
- **Bot Thinking Audio:** Created `startBotThinking()` to play a 400Hz soft tick every 1000ms while the engine waits for the dynamic ARIA pacing delays in `advanceTurn` and `loadHole` to clear.

### 76. v5.0.5 Engine Addendum (Boot Sequence Hotfix)
- **Save Recovery:** Added `window.loadGame()` directly to `window.initGame` so the engine correctly populates the UI with active save states when the browser is refreshed.

### 77. v5.0.6 Engine Addendum (Swing Memory Wipe Fix)
- **Shot Persistence:** Excised an erroneous `window.loadGame()` call from `startBackswing` in `main_ag.js` that was aggressively reverting the player's active club, stance, and aim parameters to the pre-turn save state upon swing initialization.

### 78. v5.0.7 Engine Addendum (Bot Hazard Failsafe)
- **Infinite Loop Breaker:** Added `consecutiveHazards` tracking to the AI Brain in `physics_ag.js`. 
- **Unplayable Drop:** If an AI player hits 3 consecutive hazards (Water or Sand), the engine forces an Unplayable Lie. It adds a stroke, resets `ballX` to 0, and subtracts 80 yards from `ballY`, pushing the AI out of the delicate Pitch/Chip logic window and forcing them to safely clear the hazard with a full swing.

### 79. v5.1.0 Engine Addendum (Match Rules & Automation)
- **Match Rules:** Added globally persistent `wizardMulligans`, `wizardGimmes`, and `wizardMaxScore` variables to the Clubhouse setup.
- **Pre-Shot Caching:** `startBackswing` now actively caches the player's active state (`ballX`, `ballY`, `strokes`, etc.) into `window.preShotState` before the stroke is counted.
- **UX Remapping:** Removed mid-round practice warping. Mapped `N` to Next Player, `M` to Mulligan, `Shift+M` to Snowman, and `G` to Gimme.
- **Auto-Hole Out Engines:** `physics_ag.js` actively evaluates the ball's final resting position against the Gimme threshold and the `strokes` counter against the Max Score limit, forcibly finishing the hole if conditions are met.
- **Setup Fast-Forward:** Pressing `Ctrl + Enter` in the Clubhouse will scan the menu array from the bottom up to automatically execute the primary "Proceed" action, bypassing manual arrow navigation.

### 80. v5.1.1 Engine Addendum (Practice UI & Putting Failsafes)
- **Practice Facilities:** Expanded the Clubhouse "Practice Facilities" button into a navigable sub-menu to restore access to the Chipping Green and Putting Green without using mid-round hotkeys.
- **Putting Auto-Hole:** Mirrored the `wizardGimmes` and `wizardMaxScore` logic into the `finishPutt()` routine in `physics_ag.js` so that missed putts stopping near the hole accurately trigger automatic completion.

### 81. v5.1.2 Engine Addendum (Telemetry & Oracle Topography)
- **Oracle Elevation Math:** Added `elevationDiff` subtraction to the `effectiveCarry` calculation in `getCaddyAdvice` and `getOracleBlueprint`. This mirrors the true physics engine, forcing the AI to dynamically club up/down when `targetZ` dictates a severe slope.
- **Quick Roster:** Added `Shift + L` listener to the Clubhouse roster menu to instantly populate a 4-bot simulation group.
- **Telemetry Scoreboard:** The `Shift + C` master dump now synthesizes and prepends a player scoreboard to the top of the exported log.

### 82. v5.1.3 Engine Addendum (Universal Help UI & Explorer Updates)
- **Visual Overlay:** Created `#help-panel` in `index.html`. `main_ag.js` now dynamically renders the `helpMenuText` array and syncs a visual highlight with the ARIA `helpIndex`, allowing sighted users to follow along with screen reader navigation.
- **Help Menu Content:** Overhauled `helpMenuText` in `data_ag.js`. Consolidated `Shift` functions into primary key descriptions to reduce guessing. Pushed `F12` to the top of the array.
- **Keyboard Explorer:** `input_ag.js`'s `isExploreMode` interceptor now accurately passes and reads `e.ctrlKey` and `e.shiftKey` variables. Synchronized `getKeyDescription` with the new V5 map.

### 83. v5.1.4 Engine Addendum (Help UI Initialization Hotfix)
- **Scope Correction:** Rescued `renderHelpMenu` and `announceHelp` from the `drawMeter` loop scope in `main_ag.js`, allowing the global `keydown` listener to correctly trigger them.
- **Input Priority:** Consolidated duplicate `viewingHelp` interceptors in `input_ag.js` into a single, high-priority block at the top of the event listener, ensuring `KeyH` heading jumps work seamlessly in both the Clubhouse and on the course. Added the `ui_nav_03/04` audio cues to the open/close sequence.

### 85. v5.1.6 Engine Addendum (Menu Wraps & Holo Range Oracle)
- **Menu Wrapping:** Updated the `clubhouseMenu` `ArrowUp` and `ArrowDown` listeners in `input_ag.js` to use modulo arithmetic, allowing infinite scrolling through the UI.
- **Holo Range Oracle:** Unlocked `window.getCaddyAdvice` and `window.getOracleBlueprint` in `physics_ag.js` for `gameMode === 'range'`. The Caddy natively reads the dummy "Holo Range Simulator" course data, allowing it to provide exact tactical advice for custom `targetZ` elevations and spawned Object Manager obstacles.

### 84. v5.1.5 Engine Addendum (Holo Range Sandbox)
- **Dynamic Dummy Course:** `gameMode = 'range'` now generates and assigns a "Holo Range Simulator" dummy course in `courses`. This allows the engine's native AABB physics, Oracle Caddy, and Edge Finder (`KeyH`) to work perfectly in the practice sandbox without requiring new physics logic.
- **Object Manager (Key O):** Replaced the static Synth Tree with a 3D level editor. Players can cycle, spawn (`Enter`), and despawn (`Backspace`) Target Flags, Sand Bunkers, Single Trees, Tree Walls (15x5 AABB), and Tree Clusters (30x30 AABB).
- **Spatial Controls:** Brackets move objects laterally. Dash/Equals move objects longitudinally. `Shift + Dash/Equals` adjusts `pinZ` elevation for flags, or physical `height` for trees.
- **Smart Help System:** `?` acts progressively. If pressed in a practice area, it overrides to `helpState = 'area'` and plays contextual orientation logic. Pressing `?` again unlocks the `helpState = 'master'` keybindings matrix.

### 98. v5.8.0 Engine Addendum (Audio Ducks & Roster Completion)
- **Duck Audio Penalty:** Implemented a new flight-phase auditory cue. Any shot with an `accuracyScore < 80` will trigger a randomized `duck.mp3` file 800ms into the ball flight, providing immediate, visceral feedback for severe miss-hits without stepping on the Hinge/Impact execution tones.
- **Roster Fix:** Restored Dusty Bunkers to the Amateur Bot selection menu in the Clubhouse Wizard.

### 99. v5.9.0 Engine Addendum (High Accuracy Audio Rewards)
- **Strike Audio:** Shots achieving an `accuracyScore > 90` now immediately trigger external MP3 assets (`woods_blast[1-5].mp3` for Woods/Drivers, `bullseye[1-6].mp3` for Irons/Wedges). These fire directly on impact, running concurrently with the web audio execution pings to provide a layered, satisfying reward for optimal timing.

### 97. v5.7.0 Engine Addendum (Scorecard Focus Lock)
- **Input Bleed Prevention:** Opening the Scorecard (`Shift + E`) now correctly flips the `viewingScorecard` state flag to `true`. This acts as an input firewall, preventing navigation arrow keys from bleeding through and accidentally triggering swings or aiming adjustments in the background game state.

### 96. v5.6.0 Engine Addendum (Audio Texture & Scorecard Safety)
- **Power Milestones:** The 100% marker is now a 1200Hz square-wave double-chirp.
- **Tone Duration:** Execution feedback tones for Hinge and Impact have been extended to 0.5s.
- **Scorecard Failsafe:** Added a validation check to `renderScorecard` to ensure an ARIA announcement triggers even if the UI element fails to populate, preventing user disorientation.

### Course Data Architecture
Course Data Architecture: Core game data (clubs, wind, green contours) lives in `data_ag.js`. `data_ag.js` initializes the global registry with `window.courses = window.courses || [];`. Individual courses are stored as modular files in the `courses/` directory (`course_holodeck.js`, `course_scrapyard.js`, `course_pebble.js`, `course_pasture.js`), each calling `window.courses.push({...})` to register themselves. `index.html` must load `data_ag.js` first, then each course file, then the engine scripts. HTML must be updated when a new course is added.

### 95. v5.5.1 Engine Addendum (Telemetry Versioning)
- **Metadata Expansion:** The Markdown Telemetry Dump (`Shift + C`) now includes a `**Engine Version:**` field in the match header. This allows for automated parsing and filtering of simulation data based on the specific version of the AI and physics engine used during the round.

### 94. v5.5.0 Engine Addendum (Quick Telemetry & UI Audio)
- **Quick Telemetry (`Shift + ArrowUp`):** Parses the `holeTelemetry` array for the most recent `**Execution:**` string, cleans the math formatting (e.g., changing `-` to `minus` and `%` to `percent`), and sends it to the ARIA announcer. This gives players instant P/H/I and Spin readouts on the practice range.
- **Invisible UI Audio:** Added `ui_nav_03` to `Shift + E` (Scorecard) and `ui_nav_06` to `Shift + C` (Clipboard Export) to provide confirming audio feedback for non-visual actions.

### 93. v5.4.0 Engine Addendum (The Impact Target)
- **Audio Bullseye:** `startImpactPhase` now schedules an isolated 800Hz triangle ping at exactly `dropDurationMs`. It deliberately ignores `swingState` interruptions to guarantee it always fires, providing players with a consistent metronome tick to measure their early/late impact variance against.

### 92. v5.3.1 Engine Addendum (Scoring & Sandbox Failsafes)
- **Range Targeting:** Re-authorized `KeyZ` (Pin Finder) and `KeyT` (Distance Report) to function during `gameMode === 'range'`.
- **Scorecard Failsafe:** `advanceTurn` now physically audits the `roundData` array and force-pushes a record if `isHoleComplete` is true but the hole is missing, preventing Auto-Snowmen and manual Gimmes from vanishing from the final score.
- **Bot AI Nerf:** Widened base impact variance for Skill 3 (30ms) and Skill 2 (55ms) to ensure high-tier bots experience natural lateral scatter on approach shots, curbing robotic proximity.

### 91. v5.3.0 Engine Addendum (Practice Sandbox Unification)
- **Architecture Shift:** Deprecated the separate `gameMode = 'chipping'`. The Short Chipping Green (5-30y) and Pitching Green (30-100y) now boot into `gameMode = 'range'`, natively inheriting the dummy course, Object Manager (`O`), Edge Finder (`H`), and Oracle Caddy (`A`).
- **Target Randomization (`R`):** A global range listener dynamically randomizes `pinY` and `pinZ` based on the active `window.rangeMode` (`short`, `long`, or `holo`), allowing players to practice elevated targets without manual manipulation.
- **Dynamic Increments:** The Object Manager's coordinate scaling (`inc`) checks `window.rangeMode` to automatically snap movement by 1 yard in Short Chipping, 3-5 yards in Long Chipping, and 5-10 yards on the Holo Range.

### 90. v5.2.0 Engine Addendum (Help Menu Architecture)
- **Synthetic Event Crash:** Replaced the `KeyboardEvent` hack in the Clubhouse menu with a dedicated `window.openHelpMenu()` function. This solves a silent JS crash where the browser rejected `e.preventDefault()` on an uncancelable synthetic event. Both the physical `?` key and the UI button now route to this central launcher.

### 89. v5.1.10 Engine Addendum (Visual UX Restoration)
- **Visual Output Marquee:** Removed the scrolling marquee CSS from `index.html`, replacing it with a static, centered, wrapping text box to prevent motion sickness for sighted players.
- **Swing Meter Render Loop:** Restored a dedicated `window.drawMeter` `requestAnimationFrame` loop at the bottom of `main_ag.js`. It visually maps `swingState` timing back to the canvas, and uses the `hingeTimeBack` and `hingeTimeDown` timestamps to dynamically drop blue triangle markers to visualize the hinge rhythm mechanics.

### 88. v5.1.9 Engine Addendum (AI Humanization Math)
- **The Pro Scramble (Skill 3):** Introduced a 15% tee-shot lapse rate for top-tier bots to prevent robotic perfection. Compensated with an "Elite Scrambling" override that clamps their impact variance to `+/- 10ms` when hitting from the rough or hazards, mimicking real-world Tour recovery abilities.
- **Forced Dispersion Ceiling (Skill 1 & 2):** To prevent lower-tier bots from accidentally shooting under par due to pure RNG luck, a deadzone is applied to their impact math. Skill 1 bots are forced to miss the sweet spot by at least 40ms, and Skill 2 bots by 25ms, ensuring consistent amateur shot-shaping and scoring brackets.

### 87. v5.1.8 Engine Addendum (AI Personalities & 4F Roster)
- **Personality Injection:** `getOracleBlueprint()` in `physics_ag.js` now dynamically adjusts `adjustedMiss` scores based on the active bot's name. "Fairway Fred" applies a +30 penalty to Woods/Drivers, mathematically forcing him to lay up. "Dusty Bunkers" applies a -20 bonus to 105%+ power requirements and a +25 penalty to <95% power, forcing him to aggressively overswing short irons.
- **4F Roster Alignment:** The `Shift + L` Quick Load now constructs a perfectly linear skill progression for telemetry testing: Shawn (0), Dusty (1), Fred (2), and Ted (3).
- **Help & UI Polish:** Set the `?` menu to open with `ui_nav_03` (to pair with `Escape`'s `ui_nav_04`). The Holo Range now always plays its contextual `?`, `F12`, and `O` tool instructions upon entry.

### 100. v5.30.0 Engine Addendum (Modular Architecture Refactor)
- **Module Split:** Decomposed the monolithic `main_ag.js` into discrete, responsibility-scoped modules: `ui_ag.js` (Dashboard, Scorecard, Clubhouse Menu, Help UI, Swing Meter), `input_ag.js` (all `keydown` / `keyup` event listeners), `physics_core.js` (shot calculation math), and `physics_collisions.js` (AABB hazard resolution). `main_ag.js` retains global state variable declarations, `initGame`, `loadHole`, `advanceTurn`, and the audio/bot orchestration layer.
- **Global Exposure:** All functions called cross-module are explicitly assigned to `window` (e.g., `window.buildClubhouseMenu`, `window.updateDashboard`, `window.announceClubhouse`). Module-local variables promoted to `window` where required for cross-file reads.
- **Load Order Constraint:** `index.html` must load modules in dependency order: `data_ag.js` → courses → `audio_ag.js` → `golf_audio_bank.js` → `physics_ag.js` → `ui_ag.js` → `input_ag.js` → `main_ag.js` (last, as it calls functions defined in all other modules).

### 101. v5.31.0 Engine Addendum (Clubhouse Menu Recovery)
- **Global Menu Bridge:** `window.buildClubhouseMenu` now assigns `window.menuOptions = clubhouseMenu` and `window.menuIndex = clubhouseIndex` at the end of every build, exposing the live menu array and cursor position globally so `input_ag.js` can read them without a direct scope dependency on `ui_ag.js` locals.
- **Navigation Announce Fix:** `window.announceClubhouse` re-syncs `window.menuOptions` and `window.menuIndex` on every call, ensuring Arrow-key navigation reads from the authoritative window globals. The announced text is drawn from `window.menuOptions[window.menuIndex].text`.
- **Confirm Function:** Added `window.confirmClubhouseSelection()` to `ui_ag.js`. It executes `window.menuOptions[window.menuIndex].action()`, providing a clean, globally-callable confirm entry point.
- **Enter Key Fix:** The plain `Enter` branch of the Clubhouse interceptor in `input_ag.js` now calls `window.confirmClubhouseSelection()` rather than directly indexing the module-local `clubhouseMenu` array.
- **Critical Load-Order Fix:** `ui_ag.js` was absent from `index.html`'s `<script>` list, meaning `window.buildClubhouseMenu` and all menu render functions were silently undefined at runtime. The script tag was added.

### 102. v5.31.1 Engine Addendum (Architecture Sync & Load-Order Optimization)
- **Script Load Order Enforced:** Corrected the `<script>` tag sequence in `index.html` to match the v5.30.0 dependency contract: `data_ag.js` → courses → `audio_ag.js` → `golf_audio_bank.js` → `physics_ag.js` → `ui_ag.js` → `input_ag.js` → `main_ag.js`. Previously, `main_ag.js` was inserted before `physics_ag.js`, `ui_ag.js`, and `input_ag.js`, causing race conditions where `initGame` could execute before the UI render and physics functions it depends on were defined.
- **Version Sync:** Updated `<title>`, version `<div>`, and `input_ag.js` header comment to `v5.31.1` for cross-file consistency.

### 103. v5.31.2 Engine Addendum (Modular Script Alignment)
- **Script Block Replaced:** `index.html` now references the fully modular audio and physics files. `audio_ag.js` and `physics_ag.js` (the legacy monoliths) are removed from the `<script>` list. They are replaced by `audio_core.js` (environmental synth engine and ARIA announcer) and the split physics pair `physics_core.js` (base math, wind, shot calculation) + `physics_collisions.js` (terrain queries, AABB hazard resolution, lie penalties).
- **Final Load Order:** `data_ag.js` → courses → `audio_core.js` → `golf_audio_bank.js` → `physics_core.js` → `physics_collisions.js` → `ui_ag.js` → `input_ag.js` → `main_ag.js`. This ensures all window-globals (e.g. `window.getTerrainAt`, `window.calculateShot`, `window.playGolfSound`) are defined before `main_ag.js`'s `initGame` references them.
- **Header Version Sync:** Updated header comments in `physics_core.js`, `physics_collisions.js`, `audio_core.js`, `ui_ag.js`, and `input_ag.js` to `v5.31.2`.

### 104. v5.31.3 Engine Addendum (The Pasture Audio Synchronization)
- **Two-Track Environmental System Verified:** `window.playEnvironment(musicSrc, ambientSrc)` in `audio_core.js` correctly manages two independent `Audio` objects — `currentBgMusic` and `currentBgAmbient` — each looping independently and stopped/replaced atomically on every hole load.
- **Volume Leveling:** Music layer (`currentBgMusic.volume`) is set to `0.3` (30%) to sit under dialogue and swing audio. Ambient layer (`currentBgAmbient.volume`) is set to `1.0` (100%) for full environmental presence.
- **Pasture Asset Map Confirmed:** `course_pasture.js` holes 1-3 carry the correct `bgMusic` / `bgAmbient` pairs: Hole 1 (`mu_pasture1.mp3` / `am_farm1.mp3`), Hole 2 (`mu_pasture2.mp3` / `am_cow1.mp3`), Hole 3 (`mu_pasture3.mp3` / `am_coop1.mp3`).
- **Header Sync:** `audio_core.js` and `course_pasture.js` bumped to `v5.31.3`.

### 105. v5.31.4 Engine Addendum (Audio Path Correction — The Pasture)
- **Root Cause:** Holes 1–3 in `course_pasture.js` referenced `assets/audio/` as the audio root. This path was never committed to the repository; git history contains no `assets/audio/` directory at any point.
- **Corrected Path:** All `bgMusic` and `bgAmbient` values for Holes 1–3 updated to `audio/courses/pasture/`, aligning with the existing project `audio/` root and establishing a per-course subfolder convention. Paths: `audio/courses/pasture/mu_pasture1.mp3`, `audio/courses/pasture/am_farm1.mp3`, `audio/courses/pasture/mu_pasture2.mp3`, `audio/courses/pasture/am_cow1.mp3`, `audio/courses/pasture/mu_pasture3.mp3`, `audio/courses/pasture/am_coop1.mp3`.
- **Asset Status:** Physical `.mp3` files are not yet present; the corrected paths define the canonical target location for when the files are sourced and committed. `window.playEnvironment` silently catches play errors (`console.warn`) so the game boots cleanly without them.
- **Header Sync:** `course_pasture.js` bumped to `v5.31.4`.

### 86. v5.1.7 Engine Addendum (Dynamic Help & Foursome Quick Load)
- **Help Injection:** `helpMenuText` is now dynamically merged with `window.holoHelpData` via `window.currentActiveHelp` if `gameMode === 'range'`. This consolidates the contextual area help and the master keybindings into a single, navigable ARIA list.
- **Clubhouse UX:** Added "Help & Master Keybindings" to the root Clubhouse menu. Pressing `?` triggers the `ui_nav_06` chime.
- **Global Quick Load:** `Shift + L` in the Clubhouse forces `wizardSize = 4`, loads Moe/Shawn/Ted/Fred, and skips to `clubhouseState = 'course_quick'`, focusing the cursor on `wizardCourse`.
- **Contextual Explorer:** `F12` `getKeyDescription` logic now checks `gameMode === 'range'` before announcing Holo Range specific bindings like `O` or the Brackets.

### 100. v5.10.0 Engine Addendum (Tour Pro Personalities)
- **Legendary AI injected:**
  - **Bot Golden Bear:** Focus 4 (Accuracy), +15ms iBias (Fade). Oracle strongly avoids hazards (`miss > 0 -> +50 penalty`).
  - **Bot Strickler:** Focus 2 (Touch), 0ms Biases. Oracle mathematically hunts pins with wedges (`-40 adjustedMiss bonus`).
  - **Bot Lefty:** Focus 5 (Recovery), -25ms iBias (Hook/Cut), +10ms hBias. Oracle aggressively ignores 75% of hazard penalties when swinging woods, and favors Pitch (flop) shot styles around the green.

### 101. v5.11.0 Engine Addendum (Tour Pro Foursome Macro)
- **Clubhouse Macros:** Added `Shift + K` as a parallel to `Shift + L`. This macro instantly sets `wizardSize = 4`, injects Woods, Golden Bear, Lefty, and Strickler into the `wizardRoster`, and advances the `clubhouseState` directly to `'course_quick'`.

### 102. v5.12.0 Engine Addendum (Foursome Macro Hotfix)
- **UI Refresh Restoration:** Patched the `Shift + K` macro in `input_ag.js`. The macro now correctly defines `clubhouseIndex` and calls `window.announceClubhouse(false);` after generating the roster array, ensuring the screen reader and visual DOM immediately update to display the Course Selection menu, matching the behavior of `Shift + L`.

### 103. v5.13.0 Engine Addendum (Macro Variable Hotfix)
- **Event Listener Correction:** Patched `input_ag.js` to change the `Shift + K` conditional from `shift` to `e.shiftKey`, resolving a fatal `ReferenceError` that prevented the macro from firing on the Clubhouse menu.

### 104. v5.14.0 Engine Addendum (Course Architecture)
- **Course Profiles:** Injected `window.courseData` into `main_ag.js`. This transitions the engine away from generic math loops by providing explicit 18-hole maps for Holo Links, Texas Scrapyard, Pebble Beach, and The Pasture.
- **Hazard Arrays:** Each hole object contains a `hazards` array. Future RNG logic will check `currentCourse.holes[hole - 1].hazards.includes('cows')` (or 'scrap', or 'ocean') to determine which specific environmental penalties and sound profiles are allowed to trigger on that hole.

### 105. v5.15.0 Engine Addendum (Course Selection UI)
- **Menu Wiring:** Updated `window.buildClubhouseMenu` so that the `'course'` and `'course_quick'` menu states dynamically map over `window.courseData` instead of the legacy array.
- **State Locking:** The selection actions now immediately set `window.currentCourse = window.courseData[idx];`, ensuring the engine physically transitions to the correct hazard maps and hole distances upon starting a round.

### 110. v5.20.0 Engine Addendum (Data Unification Phase 1)
- **Dynamic Course Mapping:** Replaced the static, lightweight `window.courseData` array with a dynamic bridge function. It maps over the heavy `courses` array from `data_ag.js` and appends the required UI properties (`id` and `desc`). This safely feeds the rich physics data (`zones`, `hazards`, `greenRadius`) directly into the UI state without breaking legacy variable paths.

### 111. v5.21.0 Engine Addendum (Data Unification Phase 2)
- **The Variable Switch:** Completely excised `courses[currentCourseIndex]` from `main_ag.js` and `physics_ag.js`. The engine now runs 100% on the `window.currentCourse` object. Because Phase 1 successfully bridged the physics data into this object, the transition causes zero data starvation for the AI.

### 112. v5.21.1 Engine Addendum (Architecture Patch)
- **Telemetry & Putting Hotfix:** Cleaned up the final two legacy `courses[currentCourseIndex]` references missed during the v5.21.0 transition. The engine memory map is now completely unified under `window.currentCourse`.

### 113. v5.22.0 Engine Addendum (The Pasture & Audio)
- **Farm Course Restoration:** Re-added The Pasture array to `data_ag.js` containing specific lore names, hazard arrays (cows, tractors), and audio paths.
- **Audio Automation:** Re-established the HTML5 audio controllers in `audio_ag.js` and wired them into the `loadHole` sequence to automatically transition background noise based on the active course data.

### 114. v5.22.1 Engine Addendum (The Pasture Data Patch)
- **Array Formatting:** Expanded the 18-hole array for The Pasture in `data_ag.js` to fix a truncation error that was deleting the `zones` property and crashing the AI bot initialization.

### 115. v5.22.2 Engine Addendum (Race Condition Hotfix)
- **Dynamic Bridge Getter:** Converted `window.courseData` into an `Object.defineProperty` getter. This guarantees the UI always pulls the fully initialized `courses` array from `data_ag.js`, preventing the `zones` undefined crash caused by script load order racing.

### 116. v5.22.3 Engine Addendum (Data Truncation Fix)
- **Programmatic Array Generation:** Replaced the manually expanded array for The Pasture with a compact `Array.from()` generator to bypass IDE truncation limits, restoring the integrity of `data_ag.js`.

### v5.33.0 Engine Addendum (Global Music Volume Control)
- **Volume State Variables:** Injected `window.musicVolumeLevels = [0.0, 0.1, 0.2, 0.3, 0.4]` and `window.musicVolumeIndex = 2` into `main_ag.js`. The engine defaults to 20% music volume on boot.
- **Dynamic Volume Assignment:** `window.playEnvironment` in `audio_core.js` now assigns `currentBgMusic.volume` from the live `window.musicVolumeLevels[window.musicVolumeIndex]` array instead of a hardcoded `0.3`, ensuring the active index is respected on every hole load.
- **Live Update Function:** Added `window.updateMusicVolume()` to `audio_core.js`. It directly mutates the `volume` property of the currently playing `currentBgMusic` object, changing audio level instantly without restarting the track.
- **Shift + V Binding:** Modified the `KeyV` listener in `input_ag.js`. If `Shift` is held, the engine cycles `window.musicVolumeIndex` through the array (wrapping via modulo), calls `window.updateMusicVolume()`, and announces "Music volume set to [X] percent." If no modifier is held, the standard choked-down grip toggle executes unchanged.
- **Keyboard Explorer Updated:** `window.getKeyDescription` for `KeyV` now returns a shift-conditional string: `"Cycles the background music volume (0% to 40%)."` for Shift, and `"Toggles choked down grip for increased control."` for the base key.

### v5.33.1 Engine Addendum (5% Music Increment & Global Ambient Volume Control)
- **Music Array Expansion:** `window.musicVolumeLevels` updated to `[0.0, 0.05, 0.1, 0.2, 0.3, 0.4]`, inserting a 5% option for fine-grained control. `window.musicVolumeIndex` corrected to `3` so the default remains 20% (0.2).
- **Ambient State Variables:** Injected `window.ambientVolumeLevels = [0.0, 0.25, 0.5, 0.75, 1.0]` and `window.ambientVolumeIndex = 4` into `main_ag.js`. The ambient layer defaults to 100% on boot.
- **Dynamic Ambient Assignment:** `window.playEnvironment` in `audio_core.js` now assigns `currentBgAmbient.volume` from `window.ambientVolumeLevels[window.ambientVolumeIndex]` instead of a hardcoded `1.0`.
- **Live Update Function:** Added `window.updateAmbientVolume()` to `audio_core.js` directly below `window.updateMusicVolume`. It mutates `currentBgAmbient.volume` in real-time without restarting the track.
- **Shift + B Binding:** Added a new `KeyB && e.shiftKey` listener inside the `swingState === 0` block in `input_ag.js`, placed immediately above the `KeyV` handler. It cycles `window.ambientVolumeIndex` through the array, calls `window.updateAmbientVolume()`, and announces "Ambient volume set to [X] percent." A hard `return` prevents bleed-through to the unmodified putting `KeyB` (Green Reading) handler below.
- **Keyboard Explorer Updated:** `window.getKeyDescription` for `KeyB` now returns a shift-conditional string: `"Cycles the ambient background volume (0% to 100%)."` for Shift, and `"Reads the green elevation and break when touching."` for the base key.

### v5.34.0 Engine Addendum (Clifford's Moving Tractor)
- **Dynamic Hazard (course_pasture.js):** Hole 1 of The Pasture ("Clifford's Shortcut") updated with a properly structured `hazards` array. The "Moving Tractor" object (`distance: 180, depth: 15, offset: 0, width: 10`) replaces the legacy string-based hazard entry. A left-side Bunker (`distance: 210, depth: 20, offset: -22, width: 18`) is also formalized.
- **Tractor State Calculator (main_ag.js):** `window.getTractorState()` computes the tractor's real-time X position and stereo pan on a 50-second clock cycle using `performance.now()`. It returns `active: false` (and a far-off `xOffset: 9999`) once `strokes > 1` or `window.cliffordHit` is true, effectively hiding the tractor after the first shot or impact. `window.cliffordHit = false` is reset on both `loadHole` and `loadActivePlayer` (player swap).
- **Tractor Audio Engine (audio_core.js):** `window.startTractorAudio(isActive)` creates an `<audio>` element for `audio/courses/pasture/tractor1.mp3`, routed through a `StereoPannerNode`. A 50ms `setInterval` polls `getTractorState()` to update the pan value in real-time. When `state.active` is false (post-shot or post-hit), the audio volume is muted to zero without stopping the loop. Guards added to `playNoise` and `playRollingBlip`: `if (window.cliffordHit) return;` suppresses grass-roll audio after the tractor is struck.
- **Spatial Physics Integration (physics_collisions.js):** Both `getTerrainAt` and the roll-path AABB loop now call `getTractorState().xOffset` to update `h.offset` before evaluating bounding boxes, ensuring the tractor's collision box always matches its audio position. On a roll-path intersection with an active Moving Tractor: `window.cliffordHit` is set to `true`, one stroke is refunded (`strokes - 1`), the ball is bounced backwards and sideways via random angle math, `currentLie` resets to `"Fairway"`, the `bunker_33` clang sound fires, and a CLANG narrative is appended to the shot report.

### v5.34.1 Engine Addendum (Course Data Patch — Tractor AABB)
- **Massive Fairway Wall (course_pasture.js):** The Moving Tractor hazard on Hole 1 was re-dimensioned from `width: 10, depth: 15` to `width: 100, depth: 50`, making it a true fairway-wide wall that a drive cannot thread between. `distance` moved to `170` yards and `name: "Clifford's Tractor"` added. This guarantees reliable collision detection regardless of lateral ball position on the first shot. Header bumped to v5.34.1.

### v5.34.2 Engine Addendum (Timed Fairway Condition — Tractor Overhaul)
- **Architecture Shift:** Clifford's Tractor is no longer a physical AABB object. It is now a **Timed Fairway Condition** — the engine queries whether the tractor is crossing at the moment the ball settles, not whether the ball's bounding box overlaps a hazard. This eliminates all collision geometry entirely.
- **Clock Overhaul (main_ag.js):** `window.getTractorState()` no longer returns `xOffset`. Instead it returns only `{ pan, active }`. The 20-second "Wait" window (t: 20s–30s) now sets `active: false`, meaning the tractor is safely parked on the right side during that phase. The 0–20s (L→R) and 30–50s (R→L) passes both set `active: true`.
- **Audio Sync (audio_core.js):** `startTractorAudio` starts with `volume: 0`. The 50ms interval now tracks a `wasActive` boolean. When state transitions to inactive, the `<audio>` element is **paused and reset to `currentTime = 0`** so the next active pass always starts from the beginning of the MP3, guaranteeing audio/physics sync. When transitioning to active, `audioEl.play()` is called fresh.
- **Physics Integration (physics_collisions.js):** The `if (h.type === "Moving Tractor")` blocks are removed from both `getTerrainAt` and the AABB roll loop. A guard (`if (!h.offset || !h.width || ...)`) skips flag-only hazard objects to prevent bounding box math errors. The tractor intercept is now a single block placed at the end of `resolveHazardLie`, before the green-size check: if `currentLie === "Fairway"` **and** the hole has a Moving Tractor hazard **and** `tractorState.active` is true, the CLANG fires, one stroke is refunded, and the ball bounces backward.
- **Course Data (course_pasture.js):** Hole 1 tractor entry simplified to a dimension-free flag object `{ type: "Moving Tractor" }`. Headers bumped to v5.34.2 across all modified files.

### v5.34.3 Engine Addendum (Optimized Ambient Model — Baked Tractor Audio)
- **Architecture Shift:** Clifford's Tractor moves from a runtime `setInterval`-driven spatial audio engine to a **baked ambient audio model**. The tractor sound is now pre-mixed into the hole's ambient track (`am_farm1_tractor.mp3`). After all players have teed off, the ambient track hot-swaps to the clean farm ambience (`am_farm1.mp3`), removing the tractor engine sound naturally.
- **Ambient Hot-Swap (main_ag.js):** Inside `window.advanceTurn`, after the `allDone` guard, a new block checks: if `hole === 1` and every player has `strokes > 0`, it compares the current ambient src against `holeData.bgAmbientPostTee`. If they differ, it pauses the current ambient, creates a new `Audio` element from `bgAmbientPostTee`, sets `loop = true`, applies the current ambient volume, and calls `play()`. This guarantees the tractor audio fades out exactly when the last player in the group tees off.
- **Legacy Cleanup (main_ag.js):** `window.getTractorState` and the `window.cliffordHit` global variable are deleted. The `startTractorAudio` call inside `loadHole` is removed. Residual `window.cliffordHit = false` resets in `loadHole` and `loadActivePlayer` are also removed.
- **Audio Engine Simplification (audio_core.js):** `tractorAudioSource`, `tractorPanner`, and `tractorInterval` globals deleted. `window.startTractorAudio` function deleted entirely. `if (window.cliffordHit) return;` guards removed from `playNoise` and `playRollingBlip`.
- **Physics Trigger Refactor (physics_collisions.js):** The timed fairway condition intercept (which required `getTractorState()` and `cliffordHit`) is replaced with a simple deterministic rule: if `hole === 1`, `currentLie === "Fairway"`, and `strokes === 1`, the stroke is refunded (`strokes = 0`), the ball bounces backward with a random angle, and the CLANG narrative fires. No state flags required.
- **Course Data (course_pasture.js):** Hole 1 gains `bgAmbientPostTee: 'audio/courses/pasture/am_farm1.mp3'`. `bgAmbient` updated to `'audio/courses/pasture/am_farm1_tractor.mp3'`. The `{ type: "Moving Tractor" }` flag object is removed from the hazards array as it is no longer needed. Headers bumped to v5.34.3 across all modified files.

### v5.34.4 Engine Addendum (Tractor Grab-Bag Audio & Delayed Announce)
- **Delayed CLANG (physics_collisions.js):** The tractor reward announce is now deferred inside a `setTimeout` keyed to `hangTimeSecs * 1000`, so Clifford's reaction fires at ball-land time rather than immediately on shot resolution. The `bounceMsg` is appended to `flightPathNarrative` synchronously so the shot report always includes it regardless of timing.
- **Grab-Bag Voice Lines:** A `window.cliffExclaims` array (`cliff_exclaim1`–`cliff_exclaim4`) is lazily shuffled and popped each hit, playing a random voice line via a fresh `Audio` element at the current ambient volume level.
- **Timeout Registration:** The `setTimeout` id is pushed into `stateTimeouts` (local ctx) so it is tracked and can be cleared on hole advance.
- **`playGolfSound` removed from sync path:** The `bunker_33` clang was dropped from the v5.34.4 block (deferred announce handles audio). **Known bug:** the `if (stateTimeouts && hangTimeSecs)` guard silently suppressed all audio/announce when `hangTimeSecs` was `undefined` or `0`, leaving the CLANG silent on many shots.
- **Hotfix trigger (main_ag.js):** Hot-swap condition corrected from `p.strokes > 0` to `p.currentLie !== 'Tee'`. Destructuring in `resolveHazardLie` expanded to include `hangTimeSecs` and `stateTimeouts`. Headers bumped to v5.34.4.

### v5.34.5 Engine Addendum (Tractor Timeout Bypass Fix)
- **Root Cause Fixed (physics_collisions.js):** The `if (stateTimeouts && hangTimeSecs)` dual-guard was the bug — it caused the entire CLANG block (audio + announce) to be silently skipped whenever `hangTimeSecs` evaluated to `0` or `undefined` (e.g. punch shots, low-trajectory drives). Replaced with an unconditional `setTimeout` using `(hangTimeSecs || 4.5) * 1000` as the delay, guaranteeing the voice line always fires.
- **`bunker_33` clang restored:** `window.playGolfSound('bunker_33')` re-added inside the timeout so the metal clang sound fires alongside the voice line.
- **Grab-bag array fixed:** v5.34.4 sorted the array inside the `||` initializer, meaning an already-populated array was never re-shuffled. Fixed by sorting unconditionally after initialization. Array is also repopulated when empty so all 4 lines cycle before repeating.
- **Timeout registration hardened:** The timeout ID is now pushed to `window.stateTimeouts` first (global fallback), then `stateTimeouts` (ctx local), preventing state bleed if the ctx reference goes stale. Header bumped to v5.34.5.

### v5.34.6 Engine Addendum (Texas Scrapyard Data Repair & Menu Description)
- **Syntax artifact removed (course_scrapyard.js):** The file previously opened with a dangling object fragment (`zones: [{ name: "Fairway Center", x: 0, y: 260 }, { name: "Fairway Up...`) fused to the `window.courses = window.courses || [];` initializer on a single broken line. This line was deleted and replaced with a clean two-line header: a `// course_scrapyard.js` comment and the proper `window.courses` initializer, resolving a parse-time syntax error that prevented the course from loading.
- **ARIA menu description added (main_ag.js):** A new `if (c.name.includes("Scrapyard"))` branch was added to the `courseData` getter in `main_ag.js`, injecting the description "A rugged, post-apocalyptic course built through a Texas junk yard. Tight fairways and severe metallic hazards." so screen-reader users hear a full course summary in the selection menu. Headers bumped to v5.34.6.

### v5.35.0 Engine Addendum (The Bovine Bounce — Hole 2 Pinball Mechanics)
- **360-degree ricochet physics (physics_collisions.js):** A new block fires on Hole 2 whenever `currentLie !== "Green"`, `totalDistance > 50`, and the ball is not in water. A random bounce distance (5–18 yards) and a full 360-degree random angle (`Math.PI * 2`) are applied to `ballX`/`ballY`. The lie is immediately re-evaluated via `window.getTerrainAt` after displacement. `rollStopTriggered` is set to `true` to suppress further roll processing.
- **Spatial stereo audio (physics_collisions.js):** Cow audio is routed through a Web Audio API `StereoPannerNode`. The pan value is calculated as `ballX / 25` (clamped ±1), so a ball that bounces hard-left plays the moo from the left speaker. The entire `createMediaElementSource → panner → destination` chain is enclosed inside the `if (typeof audioCtx !== 'undefined' && audioCtx)` guard; a plain `new Audio().play()` fallback fires when the context is absent or suspended.
- **6-file grab-bag array (physics_collisions.js):** `window.cowSounds` cycles through `['cow1'…'cow6']`, shuffled each pass. The array is repopulated when empty so all six clips rotate before any repeats.
- **`bunker_04` body-impact thud (physics_collisions.js):** `window.playGolfSound('bunker_04')` fires inside the timeout alongside the moo clip to simulate the physical ball-on-hide impact.
- **Course data updated (course_pasture.js):** Hole 2 `hazards` replaced from legacy string array `['sand', 'cows']` to structured objects: a `Bunker` at 200 yards (depth 15, offset −15, width 15) and a `{ type: "Bovine Herd" }` flag that physics_collisions reads to trigger the bounce block. Headers bumped to v5.35.0.

### v5.36.0 Engine Addendum (Foul Plate Roosters — Hole 3 Hazard & Bonus Loot)
- **Rooster micro-bounce (physics_collisions.js):** A new block fires on Hole 3 whenever `currentLie !== "Green"`, `strokes <= 2`, `totalDistance > 50`, and the ball is not in water. The `strokes <= 2` cap prevents the hazard from triggering on penalty drops or chip-ins. Bounce distance is 3–6 yards in a random 360-degree direction; lie is re-evaluated via `window.getTerrainAt` after displacement.
- **Per-player Mulligan/Gimme inventory (physics_collisions.js):** Each rooster hit randomly awards either a Mulligan (`p.earnedMulligans`) or a Gimme (`p.earnedGimmes`) to the active player object, incremented via `|| 0` safe initializer. These counters are stored on the player object for future redemption logic.
- **Stacked audio — `freechicken.mp3` (physics_collisions.js):** The rooster squawk plays immediately on the `delayMs` callback. A nested `setTimeout` 800 ms later plays `freechicken.mp3` as a loot-drop fanfare. Both clips are routed through independent `StereoPannerNode` instances sharing the same `panValue`. The bonus `setTimeout` is securely nested inside the primary `delayMs` callback, guaranteeing it cannot fire mid-flight.
- **6-file rooster grab-bag (physics_collisions.js):** `window.roosterSounds` cycles `['rooster1'…'rooster6']`, shuffled each pass and repopulated when empty, matching the cow-sound pattern from v5.35.0.
- **Course data updated (course_pasture.js):** Hole 3 `hazards` replaced from `['water', 'chickens']` to structured objects: a `Water` hazard at 300 yards (depth 25, offset 0, width 60) and a `{ type: "Chicken Flock" }` flag. Headers bumped to v5.36.0.

### v5.36.1 Engine Addendum (Foul Plate Redesign & Tractor Infinite Loop Fix)
- **Tractor loop fix (physics_collisions.js):** The Clifford's Tractor condition previously used `strokes === 1` as its trigger guard. This was unsafe because a player retaking a shot from the tee (e.g. after a water penalty drop back to tee) would re-trigger the free stroke refund on their second or third attempt. The condition is replaced with `p.currentLie === 'Tee'`, reading the player's originating lie from the player object (defaulting `{ currentLie: 'Tee' }` if the object is absent). This ensures the reward fires only on a genuine tee shot. Header bumped to v5.36.1.
- **"Foul Plate" shortened to 485 yards (course_pasture.js):** Distance reduced from 520 to 485, `pinY` updated to match. The hole is now a reachable-in-two par 5 rather than a forced three-shot layout.
- **15-yard choked approach added (course_pasture.js):** `approachWidth: 15` added to the hole object. `physics_collisions` already reads this field in `getTerrainAt` to narrow the fairway corridor near the green.
- **Twin greenside bunkers (course_pasture.js):** Two symmetrical `Bunker` hazards added at 470 yards — left (offset −12, width 12) and right (offset +12, width 12) — creating a tight 24-yard window that punishes aggressive approaches.
- **Water hazard tightened (course_pasture.js):** Moved from 300 yards to 280 yards (depth reduced to 20) to better match the shortened total distance and create an earlier layup decision point.
- **Second landing zone updated (course_pasture.js):** `y` coordinate updated from 450 to 410 to reflect the shorter hole geometry. Headers bumped to v5.36.1.

### v5.62.0 Engine Addendum (Pin Finder Topography Fix)
- **`window.getLandingZoneEffect` Scoping Fix (`physics_collisions.js`):** The function previously referenced the bare global `greenDictionary` and guarded against it with `typeof greenDictionary`. Both the guard and the contour array lookup are updated to `window.greenDictionary`, matching the explicit `window.` assignment used by `data_ag.js`. This prevents silent `undefined` failures in strict or module-style evaluation contexts. Comment updated from `v4.37.1` to `v5.62.0`. Header bumped to v5.62.0.
- **Grid Initialization Topography Fix (`input_ag.js`):** The `Shift + Z` Pin Finder grid init block previously looked up the green contour zone using `distToPin` — the player's current distance from the cup. This was incorrect: the contour should describe the *target point* being aimed at, not the ball's current position. Replaced `distToPin = calculateDistanceToPin()` with `targetDistFromPin = Math.sqrt(Math.pow(targetX - pinX, 2) + Math.pow(targetY - pinY, 2))`. The `greenDictionary` lookup and `startY/endY` zone find now use `targetDistFromPin`, so the "Plays Uphill / Plays Downhill" broadcast correctly describes the elevation of the grid cursor's starting position. Header bumped to v5.62.0.

### v5.61.0 Engine Addendum (Cache Buster Injection)
- **`<title>` Updated (`index.html`):** Version tag incremented to `Accessible Golf Engine (v5.61.0)`.
- **Cache-Busted Script Block (`index.html`):** All `<script>` tags in the `<body>` now carry `?v=5.61.0` query strings, including the four course files (`course_holodeck.js`, `course_scrapyard.js`, `course_pebble.js`, `course_pasture.js`) which previously had no version parameter. This forces the browser to bypass stale cached copies of every module on page load, preventing mismatched engine states during local development. Strict load order preserved: `data_ag.js` → courses → `audio_core.js` → `golf_audio_bank.js` → `physics_core.js` → `physics_collisions.js` → `ui_ag.js` → `input_ag.js` → `main_ag.js`.

### v5.60.0 Engine Addendum (Green Schema Fix, 3D Auto-Equip & Hole 8 Audio Polish)
- **Green Contour Schema Fix (`data_ag.js`):** Replaced the `maxDist`-keyed contour schema in `"The Swirling Moat"` with the engine-standard `startY`/`endY` bracket schema used by all other green dictionaries. The 6-tier map is preserved with identical slope values; only the distance keys are corrected to `startY`/`endY` so the gravity step-simulation engine and God Caddy brute-force loop can read the contours without a schema mismatch. Header bumped to v5.60.0.
- **3D-Aware Auto-Equip (`physics_core.js`):** Upgraded `window.autoEquipBestClub` to account for elevation. The function now reads `targetZ` and `ballZ` (with `typeof` guards for backward compatibility), calculates `elevationDiff = targetZ - ballZ`, and adds it directly to `distToTarget` to form `effectiveDistToTarget`. The club-selection loop then compares each club's `expectedDist` against `effectiveDistToTarget` rather than the flat 2D distance, causing the engine to automatically club down for severely downhill targets (e.g., The Sinkhole's −40y `pinZ`) and club up for elevated pins. `window.AG_VERSION` bumped to `"v5.60.0"`. Header bumped to v5.60.0.
- **Hole 8 Custom Ambient (`course_pasture.js`):** Updated Hole 8's `bgAmbient` and `bgAmbientPostGreen` from the generic `am_farm1.mp3` to the dedicated `am_farm1_sinkhole.mp3`, giving "The Sinkhole" its own distinct atmospheric audio identity. `loreName` confirmed as `"The Sinkhole"`. Header bumped to v5.60.0.

### v5.59.0 Engine Addendum (Hole 8: The Sinkhole & The Swirling Moat)
- **Green Topography (`data_ag.js`):** Injected `"The Swirling Moat"` into `window.greenDictionary`. A 6-tier radial contour map using the `maxDist` distance schema. From the cup outward: Center Dome (0–10y, steep uphill climb with a slight fade), Flat Ring (10–13y, dead-flat relief zone), Moat Exit (13–16y, uphill and pushes right), Moat Entry (16–19y, downhill and pulls hard left — the trench itself), Outer Slope (19–35y, mild climb from the edge), and a Fallback tier (35y+). Header bumped to v5.59.0.
- **Hole 8 Data (`course_pasture.js`):** Injected a fully structured Hole 8 object between the explicit Hole 7 entry and the `Array.from` filler block. Par 3, 195 yards, `pinZ: -40` (40-yard sunken crater), `greenRadius: 35`, `greenType: "The Swirling Moat"`, `fairwayWidth: 80` (the crater's total width), `loreName: "The Sinkhole"`. Full lore description explains the forced carry to a below-grade green and the funnel mechanic. Audio paths (`mu_pasture8.mp3`, `am_farm1.mp3`) follow established convention. The `Array.from` filler length reduced from 11 to 10 to maintain the 18-hole total. Header bumped to v5.59.0.
- **The Sinkhole Funnel Interceptor (`physics_collisions.js`):** Injected a `// v5.59.0 The Sinkhole Funnel` block at the end of `window.resolveHazardLie`, immediately before the `return`. On The Pasture Hole 8, if the ball misses the 35-yard green but lands within the 80-yard crater wall, `currentLie` is set to `"Rough"` and a narrative is appended. The ball is then pulled laterally toward center (`ballX *= 0.2`) and shoved 25 yards vertically toward the pin. A final distance check re-caps funnel overshoots to `35.1y` from the pin and upgrades the lie to `"Fringe"`, guaranteeing a clean chip-out opportunity from the green's edge. Header bumped to v5.59.0.

### v5.58.0 Engine Addendum (Restored Hole 7 Goat Distraction Mechanic)
- **`window.audioGoatInterrupts[1–3]` restored (`audio_core.js`):** Three preloaded `HTMLAudioElement` instances (`audio/courses/pasture/goat_interrupt[1-3].mp3`) re-injected into `audio_core.js` immediately above the `v5.56.0 UNIFIED CUSTOM DUCK LOGIC` block. Array is populated via a `for` loop (i = 1 to 3) using `new Audio(...)`. Coexists with the unified duck system; the goat clips serve a distinct downswing-interrupt role on Hole 7.
- **`window.playGoatInterrupt()` restored (`audio_core.js`):** Randomly selects one clip from `window.audioGoatInterrupts`, resets `currentTime` to 0, and calls `.play()` with a silent `.catch` guard. `audio_core.js` header bumped to v5.58.0.
- **Downswing Goat Trigger version comment updated (`input_ag.js`):** The `// v5.53.0 Hole 7 Goat Interruption` comment immediately after the `startDownswing()` call in the `keyup` listener is updated to `// v5.58.0 Restored Hole 7 Goat Interruption`. Logic is unchanged: on The Pasture Hole 7, when the lie is not Green or Hole, `window.playGoatInterrupt()` fires on every downswing release, placing a goat bleat directly into the player's execution timing window as a psychological hazard. `input_ag.js` header bumped to v5.58.0.

### v5.56.0 Engine Addendum (Unified Mishap Audio & Dynamic TTS Yielding)
- **Marquis multi-array architecture removed (`audio_core.js`):** `window.audioMarquisLaughs`, `window.audioMarquisInsults`, `window.audioGoatInterrupts`, `window.playGoatInterrupt`, and `window.playMarquisSequence` are all deleted. Superseded by the unified duck system below.
- **`window.audioPastureDucks[1–12]` (`audio_core.js`):** New 12-file preloaded array for course-specific Pasture duck assets (`audio/courses/pasture/duck_pasture[1-12].mp3`). `window.activeDuckAudio` global tracks the currently playing duck element for the yield function.
- **`window.triggerDuckEvent()` (`audio_core.js`):** Single dispatch function. On Pasture Hole 7 (non-green), selects a random `audioPastureDucks` clip. On all other holes/courses, falls back to the existing `audioDuck` reference. Resets `currentTime` to 0 before play to allow rapid re-triggering without creating new `Audio` objects.
- **`window.waitForDuckToClear(callback)` (`audio_core.js`):** Attaches `onended` to `window.activeDuckAudio` if it is currently playing. Fires `callback` the exact moment audio ends. A `fired` boolean guard prevents double-invocation. A 15-second failsafe `setTimeout` guarantees `callback` fires even if `onended` is suppressed by the browser. If no duck is active or it has already ended, `callback` fires immediately.
- **Universal Mishap Trigger (`physics_core.js — calculateShot`):** The entire v5.53.0 / v5.54.0 Marquis intercept block (branching on course name, hole number, `marquisActiveOnShot` flag, and inline duck construction) is replaced with a single two-line guard: `if (accuracyScore < 80 && !quick) window.triggerDuckEvent()`. All course-routing logic now lives exclusively in `audio_core.js`.
- **`window.marquisActiveOnShot` flag retired (`physics_core.js`):** The reset line and all conditional branches referencing this flag are removed. The caddy yield is now stateless.
- **Dynamic Caddy Yield (`physics_core.js — calculateShot announce callback`):** The v5.54.0 `marquisActiveOnShot` three-branch handoff is replaced with a two-branch `waitForDuckToClear` call. If the function is available, the caddy panel and ARIA announce fire inside its callback — guaranteed to land after the duck audio ends. Fallback path fires immediately. Both branches respect the `pacingModes[pacingModeIndex] === 'Simulate'` suppression check. `physics_core.js` header and `window.AG_VERSION` bumped to v5.56.0. `audio_core.js` header bumped to v5.56.0.

### v5.54.0 Engine Addendum (Marquis Dynamic Handoff & Hole 7 Ambient Audio)
- **Hole 7 ambient audio linked (`course_pasture.js`):** Injected `bgMusic: 'audio/courses/pasture/mu_pasture7.mp3'`, `bgAmbient: 'audio/courses/pasture/am_farm1_goats.mp3'`, and `bgAmbientPostGreen: 'audio/courses/pasture/am_farm1.mp3'` into the Hole 7 object. The goat ambient plays for the full duration of the hole; the clean farm ambient hot-swaps in via the existing `bgAmbientPostGreen` mechanism once all players are on or past the green. `course_pasture.js` header bumped to v5.54.0.
- **`window.playMarquisSequence(onComplete)` refactored (`audio_core.js`):** The function now accepts an optional `onComplete` callback. The entire sequence is wrapped in a 1000ms initial `setTimeout` to give the shot's execution audio a moment to settle. Inside the sequence, `insultAudio.onended` is used to trigger `onComplete` the exact millisecond the insult clip finishes playing. A 10-second failsafe `setTimeout` is registered to fire `onComplete` and null out `insultAudio.onended` in case the `onended` event does not fire (e.g., browser audio policy, missing asset). If the insult `Audio` element is absent, `onComplete` fires immediately. `audio_core.js` header bumped to v5.54.0.
- **Duck intercept simplified (`physics_core.js — calculateShot`):** The `window.playMarquisSequence()` direct call is removed from the duck penalty block. The block now only sets `window.marquisActiveOnShot = true`; the sequence is driven entirely by the caddy handoff below.
- **Hardcoded 12-second Marquis delay removed (`physics_core.js`):** The `Math.max(delayAnnounceMs, 12000)` block from v5.53.0 is deleted. `delayAnnounceMs` is no longer inflated for Marquis shots.
- **Dynamic Caddy Handoff injected (`physics_core.js — announce setTimeout`):** Inside the existing `stateTimeouts` announce callback, the direct `window.announce` / `window.setCaddyPanelText` calls are replaced with a three-branch conditional. If `marquisActiveOnShot` is true and not a sim, `window.playMarquisSequence` is called with the announce+caddy block as its `onComplete` callback — the Caddy report fires the exact moment the insult finishes. If `playMarquisSequence` is unavailable, the caddy fires immediately as a fallback. Non-Marquis shots follow the unchanged direct-call path. `window.marquisActiveOnShot = false` is always reset inside the branch that fires last. `physics_core.js` header and `window.AG_VERSION` bumped to v5.54.0.

### v5.53.1 Engine Addendum (Hole 7 Lore Injection — Revenge of the Marquis)
- **Hole 7 ejected from filler array (`course_pasture.js`):** Hole 7 was previously a generic filler entry generated by the 12-element `Array.from` block. It is now a standalone explicit object. The `Array.from` length is reduced from `12` to `11` to maintain the 18-hole total. All physics properties (`par: 4`, `distance: 400`, `greenRadius: 12`, `pinX: 0`, `pinY: 400`, `hazards: ['sand']`, `zones`) are identical to the former filler — no gameplay values were altered.
- **Hole 7 lore injected (`course_pasture.js`):** `loreName` set to `"Revenge of the Marquis"`. `description` set to the full Fight Club / Dusty Farts podcast flavour text establishing the premise of the Marquis of Sheepsberry Hill's goat-based psychological revenge. This description is pulled by `KeyF` (Fairway Description) and the Caddy's hole-intro broadcast on `loadHole`.
- **`course_pasture.js` header bumped to v5.53.1.**

### v5.53.0 Engine Addendum (Revenge of the Marquis — Hole 7 Psychological Hazards)
- **Marquis Asset Arrays (`audio_core.js`):** Three preloaded `HTMLAudioElement` arrays injected into `audio_core.js` immediately before the Environmental Audio block: `window.audioGoatInterrupts[1–3]` (`audio/courses/pasture/goat_interrupt[1-3].mp3`), `window.audioMarquisLaughs[1–8]` (`audio/bots/marquis_laugh[1-8].mp3`), and `window.audioMarquisInsults[1–12]` (`audio/bots/marquis_insult[1-12].mp3`).
- **`window.playGoatInterrupt()` (`audio_core.js`):** Randomly selects and plays one goat interrupt clip from the preloaded array.
- **`window.playMarquisSequence()` (`audio_core.js`):** Randomly selects a laugh clip and fires it immediately, then uses a `setTimeout` of 5000ms to fire a randomly chosen insult — accounting for the laugh clip's full duration before the verbal attack lands.
- **Downswing Goat Trigger (`input_ag.js`):** Injected immediately after the `startDownswing()` call in the `keyup` listener. When The Pasture Hole 7 is active and the ball is not on the Green or in the Hole, `window.playGoatInterrupt()` fires on every downswing initiation, placing a goat bleat directly into the player's execution timing window as a psychological hazard.
- **Marquis Duck Intercept (`physics_core.js — calculateShot`):** `window.marquisActiveOnShot` is reset to `false` before the v5.8.0 duck penalty block on every shot. When `accuracyScore < 80`, the code now checks if The Pasture Hole 7 is active. If true, the standard duck sound is suppressed and `window.playMarquisSequence()` fires instead, with `window.marquisActiveOnShot` set to `true`. All other holes continue to trigger the standard duck.
- **12-Second Caddy Delay (`physics_core.js — calculateShot`):** Immediately after the `delayAnnounceMs` scoring-jingle computation in the non-hole-complete fairway branch, a guard checks `window.marquisActiveOnShot`. If active, `delayAnnounceMs` is raised to `Math.max(delayAnnounceMs, 12000)`, ensuring the screen reader's Caddy report cannot interrupt the 5-second laugh + 5-second insult sequence. `window.marquisActiveOnShot` is reset to `false` inside the announce callback after the Caddy fires.
- **Headers bumped to v5.53.0:** `audio_core.js`, `input_ag.js`, `physics_core.js` (including `window.AG_VERSION`).

### v5.52.0 Engine Addendum (8-Bit Audio Balancing)
- **8-Bit Melody Volume Dampener (`window.playScoringAudioSequence`, physics_core.js):** Applied a global 0.60× dampener to the `melodyAudio.volume` assignment inside `window.playScoringAudioSequence`. The melody `Audio` node now plays at `vol * 0.60` (down from `vol * 0.8`), reducing the peak level of all three 8-bit end-of-hole jingles — `8bit_triumph`, `8bit_neutral`, and `8bit_sadness` — to 60% of the ambient volume level. This ensures the synthesized scoring assets no longer overpower the screen reader's spoken score announcement (`score_eagle`, `score_birdie`, etc.) that fires 5 seconds later. Voice callout volume remains at `vol` (unchanged).
- **`audio_core.js` header bumped to v5.52.0.**

### v5.51.0 Engine Addendum (Input Cooldown Failsafe & Swing Watchdog)
- **Failsafe Variables (`input_ag.js`):** Three globals injected at the very top of `input_ag.js`, above all function definitions: `window.isSwingInitializing` (bool, default `false`) locks the input channel the moment a backswing is requested; `window.swingCooldownEnd` (timestamp, default `0`) blocks new swing attempts until the audio clearance delay has passed; `window.previousSwingState` (int, default `0`) is the Watchdog's memory register, tracking the last-known `swingState` to detect state transitions.
- **The Watchdog (`input_ag.js`):** A `setInterval` polling at 50ms is injected immediately after the failsafe variables. On every tick it compares the live `swingState` against `window.previousSwingState`. When a transition from **any non-zero state → 0** is detected (i.e., the swing pipeline has fully resolved), it sets `window.swingCooldownEnd = performance.now() + 800`, enforcing an 800ms audio clearance window. `window.previousSwingState` is then updated to the current state for the next tick.
- **ArrowDown Lock (`input_ag.js`):** The `if (swingState === 0) startBackswing(false);` single-liner is replaced with a guarded block. If `performance.now() < window.swingCooldownEnd` (cooldown active) or `window.isSwingInitializing` (initialization in-flight), the handler returns immediately. Otherwise it sets `window.isSwingInitializing = true`, schedules a 300ms `setTimeout` to clear it, then calls `startBackswing(false)`. The `else if (swingState === 4)` branch is preserved inline.
- **ArrowUp Lock (`input_ag.js`):** Identical guarded block applied to the `if (swingState === 0) startBackswing(true);` path. The `else if (swingState === 4)` practice-swing impact branch is preserved inline.

### v5.50.0 Engine Addendum (Version Sync & Oracle Focus Synchronization)
- **Version Centralization (`physics_core.js`):** Injected `window.AG_VERSION = "v5.50.0"` immediately after the file header comment. This establishes a single, machine-readable source of truth for the engine version accessible from any module.
- **Dynamic Telemetry Header (`input_ag.js`):** The `Shift + C` Master Telemetry Dump no longer uses a hardcoded version string. The `# MATCH SETTINGS` block is now built as a single `let header = ` template literal that reads `${typeof window.AG_VERSION !== 'undefined' ? window.AG_VERSION : 'Unknown'}`, ensuring exported match logs always reflect the true engine version. The `courseName`, `windName`, `tgMode`, and `roughName` intermediate variables are removed; the header now reads directly from `window.currentCourse.name`, `windLevels[wizardWind].name`, `window.tournamentGreens`, and `roughConditions[roughConditionIndex].name`.
- **Oracle Focus Synchronization — `getOracleBlueprint` (`physics_core.js`):** The AI Brain's fairway simulation loop now accurately predicts and applies the active player's Focus Index distance multiplier. A `baseCarry` variable is introduced, followed by the "Focus Anticipation" block: Woods and Drivers default to Power Focus (×1.10) when the target exceeds 250 yards, otherwise Accuracy. All other clubs default to Accuracy. If the active player is a Bot with `focusIndex === 1` (Power), the Power modifier is forced, overriding the distance check. `totalDist` now derives from `baseCarry` rather than `simClub.baseDistance` directly. The duplicate `pName` declaration later in the same loop is removed and unified with the new declaration at the top of the `simStance` block.
- **Oracle Focus Synchronization — `getCaddyAdvice` (`physics_core.js`):** The Fairway Oracle's `simulatedClubs.forEach` simulation loop receives the identical Focus Anticipation treatment (without the bot-override line), ensuring the human caddy's club recommendations account for the +10% distance buff on Power Focus long irons and woods.

### v5.48.1 Engine Addendum (Clubhouse UI Roster Sync — Tour Pro Tier)
- **Tour Pro manual selection menu updated (ui_ag.js):** The `clubhouseState === 'roster_bot_tour'` block in `window.buildClubhouseMenu` is rebuilt to reflect the v5.48.0 roster change. Bot Woods and Bot Strickler entries are removed. **Tour-Pro Ted is retained.** The four new/updated Tour Pro legends are now selectable with their subtitle nicknames: **Tour-Pro Ted**, **Bot Rory (The Bomber)**, **Bot Golden Bear (The Tactician)**, **Bot Lefty (The Thrill)**, and **Bot Seve (The Magician)**. Each entry injects the correct `iBias`/`hBias`/`focus` profile and returns the player to the Roster screen via `clubhouseState = 'roster'`. The "Back (Escape)" option now correctly resets `clubhouseIndex = 0` (was `2`) for consistent navigation alignment. Header bumped to v5.48.1.

### v5.48.0 Engine Addendum (Tour Pro Roster Update — The Belfast Reel & The Flamenco)
- **Bot Woods and Bot Strickler retired from the Tour Pro roster.** Both profiles are removed from the `Shift + K` Foursome Quick-Load macro in `input_ag.js` and from the AI Personality Math block in `physics_core.js`.
- **Bot Rory — "The Belfast Reel" (input_ag.js, physics_core.js, audio_core.js):** New Tour Pro profile. `iBias: -15`, `hBias: 12`, `focus: 1` (Power). **AI Logic:** Receives a −35 `adjustedMiss` bonus when the Driver is selected (aggressively bombs off the tee). Receives a +20 `adjustedMiss` penalty for Flop shots (`sIdx === 3`), keeping him honest around the greens. **Audio Signature (`playBotRorySignature`):** A 16-note, D-major reel built from 8 repeating notes (`[293.66, 329.63, 369.99, 293.66, 392.00, 369.99, 329.63, 293.66]` Hz) alternating `square`/`sine` oscillators at 0.15s intervals.
- **Bot Seve — "The Flamenco" (input_ag.js, physics_core.js, audio_core.js):** New Tour Pro profile. `iBias: -10`, `hBias: 0`, `focus: 5` (Recovery). **AI Logic:** Receives a −40 `adjustedMiss` bonus for both Flop (`sIdx === 3`) and Pitch (`sIdx === 1`) shot styles — a massive creativity multiplier that forces the Oracle to attack pins with imagination around the green. **Audio Signature (`playBotSeveSignature`):** A descending 8-note `triangle` run from E5 to E4 (`[659.25, 587.33, 523.25, 493.88, 440.00, 415.30, 349.23, 329.63]` Hz) at 0.12s intervals, resolving into a 3-voice E-minor chord that sustains for ~1 second.
- **`playBotWoodsSignature` deleted (audio_core.js):** The synthesized sawtooth roar function is removed and replaced entirely by the two new signatures above.
- **Signature trigger updated (main_ag.js):** The `advanceTurn` Bot-turn announcement block now checks `pName === "Bot Rory"` → `playBotRorySignature()` and `pName === "Bot Seve"` → `playBotSeveSignature()`. All other players (including bots) fall back to the `ui_nav_07` blip.
- **Updated `Shift + K` Tour Pro Foursome Roster:** Bot Rory, Bot Golden Bear, Bot Lefty, Bot Seve. Headers bumped to v5.48.0 across `input_ag.js`, `physics_core.js`, and `audio_core.js`.

### v5.47.2 Engine Addendum (End-of-Loop Putting Blindspot Fix)
- **Final Resting Spot Check injected in all three putting simulators (physics_core.js):** The step-based putting `while` loop exits when `speedRemaining <= 0`, but the capture radius check (`currentDistToHole <= captureRadius && speedRemaining <= captureSpeedLimit`) only fires *inside* the loop — so a ball that decelerates to rest exactly on or inside the hole during the final step's deceleration would be missed. After each `while` loop closes, a post-loop guard is now injected: if `!madeIt`, recompute `finalDistToHole` from `simX/simY` and check against `captureRadius`/`activeHoleRadius` and `captureSpeedLimit`. Applied to: (1) the live `calculateShot()` putting block (adds `playbackArray` entry with `madeIt: true`), (2) `window.getCaddyAdvice()` Putting Oracle inner loop, (3) `window.getOracleBlueprint()` putting branch inner loop. Header bumped to v5.47.2.

### v5.47.1 Engine Addendum (autoSetFocus Override Bug Fix)
- **`autoSetFocus(true)` → `autoSetFocus()` in PageUp/PageDown listeners (input_ag.js):** Both club cycle handlers were passing `isPuttingOverride = true`, which forced Touch Focus regardless of lie or distance whenever the player manually cycled clubs. Since the green-entry trigger already passes `true` explicitly, the cycle listeners should use the default (`false`) so contextual rules (Power, Accuracy, Recovery) are applied correctly on fairway and approach shots. Header bumped to v5.47.1.

### v5.47.0 Engine Addendum (Contextual Auto-Focus System)
- **`window.autoSetFocus(isPuttingOverride)` built and integrated (physics_core.js):** New function defined immediately after `window.autoEquipBestClub`. Applies a priority-ordered focus selection: (1) **Putting Override** — if called with `true`, or if `isPutting` is set, or lie is `"Green"`, sets `focusIndex = 2` (Touch); (2) **Short Game** — distance to target < 50y → Touch; (3) **Trouble Lies** — Sand, Rough, Pine Needles, Mud, Packed Earth → `focusIndex = 5` (Recovery); (4) **Club-Specific** — Woods/Driver: Power (`focusIndex = 1`) if beyond 3-Wood max range, else Accuracy (`focusIndex = 4`); Irons/Wedges → Accuracy; (5) **Fallback** → `focusIndex = 0` (Standard).
- **Auto-Focus triggered on `autoEquipBestClub` (physics_core.js):** `window.autoSetFocus()` injected immediately before `window.updateDashboard()` in `window.autoEquipBestClub`, so every auto-club selection also recalculates the optimal focus.
- **Auto-Focus already wired to PageUp/PageDown and green entry (physics_core.js / input_ag.js):** Existing `autoSetFocus(true)` call sites (putting entry trigger at line ~105, PageUp/PageDown club cycle handlers) now resolve against the new definition. `input_ag.js` header bumped to v5.47.0.

### v5.46.2 Engine Addendum (Shadow Origin Bug Fix in Proximity Reporter)
- **Landing position origin corrected (physics_core.js):** The proximity reporter's `landX`/`landY` calculation was using `(ballX - moveX)` / `(ballY - moveY)` as the shot origin — a "shadow" coordinate derived by subtracting the current delta from the already-mutated `ballX`/`ballY`. Because `ballX`/`ballY` undergoes hazard resolution, tree collision, and absolute resync after `moveX`/`moveY` is applied, this back-calculation produced a subtly wrong origin whenever any of those mutations occurred. Replaced with the pre-captured `startX`/`startY` constants (set before all ball movement) so `landX = startX + (sin(finalRad) * carryDistance ...)` is always computed from the true shot origin.

### v5.46.1 Engine Addendum (Relative Proximity Vector Math Fix)
- **Proximity block replaced with Dot/Cross Product projection (physics_core.js):** The legacy `landRelY = landY - pinY` / `landRelX = landX - pinX` (and matching `finalRelY`/`finalRelX`) used global absolute coordinates, meaning "Short/Long/Left/Right" labels were computed relative to an arbitrary world-space axis rather than the actual shot flight vector. Replaced with vector projection math: `vX/vY` is the pin-minus-origin shot vector; `landDot`/`landCross` and `finalDot`/`finalCross` are the dot and cross products of the ball displacement against that vector; `landRelY = (dot / vMag) - vMag` gives signed along-line offset (positive = long, negative = short) and `landRelX = cross / vMag` gives signed perpendicular offset (positive = right of flight, negative = left). This means proximity directions are now always described relative to the player's shot line regardless of course orientation.

### v5.46.0 Engine Addendum (Physics Desync Fix & Hole 6 Audio Polish)
- **`loftDistMod` formula synchronized to Oracle (physics_core.js):** The fairway shot `potentialDist` block was using a mismatched formula. `loftDistMod` was computed as `1 + ((stanceIndex - 2) * 0.03)` (a stance-index offset) instead of the correct `1 + ((26 - dynamicLoft) * 0.005)` (the loft-gap-from-26-degree baseline scaling used in `getSetupReport`, `getCaddyAdvice`, and `getOracleBlueprint`). This caused actual shot distances to drift from Oracle predictions as loft deviated from 26°. Now unified.
- **Rogue `hingeTimeBack` distance multiplier removed (physics_core.js):** `potentialDist` was multiplying by `(1 + (hingeTimeBack / 2000 * 0.15))`, meaning backswing hold time silently inflated carry distance by up to ~15% at 2000ms hold. This factor was never reflected in the Oracle or Setup Report. Removed entirely; power is now solely determined by `finalPower / 100`.
- **Hole 6 wind gust audio volume normalized (physics_core.js):** The `* 0.8` dampener on the Box Fan gust audio (`wind_gust*.mp3`) removed. Gust now plays at full ambient volume level, matching the intent for an aggressive environmental effect.

### v5.45.0 Engine Addendum (Short Game Overhaul — Tournament Greens, 5-Tier Magnetism, Chip-In Well)
- **Tournament Greens toggle replaces Stimp Speed (ui_ag.js, input_ag.js, main_ag.js):** `wizardStimp` and `window.stimpSpeed` fully retired. Replaced by `wizardTournamentGreens` (bool, default `false`) in `main_ag.js` declaration, save state, and load state. `ui_ag.js` clubhouse wizard settings now shows `Tournament Greens: ON (Stimp 13) / OFF (Stimp 10)` toggle item (action: `wizardTournamentGreens = !wizardTournamentGreens`). On "Start Round!" sets `window.tournamentGreens = wizardTournamentGreens`. `input_ag.js` Semicolon key handler now toggles `window.tournamentGreens` with visual feedback (`Trn Greens: ON/OFF`). Help text updated. Headers bumped to v5.45.0.
- **`effectiveStimp` injection (physics_core.js):** `let effectiveStimp = (typeof window.tournamentGreens !== 'undefined' && window.tournamentGreens) ? 13 : 10;` injected at the top of the `isPutting` block in `calculateShot()`, right after the bot `finalPower` lock. `stimpMod` now reads `effectiveStimp / 10` instead of the retired `window.stimpSpeed` reference.
- **`slopeDampener` forced to `1.0` (physics_core.js):** Previous ternary (`0.1` inside 3y, `0.35` inside 6y, `1.0` beyond) replaced with `let slopeDampener = 1.0; // v5.45.0 - Uncapped break`. Full break now applies at all putting distances.
- **5-Tier Touch Magnetism System (physics_core.js — putting block):** `tempoBonus` Touch Focus calculation replaced. Tier 1 (perfect: `absHinge <= p50`) → 4.0× standard / 1.5× Tournament. Tier 2 (moderate: `absHinge <= p150`) → 2.0× / 1.0×. Tier 3 (bad: `absHinge > p150`) → 0.5×. Default (non-Touch Focus) → 1.0×.
- **Tier 4 Chip-In Gravity Well (physics_core.js — shot block):** `const shotOriginDistToPin = calculateDistanceToPin()` captured immediately before `ballY += moveY` in the fairway shot section. In the Approach/Hole-Out block, `touchBonus` now checks `shotOriginDistToPin < 60 && accuracyScore >= 95 && Math.abs(hingeDiff) <= 15` first → 6.0× capture radius. Falls back to existing Touch Focus 3.0× logic otherwise.
- **Bot Pace Scatter on Tournament Greens (physics_core.js):** Right after `effectiveStimp` is declared, if `isBotTurn && effectiveStimp === 13` and the bot name contains "Bot", a ±8% pace error is applied: `finalPower = finalPower * (1 + (Math.random() - 0.5) * 0.16)`. Header bumped to v5.45.0.

### v5.44.2 Engine Addendum (Phantom Wind Desync Fix & Oracle gyroMod)
- **`ballX`/`ballY` absolute coordinate resync (physics_core.js):** After `totalDistance = carryDistance + rollDistance` is finalized and `startX`/`startY` are captured, a two-line absolute resync is injected: `ballX = startX + (Math.sin(finalRad) * totalDistance) + (Math.cos(finalRad) * lateralTotal) + lateralKickX;` / `ballY = startY + (Math.cos(finalRad) * totalDistance) - (Math.sin(finalRad) * lateralTotal) + lateralKickY;`. This replaces the accumulated delta-based ball position (which was subject to floating-point drift as various adjustments like elevation, driver penalty, wind, and hazard resolution mutate `carryDistance` after the initial `moveX`/`moveY` deltas were already applied) with a single deterministic recompute from the original shot origin.
- **`gyroMod` in `getCaddyAdvice` Fairway Oracle (physics_core.js):** Inside the `simulatedClubs.forEach` loop in Part 2, `let gyroMod = Math.max(0.6, Math.min(1.3, 1 - ((backspinRPM - 4000) / 10000)));` injected immediately after `backspinRPM`. `windForward` and `windCross` updated to `* gyroMod` — high-backspin clubs (wedges, short irons) now receive less wind displacement in the Oracle's recommendations, matching the real physics calculation.
- **`gyroMod` in `getOracleBlueprint` Silent AI Oracle (physics_core.js):** Inside the `simStance` power loop, `backspinRPM` and `gyroMod` injected immediately after `fractionalDist`. `windForward` and `windCross` updated to `* gyroMod`. Mirrors the getCaddyAdvice fix so bot AI wind compensation is equally accurate. Header bumped to v5.44.2.

### v5.44.1 Engine Addendum (Clipboard Fallback, Putting Shift+C, Telemetry Archiving Fix)
- **`window.copyToClipboard(text, successMsg)` helper (input_ag.js):** Injected before `window.confirmingUnplayable` at the top of the file. Attempts `navigator.clipboard.writeText` when running in a secure context; falls back to `document.execCommand('copy')` via a hidden `<textarea>` for local `file://` usage. All four `navigator.clipboard.writeText` calls in `input_ag.js` (Scorecard Master Dump, Scorecard Single Hole, `KeyN` post-round narrative, `KeyC` mid-hole telemetry) are replaced with `window.copyToClipboard(...)`.
- **Putting green `Shift+C` pass-through (input_ag.js):** The `KeyC` block inside the putting controls interceptor (`isPutting && swingState === 0`) previously fired `lastShotReport` unconditionally, swallowing all `Shift+C` requests while putting. Replaced with the full two-branch pattern: `e.shiftKey` → full `holeTelemetry` dump via `window.copyToClipboard`; no-shift → `lastShotReport` read-back.
- **`telemetryLog` archiving in `finishPutt` (physics_core.js):** The `roundData.push({...})` call inside `finishPutt` lacked a `telemetryLog` field, so the Scorecard's per-hole telemetry lookup always returned empty. `telemetryLog: (typeof holeTelemetry !== 'undefined') ? holeTelemetry.join('\\n\\n') : ""` injected into the push object, snapshotting the completed hole's full shot log at the moment the hole finishes. Headers bumped to v5.44.1.

### v5.44.0 Engine Addendum (F5/F6 Unlock, Mid-Hole Telemetry, Audio Cleanup on Quit)
- **F5/F6 browser key unlock (input_ag.js):** An early-return guard injected as the very first statement inside the main `keydown` event listener. If `e.code` is `'F5'` or `'F6'`, the handler returns immediately without calling `e.preventDefault()`, restoring native browser Refresh and Address Bar Focus. All other key processing is unaffected.
- **`Shift + C` mid-hole telemetry dump (input_ag.js):** The v5.40.2 single-report Shift+C block is replaced. The new logic first checks `holeTelemetry` (the live shot-log array for the current hole); if it has entries, it prefixes a `### HOLE N TELEMETRY SO FAR: Player` header and joins all shots with double-newlines for a full in-progress transcript. Falls back to the caddy panel text or `lastTimingReport` if `holeTelemetry` is empty. Announces "Current hole telemetry copied to clipboard." on success and "No telemetry available to copy." on empty. `return` added to prevent the non-shift branch from also firing.
- **`window.stopAllCourseAudio()` helper (physics_core.js):** New globally-exposed helper injected immediately before `window.playScoringAudioSequence`. Pauses and resets `currentTime` to 0 on `window.currentBgMusic`, `window.currentBgAmbient`, and `window.currentBgAmbientPost` if they exist, silencing all persistent audio loops on demand.
- **Audio cleanup on round quit (input_ag.js):** `window.stopAllCourseAudio()` injected into both quit paths inside the `confirmingQuit` block: the `KeyS` (Save & Quit) path immediately before `gameMode = 'clubhouse'`, and the `KeyA` (Abandon) path likewise. Ensures music and ambient loops do not continue playing in the background after the player returns to the clubhouse menu. Headers bumped to v5.44.0.

### v5.43.1 Engine Addendum (Hole 6 Crash Fix — totalDistance Scope & Divergent Wind Recalibration)
- **`window.applyDivergentWind()` helper (physics_core.js):** New globally-exposed helper injected immediately after `SHOT_RECOVERY_TIMEOUT_MS`. Performs a full null-safe Hole 6 guard (`typeof gameMode/hole/currentLie !== 'undefined'`) before recomputing the radial 15 mph divergent wind vector from the windmill origin `(0, 395)`. Centralises the wind recalibration logic so all callers share a single, safe implementation.
- **`calculateShot` recalibration (physics_core.js):** `window.applyDivergentWind()` injected as the very first statement in `calculateShot`, ensuring `windX`/`windY` are correct for the wind report embedded in shot telemetry and the `getWindReport()` call at the start of each shot.
- **`getSetupReport` recalibration (physics_core.js):** `window.applyDivergentWind()` injected at the top of `getSetupReport`, ensuring the pre-shot bag check reads the live divergent wind.
- **`KeyW` read-wind recalibration (input_ag.js):** In the non-shift `KeyW` branch, `window.applyDivergentWind()` is called immediately before `getWindReport()`. Pressing W on Hole 6 now returns the live radial gust rather than a stale value. Header bumped to v5.43.1.
- **Wind gust audio crash fix — `totalDistance` scope (physics_core.js):** The v5.43.0 gust audio block was injected before `let totalDistance` was declared, causing a silent ReferenceError crash that aborted the entire shot pipeline. Block removed from the early `accuracyScore` / high-accuracy-strike section and re-injected after the full hazard-resolution pipeline (`totalDistance = hazardResult.totalDistance`) — specifically just after the stat-tracking block, immediately before `"Ball is in the air..."`. Guard updated to include `typeof totalDistance !== 'undefined'`. Header bumped to v5.43.1.

### v5.43.0 Engine Addendum (Clifford's Box Fan — Hole 6, Divergent Wind Field & Gust Audio)
- **`window.greenDictionary["The Egg"]` (data_ag.js):** New three-zone green contour. Zone 1 (35→25y): massive false front, `slopeY -0.6`. Zone 2 (25→10y): left-to-right feed, `slopeX 0.2 / slopeY 0.1`. Zone 3 (10→0y): narrow back, right-to-left drain, `slopeX -0.3 / slopeY 0.2`. Header bumped to v5.43.0.
- **The Pasture Hole 6 "Clifford's Box Fan" (course_pasture.js):** Par 4, 380 yards. `greenType: "The Egg"`, fairwayWidth 45, greenRadius 16. Single wrap-around catch-bunker at 400y (60y wide, offset 0, depth 20) to punish any long approach. Two landing zones: "Fight the Wind" (220y) and "Aggressive Approach" (280y). Ambient: `am_farm1_windmill.mp3` → post-green `am_farm1.mp3`. Filler holes trimmed from 13 to 12 to maintain 18-hole total. Header bumped to v5.43.0.
- **Divergent Wind Field — `generateWind` interceptor (physics_core.js):** At the top of `generateWind`, a Hole 6 guard fires when `gameMode === 'course'`, course is The Pasture, `hole === 6`, and `currentLie` is not Green or Hole. Computes a radial direction vector from the ball to the windmill origin `(0, 395)`, normalises it, and sets `windX/windY` to 15 mph outward. Returns early, bypassing the normal random generation. Ensures wind resets correctly to the divergent model after each shot.
- **Divergent Wind Field — `driftWind` interceptor (physics_core.js):** Identical guard at the top of `driftWind`. Recomputes the radial 15 mph divergent vector live on every drift tick (wind follows the ball's position in real-time). Calls `window.updateDashboard()` after setting to keep the HUD reading current. Returns early to suppress normal drift variance.
- **Wind Gust Audio trigger (physics_core.js):** Below the v5.9.0 high-accuracy iron/wood block in `calculateShot`, a Hole 6 guard fires when `totalDistance > 25`, `currentLie !== "Green"`, and `!quick`. Picks a random `wind_gust1–6.mp3` from `audio/swings/`, volumes it at ambient level × 0.8, and schedules it 600 ms after impact via `stateTimeouts` to play behind the execution ping. Header bumped to v5.43.0.

### v5.42.2 Engine Addendum (Pin Finder Scope Fix & Pasture Green Contours)
- **`window.greenDictionary` global scope fix (physics_core.js, input_ag.js):** The v5.30.0 module split introduced a silent failure: `greenDictionary` was defined as `window.greenDictionary` in `data_ag.js` but accessed as a bare identifier in all consumer files. This caused every green-contour lookup (Pin Finder Oracle, Caddy Advice, Silent Oracle, calculateShot kick physics) to fall through silently. All `typeof greenDictionary !== 'undefined'` guards and `greenDictionary[...]` accesses in `physics_core.js` (5 sites: `calculateShot` topography kick, gravity step simulation, `getCaddyAdvice` putting oracle, `getOracleBlueprint`) and `input_ag.js` (2 sites: `KeyB` green reading, Pin Finder grid init) replaced with explicit `window.greenDictionary` references. `input_ag.js` guard pattern updated to `window.greenDictionary && window.greenDictionary[holeData.greenType]` for consistency. Headers bumped to v5.42.2.
- **The Pasture Holes 1–3 green contours (course_pasture.js):** `greenType` property injected into the three previously-uncontoured holes. Hole 1 ("Clifford's Shortcut") → `"The Welcoming Bowl"`. Hole 2 ("The Bovine Bounce") → `"Back-to-Front"`. Hole 3 ("Foul Plate") → `"The False Front"`. Header bumped to v5.42.2.

### v5.42.1 Engine Addendum (Sadness Tier & Melody Volume Mixing)
- **Three-tiered emotional scoring audio (`window.playScoringAudioSequence`, physics_core.js):** The two-branch triumph/neutral split is replaced with a full three-branch `if/else if/else` on `diff`. Under-par → `8bit_triumph1–6` grab-bag (unchanged). Par exactly → `8bit_neutral1–6` grab-bag (expanded from 5 to 6 files). Over-par → new `8bit_sadness1–6` grab-bag via `window.sadnessSounds` using the same shuffle-and-pop-with-refill pattern. The `isTriumph` intermediate variable is removed; all three tiers read directly from `diff`.
- **80% melody volume mix (physics_core.js):** The melody `Audio` node now plays at `vol * 0.8` instead of `vol`, ducking the 8-bit jingle 20% below the voice callout level so spoken score names (`score_eagle`, `score_birdie`, etc.) cut through clearly. Voice volume remains at `vol`.
- **`window.neutralSounds` pool expanded:** Pool initialiser updated from `[1,2,3,4,5]` to `[1,2,3,4,5,6]` matching the new file count. Header bumped to v5.42.1.

### v5.42.0 Engine Addendum (Theatrical Scoring Audio, Cup Physics Sounds & Delayed TTS)
- **`window.playScoringAudioSequence(strokes, par, vol)` (physics_core.js):** New shared helper injected immediately above `window.initPutting`. On hole completion, plays a grab-bag melody (`8bit_triumph1–6` for under-par, `8bit_neutral1–5` for par/over) immediately, then schedules a named voice callout (`score_eagle/birdie/par/bogey/dbogey/tbogey/know`) 5 seconds later via `stateTimeouts`. Returns `7500` — the total millisecond delay callers should apply before firing TTS/advance-turn. Both grab-bags use the shuffle-and-pop-with-refill pattern used throughout The Pasture.
- **`finishPutt` cup grab-bag (physics_core.js):** Removed legacy `window.playGolfSound('score_02')` and `playTone` fallback. Replaced with cup grab-bag: `cupSounds` array of `cup1–6`, shuffled and popped, plays `audio/swings/${cupFile}.mp3` at the current ambient volume. Triggered inside `if (!quick)`.
- **`finishPutt` delayed TTS (physics_core.js):** The end of `finishPutt` now computes `delayAnnounceMs` (0 if miss, 7500 if hole complete). `window.announce(broadcast)` and the visual output update are moved into a `setTimeout(..., delayAnnounceMs)`. The existing `advanceTurn` / putting-reset timeout is bumped to `3000 + delayAnnounceMs`. The "Targeting Mode active." string in the putting-mode reset is trimmed to "Resetting ball to N yards." matching the mission spec.
- **Fairway hole-out cup audio (physics_core.js):** Inside the `if (finalDistToPin <= captureRadius && accuracyScore >= 90)` block in `calculateShot`, the same cup grab-bag logic is injected immediately after `currentLie = "Hole"`, inside `if (!quick)`.
- **Fairway `isHoleComplete` block refactored (physics_core.js):** Removed legacy `playGolfSound`/`playTone` scoring-chord cascade. Replaced with `delayAnnounceMs = window.playScoringAudioSequence(...)`. `completionMessage` assignment, `holeTelemetry.push`, and `setCaddyPanelText` are now moved inside a `setTimeout(..., delayAnnounceMs)`. `advanceTurn()` is likewise deferred via a separate `setTimeout(..., delayAnnounceMs)`.
- **Auto-Gimme/Max Score inner `setTimeout` refactored (physics_core.js):** After the Auto-Gimme and Auto-Max Score rules logic, `delayAnnounceMs` is computed (0 if not hole-complete). The `document.getElementById / announce / lastShotReport / setCaddyPanelText` block is wrapped in `stateTimeouts.push(setTimeout(..., delayAnnounceMs))`. The `initPutting + advanceTurn(true)` transition timeout is bumped to `3500 + delayAnnounceMs`; the fairway `advanceTurn()` timeout to `4000 + delayAnnounceMs`. Header bumped to v5.42.0.

### v5.41.0 Engine Addendum (Hole 5 "The Pecking Order" + Packed Earth Terrain)
- **`data_ag.js` — Turtleback green contour:** Added `window.greenDictionary["Turtleback"]` (no "The" — distinct from the existing `"The Turtleback"` entry). Three zones: steep front-tier fall-away (slopeY -0.4), flat crown (0.0), steep back-drop (slopeY +0.5). Header bumped to v5.41.0.
- **`courses/course_pasture.js` — Hole 5 "The Pecking Order":** Par 4, 460 yards. Dogleg-right bending around Clifford's chicken coop (tree radius 15, height 40y at x:25, y:260). Bunker at 440y, Chicken Flock and Free-Range Flock hazards. Two landing zones: Safe Left Fairway and Aggressive Corner Cut. Green type: `"Turtleback"`. Filler holes trimmed from 14 to 13. Header bumped to v5.41.0.
- **`physics_collisions.js` — Packed Earth terrain override (getTerrainAt):** For Hole 5 of The Pasture, any Rough or Light Rough classification is remapped to `"Packed Earth"` before `return terrain`. Mirrors the Hole 4 Mud override pattern. Header bumped to v5.41.0.
- **`physics_collisions.js` — Packed Earth roll bonus (resolveHazardLie):** Before the final `return` of `resolveHazardLie`, if `currentLie === "Packed Earth"`, `rollDistance` is multiplied by 1.5 and `totalDistance` is recomputed as carry + roll. Reflects hard-dirt extra bounce-and-run.
- **`physics_collisions.js` — Rooster mechanic expanded to Hole 5:** The Foul Plate Rooster block's condition is updated from `hole === 3` to `(hole === 3 || hole === 5)`. The rooster now menaces both the 17th-century shamble (Hole 3) and the pecking yard (Hole 5). Comment updated for clarity.
- **`physics_core.js` — Packed Earth in getSetupReport:** Packed Earth `else if` branch added after the Mud branch. Reports 95–100% distance range with "Hard, packed dirt." flavour text. Header bumped to v5.41.0.
- **`physics_core.js` — Packed Earth lie modifier in calculateShot:** `lieMod = 0.95–1.00`, `lieForgivenessMod = 0.85`. Near-full distance but smaller sweet spot (tight lie off baked ground).
- **`physics_core.js` — Packed Earth lieMultiplier in getCaddyAdvice:** `else if (currentLie === 'Packed Earth') lieMultiplier = 0.95;` added after the Pine Needles case, before the Rough block.
- **`physics_core.js` — Packed Earth lieMultiplier in getOracleBlueprint:** Same addition (lieMultiplier = 0.95) mirrored in the inner-loop `lieMultiplier` block inside `getOracleBlueprint`.

### v5.40.2 Engine Addendum (Mud Caddy Advice & Shift+C Clipboard Fix)
- **`getCaddyAdvice` Mud early-return (physics_core.js):** The Fairway Oracle's PART 2 simulation loop runs a full brute-force permutation across all clubs and stances before returning. On Mud, this was producing meaningless output because the `lieMultiplier` block had no Mud case — the Oracle was recommending normal clubs at full distance. A `currentLie === 'Mud'` guard is now injected immediately after the `const style = shotStyles[0]` line. It computes `baseCarry` from the active club's loft/distMod and returns a plain-English string ("Buried in thick mud. 100% power carries X to Y yards and stops dead. Massive dispersion expected.") before any simulation loop runs. Header bumped to v5.40.2.
- **`getSetupReport` Mud message expanded (physics_core.js):** The existing Mud branch in `getSetupReport` lacked the "Massive dispersion." qualifier, so the pre-shot readout was inconsistent with the `getCaddyAdvice` output. The return string is updated to include "Massive dispersion." between the yardage range and the Style/Focus fields.
- **`Shift + C` caddy panel targeting (input_ag.js):** The course-mode `Shift + C` handler was exporting raw `holeTelemetry` joined strings (physics debug data) instead of the human-readable post-shot Caddy Panel report. The export block is replaced: it now reads `document.getElementById('caddy-panel-text').innerText` first, falls back to `lastTimingReport` if the panel is empty, and copies only that string. Announces "Caddy shot report copied to clipboard." on success, or "No shot report available to copy." if both sources are empty. Header bumped to v5.40.2.

### v5.40.1 Engine Addendum (Mud Assignment Hotfix)
- **Root cause:** The v5.40.0 Mud terrain guard was injected into `window.getTerrainAt`, which is only called during the flight/carry phase. By the time `window.resolveHazardLie` runs its final lie resolution (AABB hazard loop → Water check → Green check), it reads the live `currentLie` variable directly — it does not re-call `getTerrainAt`. This meant balls landing outside the green on Hole 4 were classified as `"Fairway"` or `"Rough"` rather than `"Mud"`, and the roll-stop block that checked `currentLie === "Mud"` never fired.
- **Fix (physics_collisions.js):** Injected a `// v5.40.1 Floyd's Mud Override` block immediately after the `currentLie = "Green"` assignment, and immediately before the `if (currentLie === "Mud")` roll-stop block. It guards on `window.currentCourse.name === "The Pasture" && hole === 4 && currentLie !== "Green" && !inWater` and forcibly sets `currentLie = "Mud"` inside `resolveHazardLie`, ensuring the lie is correctly assigned at the authoritative moment regardless of what `getTerrainAt` returned. Header bumped to v5.40.1.

### v5.40.0 Engine Addendum (Floyd's Mud Bowl — Hole 4, Mud Physics, and Post-Green Ambient)
- **Hole 4 course data (course_pasture.js):** Added `Floyd's Mud Bowl` as Hole 4 of The Pasture. Par 3, 165 yards, massive `greenRadius: 35`. `greenType` is set to the new `"The Pig Tiers"` contour. There is no fairway — the entire surround is treated as Mud terrain. One spectating hazard object for Floyd (triggers physics-level skip via missing `depth`/`width` guardedness). The existing 15-hole filler array is trimmed to 14 to compensate. Header bumped to v5.40.0.
- **New S-curve green contour (data_ag.js):** Added `"The Pig Tiers"` to `greenDictionary`. Three tiers: a steep left-sweeping upper tier (45→25y, slopeX 0.8/slopeY 0.6), a hard counter-sweep middle tier (25→10y, slopeX −0.9/slopeY 0.3), and a mild right-feed bottom tier (10→0y, slopeX 0.6/slopeY −0.2). This creates the most severe S-break in the game. Header bumped to v5.40.0.
- **Mud terrain injection (physics_collisions.js):** `window.getTerrainAt` now appends a Pasture/Hole 4 override: any terrain that is not `"Green"` or `"Tee"` on Hole 4 of The Pasture is forcibly reclassified as `"Mud"`. This fires after the hazard AABB loop so Sand bunkers on other holes are unaffected. Inside `window.resolveHazardLie`, a post-resolution block checks `currentLie === "Mud"` and immediately sets `rollStopTriggered = true`, `rollDistance = 0`, and `totalDistance = carryDistance` — the ball buries on impact with no roll. Header bumped to v5.40.0.
- **Mud physics modifiers (physics_core.js):** `getSetupReport` returns a dedicated range string for `currentLie === 'Mud'` (50–70% distance, "Buried in thick mud."). Inside `calculateShot`, a new `else if (currentLie === 'Mud')` block applies: `lieMod = 0.5–0.7` (50–70% distance), `lieDispersionMod = 4.0` (4× scatter), `lieForgivenessMod = 0.4` (40% sweet spot), and `backspinRPM × 0.1` (kills all spin). Header bumped to v5.40.0.
- **Mud landing audio grab-bag (physics_core.js):** The `isWater` audio branch in `calculateShot` is extended to also handle `isMud`. When `isMud` fires, the engine draws from a 6-file grab-bag (`window.mudSounds`: `mud_rock_small1–6`), shuffles, pops, refills on empty, and routes the selected `.mp3` through an `AudioContext` `StereoPanner` at `endPan` for positional audio. Falls back to a plain `new Audio().play()` if `audioCtx` is unavailable. Roll time and `bounceSequenceMs` are zeroed identically to water. Asset paths: `audio/courses/pasture/mud_rock_small[1-6].mp3`.
- **`bgAmbientPostGreen` hot-swap (main_ag.js):** `window.advanceTurn` now evaluates `holeData.bgAmbientPostGreen` after the existing `bgAmbientPostTee` block. If all players are on the Green/Hole/isHoleComplete and the current ambient source does not already include the target filename, it swaps `currentBgAmbient` live. For Hole 4 this transitions from `am_farm1_pig.mp3` (Floyd chuffing nearby) to `am_farm1.mp3` (quiet farmyard) once everyone is safely on the green. Header bumped to v5.40.0.

### v5.38.0 Engine Addendum (Course Containment, Oracle Precision, Inventory UI)
- **Course-name guard on Pasture hazards (physics_collisions.js):** All three Pasture-specific hazard blocks (`// v5.34.5 Clifford's Tractor Reward`, `// v5.35.0 The Bovine Bounce`, `// v5.36.0 Foul Plate Roosters`) previously triggered on hole number alone, meaning they could fire on any course that happened to share hole-1, hole-2, or hole-3. Each block's `if` condition now opens with `window.currentCourse.name === "The Pasture" &&`, making them inert on every other course. Header bumped to v5.38.0.
- **Oracle aimDeg scientific-notation fix (physics_core.js):** The Oracle putting branch computed best aim angles at 0.2-degree resolution, which could produce floating-point residuals like `2.220446049250313e-16` when the straight-putt path was the winner. The raw `Math.abs(bestAim/safeAim)` interpolation is replaced with a two-variable formatter injected before the return string: `let absAim = Math.abs(...)` clamped by `absAim < 0.1 ? "aim straight"` and otherwise `absAim.toFixed(1)` to one decimal place. Both the make-path branch (bestAim found) and the lag-fallback branch (safeAim) are updated. Header bumped to v5.38.0.
- **Free Chicken inventory wired to M/G hotkeys (input_ag.js):** The `KeyM` handler now reads `p.earnedMulligans` at the top of the block (before the `wizardMulligans` flow). If the player holds an earned mulligan, `window.usingEarnedMulligan = true` is set, the confirmation prompt fires, and the handler returns early, bypassing the normal "Mulligans disabled / pre-shot check / 3-mulligan cap" gate. On confirmation, the earned item is decremented and announced; only the `wizardMulligans === 1` branch tracks `mulligansUsed`. The `KeyG` handler mirrors this pattern for `p.earnedGimmes` / `window.usingEarnedGimme`; if an earned gimme is available and the player is putting, the earned path fires first. The `confirmingGimme` confirmation block is updated to decrement `earnedGimmes` and announce the remaining count when `usingEarnedGimme` is truthy, or fall through to normal `gimmesUsed` tracking and the existing "Gimme taken." message otherwise. Header bumped to v5.38.0.

### v5.37.0 Engine Addendum (AI Brain & Oracle Simulation Overhaul)
- **Bot Putting Cursor Fix (main_ag.js):** The `if (isPutting)` block inside `window.takeAITurn` was rebuilt. The old logic snapped the cursor to `actualDist` (the raw hole distance) and back-calculated a fractional power value, which caused near-zero power outputs on short putts. The new logic reads the Oracle's `blueprint.pace` first, snaps `puttTargetDist` to that pace value (`Math.round(pace * 3) / 3`, minimum 1/3 ft), and then fires a clean flat `p.botPower = 100`. The bot now always swings at 100% against a correctly-positioned target cursor instead of attempting arithmetic power scaling.
- **Oracle Putting Resolution Upgrade (physics_core.js & physics_ag.js):** The sweep `for` loops inside both `window.getCaddyAdvice` (PART 1) and `window.getOracleBlueprint` (putting branch) were upgraded. Pace outer loop: step reduced from `0.25` to `0.33` yards, minimum floor tightened from `0.5` to `0.33`, upper bound extended from `distToPin * 2.5` to `distToPin * 3.0`. Angle inner loop: step reduced from `1` degree to `0.2` degrees. The finer 0.2-degree sweep gives the Oracle a 5× angular resolution improvement, eliminating missed lines on heavily-breaking putts.
- **Fairway Roll-Out Math Correction (physics_core.js & physics_ag.js):** The `* 0.8` dampener was removed from the `finalX` and `finalY` roll equations in both `window.getCaddyAdvice` (PART 2) and `window.getOracleBlueprint` (fairway branch). The dampener was an undocumented legacy artifact that caused the Oracle to consistently under-predict carry+roll total distance, leading to systematic over-club recommendations. Roll distance now applies at full face value.
- **Dynamic Rough Lie Penalty (physics_core.js & physics_ag.js):** The hardcoded ternary `lieMultiplier` in both `getCaddyAdvice` and `getOracleBlueprint` fairway branches was replaced with a dynamic block. Sand stays at 0.70. Pine Needles uses 0.90. Rough lies now read `roughConditionIndex` and `roughConditions[rIndex].penalty + 0.025` for a course-aware multiplier (fallback 0.875). This makes the Oracle's club selection respond correctly to per-course rough condition settings.
- **Headers bumped to v5.37.0:** `main_ag.js`, `physics_core.js`, `physics_ag.js`.