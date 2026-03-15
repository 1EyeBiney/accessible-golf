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