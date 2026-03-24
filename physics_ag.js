// physics_ag.js - Math, Wind, and Shot Calculation (v4.51.0)

const SHOT_RECOVERY_TIMEOUT_MS = 20000;

window.setCaddyPanelText = function(msg) {
    const panel = document.getElementById('caddy-panel');
    if (!panel) return;

    panel.style.display = 'block';
    let textEl = document.getElementById('caddy-panel-text');

    // Self-heal if a previous write replaced the panel subtree.
    if (!textEl) {
        const heading = document.createElement('h3');
        heading.innerText = 'Post-Shot Caddy Report';
        textEl = document.createElement('p');
        textEl.id = 'caddy-panel-text';
        panel.innerHTML = '';
        panel.appendChild(heading);
        panel.appendChild(textEl);
    }

    textEl.innerText = msg;
};

window.initPutting = function() {
    isPutting = true; swingState = 0; puttState = 0;
    currentClubIndex = clubs.findIndex(c => c.name === "Putter");
    if (currentClubIndex !== -1) club = clubs[currentClubIndex];
    let rawDist = calculateDistanceToPin();
    let dist = Math.max(1/3, Math.round(rawDist));
    puttTargetDist = dist; aimAngle = 0;
    
    let locationStr = gameMode === 'putting' ? "Welcome to the Practice Putting Green." : "On the green!";
    // v4.19.2 Updated Unified Control Instructions
    let msg = `${locationStr} ${dist} yards to the cup. Targeting Mode active. Use arrows to adjust aim and distance, then press Enter to lock.`;
    window.announce(msg);
    document.getElementById('visual-output').innerText = msg;
    window.updateDashboard();
    if (typeof window.saveGame === 'function') window.saveGame();
};

function calculateDistanceToPin() {
    return Math.round(Math.sqrt(Math.pow(pinX - ballX, 2) + Math.pow(pinY - ballY, 2)));
}

function calculateDistanceToTarget() {
    return Math.round(Math.sqrt(Math.pow(targetX - ballX, 2) + Math.pow(targetY - ballY, 2)));
}

function generateWind() {
    const level = windLevels[windLevelIndex];
    let magX = Math.floor(Math.random() * (level.max - level.min + 1)) + level.min;
    let magY = Math.floor(Math.random() * (level.max - level.min + 1)) + level.min;
    windX = Math.random() < 0.5 ? magX : -magX;
    windY = Math.random() < 0.5 ? magY : -magY;
}

function driftWind() {
    const level = windLevels[windLevelIndex];
    let driftX = Math.floor(Math.random() * (level.variance * 2 + 1)) - level.variance;
    let driftY = Math.floor(Math.random() * (level.variance * 2 + 1)) - level.variance;
    windX += driftX; windY += driftY;
    if (windX > level.max) windX = level.max;
    if (windX < -level.max) windX = -level.max;
    if (windY > level.max) windY = level.max;
    if (windY < -level.max) windY = -level.max;
    window.updateDashboard();
}

function getWindReport() {
    if (windX === 0 && windY === 0) return 'Wind is calm.';
    const verticalWind = windY === 0 ? 'Calm' : `${Math.abs(windY)} mph ${windY > 0 ? 'Tailwind' : 'Headwind'}`;
    const horizontalWind = windX === 0 ? '0 mph Center' : `${Math.abs(windX)} mph ${windX > 0 ? 'Right' : 'Left'}`;
    return `Wind is ${verticalWind}, pushing ${horizontalWind}.`;
}

function getAimReport() {
    if (aimAngle === 0) return 'Aiming straight down the fairway.';
    return `Aiming ${Math.abs(aimAngle)} degrees ${aimAngle < 0 ? 'Left' : 'Right'}.`;
}

function getStanceReport() {
    return "Stance: Ball " + stanceNames[stanceIndex] + ", " + alignmentNames[stanceAlignment + 2] + " Alignment.";
}

function getSetupReport() {
    const style = shotStyles[shotStyleIndex];
    const chokeMod = typeof isChokedDown !== 'undefined' && isChokedDown ? 0.9 : 1.0;

    // v3.81.1 Calculate active loft penalty for bag check accuracy
    let dynamicLoft = Math.max(0, club.loft + style.loftMod + ((2 - stanceIndex) * 5));
    let loftDistMod = 1 + ((26 - dynamicLoft) * 0.005);

    const baseTotal = club.baseDistance * style.distMod * chokeMod * loftDistMod;
    let gripReport = typeof isChokedDown !== 'undefined' && isChokedDown ? "Choked down. " : "";

    let focusName = typeof focusModes !== 'undefined' ? focusModes[focusIndex].name : "";
    if (gameMode === 'course' && currentLie === 'Sand') {
        const minTotal = Math.round(baseTotal * 0.60);
        const maxTotal = Math.round(baseTotal * 0.80);
        return `${club.name}. ${gripReport}100% power hits ${minTotal} to ${maxTotal} yards. In the sand. Style: ${style.name}. Focus: ${focusName}.`;
    } else if ((gameMode === 'course' && currentLie === 'Light Rough') || (gameMode === 'range' && rangeLie === 'Rough')) {
        const minTotal = Math.round(baseTotal * 0.85);
        const maxTotal = Math.round(baseTotal * 0.95);
        return `${club.name}. ${gripReport}100% power hits ${minTotal} to ${maxTotal} yards. In the rough. Style: ${style.name}. Focus: ${focusName}.`;
    } else {
        return `${club.name}. ${gripReport}100% power hits ${Math.round(baseTotal)} yards. Style: ${style.name}. Focus: ${focusName}.`;
    }
}

function calculateZoneAccuracy(offsetMs, pressure) {
    const absOffset = Math.abs(offsetMs);
    const buffer = 60 / (1 + (pressure * 0.5));
    if (absOffset <= buffer) return 100;
    if (absOffset <= 150) return 95 - ((absOffset - buffer) / 100 * 15);
    if (absOffset <= 400) return 80 - ((absOffset - 150) / 250 * 60);
    return 10;
}

function calculateShot(autoMiss = false) {
    swingState = 5; 

    // v4.39.0 Automatic Diagnostic Memory (Capture before ball moves)
    let autoGreenRead = "N/A";
    let autoOracle = "N/A";

    if (isPutting || currentLie === "Green") {
        // 1. Silently capture the Oracle prediction
        if (typeof window.getCaddyAdvice === 'function') {
            autoOracle = window.getCaddyAdvice().replace("[Oracle Putting]: ", "").trim();
        }

        // 2. Silently run the Green Reading algorithm
        let distToPin = calculateDistanceToPin();
        const holeData = courses[currentCourseIndex].holes[hole - 1];
        let netElevYards = 0; let netBreakYards = 0;

        if (holeData && holeData.greenType && typeof greenDictionary !== 'undefined') {
            let activeContours = greenDictionary[holeData.greenType] || [];
            activeContours.forEach(z => {
                if (distToPin >= z.endY) {
                    let start = Math.min(distToPin, z.startY);
                    let distInZone = start - z.endY;
                    netElevYards += (z.slopeY * distInZone * 2.0);
                    netBreakYards += (z.slopeX * distInZone * 1.5);
                }
            });
        } else if (gameMode === 'putting') {
            // Default practice green contours for diagnostics
            let activeContours = [
                { startY: 45, endY: 25, slopeX: 0.8, slopeY: 0.4 },
                { startY: 25, endY: 10, slopeX: -0.3, slopeY: 0.0 },
                { startY: 10, endY: 0, slopeX: 0.6, slopeY: -0.3 }
            ];
            activeContours.forEach(z => {
                if (distToPin >= z.endY) {
                    let start = Math.min(distToPin, z.startY);
                    let distInZone = start - z.endY;
                    netElevYards += (z.slopeY * distInZone * 2.0);
                    netBreakYards += (z.slopeX * distInZone * 1.5);
                }
            });
        }

        let elevInches = Math.round(netElevYards * 4);
        let breakInches = Math.round(netBreakYards * 6);
        let elevStr = elevInches === 0 ? "Flat" : `${Math.abs(elevInches)}in ${elevInches > 0 ? "Uphill" : "Downhill"}`;
        let breakStr = breakInches === 0 ? "Straight" : `${Math.abs(breakInches)}in ${breakInches > 0 ? "Right" : "Left"}`;
        autoGreenRead = `${elevStr}, Breaks ${breakStr}`;
    }

    if (isPutting) {
        stateTimeouts.forEach(clearTimeout);
        strokes++;
        puttsThisHole++;
        // v4.47.0 Bot Interceptor (Putting)
        let isBotTurn = typeof players !== 'undefined' && players.length > 0 && players[currentPlayerIndex].isBot;
        if (devPower && !isBotTurn) finalPower = 100; 
        let impactDiff = isBotTurn ? players[currentPlayerIndex].botImpact : (devImpact ? 0 : Math.round((performance.now() - impactStartTime) - dropDurationMs));
        let hingeDiff = isBotTurn ? players[currentPlayerIndex].botHinge : (devHinge ? 0 : Math.round(hingeTimeDown - hingeTimeBack));
        if (isBotTurn) finalPower = players[currentPlayerIndex].botPower;
        
        // Touch Mechanic (Spacebar Hinge becomes Tempo)
        let accuracyScore = Math.max(10, 100 - (Math.abs(impactDiff) / 2.5));

        // v4.36.1 Linear Touch Magnetism (Putting)
        let startDistToPin = Math.sqrt(Math.pow(ballX - pinX, 2) + Math.pow(ballY - pinY, 2));
        let slopeDampener = (startDistToPin <= 3.0) ? 0.1 : (startDistToPin <= 6.0) ? 0.35 : 1.0;

        // v4.42.0 Difficulty Scaling & Risk/Reward Focus (Putting)
        let diffScale = typeof difficultyLevels !== 'undefined' ? difficultyLevels[difficultyIndex] : { impactMod: 1.0, hingeMod: 1.0, reflexBuffer: 105, dispersionMod: 1.0 };
        let absHinge = Math.abs(hingeDiff);
        let focusEffect = 0;
        let p50 = 50 * diffScale.hingeMod;
        let p150 = 150 * diffScale.hingeMod;
        let p250 = 250 * diffScale.hingeMod;

        if (focusIndex !== 0) { // Standard Focus has no effects
            if (absHinge <= p50) focusEffect = 1.0;
            else if (absHinge <= p150) focusEffect = 1.0 - ((absHinge - p50) / (p150 - p50));
            else if (absHinge <= p250) focusEffect = -((absHinge - p150) / (p250 - p150));
            else focusEffect = -1.0;
        }

        let tempoBonus = 1.0;
        if (focusIndex === 2) { // Touch Focus
            tempoBonus = Math.max(0.5, 1.0 + (1.5 * focusEffect)); // Max 2.5x, Min 0.5x
        }

        let baseHoleRadius = 0.15;
        let activeHoleRadius = ((startDistToPin <= 2.0) ? (baseHoleRadius * 3.0) : baseHoleRadius) * tempoBonus;
        
        let powerOvercharge = finalPower > 100 ? finalPower - 100 : 0;

        let distToPin = calculateDistanceToPin();
        let displayTargetYds = Number.isInteger(puttTargetDist) ? puttTargetDist : puttTargetDist.toFixed(1);
        // v4.45.1 Telemetry Ownership (Putting)
        let pName = typeof players !== 'undefined' && players.length > 0 ? players[currentPlayerIndex].name : "Player";
        let baseBroadcast = `[${pName}] Putt: ${finalPower}% Power. Target was ${displayTargetYds}y.`;
        let broadcast = "";

        // v4.4.0 Gravity Engine (Step Simulation)
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

        // v4.7.2 Find the actual angle to the pin!
        let baseHeading = Math.atan2(pinX - ballX, pinY - ballY);
        let puttStartX = ballX;
        let puttStartY = ballY;

        let distTraveled = 0;
        let simX = ballX, simY = ballY;
        let speedRemaining = puttTargetDist * (finalPower / 100);
        // v4.7.2 Apply the aim angle relative to the pin
        let currentHeading = baseHeading + (aimAngle * (Math.PI / 180));
        
        let madeIt = false, lipOut = false;
        let captureRadius = activeHoleRadius;
        let captureSpeedLimit = (distToPin <= 2 && accuracyScore > 90) ? 6.0 : 2.5 * tempoBonus;
        
        // v4.6.0 Record the Physics Steps
        let playbackArray = [];

        while (speedRemaining > 0 && distTraveled < 100) {
            let stepDist = Math.min(1.0, speedRemaining);
            let currentDistToHole = Math.sqrt(Math.pow(pinX - simX, 2) + Math.pow(pinY - simY, 2));
            
            if (currentDistToHole <= captureRadius) {
                if (speedRemaining <= captureSpeedLimit) { 
                    madeIt = true; 
                    playbackArray.push({ x: simX, y: simY, speed: speedRemaining, madeIt: true }); 
                    break; 
                } else { lipOut = true; }
            }
            
            playbackArray.push({ x: simX, y: simY, speed: speedRemaining, madeIt: false });
            
            let zone = activeContours.find(z => currentDistToHole <= z.startY && currentDistToHole > z.endY);
            let sx = (zone ? zone.slopeX : 0) * slopeDampener, sy = (zone ? zone.slopeY : 0) * slopeDampener;
            
            currentHeading -= (sx * 0.05); 
            simX += Math.sin(currentHeading) * stepDist;
            simY += Math.cos(currentHeading) * stepDist;
            distTraveled += stepDist;
            speedRemaining -= (1.0 + (sy * 0.15));
        }

        ballX = simX; ballY = simY; // Lock final position immediately

        // v4.6.0 Real-Time Playback Engine
        document.getElementById('visual-output').innerText = "Ball is rolling...";
        let stepIndex = 0;

        function playNextPuttStep() {
            if (stepIndex >= playbackArray.length) { finishPutt(); return; }

            let step = playbackArray[stepIndex];
            
            // v4.40.0 Perspective Audio Panning (Line of Sight Math)
            let dx = step.x - puttStartX;
            let dy = step.y - puttStartY;
            let distFromStart = Math.sqrt(dx * dx + dy * dy);
            let angleFromStart = Math.atan2(dx, dy);
            let devAngle = angleFromStart - baseHeading;

            // Calculate lateral distance left/right of the center aim line
            let lateralDist = Math.sin(devAngle) * distFromStart;
            let panValue = lateralDist / 2.0; // 2 yards of break = 100% hard pan into one ear
            if (window.playRollingBlip) window.playRollingBlip(step.speed, panValue);

            // v4.6.1 Dynamic Metronome: High speed = 100ms delay. Low speed stretches up to 1600ms.
            let delayMs = Math.max(100, 800 / Math.max(0.5, step.speed));

            if (step.madeIt) {
                stateTimeouts.push(setTimeout(finishPutt, delayMs + 100));
            } else {
                stepIndex++;
                stateTimeouts.push(setTimeout(playNextPuttStep, delayMs));
            }
        }

        function finishPutt() {
            let resultMsg = "";
            let formattedDist = window.formatProximity(puttTargetDist);
            if (madeIt) {
                // v4.28.0 Cup Sink Audio
                if (typeof window.playGolfSound === 'function') window.playGolfSound('score_02');
                else { playTone(440, 'sine', 0.2, 0.4); setTimeout(() => playTone(659, 'sine', 0.4, 0.4), 200); }

                resultMsg = `You sank a putt from ${formattedDist} away! IT'S IN THE HOLE!`;
                broadcast = `${baseBroadcast} ${resultMsg}`;
                isHoleComplete = true;

                if (gameMode === 'course') {
                    // v4.30.1 Broadcast Hole Journaling
                    let term = window.getScoreTerm(par, strokes);
                    let nonPutts = strokes - puttsThisHole;

                    // Calculate Running Score
                    let currentTotalStrokes = strokes;
                    let currentTotalPar = par;
                    roundData.forEach(r => { currentTotalStrokes += r.strokes; currentTotalPar += r.par; });
                    let rel = currentTotalStrokes - currentTotalPar;
                    let relStr = rel === 0 ? "Even Par" : rel > 0 ? `+${rel}` : `${Math.abs(rel)} under par`;

                    let narrative = "";
                    if (strokes === 1) {
                        narrative = `You aced Hole ${hole} for a Hole in One! You are now ${relStr}.`;
                    } else {
                        let shotStory = "";
                        if (currentHoleStats.driveDistance && par > 3) {
                            shotStory += `You hit a ${currentHoleStats.driveDistance} yard drive`;
                        }

                        if (currentHoleStats.approachStart) {
                            let proxStr = window.formatProximity(currentHoleStats.approachProx);
                            let verb = currentHoleStats.approachStart > 50 ? "hit your approach" : "chipped";
                            if (shotStory !== "") shotStory += ` and then `;
                            else shotStory += `You `;
                            shotStory += `${verb} from ${currentHoleStats.approachStart} yards to within ${proxStr} of the pin.`;
                        } else if (nonPutts > 0) {
                            if (shotStory !== "") shotStory += `. You reached the green in ${nonPutts} strokes.`;
                            else shotStory += `You reached the green in ${nonPutts} strokes.`;
                        }

                        let formattedDist = window.formatProximity(puttTargetDist);
                        let puttStory = "";
                        if (puttsThisHole === 1) {
                            puttStory = `You sank a ${formattedDist} putt for ${term}`;
                        } else {
                            puttStory = `You ${puttsThisHole}-putted for ${term}`;
                        }

                        narrative = `${shotStory.trim()} ${puttStory} and are ${relStr} at this point.`;
                    }

                    // v4.30.0 Highlight Tagging (Putts)
                    roundHighlights.putts.push({ hole: hole, dist: puttTargetDist });
                    roundHighlights.putts.sort((a, b) => b.dist - a.dist);
                    if (roundHighlights.putts.length > 2) roundHighlights.putts.pop();

                    roundData.push({
                        hole: hole, par: par, distance: courses[currentCourseIndex].holes[hole - 1].distance,
                        strokes: strokes, putts: puttsThisHole, fir: currentHoleStats.fir, gir: currentHoleStats.gir,
                        driveDistance: currentHoleStats.driveDistance, puttDistance: puttTargetDist,
                        approachStart: currentHoleStats.approachStart, approachProx: currentHoleStats.approachProx, // v4.30.1 Save to array
                        narrative: narrative
                    });
                }
            } else {
                let missX = (ballX - pinX) * 36; // Convert to inches
                let missY = (ballY - pinY) * 36; 
                let latStr = Math.abs(missX) < 1 ? "dead center" : `${Math.abs(Math.round(missX))} inches ${missX < 0 ? 'left' : 'right'}`;
                let vertStr = missY < 0 ? `${Math.abs(Math.round(missY))} inches short of` : `${Math.abs(Math.round(missY))} inches past`;
                
                if (lipOut) {
                    if (typeof window.playGolfSound === 'function') window.playGolfSound('putt_06');
                    else playTone(150, 'square', 0.1, 0.5);
                    resultMsg = `Lipped out a ${formattedDist} putt! Missed ${latStr} and ran ${vertStr} the cup.`;
                } else {
                    resultMsg = `Missed a ${formattedDist} putt. Missed ${latStr} and finished ${vertStr} the cup.`;
                }
                broadcast = `${baseBroadcast} ${resultMsg} ${calculateDistanceToPin()} yards left.`;
            }

            // v4.39.0 Advanced Putting Telemetry (with Auto-Diagnostics)
            let isShortTarget = puttTargetDist <= 5.0;
            let targUnit = isShortTarget ? "ft" : "yds";
            let targDistDisp = isShortTarget ? Math.round(puttTargetDist * 3) : Math.round(puttTargetDist);
            let aimDisp = aimAngle === 0 ? "Straight" : `${Math.abs(aimAngle)}° ${aimAngle < 0 ? 'Left' : 'Right'}`;

            let advancedTelemetry = `\n\n[Putting Diagnostics]\nTarget Cursor: ${targDistDisp} ${targUnit}, Aim: ${aimDisp}\nAuto-Read: ${autoGreenRead}\nOracle Says: ${autoOracle}\nExecution: Power ${finalPower}%, Impact ${impactDiff}ms, Touch (Hinge) ${hingeDiff}ms\nTouch Magnetism: ${tempoBonus.toFixed(2)}x Multiplier\nEffective Hole Radius: ${(activeHoleRadius * 36).toFixed(1)} inches (Base: ${(baseHoleRadius * 36).toFixed(1)}in)\nSlope Dampener: ${(slopeDampener * 100).toFixed(0)}% applied (100% = Full Break)\nAccuracy Score: ${Math.round(accuracyScore)}/100`;

            // v4.43.0 Putting Timing Report
            let hingeWord = hingeDiff < 0 ? 'early' : hingeDiff > 0 ? 'late' : 'perfect';
            let impactWord = impactDiff < 0 ? 'early' : impactDiff > 0 ? 'late' : 'perfect';
            lastTimingReport = `[${pName}] Putting Diagnostics. Power ${finalPower} percent. Touch tempo ${Math.abs(hingeDiff)}ms ${hingeWord}. Impact ${Math.abs(impactDiff)}ms ${impactWord}.`;

            lastShotReport = broadcast + advancedTelemetry;
            holeTelemetry.push(lastShotReport);
            window.announce(broadcast);
            document.getElementById('visual-output').innerText = broadcast;
            
            stateTimeouts.push(setTimeout(() => {
                if (gameMode === 'putting') {
                    ballX = 0; ballY = 0; isHoleComplete = false;
                    swingState = 0; strokes = 0; puttState = 0; aimAngle = 0;
                    puttTargetDist = Math.round(calculateDistanceToPin());
                    window.announce(`${broadcast} Resetting ball to ${puttTargetDist} yards. Targeting Mode active. Press T for a new target.`);
                    window.updateDashboard();
                } else if (gameMode === 'course') {
                    window.advanceTurn();
                }
                if (typeof window.saveGame === 'function') window.saveGame();
            }, 3000));
        }

        // v4.8.0 Putter Strike Sound
        if (typeof window.playTone === 'function') window.playTone(800, 'triangle', 0.05, 0.8);

        playNextPuttStep(); // Trigger the suspense
        return; // EXIT SHOT CALCULATION
    }

    stateTimeouts.forEach(clearTimeout);
    strokes++;

    // v4.19.6 Hard failsafe: never allow flight state to deadlock input.
    stateTimeouts.push(setTimeout(() => {
        if (swingState !== 5) return;
        swingState = 0;
        isPutting = false;
        if (typeof puttState !== 'undefined') puttState = 0;
        const recoverMsg = "Shot recovery triggered. Input restored.";
        window.announce(recoverMsg);
        document.getElementById('visual-output').innerText = recoverMsg;
        window.updateDashboard();
    }, SHOT_RECOVERY_TIMEOUT_MS));

    lockedImpactTime = performance.now() - impactStartTime;
    if (autoMiss) {
        // v4.27.0 Whiff Audio
        if (typeof window.playGolfSound === 'function') {
            window.playGolfSound('swing_10');
        } else {
            playTone(150, 'sawtooth', 0.5, 0.4); // Fallback
        }
        let missDist = calculateDistanceToPin();
        lastShotReport = `Whiffed. Stroke ${strokes}. ${missDist} yards to the pin.`;
        window.announce("Whiffed!");
        setTimeout(() => { swingState = 0; }, 1000);
        return;
    }

    // v4.47.0 Bot Interceptor (Fairway)
    let isBotTurn = typeof players !== 'undefined' && players.length > 0 && players[currentPlayerIndex].isBot;
    if (devPower && !isBotTurn) finalPower = 100;
    if (devHinge && !isBotTurn) { hingeTimeBack = 1000; hingeTimeDown = 1000; }
    let impactDiff = isBotTurn ? players[currentPlayerIndex].botImpact : (devImpact ? 0 : Math.round((performance.now() - impactStartTime) - dropDurationMs));
    let hingeDiff = isBotTurn ? players[currentPlayerIndex].botHinge : (devHinge ? 0 : Math.round(hingeTimeDown - hingeTimeBack));
    if (isBotTurn) finalPower = players[currentPlayerIndex].botPower;

    // v4.42.0 Difficulty Scaling (Fairway)
    let diffScale = typeof difficultyLevels !== 'undefined' ? difficultyLevels[difficultyIndex] : { impactMod: 1.0, hingeMod: 1.0, reflexBuffer: 105, dispersionMod: 1.0 };

    let powerOvercharge = finalPower > diffScale.reflexBuffer ? finalPower - diffScale.reflexBuffer : 0;
    let pressureDispersion = 1 + (powerOvercharge * 0.04); 
    const hingeAcc = Math.max(10, 100 - (Math.abs(hingeDiff) / ((typeof isChokedDown !== 'undefined' && isChokedDown ? 4.8 : 4) * diffScale.hingeMod)));
    
    const activeFairwayWidth = gameMode === 'course' ? courses[currentCourseIndex].holes[hole - 1].fairwayWidth : fairwayWidth;
    const isStartingInRough = gameMode === 'range' ? (rangeLie === 'Rough') : (currentLie === 'Light Rough' || currentLie === 'Sand');
    
    let lieMod = 1.0, lieDispersionMod = 1.0, lieForgivenessMod = 1.0;

    if (isStartingInRough) {
        if (currentLie === 'Sand') {
            lieMod = 0.6 + (Math.random() * 0.2); // 60% to 80%
            lieDispersionMod = 2.0;
            lieForgivenessMod = 0.7;
        } else { // Light Rough or Range Rough
            lieMod = 0.85 + (Math.random() * 0.1); // 85% to 95%
            lieDispersionMod = 1.5; 
            lieForgivenessMod = 0.8; 
        }
    }

    // v4.42.0 Risk/Reward Focus Scaling (Fairway)
    let absHinge = Math.abs(hingeDiff);
    let focusEffect = 0;
    let p50 = 50 * diffScale.hingeMod;
    let p150 = 150 * diffScale.hingeMod;
    let p250 = 250 * diffScale.hingeMod;

    if (focusIndex !== 0) {
        if (absHinge <= p50) focusEffect = 1.0;
        else if (absHinge <= p150) focusEffect = 1.0 - ((absHinge - p50) / (p150 - p50));
        else if (absHinge <= p250) focusEffect = -((absHinge - p150) / (p250 - p150));
        else focusEffect = -1.0;
    }

    // Recovery Focus (Index 5)
    if (focusIndex === 5 && isStartingInRough) {
        lieMod = lieMod + ((1.0 - lieMod) * 0.5 * focusEffect);
        lieDispersionMod = lieDispersionMod - ((lieDispersionMod - 1.0) * 0.5 * focusEffect);
        lieForgivenessMod = lieForgivenessMod + ((1.0 - lieForgivenessMod) * 0.5 * focusEffect);
    }

    let forgiveness = finalPower <= 100 ? 1 + ((100 - finalPower) * 0.01) : Math.max(0.6, 1 - (powerOvercharge * 0.015));
    forgiveness *= lieForgivenessMod * (typeof isChokedDown !== 'undefined' && isChokedDown ? 1.2 : 1.0);
    forgiveness *= diffScale.impactMod; // v4.42.0 Difficulty Expansion

    // Accuracy Focus (Index 4)
    if (focusIndex === 4) forgiveness *= (1.0 + (0.5 * focusEffect));

    let absImpact = Math.abs(impactDiff);
    let adjustedImpact = absImpact / forgiveness;
    let spinPenalty = 0.5 + (adjustedImpact / 50); 
    if (adjustedImpact > 160) spinPenalty = 5 + ((adjustedImpact - 160) / 20);

    let tempSideSpin = Math.abs(Math.round((impactDiff / 20) * 100 * spinPenalty * pressureDispersion));
    let dampening = Math.max(0.25, 1 - (tempSideSpin / 20000)); 
    let impactAcc = Math.max(10, 100 - (adjustedImpact / 2.5));

    const currentStyle = shotStyles[shotStyleIndex];
    const accuracyScore = Math.round((impactAcc + hingeAcc) / 2);
    
    // v4.27.0 Dynamic Strike Audio
    if (typeof window.playGolfSound === 'function') {
        let strikeSound = 'flight_01'; // Default: Flushed (Clean Strike)
        
        if (accuracyScore < 95) {
            // If timing is off, determine if it was Early (Thin) or Late (Fat)
            if (impactDiff < 0) {
                strikeSound = 'flight_02'; // Thin, sharp click
            } else {
                strikeSound = 'flight_03'; // Fat, muffled thud
            }
        }
        
        // Override for Bunker/Sand shots
        if (currentLie === 'Sand') {
            strikeSound = 'hazard_03'; // Sand splash impact
        }
        
        window.playGolfSound(strikeSound);
    }

    let dynamicLoft = Math.max(0, club.loft + currentStyle.loftMod + ((2 - stanceIndex) * 5));
    
    let styleSideSpinMod = currentStyle.name === "Full" ? 1.0 : (currentStyle.distMod * 0.4);

    let backspinRPM = Math.max(400, Math.round((club.loft * 150) + (finalPower * 10) + (impactAcc * 7) + ((stanceIndex - 2) * 500) + currentStyle.spinMod));
    // Spin Focus (Index 3)
    if (focusIndex === 3) backspinRPM += (2500 * focusEffect);
    let sideSpinRPM = Math.round((impactDiff / 20) * 100 * spinPenalty * pressureDispersion * styleSideSpinMod * diffScale.dispersionMod) + (stanceAlignment * 800 * styleSideSpinMod);
    sideSpinRPM = Math.max(-4500, Math.min(4500, sideSpinRPM));
    
    // v4.43.1 Dynamic Timing Diagnostics (Delta Math Restored)
    let baselineBackspin = Math.max(400, Math.round((club.loft * 150) + 1000 + 700 + ((stanceIndex - 2) * 500) + currentStyle.spinMod));
    let spinDelta = backspinRPM - baselineBackspin;
    let deltaStr = spinDelta === 0 ? "matching baseline" : spinDelta > 0 ? `which is ${spinDelta} above baseline` : `which is ${Math.abs(spinDelta)} below baseline`;

    let hingeWord = hingeDiff < 0 ? 'early' : hingeDiff > 0 ? 'late' : 'perfect';
    let impactWord = impactDiff < 0 ? 'early' : impactDiff > 0 ? 'late' : 'perfect';
    let sideSpinShape = sideSpinRPM === 0 ? "Straight" : sideSpinRPM > 0 ? "Slice" : "Hook";
    
    // v4.45.1 Telemetry Ownership (Fairway)
    let pName = typeof players !== 'undefined' && players.length > 0 ? players[currentPlayerIndex].name : "Player";
    let advice = typeof window.getCaddyAdvice === 'function' ? window.getCaddyAdvice() : 'No advice available.';
    lastTimingReport = `[${pName}] Timing Check. Power ${finalPower} percent. Hinge ${Math.abs(hingeDiff)}ms ${hingeWord}. Impact ${Math.abs(impactDiff)}ms ${impactWord}. Side Spin: ${Math.abs(sideSpinRPM)} RPM ${sideSpinShape}. Backspin: ${backspinRPM} RPM, ${deltaStr}.\n[Oracle Says: ${advice}]`;

    let chokeMod = typeof isChokedDown !== 'undefined' && isChokedDown ? 0.9 : 1.0;
    let loftDistMod = 1 + ((26 - dynamicLoft) * 0.005);

    // Power Focus (Index 1)
    let powerFocusMod = 1.0 + (focusIndex === 1 ? (0.10 * focusEffect) : 0);

    let potentialDist = club.baseDistance * (finalPower / 100) * (1 + (hingeTimeBack / 2000 * 0.15)) * currentStyle.distMod * lieMod * loftDistMod * chokeMod * powerFocusMod;
    let totalDistance = Math.round(potentialDist * dampening * Math.max(0.2, 1 - Math.pow(Math.abs(hingeDiff) / 400, 2)));

    let activeRollMod = currentStyle.rollMod;
    if (focusIndex === 3) activeRollMod *= (1.0 - (0.5 * focusEffect)); // Positive halves roll, Negative adds 50% roll
    if (shotStyleIndex > 0 && isStartingInRough) {
        if (impactDiff < -25) { 
            backspinRPM = Math.round(backspinRPM * 0.4);
            totalDistance = Math.round(totalDistance * 0.85);
        } else if (impactDiff > 25) { 
            dynamicLoft = Math.max(5, dynamicLoft - 15);
            backspinRPM = Math.round(backspinRPM * 0.2);
            activeRollMod *= 2.5; 
        }
    }

    let hangTimeSecs = Math.min(6, Math.max(0.5, (totalDistance / 60) + (dynamicLoft / 15)));
    let baseWindY = windY * (hangTimeSecs / 2.5) * currentStyle.windMod;
    let baseWindX = windX * (hangTimeSecs / 2.5) * currentStyle.windMod;
    let gyroMod = Math.max(0.6, Math.min(1.3, 1 - ((backspinRPM - 4000) / 10000)));
    let spinWindInteraction = (windX * sideSpinRPM) / 10000; 

    let windYEffect = Math.round(baseWindY * gyroMod);
    let windXEffect = Math.round((baseWindX * gyroMod) + spinWindInteraction);

    const targetAngleRad = Math.atan2(targetX - ballX, targetY - ballY); 
    const userAimRad = aimAngle * (Math.PI / 180); 
    const finalRad = targetAngleRad + userAimRad; 

    // v4.41.0 Natural Dispersion Circle (Base Scatter)
    const isPutt = club.name === "Putter";
    let scatterMult = 1.0;
    if (focusIndex === 4) scatterMult = Math.max(0.0, 1.0 - (0.5 * focusEffect)); // Accuracy Focus cuts scatter

    // Apply +/- 1.5% distance scatter
    let distScatterMod = 1.0 + (((Math.random() * 0.03) - 0.015) * scatterMult);
    if (!isPutt) totalDistance = Math.round(totalDistance * distScatterMod);

    // Apply +/- 5% of maxDispersion lateral scatter
    let naturalLatScatter = isPutt ? 0 : ((Math.random() * 0.1) - 0.05) * club.maxDispersion * scatterMult;

    const physicsX = isPutt ? 0 : ((sideSpinRPM / 2400) * (club.maxDispersion * (typeof lieDispersionMod !== 'undefined' ? lieDispersionMod : 1) * pressureDispersion)) + naturalLatScatter;
    const lateralTotal = physicsX + windXEffect;

    const moveY = Math.cos(finalRad) * totalDistance - Math.sin(finalRad) * lateralTotal;
    const moveX = Math.sin(finalRad) * totalDistance + Math.cos(finalRad) * lateralTotal;

    ballY += moveY;
    ballX += moveX;

    let lateralKick = Math.round((sideSpinRPM / 350) * activeRollMod);
    ballY -= Math.sin(finalRad) * lateralKick;
    ballX += Math.cos(finalRad) * lateralKick;

    // Backspin affects rollout: every 1000 RPM above 4000 reduces roll by 10%
    let spinRollMod = Math.max(0.1, 1 - ((backspinRPM - 4000) / 10000));
    let rollDistance = Math.round(totalDistance * club.rollPct * activeRollMod * spinRollMod);
    
    // If it's a chip/pitch style, ensure roll is at least 10% of total unless it's a flop
    if (shotStyleIndex > 0 && shotStyleIndex < 5 && rollDistance < (totalDistance * 0.1)) {
        rollDistance = Math.round(totalDistance * 0.15 * spinRollMod);
    }
    let carryDistance = Math.max(0, totalDistance - rollDistance);
    let lateralX = Math.round((physicsX + windXEffect + lateralKick) * 10) / 10;

    const startX = ballX - moveX;
    const startY = ballY - moveY;
    const landX = startX + (Math.sin(finalRad) * carryDistance + Math.cos(finalRad) * (physicsX + windXEffect));
    const landY = startY + (Math.cos(finalRad) * carryDistance - Math.sin(finalRad) * (physicsX + windXEffect));

    const contactLabel = hingeDiff < -60 ? "Thin" : hingeDiff > 60 ? "Fat" : "Flushed";
    const loftDiff = dynamicLoft - club.loft;
    const trajectoryLabel = loftDiff < -8 ? "piercing" : loftDiff < -3 ? "low" : loftDiff > 8 ? "towering" : loftDiff > 3 ? "high" : "standard";
    const shapeLabel = sideSpinRPM < -2500 ? "snap hook" : sideSpinRPM < -1000 ? "hook" : sideSpinRPM < -250 ? "draw" : sideSpinRPM > 2500 ? "banana slice" : sideSpinRPM > 1000 ? "slice" : sideSpinRPM > 250 ? "fade" : "straight shot";
    const shotShapeNarrative = `A ${trajectoryLabel} ${shapeLabel}`;

    const currentHole = courses[currentCourseIndex].holes[hole - 1];
    let treeCollisionReport = "";
    let flightPathNarrative = "";
    
    // 1. Synth Tree Collision (Holo Range / Pitching Green)
    if ((gameMode === 'range' || gameMode === 'chipping') && synthTreeActive) {
        let treeRadius = 10;
        if (carryDistance > synthTreeDist) {
            let flightFraction = synthTreeDist / carryDistance;
            let timeToTreeMs = hangTimeSecs * 1000 * flightFraction; // v4.22.1 Acoustic Timing
            let projectedX = startX + (landX - startX) * flightFraction;
            let lateralDistFromCenter = Math.abs(projectedX - synthTreeX);
            
            if (lateralDistFromCenter < treeRadius) {
                let ballHeightYards = (Math.tan(dynamicLoft * Math.PI / 180) / carryDistance) * synthTreeDist * (carryDistance - synthTreeDist);
                let ballHeightFeet = Math.max(0, ballHeightYards * 3);
                let verticalMargin = Math.round(ballHeightFeet - synthTreeHeight);
                
                if (ballHeightFeet < synthTreeHeight) {
                    stateTimeouts.push(setTimeout(() => {
                        playTone(1200, 'square', 0.1, 0.5);
                        window.announce(`THWACK! You hit the Synth Tree!`);
                    }, timeToTreeMs));
                    
                    totalDistance = Math.round(synthTreeDist); rollDistance = 2; carryDistance = totalDistance - rollDistance;
                    ballY = startY + (landY - startY) * flightFraction; ballX = startX + (landX - startX) * flightFraction;
                    flightPathNarrative = `${shotShapeNarrative} that crashed into the Synth Tree canopy, ${Math.abs(verticalMargin)} feet too low.`;
                    treeCollisionReport = `[Synth Tree: ${Math.round(synthTreeHeight)}ft. Apex: ${Math.round(ballHeightFeet)}ft. Result: THWACK]`;
                } else {
                    stateTimeouts.push(setTimeout(() => { window.announce(`Sailed over the Synth Tree!`); }, timeToTreeMs));
                    flightPathNarrative = `${shotShapeNarrative} that sailed safely over the Synth Tree, clearing the top branches by ${verticalMargin} feet.`;
                    treeCollisionReport = `[Synth Tree: ${Math.round(synthTreeHeight)}ft. Apex: ${Math.round(ballHeightFeet)}ft. Margin: +${verticalMargin}ft. Result: CLEARED]`;
                }
            } else if (lateralDistFromCenter < treeRadius + 15) {
                let lateralMargin = Math.round(lateralDistFromCenter - treeRadius);
                let passSide = projectedX > synthTreeX ? "right" : "left";
                stateTimeouts.push(setTimeout(() => { window.announce(`Curved past the Synth Tree!`); }, timeToTreeMs));
                flightPathNarrative = `${shotShapeNarrative} that shaved the ${passSide} edge of the Synth Tree canopy by just ${lateralMargin} yards.`;
                treeCollisionReport = `[Synth Tree bypassed laterally by ${lateralMargin} yards on the ${passSide}.]`;
            }
        }
    }

    // 2. Natural Tree Collision (Course)
    if (currentHole && currentHole.trees && gameMode === 'course') {
        currentHole.trees.forEach(tree => {
            let distToTreeCenter = Math.sqrt(Math.pow(tree.x - startX, 2) + Math.pow(tree.y - startY, 2));
            if (carryDistance > distToTreeCenter && tree.y > startY) {
                let flightFraction = distToTreeCenter / carryDistance;
                let timeToTreeMs = hangTimeSecs * 1000 * flightFraction; // v4.22.1 Acoustic Timing
                let projectedX = startX + (landX - startX) * flightFraction;
                let projectedY = startY + (landY - startY) * flightFraction;
                let actualDistToTree = Math.sqrt(Math.pow(tree.x - projectedX, 2) + Math.pow(tree.y - projectedY, 2));

                if (actualDistToTree < tree.radius) {
                    let ballHeightAtTree = Math.max(0, (Math.tan(dynamicLoft * Math.PI / 180) / carryDistance) * distToTreeCenter * (carryDistance - distToTreeCenter));
                    let verticalMarginYards = Math.round(ballHeightAtTree - tree.height);
                    
                    if (ballHeightAtTree < tree.height) {
                        let gamble = Math.random();
                        let kickDir = tree.x > 0 ? -1 : 1;

                        if (gamble < 0.33) {
                            stateTimeouts.push(setTimeout(() => {
                                playNoise(0.5, 0.4, false);
                                window.announce(`Rustled through the leaves of the ${tree.name}!`);
                            }, timeToTreeMs));

                            totalDistance = Math.round(totalDistance * 0.5);
                            carryDistance = Math.round(carryDistance * 0.5);
                            rollDistance = Math.max(0, totalDistance - carryDistance);
                            let lateralTotal = (physicsX + windXEffect) * 3;

                            let newMoveY = Math.cos(finalRad) * totalDistance - Math.sin(finalRad) * lateralTotal;
                            let newMoveX = Math.sin(finalRad) * totalDistance + Math.cos(finalRad) * lateralTotal;
                            ballY = startY + newMoveY;
                            ballX = startX + newMoveX;

                            flightPathNarrative = `${shotShapeNarrative} that punched narrowly through the canopy, drastically losing speed and scattering offline.`;
                            treeCollisionReport = `[${tree.name} Check: Apex ${Math.round(ballHeightAtTree)}y. Result: NARROW MISS (33%). Disp x3, Dist x0.5]`;
                        }
                        else if (gamble < 0.66) {
                            stateTimeouts.push(setTimeout(() => {
                                playTone(800, 'triangle', 0.1, 0.6);
                                window.announce(`Crack! A glancing blow off a branch of the ${tree.name}!`);
                            }, timeToTreeMs));

                            let bounceDist = 18 + (Math.random() * 5);
                            ballY = startY + (Math.cos(finalRad) * distToTreeCenter);
                            ballX = startX + (Math.sin(finalRad) * distToTreeCenter) + (kickDir * bounceDist);

                            totalDistance = Math.round(distToTreeCenter + bounceDist);
                            rollDistance = Math.round(bounceDist); carryDistance = Math.round(distToTreeCenter);

                            flightPathNarrative = `${shotShapeNarrative} that clipped a thick branch and violently deflected sideways.`;
                            treeCollisionReport = `[${tree.name} Check: Apex ${Math.round(ballHeightAtTree)}y. Result: GLANCING BLOW (33%). Kick ${Math.round(bounceDist)}y]`;
                        }
                        else {
                            stateTimeouts.push(setTimeout(() => {
                                playTone(200, 'square', 0.1, 0.8);
                                window.announce(`THWACK! Dead center into the trunk of the ${tree.name}!`);
                            }, timeToTreeMs));

                            let bounceDist = 8 + (Math.random() * 5);
                            ballY = startY + (Math.cos(finalRad) * distToTreeCenter);
                            ballX = startX + (Math.sin(finalRad) * distToTreeCenter) + (kickDir * bounceDist);

                            totalDistance = Math.round(distToTreeCenter + bounceDist);
                            rollDistance = Math.round(bounceDist); carryDistance = Math.round(distToTreeCenter);

                            flightPathNarrative = `${shotShapeNarrative} that crashed straight into the trunk and dropped.`;
                            treeCollisionReport = `[${tree.name} Check: Apex ${Math.round(ballHeightAtTree)}y. Result: SOLID STRIKE (33%). Kick ${Math.round(bounceDist)}y]`;
                        }
                    } else {
                        stateTimeouts.push(setTimeout(() => { window.announce(`Sailed right over the ${tree.name}!`); }, timeToTreeMs));
                        flightPathNarrative = `${shotShapeNarrative} that sailed safely over the ${tree.name}, clearing the top by ${verticalMarginYards} yards.`;
                        treeCollisionReport = `[${tree.name} Check: ${tree.height}y tall. Apex: ${Math.round(ballHeightAtTree)}y. Margin: +${verticalMarginYards}y. Result: CLEARED]`;
                    }
                } else if (actualDistToTree < tree.radius + 15) {
                    let lateralMargin = Math.round(actualDistToTree - tree.radius);
                    let passSide = projectedX > tree.x ? "right" : "left";
                    flightPathNarrative = `${shotShapeNarrative} that wrapped past the ${tree.name}, shaving the ${passSide} edge by ${lateralMargin} yards.`;
                    treeCollisionReport = `[${tree.name} bypassed laterally by ${lateralMargin} yards.]`;
                }
            }
        });
    }

    let distanceToPin = calculateDistanceToPin();
    const holeData = courses[currentCourseIndex].holes[hole - 1];
    
    // Dynamic Approach & Apron
    let currentFW = activeFairwayWidth;
    if (holeData.approachWidth && distanceToPin <= 50 && distanceToPin > (holeData.apronRadius || 0)) {
        currentFW = holeData.approachWidth;
    } else if (holeData.apronRadius && distanceToPin <= holeData.apronRadius) {
        currentFW = 30; // Apron width
    }

    let inWater = false;
    let rollStopTriggered = false;
    if (gameMode === 'range' || gameMode === 'chipping') {
        currentLie = rangeTargetLie;
        if (currentLie === 'Water') inWater = true;
    } else {
        currentLie = Math.abs(ballX) > (currentFW / 2) ? "Light Rough" : "Fairway";
        if (holeData.hazards && gameMode === 'course') {
            const startY = ballY - moveY;
            const carryY = startY + (moveY * (carryDistance / totalDistance));
            const carryX = (ballX - moveX) + (moveX * (carryDistance / totalDistance));

            holeData.hazards.forEach(h => {
                const hLeft = h.offset - (h.width / 2);
                const hRight = h.offset + (h.width / 2);
                const hStart = h.distance;
                const hEnd = h.distance + h.depth;

                // Check if the ball CARRY landed in hazard
                if (carryY >= hStart && carryY <= hEnd && carryX >= hLeft && carryX <= hRight) {
                    if (h.type === "Bunker") currentLie = "Sand";
                    if (h.type === "Water") inWater = true;
                } else if (carryY >= hStart && carryY <= hEnd) {
                    // v4.23.1 Hazard Narrow Miss
                    let marginL = Math.abs(carryX - hLeft);
                    let marginR = Math.abs(carryX - hRight);
                    if (carryX < hLeft && marginL <= 15) flightPathNarrative += ` Shaved the left edge of the ${h.type} by ${Math.round(marginL)} yards.`;
                    else if (carryX > hRight && marginR <= 15) flightPathNarrative += ` Shaved the right edge of the ${h.type} by ${Math.round(marginR)} yards.`;
                }
                // Check if the ball ROLL entered a hazard
                else if (!inWater && ballY >= hStart && ballY <= hEnd && ballX >= hLeft && ballX <= hRight) {
                    if (h.type === "Bunker") {
                        currentLie = "Sand";
                        rollStopTriggered = true;
                        
                        // v4.29.0 Sand Enter Audio
                        if (typeof window.playGolfSound === 'function') window.playGolfSound('hazard_03');
                        
                        // Stop the ball just inside the bunker edge
                        const entryBuffer = 2; 
                        ballY = hStart + entryBuffer;
                        rollDistance = Math.max(0, Math.round(ballY - carryY));
                        totalDistance = carryDistance + rollDistance;
                    }
                    if (h.type === "Water") inWater = true;
                }
            });
        }
    }

    const greenSize = holeData.greenRadius || 20;
    if (inWater) {
        currentLie = "Water Penalty";
        strokes++; 
        ballY = Math.max(0, ballY - 20); 
        ballX = 0; 
    } else if (gameMode === 'course' && distanceToPin <= greenSize) {
        currentLie = "Green";
    }

    // v4.36.1 Linear Touch Magnetism (Approach/Hole-Out Logic)
    let isHoleOut = false;
    if ((gameMode === 'course' || gameMode === 'chipping') && currentLie === "Green" && club.name !== "Putter") {
        const finalRelY = ballY - pinY;
        const finalRelX = ballX - pinX;
        const finalDistToPin = Math.sqrt(Math.pow(finalRelX, 2) + Math.pow(finalRelY, 2));

        let touchBonus = 1.0;
        if (focusIndex === 2) {
            touchBonus = Math.max(0.5, 1.0 + (2.0 * focusEffect)); // Max 3.0x, Min 0.5x
        }

        let captureRadius = 0.15 * touchBonus;

        if (finalDistToPin <= captureRadius) {
            isHoleOut = true;
            isHoleComplete = true;
            ballX = pinX;
            ballY = pinY;
            currentLie = "Hole";
        }
    }

    // v4.10.0 Stat Tracking & v4.30.0 Highlight Tagging
    if (gameMode === 'course') {
        if (strokes === 1 && par > 3 && currentLie === "Fairway") {
            currentHoleStats.fir = true;
            roundHighlights.drives.push({ hole: hole, dist: Math.round(totalDistance) });
            roundHighlights.drives.sort((a, b) => b.dist - a.dist);
            if (roundHighlights.drives.length > 2) roundHighlights.drives.pop();
        }
        if (strokes === 1 && par > 3) currentHoleStats.driveDistance = Math.round(totalDistance);
        if (currentLie === "Green" && strokes <= par - 2) currentHoleStats.gir = true;

        if (currentLie === "Green" && club.name !== "Putter" && distanceToPin > 20) {
            const finalRelY = ballY - pinY;
            const finalRelX = ballX - pinX;
            const finalDistToPin = Math.sqrt(Math.pow(finalRelX, 2) + Math.pow(finalRelY, 2));

            // v4.30.1 Track Approach Stats
            currentHoleStats.approachStart = Math.round(distanceToPin);
            currentHoleStats.approachProx = finalDistToPin;

            roundHighlights.approaches.push({ hole: hole, prox: finalDistToPin, start: Math.round(distanceToPin) });
            roundHighlights.approaches.sort((a, b) => a.prox - b.prox);
            if (roundHighlights.approaches.length > 2) roundHighlights.approaches.pop();
        }
    }

    document.getElementById('visual-output').innerText = "Ball is in the air...";
    playNoise(hangTimeSecs + 0.3, 0.3, false);

    // v4.31.3 Live 3D Audio Flight Injection
    // Calculate final lateral drift (35 yards offline = 100% hard pan into one ear)
    let endPan = Math.max(-1, Math.min(1, lateralTotal / 35)); 
    if (typeof window.trigger3DFlight === 'function') {
        window.trigger3DFlight(hangTimeSecs, dynamicLoft, 0.0, endPan, ballTypes[activeBallIndex]);
    }

    // v4.19.4 Track flight timeout
    stateTimeouts.push(setTimeout(() => {
        try {
        const loftPenalty = dynamicLoft >= 50 ? 2 : dynamicLoft >= 38 ? 1 : 0;
        const baseBounceCount = rollDistance <= 0 ? 1 : Math.min(6, 1 + Math.floor(rollDistance / 7));
        const bounceCount = Math.max(1, baseBounceCount - loftPenalty);
        const bounceDurationMs = 0.12 * 1000;
        const bounceOffsets = [];
        // v4.31.3 Stretched Max Bounce Gap to 600ms
        let bounceGapMs = Math.min(600, 250 + (rollDistance * 4));
        let bounceElapsedMs = 0, bounceSequenceMs = 0;

        for (let bounceIndex = 0; bounceIndex < bounceCount; bounceIndex++) {
            bounceOffsets.push(bounceElapsedMs);
            bounceSequenceMs = bounceElapsedMs + bounceDurationMs;
            bounceElapsedMs += bounceGapMs;
            bounceGapMs = Math.max(90, Math.round(bounceGapMs * 0.85));
        }

        // v4.32.0 Theatrical Roll & Dramatic Pause (Reduced to 1000ms)
        let isWater = currentLie.toLowerCase().includes("water");
        let rollTimeSecs = Math.max(0, Math.abs(rollDistance) / 10);
        let caddyDelayMs = 500;

        if (currentLie === "Green" && !isWater) {
            rollTimeSecs = Math.max(3.0, Math.min(6.0, Math.abs(rollDistance) / 3));
            caddyDelayMs = 1000;
        }

        if (isWater) {
            rollTimeSecs = 0; // Kills the roll timer for water shots
            bounceSequenceMs = 400; // Gives the splash exactly 400ms to play before Caddy talks
            
            // v4.29.0 Heavy Splash Audio
            if (typeof window.playGolfSound === 'function') window.playGolfSound('hazard_05');
            else if (typeof window.playSplash === 'function') window.playSplash(0.5);
        } else {
            // Only bounce and roll if NOT in water
            bounceOffsets.forEach((bounceOffsetMs, bounceIndex) => {
                stateTimeouts.push(setTimeout(() => {
                    const bounceVolume = Math.max(0.12, 1.0 * Math.pow(0.8, bounceIndex));
                    if (typeof window.playPannedTone === 'function') {
                        window.playPannedTone(180, 'sine', 0.12, bounceVolume, endPan);
                    } else {
                        playTone(180, 'sine', 0.12, bounceVolume);
                    }
                }, bounceOffsetMs));
            });

            if (rollTimeSecs > 0 && currentLie !== "Sand") {
                stateTimeouts.push(setTimeout(() => {
                    // v4.31.7 Only play roll audio if on the green
                    if (currentLie === "Green") {
                        document.getElementById('visual-output').innerText = "Ball is rolling smoothly on the green...";
                        if (typeof window.playPannedGreenRoll === 'function') {
                            window.playPannedGreenRoll(rollTimeSecs, endPan);
                        }
                    } else {
                        document.getElementById('visual-output').innerText = "Ball has settled.";
                        // Fairway/Rough procedural grass noise has been removed for a cleaner acoustic finish
                    }
                }, bounceSequenceMs));
            }
        }

        const shotDesc = flightPathNarrative ? `${contactLabel}. ${flightPathNarrative}.` : `${contactLabel}. ${shotShapeNarrative}.`;
        const windDesc = `Wind pushed it ${Math.abs(windYEffect)} yds ${windYEffect > 0 ? 'long' : windYEffect < 0 ? 'short' : 'nowhere'}, and ${Math.abs(windXEffect)} yds ${windXEffect > 0 ? 'right' : windXEffect < 0 ? 'left' : 'nowhere'}.`;

        stateTimeouts.push(setTimeout(() => {
            let displayX = Math.round(ballX * 10) / 10;
            let dirStr = displayX === 0 ? "dead center" : `${Math.abs(displayX)} yards ${displayX < 0 ? 'left' : 'right'} of center`;
            const sideSpinShape = sideSpinRPM === 0 ? "Straight" : sideSpinRPM > 0 ? "Slice" : "Hook";
            // v3.82.0 Comprehensive Telemetry Capture
            const chokeStr = typeof isChokedDown !== 'undefined' && isChokedDown ? " (Choked 90%)" : "";
            const setupMetrics = `Setup: ${club.name}${chokeStr} | Style: ${currentStyle.name} | Focus: ${focusModes[focusIndex].name} | Stance: ${stanceNames[stanceIndex]} / ${alignmentNames[stanceAlignment + 2]} | Aim: ${aimAngle}° | Wind: Y:${windY} X:${windX}`;

            let envMetrics = "";
            if (typeof synthTreeActive !== 'undefined' && synthTreeActive) {
                envMetrics = `Environment: Synth Tree at ${synthTreeDist}y, X:${synthTreeX}, Height:${Math.round(synthTreeHeight)}ft\n`;
            }

            const execMetrics = `Execution: Power ${finalPower}%. Hinge Diff ${hingeDiff}ms. Impact Offset ${impactDiff}ms. Accuracy Score ${accuracyScore}%. Backspin: ${backspinRPM} RPM. Side Spin: ${sideSpinRPM} RPM (${sideSpinShape}).\n${treeCollisionReport}`;

            const metrics = `${setupMetrics}\n${envMetrics}${execMetrics}`;
            const roughDesc = isStartingInRough ? "Hacked it out of the rough. " : "";
            let kickDesc = lateralKick === 0 ? "rolls straight" : `kicks ${Math.abs(lateralKick)} yds ${lateralKick > 0 ? 'right' : 'left'}`;

            // Calculate landing position relative to pin
            const landX = (ballX - moveX) + (Math.sin(finalRad) * carryDistance + Math.cos(finalRad) * (physicsX + windXEffect));
            const landY = (ballY - moveY) + (Math.cos(finalRad) * carryDistance - Math.sin(finalRad) * (physicsX + windXEffect));
            const landDistToPin = Math.sqrt(Math.pow(pinX - landX, 2) + Math.pow(pinY - landY, 2));
            const landRelY = landY - pinY;
            const landRelX = landX - pinX;
            const greenSize = holeData.greenRadius || 20;

            let proximityDesc = `Settles in the ${currentLie}, ${dirStr}.`;
            
            // Trigger precision reporting if on the green OR if it landed on the green
            if (currentLie === "Green" || landDistToPin <= greenSize) {
                const finalRelY = ballY - pinY;
                const finalRelX = ballX - pinX;
                const finalDistToPin = Math.sqrt(Math.pow(finalRelX, 2) + Math.pow(finalRelY, 2));

                // v4.32.0 Dynamic MP3 Proximity Rewards
                if (currentLie === "Green" && club.name !== "Putter") {
                    let audioFile = "";
                    let variant = Math.random() < 0.5 ? "1" : "2";

                    if (finalDistToPin <= 7.0) {
                        audioFile = `audio/test_close${variant}.mp3`;
                    } else if (finalDistToPin <= 12.0) {
                        audioFile = `audio/testmid${variant}.mp3`;
                    } else {
                        audioFile = `audio/test_far${variant}.mp3`;
                    }

                    const proximityAudio = new Audio(audioFile);
                    proximityAudio.volume = 0.8;
                    proximityAudio.play().catch(e => console.log("Audio file not found:", audioFile));

                    // Delay Caddy until 500ms after the MP3 ends
                    proximityAudio.onloadedmetadata = () => {
                        caddyDelayMs = (proximityAudio.duration * 1000) + 500;
                    };
                }

                const landDir = landRelY < -1 ? "short" : landRelY > 1 ? "long" : "pin-high";
                const finalVertDir = finalRelY < landRelY ? "back" : "forward"; // Direction of roll
                const cupRelDir = finalRelY < 0 ? "short of" : "past";
                const finalSideDir = finalRelX < 0 ? "left" : "right";

                proximityDesc = `Landed ${window.formatProximity(landRelY)} ${landDir}. Rolled ${window.formatProximity(finalRelY - landRelY)} ${finalVertDir}, settling ${cupRelDir} the cup. Finished ${window.formatProximity(finalDistToPin)} from the pin, ${window.formatProximity(finalRelX)} to the ${finalSideDir}.`;
            }

            const shotBroadcast = `[${pName}] ${club.name}. ${roughDesc}${shotDesc} ${windDesc} Carries ${carryDistance}, rolls ${rollDistance} forward and ${kickDesc} for a total of ${totalDistance}. ${proximityDesc}`;

            if (gameMode === 'chipping') {
                let finalProximity = distanceToPin;
                ballX = 0; ballY = 0; pinX = 0;
                pinY = chippingRange === 'short' ? Math.floor(Math.random() * 16) + 5 : Math.floor(Math.random() * 61) + 20;
                let newTarget = calculateDistanceToPin();
                const chippingMsg = `Chipping Green. ${shotBroadcast} Shot finished ${finalProximity} yards from the pin. New target: ${newTarget} yards.`;
                window.announce(chippingMsg);
                lastShotReport = chippingMsg + "\n\nTelemetry:\n" + metrics;
                holeTelemetry.push(lastShotReport);
                window.setCaddyPanelText(lastShotReport);
                driftWind(); aimAngle = 0; stanceIndex = 2; stanceAlignment = 0; swingState = 0; isPutting = false; isChokedDown = false;
                window.updateDashboard();
            } else {
                if (isHoleComplete) {
                    // v4.28.0 Dynamic Scoring Chords
                    if (typeof window.playGolfSound === 'function') {
                        let diff = strokes - par;
                        let sfx = 'score_01'; // Default: Par
                        if (diff <= -2) sfx = 'score_04'; // Eagle/Hole-in-One
                        else if (diff === -1) sfx = 'score_03'; // Birdie
                        else if (diff === 1) sfx = 'score_05'; // Bogey
                        else if (diff === 2) sfx = 'score_06'; // Double Bogey
                        else if (diff >= 3) sfx = 'score_07'; // Triple Bogey+
                        window.playGolfSound(sfx);
                    } else {
                        playTone(440, 'sine', 0.2, 0.4);
                        stateTimeouts.push(setTimeout(() => playTone(554, 'sine', 0.2, 0.4), 200));
                        stateTimeouts.push(setTimeout(() => playTone(659, 'sine', 0.4, 0.4), 400));
                    }

                    const completionMessage = `Hole complete! ${shotBroadcast} You reached the green in ${strokes} strokes.`;
                    window.announce(completionMessage);
                    lastShotReport = completionMessage + "\n\nTelemetry:\n" + metrics;
                    holeTelemetry.push(lastShotReport);
                    window.setCaddyPanelText(lastShotReport);

                    window.advanceTurn();
                } else {
                    if (gameMode === 'range') {
                        let finalProximity = distanceToPin;
                        let vertDir = ballY < pinY ? "Short" : "Long";
                        let horizDir = ballX < 0 ? "Left" : "Right";
                        let relativePos = (finalProximity <= 1) ? "Dead Center" : `${vertDir}-${horizDir}`;

                        const rangeMsg = `Driving Range. ${shotBroadcast} Finished ${finalProximity} yards from target, ${relativePos}.`;
                        lastShotReport = rangeMsg + "\n\nTelemetry:\n" + metrics;
                        holeTelemetry.push(lastShotReport);
                        
                        ballX = 0; ballY = 0; 
                        window.announce(rangeMsg);
                        window.setCaddyPanelText(lastShotReport);

                        if (gameMode === 'course') window.updateTargetZone();
                        driftWind(); aimAngle = 0; stanceIndex = 2; stanceAlignment = 0; swingState = 0;
                        window.updateDashboard();
                    } else {
                        let penaltyStr = ".";
                        if (currentLie.toLowerCase().includes("water") && gameMode === 'course') {
                            penaltyStr = " (includes 1 stroke water penalty).";
                        }
                        const broadcast = `${shotBroadcast} Stroke ${strokes + 1}${penaltyStr} ${distanceToPin} yards to the pin.`;
                        
                        // Track the Caddy/Transition sequence
                        stateTimeouts.push(setTimeout(() => {
                            window.announce(broadcast);
                            lastShotReport = broadcast + "\n\nTelemetry:\n" + metrics;
                            holeTelemetry.push(lastShotReport);
                            window.setCaddyPanelText(lastShotReport);

                            if (gameMode === 'course' && currentLie === "Green") {
                                playTone(440, 'sine', 0.1, 0.5);
                                stateTimeouts.push(setTimeout(() => playTone(554, 'sine', 0.1, 0.5), 150));
                                stateTimeouts.push(setTimeout(() => playTone(659, 'sine', 0.2, 0.5), 300));
                                stateTimeouts.push(setTimeout(() => {
                                    window.initPutting();
                                    window.advanceTurn(true);
                                }, 3500));
                            } else {
                                if (gameMode === 'course') window.updateTargetZone();
                                driftWind(); aimAngle = 0; stanceIndex = 2; stanceAlignment = 0; swingState = 0; isPutting = false; isChokedDown = false;
                                
                                // v4.45.1 ARIA Interruption Fix (Wait 4 seconds before advancing turn)
                                stateTimeouts.push(setTimeout(() => {
                                    window.advanceTurn();
                                }, 4000));
                            }
                        }, typeof isPutting !== 'undefined' && isPutting && club.name === "Putter" && strokes > 1 ? 1500 : 0));

                        // Wait for the timeout to finish, then save
                        // Track the Auto-Save delay
                        stateTimeouts.push(setTimeout(() => {
                            shotStyleIndex = 0; // v4.19.7 Reset style to Normal after shot completion
                            if (typeof window.saveGame === 'function') window.saveGame();
                        }, 2000));
                    }
                }
            }
        }, bounceSequenceMs + (rollTimeSecs * 1000) + caddyDelayMs));

        } catch (err) {
            console.error('Shot resolution failed', err);
            swingState = 0;
            isPutting = false;
            if (typeof puttState !== 'undefined') puttState = 0;
            const fallbackMsg = "Shot resolution recovered from an error. Input restored.";
            window.announce(fallbackMsg);
            document.getElementById('visual-output').innerText = fallbackMsg;
            window.updateDashboard();
        }

    }, hangTimeSecs * 1000));
}

window.formatProximity = function(yards) {
    const absoluteYards = Math.abs(yards);
    if (absoluteYards >= 30) return `${Math.round(absoluteYards)} yards`;
    const totalInches = Math.round(absoluteYards * 36);
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    if (feet === 0) return `${inches} inches`;
    if (inches === 0) return `${feet} feet`;
    return `${feet} feet, ${inches} inches`;
};

window.autoEquipBestClub = function() {
    let distToTarget = calculateDistanceToTarget();
    let lieMultiplier = currentLie === 'Sand' ? 0.70 : (currentLie === 'Light Rough' || currentLie === 'Rough') ? 0.90 : 1.0;
    let currentStyle = shotStyles[shotStyleIndex];
    let chokeMod = typeof isChokedDown !== 'undefined' && isChokedDown ? 0.9 : 1.0;
    let bestClubIndex = currentClubIndex;
    let smallestDiff = 9999;

    for (let i = 0; i < clubs.length; i++) {
        if (clubs[i].name === "Putter") continue;
        let dynamicLoft = Math.max(0, clubs[i].loft + currentStyle.loftMod + ((2 - stanceIndex) * 5));
        let loftDistMod = 1 + ((26 - dynamicLoft) * 0.005);
        let expectedDist = clubs[i].baseDistance * lieMultiplier * loftDistMod * chokeMod;

        let diff = Math.abs(expectedDist - distToTarget);
        if (diff < smallestDiff) {
            smallestDiff = diff;
            bestClubIndex = i;
        }
    }
    currentClubIndex = bestClubIndex;
    club = clubs[currentClubIndex];
    window.updateDashboard();
};

// v4.37.0 Terrain Probe Helper
window.getTerrainAt = function(x, y) {
    if (gameMode !== 'course') return typeof rangeTargetLie !== 'undefined' ? rangeTargetLie : "Fairway";

    const holeData = courses[currentCourseIndex].holes[hole - 1];
    let distToPin = Math.sqrt(Math.pow(x - pinX, 2) + Math.pow(y - pinY, 2));
    const greenSize = holeData.greenRadius || 20;

    if (distToPin <= greenSize) return "Green";

    let terrain = "Fairway";
    let currentFW = typeof activeFairwayWidth !== 'undefined' ? activeFairwayWidth : (holeData.fairwayWidth || 40);

    if (holeData.approachWidth && distToPin <= 50 && distToPin > (holeData.apronRadius || 0)) {
        currentFW = holeData.approachWidth;
    } else if (holeData.apronRadius && distToPin <= holeData.apronRadius) {
        currentFW = 30; // Apron width
    }

    if (Math.abs(x) > (currentFW / 2)) terrain = "Rough";

    if (holeData.hazards) {
        holeData.hazards.forEach(h => {
            const hLeft = h.offset - (h.width / 2);
            const hRight = h.offset + (h.width / 2);
            const hStart = h.distance;
            const hEnd = h.distance + h.depth;
            if (y >= hStart && y <= hEnd && x >= hLeft && x <= hRight) {
                terrain = h.type === "Bunker" ? "Sand" : h.type;
            }
        });
    }
    return terrain;
};

// v4.37.1 Landing Zone Oracle
window.getLandingZoneEffect = function(x, y) {
    if (gameMode !== 'course') return "";
    const holeData = courses[currentCourseIndex].holes[hole - 1];
    if (!holeData || !holeData.greenType || typeof greenDictionary === 'undefined') return "";

    // Calculate distance from the targeted coordinates to the pin
    let distFromPin = Math.sqrt(Math.pow(x - pinX, 2) + Math.pow(y - pinY, 2));
    let activeContours = greenDictionary[holeData.greenType] || [];

    // Find the contour zone that governs this specific distance from the cup
    let zone = activeContours.find(z => distFromPin <= z.startY && distFromPin > z.endY);

    if (!zone) return " Area is relatively flat.";

    let kick = "";
    if (zone.slopeX > 0.1) kick = "kicks right";
    else if (zone.slopeX < -0.1) kick = "kicks left";

    let feed = "";
    if (zone.slopeY > 0.1) feed = "feeds uphill";
    else if (zone.slopeY < -0.1) feed = "feeds downhill";

    if (kick && feed) return ` Landing here ${kick} and ${feed}.`;
    if (kick) return ` Landing here ${kick}.`;
    if (feed) return ` Landing here ${feed}.`;

    return " Area is relatively flat.";
};

// v4.41.1 Unified God Caddy (Putting & Fairway Oracles)
window.getCaddyAdvice = function() {
    if (typeof caddyLevel !== 'undefined' && caddyLevel < 3) return "I can only read advanced telemetry at Level 3. Press Shift + A to upgrade me.";

    // --- PART 1: THE PUTTING ORACLE ---
    if (gameMode === 'putting' || (gameMode === 'course' && currentLie === "Green")) {
        let distToPin = calculateDistanceToPin();
        const holeData = courses[currentCourseIndex].holes[hole - 1];
        let activeContours = [];
        if (gameMode === 'course' && holeData.greenType && typeof greenDictionary !== 'undefined') {
            activeContours = greenDictionary[holeData.greenType] || [];
        } else if (gameMode === 'putting') {
            activeContours = [
                { startY: 45, endY: 25, slopeX: 0.8, slopeY: 0.4 },
                { startY: 25, endY: 10, slopeX: -0.3, slopeY: 0.0 },
                { startY: 10, endY: 0, slopeX: 0.6, slopeY: -0.3 }
            ];
        }

        let bestAim = null; let bestPace = null;
        let tempoBonus = 1.0; // Standard hole size assumption
        let baseHoleRadius = 0.15;
        let activeHoleRadius = ((distToPin <= 2.0) ? (baseHoleRadius * 3.0) : baseHoleRadius) * tempoBonus;
        let slopeDampener = (distToPin <= 3.0) ? 0.1 : (distToPin <= 6.0) ? 0.35 : 1.0;
        let baseHeading = Math.atan2(pinX - ballX, pinY - ballY);

        for (let p = Math.max(0.5, distToPin * 0.5); p <= distToPin * 2.5; p += 0.25) {
            for (let a = -45; a <= 45; a += 1) {
                let simX = ballX, simY = ballY;
                let speedRemaining = p; let distTraveled = 0;
                let currentHeading = baseHeading + (a * (Math.PI / 180));
                let madeIt = false;
                let captureSpeedLimit = (distToPin <= 2) ? 6.0 : 2.5 * tempoBonus;

                while (speedRemaining > 0 && distTraveled < 100) {
                    let stepDist = Math.min(1.0, speedRemaining);
                    let currentDistToHole = Math.sqrt(Math.pow(pinX - simX, 2) + Math.pow(pinY - simY, 2));

                    if (currentDistToHole <= activeHoleRadius && speedRemaining <= captureSpeedLimit) {
                        madeIt = true; break;
                    }

                    let zone = activeContours.find(z => currentDistToHole <= z.startY && currentDistToHole > z.endY);
                    let sx = (zone ? zone.slopeX : 0) * slopeDampener;
                    let sy = (zone ? zone.slopeY : 0) * slopeDampener;

                    currentHeading -= (sx * 0.05);
                    simX += Math.sin(currentHeading) * stepDist;
                    simY += Math.cos(currentHeading) * stepDist;
                    distTraveled += stepDist;
                    speedRemaining -= (1.0 + (sy * 0.15));
                }

                if (madeIt) {
                    if (bestPace === null || p < bestPace || (p === bestPace && Math.abs(a) < Math.abs(bestAim))) {
                        bestAim = a; bestPace = p;
                    }
                } else {
                    let finalDistToHole = Math.sqrt(Math.pow(pinX - simX, 2) + Math.pow(pinY - simY, 2));
                    if (finalDistToHole < bestMissDist) {
                        bestMissDist = finalDistToHole; bestMissAim = a; bestMissPace = p;
                    }
                }
            }
        }

        if (bestAim !== null && bestPace !== null) {
            let aimStr = bestAim === 0 ? "straight" : `${Math.abs(bestAim)} degrees ${bestAim < 0 ? 'Left' : 'Right'}`;
            let isShort = distToPin <= 5.0;
            let unit = isShort ? "feet" : "yards";
            let paceDisplay = isShort ? `${Math.round(bestPace * 3)}` : `${bestPace}`;
            let distDisplay = isShort ? `${Math.round(distToPin * 3)}` : `${Math.round(distToPin)}`;
            return `[Oracle Putting]: ${distDisplay} ${unit}. To sink it with perfect timing, aim ${aimStr} and hit it with ${paceDisplay} ${unit} of pace.`;
        } else {
            let aimStr = bestMissAim === 0 ? "straight" : `${Math.abs(bestMissAim)} degrees ${bestMissAim < 0 ? 'Left' : 'Right'}`;
            let isShort = distToPin <= 5.0;
            let unit = isShort ? "feet" : "yards";
            let paceDisplay = isShort ? `${Math.round(bestMissPace * 3)}` : `${bestMissPace}`;
            return `[Oracle Putting]: Cannot find a guaranteed make. Best lag option: aim ${aimStr} and hit it with ${paceDisplay} ${unit} of pace.`;
        }
    }

    // --- PART 2: THE FAIRWAY ORACLE ---
    if (gameMode !== 'course') return "Oracle mode is available on the course only.";
    
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

    const style = shotStyles[0]; // Oracle simulates standard full swings
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

    // Aggression Bias for Par 4/5
    if (best && holeData.par > 3 && (currentLie === "Tee" || currentLie === "Fairway")) {
         let longestSafeClub = best;
         simulatedClubs.forEach(simClub => {
             // Re-run simple straight simulation to see if a longer club is safe
             if (simClub.baseDistance > clubs.find(c => c.name === best.clubName).baseDistance) {
                 let testDist = simClub.baseDistance * style.distMod;
                 let testY = ballY + testDist;
                 let terrain = typeof window.getTerrainAt === 'function' ? window.getTerrainAt(ballX, testY) : "Fairway";
                 if (terrain === "Fairway" || terrain === "Green" || terrain === "Light Rough") {
                     longestSafeClub = { clubName: simClub.name, stanceName: "Neutral", aimDeg: 0, miss: 0 };
                 }
             }
         });
         best = longestSafeClub;
    }

    if (!best) return "Oracle unavailable. Unable to compute tactical targeting right now.";

    const aimStr = best.aimDeg === 0 ? "Center" : `${Math.abs(best.aimDeg)} degrees ${best.aimDeg < 0 ? 'Left' : 'Right'}`;
    
    if (typeof window.playGolfSound === 'function') window.playGolfSound('caddy_02');
    
    return `[Oracle]: To hit ${targetPoint.label} (${targetDist}y), equip ${best.clubName}, ${best.stanceName} stance, aim ${aimStr}.`;
};

// v4.47.0 Silent Oracle for AI Brain
window.getOracleBlueprint = function() {
    if (isPutting || (gameMode === 'course' && currentLie === "Green")) {
        let distToPin = calculateDistanceToPin();
        const holeData = courses[currentCourseIndex].holes[hole - 1];
        let activeContours = [];
        if (gameMode === 'course' && holeData.greenType && typeof greenDictionary !== 'undefined') {
            activeContours = greenDictionary[holeData.greenType] || [];
        } else if (gameMode === 'putting') {
            activeContours = [
                { startY: 45, endY: 25, slopeX: 0.8, slopeY: 0.4 },
                { startY: 25, endY: 10, slopeX: -0.3, slopeY: 0.0 },
                { startY: 10, endY: 0, slopeX: 0.6, slopeY: -0.3 }
            ];
        }

        let bestAim = null; let bestPace = null;
        let bestMissDist = 9999; let bestMissAim = 0; let bestMissPace = distToPin;
        let baseHoleRadius = 0.15;
        let activeHoleRadius = ((distToPin <= 2.0) ? (baseHoleRadius * 3.0) : baseHoleRadius);
        let slopeDampener = (distToPin <= 3.0) ? 0.1 : (distToPin <= 6.0) ? 0.35 : 1.0;
        let baseHeading = Math.atan2(pinX - ballX, pinY - ballY);

        for (let p = Math.max(0.5, distToPin * 0.5); p <= distToPin * 2.5; p += 0.25) {
            for (let a = -45; a <= 45; a += 1) {
                let simX = ballX, simY = ballY;
                let speedRemaining = p; let distTraveled = 0;
                let currentHeading = baseHeading + (a * (Math.PI / 180));
                let madeIt = false;
                let captureSpeedLimit = (distToPin <= 2) ? 6.0 : 2.5;
                let finalDistToHole = 9999;

                while (speedRemaining > 0 && distTraveled < 100) {
                    let stepDist = Math.min(1.0, speedRemaining);
                    let currentDistToHole = Math.sqrt(Math.pow(pinX - simX, 2) + Math.pow(pinY - simY, 2));
                    finalDistToHole = currentDistToHole;

                    if (currentDistToHole <= activeHoleRadius && speedRemaining <= captureSpeedLimit) {
                        madeIt = true; break;
                    }

                    let zone = activeContours.find(z => currentDistToHole <= z.startY && currentDistToHole > z.endY);
                    let sx = (zone ? zone.slopeX : 0) * slopeDampener;
                    let sy = (zone ? zone.slopeY : 0) * slopeDampener;

                    currentHeading -= (sx * 0.05);
                    simX += Math.sin(currentHeading) * stepDist;
                    simY += Math.cos(currentHeading) * stepDist;
                    distTraveled += stepDist;
                    speedRemaining -= (1.0 + (sy * 0.15));
                }
                if (madeIt) {
                    if (bestPace === null || p < bestPace || (p === bestPace && Math.abs(a) < Math.abs(bestAim))) {
                        bestAim = a; bestPace = p;
                    }
                }
                else {
                    if (finalDistToHole < bestMissDist) {
                        bestMissDist = finalDistToHole;
                        bestMissAim = a;
                        bestMissPace = p;
                    }
                }
            }
        }
        // v4.48.0 Long Putt Fallback
        if (bestPace === null) {
            bestAim = bestMissAim;
            bestPace = bestMissPace;
        }
        return { aimDeg: bestAim, pace: bestPace };
    } else {
        const holeData = courses[currentCourseIndex].holes[hole - 1];
        let targetPoint = { x: pinX, y: pinY };
        if (activeTargetType === 'grid') targetPoint = { x: pinX + gridX, y: pinY + gridY };
        else if (activeTargetType === 'zone') {
            const landingZones = holeData.landingZones || [];
            if (landingZones.length > 0) targetPoint = { x: landingZones[targetZoneIndex].x, y: landingZones[targetZoneIndex].y };
        }

        const dx = targetPoint.x - ballX;
        const dy = targetPoint.y - ballY;
        const baseHeading = Math.atan2(dx, dy);
        
        // v4.48.0 AI Short Game Brain
        let distToTarget = Math.sqrt(dx*dx + dy*dy);
        let allowedStyles = distToTarget <= 100 ? [0, 1, 2, 3, 4] : [0];
        let lieMultiplier = currentLie === 'Sand' ? 0.70 : (currentLie === 'Light Rough' || currentLie === 'Rough') ? 0.90 : 1.0;
        let best = null;

        for (let sIdx of allowedStyles) {
            let style = shotStyles[sIdx];
            for (let i = 0; i < clubs.length; i++) {
                let simClub = clubs[i];
                if (simClub.name === "Putter") continue; 
                if (distToTarget < 120 && (simClub.name.includes('Wood') || simClub.name.includes('Driver'))) continue;
                if (sIdx >= 1 && sIdx <= 4 && !simClub.name.includes("Wedge") && simClub.name !== "9 Iron") continue;
                for (let simStance = 0; simStance < 5; simStance++) {
                    let dynamicLoft = Math.max(0, simClub.loft + style.loftMod + ((2 - simStance) * 5));
                    let loftDistMod = 1 + ((26 - dynamicLoft) * 0.005);
                    let totalDist = simClub.baseDistance * style.distMod * loftDistMod * lieMultiplier;
                    
                    let requiredPower = 100;
                    if (totalDist > distToTarget && totalDist > 0) {
                        requiredPower = Math.max(10, Math.min(100, Math.round((distToTarget / totalDist) * 100)));
                    }
                    let fractionalDist = totalDist * (requiredPower / 100);

                    let hangTime = Math.min(6, Math.max(0.5, (fractionalDist / 60) + (dynamicLoft / 15)));
                    let windForward = windY * (hangTime / 2.5) * style.windMod;
                    let windCross = windX * (hangTime / 2.5) * style.windMod;
                    let desiredHeading = Math.atan2((targetPoint.x - ballX) - windCross, (targetPoint.y - ballY) - windForward);
                    let aimDeg = Math.round((desiredHeading - baseHeading) * (180 / Math.PI));
                    aimDeg = Math.max(-45, Math.min(45, aimDeg)); 

                    let heading = baseHeading + (aimDeg * Math.PI / 180);
                    let effectiveCarry = (fractionalDist * (1 - simClub.rollPct)) + windForward;
                    let rollDist = fractionalDist * simClub.rollPct;
                    
                    let landX = Math.sin(heading) * effectiveCarry + Math.cos(heading) * windCross;
                    let landY = Math.cos(heading) * effectiveCarry - Math.sin(heading) * windCross;
                    let finalX = ballX + landX + (Math.sin(heading) * rollDist * 0.8);
                    let finalY = ballY + landY + (Math.cos(heading) * rollDist * 0.8);

                    let miss = Math.sqrt(Math.pow(targetPoint.x - finalX, 2) + Math.pow(targetPoint.y - finalY, 2));

                    if (holeData.trees) {
                        holeData.trees.forEach(tree => {
                            let distToTreeCenter = Math.sqrt(Math.pow(tree.x - ballX, 2) + Math.pow(tree.y - ballY, 2));
                            if (fractionalDist > distToTreeCenter && tree.y > ballY) {
                                let flightFraction = distToTreeCenter / fractionalDist;
                                let projectedX = ballX + (landX - ballX) * flightFraction;
                                let projectedY = ballY + (landY - ballY) * flightFraction;
                                let actualDistToTree = Math.sqrt(Math.pow(tree.x - projectedX, 2) + Math.pow(tree.y - projectedY, 2));
                                
                                if (actualDistToTree < tree.radius) {
                                    let ballHeightAtTree = Math.max(0, (Math.tan(dynamicLoft * Math.PI / 180) / fractionalDist) * distToTreeCenter * (fractionalDist - distToTreeCenter));
                                    if (ballHeightAtTree < tree.height) miss += 100; // Massive penalty for hitting a tree
                                }
                            }
                        });
                    }

                    if (!best || miss < best.miss || (miss === best.miss && Math.abs(aimDeg) < Math.abs(best.aimDeg))) {
                        best = { clubIndex: i, stanceIndex: simStance, styleIndex: sIdx, power: requiredPower, aimDeg, miss };
                    }
                }
            }
        }
        return best || { clubIndex: 0, stanceIndex: 2, styleIndex: 0, power: 100, aimDeg: 0 };
    }
};