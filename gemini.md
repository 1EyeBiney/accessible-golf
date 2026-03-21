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
### 28. v3.70 - v3.83 Engine Addendum (The Launch Monitor & Physics Parity)
- **The Parabolic Arc:** Tree/Obstacle clearance uses true parabolic projectile motion `(tan(loft) / carry) * dist * (carry - dist)`. The engine correctly penalizes distance and increases loft based on Stance Index.
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