// main_ag.js - Game State, Variables, and Swing Sequence (v4.7.1)

let swingState = 0; // 0: Idle, 1: Back, 2: Power, 3: Down, 4: Impact, 5: Flight
let devPower = false, devHinge = false, devImpact = false;
let stateTimeouts = [];

let backswingStartTime = 0, downswingStartTime = 0, impactStartTime = 0, powerStartTime = 0;
let hingeTimeBack = 0, hingeTimeDown = 0;
let finalPower = 0, dropDurationMs = 0;
let lockedImpactTime = 0;
let windX = 0, windY = 0, windLevelIndex = 3; 
let aimAngle = 0, stanceIndex = 2, stanceAlignment = 0, isChokedDown = false;
let hole = 1, par = 4, strokes = 0;
let ballX = 0, ballY = 0, pinX = 0, pinY = 420;
let targetX = 0, targetY = 0, currentZoneIndex = -1;
let currentLie = "Tee";
let isHoleComplete = false, gameMode = 'course';
let isPutting = false, puttState = 0, puttTargetDist = 0;
let viewingHazards = false, hazardIndex = 0;
let viewingHelp = false, helpIndex = 0;
let rangeLie = 'Fairway', confirmingRange = false;
let synthTreeActive = false;
let synthTreeX = 0;
let synthTreeDist = 0;
let synthTreeHeight = 0; // In feet
let shotStyleIndex = 0, chippingRange = 'short', confirmingGreen = false, confirmingPutting = false;
let caddyLevel = 3; // 1: Rookie, 2: Veteran, 3: Tour Pro
let currentClubIndex = 0;
let club = clubs[currentClubIndex]; // Pulls from data_ag.js
let lastShotReport = "No caddy report available yet.";
let holeTelemetry = [];

function loadHole(holeNumber) {
    const course = courses[currentCourseIndex];
    if (holeNumber > course.holes.length) holeNumber = 1; 
    const holeData = course.holes[holeNumber - 1];
    
    hole = holeData.number;
    par = holeData.par;
    pinX = holeData.pinX;
    pinY = holeData.pinY;
    
    ballX = 0; ballY = 0; strokes = 0; isHoleComplete = false;
    currentLie = "Tee";
    aimAngle = 0; stanceIndex = 2; stanceAlignment = 0;
    swingState = 0; // FIX: Added state reset
    holeTelemetry = [];
    window.updateTargetZone();
    viewingHazards = false;
    
    let defaultClub = holeData.par === 3 ? "7 Iron" : "Driver";
    currentClubIndex = clubs.findIndex(c => c.name === defaultClub);
    if (currentClubIndex === -1) currentClubIndex = 0;
    club = clubs[currentClubIndex];
    shotStyleIndex = 0;
    window.updateDashboard();
}

function getSightReport() {
    const currentHole = courses[currentCourseIndex].holes[hole - 1];
    if (!currentHole.trees) return "";
    
    let warnings = [];
    currentHole.trees.forEach(tree => {
        // Calculate angle to tree relative to ball position
        let targetAngleRad = Math.atan2(targetX - ballX, targetY - ballY);
        let treeAngleRad = Math.atan2(tree.x - ballX, tree.y - ballY);
        let relativeAngle = Math.abs((treeAngleRad - targetAngleRad) * (180 / Math.PI) - aimAngle);
        
        // If tree is within 15 degrees of our aim line and ahead of us
        if (relativeAngle < 15 && tree.y > ballY) {
            let dist = Math.round(Math.sqrt(Math.pow(tree.x - ballX, 2) + Math.pow(tree.y - ballY, 2)));
            warnings.push(`${tree.name} is in your line of sight, ${dist} yards ahead.`);
        }
    });
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
    // v4.4.0 Narrative Caddy
    if (isPutting) {
        let dist = calculateDistanceToPin();
        let activeContours = [];
        if (gameMode === 'course') {
            const holeData = courses[currentCourseIndex].holes[hole - 1];
            if (holeData.greenType && typeof greenDictionary !== 'undefined') {
                activeContours = greenDictionary[holeData.greenType] || [];
            }
        } else if (gameMode === 'putting') {
            activeContours = [
                { startY: 45, endY: 25, slopeX: 0.8, slopeY: 0.4 },
                { startY: 25, endY: 10, slopeX: -0.3, slopeY: 0.0 },
                { startY: 10, endY: 0, slopeX: 0.6, slopeY: -0.3 }
            ];
        }

        if (activeContours.length === 0) return "This green is perfectly flat. Aim dead center and hit it " + dist + " yards.";

        let relevantZones = activeContours.filter(z => z.endY < dist);
        if (relevantZones.length === 0) return "This putt looks straight and flat from here.";

        let netSlopeX = 0, netSlopeY = 0;
        relevantZones.forEach(z => { netSlopeX += z.slopeX; netSlopeY += z.slopeY; });

        let vertStr = netSlopeY > 0 ? "uphill" : netSlopeY < 0 ? "downhill" : "flat";
        let breakStr = netSlopeX > 0 ? "right-to-left" : netSlopeX < 0 ? "left-to-right" : "straight";

        if (caddyLevel === 1) {
            return `You have ${dist} yards left. Looks like it plays ${vertStr} and breaks ${breakStr}.`;
        } else if (caddyLevel === 2) {
            let advice = `It's a ${dist} yard putt. `;
            if (relevantZones.length > 1) advice += "It's a tricky multi-tier putt. ";
            advice += `Overall, it plays ${vertStr}, so adjust your target distance. It breaks ${breakStr}, so make sure to aim outside the cup.`;
            return advice;
        } else {
            // Level 3 God Mode Math (v4.7.1 Center-Seeker)
            let bestAim = 0, bestTarget = dist;
            let found = false, smallestMiss = 9999;

            // Generate angles radiating outward from 0 (0, 1, -1, 2, -2...) to find the center of the cup first
            let testAngles = [0];
            for (let i = 1; i <= 45; i++) { testAngles.push(i, -i); }
            
            // Brute force combinations to find the perfect line
            for (let t = Math.max(1, dist - 15); t <= dist + 30; t++) {
                for (let a of testAngles) {
                    let speedRemaining = t;
                    let currentHeading = a * (Math.PI / 180);
                    let simX = ballX, simY = ballY;
                    let distTraveled = 0;
                    let madeIt = false;
                    
                    while (speedRemaining > 0 && distTraveled < 100) {
                        let stepDist = Math.min(1.0, speedRemaining);
                        let currentDistToHole = Math.sqrt(Math.pow(pinX - simX, 2) + Math.pow(pinY - simY, 2));
                        
                        if (currentDistToHole <= 0.6 && speedRemaining <= 2.5) { madeIt = true; break; }
                        
                        let zone = activeContours.find(z => currentDistToHole <= z.startY && currentDistToHole > z.endY);
                        let sx = zone ? zone.slopeX : 0;
                        let sy = zone ? zone.slopeY : 0; 
                        
                        currentHeading -= (sx * 0.05);
                        simX += Math.sin(currentHeading) * stepDist;
                        simY += Math.cos(currentHeading) * stepDist;
                        distTraveled += stepDist;
                        speedRemaining -= (1.0 + (sy * 0.15));
                    }
                    
                    let missDist = Math.sqrt(Math.pow(pinX - simX, 2) + Math.pow(pinY - simY, 2));
                    if (madeIt) { bestAim = a; bestTarget = t; found = true; break; }
                    if (missDist < smallestMiss) { smallestMiss = missDist; bestAim = a; bestTarget = t; }
                }
                if (found) break;
            }

            let aimDir = bestAim < 0 ? "Left" : bestAim > 0 ? "Right" : "Center";
            let msg = `[God Mode Read]: ${dist} yards out. `;
            relevantZones.forEach(zone => {
                let segmentLength = Math.min(dist, zone.startY) - zone.endY;
                let zVert = zone.slopeY > 0 ? "uphill" : zone.slopeY < 0 ? "downhill" : "flat";
                let zBreak = zone.slopeX > 0 ? "Right-to-Left" : zone.slopeX < 0 ? "Left-to-Right" : "straight";
                msg += `For ${Math.round(segmentLength)}y, it's ${zVert} and breaks ${zBreak}. `;
            });
            msg += `To sink this at 100% power, set your target to ${bestTarget} yards and aim ${Math.abs(bestAim)}° ${aimDir}.`;
            return msg;
        }
    }

    if (gameMode === 'range' || (gameMode === 'chipping' && chippingRange === 'long')) {
        if (!synthTreeActive) return "The practice area is clear. Fire away.";
        
        let currentStyle = shotStyles[shotStyleIndex];
        let dynamicLoft = Math.max(0, club.loft + currentStyle.loftMod + ((2 - stanceIndex) * 5));
        
        // v3.81.1 Parabolic Math with True Carry Simulation
        let loftDistMod = 1 + ((26 - dynamicLoft) * 0.005);
        let chokeMod = isChokedDown ? 0.9 : 1.0;
        let expectedTotal = club.baseDistance * currentStyle.distMod * loftDistMod * chokeMod;

        // Approximate backspin for a 100% flushed shot to find expected roll
        let backspinRPM = Math.max(400, Math.round((club.loft * 150) + 1000 + 700 + ((stanceIndex - 2) * 500) + currentStyle.spinMod));
        let spinRollMod = Math.max(0.1, 1 - ((backspinRPM - 4000) / 10000));
        let expectedRoll = expectedTotal * club.rollPct * currentStyle.rollMod * spinRollMod;
        if (shotStyleIndex > 0 && shotStyleIndex < 5 && expectedRoll < (expectedTotal * 0.1)) expectedRoll = expectedTotal * 0.15 * spinRollMod;

        let expectedCarry = Math.max(1, expectedTotal - expectedRoll);
        let apexYards = (Math.tan(dynamicLoft * Math.PI / 180) / expectedCarry) * synthTreeDist * (expectedCarry - synthTreeDist);
        let expectedApexFeet = Math.max(0, Math.round(apexYards * 3));
        
        let latStr = synthTreeX === 0 ? 'Center' : `${Math.abs(synthTreeX)}y ${synthTreeX > 0 ? 'Right' : 'Left'}`;
        let msg = `Synth Tree is ${synthTreeDist} yards out, ${latStr}, and ${Math.round(synthTreeHeight)} feet tall. `;
        msg += `With a ${club.name} and ${stanceNames[stanceIndex]} stance, your expected apex at that distance is ${expectedApexFeet} feet. `;
        
        // Caddy Edge Finder Math
        let distToTreeCenter = Math.sqrt(Math.pow(synthTreeX, 2) + Math.pow(synthTreeDist, 2));
        let angleToCenter = Math.atan2(synthTreeX, synthTreeDist) * (180 / Math.PI);
        let angleOffset = Math.asin(10 / distToTreeCenter) * (180 / Math.PI);

        let leftEdge = Math.round(angleToCenter - angleOffset);
        let rightEdge = Math.round(angleToCenter + angleOffset);
        let leftStr = leftEdge < 0 ? `${Math.abs(leftEdge)}° Left` : `${leftEdge}° Right`;
        let rightStr = rightEdge < 0 ? `${Math.abs(rightEdge)}° Left` : `${rightEdge}° Right`;

        msg += `To bypass the canopy edges, aim past ${leftStr} or ${rightStr}. `;

        // v3.83.0 Predictive Shape Simulation
        let userAimRad = aimAngle * (Math.PI / 180);

        // 1. Calculate Expected Spin & Wind Drift
        let styleSideSpinMod = currentStyle.name === "Full" ? 1.0 : (currentStyle.distMod * 0.4);
        let expectedSideSpinRPM = stanceAlignment * 800 * styleSideSpinMod;
        let expectedPhysicsX = (expectedSideSpinRPM / 2400) * club.maxDispersion;

        let expectedHangTime = Math.min(6, Math.max(0.5, (expectedTotal / 60) + (dynamicLoft / 15)));
        let baseWindX = windX * (expectedHangTime / 2.5) * currentStyle.windMod;
        let gyroMod = Math.max(0.6, Math.min(1.3, 1 - ((backspinRPM - 4000) / 10000)));
        let spinWindInteraction = (windX * expectedSideSpinRPM) / 10000;
        let expectedWindXEffect = Math.round((baseWindX * gyroMod) + spinWindInteraction);

        let expectedLateralTotal = expectedPhysicsX + expectedWindXEffect;

        // 2. Project Lateral Position at the Tree's Distance
        let flightFraction = synthTreeDist / expectedCarry;
        let expectedLandX = Math.sin(userAimRad) * expectedCarry + Math.cos(userAimRad) * expectedLateralTotal;
        let expectedProjectedX = expectedLandX * flightFraction;
        let straightAimProjectedX = Math.sin(userAimRad) * synthTreeDist;

        // 3. Evaluate Clearance and generate Narrative
        let willHitVertically = expectedApexFeet < synthTreeHeight + 3;

        if (Math.abs(expectedProjectedX - synthTreeX) < 10) {
            // The ball WILL hit the canopy laterally based on the curve/wind
            if (willHitVertically) {
                if (Math.abs(straightAimProjectedX - synthTreeX) >= 10) {
                    let shapeName = expectedSideSpinRPM > 0 ? "slice" : expectedSideSpinRPM < 0 ? "hook" : "wind drift";
                    let alignName = stanceAlignment !== 0 ? alignmentNames[stanceAlignment + 2].toLowerCase() : "neutral";
                    msg += `Warning: Your aim clears the tree, but your ${alignName} alignment creates a ${shapeName} that curves right back into the branches!`;
                } else {
                    msg += "Warning: Your current line and shape will hit the tree. You do not have the height to clear it.";
                }
            } else {
                msg += "Your shot shape will carry you safely over the top of the tree.";
            }
        } else {
            // The ball WILL bypass the canopy laterally
            if (Math.abs(straightAimProjectedX - synthTreeX) < 10 && willHitVertically) {
                 let shapeName = expectedSideSpinRPM > 0 ? "slice" : expectedSideSpinRPM < 0 ? "hook" : "wind drift";
                 let alignName = stanceAlignment !== 0 ? alignmentNames[stanceAlignment + 2].toLowerCase() : "neutral";
                 msg += `Your initial line is blocked, but your ${alignName} alignment will ${shapeName} the ball beautifully around the edge.`;
            } else {
                msg += "Your current aim and shot shape will safely bypass the tree.";
            }
        }
        return msg;
    }
    
    if (gameMode !== 'course') return "Caddy advice is only available on the course.";
    const holeData = courses[currentCourseIndex].holes[hole - 1];
    if (!holeData.caddyNotes) return "I don't have any notes for this hole.";

    let distToPin = Math.round(Math.sqrt(Math.pow(pinX - ballX, 2) + Math.pow(pinY - ballY, 2)));
    let currentTrigger = 'Approach_Long'; 

    if (strokes === 0) currentTrigger = 'Tee';
    else if (distToPin <= 50) currentTrigger = 'Greenside';
    else if (currentLie === 'Sand') currentTrigger = 'Bunker_Fairway';
    else if (ballX < -20) currentTrigger = 'Trouble_Left';
    else if (ballX > 20) currentTrigger = 'Trouble_Right';
    else if (currentLie === 'Light Rough') currentTrigger = 'Rough_Deep';
    else if (currentLie === 'Fairway' && distToPin <= 120) currentTrigger = 'Approach_Scoring';
    else if (currentLie === 'Fairway' && distToPin > 120) currentTrigger = 'Approach_Long';

    let availableNotes = holeData.caddyNotes.filter(n => n.trigger === currentTrigger && n.level <= caddyLevel);
    if (availableNotes.length === 0) {
        availableNotes = holeData.caddyNotes.filter(n => (n.trigger === 'Approach' || n.trigger === 'Always') && n.level <= caddyLevel);
        if (availableNotes.length === 0) return "Just hit a good golf shot here. I don't have specific advice.";
    }

    availableNotes.sort((a, b) => b.level - a.level);
    return `[Level ${caddyLevel} Caddy]: ${availableNotes[0].text}`;
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
    document.getElementById('dash-setup').innerText = `Aim: ${aimStr}\n${stanceNames[stanceIndex]}`;
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

    // Short percussive pop
    let boost = typeof CONTINUOUS_GAIN_BOOST !== 'undefined' ? CONTINUOUS_GAIN_BOOST : 1.0;
    gain.gain.setValueAtTime(0.3 * boost, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

    osc.connect(panner); panner.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.1);
};

window.initGame = function() {
    window.initAudio();
    generateWind();
    loadHole(1);
    document.getElementById('initBtn').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';
    document.getElementById('hud-top').style.display = 'block';
    document.getElementById('dashboard-panel').style.display = 'grid';
    window.updateDashboard();
    document.getElementById('swing-meter').style.display = 'block';
    requestAnimationFrame(window.drawMeter);
    document.getElementById('game-container').focus();
    let setupReport = getSetupReport();
    if (gameMode === 'course') setupReport += getSightReport();
    let targetDist = calculateDistanceToPin();
    window.announce(`Hole ${hole}. Par ${par}. ${targetDist} yards. Ready. ${setupReport} Use Page Up or Down to change clubs.`);
    document.getElementById('visual-output').innerText = `Hole ${hole}. Par ${par}. ${targetDist} yards. Ready. ${setupReport}`;
};

function startBackswing() {
    if (swingState !== 0) return;
    window.initAudio();
    swingState = 1; hingeTimeBack = 0; hingeTimeDown = 0;
    backswingStartTime = performance.now();
    document.getElementById('visual-output').innerText = `Backswing...`;
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
    powerGain.gain.setValueAtTime(Math.min(1, 0.4 * CONTINUOUS_GAIN_BOOST), audioCtx.currentTime);
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
    if (powerOscillator) { powerOscillator.stop(); }
    downswingStartTime = performance.now();
    document.getElementById('visual-output').innerText = `Downswing...`;
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
    gain.gain.setValueAtTime(Math.min(1, 0.4 * CONTINUOUS_GAIN_BOOST), audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + (dropDurationMs / 1000));
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + (dropDurationMs / 1000) + 0.1);

    [75, 50, 25].forEach(m => { if (finalPower > m) stateTimeouts.push(setTimeout(() => triggerMilestone(m), (finalPower - m) * 15)); });
    stateTimeouts.push(setTimeout(() => { if (swingState === 4) calculateShot(true); }, dropDurationMs + 400));
}

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

