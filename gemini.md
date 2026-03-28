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