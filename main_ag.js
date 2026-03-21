// main_ag.js - Game State, Variables, and Swing Sequence (v4.41.0)

let swingState = 0; // 0: Idle, 1: Back, 2: Power, 3: Down, 4: Impact, 5: Flight
let isPracticeSwing = false;
let devPower = false, devHinge = false, devImpact = false;
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

// Contextual Auto-Focus Logic
window.autoSetFocus = function(silent = false) {
    if (typeof isPutting !== 'undefined' && isPutting) { focusIndex = 2; return; }

    let oldIndex = focusIndex;
    let dist = typeof calculateDistanceToPin === 'function' ? calculateDistanceToPin() : 0;

    if (currentLie === "Tee" && club.name === "Driver") focusIndex = 1; // Power
    else if (club.name === "Putter" || club.name === "9 Iron" || club.name.includes("Wedge")) focusIndex = 2; // Touch
    else if (dist <= 150 && club.name !== "Driver" && club.name !== "3 Wood") focusIndex = 4; // Accuracy
    else if (currentLie === "Sand" || currentLie.includes("Rough")) focusIndex = 5; // Recovery
    else focusIndex = 0; // Standard

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
let holeTelemetry = [];

function loadHole(holeNumber) {
    // v4.19.4 Critical State Clearing (Kill all ghost timers)
    stateTimeouts.forEach(clearTimeout);
    stateTimeouts = [];
    if (typeof powerOscillator !== 'undefined' && powerOscillator) {
        try { powerOscillator.stop(); } catch (e) {}
    }

    window.initAudio(); // Ensure context is alive
    // v4.18.2 Audio Priming (Sound 37: Bouncing Confirm)
    if (typeof window.playEcho === 'function') {
        window.playEcho('sine', 600, 800, 0.2, 0.3, 0.2);
    }

    const course = courses[currentCourseIndex];
    if (holeNumber > course.holes.length) holeNumber = 1; 
    const holeData = course.holes[holeNumber - 1];

    // v4.19.2 Dynamic Landing Zone Fallback (Par 3 Safety)
    if (!holeData.landingZones || holeData.landingZones.length === 0) {
        holeData.landingZones = [
            { name: "Green Approach", x: holeData.pinX, y: holeData.pinY - 15 }
        ];
    }
    
    hole = holeData.number;
    par = holeData.par;
    pinX = holeData.pinX;
    pinY = holeData.pinY;
    
    ballX = 0; ballY = 0; strokes = 0; isHoleComplete = false;
    puttsThisHole = 0;
    // v4.30.1 Add approachStart and approachProx to the tracker
    currentHoleStats = { fir: holeData.par > 3 ? false : null, gir: false, driveDistance: null, approachStart: null, approachProx: null, puttDistance: null };
    currentLie = "Tee";
    aimAngle = 0; stanceIndex = 2; stanceAlignment = 0;
    swingState = 0; // FIX: Added state reset

    // v4.10.1 Explicitly wipe short-game states for the new hole
    isPutting = false;
    puttState = 0;
    isChokedDown = false;

    // v4.14.1 Reset targeting modes so they don't bleed into the next hole
    activeTargetType = 'pin';
    gridX = 0; gridY = 0;
    targetZoneIndex = 0;
    isGridNavigating = false; // v4.16.1 Grid Warp Safety Lock

    holeTelemetry = [];
    window.updateTargetZone();
    viewingHazards = false;
    
    let defaultClub = holeData.par === 3 ? "7 Iron" : "Driver";
    currentClubIndex = clubs.findIndex(c => c.name === defaultClub);
    if (currentClubIndex === -1) currentClubIndex = 0;
    club = clubs[currentClubIndex];
    shotStyleIndex = 0;
    window.autoSetFocus(true);
    window.updateDashboard();

    // v4.29.0 Ambient Wind on Tee
    if (windLevelIndex >= 2 && typeof window.playGolfSound === 'function') {
        window.playGolfSound('env_02');
    }
    if (typeof window.saveGame === 'function') window.saveGame(); // Save when starting new hole
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
                let dist = Math.round(Math.sqrt(Math.pow(h.offset - ballX, 2) + Math.pow(h.distance - ballY, 2)));
                warnings.push(`${h.type} is in your line of sight, ${dist} yards ahead.`);
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

window.getCaddyAdvice = function() {
    if (gameMode !== 'course') return "Oracle mode is available on the course only.";

    if (typeof isPutting !== 'undefined' && isPutting) {
        let distToPin = Math.round(calculateDistanceToPin());
        const holeData = courses[currentCourseIndex].holes[hole - 1];
        let activeContours = [];
        if (holeData.greenType && typeof greenDictionary !== 'undefined') {
            activeContours = greenDictionary[holeData.greenType] || [];
        }

        if (caddyLevel === 1) return `[Rookie]: ${distToPin} yards to the cup. It's on the green.`;
        if (caddyLevel === 2) return `[Veteran]: ${distToPin} yards out. Read the slopes carefully.`;

        // v4.25.0 Brute-Force Oracle Simulation
        let bestAim = 0;
        let bestPace = distToPin;
        let minMiss = 9999;
        let baseHeading = Math.atan2(pinX - ballX, pinY - ballY);

        for (let testPace = distToPin; testPace <= distToPin + 30; testPace++) {
            for (let testAim = -45; testAim <= 45; testAim++) {
                let simX = ballX, simY = ballY;
                let speedRemaining = testPace;
                let currentHeading = baseHeading + (testAim * (Math.PI / 180));
                let distTraveled = 0;
                let madeIt = false;

                while (speedRemaining > 0 && distTraveled < 100) {
                    let stepDist = Math.min(1.0, speedRemaining);
                    let currentDistToHole = Math.sqrt(Math.pow(pinX - simX, 2) + Math.pow(pinY - simY, 2));

                    if (currentDistToHole <= 0.8) {
                        if (speedRemaining <= 6.0) { madeIt = true; break; }
                    }

                    let zone = activeContours.find(z => currentDistToHole <= z.startY && currentDistToHole > z.endY);
                    let sx = zone ? zone.slopeX : 0, sy = zone ? zone.slopeY : 0;

                    currentHeading -= (sx * 0.05);
                    simX += Math.sin(currentHeading) * stepDist;
                    simY += Math.cos(currentHeading) * stepDist;
                    distTraveled += stepDist;
                    speedRemaining -= (1.0 + (sy * 0.15));
                }

                let missDist = Math.sqrt(Math.pow(pinX - simX, 2) + Math.pow(pinY - simY, 2));
                if (madeIt) missDist = 0;

                if (missDist < minMiss) {
                    minMiss = missDist;
                    bestAim = testAim;
                    bestPace = testPace;
                }
                if (madeIt) break;
            }
            if (minMiss === 0) break;
        }

        // v4.29.0 Oracle Chime
        if (typeof window.playGolfSound === 'function') window.playGolfSound('caddy_02');

        let aimStr = bestAim === 0 ? "Dead Center" : `${Math.abs(bestAim)} degrees ${bestAim < 0 ? 'Left' : 'Right'}`;
        return `[Oracle Putting]: ${distToPin} yards. To sink it, aim ${aimStr} and hit it with ${bestPace} yards of pace.`;
    }

    // --- v4.14.1 Fairway Oracle Below ---
    const holeData = courses[currentCourseIndex].holes[hole - 1];
    let targetPoint = { x: pinX, y: pinY, label: "Pin" };

    if (activeTargetType === 'grid') {
        targetPoint = { x: pinX + gridX, y: pinY + gridY, label: "Grid Target" };
    } else if (activeTargetType === 'zone') {
        const landingZones = holeData.landingZones || [];
        if (landingZones.length === 0) return "No landing zones are configured on this hole.";
        if (targetZoneIndex < 0 || targetZoneIndex >= landingZones.length) targetZoneIndex = 0;
        const z = landingZones[targetZoneIndex];
        targetPoint = { x: z.x, y: z.y, label: z.name };
    }

    const dx = targetPoint.x - ballX;
    const dy = targetPoint.y - ballY;
    const baseHeading = Math.atan2(dx, dy);
    const targetDist = Math.round(Math.sqrt((dx * dx) + (dy * dy)));

    const style = shotStyles[0]; 
    let lieMultiplier = currentLie === 'Sand' ? 0.70 : (currentLie === 'Light Rough' || currentLie === 'Rough') ? 0.90 : 1.0;

    const simulatedClubs = [];
    for (let i = 0; i < 14; i++) simulatedClubs.push(clubs[i % clubs.length]);

    let best = null;

    simulatedClubs.forEach(simClub => {
        if (simClub.name === "Putter") return; 
        
        for (let simStance = 0; simStance < 5; simStance++) {
            let dynamicLoft = Math.max(0, simClub.loft + style.loftMod + ((2 - simStance) * 5));
            let loftDistMod = 1 + ((26 - dynamicLoft) * 0.005);
            let totalDist = simClub.baseDistance * style.distMod * loftDistMod * lieMultiplier;
            
            let backspinRPM = Math.max(400, Math.round((simClub.loft * 150) + 1000 + ((simStance - 2) * 500) + style.spinMod));
            let spinRollMod = Math.max(0.1, 1 - ((backspinRPM - 4000) / 10000));
            let rollDist = totalDist * simClub.rollPct * style.rollMod * spinRollMod;
            let carryDist = Math.max(1, totalDist - rollDist);

            let hangTime = Math.min(6, Math.max(0.5, (totalDist / 60) + (dynamicLoft / 15)));
            let windForward = windY * (hangTime / 2.5) * style.windMod;
            let windCross = windX * (hangTime / 2.5) * style.windMod;

            let desiredHeading = Math.atan2((targetPoint.x - ballX) - windCross, (targetPoint.y - ballY) - windForward);
            let aimDeg = Math.round((desiredHeading - baseHeading) * (180 / Math.PI));
            aimDeg = Math.max(-45, Math.min(45, aimDeg)); 

            let heading = baseHeading + (aimDeg * Math.PI / 180);
            let effectiveCarry = carryDist + windForward;

            let landX = Math.sin(heading) * effectiveCarry + Math.cos(heading) * windCross;
            let landY = Math.cos(heading) * effectiveCarry - Math.sin(heading) * windCross;
            let finalX = ballX + landX + (Math.sin(heading) * rollDist * 0.8);
            let finalY = ballY + landY + (Math.cos(heading) * rollDist * 0.8);

            let miss = Math.sqrt(Math.pow(targetPoint.x - finalX, 2) + Math.pow(targetPoint.y - finalY, 2));
            if (!best || miss < best.miss || (miss === best.miss && Math.abs(aimDeg) < Math.abs(best.aimDeg))) {
                best = {
                    clubName: simClub.name,
                    stanceName: stanceNames[simStance],
                    aimDeg,
                    miss
                };
            }
        }
    });

    if (!best) return "Oracle unavailable. Unable to compute tactical targeting right now.";

    const aimStr = best.aimDeg === 0 ? "Center" : `${Math.abs(best.aimDeg)} degrees ${best.aimDeg < 0 ? 'Left' : 'Right'}`;
    
    // v4.29.0 Oracle Chime
    if (typeof window.playGolfSound === 'function') window.playGolfSound('caddy_02');
    
    // v4.16.0 Concise Fairway Oracle
    return `[Oracle]: To hit ${targetPoint.label} (${targetDist}y), equip ${best.clubName}, ${best.stanceName} stance, aim ${aimStr}.`;
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
    let holeStr = gameMode === 'course' ? `Hole ${hole} (Par ${par})\n${calculateDistanceToPin()}y to Pin` :
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
    document.getElementById('dash-setup').innerText = `Aim: ${aimStr}\n${stanceNames[stanceIndex]}\n[${focusName} Focus]`;
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
        roundData, puttsThisHole, currentHoleStats, roundHighlights
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
    stateTimeouts.push(setTimeout(() => { if (swingState === 2) { triggerMilestone(120); startDownswing(); } }, 2533));
}

function startDownswing() {
    if (swingState !== 2) { swingState = 0; return; }
    swingState = 3; stateTimeouts.forEach(clearTimeout);
    let elapsed = performance.now() - powerStartTime;
    finalPower = Math.min(120, Math.round(25 + ((elapsed / 2000) * 75)));
    
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
