// data_ag.js - Course Data, Clubs, and Shot Styles (v4.3.0)

const windLevels = [
    { name: "Calm", min: 0, max: 4, variance: 1 },
    { name: "Light Breeze", min: 2, max: 7, variance: 3 },
    { name: "Gusts", min: 4, max: 10, variance: 6 },
    { name: "Windy", min: 5, max: 15, variance: 10 }
];

const shotStyles = [
    { name: "Full", distMod: 1.0, loftMod: 0, spinMod: 0, rollMod: 1.0, windMod: 1.0 },
    { name: "Pitch", distMod: 0.55, loftMod: 5, spinMod: 1500, rollMod: 0.6, windMod: 0.25 },
    { name: "Half Pitch", distMod: 0.35, loftMod: 5, spinMod: 1000, rollMod: 0.7, windMod: 0.25 },
    { name: "Chip", distMod: 0.25, loftMod: -15, spinMod: -500, rollMod: 2.5, windMod: 0.25 },
    { name: "Short Chip", distMod: 0.10, loftMod: -20, spinMod: -800, rollMod: 3.0, windMod: 0.25 },
    { name: "Flop", distMod: 0.20, loftMod: 25, spinMod: 3000, rollMod: 0.1, windMod: 0.50 }
];

const clubs = [
    { name: "Driver", baseDistance: 255, maxDispersion: 45, loft: 10, rollPct: 0.12 },
    { name: "3 Wood", baseDistance: 230, maxDispersion: 35, loft: 15, rollPct: 0.08 },
    { name: "5 Wood", baseDistance: 215, maxDispersion: 30, loft: 18, rollPct: 0.06 },
    { name: "4 Iron", baseDistance: 195, maxDispersion: 25, loft: 22, rollPct: 0.05 },
    { name: "5 Iron", baseDistance: 180, maxDispersion: 22, loft: 26, rollPct: 0.04 },
    { name: "6 Iron", baseDistance: 165, maxDispersion: 20, loft: 30, rollPct: 0.03 },
    { name: "7 Iron", baseDistance: 155, maxDispersion: 18, loft: 34, rollPct: 0.02 },
    { name: "8 Iron", baseDistance: 145, maxDispersion: 15, loft: 38, rollPct: 0.01 },
    { name: "9 Iron", baseDistance: 135, maxDispersion: 12, loft: 42, rollPct: 0.00 },
    { name: "Pitching Wedge", baseDistance: 120, maxDispersion: 10, loft: 46, rollPct: -0.01 },
    { name: "Sand Wedge", baseDistance: 100, maxDispersion: 8, loft: 56, rollPct: -0.03 }
];

const stanceNames = ["Far Forward", "Forward", "Neutral", "Back", "Far Back"];
const alignmentNames = ["Severe Closed", "Closed", "Neutral", "Open", "Severe Open"];
const fairwayWidth = 35;

// --- v2.30.0 Course Data with Hazards ---
const courses = [
    {
        name: "The Holodeck Links",
        holes: [
            { 
                number: 1, par: 4, distance: 420, pinX: 0,
                pinY: 420,
                // v4.3.0 Contour Zones. startY is further away, endY is closer to the hole.
                greenContours: [
                    { startY: 30, endY: 10, slopeX: 0.5, slopeY: 0.2 },  // Front tier: Uphill, breaks Right-to-Left
                    { startY: 10, endY: 0, slopeX: -0.4, slopeY: -0.1 }  // Back tier: Downhill, breaks Left-to-Right
                ],
                fairwayWidth: 35, greenRadius: 15,
                pinLocation: "Middle-Center",
                description: "A 420-yard par 4. Water runs down the entire left side, while an Oak and Maple tree pinch the landing zone on the right.",
                fairwayDescription: "The fairway is 35 yards wide but effectively narrower. Water guards the entire left side, and tree clusters pinch the right side of the landing zone at 200 to 250 yards.",
                caddyNotes: [
                    { level: 1, trigger: 'Tee', text: 'Keep it dry. Avoid the left side.' },
                    { level: 2, trigger: 'Tee', text: 'Water left, trees right. Aim slightly right of center to stay safe.' },
                    { level: 3, trigger: 'Tee', text: 'Aim about 5 degrees right to take the water out of play. A slight fade works perfectly here to avoid the right-side trees.' },
                    { level: 3, trigger: 'Trouble_Right', text: 'You are blocked by the trees on the right. Pitch out to the fairway.' }
                ],
                hazards: [{ type: "Water", distance: 100, depth: 250, side: "Left", offset: -45, width: 40 }],
                zones: [{ name: "Safe Drive", x: 0, y: 250 }],
                trees: [
                    { x: 15, y: 200, radius: 5, height: 25, name: "Oak Tree" },
                    { x: -18, y: 250, radius: 4, height: 20, name: "Maple Tree" }
                ]
            },
            { 
                number: 2, par: 3, distance: 165, pinX: -15, pinY: 164, fairwayWidth: 25, greenRadius: 12,
                pinLocation: "Front-Left",
                description: "A 165-yard par 3. The pin is tucked safely on the left, but a bunker fiercely guards the front-right of the green.",
                fairwayDescription: "There is no fairway. It is a 165-yard carry over rough directly to the green.",
                caddyNotes: [
                    { level: 1, trigger: 'Tee', text: 'It is a Par 3. Hit the green.' },
                    { level: 2, trigger: 'Tee', text: 'Watch out for the bunker guarding the front-right of the green.' },
                    { level: 3, trigger: 'Tee', text: 'The pin is tucked front-left. If you aim straight at the flag, the front-right bunker is mostly out of play. Do not miss short.' }
                ],
                hazards: [{ type: "Bunker", distance: 152, depth: 15, offset: 15, width: 10 }],
                zones: [{ name: "Green Center", x: 0, y: 160 }]
            },
            { 
                number: 3, par: 5, distance: 540, pinX: 60, pinY: 537, fairwayWidth: 40, greenRadius: 18,
                approachWidth: 10, apronRadius: 20,
                pinLocation: "Back-Right",
                description: "A massive 540-yard par 5. A 40-yard wide bunker sits dead center at 270 yards, demanding a strategic layup or a brave, aggressive carry.",
                fairwayDescription: "The fairway is 40 yards wide, but split by a massive 40-yard wide bunker at 270 yards. There is a 15-yard safe gap to the left of the bunker.",
                caddyNotes: [
                    { level: 1, trigger: 'Tee', text: 'A long Par 5. Hit it straight and far.' },
                    { level: 2, trigger: 'Tee', text: 'Watch out for the massive bunker at 270 yards covering the center-right.' },
                    { level: 3, trigger: 'Tee', text: 'There is a narrow 15-yard gap to the left of the 270-yard bunker. Aim about 10 degrees left to thread the needle and set up an Eagle approach.' },
                    { level: 3, trigger: 'Trouble_Left', text: 'You missed left, but you have a clear angle past the bunker. If you have the distance, you can go straight for the green.' },
                    { level: 3, trigger: 'Trouble_Right', text: 'You are blocked out right. Pitch back into the fairway center; do not mess with the bunker.' },
                    { level: 3, trigger: 'Bunker_Fairway', text: 'You found the fairway bunker. The lip is not too high, but club up. Do not try to hit a 3-Wood out of here, just advance a mid-iron.' },
                    { level: 3, trigger: 'Rough_Deep', text: 'The grass will grab the hosel here. Take a higher lofted iron and just get it back in play.' },
                    { level: 3, trigger: 'Approach_Long', text: 'You are in the fairway but too far to reach. Lay up to the 100-yard marker. The fairway widens out nicely there.' },
                    { level: 3, trigger: 'Approach_Scoring', text: 'Perfect position. You have a scoring wedge in your hand. The green slopes back-to-front, so keep the ball below the hole.' },
                    { level: 3, trigger: 'Greenside', text: 'The green is fast and slopes away. Play the ball back in your stance to maximize your backspin and get some bite.' }
                ],
                hazards: [{ type: "Bunker", distance: 270, depth: 20, side: "Center", offset: 0, width: 40 }],
                zones: [{ name: "First Layup", x: 0, y: 250 }, { name: "Aggressive Carry", x: 10, y: 300 }, { name: "Approach Layup", x: 15, y: 440 }]
            },
            { 
                number: 4, par: 4, distance: 330, pinX: 0, pinY: 330, fairwayWidth: 35, greenRadius: 15,
                pinLocation: "Center",
                description: "A 330-yard driveable par 4. A massive, deep bunker protects the front of the green, and a 30-foot tree cluster pinches the left side of the fairway.",
                caddyNotes: [
                    { level: 1, trigger: 'Tee', text: 'It is a dogleg. Find the fairway.' },
                    { level: 2, trigger: 'Tee', text: 'Sharp dogleg right. The trees block a direct shot to the green, so you must lay up to the corner.' },
                    { level: 3, trigger: 'Tee', text: 'To hit the elbow of the fairway perfectly, you need about 240 yards of carry aimed straight ahead. That will leave a clear 150-yard approach.' },
                    { level: 3, trigger: 'Trouble_Right', text: 'You are blocked by the trees on the right. Pitch out sideways to the fairway; do not try to be a hero through the branches.' }
                ],
                hazards: [{ type: "Bunker", distance: 290, depth: 30, side: "Center", offset: 0, width: 30 }],
                trees: [{ x: -15, y: 250, radius: 10, height: 30, name: "Left Woods" }],
                zones: [{ name: "Safe Layup", x: 15, y: 240 }, { name: "Go For It", x: 0, y: 330 }]
            },
            { 
                number: 5, par: 4, distance: 440, pinX: 20, pinY: 440, fairwayWidth: 35, greenRadius: 15,
                pinLocation: "Back-Right",
                description: "A 440-yard dogleg right. A 50-foot tall forest completely blocks the direct line to the green from the tee, forcing you to play out to the left fairway.",
                fairwayDescription: "A 35-yard wide dogleg right. You cannot cut the corner due to a massive 50-foot forest blocking the direct line. You must hit out to the left side of the fairway.",
                caddyNotes: [
                    { level: 1, trigger: 'Tee', text: 'Dogleg right. Lay up.' },
                    { level: 2, trigger: 'Tee', text: 'Do not try to go over the trees on the right. Hit it straight down the fairway.' },
                    { level: 3, trigger: 'Tee', text: 'Aim left of center about 250 yards out. That gives you a clear angle to the back-right pin. Anything right is dead.' }
                ],
                hazards: [],
                trees: [{ x: 20, y: 260, radius: 15, height: 50, name: "The Corner Forest" }],
                zones: [{ name: "Fairway Center", x: -15, y: 260 }]
            },
            { 
                number: 6, par: 5, distance: 510, pinX: 0, pinY: 510, fairwayWidth: 35, greenRadius: 15,
                pinLocation: "Center",
                description: "A reachable 510-yard par 5. The green is an island peninsula, surrounded by a water moat that spans the entire fairway from 480 to 495 yards.",
                fairwayDescription: "The fairway is a straight, 35-yard wide strip with no hazards until the water at 480 yards. It is wide open with plenty of safe grass, though there are no defined target zones before the 460-yard approach layup.",
                caddyNotes: [
                    { level: 1, trigger: 'Tee', text: 'A long Par 5. Hit it straight.' },
                    { level: 3, trigger: 'Tee', text: 'You have a wide-open fairway for your first two shots. Focus on distance and setting up a comfortable yardage for your water approach.' },
                    { level: 1, trigger: 'Approach', text: 'Do not hit it in the water.' },
                    { level: 2, trigger: 'Approach', text: 'Island green approach. Check the wind carefully before you swing.' },
                    { level: 3, trigger: 'Approach', text: 'If the wind is in your face, club up. If you are not confident, aim for the left edge of the green-there is a small bailout area of grass there.' }
                ],
                hazards: [{ type: "Water", distance: 480, depth: 15, side: "Center", offset: 0, width: 100 }],
                trees: [],
                zones: [{ name: "Approach Layup", x: 0, y: 460 }, { name: "Aggressive Carry", x: 0, y: 510 }]
            },
            { 
                number: 7, par: 3, distance: 215, pinX: 10, pinY: 212, fairwayWidth: 25, greenRadius: 12,
                pinLocation: "Right",
                description: "A brutal 215-yard par 3. A 40-foot tall Guardian Oak stands just short and right of the green, directly blocking the tucked pin. A bunker waits on the left.",
                fairwayDescription: "There is no fairway. A 215-yard carry over rough directly to the green.",
                caddyNotes: [
                    { level: 1, trigger: 'Tee', text: 'A long Par 3.' },
                    { level: 2, trigger: 'Tee', text: 'A massive oak tree is blocking the right side of the green.' },
                    { level: 3, trigger: 'Tee', text: 'The Guardian Oak blocks a direct shot to the right pin. You have to play a high fade around it, or just aim for the left center of the green and accept a long two-putt.' }
                ],
                hazards: [{ type: "Bunker", distance: 195, depth: 25, side: "Left", offset: -15, width: 15 }],
                trees: [{ x: 10, y: 180, radius: 8, height: 40, name: "The Guardian Oak" }],
                zones: [{ name: "Green Center", x: -5, y: 215 }]
            },
            { 
                number: 8, par: 4, distance: 400, pinX: 0, pinY: 400, fairwayWidth: 20, greenRadius: 15,
                pinLocation: "Center",
                description: "A claustrophobic 400-yard par 4. The fairway is only 20 yards wide, heavily pinched by massive tree clusters on both the left and right at 250 yards. Driver is not recommended.",
                fairwayDescription: "An extremely narrow 20-yard fairway, heavily pinched by dense woods on both sides at the 250-yard mark.",
                caddyNotes: [
                    { level: 1, trigger: 'Tee', text: 'Very narrow hole.' },
                    { level: 2, trigger: 'Tee', text: 'Driver is risky here with the trees squeezing the fairway.' },
                    { level: 3, trigger: 'Tee', text: 'Leave the driver in the bag. Hit a 3-Wood or long iron to the 200-yard mark. The approach is much easier from the fairway than the woods.' }
                ],
                hazards: [],
                trees: [{ x: -20, y: 250, radius: 12, height: 40, name: "Left Woods" }, { x: 20, y: 250, radius: 12, height: 40, name: "Right Woods" }],
                zones: [{ name: "Tactical Tee", x: 0, y: 200 }]
            },
            { 
                number: 9, par: 4, distance: 460, pinX: -10, pinY: 460, fairwayWidth: 35, greenRadius: 15,
                pinLocation: "Left",
                description: "A terrifying 460-yard finishing hole. A massive lake runs the entire right side from 100 yards all the way to the green.",
                fairwayDescription: "A 35-yard wide fairway. The entire right side, from 100 yards out all the way to the green, is guarded by a massive lake.",
                caddyNotes: [
                    { level: 1, trigger: 'Tee', text: 'Water on the right.' },
                    { level: 2, trigger: 'Tee', text: 'Keep it left the whole way down the hole.' },
                    { level: 3, trigger: 'Tee', text: 'Aim 10 degrees left off the tee to take the lake completely out of play.' },
                    { level: 3, trigger: 'Approach', text: 'The pin is tucked left, giving you plenty of room to bail out away from the water.' }
                ],
                hazards: [{ type: "Water", distance: 100, depth: 380, side: "Right", offset: 35, width: 40 }],
                trees: [],
                zones: [{ name: "Fairway Left", x: -15, y: 250 }]
            }
        ]
    }
];
let currentCourseIndex = 0;

const helpMenuText = [
    { text: "Accessible Golf Engine Help Menu. Heading Level 1.", heading: true },
    { text: "Use the Up and Down arrows to navigate this guide. Press Escape or Enter at any time to close.", heading: false },
    
    { text: "The Swing Mechanic: Heading Level 2.", heading: true },
    { text: "The Swing Mechanic is divided into 4 phases. You will use the Down Arrow and the Spacebar to control your shot.", heading: false },
    { text: "Phase 1: The Backswing.", heading: false },
    { text: "Press and hold the Down Arrow. This initiates the backswing and begins the timing metronome sounds for the swing hinge, or amount you cock your wrist.", heading: false },
    { text: "There will be 4 metronome sounds and you need to press your spacebar during this first 2 second segment to lock your backswing hinge, thus cocking your wrists back.", heading: false },
    
    { text: "Phase 2: The Power Phase.", heading: false },
    { text: "You will have been holding down the down arrow during phase 1, and now, keep holding it down to set your power.", heading: false },
    { text: "There will be audio pings for power at 25, 50 75 and finally, 100 percent, which has a bright definitive ding.", heading: false },
    { text: "Release the down arrow to set your power. Remember: You can overswing up to 120% but the forgiveness on other meters is drastically reduced. Overswinging can cause wild results. You have been warned.", heading: false },
    
    { text: "Phase 3: The Downswing.", heading: false },
    { text: "When the downswing starts, you will re-enter the metronome phase.", heading: false },
    { text: "Press the spacebar again and time it to the point when you set your hinge during backswing. You need to match the timing on hinge to get a boost to power. Mistiming can cause fat or thin shots because the club does not strike the ball perfectly.", heading: false },
    { text: "Note: You can skip using hinge and get no bonus or penalty by simply not setting hinge with spacebar, however, if you set hinge, you need to release as well by pressing spacebar a second time.", heading: false },
    
    { text: "Phase 4: The Impact Zone.", heading: false },
    { text: "After you set or skip hinge, the down tone will continue to drop and you will hear 4 pings to set your timing to press the down arrow and strike the ball.", heading: false },
    { text: "Press the Down Arrow exactly when it hits the bottom to strike the ball perfectly.", heading: false },
    { text: "Striking the ball early or late will add sidespin and cause hooks or slices.", heading: false },
    
    { text: "General Keybinds: Heading Level 2.", heading: true },
    { text: "Course Navigation: Press numbers 1 through 9 to warp to the front nine holes. Hold Shift and press 1 through 9 for the back nine.", heading: false },
    { text: "Setup and Aim: Left and Right arrows adjust your aim 1 degree at a time.", heading: false },
    { text: "Shift Left and Right Arrows open and close your stance. Each adjustment adds or removes 800 rpm of side spin.", heading: false },
    { text: "Home and End adjust ball placement in your stance. Moving the ball forward in your stance adds loft in 5 degree amounts while moving the ball back in your stance removes 5 degrees of loft at a time.", heading: false },
    
    { text: "Equipment: Heading Level 2.", heading: true },
    { text: "Page Up and Page Down cycle through your clubs.", heading: false },
    { text: "Press X to hear the club in your hand and expected distance.", heading: false },
    { text: "Press S to cycle shot styles like Pitch or Flop from normal through a variety of short game swing types.", heading: false },
    { text: "Note: For auditory players, it is often easier to adjust swing style, club choice, and ball position in order to have 100% power be the correct distance. Trying to hit 85% power is difficult without a visual meter.", heading: false },
    
    { text: "Environment: Heading Level 2.", heading: true },
    { text: "Press W to read the wind.", heading: false },
    { text: "Press Shift W to change wind speed in environments in which you are allowed.", heading: false },
    { text: "Press L to hear your lie.", heading: false },
    { text: "Press L on the holo range to cycle terrain types under the ball. It's why it's a holo range.", heading: false },
    
    { text: "Information: Heading Level 2.", heading: true },
    { text: "Many of these may not be available at all times in all areas.", heading: false },
    { text: "Press A to hear Caddy advice.", heading: false },
    { text: "Press Shift A to change Caddy skill level.", heading: false },
    { text: "Press F to read the fairway description.", heading: false },
    { text: "Press H to open the navigable Hazard list.", heading: false },
    { text: "Press Z to shift between available target zones on the fairway.", heading: false },
    
    { text: "Game Modes: Heading Level 2.", heading: true },
    { text: "Press R to warp to the Driving Range.", heading: false },
    { text: "Press G to warp to the Chipping Green.", heading: false },
    { text: "Press Shift G to warp to the Pitch and long-chip green.", heading: false }
];