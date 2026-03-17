// data_ag.js - Static Arrays and Configurations (v3.36.0)

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
                number: 1, par: 4, distance: 420, pinX: 0, pinY: 420, fairwayWidth: 35, greenRadius: 15,
                pinLocation: "Middle-Center",
                description: "A 420-yard par 4. Water runs down the entire left side, while an Oak and Maple tree pinch the landing zone on the right.",
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
                hazards: [{ type: "Bunker", distance: 152, depth: 15, offset: 15, width: 10 }],
                zones: [{ name: "Green Center", x: 0, y: 160 }]
            },
            { 
                number: 3, par: 5, distance: 540, pinX: 60, pinY: 537, fairwayWidth: 40, greenRadius: 18,
                approachWidth: 10, apronRadius: 20,
                pinLocation: "Back-Right",
                description: "A massive 540-yard par 5. A 40-yard wide bunker sits dead center at 270 yards, demanding a strategic layup or a brave, aggressive carry.",
                hazards: [{ type: "Bunker", distance: 270, depth: 20, side: "Center", offset: 0, width: 40 }],
                zones: [{ name: "First Layup", x: 0, y: 250 }, { name: "Aggressive Carry", x: 10, y: 300 }, { name: "Approach Layup", x: 15, y: 440 }]
            },
            { 
                number: 4, par: 4, distance: 330, pinX: 0, pinY: 330, fairwayWidth: 35, greenRadius: 15,
                pinLocation: "Center",
                description: "A 330-yard driveable par 4. A massive, deep bunker protects the front of the green, and a 30-foot tree cluster pinches the left side of the fairway.",
                hazards: [{ type: "Bunker", distance: 290, depth: 30, side: "Center", offset: 0, width: 30 }],
                trees: [{ x: -15, y: 250, radius: 10, height: 30, name: "Left Woods" }],
                zones: [{ name: "Safe Layup", x: 15, y: 240 }, { name: "Go For It", x: 0, y: 330 }]
            },
            { 
                number: 5, par: 4, distance: 440, pinX: 20, pinY: 440, fairwayWidth: 35, greenRadius: 15,
                pinLocation: "Back-Right",
                description: "A 440-yard dogleg right. A 50-foot tall forest completely blocks the direct line to the green from the tee, forcing you to play out to the left fairway.",
                hazards: [],
                trees: [{ x: 20, y: 260, radius: 15, height: 50, name: "The Corner Forest" }],
                zones: [{ name: "Fairway Center", x: -15, y: 260 }]
            },
            { 
                number: 6, par: 5, distance: 510, pinX: 0, pinY: 510, fairwayWidth: 35, greenRadius: 15,
                pinLocation: "Center",
                description: "A reachable 510-yard par 5. The green is an island peninsula, surrounded by a water moat that spans the entire fairway from 480 to 495 yards.",
                hazards: [{ type: "Water", distance: 480, depth: 15, side: "Center", offset: 0, width: 100 }],
                trees: [],
                zones: [{ name: "Approach Layup", x: 0, y: 460 }, { name: "Aggressive Carry", x: 0, y: 510 }]
            },
            { 
                number: 7, par: 3, distance: 215, pinX: 10, pinY: 212, fairwayWidth: 25, greenRadius: 12,
                pinLocation: "Right",
                description: "A brutal 215-yard par 3. A 40-foot tall Guardian Oak stands just short and right of the green, directly blocking the tucked pin. A bunker waits on the left.",
                hazards: [{ type: "Bunker", distance: 195, depth: 25, side: "Left", offset: -15, width: 15 }],
                trees: [{ x: 10, y: 180, radius: 8, height: 40, name: "The Guardian Oak" }],
                zones: [{ name: "Green Center", x: -5, y: 215 }]
            },
            { 
                number: 8, par: 4, distance: 400, pinX: 0, pinY: 400, fairwayWidth: 20, greenRadius: 15,
                pinLocation: "Center",
                description: "A claustrophobic 400-yard par 4. The fairway is only 20 yards wide, heavily pinched by massive tree clusters on both the left and right at 250 yards. Driver is not recommended.",
                hazards: [],
                trees: [{ x: -20, y: 250, radius: 12, height: 40, name: "Left Woods" }, { x: 20, y: 250, radius: 12, height: 40, name: "Right Woods" }],
                zones: [{ name: "Tactical Tee", x: 0, y: 200 }]
            },
            { 
                number: 9, par: 4, distance: 460, pinX: -10, pinY: 460, fairwayWidth: 35, greenRadius: 15,
                pinLocation: "Left",
                description: "A terrifying 460-yard finishing hole. A massive lake runs the entire right side from 100 yards all the way to the green.",
                hazards: [{ type: "Water", distance: 100, depth: 380, side: "Right", offset: 35, width: 40 }],
                trees: [],
                zones: [{ name: "Fairway Left", x: -15, y: 250 }]
            }
        ]
    }
];
let currentCourseIndex = 0;