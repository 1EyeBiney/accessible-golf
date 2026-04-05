// main_ag.js - Game State, Variables, and Swing Sequence (v5.96.0)

let swingState = 0; // 0: Idle, 1: Back, 2: Power, 3: Down, 4: Impact, 5: Flight
window.tournamentGreens = false;
let isPracticeSwing = false;
let devPower = false, devHinge = false, devImpact = false;
let pacingModeIndex = 0; // 0: Fast, 1: Medium, 2: Slow, 3: Manual
let pacingModes = ["Fast", "Medium", "Slow", "Manual", "Simulate"];
window.waitingForBot = false;
let stateTimeouts = [];
let botThinkingInterval = null;

let backswingStartTime = 0, downswingStartTime = 0, impactStartTime = 0, powerStartTime = 0;
let hingeTimeBack = 0, hingeTimeDown = 0;
let finalPower = 0, dropDurationMs = 0;
let lockedImpactTime = 0;
let windX = 0, windY = 0, windLevelIndex = 0; // v4.13.0 Calm Default
let aimAngle = 0, stanceIndex = 2, stanceAlignment = 0, isChokedDown = false;
let hole = 1, par = 4, strokes = 0;
let currentBgMusic = null;
let currentBgAmbient = null;
window.musicVolumeLevels = [0.0, 0.05, 0.1, 0.2, 0.3, 0.4];
window.musicVolumeIndex = 2; // Defaults to 10%
window.ambientVolumeLevels = [0.0, 0.25, 0.5, 0.75, 1.0];
window.ambientVolumeIndex = 4; // Defaults to 100%

    // v5.96.0 Course Profiles Architecture (Scope-Merging Bridge Getter)
    Object.defineProperty(window, 'courseData', {
        get: function() {
            let base = typeof courses !== 'undefined' ? courses : [];
            let win = typeof window.courses !== 'undefined' ? window.courses : [];
            let combined = base === win ? base : [...base];
            if (base !== win) {
                win.forEach(wc => {
                    if (!combined.find(c => c.name === wc.name)) combined.push(wc);
                });
            }
            return combined.map(c => {
                let id = c.name.toLowerCase().replace(/ /g, '_');
                let desc = "An 18-hole championship layout.";
                if (c.name.includes("Holo")) desc = "A pristine 18-hole digital championship layout. Fairways, bunkers, and perfect greens.";
                if (c.name.includes("Pebble")) desc = "A stunning coastal links course. Narrow fairways, severe elevation changes, and tiny greens.";
                if (c.name.includes("Andrews")) desc = "The birthplace of golf. Wide fairways, massive double greens, and treacherous pot bunkers.";
                if (c.name.includes("Pasture")) desc = "A chaotic farmland hazard course. Watch out for tractors, cows, and chickens!";
                if (c.name.includes("Scrapyard")) desc = "A rugged, post-apocalyptic course built through a Texas junk yard. Tight fairways and severe metallic hazards.";
                return { ...c, id, desc };
            });
        }
    });
    window.currentCourse = window.courseData[0]; // Defaults to Holo Links
let ballX = 0, ballY = 0, pinX = 0, pinY = 420, pinZ = 0;
let ballZ = 0, targetZ = 0;
let lieTilt = 0; // Positive = Ball above feet (Hook), Negative = Ball below feet (Slice)
let landingSlope = 0; // Positive = Uphill landing (Stops fast), Negative = Downhill landing (Rolls out)
let targetX = 0, targetY = 0, currentZoneIndex = -1;
let activeTargetType = 'pin'; // 'pin', 'zone', or 'grid'
let gridX = 0, gridY = 0; // Relative to the pin
let targetZoneIndex = 0;
let isGridNavigating = false;
let currentLie = "Tee";
let isHoleComplete = false;
let roundData = [];
let roundHighlights = { drives: [], approaches: [], putts: [] };
let puttsThisHole = 0;
let currentHoleStats = { fir: null, gir: false };
let viewingScorecard = false;
let scorecardPage = 0;
let scorecardGrid = [];
let scRow = 0, scCol = 0;
let scorecardPlayerIndex = 0; // v4.85.0 Multiplayer Scorecard Target
let gameMode = 'course';
let isExploreMode = false;
let clubhouseMenu = [];
let clubhouseIndex = 0;
let isPutting = false, puttState = 0, puttTargetDist = 0;
let viewingHazards = false, hazardIndex = 0;
let viewingHelp = false, helpIndex = 0;
window.helpState = 'master'; 
window.hasHeardHoloOrientation = false;
window.holoFocusIndex = 0; // 0:Flag, 1:Tree, 2:Wall, 3:Cluster, 4:Bunker
window.rangeOrientationText = "Press Question Mark to view the editor controls, and F12 to access the keyboard explorer. Use O to cycle through objects, Enter to spawn, and Delete or Backspace to remove. Use R to randomize the target, and A for caddy advice.";

window.holoHelpData = [
    { text: "Practice Facility Editor: Heading Level 2.", heading: true },
    { text: "O: Cycles the Object Manager between Target Flag, Trees, and Bunkers.", heading: false },
    { text: "Enter: Spawns the currently selected object.", heading: false },
    { text: "Backspace or Delete: Removes the currently selected object.", heading: false },
    { text: "Bracket Keys: Moves the object Left or Right.", heading: false },
    { text: "Dash and Equals: Moves the object Closer or Further.", heading: false },
    { text: "Shift + Dash or Equals: Adjusts the Elevation or Height of the object.", heading: false },
    { text: "R: Randomizes the Target Flag distance and elevation.", heading: false },
    { text: "Shift + Z: Opens the Pin Finder to target specific landing squares around your custom setup.", heading: false },
    { text: "A: Asks the Oracle Caddy for advice on how to navigate your custom setup.", heading: false }
];
let rangeLie = 'Fairway', confirmingRange = false, confirmingQuit = false;
let rangeTargetLie = 'Fairway';
let synthTreeActive = false;
let synthTreeX = 0;
let synthTreeDist = 0;
let synthTreeHeight = 0; // In feet
let shotStyleIndex = 0;

// v4.41.0 Shot Focus States
let focusIndex = 0;
const focusModes = [
    { name: "Standard", desc: "No special bonuses or penalties." },
    { name: "Power", desc: "Perfect hinge adds a 10 percent distance overcharge. Poor hinge reduces distance by 10 percent." },
    { name: "Touch", desc: "Perfect hinge expands the cup size. Poor hinge shrinks it." },
    { name: "Spin", desc: "Perfect hinge adds massive backspin. Poor hinge removes backspin and adds roll." },
    { name: "Accuracy", desc: "Perfect hinge expands sweet spot and cuts dispersion. Poor hinge shrinks sweet spot and multiplies dispersion." },
    { name: "Recovery", desc: "Perfect hinge cuts lie penalties in half. Poor hinge doubles them." }
];

// v4.42.0 Global Difficulty States
let difficultyIndex = 2; // Default to Pro
const difficultyLevels = [
    { name: "Casual", desc: "Massive sweet spots. No penalty up to 112 percent power. Slices are cut in half.", impactMod: 2.0, hingeMod: 2.0, reflexBuffer: 112, dispersionMod: 0.5 },
    { name: "Amateur", desc: "Larger sweet spots. No penalty up to 108 percent power. Slices are reduced.", impactMod: 1.5, hingeMod: 1.5, reflexBuffer: 108, dispersionMod: 0.75 },
    { name: "Pro", desc: "Standard difficulty. Penalties begin at 105 percent power.", impactMod: 1.0, hingeMod: 1.0, reflexBuffer: 105, dispersionMod: 1.0 },
    { name: "Tour", desc: "Tiny sweet spots. Penalties begin at 102 percent power. Slices are severe.", impactMod: 0.66, hingeMod: 0.6, reflexBuffer: 102, dispersionMod: 1.25 }
];

// v4.44.0 Multiplayer Infrastructure
let activePlayerCount = 3; // Default to 3 for Hot Seat playtesting
let currentPlayerIndex = 0;
let players = [];
// v4.90.0 Clubhouse Wizard State
let clubhouseState = 'root'; // 'root', 'course', 'size', 'roster', 'roster_type', 'roster_bot_amateur', 'roster_bot_tour', 'settings'
let wizardCourse = 1;
let wizardSize = 1;
let wizardRoster = []; 
let wizardSlot = 0;
let wizardWind = 0;
let wizardTournamentGreens = false;
let wizardRough = 1;
let wizardMulligans = 1; // 0: Off, 1: 3 Per Round, 2: Unlimited
let wizardGimmes = 1; // 0: Off, 1: Manual Only, 2: Auto <3ft, 3: Auto <6ft
let wizardMaxScore = 2; // 0: Off, 1: Double Par, 2: Snowman (8)
window.preShotState = null;
let roughConditionIndex = 1; 
const roughConditions = [
    { name: "Sunday Trim", penalty: 0.95 },
    { name: "Standard Cut", penalty: 0.85 },
    { name: "Tourney Cut", penalty: 0.75 },
    { name: "Neglected for a week", penalty: 0.55 }
];

window.initPlayers = function() {
    players = [];
    let preset = rosterPresets[setupRosterIndex];
    activePlayerCount = preset.count;
    let isAllBots = preset.name.includes("4 Bots");

    for (let i = 0; i < activePlayerCount; i++) {
        let isBot = isAllBots ? true : i > 0;
        let botData = isAllBots ? preset.bots[i] : (i > 0 ? preset.bots[i-1] : null);

        let pName = botData ? botData.name : "Player 1";
        let bSkill = botData ? botData.skill : 0;
        let iBias = botData ? botData.iBias : 0;
        let hBias = botData ? botData.hBias : 0;
        let fIndex = botData ? botData.focus : 0;
        let bIndex = botData ? botData.ball : 0;

        players.push({
            name: pName, isBot: isBot, botSkill: bSkill, impactBias: iBias, hingeBias: hBias,
            botImpact: 0, botHinge: 0, botPower: 100,
            strokes: 0, puttsThisHole: 0,
            roundData: [], roundHighlights: { drives: [], approaches: [], putts: [] }, currentHoleStats: { fir: null, gir: false },
            ballX: 0, ballY: 0, currentLie: "Tee", isHoleComplete: false, isPutting: false, puttTargetDist: 0,
            aimAngle: 0, stanceIndex: 2, stanceAlignment: 0, focusIndex: fIndex, currentClubIndex: currentClubIndex,
            difficultyIndex: typeof difficultyIndex !== 'undefined' ? difficultyIndex : 2,
            caddyLevel: typeof caddyLevel !== 'undefined' ? caddyLevel : 1,
            activeBallIndex: bIndex,
            shotStyleIndex: 0, isChokedDown: false, devPower: false, devHinge: false, devImpact: false
        });
    }
    currentPlayerIndex = 0;
};

window.resetRosterForHole = function() {
    if (players.length === 0) window.initPlayers();
    
    // v4.48.2 True Golf Honors (Lowest score goes first)
    let bestScore = 9999;
    let honorIndex = currentPlayerIndex; 
    for (let i = 0; i < players.length; i++) {
        if (players[i].strokes > 0 && players[i].strokes < bestScore) {
            bestScore = players[i].strokes;
            honorIndex = i;
        }
    }
    
    for (let i = 0; i < players.length; i++) {
        players[i].strokes = 0;
        players[i].puttsThisHole = 0;
        players[i].ballX = 0; 
        players[i].ballY = 0;
        players[i].currentLie = "Tee";
        players[i].isHoleComplete = false;
        players[i].isPutting = false;
    }
    currentPlayerIndex = honorIndex; 
};

window.advanceTurn = function(isPuttingTransition = false) {
    try {
        if (gameMode !== 'course') return;
        window.saveActivePlayer();

        // v5.3.1 Scorecard Failsafe (Catches Snowmen & Gimmes missing from array)
        players.forEach(p => {
            if (p.isHoleComplete) {
                let hasRecord = p.roundData.find(r => r.hole === hole);
                if (!hasRecord) {
                    p.roundData.push({
                        hole: hole, par: par, strokes: p.strokes, putts: p.puttsThisHole || 0,
                        fir: p.currentHoleStats ? p.currentHoleStats.fir : null,
                        gir: p.currentHoleStats ? p.currentHoleStats.gir : false,
                        driveDistance: p.currentHoleStats ? p.currentHoleStats.driveDistance : null,
                        approachStart: p.currentHoleStats ? p.currentHoleStats.approachStart : null,
                        approachProx: p.currentHoleStats ? p.currentHoleStats.approachProx : null,
                        puttDistance: p.currentHoleStats ? p.currentHoleStats.puttDistance : null
                    });
                }
            }
        });

        let allDone = players.every(p => p.isHoleComplete);
        if (allDone) {
            let compMsg = `All players have finished Hole ${hole}. Press Enter to proceed to the next hole.`;
            if (hole >= window.currentCourse.holes.length) {
                gameMode = 'post_round';
                if (typeof window.stopAllCourseAudio === 'function') window.stopAllCourseAudio();
                compMsg = "Round Complete! All players have finished. Press Shift + E to view telemetry.";
                window.isQuickSim = false; // Safety stop
            }
            window.announce(compMsg);
            window.setCaddyPanelText(compMsg);
            swingState = 6;

            // v4.86.0 Auto-Advance for 4-Bot Simulations
            if (window.isQuickSim && players.every(p => p.isBot) && gameMode !== 'post_round') {
                loadHole(hole + 1);
            }
            return;
        }

        // v5.70.0 Audio Router
        const holeData = window.currentCourse.holes[hole - 1];
        if (typeof holeData !== 'undefined') {
            let allOffTee = true;
            let allOnGreen = true;
            let allPastHazard = true;
            let activePlayers = typeof rosterSize !== 'undefined' ? rosterSize : players.length;
            
            for (let i = 0; i < activePlayers; i++) {
                let p = players[i];
                if (!p) continue;
                if (p.currentLie === 'Tee') allOffTee = false;
                if (p.currentLie !== 'Green' && p.currentLie !== 'Hole' && !p.isHoleComplete) allOnGreen = false;
                if (holeData.hazardSwapY && p.ballY < holeData.hazardSwapY) allPastHazard = false;
            }

            let targetAmbient = null;
            if (allOnGreen && holeData.bgAmbientPostGreen) {
                targetAmbient = holeData.bgAmbientPostGreen;
            } else if (holeData.bgAmbientPostHazard && allPastHazard) {
                targetAmbient = holeData.bgAmbientPostHazard;
            } else if (allOffTee && holeData.bgAmbientPostTee) {
                targetAmbient = holeData.bgAmbientPostTee;
            }

            if (targetAmbient && typeof window.hotSwapAmbient === 'function') {
                window.hotSwapAmbient(targetAmbient);
            }
        }

        let furthestDist = -1;
        let nextIndex = currentPlayerIndex;

        for (let i = 0; i < players.length; i++) {
            let p = players[i];
            if (!p.isHoleComplete) {
                let dist = Math.sqrt(Math.pow(pinX - p.ballX, 2) + Math.pow(pinY - p.ballY, 2));
                if (dist > furthestDist + 0.1) {
                    furthestDist = dist;
                    nextIndex = i;
                }
            }
        }

        let oldIndex = currentPlayerIndex;
        window.loadActivePlayer(nextIndex);
        let pName = players[currentPlayerIndex].name;

        let distMsg = "Distance unknown.";
        try { distMsg = `${Math.round(calculateDistanceToPin())} yards to pin. Lie: ${currentLie}.`; } catch(e){}

        if (isPutting) {
            try {
                let actualDist = typeof calculateDistanceToPin === 'function' ? calculateDistanceToPin() : 10;
                puttTargetDist = Math.max(1/3, Math.round(actualDist * 3) / 3);
                players[currentPlayerIndex].puttTargetDist = puttTargetDist;
                aimAngle = 0;
                players[currentPlayerIndex].aimAngle = 0;
                
                let isShort = puttTargetDist <= 5.0;
                let unit = isShort ? "feet" : "yards";
                let displayDist = isShort ? Math.round(puttTargetDist * 3) : Math.round(puttTargetDist);
                distMsg = `On the Green. ${displayDist} ${unit} to the cup.`;
            } catch(e){}
        }

        try {
            if (nextIndex !== oldIndex || isPuttingTransition) {
                let msg = `Swapped to ${pName}. ${distMsg}`;
                setTimeout(() => { window.announce(msg); }, 300);
                let vis = document.getElementById('visual-output');
                if(vis) vis.innerText = msg;

                // Trigger AI Signature or Default UI Blip
                if (pName === "Bot Rory" && typeof window.playBotRorySignature === 'function') window.playBotRorySignature();
                else if (pName === "Bot Seve" && typeof window.playBotSeveSignature === 'function') window.playBotSeveSignature();
                else if (typeof window.playGolfSound === 'function') {
                    window.playGolfSound('ui_nav_07');
                }
            } else {
                setTimeout(() => { window.announce(`Still ${pName}'s turn. ${distMsg}`); }, 300);
            }
        } catch(e){}

        try { window.updateDashboard(); } catch(e){}

        if (players[currentPlayerIndex].isBot) {
            window.waitingForBot = false;
            let isSim = pacingModes[pacingModeIndex] === 'Simulate';

            if (isSim) {
                window.takeAITurn(true);
            } else {
                let textToRead = (typeof lastShotReport !== 'undefined' && lastShotReport) ? lastShotReport : "";
                let baseDelay = 2500;
                if (pacingModeIndex === 0) baseDelay += (textToRead.length * 20);
                if (pacingModeIndex === 1) baseDelay += (textToRead.length * 35);
                if (pacingModeIndex === 2) baseDelay += (textToRead.length * 55);
                if (pacingModeIndex === 3) baseDelay = 1500;
                
                if (typeof window.startBotThinking === 'function') window.startBotThinking(); // v5.0.4
                stateTimeouts.push(setTimeout(() => { if (typeof window.takeAITurn === 'function') window.takeAITurn(false); }, baseDelay));
            }
        }
    } catch (fatalError) {
        console.error("CRITICAL TURN MANAGER CRASH:", fatalError);
    }
};

window.startBotThinking = function() {
    if (window.botThinkingInterval) clearInterval(window.botThinkingInterval);
    window.botThinkingInterval = setInterval(() => {
        if (typeof playTone === 'function') playTone(400, 'sine', 0.05, 0.05); // Soft tick
    }, 1000);
};

window.stopBotThinking = function() {
    if (window.botThinkingInterval) { 
        clearInterval(window.botThinkingInterval); 
        window.botThinkingInterval = null; 
    }
};

// v4.48.0 AI Brain & Short Game Logic
window.takeAITurn = function(isSim = false) {
    if (typeof window.stopBotThinking === 'function') window.stopBotThinking();
    activeTargetType = 'pin';
    let p = players[currentPlayerIndex];
    let rawBlueprint = null;
    try {
        if (typeof window.getOracleBlueprint === 'function') {
            rawBlueprint = window.getOracleBlueprint();
        }
    } catch (e) {
        console.warn("Oracle exception caught. Falling back to default blueprint.");
        rawBlueprint = null;
    }
    let blueprint = rawBlueprint || { aimDeg: 0, pace: typeof puttTargetDist !== 'undefined' ? puttTargetDist : 10, clubIndex: currentClubIndex, stanceIndex: 2, styleIndex: 0, power: 100 };
    
    if (isPutting) {
        // v5.37.0 AI Target Cursor & Zero-Power Fix
        let actualDist = typeof calculateDistanceToPin === 'function' ? calculateDistanceToPin() : 10;
        aimAngle = blueprint.aimDeg !== null ? blueprint.aimDeg : 0;
        let pace = blueprint.pace !== null ? blueprint.pace : actualDist;
        
        // Dynamically adjust the cursor to the required pace instead of aiming at the hole
        puttTargetDist = Math.max(1/3, Math.round(pace * 3) / 3); 
        p.puttTargetDist = puttTargetDist;
        
        // Take a smooth 100% swing at the newly adjusted target
        p.botPower = 100; 
    } else {
        currentClubIndex = blueprint.clubIndex !== undefined && blueprint.clubIndex !== null ? blueprint.clubIndex : 0;
        if (typeof clubs !== 'undefined' && clubs[currentClubIndex]) { club = clubs[currentClubIndex]; }
        stanceIndex = blueprint.stanceIndex !== undefined && blueprint.stanceIndex !== null ? blueprint.stanceIndex : 2;
        aimAngle = blueprint.aimDeg !== undefined && blueprint.aimDeg !== null ? blueprint.aimDeg : 0;
        shotStyleIndex = blueprint.styleIndex !== undefined ? blueprint.styleIndex : 0;
        let rawPower = blueprint.power !== undefined ? blueprint.power : 100;
        p.botPower = Math.max(10, Math.round(rawPower / 5) * 5);
    }

    let variance = p.botSkill === 3 ? 30 : p.botSkill === 2 ? 55 : p.botSkill === 1 ? 100 : 200;
    let baseImpact = Math.floor((Math.random() * variance * 2) - variance);
    let baseHinge = Math.floor((Math.random() * variance * 2) - variance);
    p.botImpact = baseImpact + (p.impactBias || 0);
    p.botHinge = baseHinge + (p.hingeBias || 0);

    // --- v5.1.9 AI Humanizing Math (The Pro Scramble & Forced Dispersion) ---
    if (p && p.isBot) {
        if (p.botSkill === 3) {
            // Tour-Pro Ted: 15% Tee-Shot Lapses & Elite Scrambling
            if (strokes === 0 && Math.random() < 0.15) {
                // Force a bad drive (70-100ms off)
                p.botImpact = (Math.random() < 0.5 ? 1 : -1) * (70 + Math.random() * 30);
            } else if (currentLie !== 'Fairway' && currentLie !== 'Tee' && currentLie !== 'Green') {
                // Elite Scramble recovery from rough/hazards (0-10ms off)
                p.botImpact = (Math.random() < 0.5 ? 1 : -1) * (Math.random() * 10);
                p.botHinge = (Math.random() < 0.5 ? 1 : -1) * (Math.random() * 15);
            }
        } else if (p.botSkill === 1 || p.botSkill === 2) {
            // Dusty & Fred: Forced Dispersion Ceiling (Prevents lucky RNG streaks)
            let minOffset = p.botSkill === 1 ? 40 : 25; // Dusty misses by at least 40ms, Fred by 25ms
            if (Math.abs(p.botImpact) < minOffset) {
                p.botImpact = (p.botImpact >= 0 ? 1 : -1) * (minOffset + Math.random() * 20);
            }
        }
    }
    // ------------------------------------------------------------------------
    window.autoSetFocus(true);
    window.updateDashboard();

    if (!club && typeof clubs !== 'undefined') club = clubs[0];
    
    let setupMsg = isPutting ? `${p.name} is reading the green...` : `${p.name} equips ${club.name} and lines up the shot...`;
    
    window.isQuickSim = isSim;
    if (isSim) {
        swingState = 4;
        if (typeof calculateShot === 'function') calculateShot(false);
    } else if (pacingModeIndex === 3) {
        setupMsg += " Press Spacebar to let them strike.";
        window.waitingForBot = true;
        window.announce(setupMsg);
        document.getElementById('visual-output').innerText = setupMsg;
    } else {
        setTimeout(() => { window.announce(setupMsg); }, 300);
        document.getElementById('visual-output').innerText = setupMsg;
        if (typeof window.playGolfSound === 'function') window.playGolfSound('ui_nav_01');

        stateTimeouts.push(setTimeout(() => {
            swingState = 4;
            if (typeof calculateShot === 'function') calculateShot(false);
        }, 2500));
    }
};

window.saveActivePlayer = function() {
    if (players.length === 0) return;
    let p = players[currentPlayerIndex];
    p.strokes = strokes;
    p.puttsThisHole = puttsThisHole;
    p.roundData = roundData; // v4.85.0
    p.roundHighlights = roundHighlights; // v4.85.0
    p.currentHoleStats = currentHoleStats; // v4.85.0
    p.ballX = ballX;
    p.ballY = ballY;
    p.currentLie = currentLie;
    p.isHoleComplete = isHoleComplete;
    p.isPutting = isPutting;
    p.puttTargetDist = typeof puttTargetDist !== 'undefined' ? puttTargetDist : 0;
    p.aimAngle = aimAngle;
    p.stanceIndex = stanceIndex;
    p.stanceAlignment = stanceAlignment;
    p.focusIndex = focusIndex;
    p.currentClubIndex = currentClubIndex;
    
    // v4.46.0 Asymmetric Profiles
    p.difficultyIndex = difficultyIndex;
    p.caddyLevel = caddyLevel;
    p.activeBallIndex = activeBallIndex;
    p.shotStyleIndex = shotStyleIndex;
    p.isChokedDown = isChokedDown;
    p.devPower = devPower;
    p.devHinge = devHinge;
    p.devImpact = devImpact;
    
    p.isBot = typeof p.isBot !== 'undefined' ? p.isBot : false;
    if (p.isBot) {
        p.botSkill = p.botSkill; p.botImpact = p.botImpact; p.botHinge = p.botHinge; p.botPower = p.botPower;
    }
};

window.loadActivePlayer = function(index) {
    currentPlayerIndex = index;
    let p = players[currentPlayerIndex];

    strokes = p.strokes;
    puttsThisHole = p.puttsThisHole !== undefined ? p.puttsThisHole : 0;
    roundData = p.roundData || []; // v4.85.0
    roundHighlights = p.roundHighlights || { drives: [], approaches: [], putts: [] }; // v4.85.0
    currentHoleStats = p.currentHoleStats || { fir: null, gir: false }; // v4.85.0
    ballX = p.ballX;
    ballY = p.ballY;
    ballZ = 0; targetZ = 0; lieTilt = 0; landingSlope = 0;
    currentLie = p.currentLie;
    isHoleComplete = p.isHoleComplete;

    isPutting = p.isPutting;
    if (typeof puttTargetDist !== 'undefined') puttTargetDist = p.puttTargetDist;
    puttState = 0; 
    swingState = isHoleComplete ? 6 : 0; 

    aimAngle = p.aimAngle;
    stanceIndex = p.stanceIndex;
    stanceAlignment = p.stanceAlignment;
    focusIndex = p.focusIndex;

    currentClubIndex = p.currentClubIndex;
    if (typeof clubs !== 'undefined') club = clubs[currentClubIndex];

    // v4.46.0 Asymmetric Profiles
    difficultyIndex = p.difficultyIndex !== undefined ? p.difficultyIndex : 2;
    caddyLevel = p.caddyLevel !== undefined ? p.caddyLevel : 1;
    activeBallIndex = p.activeBallIndex !== undefined ? p.activeBallIndex : 0;
    shotStyleIndex = p.shotStyleIndex !== undefined ? p.shotStyleIndex : 0;
    isChokedDown = p.isChokedDown !== undefined ? p.isChokedDown : false;
    devPower = p.devPower !== undefined ? p.devPower : false;
    devHinge = p.devHinge !== undefined ? p.devHinge : false;
    devImpact = p.devImpact !== undefined ? p.devImpact : false;
    
    let distToPin = typeof calculateDistanceToPin === 'function' ? calculateDistanceToPin() : 10;
    const holeData = typeof courses !== 'undefined' ? window.currentCourse.holes[hole - 1] : null;
    const greenSize = holeData && holeData.greenRadius ? holeData.greenRadius : 20;
    
    if (distToPin <= greenSize) {
        isPutting = true;
        p.isPutting = true;
        currentClubIndex = clubs.findIndex(c => c.name === "Putter");
        if (currentClubIndex !== -1) club = clubs[currentClubIndex];
    }

    window.updateDashboard();
};

// Contextual Auto-Focus Logic
window.autoSetFocus = function(silent = false) {
    if ((typeof isPutting !== 'undefined' && isPutting) || (club && club.name === "Putter")) { focusIndex = 2; return; }

    let oldIndex = focusIndex;
    let dist = typeof calculateDistanceToPin === 'function' ? calculateDistanceToPin() : 0;

    // 1. Lie overrides everything. If you are in trouble, you need Recovery.
    if (currentLie === "Sand" || currentLie.includes("Rough")) focusIndex = 5; 
    
    // 2. Power Focus (Tee and Fairway Bombs)
    else if (currentLie === "Tee" && club.name === "Driver") focusIndex = 1; 
    else if (currentLie === "Fairway" && club.name.includes("Wood")) focusIndex = 1;
    
    // 3. Touch Focus (Delicate short game < 50 yards)
    else if (dist < 50 && (club.name === "Putter" || club.name === "9 Iron" || club.name.includes("Wedge"))) focusIndex = 2;
    
    // 4. Accuracy Focus (Approach shots <= 150 yards)
    else if (dist <= 150 && club.name !== "Driver" && !club.name.includes("Wood")) focusIndex = 4;
    
    // 5. Baseline Standard
    else focusIndex = 0; 

    if (!silent && oldIndex !== focusIndex && typeof window.announce === 'function') {
        window.announce(`Auto-equipped ${focusModes[focusIndex].name} Focus.`);
    }
};

let chippingRange = 'short', confirmingGreen = false, confirmingPutting = false;
let caddyLevel = 3; // 1: Rookie, 2: Veteran, 3: Tour Pro
let currentClubIndex = 0;
// v4.31.5 Knock-Off Ball Brands
let activeBallIndex = 0;
const ballTypes = [
    { name: "Title-ish", flightWave: 'triangle', landWave: 'square', landFreq: 100 },
    { name: "Rock-Flite", flightWave: 'sawtooth', landWave: 'sine', landFreq: 80 },
    { name: "Semi-Pro V1", flightWave: 'sine', landWave: 'triangle', landFreq: 150 },
    { name: "Marshmallow X", flightWave: 'triangle', landWave: 'sine', landFreq: 120 },
    { name: "Velcro Tour", flightWave: 'triangle', landWave: 'square', landFreq: 250 },
    { name: "The Water Magnet", flightWave: 'square', landWave: 'square', landFreq: 60 }
];
let club = clubs[currentClubIndex]; // Pulls from data_ag.js
let lastShotReport = "No caddy report available yet.";
let lastTimingReport = "No swing data available.";
let holeTelemetry = [];

function loadHole(holeNumber) {
    try {
        stateTimeouts.forEach(clearTimeout);
        stateTimeouts = [];

        // v4.80.0 Telemetry Archiving
        if (typeof holeTelemetry !== 'undefined' && holeTelemetry.length > 0 && typeof roundData !== 'undefined') {
            let record = roundData.find(r => r.hole === hole);
            if (record) {
                const hd = window.currentCourse.holes[hole - 1];
                const header = `## HOLE ${hole} (${hd.distance}y, Par ${par})\n**Pin:** ${hd.pinLocation}\n\n`;
                record.telemetryLog = header + holeTelemetry.join('\n\n');
            }
        }

        holeTelemetry = [];
        if (typeof powerOscillator !== 'undefined' && powerOscillator) {
            try { powerOscillator.stop(); } catch (e) {}
        }

        window.initAudio(); 
        // v5.94.0 Course vs Practice Audio Routing
        if (gameMode === 'course') {
            if (typeof window.stopClubhouseMusic === 'function') window.stopClubhouseMusic();
        } else {
            if (typeof window.playClubhouseMusic === 'function') window.playClubhouseMusic('cafe');
        }
        if (typeof window.playEcho === 'function') {
            window.playEcho('sine', 600, 800, 0.2, 0.3, 0.2);
        }

        const course = window.currentCourse;
        if (holeNumber > course.holes.length) holeNumber = 1; 
        const holeData = course.holes[holeNumber - 1];

        // v5.22.0 Environmental Audio Trigger
        if (typeof window.playEnvironment === 'function') {
            window.playEnvironment(holeData.bgMusic, holeData.bgAmbient);
        }

        if (!holeData.landingZones || holeData.landingZones.length === 0) {
            holeData.landingZones = [{ name: "Green Approach", x: holeData.pinX, y: holeData.pinY - 15 }];
        }
        
        hole = holeData.number || holeNumber;
        par = holeData.par;
        pinX = holeData.pinX;
        pinY = holeData.pinY;
        pinZ = holeData.pinZ || 0;
        
        ballX = 0; ballY = 0; strokes = 0; isHoleComplete = false;
        puttsThisHole = 0;
        currentHoleStats = { fir: holeData.par > 3 ? false : null, gir: false, driveDistance: null, approachStart: null, approachProx: null, puttDistance: null };
        currentLie = "Tee";
        aimAngle = 0; stanceIndex = 2; stanceAlignment = 0;
        swingState = 0; 

        isPutting = false;
        puttState = 0;
        isChokedDown = false;
        window.waitingForBot = false;

        window.resetRosterForHole();

        // FIX: Establish default club BEFORE loading the player profile
        let defaultClub = holeData.par === 3 ? "7 Iron" : "Driver";
        currentClubIndex = clubs.findIndex(c => c.name === defaultClub);
        if (currentClubIndex === -1) currentClubIndex = 0;
        club = clubs[currentClubIndex];

        // FIX: Scrub putting state and assign correct club for ALL players
        for (let i = 0; i < players.length; i++) {
            players[i].currentClubIndex = currentClubIndex;
            players[i].isPutting = false;
            players[i].shotStyleIndex = 0;
            players[i].aimAngle = 0;
        }

        // Safe to load active player now
        window.loadActivePlayer(currentPlayerIndex);

        activeTargetType = 'pin';
        gridX = 0; gridY = 0;
        targetZoneIndex = 0;
        isGridNavigating = false; 

        window.updateTargetZone();
        viewingHazards = false;
        
        shotStyleIndex = 0;
        window.autoSetFocus(true);
        window.updateDashboard();

        if (windLevelIndex >= 2 && typeof window.playGolfSound === 'function') {
            window.playGolfSound('env_02');
        }
        if (typeof window.saveGame === 'function') window.saveGame();

        let holeDist = typeof calculateDistanceToPin === 'function'
            ? calculateDistanceToPin()
            : Math.round(Math.sqrt(Math.pow(pinX - ballX, 2) + Math.pow(pinY - ballY, 2)));
        let honorsName = (players[currentPlayerIndex] && players[currentPlayerIndex].name)
            ? players[currentPlayerIndex].name
            : `Player ${currentPlayerIndex + 1}`;
        let holeDesc = holeData.description || "";
        let fairwayDesc = holeData.fairwayDescription || "";
        let briefing = `Hole ${hole}. Par ${par}. ${holeDesc} ${fairwayDesc} ${holeDist} yards. Honors: ${honorsName}.`;
        briefing = briefing.replace(/\s+/g, ' ').trim();

        setTimeout(() => {
            if (typeof window.playGolfSound === 'function') window.playGolfSound('ui_nav_03');
            window.announce(briefing);
            let vis = document.getElementById('visual-output');
            if (vis) vis.innerText = briefing;
        }, 1000);

        if (players[currentPlayerIndex] && players[currentPlayerIndex].isBot) {
            let isSim = pacingModes[pacingModeIndex] === 'Simulate';
            if (isSim) {
                stateTimeouts.push(setTimeout(() => { if (typeof window.takeAITurn === 'function') window.takeAITurn(true); }, 10));
            } else {
                let hd = typeof courses !== 'undefined' ? window.currentCourse.holes[hole - 1] : null;
                let holeTextLength = 100 + (hd && hd.fairwayDescription ? hd.fairwayDescription.length : 0);
                let baseDelay = 3500;
                if (pacingModeIndex === 0) baseDelay += (holeTextLength * 20);
                if (pacingModeIndex === 1) baseDelay += (holeTextLength * 35);
                if (pacingModeIndex === 2) baseDelay += (holeTextLength * 55);
                if (pacingModeIndex === 3) baseDelay = 1500;
                
                if (typeof window.startBotThinking === 'function') window.startBotThinking(); // v5.0.4
                stateTimeouts.push(setTimeout(() => { if (typeof window.takeAITurn === 'function') window.takeAITurn(false); }, baseDelay));
            }
        }
    } catch (fatalError) {
        console.error("LOAD HOLE CRASH:", fatalError);
        window.announce("Critical error loading hole: " + fatalError.message);
        let vis = document.getElementById('visual-output');
        if (vis) vis.innerText = "CRASH: " + fatalError.message;
    }
}

function getSightReport() {
    const currentHole = window.currentCourse.holes[hole - 1];
    let warnings = [];
    const targetAngleRad = Math.atan2(targetX - ballX, targetY - ballY);
    const userAimRad = targetAngleRad + (aimAngle * (Math.PI / 180));
    const aimDeg = userAimRad * (180 / Math.PI);

    if (currentHole.trees) {
        currentHole.trees.forEach(tree => {
            let treeAngleRad = Math.atan2(tree.x - ballX, tree.y - ballY) * (180 / Math.PI);
            if (Math.abs(treeAngleRad - aimDeg) < 15 && tree.y > ballY) {
                let dist = Math.round(Math.sqrt(Math.pow(tree.x - ballX, 2) + Math.pow(tree.y - ballY, 2)));
                warnings.push(`${tree.name} is in your line of sight, ${dist} yards ahead.`);
            }
        });
    }
    if (currentHole.hazards) {
        currentHole.hazards.forEach(h => {
            let hAngleRad = Math.atan2(h.offset - ballX, h.distance - ballY) * (180 / Math.PI);
            if (Math.abs(hAngleRad - aimDeg) < 15 && h.distance > ballY) {
                warnings.push(`${h.type} is in your line of sight, ${Math.round(Math.sqrt(Math.pow(h.offset - ballX, 2) + Math.pow(h.distance - ballY, 2)))} yards ahead.`);
            }
        });
    }
    return warnings.length > 0 ? " Warning: " + warnings.join(" ") : "";
}

window.updateTargetZone = function() {
    if (gameMode !== 'course' && gameMode !== 'range') return;
    const holeData = window.currentCourse.holes[hole - 1];
    let validTargets = [];
    if (holeData.zones) validTargets = holeData.zones.filter(z => z.y > ballY + 15);
    validTargets.push({ name: "The Pin", x: holeData.pinX, y: holeData.pinY });
    
    let currentStillValid = validTargets.find(t => t.x === targetX && t.y === targetY);
    if (!currentStillValid) {
        currentZoneIndex = 0;
        targetX = validTargets[0].x;
        targetY = validTargets[0].y;
    }
};

window.announceGridPosition = function(initElevation = "") {
    const approachAngleRad = Math.atan2(pinX - ballX, pinY - ballY);
    
    // v4.81.0 3D Grid Rotation (Relative to Player Line of Sight)
    targetX = pinX + (gridY * Math.sin(approachAngleRad)) + (gridX * Math.cos(approachAngleRad));
    targetY = pinY + (gridY * Math.cos(approachAngleRad)) - (gridX * Math.sin(approachAngleRad));
    
    let distToTarget = Math.round(calculateDistanceToTarget());
    let distToPin = Math.sqrt(Math.pow(gridX, 2) + Math.pow(gridY, 2)); 
    
    // v4.81.0 Predictive Topography (Rotated Effect Translator)
    let effectStr = "Plays flat";
    if (gameMode === 'course') {
        const holeData = window.currentCourse.holes[hole - 1];
        if (holeData.greenType && typeof greenDictionary !== 'undefined') {
            let activeContours = greenDictionary[holeData.greenType] || [];
            let zone = activeContours.find(z => distToPin <= z.startY && distToPin > z.endY);
            if (zone) {
                let globalSlopeY = zone.slopeY;
                let globalSlopeX = zone.slopeX;
                
                let relSlopeY = (globalSlopeY * Math.cos(approachAngleRad)) + (globalSlopeX * Math.sin(approachAngleRad));
                let relSlopeX = -((globalSlopeX * Math.cos(approachAngleRad)) - (globalSlopeY * Math.sin(approachAngleRad)));

                let vert = relSlopeY > 0.05 ? "Checks up" : relSlopeY < -0.05 ? "Releases forward" : "";
                let horiz = relSlopeX > 0.05 ? "Kicks right" : relSlopeX < -0.05 ? "Kicks left" : "";
                
                if (vert && horiz) effectStr = `${horiz} and ${vert.toLowerCase()}`;
                else if (vert) effectStr = vert;
                else if (horiz) effectStr = horiz;
            }
        }
    }

    let squareStr = (gridX === 0 && gridY === 0)
        ? "The Pin"
        : `${Math.abs(gridY)} yards ${gridY < 0 ? 'Short' : 'Past'}, ${Math.abs(gridX)} yards ${gridX < 0 ? 'Left' : 'Right'} of pin`;

    let elevStr = initElevation ? ` ${initElevation}` : "";
    
    let msg = `Target Square: ${squareStr}.${elevStr} Effect: ${effectStr}. Distance: ${distToTarget} yards.`;
    window.announce(msg);
    let vis = document.getElementById('visual-output');
    if (vis) vis.innerText = msg;
};

// v4.9.0 Autosave & Persistence System
window.saveGame = function() {
    const state = {
        gameMode, currentCourseIndex, hole, par, strokes,
        ballX, ballY, pinX, pinY, targetX, targetY, currentZoneIndex,
        currentLie, isHoleComplete, isPutting, puttState, puttTargetDist,
        windX, windY, windLevelIndex,
        holeTelemetry, lastShotReport,
        currentClubIndex, shotStyleIndex,
        roundData, puttsThisHole, currentHoleStats, roundHighlights,
        players, currentPlayerIndex, activePlayerCount,
        wizardWind, wizardTournamentGreens, wizardRough, wizardMulligans, wizardGimmes, wizardMaxScore,
        hasHeardHoloOrientation: window.hasHeardHoloOrientation,
        courseName: typeof window.currentCourse !== 'undefined' && window.currentCourse ? window.currentCourse.name : null,
    };
    try { localStorage.setItem('ag_save_state', JSON.stringify(state)); } catch(e) {}
};

window.loadGame = function() {
    try {
        const saved = localStorage.getItem('ag_save_state');
        if (!saved) return false;
        const state = JSON.parse(saved);

        // v5.92.0 Restore Course Context
        if (state.courseName && typeof window.courses !== 'undefined') {
            let foundCourse = window.courses.find(c => c.name === state.courseName);
            if (foundCourse) window.currentCourse = foundCourse;
        }

        gameMode = state.gameMode; currentCourseIndex = state.currentCourseIndex;
        hole = state.hole; par = state.par; strokes = state.strokes;
        ballX = state.ballX; ballY = state.ballY; pinX = state.pinX; pinY = state.pinY;
        targetX = state.targetX; targetY = state.targetY; currentZoneIndex = state.currentZoneIndex;
        currentLie = state.currentLie; isHoleComplete = state.isHoleComplete;
        isPutting = state.isPutting; puttState = state.puttState || 0; puttTargetDist = state.puttTargetDist || 0;
        windX = state.windX; windY = state.windY; windLevelIndex = state.windLevelIndex;
        holeTelemetry = state.holeTelemetry || []; lastShotReport = state.lastShotReport || "Game loaded.";
        currentClubIndex = state.currentClubIndex || 0; shotStyleIndex = state.shotStyleIndex || 0;
        roundData = state.roundData || [];
        roundHighlights = state.roundHighlights || { drives: [], approaches: [], putts: [] };
        puttsThisHole = state.puttsThisHole || 0;
        currentHoleStats = state.currentHoleStats || { fir: null, gir: false };

        // v4.48.2 Roster Persistence
        players = state.players || [];
        currentPlayerIndex = state.currentPlayerIndex || 0;
        activePlayerCount = state.activePlayerCount || 2;

        wizardWind = state.wizardWind || 0;
        wizardTournamentGreens = state.wizardTournamentGreens || false;
        wizardRough = state.wizardRough || 1;
        wizardMulligans = state.wizardMulligans !== undefined ? state.wizardMulligans : 1;
        wizardGimmes = state.wizardGimmes !== undefined ? state.wizardGimmes : 1;
        wizardMaxScore = state.wizardMaxScore !== undefined ? state.wizardMaxScore : 2;
        window.hasHeardHoloOrientation = state.hasHeardHoloOrientation || false;

        club = clubs[currentClubIndex];
        return true;
    } catch (e) { return false; }
};

window.clearSave = function() {
    try { localStorage.removeItem('ag_save_state'); } catch(e) {}
};

window.initGame = function() {
    window.initAudio();
    
    if (typeof window.loadGame === 'function') window.loadGame(); // v5.0.5 Memory Restore

    if (typeof window.originalPlayTone === 'undefined' && typeof window.playTone === 'function') {
        window.originalPlayTone = window.playTone;
        window.playTone = function(freq, type, duration, vol) { window.originalPlayTone(freq, type, duration, Math.min(2.0, vol * 2.5)); };
    }
    if (typeof window.originalPlayNoise === 'undefined' && typeof window.playNoise === 'function') {
        window.originalPlayNoise = window.playNoise;
        window.playNoise = function(duration, vol, isBrown) { window.originalPlayNoise(duration, Math.min(2.0, vol * 2.5), isBrown); };
    }

    // v4.12.0 Clubhouse Boot Sequence
    document.getElementById('initBtn').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';
    document.getElementById('hud-top').style.display = 'block';

    // Hide gameplay panels while in menu
    document.getElementById('dashboard-panel').style.display = 'none';
    document.getElementById('swing-meter').style.display = 'none';
    document.getElementById('caddy-panel').style.display = 'none';
    document.getElementById('game-container').focus();

    gameMode = 'clubhouse';
    // v5.93.0 Start Clubhouse Ambient
    if (typeof window.playClubhouseMusic === 'function') window.playClubhouseMusic('vox');
    // v4.18.2 Prime before Clubhouse announcement path
    if (typeof window.playEcho === 'function') {
        window.playEcho('sine', 600, 800, 0.2, 0.3, 0.2);
    }
    window.buildClubhouseMenu();
    window.announceClubhouse(true);
};

function startBackswing(isPractice = false) {
    if (swingState !== 0) return;

    // v5.1.0 Cache state for potential Mulligan
    if (!isPractice) {
        window.preShotState = {
            ballX: ballX, ballY: ballY, currentLie: currentLie, strokes: strokes,
            isPutting: isPutting, puttTargetDist: typeof puttTargetDist !== 'undefined' ? puttTargetDist : 0,
            telemetryLength: typeof holeTelemetry !== 'undefined' ? holeTelemetry.length : 0
        };
    }

    window.initAudio();
    
    isPracticeSwing = isPractice;
    swingState = 1; hingeTimeBack = 0; hingeTimeDown = 0; lockedImpactTime = 0;
    document.getElementById('visual-output').innerText = isPractice ? "Practice Swing... Addressing..." : "Addressing ball...";

    backswingStartTime = performance.now();
    document.getElementById('visual-output').innerText = isPractice ? "Practice Backswing..." : "Backswing...";
    for (let i = 1; i <= 4; i++) { stateTimeouts.push(setTimeout(() => playTone(600, 'triangle', 0.15, 0.25), i * 500)); }
    stateTimeouts.push(setTimeout(startPowerPhase, 2000));
}

function startPowerPhase() {
    swingState = 2; powerStartTime = performance.now();
    triggerMilestone(25);
    powerOscillator = audioCtx.createOscillator();
    powerGain = audioCtx.createGain();
    powerOscillator.type = 'sine';
    powerOscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
    powerOscillator.frequency.linearRampToValueAtTime(1050, audioCtx.currentTime + 2.5);
    powerGain.gain.setValueAtTime(Math.min(1, 0.4 * (typeof CONTINUOUS_GAIN_BOOST !== 'undefined' ? CONTINUOUS_GAIN_BOOST : 1.0)), audioCtx.currentTime);
    powerOscillator.connect(powerGain); powerGain.connect(audioCtx.destination);
    powerOscillator.start();

    stateTimeouts.push(setTimeout(() => triggerMilestone(50), 666));
    stateTimeouts.push(setTimeout(() => triggerMilestone(75), 1333));
    stateTimeouts.push(setTimeout(() => triggerMilestone(100), 2000));
    stateTimeouts.push(setTimeout(() => { if (swingState === 2) { triggerMilestone(110); startDownswing(); } }, 2533));
}

function startDownswing() {
    if (swingState !== 2) { swingState = 0; return; }
    swingState = 3; stateTimeouts.forEach(clearTimeout);
    let elapsed = performance.now() - powerStartTime;
    finalPower = Math.min(110, Math.round(25 + ((elapsed / 2000) * 75)));
    
    // v4.27.0 Overpower Warning Audio
    if (finalPower > 105 && typeof window.playGolfSound === 'function') {
        window.playGolfSound('swing_07'); // Harsh buzz for over-torquing
    }

    if (powerOscillator) { powerOscillator.stop(); }
    downswingStartTime = performance.now();
    document.getElementById('visual-output').innerText = isPracticeSwing ? "Practice Downswing..." : "Downswing...";
    for (let i = 1; i <= 4; i++) { stateTimeouts.push(setTimeout(() => playTone(600, 'triangle', 0.15, 0.25), i * 500)); }
    stateTimeouts.push(setTimeout(startImpactPhase, 2000));
}

function startImpactPhase() {
    swingState = 4; impactStartTime = performance.now();
    dropDurationMs = finalPower * 15;
    if (finalPower >= 100) triggerMilestone(100);

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100 + (finalPower * 8), audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + (dropDurationMs / 1000));
    gain.gain.setValueAtTime(Math.min(1, 0.4 * (typeof CONTINUOUS_GAIN_BOOST !== 'undefined' ? CONTINUOUS_GAIN_BOOST : 1.0)), audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + (dropDurationMs / 1000));
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + (dropDurationMs / 1000) + 0.1);

    [75, 50, 25].forEach(m => { if (finalPower > m) stateTimeouts.push(setTimeout(() => triggerMilestone(m), (finalPower - m) * 15)); });
    
    // v5.4.0 The Impact Target Tick (Audio Bullseye)
    // Note: We deliberately do not check swingState here so the tick always plays, 
    // providing relative early/late feedback even after the ball is struck.
    stateTimeouts.push(setTimeout(() => { 
        if (typeof playTone === 'function') playTone(800, 'triangle', 0.1, 0.5); 
    }, dropDurationMs));

    // v4.19.0 Restoration: Timeout only triggers the Whiff (calculateShot true)
    stateTimeouts.push(setTimeout(() => { 
        if (swingState === 4) {
            if (isPracticeSwing) window.evaluatePracticeSwing();
            else if (typeof calculateShot === 'function') calculateShot(true);
        } 
    }, dropDurationMs + 400));
}

window.evaluatePracticeSwing = function() {
    let impactDiff = lockedImpactTime > 0 ? lockedImpactTime - dropDurationMs : 400; // 400ms default miss if no swing
    let hingeDiff = (hingeTimeBack > 0 && hingeTimeDown > 0) ? hingeTimeDown - hingeTimeBack : 0;
    let usedHinge = hingeTimeBack > 0 && hingeTimeDown > 0;

    let impactStr = Math.abs(impactDiff) <= 60 ? "Perfect impact!" :
                    impactDiff < 0 ? `A bit early on impact (${Math.abs(Math.round(impactDiff))}ms).` :
                    `A bit late on impact (${Math.abs(Math.round(impactDiff))}ms).`;

    let powerStr = `Hit ${finalPower} percent power.`;

    let hingeStr = "";
    if (usedHinge) {
        hingeStr = Math.abs(hingeDiff) <= 50 ? "Excellent tempo." :
                   hingeDiff < 0 ? "You rushed the downswing transition." :
                   "You hesitated on the downswing.";
    }

    let msg = `[Practice] ${powerStr} ${hingeStr} ${impactStr}`;
    window.announce(msg);
    document.getElementById('visual-output').innerText = msg;
    
    // v4.43.1 Practice Swing Diagnostics
    let hWord = hingeDiff < 0 ? 'early' : hingeDiff > 0 ? 'late' : 'perfect';
    let iWord = impactDiff < 0 ? 'early' : impactDiff > 0 ? 'late' : 'perfect';
    // v4.45.1 Telemetry Ownership
    let pName = typeof players !== 'undefined' && players.length > 0 ? players[currentPlayerIndex].name : "Player";
    lastTimingReport = `[${pName}] Practice Swing. Power ${finalPower} percent. Hinge ${Math.abs(hingeDiff)}ms ${hWord}. Impact ${Math.abs(impactDiff)}ms ${iWord}.`;

    swingState = 0;
    isPracticeSwing = false;
    window.updateDashboard();
};

// --- v5.1.10 Visual Swing Meter Restoration (With Hinge Markers) ---
window.generateTelemetryDump = function() {
    let p = players[currentPlayerIndex];
    let dump = `# MATCH SETTINGS\n`;
    dump += `**Engine Version:** v5.5.1\n`;
    dump += `**Course:** ${window.currentCourse.name}\n`;
};
