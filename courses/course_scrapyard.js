// course_scrapyard.js - The Texas Scrapyard Course Data (v5.34.6)
window.courses = window.courses || [];
window.courses.push({
   name: "The Texas Scrapyard",
   holes: [
       {
           number: 1, par: 4, distance: 340, pinX: 0, pinY: 340, pinZ: -12, greenType: "The Welcoming Bowl", fairwayWidth: 45, greenRadius: 18,
           pinLocation: "Center",
           description: "A 340-yard downhill par 4. The fairway is wide, dirt, and scrub grass. A rusted-out Chevy sits on the right side of the landing zone.",
           fairwayDescription: "A wide, 45-yard dirt fairway that plays significantly downhill. Stay left to avoid the old Chevy.",
           caddyNotes: [
               { level: 1, trigger: 'Tee', text: 'It plays downhill. Do not overswing.' },
               { level: 3, trigger: 'Tee', text: 'It is a 12-yard drop to the green. The rusted Chevy on the right is a magnet for slices. Aim left-center.' }
           ],
           hazards: [{ type: "Burned-Out Chevy", distance: 220, depth: 10, side: "Right", offset: 20, width: 10 }],
           landingZones: [
               { name: "Safe Drive", x: -10, y: 230, z: -8, tilt: 0, slope: -2 },
               { name: "Green Approach", x: 0, y: 325, z: -12, tilt: 0, slope: 0 }
           ],
           zones: [{ name: "Fairway Center", x: -10, y: 230 }]
       },
       {
           number: 2, par: 3, distance: 145, pinX: 5, pinY: 144, pinZ: 8, greenType: "The Turtleback", fairwayWidth: 20, greenRadius: 14,
           pinLocation: "Back-Right",
           description: "A steep uphill 145-yard par 3. You are hitting to an elevated scrap-pile green. Anything short will roll all the way back down the hill.",
           fairwayDescription: "No fairway. Just a steep uphill carry over scrub grass to an elevated turtleback green.",
           caddyNotes: [
               { level: 1, trigger: 'Tee', text: 'Take an extra club. It is uphill.' },
               { level: 3, trigger: 'Tee', text: 'Plays 8 yards uphill to a turtleback green that repels the ball. Take one extra club and try to land it softly.' }
           ],
           hazards: [{ type: "Scrap Metal Bunker", distance: 130, depth: 10, side: "Center", offset: 0, width: 25 }],
           landingZones: [{ name: "Green Center", x: 0, y: 145, z: 8, tilt: 0, slope: 5 }],
           zones: [{ name: "Green Center", x: 0, y: 145 }]
       },
       {
           number: 3, par: 5, distance: 510, pinX: -15, pinY: 510, pinZ: -5, greenType: "The False Front", fairwayWidth: 40, greenRadius: 16,
           pinLocation: "Left",
           description: "A 510-yard par 5. A massive dried-out creek bed crosses the fairway at 280 yards. The lie on the other side is severely uneven.",
           fairwayDescription: "A wide fairway split by a dry scrub creek at 280 yards. The landing zone past the creek slopes heavily from right to left.",
           caddyNotes: [
               { level: 1, trigger: 'Tee', text: 'Avoid the dry creek bed in the middle.' },
               { level: 3, trigger: 'Tee', text: 'If you carry the dry creek at 280, the ball will land on a severe right-to-left slope. Be prepared for a sidehill lie.' },
               { level: 3, trigger: 'Approach_Long', text: 'You have a sidehill lie. The ball is above your feet, so it will hook hard to the left. Aim right to compensate.' }
           ],
           hazards: [{ type: "Dry Scrub Creek", distance: 280, depth: 20, side: "Center", offset: 0, width: 60 }],
           landingZones: [
               { name: "Short of Creek", x: 0, y: 260, z: -2, tilt: 0, slope: 0 },
               { name: "Uneven Layup", x: 10, y: 350, z: -5, tilt: 4, slope: -1 },
               { name: "Green Approach", x: 0, y: 490, z: -5, tilt: 0, slope: 0 }
           ],
           zones: [{ name: "Fairway Right", x: 10, y: 350 }]
       },
       {
           number: 4, par: 4, distance: 380, pinX: -5, pinY: 380, pinZ: 0, greenType: "Flat", fairwayWidth: 50, greenRadius: 16,
           pinLocation: "Left",
           description: "A 380-yard Par 4. The fairway is violently split down the middle by a steep, rocky gully.",
           fairwayDescription: "The left fairway is wide and safe. The right fairway is a narrow strip that rewards a brave drive. A rocky gully splits the two.",
           caddyNotes: [
               { level: 1, trigger: 'Tee', text: 'You have a choice off the tee. Safe play is out to the left.' },
               { level: 3, trigger: 'Tee', text: 'To get a wedge in your hand, you have to challenge the narrow right side. Aim away from the central gully.' }
           ],
           hazards: [
               { type: "Rocky Gully", distance: 150, depth: 220, side: "Center", offset: 0, width: 20 },
               { type: "Crushed Washing Machines", distance: 410, depth: 15, side: "Center", offset: -5, width: 25 }
           ],
           landingZones: [
               { name: "Safe Left Fairway", x: -20, y: 250, z: 0, tilt: 0, slope: 0 },
               { name: "Aggressive Right", x: 25, y: 280, z: 0, tilt: 0, slope: 0 },
               { name: "Green Approach", x: -5, y: 365, z: 0, tilt: 0, slope: 0 }
           ],
           zones: [{ name: "Left Fairway", x: -20, y: 250 }, { name: "Right Fairway", x: 25, y: 280 }]
       },
       {
           number: 5, par: 3, distance: 95, pinX: 8, pinY: 95, pinZ: 2, greenType: "The Welcoming Bowl", fairwayWidth: 20, greenRadius: 12,
           pinLocation: "Front-Right",
           description: "A comical, pitch-and-putt 95-yard Par 3. The green is heavily guarded on the front-right by a massive, sun-bleached 1980s RV.",
           fairwayDescription: "No fairway. Just a short hop over dirt to a tiny green tucked behind an RV.",
           caddyNotes: [
               { level: 1, trigger: 'Tee', text: 'It is a short wedge, but you have to clear the RV.' },
               { level: 3, trigger: 'Tee', text: 'Only 95 yards, but Cousin Eddie parked his RV right in front of the flag. You need a sky-high flop shot over the roof, or a draw from the left.' }
           ],
           hazards: [
               { type: "Sun-Bleached RV", distance: 85, depth: 5, side: "Right", offset: 10, width: 15 },
               { type: "Lawn Chair Bunker", distance: 90, depth: 10, side: "Left", offset: -15, width: 10 }
           ],
           landingZones: [{ name: "Green Center", x: 0, y: 95, z: 2, tilt: 0, slope: 0 }],
           zones: [{ name: "Green Center", x: 0, y: 95 }]
       },
       {
           number: 6, par: 4, distance: 410, pinX: -15, pinY: 410, pinZ: -4, greenType: "The False Front", fairwayWidth: 40, greenRadius: 18,
           pinLocation: "Back-Left",
           description: "A sweeping 410-yard dogleg left. The inside corner is a dying pine grove blanketed in slick pine needles. An oil rig sits at the apex.",
           fairwayDescription: "A wide dogleg left. The entire left rough is replaced by slick pine straw. Keep it right of the rusted oil rig.",
           caddyNotes: [
               { level: 1, trigger: 'Tee', text: 'Dogleg left. Avoid the pine needles on the left at all costs.' },
               { level: 3, trigger: 'Tee', text: 'Do not hit it into those pine needles. The ball slides on them like ice, and you will not get any spin on your approach. Aim right of the oil rig.' }
           ],
           hazards: [
               { type: "Rusted Oil Rig", distance: 240, depth: 20, side: "Left", offset: -25, width: 15 },
               { type: "Rocker Arm Drillers", distance: 260, depth: 30, side: "Right", offset: 60, width: 25 },
               { type: "Pine Needles", distance: 200, depth: 150, side: "Left", offset: -35, width: 30 }
           ],
           landingZones: [
               { name: "Fairway Right (Safe)", x: 15, y: 260, z: 0, tilt: 0, slope: 0 },
               { name: "Green Approach", x: -15, y: 395, z: -4, tilt: 0, slope: 2 }
           ],
           zones: [{ name: "Apex Center", x: 0, y: 260 }]
       },
       {
           number: 7, par: 5, distance: 540, pinX: 20, pinY: 540, pinZ: 0, greenType: "Flat", fairwayWidth: 55, greenRadius: 22,
           pinLocation: "Center",
           description: "A 540-yard Par 5 playing across an overgrown, abandoned high school football field.",
           fairwayDescription: "A massive, flat fairway. The old bleachers on the left are out of bounds. Muddy rain puddles dot the center of the field.",
           caddyNotes: [
               { level: 1, trigger: 'Tee', text: 'Keep it up the right side to avoid the bleachers.' },
               { level: 3, trigger: 'Tee', text: 'We are playing across the old gridiron. The bleachers on the left are strictly out of bounds. Watch out for the rain puddles in the landing zones.' }
           ],
           hazards: [
               { type: "Empty Bleachers (OB)", distance: 100, depth: 400, side: "Left", offset: -40, width: 20 },
               { type: "Muddy Puddle (Water)", distance: 250, depth: 10, side: "Center", offset: 0, width: 15 },
               { type: "Muddy Puddle (Water)", distance: 400, depth: 10, side: "Center", offset: 10, width: 15 },
               { type: "Toppled Goalpost", distance: 560, depth: 5, side: "Center", offset: 20, width: 25 }
           ],
           landingZones: [
               { name: "First Down (Layup)", x: 20, y: 270, z: 0, tilt: 0, slope: 0 },
               { name: "Red Zone (Layup)", x: -10, y: 430, z: 0, tilt: 0, slope: 0 },
               { name: "Endzone (Green)", x: 20, y: 520, z: 0, tilt: 0, slope: 0 }
           ],
           zones: [{ name: "Fairway Right", x: 20, y: 270 }, { name: "Fairway Left", x: -10, y: 430 }]
       },
       {
           number: 8, par: 4, distance: 320, pinX: 0, pinY: 320, pinZ: -5, greenType: "The Welcoming Bowl", fairwayWidth: 25, greenRadius: 15,
           pinLocation: "Center",
           description: "A 320-yard Par 4 played through a tight canyon. The walls slope steeply inward.",
           fairwayDescription: "A terrifyingly narrow dirt fairway, but the canyon walls on both sides will kick errant shots back toward the middle.",
           caddyNotes: [
               { level: 1, trigger: 'Tee', text: 'It looks tight, but the walls funnel the ball back.' },
               { level: 3, trigger: 'Tee', text: 'The canyon walls slope inward like bowling alley bumpers. Just hit it hard, and gravity will funnel it right back down into the dirt.' }
           ],
           hazards: [
               { type: "Left Canyon Wall", distance: 100, depth: 200, side: "Left", offset: -20, width: 15 },
               { type: "Right Canyon Wall", distance: 100, depth: 200, side: "Right", offset: 20, width: 15 },
               { type: "Scrap Metal Pile", distance: 300, depth: 10, side: "Center", offset: 0, width: 15 }
           ],
           landingZones: [
               { name: "Canyon Floor", x: 0, y: 260, z: -3, tilt: 0, slope: 0 },
               { name: "Green Approach", x: 0, y: 305, z: -5, tilt: 0, slope: 0 }
           ],
           zones: [{ name: "Center Chute", x: 0, y: 260 }]
       },
       {
           number: 9, par: 3, distance: 165, pinX: 0, pinY: 165, pinZ: 0, greenType: "The Turtleback", fairwayWidth: 20, greenRadius: 16,
           pinLocation: "Center",
           description: "A 165-yard Par 3. The green is an island surrounded by a muddy, stagnant moat.",
           fairwayDescription: "No fairway. Pure carry over a water hazard to an island green ringed by tractor tires.",
           caddyNotes: [
               { level: 1, trigger: 'Tee', text: 'Island green. Do not leave it short.' },
               { level: 3, trigger: 'Tee', text: 'An island green, scrapyard style. It is 165 yards to carry the moat. Do not leave it short, or you are swimming with the snapping turtles.' }
           ],
           hazards: [
               { type: "Muddy Moat (Water)", distance: 140, depth: 15, side: "Center", offset: 0, width: 60 },
               { type: "Tractor Tire Wall", distance: 156, depth: 2, side: "Center", offset: 0, width: 35 }
           ],
           landingZones: [{ name: "Island Center", x: 0, y: 165, z: 0, tilt: 0, slope: -2 }],
           zones: [{ name: "Island Center", x: 0, y: 165 }]
       },
       {
           number: 10, par: 4, distance: 390, pinX: 25, pinY: 380, pinZ: 4, greenType: "The False Front", fairwayWidth: 40, greenRadius: 18,
           pinLocation: "Back-Right",
           description: "A blind dogleg right. The apex is blocked by a 40-foot-tall mountain of crushed sedans.",
           fairwayDescription: "The fairway slopes heavily left-to-right. A massive wall of crushed cars guards the right side of the dogleg.",
           caddyNotes: [
               { level: 1, trigger: 'Tee', text: 'Dogleg right. The fairway kicks hard to the right.' },
               { level: 3, trigger: 'Tee', text: 'Severe dogleg right. The fairway kicks hard to the right, toward the crushed cars. Aim up the left side and let the slope do the work.' }
           ],
           hazards: [
               { type: "Crushed Car Mountain", distance: 220, depth: 60, side: "Right", offset: 25, width: 30 },
               { type: "Scrub-Grass Pit", distance: 250, depth: 30, side: "Right", offset: 45, width: 20 }
           ],
           landingZones: [
               { name: "Fairway Left (Slopes Right)", x: -15, y: 240, z: 0, tilt: -4, slope: 0 },
               { name: "Green Approach", x: 20, y: 360, z: 4, tilt: 0, slope: 2 }
           ],
           zones: [{ name: "Apex Left", x: -15, y: 240 }]
       },
       {
           number: 11, par: 5, distance: 610, pinX: 0, pinY: 610, pinZ: 0, greenType: "Flat", fairwayWidth: 60, greenRadius: 20,
           pinLocation: "Center",
           description: "A brutal 610-yard Par 5. Flat, wide open, and completely exposed to the wind.",
           fairwayDescription: "A massive, straight runway. A chainlink fence runs down the left, and tumbleweed bunkers are scattered throughout.",
           caddyNotes: [
               { level: 1, trigger: 'Tee', text: 'Wide open and flat. Hit it as hard as you can.' },
               { level: 3, trigger: 'Tee', text: 'Welcome to Tornado Alley. No trees to block the wind here. Check the weather report before you swing, because the wind dictates every shot on this 600-yard monster.' }
           ],
           hazards: [
               { type: "Chainlink Fence (OB)", distance: 0, depth: 610, side: "Left", offset: -35, width: 5 },
               { type: "Tumbleweed Bunker", distance: 280, depth: 15, side: "Right", offset: 15, width: 20 },
               { type: "Tumbleweed Bunker", distance: 450, depth: 15, side: "Left", offset: -10, width: 20 }
           ],
           landingZones: [
               { name: "First Layup", x: 0, y: 290, z: 0, tilt: 0, slope: 0 },
               { name: "Second Layup", x: 10, y: 480, z: 0, tilt: 0, slope: 0 },
               { name: "Green Approach", x: 0, y: 590, z: 0, tilt: 0, slope: 0 }
           ],
           zones: [{ name: "Fairway Center", x: 0, y: 290 }, { name: "Fairway Right", x: 10, y: 480 }]
       },
       {
           number: 12, par: 3, distance: 120, pinX: 0, pinY: 120, pinZ: -8, greenType: "The Welcoming Bowl", fairwayWidth: 20, greenRadius: 15,
           pinLocation: "Center",
           description: "A terrifyingly steep drop into a literal sinkhole. The green sits at the very bottom.",
           fairwayDescription: "No fairway. Just a 25-foot drop into a dirt and grass bowl.",
           caddyNotes: [
               { level: 1, trigger: 'Tee', text: 'Plays severely downhill. Take less club.' },
               { level: 3, trigger: 'Tee', text: 'The walls will funnel the ball to the center, but if you hang up in the rough, you will have a nightmare of a sidehill lie. The green used to be 25 feet above us, but, well... that is why they call this The Sinkhole.' }
           ],
           hazards: [
               { type: "Abandoned Excavator", distance: 145, depth: 10, side: "Center", offset: 0, width: 20 },
               { type: "Steep Sinkhole Wall", distance: 110, depth: 20, side: "Right", offset: 20, width: 10 },
               { type: "Steep Sinkhole Wall", distance: 110, depth: 20, side: "Left", offset: -20, width: 10 }
           ],
           landingZones: [{ name: "Sinkhole Floor", x: 0, y: 120, z: -8, tilt: 0, slope: 0 }],
           zones: [{ name: "Sinkhole Floor", x: 0, y: 120 }]
       },
       {
           number: 13, par: 4, distance: 430, pinX: 10, pinY: 430, pinZ: 0, greenType: "Flat", fairwayWidth: 35, greenRadius: 18,
           pinLocation: "Right",
           description: "A 430-yard Par 4 that runs perfectly parallel to an abandoned train track.",
           fairwayDescription: "A long straightaway. The train tracks serve as a hard Out of Bounds line down the entire right side.",
           caddyNotes: [
               { level: 1, trigger: 'Tee', text: 'Keep it left. The tracks on the right are out of bounds.' },
               { level: 3, trigger: 'Tee', text: 'The train tracks on the right are dead. Keep it left, but do not overcook it on your approach, or you will be punching out from underneath an old boxcar.' }
           ],
           hazards: [
               { type: "Abandoned Tracks (OB)", distance: 0, depth: 450, side: "Right", offset: 25, width: 10 },
               { type: "Rusted Boxcar", distance: 420, depth: 20, side: "Left", offset: -20, width: 15 }
           ],
           landingZones: [
               { name: "Fairway Left", x: -10, y: 280, z: 0, tilt: 0, slope: 0 },
               { name: "Green Approach", x: 5, y: 410, z: 0, tilt: 0, slope: 0 }
           ],
           zones: [{ name: "Fairway Left", x: -10, y: 280 }]
       },
       {
           number: 14, par: 4, distance: 360, pinX: 0, pinY: 360, pinZ: 2, greenType: "The False Front", fairwayWidth: 30, greenRadius: 16,
           pinLocation: "Center",
           description: "A tight, claustrophobic 360-yard Par 4 carved through a grove of dead pine trees.",
           fairwayDescription: "Missing the dirt fairway means landing directly on slick, frictionless pine straw. A dry sand gulley guards the front-right of the green.",
           caddyNotes: [
               { level: 1, trigger: 'Tee', text: 'Extremely tight fairway. Avoid the pine straw on the edges.' },
               { level: 3, trigger: 'Tee', text: 'If you miss the dirt, you are in the pine straw. You cannot generate any backspin off pine straw. You have to carry the sand gulley on the approach, but do not fly it long.' }
           ],
           hazards: [
               { type: "Pine Needles", distance: 50, depth: 350, side: "Left", offset: -25, width: 15 },
               { type: "Pine Needles", distance: 50, depth: 350, side: "Right", offset: 25, width: 15 },
               { type: "Dry Sand Gulley", distance: 340, depth: 15, side: "Right", offset: 10, width: 20 }
           ],
           landingZones: [
               { name: "Narrow Fairway", x: 0, y: 240, z: 0, tilt: 0, slope: 0 },
               { name: "Green Approach", x: -5, y: 345, z: 2, tilt: 0, slope: 0 }
           ],
           zones: [{ name: "Narrow Fairway", x: 0, y: 240 }]
       },
       {
           number: 15, par: 3, distance: 185, pinX: 0, pinY: 185, pinZ: 0, greenType: "Flat", fairwayWidth: 20, greenRadius: 18,
           pinLocation: "Center",
           description: "A 185-yard Par 3 requiring a full carry over a deep, rocky ravine. A leaking water tower sits out back.",
           fairwayDescription: "Pure carry over the ravine. The back of the green drops off into a muddy swamp.",
           caddyNotes: [
               { level: 1, trigger: 'Tee', text: 'You have to carry the ravine. Do not go long.' },
               { level: 3, trigger: 'Tee', text: 'You have to carry the ravine. Take enough club, but do not go long. The water tower has been leaking for a decade and the back of the green is a muddy swamp.' }
           ],
           hazards: [
               { type: "Rocky Ravine", distance: 0, depth: 160, side: "Center", offset: 0, width: 100 },
               { type: "Leaking Water Tower", distance: 215, depth: 20, side: "Center", offset: 0, width: 20 },
               { type: "Mud Swamp (Water)", distance: 205, depth: 20, side: "Center", offset: 0, width: 40 }
           ],
           landingZones: [{ name: "Green Center", x: 0, y: 185, z: 0, tilt: 0, slope: 0 }],
           zones: [{ name: "Green Center", x: 0, y: 185 }]
       },
       {
           number: 16, par: 4, distance: 450, pinX: -10, pinY: 450, pinZ: -3, greenType: "Flat", fairwayWidth: 40, greenRadius: 17,
           pinLocation: "Left",
           description: "A brilliant 450-yard Par 4. The same dry creek bed snakes through this fairway twice.",
           fairwayDescription: "The creek crosses at 240 yards, and again directly in front of the green at 430 yards.",
           caddyNotes: [
               { level: 1, trigger: 'Tee', text: 'Decide if you want to lay up short of the creek, or carry it.' },
               { level: 3, trigger: 'Tee', text: 'The dry creek snakes through this hole twice. Decide off the tee: lay up short of the first crossing, or bomb it over and risk a downhill lie for your approach.' }
           ],
           hazards: [
               { type: "Dry Creek Bend 1", distance: 240, depth: 15, side: "Center", offset: 0, width: 50 },
               { type: "Dry Creek Bend 2", distance: 430, depth: 15, side: "Center", offset: -5, width: 40 }
           ],
           landingZones: [
               { name: "Safe Layup (Short)", x: 0, y: 225, z: 0, tilt: 0, slope: 0 },
               { name: "Aggressive Carry", x: 5, y: 280, z: -2, tilt: 0, slope: -3 },
               { name: "Green Approach", x: -5, y: 415, z: -3, tilt: 0, slope: 0 }
           ],
           zones: [{ name: "Safe Layup", x: 0, y: 225 }, { name: "Aggressive Carry", x: 5, y: 280 }]
       },
       {
           number: 17, par: 4, distance: 310, pinX: 0, pinY: 310, pinZ: 0, greenType: "The Turtleback", fairwayWidth: 45, greenRadius: 14,
           pinLocation: "Center",
           description: "A short 310-yard Par 4. The direct line to the green is an incredibly narrow chute between towering shipping containers.",
           fairwayDescription: "You can lay up to the wide right fairway, or thread the 15-yard-wide needle between the metal containers.",
           caddyNotes: [
               { level: 1, trigger: 'Tee', text: 'Short par 4. Lay up right, or thread the needle to drive the green.' },
               { level: 3, trigger: 'Tee', text: 'It is only 310 yards. You can hit a wedge out to the right for a safe layup, or you can try to thread the needle through the shipping containers and drive the green. Your call.' }
           ],
           hazards: [
               { type: "Shipping Containers", distance: 200, depth: 80, side: "Left", offset: -15, width: 20 },
               { type: "Shipping Containers", distance: 200, depth: 80, side: "Right", offset: 15, width: 20 }
           ],
           landingZones: [
               { name: "Bailout Right", x: 30, y: 230, z: 0, tilt: 0, slope: 0 },
               { name: "The Needle", x: 0, y: 240, z: 0, tilt: 0, slope: 0 },
               { name: "Green Approach", x: 0, y: 295, z: 0, tilt: 0, slope: 3 }
           ],
           zones: [{ name: "Bailout Right", x: 30, y: 230 }, { name: "The Needle", x: 0, y: 240 }]
       },
       {
           number: 18, par: 5, distance: 530, pinX: 0, pinY: 530, pinZ: 20, greenType: "The False Front", fairwayWidth: 45, greenRadius: 20,
           pinLocation: "Back-Center",
           description: "A grueling 530-yard finishing hole playing severely uphill the entire way.",
           fairwayDescription: "An uphill climb. The green is surrounded by steep, stadium-like tiers of compacted scrap metal cubes.",
           caddyNotes: [
               { level: 1, trigger: 'Tee', text: 'Plays severely uphill. Take extra club.' },
               { level: 3, trigger: 'Tee', text: 'The finishing hole. 530 yards straight up the hill to the double-wide. It plays at least two clubs longer. Avoid the scrap cubes around the green.' }
           ],
           hazards: [
               { type: "Scrap Metal Tiers", distance: 510, depth: 40, side: "Right", offset: 25, width: 20 },
               { type: "Scrap Metal Tiers", distance: 510, depth: 40, side: "Left", offset: -25, width: 20 },
               { type: "The Double-Wide Trailer", distance: 560, depth: 15, side: "Center", offset: 0, width: 30 }
           ],
           landingZones: [
               { name: "First Layup", x: 0, y: 260, z: 6, tilt: 0, slope: 0 },
               { name: "Second Layup", x: 0, y: 420, z: 12, tilt: 0, slope: 0 },
               { name: "Green Approach", x: 0, y: 510, z: 20, tilt: 0, slope: 0 }
           ],
           zones: [{ name: "Fairway Center", x: 0, y: 260 }, { name: "Fairway Uphill", x: 0, y: 420 }]
       }
   ]
});
