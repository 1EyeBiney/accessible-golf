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