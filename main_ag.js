// main_ag.js - Game State, Variables, and Swing Sequence (v4.61.0)

let swingState = 0; // 0: Idle, 1: Back, 2: Power, 3: Down, 4: Impact, 5: Flight
window.stimpSpeed = 10;
let isPracticeSwing = false;
let devPower = false, devHinge = false, devImpact = false;
let pacingModeIndex = 0; // 0: Fast, 1: Medium, 2: Slow, 3: Manual
let pacingModes = ["Fast", "Medium", "Slow", "Manual"];
window.waitingForBot = false;
let stateTimeouts = [];

let backswingStartTime = 0, downswingStartTime = 0, impactStartTime = 0, powerStartTime = 0;
let hingeTimeBack = 0, hingeTimeDown = 0;
let finalPower = 0, dropDurationMs = 0;
let lockedImpactTime = 0;
let windX = 0, windY = 0, windLevelIndex = 0; // v4.13.0 Calm Default
let aimAngle = 0, stanceIndex = 2, stanceAlignment = 0, isChokedDown = false;
let hole = 1, par = 4, strokes = 0;
let ballX = 0, ballY = 0, pinX = 0, pinY = 420;
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
let gameMode = 'course';
let isExploreMode = false;
let clubhouseMenu = [];
let clubhouseIndex = 0;
let isPutting = false, puttState = 0, puttTargetDist = 0;
let viewingHazards = false, hazardIndex = 0;
let viewingHelp = false, helpIndex = 0;
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

window.initPlayers = function() {
    players = [];
    for (let i = 0; i < activePlayerCount; i++) {
        let isBot = i > 0; // Player 1 is human, Player 2 and 3 are bots
        let pName = `Player ${i + 1}`;
        let bSkill = 0;
        if (i === 1) { pName = "Bot Woods"; bSkill = 3; }
        if (i === 2) { pName = "Mulligan Moe"; bSkill = 1; } // Amateur

        players.push({
            name: pName,
            isBot: isBot,
            botSkill: bSkill,
            botImpact: 0,
            botHinge: 0,
            botPower: 100,
            strokes: 0,
            puttsThisHole: 0,
            ballX: 0, ballY: 0,
            currentLie: "Tee",
            isHoleComplete: false,
            isPutting: false,
            puttTargetDist: 0,
            aimAngle: 0,
            stanceIndex: 2,
            stanceAlignment: 0,
            focusIndex: 0,
            currentClubIndex: currentClubIndex,
            difficultyIndex: typeof difficultyIndex !== 'undefined' ? difficultyIndex : 2,
            caddyLevel: typeof caddyLevel !== 'undefined' ? caddyLevel : 1,
            activeBallIndex: typeof activeBallIndex !== 'undefined' ? activeBallIndex : 0,
            shotStyleIndex: 0,
            isChokedDown: false,
            devPower: false, devHinge: false, devImpact: false
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

        let allDone = players.every(p => p.isHoleComplete);
        if (allDone) {
            let compMsg = `All players have finished Hole ${hole}. Press Enter to proceed to the next hole.`;
            if (hole >= courses[currentCourseIndex].holes.length) {
                gameMode = 'post_round';
                compMsg = "Round Complete! All players have finished. Press Shift + N to copy summaries, or Escape to return to the Clubhouse.";
            }
            window.announce(compMsg);
            window.setCaddyPanelText(compMsg);
            swingState = 6;
            return;
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
                puttTargetDist = Math.max(1/3, Math.round(actualDist));
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
                if (players[currentPlayerIndex].name === "Bot Woods" && typeof window.playBotWoodsSignature === 'function') {
                    window.playBotWoodsSignature(Math.floor(Math.random() * 5) + 1);
                } else if (typeof window.playGolfSound === 'function') {
                    window.playGolfSound('ui_nav_07');
                }
            } else {
                setTimeout(() => { window.announce(`Still ${pName}'s turn. ${distMsg}`); }, 300);
            }
        } catch(e){}

        try { window.updateDashboard(); } catch(e){}

        if (players[currentPlayerIndex].isBot) {
            window.waitingForBot = false;
            let textToRead = (typeof lastShotReport !== 'undefined' && lastShotReport) ? lastShotReport : "";
            let baseDelay = 2500; // Base buffer for UI sounds and swap announcement
            if (pacingModeIndex === 0) baseDelay += (textToRead.length * 20); // Fast
            if (pacingModeIndex === 1) baseDelay += (textToRead.length * 35); // Medium
            if (pacingModeIndex === 2) baseDelay += (textToRead.length * 55); // Slow
            if (pacingModeIndex === 3) baseDelay = 1500; // Manual Mode

            stateTimeouts.push(setTimeout(() => {
                if (typeof window.takeAITurn === 'function') window.takeAITurn();
            }, baseDelay));
        }
    } catch (fatalError) {
        console.error("CRITICAL TURN MANAGER CRASH:", fatalError);
    }
};

// v4.48.0 AI Brain & Short Game Logic
window.takeAITurn = function() {
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
        // v4.48.1 AI Target Cursor & Zero-Power Fix
        let actualDist = typeof calculateDistanceToPin === 'function' ? calculateDistanceToPin() : 10;
        puttTargetDist = Math.max(1, Math.ceil(actualDist)); // Snap cursor to actual distance (min 1 yard)
        p.puttTargetDist = puttTargetDist;
        
        aimAngle = blueprint.aimDeg !== null ? blueprint.aimDeg : 0;
        let pace = blueprint.pace !== null ? blueprint.pace : actualDist;
        
        // Calculate power, ensuring it never drops below 1% to prevent infinite loops
        p.botPower = Math.max(1, Math.round((pace / puttTargetDist) * 100)); 
    } else {
        currentClubIndex = blueprint.clubIndex !== undefined && blueprint.clubIndex !== null ? blueprint.clubIndex : 0;
        if (typeof clubs !== 'undefined' && clubs[currentClubIndex]) { club = clubs[currentClubIndex]; }
        stanceIndex = blueprint.stanceIndex !== undefined && blueprint.stanceIndex !== null ? blueprint.stanceIndex : 2;
        aimAngle = blueprint.aimDeg !== undefined && blueprint.aimDeg !== null ? blueprint.aimDeg : 0;
        shotStyleIndex = blueprint.styleIndex !== undefined ? blueprint.styleIndex : 0;
        let rawPower = blueprint.power !== undefined ? blueprint.power : 100;
        p.botPower = Math.max(10, Math.round(rawPower / 5) * 5);
    }

    let variance = p.botSkill === 3 ? 15 : p.botSkill === 2 ? 45 : 100;
    p.botImpact = Math.floor((Math.random() * variance * 2) - variance);
    p.botHinge = Math.floor((Math.random() * variance * 2) - variance);
    
    window.autoSetFocus(true);
    window.updateDashboard();

    if (!club && typeof clubs !== 'undefined') club = clubs[0];
    
    let setupMsg = isPutting ? `${p.name} is reading the green...` : `${p.name} equips ${club.name} and lines up the shot...`;
    
    if (pacingModeIndex === 3) {
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
    puttsThisHole = p.puttsThisHole;
    ballX = p.ballX;
    ballY = p.ballY;
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
    const holeData = typeof courses !== 'undefined' ? courses[currentCourseIndex].holes[hole - 1] : null;
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

        // v4.61.0 Telemetry Archiving
        if (typeof holeTelemetry !== 'undefined' && holeTelemetry.length > 0 && typeof roundData !== 'undefined') {
            let record = roundData.find(r => r.hole === hole);
            if (record) {
                const hd = courses[currentCourseIndex].holes[hole - 1];
                const header = `## HOLE ${hole} (${hd.distance}y, Par ${par})\n**Pin:** ${hd.pinLocation}\n\n`;
                record.telemetryLog = header + holeTelemetry.join('\n\n');
            }
        }

        holeTelemetry = [];
        if (typeof powerOscillator !== 'undefined' && powerOscillator) {
            try { powerOscillator.stop(); } catch (e) {}
        }

        window.initAudio(); 
        if (typeof window.playEcho === 'function') {
            window.playEcho('sine', 600, 800, 0.2, 0.3, 0.2);
        }

        const course = courses[currentCourseIndex];
        if (holeNumber > course.holes.length) holeNumber = 1; 
        const holeData = course.holes[holeNumber - 1];

        if (!holeData.landingZones || holeData.landingZones.length === 0) {
            holeData.landingZones = [{ name: "Green Approach", x: holeData.pinX, y: holeData.pinY - 15 }];
        }
        
        hole = holeData.number;
        par = holeData.par;
        pinX = holeData.pinX;
        pinY = holeData.pinY;
        
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
            let hd = typeof courses !== 'undefined' ? courses[currentCourseIndex].holes[hole - 1] : null;
            let holeTextLength = 100 + (hd && hd.fairwayDescription ? hd.fairwayDescription.length : 0);
            let baseDelay = 3500; // Base buffer for hole transition audio
            if (pacingModeIndex === 0) baseDelay += (holeTextLength * 20);
            if (pacingModeIndex === 1) baseDelay += (holeTextLength * 35);
            if (pacingModeIndex === 2) baseDelay += (holeTextLength * 55);
            if (pacingModeIndex === 3) baseDelay = 1500; // Manual Mode

            stateTimeouts.push(setTimeout(() => {
                if (typeof window.takeAITurn === 'function') window.takeAITurn();
            }, baseDelay));
        }
    } catch (fatalError) {
        console.error("LOAD HOLE CRASH:", fatalError);
        window.announce("Critical error loading hole: " + fatalError.message);
        let vis = document.getElementById('visual-output');
        if (vis) vis.innerText = "CRASH: " + fatalError.message;
    }
}

function getSightReport() {
    const currentHole = courses[currentCourseIndex].holes[hole - 1];
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
    if (gameMode !== 'course') return;
    const holeData = courses[currentCourseIndex].holes[hole - 1];
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
    targetX = pinX + gridX;
    targetY = pinY + gridY;
    let distToTarget = calculateDistanceToTarget();
    let distToPin = Math.sqrt(Math.pow(gridX, 2) + Math.pow(gridY, 2)); 
    
    // v4.14.3 Predictive Topography (Effect Translator)
    let effectStr = "Plays flat";
    if (gameMode === 'course') {
        const holeData = courses[currentCourseIndex].holes[hole - 1];
        if (holeData.greenType && typeof greenDictionary !== 'undefined') {
            let activeContours = greenDictionary[holeData.greenType] || [];
            let zone = activeContours.find(z => distToPin <= z.startY && distToPin > z.endY);
            if (zone) {
                let vert = zone.slopeY > 0 ? "Checks up" : zone.slopeY < 0 ? "Releases forward" : "";
                let horiz = zone.slopeX > 0 ? "Kicks right" : zone.slopeX < 0 ? "Kicks left" : "";
                
                if (vert && horiz) effectStr = `${horiz} and ${vert.toLowerCase()}`;
                else if (vert) effectStr = vert;
                else if (horiz) effectStr = horiz;
            }
        }
    }

    // v4.14.4 Clean Coordinate Formatting
    let squareStr = (gridX === 0 && gridY === 0)
        ? "The Pin"
        : `${Math.abs(gridY)} yards ${gridY < 0 ? 'Short' : 'Past'}, ${Math.abs(gridX)} yards ${gridX < 0 ? 'Left' : 'Right'} of pin`;

    let elevStr = initElevation ? ` ${initElevation}` : "";
    
    let msg = `Target Square: ${squareStr}.${elevStr} Effect: ${effectStr}. Distance: ${distToTarget} yards.`;
    window.announce(msg);
    document.getElementById('visual-output').innerText = msg;
};

window.announce = function(msg) {
    const ariaBox = document.getElementById('aria-announce');
    if (ariaBox) ariaBox.innerText = msg;
    
    // Push the same text to the visual marquee
    const marquee = document.getElementById('marquee-text');
    if (marquee) {
        marquee.innerText = msg;
        // Reset the CSS animation to force it to restart from the right side
        marquee.style.animation = 'none';
        void marquee.offsetWidth; // Trigger reflow
        marquee.style.animation = 'scrollMarquee 12s linear infinite';
    }
};

window.updateDashboard = function() {
    if (!document.getElementById('dashboard-panel')) return;
    
    // 1. Hole / Target Info
    let pName = typeof players !== 'undefined' && players.length > 0 ? players[currentPlayerIndex].name + "\n" : "";
    let holeStr = gameMode === 'course' ? `${pName}Hole ${hole} (Par ${par})\n${calculateDistanceToPin()}y to Pin` :
                  gameMode === 'range' ? `Driving Range\n${pinY}y Target` : `Chipping Green\n${calculateDistanceToPin()}y Target`;
    if ((gameMode === 'range' || (gameMode === 'chipping' && chippingRange === 'long')) && synthTreeActive) {
        let latStr = synthTreeX === 0 ? 'Center' : `${Math.abs(synthTreeX)}y ${synthTreeX > 0 ? 'R' : 'L'}`;
        holeStr += `\nSynth Tree: ${synthTreeDist}y out, ${latStr} (${Math.round(synthTreeHeight)}ft)`;
    }

    if (isPutting) {
        let locationStr = gameMode === 'putting' ? "Practice Putting Green" : "Putting Green";
        holeStr = `${locationStr}\n${calculateDistanceToPin()}y to Cup`;
        let modeStr = puttState === 0 ? "TARGETING MODE" : "SWING MODE";
        document.getElementById('dash-env').innerText = modeStr;
        document.getElementById('dash-club').innerText = `Putter\nTarget: ${puttTargetDist}y`;
        let aimStr = aimAngle === 0 ? "Center" : `${Math.abs(aimAngle)}° ${aimAngle < 0 ? 'L' : 'R'}`;
        document.getElementById('dash-setup').innerText = `Aim: ${aimStr}`;
        document.getElementById('dash-hole').innerText = holeStr;
        return; 
    }

    document.getElementById('dash-hole').innerText = holeStr;
    
    // 2. Environment Info
    let windStr = windX === 0 && windY === 0 ? "Calm" : `${Math.abs(windY)}y ${windY>0?'Tail':'Head'}\n${Math.abs(windX)}y ${windX>0?'Right':'Left'}`;
    let activeLie = gameMode === 'range' ? rangeLie : currentLie;
    document.getElementById('dash-env').innerText = `${activeLie}\n${windStr}`;
    
    // 3. Equipment Info
    let style = shotStyles[shotStyleIndex];
    let gripStr = isChokedDown ? "(Choked 90%)" : "(Full Grip)";
    document.getElementById('dash-club').innerText = `${club.name} ${gripStr}\n${style.name} Swing`;
    
    // 4. Setup Info
    let aimStr = aimAngle === 0 ? "Center" : `${Math.abs(aimAngle)}° ${aimAngle < 0 ? 'Left' : 'Right'}`;
    let focusName = typeof focusModes !== 'undefined' ? focusModes[focusIndex].name : 'Std';
    let diffName = typeof difficultyLevels !== 'undefined' ? difficultyLevels[difficultyIndex].name : 'Pro';
    document.getElementById('dash-setup').innerText = `Aim: ${aimStr}\n${stanceNames[stanceIndex]}\n[${focusName} / ${diffName}]`;
};

// v4.10.0 Scorecard System
window.getQuickScore = function() {
    if (roundData.length === 0) return "No scores recorded yet. You are Even Par.";
    let totalStrokes = 0, totalPar = 0;
    roundData.forEach(r => { totalStrokes += r.strokes; totalPar += r.par; });
    let rel = totalStrokes - totalPar;
    let relStr = rel === 0 ? "Even Par" : rel > 0 ? `${rel} Over Par` : `${Math.abs(rel)} Under Par`;
    return `Through ${roundData.length} holes, you are ${relStr}. Total strokes: ${totalStrokes}.`;
};

window.getScoreTerm = function(par, score) {
    if (score === 1) return "Hole in One";
    let diff = score - par;
    if (diff === -3) return "Albatross";
    if (diff === -2) return "Eagle";
    if (diff === -1) return "Birdie";
    if (diff === 0) return "Par";
    if (diff === 1) return "Bogey";
    if (diff === 2) return "Double Bogey";
    if (diff === 3) return "Triple Bogey";
    return `+${diff}`;
};

window.showScorecard = function() {
    scorecardGrid = [];
    let tStrokes = 0, tPar = 0, tPutts = 0;
    let firHit = 0, firPossible = 0;
    let girHit = 0, girPossible = 0;
    let totalAppProx = 0, appProxCount = 0;

    if (scorecardPage === 0) {
        // v4.30.3 Added Putt Dist
        scorecardGrid.push(["Hole", "Par", "Score", "Result", "Putts", "Putt Dist"]);
    } else {
        scorecardGrid.push(["Hole", "Drive", "FIR", "App Start", "App Prox", "GIR"]);
    }

    roundData.forEach(r => {
        tStrokes += r.strokes; tPar += r.par; tPutts += r.putts;
        let firStr = "-";
        if (r.fir !== null) {
            firPossible++;
            if (r.fir) { firHit++; firStr = "Yes"; } else { firStr = "No"; }
        }
        girPossible++;
        if (r.gir) { girHit++; }
        let girStr = r.gir ? "Yes" : "No";

        let term = window.getScoreTerm(r.par, r.strokes);
        let driveStr = r.driveDistance ? `${r.driveDistance}y` : "-";
        let puttStr = r.putts.toString();
        
        // v4.30.3 Extract and format the holed putt distance
        let puttDistStr = (r.putts > 0 && r.puttDistance) ? window.formatProximity(r.puttDistance) : "-";
        
        let appStartStr = r.approachStart ? `${r.approachStart}y` : "-";
        let appProxStr = r.approachProx ? window.formatProximity(r.approachProx) : "-";
        if (r.approachProx) {
            totalAppProx += r.approachProx;
            appProxCount++;
        }

        if (scorecardPage === 0) {
            scorecardGrid.push([r.hole.toString(), r.par.toString(), r.strokes.toString(), term, puttStr, puttDistStr]);
        } else {
            scorecardGrid.push([r.hole.toString(), driveStr, firStr, appStartStr, appProxStr, girStr]);
        }
    });

    let rel = tStrokes - tPar;
    let relStr = rel === 0 ? "E" : rel > 0 ? `+${rel}` : `${rel}`;
    let firTotalStr = firPossible > 0 ? `${firHit}/${firPossible}` : "-";
    let girTotalStr = girPossible > 0 ? `${girHit}/${girPossible}` : "-";
    let avgProxStr = appProxCount > 0 ? window.formatProximity(totalAppProx / appProxCount) : "-";

    if (scorecardPage === 0) {
        scorecardGrid.push(["TOTAL", `(${relStr})`, tStrokes.toString(), "-", tPutts.toString(), "-"]);
    } else {
        scorecardGrid.push(["TOTAL", "-", firTotalStr, "-", avgProxStr, girTotalStr]);
    }

    let html = `<table id="scorecard-table" style="width:100%; border-collapse: collapse; text-align: center; color: white;" border="1" aria-hidden="true">
        <thead><tr>${scorecardGrid[0].map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>`;
    for (let i = 1; i < scorecardGrid.length - 1; i++) {
        html += `<tr>${scorecardGrid[i].map(d => `<td>${d}</td>`).join('')}</tr>`;
    }
    let lastRow = scorecardGrid[scorecardGrid.length - 1];
    html += `</tbody><tfoot><tr><th>${lastRow[0]}</th>` + lastRow.slice(1).map(d => `<td>${d}</td>`).join('') + `</tr></tfoot></table>`;

    document.getElementById('scorecard-container').innerHTML = html;
    document.getElementById('scorecard-container').style.display = 'block';
    document.getElementById('visual-output').style.display = 'none';

    // Clamp column if Analytics page has fewer/more columns than Traditional
    if (scCol >= scorecardGrid[0].length) scCol = scorecardGrid[0].length - 1;

    // Only call the Init Announcement if we are opening it fresh (Row 0, Col 0)
    if (scRow === 0 && scCol === 0) window.announceScorecardCell(true);
};

window.announceScorecardCell = function(isInit = false, isPageFlip = false) {
    let val = scorecardGrid[scRow][scCol];
    let colName = scorecardGrid[0][scCol];
    let rowName = scorecardGrid[scRow][0];
    
    let msg = "";
    if (isInit) {
        let courseName = courses[currentCourseIndex].name;
        msg = `${courseName} Scorecard. Page ${scorecardPage + 1}. Use Spacebar to flip pages, Arrow Keys to navigate, Escape to close. `;
        msg += `Row 1, Column 1. ${val}.`;
    } else if (isPageFlip) {
        let pageName = scorecardPage === 0 ? "Page 1: Traditional Scoring" : "Page 2: Advanced Analytics";
        let rowPrefix = rowName === "TOTAL" ? "TOTAL Row" : `Hole ${rowName}`;
        msg = `${pageName}. ${rowPrefix}, ${colName}: ${val}`;
    } else {
        if (scRow === 0) {
            msg = `Column Header: ${val}`;
        } else if (scCol === 0) {
            msg = rowName === "TOTAL" ? "TOTAL Row" : `Hole ${val}`;
        } else {
            let rowPrefix = rowName === "TOTAL" ? "Total" : `Hole ${rowName},`;
            msg = `${rowPrefix} ${colName}: ${val}`;
        }
    }
    
    window.announce(msg);
    
    let table = document.getElementById('scorecard-table');
    if (table) {
        let cells = table.getElementsByTagName('td');
        let ths = table.getElementsByTagName('th');
        for (let c of cells) { c.style.backgroundColor = 'transparent'; c.style.color = 'white'; }
        for (let c of ths) { c.style.backgroundColor = 'transparent'; c.style.color = 'white'; }
        try {
            let targetRow = table.rows[scRow];
            let targetCell = targetRow.cells[scCol];
            targetCell.style.backgroundColor = '#4CAF50';
            targetCell.style.color = 'black';
        } catch(e) {}
    }
};

window.generateNarrativeSummary = function() {
    if (roundData.length === 0) return "No holes completed yet.";
    let totalStrokes = 0, totalPar = 0;
    roundData.forEach(r => { totalStrokes += r.strokes; totalPar += r.par; });
    let rel = totalStrokes - totalPar;
    let relStr = rel === 0 ? "Even Par" : rel > 0 ? `+${rel}` : `${Math.abs(rel)} Under Par`;

    let text = `⛳ Accessible Golf Round Summary ⛳\n`;
    text += `Course: ${courses[currentCourseIndex].name}\n`;
    text += `Score: ${relStr} (${totalStrokes})\n\n`;
    text += `🏆 Highlights of the Round:\n`;

    let hasHighlights = false;
    if (roundHighlights.drives.length > 0) {
        text += `[Monster Drives]\n`;
        roundHighlights.drives.forEach(d => text += `- Crushed a ${d.dist}-yard tee shot on Hole ${d.hole}.\n`);
        hasHighlights = true;
    }
    if (roundHighlights.approaches.length > 0) {
        text += `\n[Sniper Approaches]\n`;
        roundHighlights.approaches.forEach(a => text += `- Stuck it to ${window.formatProximity(a.prox)} from ${a.start} yards out on Hole ${a.hole}.\n`);
        hasHighlights = true;
    }
    if (roundHighlights.putts.length > 0) {
        text += `\n[Clutch Putts]\n`;
        roundHighlights.putts.forEach(p => text += `- Drained a ${window.formatProximity(p.dist)} putt on Hole ${p.hole}.\n`);
        hasHighlights = true;
    }

    if (!hasHighlights) text += "- A solid, consistent round of golf.\n";
    return text;
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
        players, currentPlayerIndex, activePlayerCount // v4.48.2 Roster Persistence
    };
    try { localStorage.setItem('ag_save_state', JSON.stringify(state)); } catch(e) {}
};

window.loadGame = function() {
    try {
        const saved = localStorage.getItem('ag_save_state');
        if (!saved) return false;
        const state = JSON.parse(saved);

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

        club = clubs[currentClubIndex];
        return true;
    } catch (e) { return false; }
};

window.clearSave = function() {
    try { localStorage.removeItem('ag_save_state'); } catch(e) {}
};

// v4.6.0 Spatial Audio Metronome
window.playRollingBlip = function(speed, panValue) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const panner = audioCtx.createStereoPanner();
    const gain = audioCtx.createGain();

    // A low, thudding frequency that rises slightly with speed
    osc.frequency.value = 120 + (speed * 15);
    osc.type = 'sine';

    // Cap the pan hard at -1 (Left) and 1 (Right)
    panner.pan.value = Math.max(-1, Math.min(1, panValue));

    // Short percussive pop (v4.8.0 Volume Boost)
    let boost = typeof CONTINUOUS_GAIN_BOOST !== 'undefined' ? CONTINUOUS_GAIN_BOOST : 1.0;
    gain.gain.setValueAtTime(0.8 * boost, audioCtx.currentTime); // Increased from 0.3
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

    osc.connect(panner); panner.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.1);
};

window.initGame = function() {
    window.initAudio();

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
    // v4.18.2 Prime before Clubhouse announcement path
    if (typeof window.playEcho === 'function') {
        window.playEcho('sine', 600, 800, 0.2, 0.3, 0.2);
    }
    window.buildClubhouseMenu();
};

window.buildClubhouseMenu = function() {
    clubhouseMenu = [];
    const saved = localStorage.getItem('ag_save_state');
    
    if (saved) {
        clubhouseMenu.push({ text: "Resume Saved Session", action: () => {
            let success = window.loadGame();
            if (success) {
                // v4.18.2 Prime before restored-session announcement
                if (typeof window.playEcho === 'function') {
                    window.playEcho('sine', 600, 800, 0.2, 0.3, 0.2);
                }
                document.getElementById('dashboard-panel').style.display = 'grid';
                document.getElementById('swing-meter').style.display = 'block';
                window.updateDashboard();
                let targetDist = calculateDistanceToPin();
                let msg = `Session Restored. Hole ${hole}. Stroke ${strokes + 1}. ${targetDist} yards to the pin. Lie is ${currentLie}.`;
                if (isPutting) msg = `Session Restored. On the Green. ${puttTargetDist} yards to the cup.`;
                window.announce(msg);
                document.getElementById('visual-output').innerText = msg;
                if (lastShotReport !== "Game loaded.") document.getElementById('caddy-panel').style.display = 'block';
            }
        }});
    }
    
    clubhouseMenu.push({ text: "Start New Round", action: () => {
        window.clearSave(); roundData = []; roundHighlights = { drives: [], approaches: [], putts: [] }; puttsThisHole = 0; holeTelemetry = [];
        gameMode = 'course'; currentCourseIndex = 0; strokes = 0;
        document.getElementById('dashboard-panel').style.display = 'grid';
        document.getElementById('swing-meter').style.display = 'block';
        document.getElementById('caddy-panel').style.display = 'none';
        // v4.18.2 Prime before starting a new session flow
        if (typeof window.playEcho === 'function') {
            window.playEcho('sine', 600, 800, 0.2, 0.3, 0.2);
        }
        generateWind(); loadHole(1);
        let targetDist = calculateDistanceToPin();
        let msg = `New Round Started. Hole 1. Par ${par}. ${targetDist} yards. Ready.`;
        window.announce(msg); document.getElementById('visual-output').innerText = msg;
    }});

    clubhouseMenu.push({ text: "Driving Range", action: () => {
        gameMode = 'range'; strokes = 0; holeTelemetry = []; ballX = 0; ballY = 0; pinX = 0; pinY = club.baseDistance; rangeLie = 'Fairway'; isHoleComplete = false; swingState = 0; if (typeof isPutting !== 'undefined') isPutting = false;
        document.getElementById('dashboard-panel').style.display = 'grid';
        document.getElementById('swing-meter').style.display = 'block';
        document.getElementById('caddy-panel').style.display = 'none';
        window.updateDashboard();
        let msg = `Welcome to the Driving Range. Target set to ${pinY} yards. Lie is ${rangeLie}.`;
        window.announce(msg); document.getElementById('visual-output').innerText = msg;
    }});
    
    clubhouseMenu.push({ text: "Chipping Green", action: () => {
        gameMode = 'chipping'; strokes = 0; holeTelemetry = []; isHoleComplete = false; swingState = 0;
        ballX = 0; ballY = 0; pinX = 0; pinY = chippingRange === 'short' ? Math.floor(Math.random() * 16) + 5 : Math.floor(Math.random() * 61) + 20;
        document.getElementById('dashboard-panel').style.display = 'grid';
        document.getElementById('swing-meter').style.display = 'block';
        document.getElementById('caddy-panel').style.display = 'none';
        window.updateDashboard();
        let targetDist = calculateDistanceToPin();
        let msg = `Welcome to the Chipping Green. Target is ${targetDist} yards.`;
        window.announce(msg); document.getElementById('visual-output').innerText = msg;
    }});

    clubhouseMenu.push({ text: "Practice Putting Green", action: () => {
        gameMode = 'putting'; strokes = 0; holeTelemetry = []; isHoleComplete = false;
        ballX = 0; ballY = 0; pinX = 0; pinY = Math.floor(Math.random() * 41) + 5; 
        document.getElementById('dashboard-panel').style.display = 'grid';
        document.getElementById('swing-meter').style.display = 'block';
        document.getElementById('caddy-panel').style.display = 'none';
        window.initPutting();
    }});

    clubhouseMenu.push({ text: "Help and Controls", action: () => {
        viewingHelp = true; helpIndex = 0; window.announceHelp();
    }});

    clubhouseIndex = 0;
    window.announceClubhouse(true);
};

window.announceClubhouse = function(isInit = false) {
    let item = clubhouseMenu[clubhouseIndex];
    let prefix = isInit ? "Clubhouse Menu. " : "";
    let instruct = isInit ? " Press Enter to select, or Up and Down arrows to navigate." : "";
    let msg = `${prefix}${item.text}. Item ${clubhouseIndex + 1} of ${clubhouseMenu.length}.${instruct}`;
    
    window.announce(msg);
    document.getElementById('visual-output').innerText = msg;
};

function startBackswing(isPractice = false) {
    if (swingState !== 0) return;
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

window.drawMeter = function() {
    requestAnimationFrame(window.drawMeter);
    const canvas = document.getElementById('swing-meter');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Clear background
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, w, h);

    if (swingState === 0 || isHoleComplete) {
        ctx.fillStyle = '#4CAF50';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("READY - Hold Down Arrow to Swing", w/2, h/2 + 8);
        return;
    }

    const now = performance.now();

    const drawHinges = () => {
        if (hingeTimeBack > 0) {
            let x = (hingeTimeBack / 2000) * w;
            ctx.fillStyle = '#ffeb3b'; 
            ctx.beginPath(); ctx.moveTo(x - 12, 0); ctx.lineTo(x + 12, 0); ctx.lineTo(x, 25); ctx.fill();
        }
        if (hingeTimeDown > 0) {
            let x = (hingeTimeDown / 2000) * w;
            ctx.fillStyle = '#ff9800'; 
            ctx.beginPath(); ctx.moveTo(x - 12, h); ctx.lineTo(x + 12, h); ctx.lineTo(x, h - 25); ctx.fill();
        }
    };

    if (swingState === 1 || swingState === 3) {
        let isBack = swingState === 1;
        let start = isBack ? backswingStartTime : downswingStartTime;
        let elapsed = now - start;
        let progress = Math.min(1, Math.max(0, elapsed / 2000));
        
        // Fill the bar
        ctx.fillStyle = isBack ? '#2e7d32' : '#0277bd';
        ctx.fillRect(0, 0, w * progress, h);
        
        // Draw Audio Metronome Hash Marks
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for(let i=1; i<=4; i++) {
            ctx.fillRect((w * (i * 0.25)) - 2, 0, 4, h);
        }
        
        ctx.fillStyle = 'white';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(isBack ? "BACKSWING (Tap Space for Hinge)" : "DOWNSWING (Tap Space for Hinge)", 15, 30);
        
        drawHinges();
    }
    else if (swingState === 2) {
        let elapsed = now - powerStartTime;
        let pwr = 25 + ((elapsed / 2000) * 75);
        let progress = Math.min(1, Math.max(0, pwr / 120));
        
        ctx.fillStyle = pwr > 100 ? '#c62828' : '#6a1b9a';
        ctx.fillRect(0, 0, w * progress, h);
        
        let mark100 = (100 / 120) * w;
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillRect(mark100 - 3, 0, 6, h);
        
        ctx.fillStyle = 'white';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`POWER PHASE: ${Math.round(pwr)}% (Release to Lock)`, 15, 30);
    }
    else if (swingState === 4 || swingState === 5) {
        let targetX = w * 0.8; 
        let currentElapsed = swingState === 4 ? now - impactStartTime : lockedImpactTime;
        
        // Sweet Spot (Green Zone)
        let sweetSpotWidth = (60 / dropDurationMs) * targetX * 2;
        ctx.fillStyle = 'rgba(76, 175, 80, 0.4)';
        ctx.fillRect(targetX - (sweetSpotWidth/2), 0, sweetSpotWidth, h);
        
        // White Target Line
        ctx.fillStyle = 'white';
        ctx.fillRect(targetX - 2, 0, 4, h);
        
        // Moving Cursor
        let cursorX = (currentElapsed / dropDurationMs) * targetX;
        ctx.fillStyle = '#ffeb3b';
        ctx.fillRect(cursorX - 4, 0, 8, h);
        
        ctx.fillStyle = 'white';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'left';
        if (swingState === 4) {
            ctx.fillText("IMPACT ZONE (Press Down Arrow at the White Line)", 15, 30);
        } else {
            let diff = Math.round(currentElapsed - dropDurationMs);
            ctx.fillText(`IMPACT LOCKED: ${Math.abs(diff)}ms ${diff < 0 ? 'Early' : diff > 0 ? 'Late' : 'Perfect'}`, 15, 30);
        }
    }
};

// --- 3D FLIGHT AUDIO ENGINE INTEGRATION ---

window.playFlightBlip = function(pitch, panValue, speedModifier, waveType = 'triangle') {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const panner = audioCtx.createStereoPanner();
    const gain = audioCtx.createGain();

    osc.frequency.value = pitch;
    osc.type = waveType; 

    panner.pan.value = Math.max(-1, Math.min(1, panValue));

    let boost = typeof CONTINUOUS_GAIN_BOOST !== 'undefined' ? CONTINUOUS_GAIN_BOOST : 1.0;
    gain.gain.setValueAtTime(0.0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3 * boost, audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);

    osc.connect(panner); panner.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.2);
};

window.playPannedThud = function(panValue, waveType = 'square', baseFreq = 100) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const panner = audioCtx.createStereoPanner();
    const gain = audioCtx.createGain();

    osc.frequency.value = baseFreq;
    osc.type = waveType;
    panner.pan.value = Math.max(-1, Math.min(1, panValue));

    let boost = typeof CONTINUOUS_GAIN_BOOST !== 'undefined' ? CONTINUOUS_GAIN_BOOST : 1.0;
    gain.gain.setValueAtTime(0.6 * boost, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);

    osc.connect(panner); panner.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.15);
};

window.playPannedTone = function(freq, type, duration, vol, panValue) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const panner = audioCtx.createStereoPanner();
    const gain = audioCtx.createGain();

    osc.frequency.value = freq;
    osc.type = type;
    panner.pan.value = Math.max(-1, Math.min(1, panValue));

    let boost = typeof CONTINUOUS_GAIN_BOOST !== 'undefined' ? CONTINUOUS_GAIN_BOOST : 1.0;
    let finalVol = Math.min(2.0, vol * 2.5 * boost); // Match engine scaling
    gain.gain.setValueAtTime(finalVol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc.connect(panner); panner.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + duration);
};

window.playPannedNoise = function(duration, vol, isBrown, panValue) {
    if (!audioCtx) return;
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate raw white noise
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1; 
    }
    
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    // v4.31.6 Native Biquad Filter to remove harsh clipping
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    // Muffle heavily for grass roll (Brown), keep it airy for flight wind
    filter.frequency.value = isBrown ? 350 : 1200; 

    const panner = audioCtx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, panValue));

    const gain = audioCtx.createGain();
    let boost = typeof CONTINUOUS_GAIN_BOOST !== 'undefined' ? CONTINUOUS_GAIN_BOOST : 1.0;
    // Lower the overall noise multiplier so it acts as a bed, not a spike
    let finalVol = Math.min(1.0, vol * boost); 
    
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(finalVol, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(finalVol, audioCtx.currentTime + Math.max(0.1, duration - 0.3));
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    // Chain: Noise -> Filter -> Panner -> Gain -> Speakers
    noise.connect(filter);
    filter.connect(panner); 
    panner.connect(gain); 
    gain.connect(audioCtx.destination);
    
    noise.start();
};

window.playPannedGreenRoll = function(rollTimeSecs, panValue) {
    if (!audioCtx || rollTimeSecs <= 0) return;
    let startTime = performance.now();
    let durationMs = rollTimeSecs * 1000;
    
    function rollLoop() {
        let elapsed = performance.now() - startTime;
        if (elapsed >= durationMs) return;

        let progress = elapsed / durationMs;
        // Simulate speed dropping from 5.0 (fast) down to 0.5 (slow)
        let simulatedSpeed = 5.0 * (1 - progress) + 0.5;
        
        if (typeof window.playRollingBlip === 'function') {
            window.playRollingBlip(simulatedSpeed, panValue);
        }

        // Delay scales inversely with speed (matches the putting engine)
        let delayMs = Math.max(100, 800 / Math.max(0.5, simulatedSpeed));
        
        if (typeof stateTimeouts !== 'undefined') {
            stateTimeouts.push(setTimeout(rollLoop, delayMs));
        } else {
            setTimeout(rollLoop, delayMs);
        }
    }
    rollLoop();
};

window.trigger3DFlight = function(hangTimeSecs, dynamicLoft, startPan, endPan, ballType) {
    let startTime = performance.now();
    let basePitch = 150;
    // Map loft directly to the apex frequency (e.g., 10 deg = ~400Hz, 50 deg = ~1150Hz)
    let maxPitch = 200 + (dynamicLoft * 19); 
    
    function flightLoop() {
        let elapsed = performance.now() - startTime;
        let progress = Math.min(1.0, elapsed / (hangTimeSecs * 1000));

        if (progress >= 1.0) {
            window.playPannedThud(endPan, ballType.landWave, ballType.landFreq);
            return;
        }

        let speedDelay = 30 + (Math.sin(progress * Math.PI) * 90); 
        if (progress > 0.8) speedDelay -= 20; 

        let heightPct = 1 - Math.pow((progress - 0.5) * 2, 2);
        let currentPitch = basePitch + (heightPct * (maxPitch - basePitch));
        
        let currentPan = startPan + (progress * (endPan - startPan));

        window.playFlightBlip(currentPitch, currentPan, speedDelay, ballType.flightWave);
        setTimeout(flightLoop, speedDelay);
    }
    flightLoop();
};
