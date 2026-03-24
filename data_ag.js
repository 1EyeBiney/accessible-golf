// data_ag.js - Course Data, Clubs, and Shot Styles (v4.82.0)

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
    { name: "Driver", baseDistance: 230, maxDispersion: 45, loft: 10, rollPct: 0.12 },
    { name: "3 Wood", baseDistance: 210, maxDispersion: 35, loft: 15, rollPct: 0.08 },
    { name: "5 Wood", baseDistance: 195, maxDispersion: 30, loft: 18, rollPct: 0.06 },
    { name: "4 Iron", baseDistance: 180, maxDispersion: 25, loft: 22, rollPct: 0.05 },
    { name: "5 Iron", baseDistance: 165, maxDispersion: 22, loft: 26, rollPct: 0.04 },
    { name: "6 Iron", baseDistance: 155, maxDispersion: 20, loft: 30, rollPct: 0.03 },
    { name: "7 Iron", baseDistance: 145, maxDispersion: 18, loft: 34, rollPct: 0.02 },
    { name: "8 Iron", baseDistance: 135, maxDispersion: 15, loft: 38, rollPct: 0.01 },
    { name: "9 Iron", baseDistance: 125, maxDispersion: 12, loft: 42, rollPct: 0.00 },
    { name: "Pitching Wedge", baseDistance: 110, maxDispersion: 10, loft: 46, rollPct: -0.01 },
    { name: "Sand Wedge", baseDistance: 90, maxDispersion: 8, loft: 56, rollPct: -0.03 }
];

const stanceNames = ["Far Forward", "Forward", "Neutral", "Back", "Far Back"];
const alignmentNames = ["Severe Closed", "Closed", "Neutral", "Open", "Severe Open"];
const fairwayWidth = 35;

// v4.7.0 Green Architecture Dictionary
const greenDictionary = {
    "The Welcoming Bowl": [{ startY: 40, endY: 0, slopeX: 0.0, slopeY: 0.15 }], // Gentle back-to-front slope
    "The Redan": [{ startY: 40, endY: 0, slopeX: 0.5, slopeY: -0.1 }], // Slopes right-to-left and slightly away
    "The False Front": [
        { startY: 40, endY: 15, slopeX: 0.0, slopeY: 0.1 },  // Back flat
        { startY: 15, endY: 0, slopeX: 0.0, slopeY: 0.8 }    // Steep front ridge
    ],
    "The Saddle": [{ startY: 40, endY: 0, slopeX: 0.0, slopeY: 0.0 }], // Center line is completely flat
    "The Two-Tiered Step": [
        { startY: 40, endY: 20, slopeX: -0.2, slopeY: 0.0 }, // Back tier
        { startY: 20, endY: 15, slopeX: -0.2, slopeY: 0.7 }, // Middle ridge
        { startY: 15, endY: 0, slopeX: 0.2, slopeY: 0.0 }    // Front tier
    ],
    "The Turtleback": [
        { startY: 40, endY: 20, slopeX: 0.3, slopeY: -0.3 }, // Back downhill
        { startY: 20, endY: 0, slopeX: -0.3, slopeY: 0.5 }   // Front uphill (Crown at 20y)
    ],
    "The Augusta Monster": [
        { startY: 45, endY: 25, slopeX: 0.8, slopeY: 0.4 },  // False Front
        { startY: 25, endY: 10, slopeX: -0.3, slopeY: 0.0 }, // Plateau
        { startY: 10, endY: 0, slopeX: 0.6, slopeY: -0.3 }   // Bowl
    ],
    "The Serpentine": [
        { startY: 40, endY: 25, slopeX: 0.5, slopeY: 0.1 },
        { startY: 25, endY: 10, slopeX: -0.5, slopeY: 0.1 },
        { startY: 10, endY: 0, slopeX: 0.5, slopeY: 0.1 }
    ],
    "The Shelf": [{ startY: 40, endY: 0, slopeX: 0.8, slopeY: -0.1 }] // Severe lateral break towards water
};

// --- v2.30.0 Course Data with Hazards ---
const courses = [
    {
        name: "The Holodeck Links",
        holes: [
            { 
                number: 1, par: 4, distance: 420, pinX: 0,
                pinY: 420,
                greenType: "The Welcoming Bowl",
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
                landingZones: [{ name: "Drive Target", x: 0, y: 240 }, { name: "Layup Area", x: 0, y: 340 }, { name: "Aggressive Approach", x: 15, y: 410 }],
                zones: [{ name: "Safe Drive", x: 0, y: 250 }],
                trees: [
                    { x: 15, y: 200, radius: 5, height: 25, name: "Oak Tree" },
                    { x: -18, y: 250, radius: 4, height: 20, name: "Maple Tree" }
                ]
            },
            { 
                number: 2, par: 3, distance: 165, pinX: -15, pinY: 164, greenType: "The Redan", fairwayWidth: 25, greenRadius: 12,
                pinLocation: "Front-Left",
                description: "A 165-yard par 3. The pin is tucked safely on the left, but a bunker fiercely guards the front-right of the green.",
                fairwayDescription: "There is no fairway. It is a 165-yard carry over rough directly to the green.",
                caddyNotes: [
                    { level: 1, trigger: 'Tee', text: 'It is a Par 3. Hit the green.' },
                    { level: 2, trigger: 'Tee', text: 'Watch out for the bunker guarding the front-right of the green.' },
                    { level: 3, trigger: 'Tee', text: 'The pin is tucked front-left. If you aim straight at the flag, the front-right bunker is mostly out of play. Do not miss short.' }
                ],
                hazards: [{ type: "Bunker", distance: 152, depth: 15, offset: 15, width: 10 }],
                landingZones: [
                    { name: "Layup Target", x: 0, y: 100 },
                    { name: "Green Front", x: 0, y: 155 }
                ],
                zones: [{ name: "Green Center", x: 0, y: 160 }]
            },
            { 
                number: 3, par: 5, distance: 540, pinX: 60, pinY: 537, greenType: "The False Front", fairwayWidth: 40, greenRadius: 18,
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
                landingZones: [
                    { name: "Drive Landing", x: 0, y: 250 },
                    { name: "Second Shot Target", x: 0, y: 400 },
                    { name: "Green Approach", x: 0, y: 510 }
                ],
                zones: [{ name: "First Layup", x: 0, y: 250 }, { name: "Aggressive Carry", x: 10, y: 300 }, { name: "Approach Layup", x: 15, y: 440 }]
            },
            { 
                number: 4, par: 4, distance: 330, pinX: 0, pinY: 330, greenType: "The Saddle", fairwayWidth: 35, greenRadius: 15,
                pinLocation: "Center",
                description: "A 330-yard driveable par 4. A massive, deep bunker protects the front of the green, and a 30-foot tree cluster pinches the left side of the fairway.",
                caddyNotes: [
                    { level: 1, trigger: 'Tee', text: 'It is a dogleg. Find the fairway.' },
                    { level: 2, trigger: 'Tee', text: 'Sharp dogleg right. The trees block a direct shot to the green, so you must lay up to the corner.' },
                    { level: 3, trigger: 'Tee', text: 'To hit the elbow of the fairway perfectly, you need about 240 yards of carry aimed straight ahead. That will leave a clear 150-yard approach.' },
                    { level: 3, trigger: 'Trouble_Right', text: 'You are blocked by the trees on the right. Pitch out sideways to the fairway; do not try to be a hero through the branches.' }
                ],
                hazards: [{ type: "Bunker", distance: 290, depth: 30, side: "Center", offset: 0, width: 30 }],
                landingZones: [{ name: "Mid Fairway", x: 0, y: 220 }, { name: "Approach Area", x: 0, y: 280 }],
                trees: [{ x: -15, y: 250, radius: 10, height: 30, name: "Left Woods" }],
                zones: [{ name: "Safe Layup", x: 15, y: 240 }, { name: "Go For It", x: 0, y: 330 }]
            },
            { 
                number: 5, par: 4, distance: 440, pinX: 20, pinY: 440, greenType: "The Two-Tiered Step", fairwayWidth: 35, greenRadius: 15,
                pinLocation: "Back-Right",
                description: "A 440-yard dogleg right. A 50-foot tall forest completely blocks the direct line to the green from the tee, forcing you to play out to the left fairway.",
                fairwayDescription: "A 35-yard wide dogleg right. You cannot cut the corner due to a massive 50-foot forest blocking the direct line. You must hit out to the left side of the fairway.",
                caddyNotes: [
                    { level: 1, trigger: 'Tee', text: 'Dogleg right. Lay up.' },
                    { level: 2, trigger: 'Tee', text: 'Do not try to go over the trees on the right. Hit it straight down the fairway.' },
                    { level: 3, trigger: 'Tee', text: 'Aim left of center about 250 yards out. That gives you a clear angle to the back-right pin. Anything right is dead.' }
                ],
                hazards: [],
                landingZones: [
                    { name: "Drive Target", x: 0, y: 240 },
                    { name: "Layup", x: 0, y: 350 }
                ],
                trees: [{ x: 20, y: 260, radius: 15, height: 50, name: "The Corner Forest" }],
                zones: [{ name: "Fairway Center", x: -15, y: 260 }]
            },
            { 
                number: 6, par: 5, distance: 510, pinX: 0, pinY: 510, greenType: "The Turtleback", fairwayWidth: 35, greenRadius: 15,
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
                landingZones: [{ name: "Drive Target", x: 0, y: 260 }, { name: "Approach Layup", x: 0, y: 460 }],
                trees: [],
                zones: [{ name: "Approach Layup", x: 0, y: 460 }, { name: "Aggressive Carry", x: 0, y: 510 }]
            },
            { 
                number: 7, par: 3, distance: 215, pinX: 10, pinY: 212, greenType: "The Augusta Monster", fairwayWidth: 25, greenRadius: 12,
                pinLocation: "Right",
                description: "A brutal 215-yard par 3. A 40-foot tall Guardian Oak stands just short and right of the green, directly blocking the tucked pin. A bunker waits on the left.",
                fairwayDescription: "There is no fairway. A 215-yard carry over rough directly to the green.",
                caddyNotes: [
                    { level: 1, trigger: 'Tee', text: 'A long Par 3.' },
                    { level: 2, trigger: 'Tee', text: 'A massive oak tree is blocking the right side of the green.' },
                    { level: 3, trigger: 'Tee', text: 'The Guardian Oak blocks a direct shot to the right pin. You have to play a high fade around it, or just aim for the left center of the green and accept a long two-putt.' }
                ],
                hazards: [{ type: "Bunker", distance: 195, depth: 25, side: "Left", offset: -15, width: 15 }],
                landingZones: [{ name: "Safe Green Center", x: -5, y: 215 }],
                trees: [{ x: 10, y: 180, radius: 8, height: 40, name: "The Guardian Oak" }],
                zones: [{ name: "Green Center", x: -5, y: 215 }]
            },
            { 
                number: 8, par: 4, distance: 400, pinX: 0, pinY: 400, greenType: "The Serpentine", fairwayWidth: 20, greenRadius: 15,
                pinLocation: "Center",
                description: "A claustrophobic 400-yard par 4. The fairway is only 20 yards wide, heavily pinched by massive tree clusters on both the left and right at 250 yards. Driver is not recommended.",
                fairwayDescription: "An extremely narrow 20-yard fairway, heavily pinched by dense woods on both sides at the 250-yard mark.",
                caddyNotes: [
                    { level: 1, trigger: 'Tee', text: 'Very narrow hole.' },
                    { level: 2, trigger: 'Tee', text: 'Driver is risky here with the trees squeezing the fairway.' },
                    { level: 3, trigger: 'Tee', text: 'Leave the driver in the bag. Hit a 3-Wood or long iron to the 200-yard mark. The approach is much easier from the fairway than the woods.' }
                ],
                hazards: [],
                landingZones: [
                    { name: "Fairway Center", x: 0, y: 200 },
                    { name: "Wedge Range", x: 0, y: 320 }
                ],
                trees: [{ x: -20, y: 250, radius: 12, height: 40, name: "Left Woods" }, { x: 20, y: 250, radius: 12, height: 40, name: "Right Woods" }],
                zones: [{ name: "Tactical Tee", x: 0, y: 200 }]
            },
            { 
                number: 9, par: 4, distance: 460, pinX: -10, pinY: 460, greenType: "The Shelf", fairwayWidth: 35, greenRadius: 15,
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
                landingZones: [
                    { name: "Long Drive", x: 0, y: 260 },
                    { name: "Mid Fairway", x: 0, y: 360 }
                ],
                trees: [],
                zones: [{ name: "Fairway Left", x: -15, y: 250 }]
            }
            ,{ 
                number: 10, par: 4, distance: 410, pinX: 0, pinY: 410, greenType: "The Saddle", fairwayWidth: 30, greenRadius: 15,
                pinLocation: "Center",
                description: "A 410-yard par 4 to start the back nine. A massive weeping willow guards the left side of the fairway at 260 yards, forcing drives to the right.",
                fairwayDescription: "The fairway is 30 yards wide. A large weeping willow overhangs the left side of the landing zone at 260 yards.",
                caddyNotes: [
                    { level: 1, trigger: 'Tee', text: 'Keep your drive down the right side.' },
                    { level: 3, trigger: 'Tee', text: 'Aim 5 degrees right. The weeping willow on the left will swallow any draws that don\'t turn back in time.' },
                    { level: 3, trigger: 'Trouble_Left', text: 'You are stuck under the willow. Use your Edge Finder to calculate a low punch out. Don\'t get greedy.' }
                ],
                hazards: [],
                landingZones: [
                    { name: "Safe Drive Right", x: 10, y: 250 },
                    { name: "Aggressive Drive", x: 0, y: 280 },
                    { name: "Approach Area", x: 0, y: 350 },
                    { name: "Green Center", x: 0, y: 410 }
                ],
                trees: [{ x: -15, y: 260, radius: 10, height: 45, name: "Weeping Willow" }],
                zones: [{ name: "Green Center", x: 0, y: 410 }]
            },
            { 
                number: 11, par: 3, distance: 185, pinX: 10, pinY: 182, greenType: "The Redan", fairwayWidth: 25, greenRadius: 14,
                pinLocation: "Back-Right",
                description: "A gorgeous but deadly 185-yard par 3. You must carry a deep ravine that eats anything short. The green slopes severely right-to-left.",
                fairwayDescription: "No fairway. It's a 160-yard forced carry over a ravine to reach the safety of the green.",
                caddyNotes: [
                    { level: 1, trigger: 'Tee', text: 'Take enough club to carry the ravine.' },
                    { level: 2, trigger: 'Tee', text: 'The green slopes hard to the left. Aim right of the flag.' },
                    { level: 3, trigger: 'Tee', text: 'The Redan green will kick the ball left. Aim 10 yards right of the pin and let the slope feed it down to the hole.' }
                ],
                hazards: [{ type: "Water", distance: 20, depth: 140, side: "Center", offset: 0, width: 80 }],
                landingZones: [
                    { name: "Safe Bailout Right", x: 15, y: 175 },
                    { name: "Green Center", x: 0, y: 185 }
                ],
                trees: [],
                zones: [{ name: "Green Target", x: 10, y: 182 }]
            },
            { 
                number: 12, par: 5, distance: 525, pinX: -20, pinY: 525, greenType: "The Two-Tiered Step", fairwayWidth: 35, greenRadius: 16,
                pinLocation: "Back-Left",
                description: "A sweeping 525-yard par 5 dogleg left. A perfect drive gives you a chance to go for the green in two, but a nest of bunkers protects the ideal layup zone.",
                fairwayDescription: "The fairway bends left at 280 yards. At 400 yards, a cluster of fairway bunkers pinches the width down to just 15 yards.",
                caddyNotes: [
                    { level: 1, trigger: 'Tee', text: 'Hit a draw off the tee to follow the fairway.' },
                    { level: 3, trigger: 'Tee', text: 'A draw is perfect here. Aim down the right side and let it turn left to cut the corner.' },
                    { level: 2, trigger: 'Approach_Long', text: 'Watch the bunkers if you are laying up.' },
                    { level: 3, trigger: 'Approach_Long', text: 'You can\'t reach the green. Lay up to the 380-yard mark to stay short of the bunker cluster, leaving a 145-yard approach.' }
                ],
                hazards: [
                    { type: "Bunker", distance: 400, depth: 15, side: "Left", offset: -10, width: 15 },
                    { type: "Bunker", distance: 410, depth: 15, side: "Right", offset: 15, width: 15 }
                ],
                landingZones: [
                    { name: "Corner Drive", x: -10, y: 240 },
                    { name: "Safe Layup", x: 0, y: 380 },
                    { name: "Aggressive Layup", x: 0, y: 430 },
                    { name: "Green Center", x: -20, y: 525 }
                ],
                trees: [{ x: -25, y: 280, radius: 8, height: 50, name: "Corner Pines" }],
                zones: [{ name: "Green Center", x: -20, y: 525 }]
            },
            { 
                number: 13, par: 4, distance: 380, pinX: 0, pinY: 380, greenType: "The Shelf", fairwayWidth: 25, greenRadius: 12,
                pinLocation: "Right",
                description: "A claustrophobic 380-yard par 4. Dense pine trees line both sides of this narrow 25-yard fairway. Accuracy is at an absolute premium.",
                fairwayDescription: "Straight and incredibly narrow. Pine trees encroach on both the left and right sides from tee to green.",
                caddyNotes: [
                    { level: 1, trigger: 'Tee', text: 'Keep the driver in the bag. Find the fairway.' },
                    { level: 3, trigger: 'Tee', text: 'Take a 3-Wood or long iron. The trees will punish anything offline. Play for position.' },
                    { level: 3, trigger: 'Trouble_Left', text: 'You are deep in the pines. Don\'t try a hero shot. Punch out sideways into the fairway.' }
                ],
                hazards: [],
                landingZones: [
                    { name: "Safe Iron Tee Shot", x: 0, y: 220 },
                    { name: "Mid Fairway", x: 0, y: 280 },
                    { name: "Green Center", x: 0, y: 380 }
                ],
                trees: [
                    { x: -18, y: 200, radius: 6, height: 60, name: "Left Pines" },
                    { x: 18, y: 240, radius: 6, height: 60, name: "Right Pines" },
                    { x: -18, y: 300, radius: 6, height: 60, name: "Deep Left Pines" }
                ],
                zones: [{ name: "Green Center", x: 0, y: 380 }]
            },
            { 
                number: 14, par: 4, distance: 430, pinX: 0, pinY: 430, greenType: "The Welcoming Bowl", fairwayWidth: 35, greenRadius: 18,
                pinLocation: "Center",
                description: "A straightforward 430-yard par 4. Let the big dog eat. The fairway is wide, but a deep bunker guards the direct front of the green.",
                fairwayDescription: "A wide 35-yard fairway with no hidden tricks until you reach the green.",
                caddyNotes: [
                    { level: 1, trigger: 'Tee', text: 'Swing hard, it is wide open.' },
                    { level: 3, trigger: 'Tee', text: 'No hazards off the tee. 100% power with the Driver to leave a short iron in.' },
                    { level: 3, trigger: 'Approach_Scoring', text: 'The pin is centered, but the front bunker is deep. Take an extra half-club to make sure you carry the sand.' }
                ],
                hazards: [{ type: "Bunker", distance: 405, depth: 10, side: "Center", offset: 0, width: 20 }],
                landingZones: [
                    { name: "Power Drive", x: 0, y: 270 },
                    { name: "Mid Fairway", x: 0, y: 340 },
                    { name: "Green Center", x: 0, y: 430 }
                ],
                trees: [],
                zones: [{ name: "Green Center", x: 0, y: 430 }]
            },
            { 
                number: 15, par: 5, distance: 560, pinX: 15, pinY: 558, greenType: "The False Front", fairwayWidth: 35, greenRadius: 15,
                pinLocation: "Back",
                description: "A monstrous 560-yard par 5. A creek crosses the fairway at 320 yards, meaning even long hitters must decide whether to lay up or attempt a massive carry.",
                fairwayDescription: "The fairway is intersected by a 10-yard wide creek exactly 320 yards from the tee.",
                caddyNotes: [
                    { level: 1, trigger: 'Tee', text: 'A 3-shot hole. Lay up short of the creek.' },
                    { level: 3, trigger: 'Tee', text: 'The creek is at 320 yards. A solid drive will leave you safely short of it, setting up a second shot to the 100-yard marker.' },
                    { level: 3, trigger: 'Approach_Long', text: 'You cleared the creek. Lay up to the 100-yard zone. The green has a severe false front, so you want a full wedge for your third.' }
                ],
                hazards: [{ type: "Water", distance: 320, depth: 10, side: "Center", offset: 0, width: 50 }],
                landingZones: [
                    { name: "Short of Creek", x: 0, y: 290 },
                    { name: "Second Shot Layup", x: 0, y: 450 },
                    { name: "Approach Area", x: 0, y: 500 },
                    { name: "Green Target", x: 15, y: 558 }
                ],
                trees: [],
                zones: [{ name: "Green Target", x: 15, y: 558 }]
            },
            { 
                number: 16, par: 3, distance: 150, pinX: 0, pinY: 150, greenType: "The Turtleback", fairwayWidth: 20, greenRadius: 12,
                pinLocation: "Center",
                description: "A short, terrifying 150-yard par 3. The green is a tiny 'Turtleback' that sheds balls off all sides into deep, punishing bunkers.",
                fairwayDescription: "No fairway. Just a 150-yard shot to a tiny, elevated green surrounded by sand.",
                caddyNotes: [
                    { level: 1, trigger: 'Tee', text: 'Hit the middle of the green. Do not miss.' },
                    { level: 3, trigger: 'Tee', text: 'This green rejects everything. Aim dead center and try to generate as much backspin as possible to hold the putting surface.' },
                    { level: 3, trigger: 'Greenside', text: 'You are in the sand and the green runs away from you. Pop it up soft and let it trickle.' }
                ],
                hazards: [
                    { type: "Bunker", distance: 135, depth: 10, side: "Center", offset: 0, width: 30 },
                    { type: "Bunker", distance: 145, depth: 20, side: "Left", offset: -18, width: 10 },
                    { type: "Bunker", distance: 145, depth: 20, side: "Right", offset: 18, width: 10 },
                    { type: "Bunker", distance: 162, depth: 10, side: "Center", offset: 0, width: 30 }
                ],
                landingZones: [
                    { name: "Dead Center", x: 0, y: 150 }
                ],
                trees: [],
                zones: [{ name: "Green Center", x: 0, y: 150 }]
            },
            { 
                number: 17, par: 4, distance: 450, pinX: -15, pinY: 450, greenType: "The Serpentine", fairwayWidth: 30, greenRadius: 16,
                pinLocation: "Left",
                description: "A grueling 450-yard par 4. A massive oak tree blocks the right side of the fairway at 280 yards, demanding a drive down the riskier left side.",
                fairwayDescription: "A 30-yard fairway. To have a clear approach, you must navigate your drive to the left of the massive Oak sitting on the right side at 280 yards.",
                caddyNotes: [
                    { level: 1, trigger: 'Tee', text: 'Keep the drive to the left.' },
                    { level: 3, trigger: 'Tee', text: 'Aim 5 degrees left. If you leak it right, the Oak tree will completely block your long approach to the green.' },
                    { level: 3, trigger: 'Trouble_Right', text: 'You are blocked by the Oak. You have to lay up short of the green or try a massive hook around it.' }
                ],
                hazards: [],
                landingZones: [
                    { name: "Ideal Drive Left", x: -10, y: 260 },
                    { name: "Mid Fairway", x: 0, y: 350 },
                    { name: "Green Target", x: -15, y: 450 }
                ],
                trees: [{ x: 12, y: 280, radius: 10, height: 55, name: "The Blocking Oak" }],
                zones: [{ name: "Green Target", x: -15, y: 450 }]
            },
            { 
                number: 18, par: 4, distance: 440, pinX: 10, pinY: 438, greenType: "The Augusta Monster", fairwayWidth: 35, greenRadius: 18,
                pinLocation: "Back-Right",
                description: "The 440-yard grand finale. A beautiful, straight par 4 leading to 'The Augusta Monster' green. Bunkers guard the left, water guards the right.",
                fairwayDescription: "The fairway is wide, but the approach is intimidating. Water flanks the entire right side of the green, and bunkers sit on the left.",
                caddyNotes: [
                    { level: 1, trigger: 'Tee', text: 'The final hole. Let it rip down the middle.' },
                    { level: 3, trigger: 'Tee', text: 'Give it everything you have off the tee to leave a shorter club for this terrifying approach shot.' },
                    { level: 2, trigger: 'Approach', text: 'Water right, sand left. The green is heavily contoured.' },
                    { level: 3, trigger: 'Approach_Scoring', text: 'Do not go pin-hunting on the right side near the water. Aim for the center of the green and rely on your putter. Par here feels like a birdie.' },
                    { level: 3, trigger: 'Greenside', text: 'This green has three massive tiers. Read the topography carefully before you putt.' }
                ],
                hazards: [
                    { type: "Water", distance: 410, depth: 50, side: "Right", offset: 30, width: 30 },
                    { type: "Bunker", distance: 420, depth: 25, side: "Left", offset: -25, width: 15 }
                ],
                landingZones: [
                    { name: "Center Drive", x: 0, y: 270 },
                    { name: "Approach Area", x: 0, y: 360 },
                    { name: "Safe Green Center", x: -5, y: 435 }
                ],
                trees: [],
                zones: [{ name: "Safe Green Center", x: -5, y: 435 }, { name: "The Pin", x: 10, y: 438 }]
            }
        ]
    },
    {
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
    }
];
let currentCourseIndex = 1;

const helpMenuText = [
    { text: "Accessible Golf Help Menu: Use the Up and Down arrows to navigate this guide. Press Escape or Enter at any time to close. Heading Level 1.", heading: true },
    
    { text: "The Swing Mechanic: Heading Level 2.", heading: true },
    { text: "The Swing Mechanic is divided into 4 phases. You will use the Down Arrow and the Spacebar to control your shot.", heading: false },
    { text: "Phase 1: The Backswing.", heading: false },
    { text: "Press and hold the Down Arrow. This initiates the backswing and begins the timing metronome sounds for the swing hinge, or the amount you cock your wrists.", heading: false },
    { text: "There will be four metronome sounds. You need to press your Spacebar during this first two-second segment to lock your backswing hinge, thus cocking your wrists back.", heading: false },
    
    { text: "Phase 2: The Power Phase.", heading: false },
    { text: "You will have been holding down the Down Arrow during Phase 1. Keep holding it down to set your power.", heading: false },
    { text: "There will be audio pings for power at 25, 50, 75, and finally 100 percent, which has a bright, definitive ding.", heading: false },
    { text: "Release the Down Arrow to set your power. Remember: You can overswing up to 120%, but the forgiveness on other meters is drastically reduced. Overswinging can cause wild results. You have been warned.", heading: false },
    
    { text: "Phase 3: The Downswing.", heading: false },
    { text: "When the downswing starts, you will re-enter the metronome phase.", heading: false },
    { text: "Press the Spacebar again and match the timing of when you set your hinge during the backswing. You need to match this timing to get a boost to power, accuracy or spin rate. Mistiming can cause fat or thin shots because the club does not strike the ball perfectly.", heading: false },
    { text: "Note: You can skip using the hinge and get no bonus or penalty by simply not pressing the Spacebar. However, if you set the hinge in Phase 1, you must release it in Phase 3 by pressing the Spacebar a second time.", heading: false },
    
    { text: "Phase 4: The Impact Zone.", heading: false },
    { text: "After you set or skip the hinge, the downswing tone will continue to drop, and you will hear four pings to set your timing to strike the ball.", heading: false },
    { text: "Press the Down Arrow exactly when it hits the bottom to strike the ball perfectly.", heading: false },
    { text: "Striking the ball early or late will add sidespin and cause hooks or slices.", heading: false },
    
    { text: "Practice Swings.", heading: false },
    { text: "Press the Up Arrow instead of the Down Arrow to initiate a Practice Swing. Releasing the Up Arrow starts the downswing, and pressing it again at impact gives you feedback on your timing without hitting the ball.", heading: false },
    
    { text: "General Keybinds: Heading Level 2.", heading: true },
    { text: "Course Navigation: Press numbers 1 through 9 to warp to the front nine holes. Hold Shift and press 1 through 9 for the back nine.", heading: false },
    { text: "Press Q to open the Quit/Save Menu.", heading: false },
    { text: "Scorecard: Press E for a quick score summary, or Shift + E to open the full scorecard grid.", heading: false },
    { text: "Setup and Aim: Left and Right arrows adjust your aim 1 degree at a time.", heading: false },
    { text: "Shift + Left and Right Arrows open and close your stance. Each adjustment adds or removes 800 RPM of side spin.", heading: false },
    { text: "Home and End adjust ball placement in your stance. Moving the ball forward adds loft in 5-degree amounts, while moving the ball back removes 5 degrees of loft at a time. This affects forward and backward spin rates.", heading: false },
    { text: "Targeting: Press Z to cycle through available landing zones on the fairway or green. The engine will automatically equip the best club for your active target.", heading: false },
    { text: "Press Shift + Z to open the Pin Finder grid. Use the arrow keys to explore the green yard by yard, then press Enter to lock your target.", heading: false },
    
    { text: "Equipment: Heading Level 2.", heading: true },
    { text: "Page Up and Page Down cycle through your clubs.", heading: false },
    { text: "Press X to hear the club in your hand and the expected 100% distance based on your current lie.", heading: false },
    { text: "Press S to cycle shot styles forward (from Normal down to Flop). Press Shift + S to cycle styles backward.", heading: false },
    { text: "Press V to choke down on the club and limit power to 90% while widening impact zones.", heading: false },
    { text: "Note: For auditory players, it is often easier to adjust swing style, club choice, and ball position in order to have 100% power be the correct distance. Trying to hit 85% power is difficult without a visual meter.", heading: false },
    
    { text: "Environment & Status: Heading Level 2.", heading: true },
    { text: "Press Tab for a quick summary of your current hole, stroke, distance, and lie.", heading: false },
    { text: "Press T for a full distance and targeting report, including green topography if you are close.", heading: false },
    { text: "Press W to read the wind. Press Shift + W to change wind speed in practice areas.", heading: false },
    { text: "Press L to hear your lie. On the holo range, press L to cycle the terrain type under the ball.", heading: false },
    { text: "Press Shift + Z to toggle between the Pin Finder and Swing Mode. In the Pin Finder, use the arrows to adjust your cursor on the putting grid, where each square indicates expected ball behavior when landing from that approach. Press Enter to lock your target and return to swing mode.", heading: false },
    
    { text: "Information & Feedback: Heading Level 2.", heading: true },
    { text: "Press A to hear Caddy advice. Press Shift + A to change the Caddy skill level if available.", heading: false },
    { text: "Press F to read the fairway description.", heading: false },
    { text: "Press H to open the navigable Hazard and Tree list. This also acts as your Edge Finder to help punch out from under trees.", heading: false },
    { text: "Press C to repeat the post-shot Caddy Report and telemetry. Press Shift + C to copy your session telemetry to your clipboard.", heading: false },
    
    { text: "Game Modes & Putting: Heading Level 2.", heading: true },
    { text: "Press R to warp to the Driving Range.", heading: false },
    { text: "Press G to warp to the Chipping Green. Press Shift + G to toggle between short and long chip ranges.", heading: false },
    { text: "Press Shift + P to warp to the Practice Putting Green.", heading: false },
    { text: "Putting Controls: On the green, press Shift + Z to toggle between the Pin Finder and Putting Mode. In the Pin Finder, use the arrows to adjust your putt aim and distance, then press Enter to lock it in and swing.", heading: false }
];