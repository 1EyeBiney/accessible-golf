// data_ag.js - Course Data, Clubs, and Shot Styles (v6.04.0)

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
    { name: "Bump & Run", distMod: 0.40, loftMod: -25, spinMod: -1500, rollMod: 3.5, windMod: 0.15 },
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
    "The Shelf": [{ startY: 40, endY: 0, slopeX: 0.8, slopeY: -0.1 }], // Severe lateral break towards water
    "The Pig Tiers": [
        { startY: 45, endY: 25, slopeX: 0.8, slopeY: 0.6 },
        { startY: 25, endY: 10, slopeX: -0.9, slopeY: 0.3 },
        { startY: 10, endY: 0, slopeX: 0.6, slopeY: -0.2 }
    ]
};

window.greenDictionary = window.greenDictionary || {};
Object.assign(window.greenDictionary, greenDictionary);
window.greenDictionary["Turtleback"] = [
    { startY: 25, endY: 15, slopeX: 0.0, slopeY: -0.4 },
    { startY: 15, endY: 8,  slopeX: 0.0, slopeY: 0.0  },
    { startY: 8,  endY: 0,  slopeX: 0.0, slopeY: 0.5  }
];
window.greenDictionary["The Egg"] = [
    { startY: 35, endY: 25, slopeX: 0.0, slopeY: -0.6 }, // Massive false front
    { startY: 25, endY: 10, slopeX: 0.2, slopeY: 0.1 },  // Left-to-right feed
    { startY: 10, endY: 0, slopeX: -0.3, slopeY: 0.2 }   // Narrow back, right-to-left
];
// v5.67.0 The Porcelain Swirl (formerly The Swirling Moat)
window.greenDictionary["The Porcelain Swirl"] = [
    { startY: 10, endY: 0, slopeY: 0.5, slopeX: -0.15 },    // The Center Dome
    { startY: 13, endY: 10, slopeY: 0.0, slopeX: 0.0 },      // The Flat Ring
    { startY: 16, endY: 13, slopeY: 0.4, slopeX: 0.2 },      // Moat Exit
    { startY: 19, endY: 16, slopeY: -0.4, slopeX: -0.3 },    // Moat Entry
    { startY: 35, endY: 19, slopeY: 0.2, slopeX: 0.1 },      // Outer Slope
    { startY: 999, endY: 35, slopeY: 0.1, slopeX: 0.0 }      // Fallback
];
// v5.68.0 Elevated Embankment Green
window.greenDictionary["The Highway Ridge"] = [
    { startY: 30, endY: 0, slopeY: -0.6, slopeX: 0.0 }
];
// v5.71.0 The Feed Bowl
window.greenDictionary["The Feed Bowl"] = [
    { startY: 30, endY: 15, slopeY: -0.6, slopeX: 0.0 }, // Outer bowl funnel
    { startY: 15, endY: 0, slopeY: 0.0, slopeX: 0.0 }    // Flat center
];
// v5.86.0 The Marquis' Spine
window.greenDictionary["The Marquis' Spine"] = [
    { startY: 30, endY: 0, slopeX: 0.0, slopeY: 0.3 }
];

// --- v2.30.0 Course Data with Hazards ---
window.courses = window.courses || [];
let currentCourseIndex = 1;

const helpMenuText = [
    { text: "Accessible Golf Help Menu: Use the Up and Down arrows to navigate. Press Escape or Enter to close. Heading Level 1.", heading: true },
    { text: "F12: Toggles Keyboard Explore mode to practice keybindings safely without triggering actions.", heading: false },
    
    { text: "Core Swing Mechanics: Heading Level 2.", heading: true },
    { text: "Down Arrow: Starts the backswing. Release to lock power and start downswing. Press again in the impact zone to strike.", heading: false },
    { text: "Up Arrow: Initiates a practice swing to test your timing.", heading: false },
    { text: "Spacebar: Tap during the backswing and downswing to set your Hinge/Tempo timing. (Inside Scorecard: Flips pages).", heading: false },
    { text: "Page Up and Page Down: Cycle through your clubs.", heading: false },
    { text: "Left and Right Arrows: Adjust your aim left or right by 1 degree.", heading: false },
    { text: "Shift + Left or Right Arrow: Open or close your stance alignment to induce natural fades or draws.", heading: false },
    { text: "Home and End: Move the ball forward or backward in your stance to adjust trajectory and spin.", heading: false },
    { text: "S: Cycle forward through Swing Styles (Full, Pitch, Chip, Flop). Shift + S cycles backward.", heading: false },
    { text: "J: Cycle forward through Shot Focus modes (Power, Accuracy, Touch, etc.). Shift + J cycles backward.", heading: false },
    { text: "V: Toggle a choked-down grip to cap distance at 90 percent and increase control.", heading: false },
    { text: "X: Announces your currently equipped club, swing style, and expected 100 percent distance.", heading: false },

    { text: "Targeting & Environment: Heading Level 2.", heading: true },
    { text: "Z: Cycle your target between the Pin and tactical Fairway Landing Zones.", heading: false },
    { text: "Shift + Z: Opens the Micro-Grid. Use arrows to target specific yardages and slopes.", heading: false },
    { text: "H: Opens the navigable Obstacle List to view distances to hazards and trees.", heading: false },
    { text: "W: Reads the current wind speed and direction. Shift + W changes wind in practice modes.", heading: false },
    { text: "B: Reads the green elevation and break. Only available when putting.", heading: false },
    { text: "D and F: Reads the hole description and fairway dimensions.", heading: false },
    { text: "L: Announces your current lie. Shift + L on the Holo Range cycles target terrain. Shift + L in clubhouse loads Sim Roster.", heading: false },

    { text: "Caddy & Diagnostics: Heading Level 2.", heading: true },
    { text: "A: Asks the Oracle Caddy for a strategic shot blueprint.", heading: false },
    { text: "Shift + A: Cycles the Caddy's intelligence level.", heading: false },
    { text: "T: Provides a full distance, aim, and line-of-sight targeting report. Shift + T provides Dev Diagnostics.", heading: false },
    { text: "Tab: Provides a quick summary of your hole, stroke, distance, and lie.", heading: false },
    { text: "C: Repeats the Caddy's last shot report.", heading: false },
    { text: "Shift + C: Copies your raw shot telemetry to your clipboard.", heading: false },
    { text: "Shift + Semicolon: Reads your quick timing and spin diagnostics.", heading: false },

    { text: "Match Rules & Multiplayer: Heading Level 2.", heading: true },
    { text: "N: Swap control to the next player. Shift + N copies the Post-Round Narrative to clipboard.", heading: false },
    { text: "M: Use a Mulligan to erase your last shot.", heading: false },
    { text: "Shift + M: Take a Snowman. Caps your score at 8 and ends the hole.", heading: false },
    { text: "G: Take a Gimme to add 1 stroke and finish the hole. Only available on the green.", heading: false },
    { text: "U: Take an Unplayable Lie penalty. Adds 1 stroke and drops the ball in the fairway.", heading: false },
    { text: "P: Cycles through Bot Pacing modes. Inside Scorecard: Swaps players.", heading: false },
    
    { text: "UI & System: Heading Level 2.", heading: true },
    { text: "Shift + E: Opens the full Grid Scorecard.", heading: false },
    { text: "E: Announces your quick score summary.", heading: false },
    { text: "Shift + Y: Cycles through your equipped golf ball brand. (Y toggles Synth Tree on Range).", heading: false },
    { text: "I: Cycles through global difficulty tiers. Shift + I cycles backward.", heading: false },
    { text: "Control + Enter: Fast-forwards through Clubhouse setup menus.", heading: false },
    { text: "Q: Opens the Quit and Save menu.", heading: false }
];

// v6.01.0 - Roster Presets (restored after data_ag.js truncation)
const rosterPresets = [
    {
        name: "Friends Foursome",
        count: 4,
        bots: [
            { name: "Shankin' Shawn", skill: 0, iBias: 80,  hBias: -40, focus: 4, ball: 5 },
            { name: "Mulligan Moe",   skill: 1, iBias: 35,  hBias: 0,   focus: 1, ball: 1 },
            { name: "Tour-Pro Ted",   skill: 3, iBias: 0,   hBias: 0,   focus: 3, ball: 0 }
        ]
    },
    {
        name: "4 Bots - Foursome",
        count: 4,
        bots: [
            { name: "Shankin' Shawn", skill: 0, iBias: 80,  hBias: -40, focus: 4, ball: 5 },
            { name: "Dusty Bunkers",  skill: 1, iBias: 0,   hBias: 0,   focus: 4, ball: 2 },
            { name: "Fairway Fred",   skill: 1, iBias: -15, hBias: 45,  focus: 0, ball: 4 },
            { name: "Tour-Pro Ted",   skill: 3, iBias: 0,   hBias: 0,   focus: 3, ball: 0 }
        ]
    },
    {
        name: "Solo",
        count: 1,
        bots: []
    },
    {
        name: "1v1 vs Moe",
        count: 2,
        bots: [
            { name: "Mulligan Moe",   skill: 1, iBias: 35,  hBias: 0,   focus: 1, ball: 1 }
        ]
    }
];

let setupRosterIndex = 0;
