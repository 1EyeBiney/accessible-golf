# Current-state evaluation — v6.24.0 (2026-08-31)

Requested by Brian before starting career/tournament work: an honest assessment
of the game as it sits, with suggested game and mechanic improvements. Evidence
behind this document: a full 18-hole simulated bot round on The Holodeck Links
(4-bot roster, calm wind, standard settings, telemetry read from `players[]`),
a scripted human swing on the Holo Range with a timestamped log of every ARIA
announcement, a code review of the mechanic systems, and the open doubts in
`.temp.MD` (Brian's own notes).

## The short verdict

The core game is genuinely good. The swing is a real skill instrument with a
clear identity, the information architecture (layered caddy, hazard scans,
targeting, telemetry) is the strongest part of the design, and course
personality — especially The Pasture — is distinctive. Nothing below is a
teardown. But the evaluation found one load-bearing problem that would poison
tournaments and career mode if built on top of it, plus a set of feel and
learnability improvements worth doing while the fix is in.

---

## Tier 1 — Balance and correctness (prerequisites for career/tournaments)

### 1. The bot scoring ladder is broken (measured, not suspected)

Full 18 on Holodeck Links (par 72):

| Bot | Skill tier | Score | Detail |
|---|---|---|---|
| Mulligan Moe | 1 (Amateur) | 79 (+7) | 4 birdies, 5 bogeys, 3 doubles |
| **Mendi Dart** | 2 (Amateur+) | **60 (−12)** | 12 birdies, 6 pars, zero bogeys |
| **Fallon the Blade** | 2 (Amateur+) | **61 (−11)** | 13 birdies |
| Bill the Legend | 1 (Amateur) | 70 (−2) | before any God Mode |

A 60 is a course record anywhere on Earth; the PGA Tour scoring average is
about 71. Two "amateur" bots beat that by double digits, and zero-bias skill-1
Bill beat par — falsifying his design premise ("organically trails the human").
Only Moe, who carries huge iBias/hBias values, actually plays like an amateur.

Root causes to investigate, in likelihood order:
- The v6.12 **sniper clamps** (Mendi: ±5ms in the 20–100y wedge zone; Fallon:
  ±5ms with 4/5/6-iron) override the skill-2 forced-miss deadzone (≥25ms) in
  exactly the scoring zones — near-perfect approaches all day. The v5.3.1 bot
  nerf ("curbing robotic proximity") is bypassed for these two.
- **Bot putting may be near-automatic**: bots putt from the Oracle blueprint
  with skill-based botImpact/botHinge rolls; Mendi's zero-bogey card suggests
  the miss rolls rarely produce three-putts or missed shorties. Worth
  instrumenting make-percentage by distance from sim telemetry.
- Skill-tier scatter is applied before personality bonuses, so personality
  design can silently cancel tier identity.

Fix direction: apply tier scatter AFTER all personality clamps (clamp the
clamps), then re-tune each bot against target scoring bands (skill 1: ~+8 to
+16, skill 2: ~+2 to +8, skill 3: ~−2 to +4) using the sim harness, several
seeds per bot. **This must land before any leaderboard exists**, or a field of
these bots produces nonsense standings the player can never compete with.

### 2. "Simulate" pacing is not actually quick

Measured: ~14 minutes wall-clock for the 18-hole 4-bot sim (~45s/hole), versus
the documented intent of a full round "in seconds" (v4.86). The per-shot
physics collapse works; the hole-transition and turn-advance delays evidently
do not all collapse under `isQuickSim`. This matters twice: the Tournament
Generator needs to simulate a whole field's rounds between the player's holes,
and balance tuning (item 1) needs fast iteration. Profile `advanceTurn` /
`loadHole` timeouts under quick-sim and collapse the stragglers.

### 3. Uneven lies are wired backwards and effectively dormant

`lieTilt` (ball above/below feet → hook/slice spin, v4.80) is set only when
the player cycles the Z-key TARGET onto a landing zone that declares `tilt` —
and targeting the pin resets it to 0. The ball's actual resting position never
produces an uneven lie, and almost no course data populates non-zero tilt
(one zone on Pebble 9). So a documented flagship mechanic is a no-op in play.
Either implement it properly — per-hole fairway slope bands so where the ball
actually lies determines tilt, announced with the lie ("Ball below your feet")
— or remove the vestige. Implementing it is the better golf: it makes fairway
position matter beyond distance, which is most of real course management.

### 4. Approach roll-out ignores contour transitions (Brian's own .temp.MD doubt)

Putts step yard-by-yard through green contour zones; approach-shot roll-out
samples ONE zone at the landing point (v4.81 block in `calculateShot`) and
applies a single roll multiplier + lateral kick. A ball landing on the front
tier of a two-tier green never feels the second tier. Also worth auditing: the
`slopeY * 40` degrees conversion at 5%/degree can drive roll negative on steep
zones (backboard spin-back — possibly intended, currently uncapped and
un-narrated). Fix direction: reuse the putting gravity-step engine for on-green
roll-out (the code already exists), so approach behavior and putt behavior
agree with each other and with the Pin Finder's predictions.

---

## Tier 2 — Feel and flow

### 5. Post-shot report: apply the omit-defaults rule (cheap, heard 80× a round)

Verbatim from the evaluation swing on a calm day: "Wind pushed it 0 yds
nowhere, and 0 yds nowhere." The v4.64 front-loading work already established
the principle (omit neutral values, lead with what matters) for the pre-shot X
report — the post-shot narrative needs the same pass: drop zero-wind and
zero-kick clauses, lead with the headline ("Flushed. 233 total, fairway, 53
long of target") before the anatomy (carry/roll/kick), keep full detail on C.

### 6. A "brisk" presentation option

Measured: ~27 seconds from ArrowDown to hearing the result on a well-struck
drive (≈7s swing ceremony + flight/bounce/roll theatre + report). The ceremony
IS the game — don't touch the default. But an opt-in Brisk mode (shorter roll
theatrics, headline-first report) would serve experienced players and shorten
a solo round meaningfully. Related: consider per-club tempo as a mechanic —
wedges swinging on a compressed timing cycle vs. the driver's full one — which
is both realistic and adds a second timing skill to learn.

### 7. Fill the 80–90 accuracy dead zone

Below 80 → duck; above 90 → celebration audio and voice lines. The most common
band of outcomes (80–90) has no characterful feedback at all. A modest middle
cue (or occasional caddy/bot one-liner) completes the reward gradient.

### 8. Coarse aim

Aim is 1°-per-press only; a 15° dogleg correction is 15 presses. Shift+arrows
is taken (stance alignment). Suggest Ctrl+Left/Right = 5° per press.

---

## Tier 3 — Learnability and stickiness

### 9. The onboarding cliff

The help menu documents ~45 bindings; a new player faces all of them at once.
The single biggest audience-expanding move: a caddy-guided First Round that
starts with five keys (ArrowDown, Space, PageUp/Down, W, C) and introduces one
system per hole (stance → styles → targeting → hazards → the caddy), with
everything else locked until introduced. The Smart Help and F12 Explore Mode
are good reference tools; this is teaching, which is different.

### 10. Locked-conditions practice

The original design consultation (z.old/GPT idea.md) suggested deterministic
practice seeds; it never got built. On the range, wind drifts between shots,
so grooving swing timing means chasing conditions. A "Lock Conditions" toggle
(freeze wind/lie/target until released) makes the range a real calibration
tool.

### 11. Session timing trends

The engine already captures per-shot hinge/impact/power numbers. Aggregate
them: "Today: 14 swings, average impact 18ms late, average hinge 32ms early —
trending better." One announcement on demand (extend Shift+Semicolon).
Teaches players their own tendencies, and is the natural stepping stone to
career statistics.

### 12. Give the golf balls real identities (optional)

Ball brands currently change only flight/landing audio texture. Small, honest
physics identities (Rock-Flite: +roll −spin; Marshmallow X: −distance +sweet
spot; Water Magnet: chaos) make the Shift+Y choice a decision — and become
the natural unlock currency for career mode (the v4.31.5 groundwork note).

---

## Recommended sequence

1. **Fix the bot ladder + quick-sim together** (items 1–2): collapse sim
   delays first so tuning iterations are fast, then re-tune tiers against
   target scoring bands, verified by batch sims. Everything tournament/career
   depends on this.
2. **Report polish** (item 5) — small, immediate, felt on every shot.
3. **Physics honesty pass** (items 3–4): uneven lies done right + contour
   roll-out, closing .temp.MD's open doubts.
4. Then feel/learnability picks (6–11) as appetite dictates, and career/
   tournament design on the now-trustworthy foundation.
