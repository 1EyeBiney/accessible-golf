# Morning Report — v6.25.0 overnight run (branch `overnight-v6.25`)

Written at the end of the run, 2026-09-01. **`main` was never touched — the
live site is exactly as you left it.** Everything below lives on the
`overnight-v6.25` branch, pushed to origin as backup.

## The one-paragraph version

All seven phases shipped; nothing was cut. Quick-sim went from ~14 minutes to
seconds, the bot scoring ladder was rebuilt and verified, shot reports lead
with the headline and never say "0 yds nowhere," uneven lies and green
roll-out are real physics now, the Caddy Academy teaching course exists and
passed a full keyboard walkthrough, and all five small features landed (Brisk
mode, coarse aim, locked practice, session trends, ball identities). Your
live feedback mid-run also produced Silent Sim pacing and a working
post-round Enter/Escape flow. Three genuine pre-existing bugs were found and
fixed along the way, and one honest scoring caveat is documented below.

## What shipped, in order

| Phase | What | Commit |
|---|---|---|
| 1 | Quick-sim actually quick (14 min → ~30s, later ~4s silent) | `c625659` |
| 2 | Bot scoring ladder fixed and verified over 3 rounds | `9a9ea95` |
| 3 | Post-shot report: omit defaults, headline first | `1079160` |
| 4 | Physics honesty: uneven lies from ball position, two-sample green roll-out | `592c297` |
| — | *Your live feedback:* Silent Sim pacing mode + post-round Enter/Escape | `6e9b177` |
| 5 | The Caddy Academy (9-hole guided teaching course) | `e5067eb` |
| 6.1 | Brisk Mode (R): half theatre, headline-only speech | `9f89f72` |
| 6.2 | Coarse aim (Ctrl+Arrows = 5°), works inside the H menu | `dfe1748` |
| 6.3 | Locked Conditions practice (Shift+R on the range) | `7b47722` |
| 6.4 | Session timing trends — and the Shift+Semicolon binding was DEAD; restored | `fb36324` |
| 6.5 | Ball identities: mild real physics per ball | `59b7a24` |

Explicitly NOT done, per your bracket notes: the 80–90 accuracy dead zone
("not now") and per-club swing tempo ("save for future").

## Bugs found in YOUR existing code and fixed (not caused by tonight's work)

1. **The putter that never existed.** The bag has no club named "Putter", so
   the green-side auto-equip has returned -1 forever, and that -1 poisoned
   `currentClubIndex` — `club` became undefined after a turn swap, crashing
   `getSetupReport` (e.g. closing the scorecard after a round). Fixed at all
   three sites.
2. **Shift+Semicolon was a dead binding.** The help has long documented it as
   the timing readout; no handler existed anywhere. Restored + extended.
3. **Aim-during-hazard-menu was dead code.** The H menu blocked arrow keys,
   making the original "re-announce hazard on aim change" logic unreachable.
   Now real (and Ctrl works there too).

## Final verification sims (Holodeck, par 72, calm, Silent Sim, tonight's final code)

| Bot (ball) | Band | R1 | R2 | R3 |
|---|---|---|---|---|
| Mulligan Moe (Rock-Flite) | +8..+16 | +12 | **−2** | +13 |
| Mendi Dart | +2..+8 | +6 | +8 | **+1** |
| Fallon the Blade | +2..+8 | +3 | **+1** | +5 |
| Bill the Legend | mid-skill-1 pre-God-Mode | +8 | +3 | +5 |

**The honest caveat:** the ladder is dramatically better than the old
60-shooting "amateurs," and most results sit in band — but Moe's −2 round
shows a skill-1 bot can still steal a round on a hot putting day (his
long-game floor is bounded; his per-putt luck is not), and the snipers graze
1 under their floor occasionally. Logged as ISSUES #8 with a suggested fix
(per-round putt-make governor) if tournament play needs guaranteed spreads.
No further tuning was chased tonight — the per-putt noise lever is already
calibrated and re-rolling it risks the verified center of the distribution.

## Your ear test (all local — nothing is live)

Serve it: from `C:\nbs\ag`, run `npx serve . -l 8092`, open
`http://localhost:8092`, hard-refresh once (Ctrl+F5) so no stale scripts.

1. **Caddy Academy** (the big one): Start New Game → "Caddy Academy" (listed
   with its own description) → solo → Start Round. Hole 1 should greet you
   and teach only the Down Arrow swing; press S or Z or H — the caddy should
   say "The caddy will cover that on a later hole." Press D to re-hear any
   lesson. On hole 4 press W: a steady 10 mph left-to-right crosswind that
   never drifts. By each hole, its taught key should just work. On hole 9's
   green, B should read "uphill" instead of flat.
2. **Silent Sim**: Shift+L foursome → any course → in Match Settings, arrow
   to "Pacing:" and Enter to set Silent Sim → Start Round. The whole 18
   should finish in seconds with (near) total silence — you may hear one
   single menu click at the start, that's known. At the end: Enter reads the
   scorecard grid, Escape returns to the Clubhouse — both should now always
   work.
3. **Brisk Mode**: on any course press R, take a shot — shorter pauses,
   headline-only report; C afterward gives the full anatomy. R again restores.
4. **Coarse aim**: Ctrl+Left/Right jumps 5 degrees; works inside the H
   obstacle list too, re-reading the hazard against your new line.
5. **Locked practice**: Holo Range → Shift+R → the wind freezes and your
   aim/stance survive between swings. Shift+R or leaving the range unlocks.
6. **Session trends**: after a few range swings, Shift+Semicolon — last-swing
   diagnostics plus "Session: N full swings. Average impact Xms late..."
7. **Ball identities**: Shift+Y cycles balls, each announcing its physics.
   Rock-Flite really does run out ~10% farther; Velcro Tour really spins 15%
   more (verified to the exact RPM).
8. **Pebble 9 uneven lie**: drive into that fairway, press X — "Ball below
   your feet" and honest hook/slice consequences.

## To merge when satisfied

```
git checkout main
git merge overnight-v6.25
node tools/check.js
git push
```

Pushing main deploys live within about a minute — validator first, always.
If anything sounds wrong, leave main alone and tell the next session what
you heard; every phase is a separate commit, so single features can be
reverted surgically.

## New ISSUES entries this run

#8 hot-putting outlier (above), #9 shotStyles help-text undersell,
#10 dead `windOverride` data in Pasture, #11 Silent Sim's single menu click,
#12 the no-Putter-in-bag design question. Bill the Legend's mild sub-target
trend remains #6 from Phase 2.
