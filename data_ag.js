// data_ag.js - Static Arrays and Configurations (v3.33.1)

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
                hazards: [
                    { type: "Water", distance: 100, depth: 250, side: "Left", offset: -45, width: 40 }
                ],
                trees: [
                    { x: 15, y: 200, radius: 5, height: 25, name: "Oak Tree" },
                    { x: -18, y: 250, radius: 4, height: 20, name: "Maple Tree" }
                ]
            },
            { 
                number: 2, par: 3, distance: 165, pinX: -15, pinY: 164, fairwayWidth: 25, greenRadius: 12,
                pinLocation: "Front-Left",
                hazards: [
                    { type: "Bunker", distance: 152, depth: 15, offset: 15, width: 10 }
                ]
            },
            { 
                number: 3, par: 5, distance: 540, pinX: 60, pinY: 537, fairwayWidth: 40, greenRadius: 18,
                approachWidth: 10, apronRadius: 20,
                pinLocation: "Back-Right",
                hazards: [
                    { type: "Bunker", distance: 270, depth: 20, side: "Center", offset: 0, width: 40 }
                ]
            }
        ]
    }
];
let currentCourseIndex = 0;