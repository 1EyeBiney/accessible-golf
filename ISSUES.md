# Issues and open questions

Open items and deferred work, per CLAUDE.md. Resolved items move to Done with
the version that fixed them.

## Open

1. **Audio asset gaps** — `tools/check.js`'s audio-existence check reports
   referenced MP3s that aren't on disk (see its latest output for the live
   list). As of v6.24.0 the confirmed miss is
   `audio/courses/pasture/am_farm1_toilet.mp3` (Hole 8 "The Royal Bowl"
   ambient, referenced since v5.67.0, never committed — the hole plays with no
   ambient track). Missing audio doesn't crash anything (`playEnvironment` and
   the grab-bag players catch play errors), but each miss is a silent hole in
   the experience. Worth a pass with Brian to decide which to source/generate
   and which to retire from the code. Note: ~18 dynamically-built audio paths
   (template literals, variable pools) can't be statically verified by the
   checker and are listed as "unverified" in its output.
2. **`.keybin_5.12.MD` is stale** (v5.12-era scratch notes). The real
   keybinding authority is `helpMenuText` in data_ag.js plus
   `getKeyDescription` in input_ag.js. Left in place as Brian's scratch file;
   flagged so nobody mistakes it for documentation.
3. **Empty scratch files** — `.strokes.MD` and `.round notes2.txt` are
   zero-byte. Left alone (Brian's files), noted here only so a future session
   doesn't puzzle over them.
4. **`window.autoSetFocus` exists in both main_ag.js and physics_core.js** —
   the later-loaded main_ag.js copy wins at runtime (v6.04.1/v6.05.0 corrected
   indices). Harmless today but a drift risk; candidate for consolidation into
   one module in a future cleanup release.
5. **gemini.md's addenda occasionally describe injections that were later
   moved or superseded** (it is a change log, not a state description). Trust
   ARCHITECTURE.md, then the code. When a discrepancy matters, note it here.
6. **Bill the Legend trends slightly light of his own mid-skill-1 pre-God-Mode
   target** after the v6.25.0 bot-scoring-ladder fix. In the final 3-round
   acceptance batch he shot +9/+6/+6 against a +10..+14 target (still inside
   the broader +8..+16 skill-1 band in the first round). He's a zero-bias
   "clean baseline amateur" (no `impactBias`/`hingeBias`), so unlike Mulligan
   Moe he relies entirely on the generic skill-1 floor/putting-noise for his
   variance — worth either a small personal bias (matching how every other
   named bot is differentiated) or another look with a larger sample (10+
   rounds; tonight's tuning worked in batches of 3, which carries real
   sampling noise of its own — see the v6.25.0 changelog entry's tuning
   journey for the full record of what was tried).
7. **Local dev-server script caching can silently serve stale JS during rapid
   iteration.** The `?v=` cache-busters only change once per release, so
   editing `physics_core.js`/`main_ag.js` and reloading the same URL during
   same-version testing can serve the browser's cached pre-edit copy with no
   error or warning — this cost real time during v6.25.0's bot-tuning pass
   (see its changelog entry). When iterating rapidly within one unreleased
   version, append a throwaway suffix to the script `?v=` query strings
   (bumped on every edit) rather than relying on the outer page URL's own
   cache-buster, which does not affect sub-resource caching; verify with
   `window.someFunction.toString().includes('expected new text')` before
   trusting a test result. Revert to the clean version string before
   committing.

## Done

- **v6.24.0: `main_ag.js` was UTF-16 LE encoded** — invisible to grep and every
  other text tool (which is also why no text search of the repo could find
  `swingState`'s declaration). Converted losslessly to UTF-8-with-BOM (verified
  by character-for-character round trip); `tools/check.js` now fails any
  UTF-16-encoded source file so it can't recur.
- **v6.24.0: version drift** — `<title>` said v6.23.0, the version `<div>` said
  "Modular Codebase v5.31.2", every cache-buster said `?v=5.61.0`, and
  `AG_VERSION` said v6.22.0. All four now sync to `AG_VERSION` on every
  release, enforced by `tools/check.js`. Root cause: the cache-busters stopped
  being bumped at v5.61.0, which meant the mechanism built to prevent stale
  modules was itself pinning them stale.
