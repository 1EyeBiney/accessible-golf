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