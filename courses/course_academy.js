// courses/course_academy.js - The Caddy Academy guided teaching course (v6.25.0)
//
// TEMPORARY BY DESIGN (per Brian's EVALUATION.md note): this course is a
// selectable practice round for now, and will eventually be removed and
// folded into a new-game onboarding flow. ALL Academy logic lives in this
// file plus ONE clearly-marked interceptor block in input_ag.js (search for
// "CADDY ACADEMY KEY DEFLECTION"). Removing the Academy later is three
// deletions: this file, that block, and this file's script tag in index.html.
//
// How it works, using only existing engine mechanisms:
// - Each hole's `description` IS the caddy's lesson script; loadHole already
//   broadcasts it on hole load, and KeyD re-reads it on demand.
// - `windLock: {x, y}` per hole pins the wind (calm everywhere except hole 4,
//   the wind lesson, which fixes a moderate left-to-right crosswind). The
//   generic windLock support lives in physics_core.js / main_ag.js and is
//   data-driven - it does nothing unless a hole declares it.
// - `academyLocks` (course-level) lists which keys unlock AT which hole; the
//   input_ag.js interceptor deflects a locked key with one gentle line. Keys
//   never listed here are never touched, and no other course declares
//   academyLocks, so no other course is affected.
// - Greens use "The Saddle" (a flat greenDictionary contour) except hole 9,
//   the putting lesson, which uses "The Welcoming Bowl" (the gentlest real
//   contour) so the green-reading lesson has something true to say.

window.courses = window.courses || [];
window.courses.push({
    name: "Caddy Academy",
    par: 32,
    menuDesc: "A guided 9-hole introduction for new players. Your caddy teaches one skill per hole, from the basic swing to reading greens.",
    academyLocks: [
        { fromHole: 2, codes: ["Space"] },
        { fromHole: 3, codes: ["PageUp", "PageDown", "KeyX"] },
        { fromHole: 4, codes: ["KeyW"] },
        { fromHole: 5, codes: ["Home", "End", "Shift+ArrowLeft", "Shift+ArrowRight"] },
        { fromHole: 6, codes: ["KeyS"] },
        { fromHole: 7, codes: ["KeyZ"] },
        { fromHole: 8, codes: ["KeyH"] },
        { fromHole: 9, codes: ["KeyB"] }
    ],
    holes: [
        { number: 1, par: 3, distance: 90, fairwayWidth: 60, greenRadius: 25, greenType: "The Saddle", pinLocation: "Center", pinX: 0, pinY: 90, windLock: { x: 0, y: 0 },
          description: "Welcome to the Caddy Academy! I'm your caddy, and over nine short holes I'll teach you the whole game, one skill at a time. This opener is a gentle par 3 with an enormous green, and I've already put the right club in your hands. The swing is three moves on the Down Arrow: press and hold it to start your backswing, release it to lock in your power, then press it once more to strike the ball. Listen to the rising tone while you hold - a fuller backswing sounds higher and hits farther. If you'd like a safe rehearsal first, the Up Arrow takes a practice swing that costs nothing. Press D any time to hear my lesson again. Now then - hold Down Arrow, release, and press it again.",
          hazards: [], landingZones: [{ name: "Green Center", x: 0, y: 90, z: 0 }], zones: [{ name: "Green Center", x: 0, y: 90 }] },

        { number: 2, par: 3, distance: 110, fairwayWidth: 60, greenRadius: 24, greenType: "The Saddle", pinLocation: "Center", pinX: 0, pinY: 110, windLock: { x: 0, y: 0 },
          description: "Lesson two: tempo. During both the backswing and the downswing, tap the Spacebar once when the swing feels fully loaded - that is your hinge timing, and it decides how cleanly you strike. So the complete swing is now: hold Down Arrow, tap Space near the top, release Down Arrow, tap Space again on the way down, then press Down Arrow to strike. A crisp ping means your timing was close; early or late taps cost distance and accuracy. Don't chase perfection yet - just find the rhythm.",
          hazards: [], landingZones: [{ name: "Green Center", x: 0, y: 110, z: 0 }], zones: [{ name: "Green Center", x: 0, y: 110 }] },

        { number: 3, par: 4, distance: 280, fairwayWidth: 60, greenRadius: 22, greenType: "The Saddle", pinLocation: "Center", pinX: 0, pinY: 280, windLock: { x: 0, y: 0 },
          description: "Lesson three: the bag is yours. Press Page Up and Page Down to cycle through your clubs, and press X to hear exactly what you're holding and how far a full swing carries it. I'll still suggest a sensible club whenever a hole starts, but from here on you choose. This is your first par 4, so you'll need two good swings: a long club off the tee, then something shorter that matches the yardage I call out for your second shot.",
          hazards: [], landingZones: [{ name: "Fairway Center", x: 0, y: 180, z: 0 }], zones: [{ name: "Fairway Center", x: 0, y: 180 }] },

        { number: 4, par: 3, distance: 130, fairwayWidth: 60, greenRadius: 22, greenType: "The Saddle", pinLocation: "Center", pinX: 0, pinY: 130, windLock: { x: 10, y: 0 },
          description: "Feel that breeze? I've parked a steady crosswind on this hole, blowing left to right, and it will not drift - perfect for practicing. Press W before every shot to hear the wind's speed and direction. To beat a crosswind, aim into it: the Left and Right Arrows move your aim one degree at a time. Aim a few degrees left here and let the wind carry your ball back to the flag. Wind pushing you from behind adds distance; wind in your face steals it. W is your friend for the rest of your golfing life.",
          hazards: [], landingZones: [{ name: "Green Center", x: 0, y: 130, z: 0 }], zones: [{ name: "Green Center", x: 0, y: 130 }] },

        { number: 5, par: 4, distance: 300, fairwayWidth: 65, greenRadius: 22, greenType: "The Saddle", pinLocation: "Center", pinX: 0, pinY: 300, windLock: { x: 0, y: 0 },
          description: "Lesson five: your setup. The Home and End keys move the ball forward or backward in your stance - forward launches higher with more spin and stops quickly, backward flies lower and runs after it lands. Shift plus Left or Right Arrow opens or closes your stance, shaping a gentle fade or draw on purpose. These are small adjustments with real effects, and this fairway is wide and forgiving, so experiment freely. Press X after each change to hear how your setup reads.",
          hazards: [], landingZones: [{ name: "Fairway Center", x: 0, y: 190, z: 0 }], zones: [{ name: "Fairway Center", x: 0, y: 190 }] },

        { number: 6, par: 4, distance: 310, fairwayWidth: 60, greenRadius: 22, greenType: "The Saddle", pinLocation: "Center", pinX: 0, pinY: 310, windLock: { x: 0, y: 0 },
          description: "Lesson six: swing styles. Press S to cycle through Full, Pitch, Chip, and Flop. A full swing wants a full distance - but golf keeps handing you in-between yardages, and that's what the short swings are for. A Pitch is a controlled partial swing for shots inside your shortest club's full distance; a Chip stays low and runs to the hole; a Flop climbs high and stops dead. Drive off this tee, then try a Pitch for your second shot instead of forcing a full swing. Press X any time to confirm your club and style together.",
          hazards: [], landingZones: [{ name: "Fairway Center", x: 0, y: 200, z: 0 }], zones: [{ name: "Fairway Center", x: 0, y: 200 }] },

        { number: 7, par: 4, distance: 340, fairwayWidth: 55, greenRadius: 22, greenType: "The Saddle", pinLocation: "Center", pinX: 0, pinY: 340, windLock: { x: 0, y: 0 },
          description: "Lesson seven: you don't have to fire at the flag. Press Z to cycle your target between the pin and my recommended landing zones - I've marked a safe layup spot partway down this fairway. Aiming at a zone points your whole swing there, so you can play a long hole as two smart pieces instead of one heroic blast. For surgical control, Shift plus Z opens the Micro-Grid: the arrow keys walk your target to an exact yardage and line, and Enter locks it in. Lay up to my zone, then attack the green from there.",
          hazards: [], landingZones: [{ name: "Safe Layup", x: 0, y: 200, z: 0 }], zones: [{ name: "Safe Layup", x: 0, y: 200 }] },

        { number: 8, par: 3, distance: 150, fairwayWidth: 55, greenRadius: 20, greenType: "The Saddle", pinLocation: "Center", pinX: 0, pinY: 150, windLock: { x: 0, y: 0 },
          description: "Lesson eight: trouble. One big friendly bunker guards the front of this green, and knowing exactly where trouble sits is half of golf. Press H to open the Obstacle List: the Up and Down Arrows walk through every hazard on the hole with its distance and position, and Escape or Enter closes the list. Check how far you must carry the ball to clear that sand, then take one extra club and fly it with room to spare. Short and safe beats long and sorry - but today, be brave.",
          hazards: [{ type: "Bunker", distance: 118, depth: 16, width: 34, offset: 0 }],
          landingZones: [{ name: "Green Center", x: 0, y: 150, z: 0 }], zones: [{ name: "Green Center", x: 0, y: 150 }] },

        { number: 9, par: 4, distance: 280, fairwayWidth: 60, greenRadius: 22, greenType: "The Welcoming Bowl", pinLocation: "Center", pinX: 0, pinY: 280, windLock: { x: 0, y: 0 },
          description: "The final lesson: the flat stick. When your ball reaches the green, putting mode begins on its own - the arrow keys set your line and distance, and Enter locks the target. Before you commit, press B to hear the green's slope and break; this green tilts gently from back to front, so putts from behind the hole run faster and putts from below it need a firmer stroke. The putting stroke is the same Down Arrow rhythm you learned on hole 1, just gentler, and your Spacebar tempo controls your touch. Sink this one and you graduate. It's been a pleasure, golfer - every course out there is yours now.",
          hazards: [], landingZones: [{ name: "Fairway Center", x: 0, y: 180, z: 0 }], zones: [{ name: "Fairway Center", x: 0, y: 180 }] }
    ]
});
