// physics_core.js - Math, Wind, and Shot Calculation (v6.02.0)
window.AG_VERSION = "v6.02.0";

const SHOT_RECOVERY_TIMEOUT_MS = 20000;

// v5.91.1 Hole 18 Wind Tunnel Override (Bulletproof)
window.applyDivergentWind = function() {
    if (typeof gameMode !== 'undefined' && gameMode === 'course' && window.currentCourse && window.currentCourse.name === "The Pasture" && typeof hole !== 'undefined' && typeof currentLie !== 'undefined' && currentLie !== "Green" && currentLie !== "Hole") {
        if (hole === 6) {
            let dx = ballX - 0;
            let dy = ballY - 395;
            let dist = Math.sqrt(dx*dx + dy*dy) || 1;
            windX = Math.round((dx / dist) * 15);
            windY = Math.round((dy / dist) * 15);
        } else if (hole === 18) {
            windX = 0;
            windY = 45;
        }
    }
};

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

window.playScoringAudioSequence = function(strokes, par, vol) {
    let diff = strokes - par;
    let melodyFile = "";
    
    if (diff < 0) {
        window.triumphSounds = window.triumphSounds || [1,2,3,4,5,6];
        window.triumphSounds.sort(() => Math.random() - 0.5);
        let num = window.triumphSounds.pop() || 1;
        if (window.triumphSounds.length === 0) window.triumphSounds = [1,2,3,4,5,6];
        melodyFile = `8bit_triumph${num}`;
    } else if (diff === 0) {
        window.neutralSounds = window.neutralSounds || [1,2,3,4,5,6];
        window.neutralSounds.sort(() => Math.random() - 0.5);
        let num = window.neutralSounds.pop() || 1;
        if (window.neutralSounds.length === 0) window.neutralSounds = [1,2,3,4,5,6];
        melodyFile = `8bit_neutral${num}`;
    } else {
        window.sadnessSounds = window.sadnessSounds || [1,2,3,4,5,6];
        window.sadnessSounds.sort(() => Math.random() - 0.5);
        let num = window.sadnessSounds.pop() || 1;
        if (window.sadnessSounds.length === 0) window.sadnessSounds = [1,2,3,4,5,6];
        melodyFile = `8bit_sadness${num}`;
    }
    
    let voiceFile = "score_know";
    if (diff <= -2) voiceFile = "score_eagle";
    else if (diff === -1) voiceFile = "score_birdie";
    else if (diff === 0) voiceFile = "score_par";
    else if (diff === 1) voiceFile = "score_bogey";
    else if (diff === 2) voiceFile = "score_dbogey";
    else if (diff === 3) voiceFile = "score_tbogey";

    let melodyAudio = new Audio(`audio/swings/${melodyFile}.mp3`);
    melodyAudio.volume = vol * 0.60; // v5.52.0 - 0.60x volume dampener on 8-bit jingles
    melodyAudio.play().catch(e=>{});
    
    let playVoice = () => {
        let voiceAudio = new Audio(`audio/swings/${voiceFile}.mp3`);
        voiceAudio.volume = vol;
        voiceAudio.play().catch(e=>{});
    };

    if (typeof window.stateTimeouts !== 'undefined') window.stateTimeouts.push(setTimeout(playVoice, 5000));
    else setTimeout(playVoice, 5000);
    
    return 7500;
};

window.initPutting = function() {
    // v5.99.0 Practice Range State Lock — block putting transition on the range
    if (gameMode === 'range') return;
    isPutting = true; swingState = 0; puttState = 0;
    currentClubIndex = clubs.findIndex(c => c.name === "Putter");
    if (currentClubIndex !== -1) club = clubs[currentClubIndex];
    let rawDist = calculateDistanceToPin();
    let dist = Math.max(1/3, Math.round(rawDist * 3) / 3);
    puttTargetDist = dist; aimAngle = 0;
    
    let locationStr = gameMode === 'putting' ? "Welcome to the Practice Putting Green." : "On the green!";
    // v4.19.2 Updated Unified Control Instructions
    let msg = `${locationStr} ${dist} yards to the cup. Targeting Mode active. Use arrows to adjust aim and distance, then press Enter to lock.`;
    window.announce(msg);
    document.getElementById('visual-output').innerText = msg;
    window.updateDashboard();
    if (typeof window.saveGame === 'function') window.saveGame();
    if (typeof window.autoSetFocus === 'function') window.autoSetFocus(true);
};

function calculateDistanceToPin() {
    return Math.round(Math.sqrt(Math.pow(pinX - ballX, 2) + Math.pow(pinY - ballY, 2)));
}

function calculateDistanceToTarget() {
    return Math.round(Math.sqrt(Math.pow(targetX - ballX, 2) + Math.pow(targetY - ballY, 2)));
}

function generateWind() {
    if (gameMode === 'course' && window.currentCourse && window.currentCourse.name === "The Pasture" && hole === 6 && currentLie !== "Green" && currentLie !== "Hole") {
        let dx = ballX - 0; let dy = ballY - 395; let dist = Math.sqrt(dx*dx + dy*dy) || 1;
        windX = Math.round((dx / dist) * 15); windY = Math.round((dy / dist) * 15);
        return;
    }
    // v5.91.0 Hole 18 Wind Tunnel Override
    if (gameMode === 'course' && window.currentCourse && window.currentCourse.name === "The Pasture" && hole === 18 && currentLie !== "Green" && currentLie !== "Hole") {
        windX = 0; windY = 45;
        return;
    }
    const level = windLevels[windLevelIndex];
    let magX = Math.floor(Math.random() * (level.max - level.min + 1)) + level.min;
    let magY = Math.floor(Math.random() * (level.max - level.min + 1)) + level.min;
    windX = Math.random() < 0.5 ? magX : -magX;
    windY = Math.random() < 0.5 ? magY : -magY;
}

function driftWind() {
    if (gameMode === 'course' && window.currentCourse && window.currentCourse.name === "The Pasture" && hole === 6 && currentLie !== "Green" && currentLie !== "Hole") {
        let dx = ballX - 0;
        let dy = ballY - 395; // Windmill parked 15 yards behind pin
        let dist = Math.sqrt(dx*dx + dy*dy) || 1;
        windX = Math.round((dx / dist) * 15);
        windY = Math.round((dy / dist) * 15);
        if (typeof window.updateDashboard === 'function') window.updateDashboard();
        return;
    }
    // v5.91.0 Hole 18 Wind Tunnel Override
    if (gameMode === 'course' && window.currentCourse && window.currentCourse.name === "The Pasture" && hole === 18 && currentLie !== "Green" && currentLie !== "Hole") {
        windX = 0; windY = 45;
        if (typeof window.updateDashboard === 'function') window.updateDashboard();
        return;
    }
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
    
    // v4.80.0 Global to Relative Wind Rotation
    const targetAngleRad = Math.atan2(targetX - ballX, targetY - ballY);
    const finalRad = targetAngleRad + (aimAngle * (Math.PI / 180));
    
    let relWindY = Math.round((windY * Math.cos(finalRad)) + (windX * Math.sin(finalRad)));
    let relWindX = Math.round((windX * Math.cos(finalRad)) - (windY * Math.sin(finalRad)));

    const verticalWind = relWindY === 0 ? 'Calm' : `${Math.abs(relWindY)} mph ${relWindY > 0 ? 'Tailwind' : 'Headwind'}`;
    const horizontalWind = relWindX === 0 ? '0 mph Center' : `${Math.abs(relWindX)} mph ${relWindX > 0 ? 'Right' : 'Left'}`;
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
    window.applyDivergentWind();
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
    } else if (gameMode === 'course' && (currentLie === 'Mud' || currentLie === 'Manure')) {
        const minTotal = Math.round(baseTotal * 0.50);
        const maxTotal = Math.round(baseTotal * 0.70);
        return `${club.name}. ${gripReport}100% power hits ${minTotal} to ${maxTotal} yards. Buried in thick mud. Massive dispersion. Style: ${style.name}. Focus: ${focusName}.`;
    } else if (gameMode === 'course' && currentLie === 'Packed Earth') {
        const minTotal = Math.round(baseTotal * 0.95);
        const maxTotal = Math.round(baseTotal * 1.00);
        return `${club.name}. ${gripReport}100% power hits ${minTotal} to ${maxTotal} yards. Hard, packed dirt. Style: ${style.name}. Focus: ${focusName}.`;
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
    window.applyDivergentWind();
    let quick = typeof window.isQuickSim !== 'undefined' && window.isQuickSim; // v4.86.0
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
        const holeData = window.currentCourse.holes[hole - 1];
        let netElevYards = 0; let netBreakYards = 0;

        if (holeData && holeData.greenType && typeof window.greenDictionary !== 'undefined') {
            let activeContours = window.greenDictionary[holeData.greenType] || [];
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

        // v5.45.0 Tournament Greens Speed
        let effectiveStimp = (typeof window.tournamentGreens !== 'undefined' && window.tournamentGreens) ? 13 : 10;
        // v5.45.0 Bot Pace Scatter on Tournament Greens
        if (isBotTurn && effectiveStimp === 13) {
            let _botName = typeof players !== 'undefined' && players.length > 0 ? players[currentPlayerIndex].name : "";
            if (_botName.includes("Bot")) {
                let paceError = (Math.random() - 0.5) * 0.16;
                finalPower = finalPower * (1 + paceError);
            }
        }

        // Touch Mechanic (Spacebar Hinge becomes Tempo)
        let accuracyScore = Math.max(10, 100 - (Math.abs(impactDiff) / 2.5));

        // v4.36.1 Linear Touch Magnetism (Putting)
        let startDistToPin = Math.sqrt(Math.pow(ballX - pinX, 2) + Math.pow(ballY - pinY, 2));
        let slopeDampener = 1.0; // v5.45.0 - Uncapped break

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
        if (focusIndex === 2) { // v5.45.0 Touch Focus: 5-Tier Magnetism System
            if (absHinge <= p50) {
                tempoBonus = effectiveStimp === 13 ? 1.5 : 4.0;     // Tier 1: Perfect touch
            } else if (absHinge <= p150) {
                tempoBonus = effectiveStimp === 13 ? 1.0 : 2.0;     // Tier 2: Moderate touch
            } else {
                tempoBonus = 0.5;                                    // Tier 3: Bad touch
            }
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
            const holeData = window.currentCourse.holes[hole - 1];
            if (holeData.greenType && typeof window.greenDictionary !== 'undefined') {
                activeContours = window.greenDictionary[holeData.greenType] || [];
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
        let stimpMod = effectiveStimp / 10;
        let speedRemaining = puttTargetDist * (finalPower / 100) * stimpMod;
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

        // v5.47.2 End-of-Loop Blindspot Check
        if (!madeIt) {
            let finalDistToHole = Math.sqrt(Math.pow(pinX - simX, 2) + Math.pow(pinY - simY, 2));
            if (finalDistToHole <= captureRadius && speedRemaining <= captureSpeedLimit) {
                madeIt = true;
                playbackArray.push({ x: simX, y: simY, speed: 0, madeIt: true });
            }
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
                // v5.42.0 Cup Grab-Bag Audio
                if (!quick) {
                    window.cupSounds = window.cupSounds || ['cup1', 'cup2', 'cup3', 'cup4', 'cup5', 'cup6'];
                    window.cupSounds.sort(() => Math.random() - 0.5);
                    let cupFile = window.cupSounds.pop() || 'cup1';
                    if (window.cupSounds.length === 0) window.cupSounds = ['cup1', 'cup2', 'cup3', 'cup4', 'cup5', 'cup6'];
                    let vol = typeof window.ambientVolumeLevels !== 'undefined' ? window.ambientVolumeLevels[window.ambientVolumeIndex] : 1.0;
                    let cupAudio = new Audio(`audio/swings/${cupFile}.mp3`);
                    cupAudio.volume = vol;
                    cupAudio.play().catch(e=>{});
                }

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
                    hole: hole, par: par, distance: window.currentCourse.holes[hole - 1].distance,
                        strokes: strokes, putts: puttsThisHole, fir: currentHoleStats.fir, gir: currentHoleStats.gir,
                        driveDistance: currentHoleStats.driveDistance, puttDistance: puttTargetDist,
                        approachStart: currentHoleStats.approachStart, approachProx: currentHoleStats.approachProx,
                        narrative: narrative,
                        telemetryLog: (typeof holeTelemetry !== 'undefined') ? holeTelemetry.join('\n\n') : ""
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
                
                // v5.1.1 Auto-Gimme / Max Score (Putting Interceptor)
                if (gameMode === 'course') {
                    let remainingDist = calculateDistanceToPin();
                    if (typeof wizardGimmes !== 'undefined' && wizardGimmes > 1) {
                        let thresh = wizardGimmes === 2 ? 1.0 : 2.0; // 3ft or 6ft
                        if (remainingDist <= thresh) {
                            strokes++; puttsThisHole++; isHoleComplete = true;
                            let feetStr = Math.round(remainingDist * 3);
                            broadcast += ` That's inside the leather. Gimme taken from ${feetStr} feet. Hole complete.`;
                        }
                    }
                    if (!isHoleComplete && typeof wizardMaxScore !== 'undefined' && wizardMaxScore > 0) {
                        let limit = wizardMaxScore === 1 ? par * 2 : 8;
                        if (strokes >= limit) {
                            isHoleComplete = true;
                            broadcast += ` Reached max score of ${limit}. Hole complete.`;
                        }
                    }
                }
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

            let delayAnnounceMs = 0;
            if (isHoleComplete && !quick) {
                let vol = typeof window.ambientVolumeLevels !== 'undefined' ? window.ambientVolumeLevels[window.ambientVolumeIndex] : 1.0;
                delayAnnounceMs = window.playScoringAudioSequence(strokes, par, vol);
            }

            lastShotReport = broadcast + advancedTelemetry;
            holeTelemetry.push(lastShotReport);

            stateTimeouts.push(setTimeout(() => {
                window.announce(broadcast);
                document.getElementById('visual-output').innerText = broadcast;
            }, delayAnnounceMs));

            stateTimeouts.push(setTimeout(() => {
                if (gameMode === 'putting') {
                    ballX = 0; ballY = 0; isHoleComplete = false;
                    swingState = 0; strokes = 0; puttState = 0; aimAngle = 0;
                    puttTargetDist = Math.round(calculateDistanceToPin());
                    window.announce(`${broadcast} Resetting ball to ${puttTargetDist} yards.`);
                    window.updateDashboard();
                } else if (gameMode === 'course') {
                    window.advanceTurn();
                }
                if (typeof window.saveGame === 'function') window.saveGame();
            }, 3000 + delayAnnounceMs));
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
    
    const activeFairwayWidth = gameMode === 'course' ? window.currentCourse.holes[hole - 1].fairwayWidth : fairwayWidth;
    const isStartingInRough = gameMode === 'range' ? (rangeLie === 'Rough') : (currentLie === 'Light Rough' || currentLie === 'Sand');
    
    let lieMod = 1.0, lieDispersionMod = 1.0, lieForgivenessMod = 1.0;

    if (isStartingInRough) {
        if (currentLie === 'Sand') {
            lieMod = 0.6 + (Math.random() * 0.2); // 60% to 80%
            lieDispersionMod = 2.0;
            lieForgivenessMod = 0.7;
        } else { // Light Rough or Range Rough
            // v4.92.0 Dynamic Rough Conditions
            let rIndex = typeof roughConditionIndex !== 'undefined' ? roughConditionIndex : 1;
            let baseMod = 0.85;
            let forgiveMod = 0.80;
            
            if (typeof roughConditions !== 'undefined' && roughConditions[rIndex]) {
                baseMod = roughConditions[rIndex].penalty;
                // The thicker the grass, the smaller the sweet spot
                forgiveMod = roughConditions[rIndex].penalty; 
            }
            
            // Add a tiny 0-5% random variance on top of the base penalty
            lieMod = baseMod + (Math.random() * 0.05); 
            lieForgivenessMod = forgiveMod;
        }
    } else if (currentLie === 'Pine Needles') {
        // v4.87.0 Pine Straw Lie Penalty
        lieMod = 0.85 + (Math.random() * 0.10);
        lieForgivenessMod = 0.7;
    } else if (currentLie === 'Mud' || currentLie === 'Manure') {
        lieMod = 0.5 + (Math.random() * 0.2); // 50% to 70% distance
        lieDispersionMod = 4.0; // Massive scatter
        lieForgivenessMod = 0.4; // Tiny sweet spot
        // v5.78.0 backspinRPM kill relocated below variable declaration — was a pre-init ReferenceError
    } else if (currentLie === 'Packed Earth') {
        lieMod = 0.95 + (Math.random() * 0.05); // 95% to 100% distance
        lieForgivenessMod = 0.85; // Tight lie, smaller sweet spot
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
    let impactAcc = Math.max(10, 100 - (adjustedImpact / 2.5));

    // v4.88.0 Deterministic Edge-Weighted Physics
    let diffMod = typeof difficultyLevels !== 'undefined' ? difficultyLevels[difficultyIndex].dispersionMod : 1.0;

    // 1. Strict Hinge Penalties (Distance Caps)
    let hingeDistanceMod = 1.0;
    if (hingeDiff > 40) { // Fat chunk
        hingeDistanceMod = Math.max(0.60, 0.85 - ((hingeDiff - 40) * 0.002));
    } else if (hingeDiff < -40) { // Thin skull
        hingeDistanceMod = Math.max(0.70, 0.90 - (Math.abs(hingeDiff + 40) * 0.001));
    }

    const currentStyle = shotStyles[shotStyleIndex];
    const accuracyScore = Math.round((impactAcc + hingeAcc) / 2);
    
    // v4.27.0 Dynamic Strike Audio
    if (!quick && typeof window.playGolfSound === 'function') {
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

    // v5.9.0 High Accuracy Strike Audio
    if (accuracyScore > 90 && !quick && club.name !== "Putter") {
        let isWood = club.name === "Driver" || club.name.includes("Wood");
        let isIron = club.name.includes("Iron") || club.name.includes("Wedge");
        
        if (isWood) {
            let variant = Math.floor(Math.random() * 5) + 1; // 1 to 5
            let blastAudio = new Audio(`audio/swings/woods_blast${variant}.mp3`);
            blastAudio.volume = 0.9;
            blastAudio.play().catch(e => console.warn("Wood blast audio missing:", e));
        } else if (isIron) {
            let variant = Math.floor(Math.random() * 6) + 1; // 1 to 6
            let blastAudio = new Audio(`audio/swings/bullseye${variant}.mp3`);
            blastAudio.volume = 0.9;
            blastAudio.play().catch(e => console.warn("Iron bullseye audio missing:", e));
        }
    }

    // v5.6.0 Extended Feedback Tails
    let impactPitch = Math.round(300 + (impactAcc * 6));
    let hingePitch = Math.round(300 + (hingeAcc * 6));
    if (typeof playTone === 'function') playTone(impactPitch, 'sine', 0.5, 0.3);
    setTimeout(() => {
        if (typeof playTone === 'function') playTone(hingePitch, 'triangle', 0.5, 0.3);
    }, 600);

    let dynamicLoft = Math.max(0, club.loft + currentStyle.loftMod + ((2 - stanceIndex) * 5));
    
    let styleSideSpinMod = currentStyle.name === "Full" ? 1.0 : (currentStyle.distMod * 0.4);

    let backspinRPM = Math.max(400, Math.round((club.loft * 150) + (finalPower * 10) + (impactAcc * 7) + ((stanceIndex - 2) * 500) + currentStyle.spinMod));
    // v4.87.0 Pine Straw Spin Penalty
    if (currentLie === 'Pine Needles') {
        backspinRPM = Math.round(backspinRPM * 0.1); // Kills 90% of backspin
    }
    // v5.78.0 Mud/Manure Spin Kill (relocated here from lie block to prevent pre-init ReferenceError)
    if (currentLie === 'Mud' || currentLie === 'Manure') {
        backspinRPM = Math.round(backspinRPM * 0.1); // Kills spin
    }
    // Spin Focus (Index 3)
    if (focusIndex === 3) backspinRPM += (2500 * focusEffect);
    // v6.02.0 Kinetic Spin Decay (Distance-based Clubhead Speed)
    if (currentStyle.name !== "Flop") {
        let energyScale = Math.max(0.1, Math.min(1.0, potentialDist / 50.0));
        backspinRPM = Math.round(backspinRPM * energyScale);
    }
    // 2. Deterministic Side Spin (Impact directly drives curve)
    // Negative impact (early) = Hook (-). Positive impact (late) = Slice (+).
    let spinMultiplier = 15 * diffMod;
    let baseSideSpin = impactDiff * spinMultiplier;

    // 3. The "Donut" Scatter RNG (Weighting the remaining variance to the edges)
    let rngSkew = Math.random() < 0.5 ? -1 : 1;
    let edgeRandom = 1.0 - Math.pow(Math.random(), 2);
    let scatterSpin = edgeRandom * 300 * diffMod * rngSkew;

    let sideSpinRPM = Math.round(baseSideSpin + scatterSpin + (stanceAlignment * 800 * styleSideSpinMod));
    // v4.80.0 Uneven Lie Physics
    if (typeof lieTilt !== 'undefined' && lieTilt !== 0) {
        // Ball above feet (positive) induces a hook (negative spin)
        sideSpinRPM += (lieTilt * -80);
    }
    sideSpinRPM = Math.max(-4500, Math.min(4500, sideSpinRPM));
    let dampening = Math.max(0.25, 1 - (Math.abs(sideSpinRPM) / 20000)); // v4.88.0 Dampening from final sideSpinRPM
    
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

    let potentialDist = club.baseDistance * (finalPower / 100) * currentStyle.distMod * lieMod * loftDistMod * chokeMod;
    let totalDistance = Math.round(potentialDist * dampening * hingeDistanceMod); // v4.88.0 hingeDistanceMod replaces hinge exponential

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
    // v4.83.0 Z-Axis Hang Time Modifier
    let flightElevDiff = (typeof targetZ !== 'undefined' && typeof ballZ !== 'undefined') ? (targetZ - ballZ) : 0;
    hangTimeSecs -= (flightElevDiff * 0.04);
    hangTimeSecs = Math.max(0.5, Math.min(8, hangTimeSecs)); // Expanded max to 8s for deep downhill drops
    // v4.80.0 Aerodynamic Transformation
    const targetAngleRad = Math.atan2(targetX - ballX, targetY - ballY); 
    const userAimRad = aimAngle * (Math.PI / 180); 
    const finalRad = targetAngleRad + userAimRad; 

    let relWindY = (windY * Math.cos(finalRad)) + (windX * Math.sin(finalRad));
    let relWindX = (windX * Math.cos(finalRad)) - (windY * Math.sin(finalRad));

    let baseWindY = relWindY * (hangTimeSecs / 2.5) * currentStyle.windMod;
    let baseWindX = relWindX * (hangTimeSecs / 2.5) * currentStyle.windMod;
    let gyroMod = Math.max(0.6, Math.min(1.3, 1 - ((backspinRPM - 4000) / 10000)));
    let spinWindInteraction = (relWindX * sideSpinRPM) / 10000; 

    let windYEffect = Math.round(baseWindY * gyroMod);
    let windXEffect = Math.round((baseWindX * gyroMod) + spinWindInteraction);

    // v4.41.0 Natural Dispersion Circle (Base Scatter)
    const isPutt = club.name === "Putter";
    let scatterMult = 1.0;
    if (focusIndex === 4) scatterMult = Math.max(0.0, 1.0 - (0.5 * focusEffect)); // Accuracy Focus cuts scatter

    // Apply +/- 1.5% distance scatter
    let distScatterMod = 1.0 + (((Math.random() * 0.03) - 0.015) * scatterMult);
    if (!isPutt) totalDistance = Math.round(totalDistance * distScatterMod);

    // Apply +/- 5% of maxDispersion lateral scatter
    let naturalLatScatter = isPutt ? 0 : ((Math.random() * 0.1) - 0.05) * club.maxDispersion * scatterMult;

    let physicsX = isPutt ? 0 : ((sideSpinRPM / 2400) * (club.maxDispersion * (typeof lieDispersionMod !== 'undefined' ? lieDispersionMod : 1) * pressureDispersion)) + naturalLatScatter;
    let lateralTotal = physicsX + windXEffect;

    const moveY = Math.cos(finalRad) * totalDistance - Math.sin(finalRad) * lateralTotal;
    const moveX = Math.sin(finalRad) * totalDistance + Math.cos(finalRad) * lateralTotal;

    const shotOriginDistToPin = calculateDistanceToPin(); // v5.45.0 Chip-In Reference
    ballY += moveY;
    ballX += moveX;

    let lateralKick = Math.round((sideSpinRPM / 350) * activeRollMod);
    ballY -= Math.sin(finalRad) * lateralKick;
    ballX += Math.cos(finalRad) * lateralKick;

    // Backspin affects rollout: every 1000 RPM above 4000 reduces roll by 10%
    let spinRollMod = Math.max(0.1, 1 - ((backspinRPM - 4000) / 10000));
    let rollDistance = Math.round(totalDistance * club.rollPct * activeRollMod * spinRollMod);
    let lateralKickX = 0, lateralKickY = 0;
    // v4.81.0 Dynamic 3D Green Topography Engine
    {
        let _approxCarry = Math.max(0, totalDistance - rollDistance);
        let topoLandX = (ballX - moveX) + (_approxCarry * Math.sin(finalRad));
        let topoLandY = (ballY - moveY) + (_approxCarry * Math.cos(finalRad));
        let distToPinAtLand = Math.sqrt(Math.pow(pinX - topoLandX, 2) + Math.pow(pinY - topoLandY, 2));

        if (gameMode === 'course') {
            const holeData = window.currentCourse.holes[hole - 1];
            if (distToPinAtLand <= (holeData.greenRadius || 20) && holeData.greenType && typeof window.greenDictionary !== 'undefined') {
                let activeContours = window.greenDictionary[holeData.greenType] || [];
                let zone = activeContours.find(z => distToPinAtLand <= z.startY && distToPinAtLand > z.endY);
                if (zone) {
                    let globalSlopeY = zone.slopeY;
                    let globalSlopeX = zone.slopeX;

                    // Rotate global slopes into the player's flight vector
                    let relSlopeY = (globalSlopeY * Math.cos(finalRad)) + (globalSlopeX * Math.sin(finalRad));
                    let relSlopeX = -((globalSlopeX * Math.cos(finalRad)) - (globalSlopeY * Math.sin(finalRad)));

                    landingSlope = relSlopeY * 40; // Convert to degrees for roll modifier

                    // Calculate lateral kick (drags the ball sideways during roll)
                    let kickMagnitude = relSlopeX * rollDistance * 0.85;
                    let perpRad = finalRad + (Math.PI / 2);
                    lateralKickX = kickMagnitude * Math.sin(perpRad);
                    lateralKickY = kickMagnitude * Math.cos(perpRad);
                }
            }
        }
    }
    ballX += lateralKickX;
    ballY += lateralKickY;
    // v4.80.0 Slope Roll Math
    if (typeof landingSlope !== 'undefined' && landingSlope !== 0) {
        // 5% change in roll distance per degree of slope
        rollDistance *= (1 - (landingSlope * 0.05));
    }
    let carryDistance = Math.max(0, totalDistance - rollDistance);

    // Ensure Wedges and 9-Irons can spin back/stop dead
    let isWedge = club.name.includes("Wedge") || club.name === "9 Iron";
    if (!isWedge && (currentStyle.name.includes("Chip") || currentStyle.name.includes("Pitch"))) {
        let minRoll = carryDistance * 0.1;
        if (rollDistance < minRoll) rollDistance = Math.round(minRoll);
    }
    carryDistance = Math.max(0, totalDistance - rollDistance);
    if (focusIndex === 1 && Math.abs(hingeDiff) <= 50) carryDistance *= 1.10;
    // v4.80.0 Elevation Math
    let elevationDiff = (typeof targetZ !== 'undefined' && typeof ballZ !== 'undefined') ? (targetZ - ballZ) : 0;
    carryDistance -= elevationDiff; // Uphill reduces carry, downhill extends carry
    carryDistance = Math.max(0, carryDistance);
    // v4.80.0 Apply missing relative wind effect to carry
    carryDistance += windYEffect; 
    carryDistance = Math.max(0, carryDistance);
    // v4.80.0 Driver Off Deck Physics Penalty
    if (club.name === "Driver" && currentLie === "Fairway") {
        carryDistance *= 0.7; // Low launch
        rollDistance *= 1.5;  // Hot roll
        sideSpinRPM *= 2.5;   // Severe slice/hook exacerbation
    }
    carryDistance = Math.round(carryDistance);
    totalDistance = carryDistance + rollDistance;
    let lateralX = Math.round((physicsX + windXEffect + lateralKick) * 10) / 10;

    const startX = ballX - moveX;
    const startY = ballY - moveY;

    let flightPathNarrative = "";

    // v5.84.3 The Acorn Dome Interceptor (Relocated for true physics alteration)
    window.skipDuckEvent = false;
    if (typeof window.currentCourse !== 'undefined' && window.currentCourse.name === "The Pasture" && hole === 15) {
        let apexHeight = carryDistance > 0 ? Math.tan(dynamicLoft * Math.PI / 180) * carryDistance / 4 : 0;
        if (apexHeight > 6.66) {
            let penaltyMod = 0.50 + (Math.random() * 0.10); 
            carryDistance = Math.round(carryDistance * penaltyMod);
            rollDistance = Math.round(rollDistance * 0.2); 
            totalDistance = carryDistance + rollDistance; // Resync true total distance

            let bounceMsg = "INCOMING! The ball crossed the 20-foot airspace and was shot down by an acorn missile!";
            flightPathNarrative = flightPathNarrative ? flightPathNarrative + " " + bounceMsg : bounceMsg;

            let delayMs = (hangTimeSecs * 0.2) * 1000; 
            let missileFile = 'missile_0c';
            if (lateralX < -15) missileFile = 'missile_80l';
            else if (lateralX >= -15 && lateralX < -3) missileFile = 'missile_40l';
            else if (lateralX > 3 && lateralX <= 15) missileFile = 'missile_40r';
            else if (lateralX > 15) missileFile = 'missile_80r';

            let timeoutId = setTimeout(() => {
                if (typeof audioCtx !== 'undefined' && audioCtx) {
                    let audioEl = new Audio('audio/courses/pasture/' + missileFile + '.mp3');
                    audioEl.volume = typeof window.ambientVolumeLevels !== 'undefined' ? window.ambientVolumeLevels[window.ambientVolumeIndex] : 1.0;
                    audioEl.play().catch(e => {});
                } else {
                    new Audio('audio/courses/pasture/' + missileFile + '.mp3').play().catch(e => {});
                }
            }, delayMs);
            if (typeof window.stateTimeouts !== 'undefined') window.stateTimeouts.push(timeoutId);
            
            window.skipDuckEvent = true; 
        }
    }

    // v5.90.1 Continuous Path Magnetic Interceptor (One-Zap Limit & Float Truncation)
    if (typeof window.currentCourse !== 'undefined' && window.currentCourse.holes[hole - 1].towers) {
        let pActive = typeof players !== 'undefined' && players.length > 0 ? players[currentPlayerIndex] : window;
        if (strokes === 1) pActive.zappedThisHole = false;

        if (!pActive.zappedThisHole) {
            let currentHole = window.currentCourse.holes[hole - 1];
            let oY = Math.cos(finalRad) * carryDistance;
            let oX = Math.sin(finalRad) * carryDistance + (typeof lateralX !== 'undefined' ? lateralX : 0);
            
            let isZapped = false;
            let zapFraction = 0;
            let zapTower = null;
            let zapIsAir = true;
            let zapX = 0;

            for (let i = 0; i < currentHole.towers.length; i++) {
                let t = currentHole.towers[i];
                
                // 1. Check Air Path (Carry)
                let steps = Math.ceil(carryDistance);
                for (let s = 1; s <= steps; s++) {
                    let frac = s / carryDistance;
                    let cx = startX + (oX * frac);
                    let cy = startY + (oY * frac);
                    if (Math.sqrt(Math.pow(cx - t.x, 2) + Math.pow(cy - t.y, 2)) <= t.radius) {
                        isZapped = true; zapFraction = frac; zapTower = t; zapIsAir = true; zapX = cx;
                        break;
                    }
                }
                if (isZapped) break;

                // 2. Check Ground Path (Roll)
                let landProjX = startX + oX;
                let landProjY = startY + oY;
                let finalProjX = startX + (Math.sin(finalRad) * totalDistance) + (Math.cos(finalRad) * lateralTotal) + lateralKickX;
                let finalProjY = startY + (Math.cos(finalRad) * totalDistance) - (Math.sin(finalRad) * lateralTotal) + lateralKickY;

                let rSteps = Math.ceil(rollDistance);
                if (rSteps > 0) {
                    for (let s = 1; s <= rSteps; s++) {
                        let frac = s / rollDistance;
                        let cx = landProjX + ((finalProjX - landProjX) * frac);
                        let cy = landProjY + ((finalProjY - landProjY) * frac);
                        if (Math.sqrt(Math.pow(cx - t.x, 2) + Math.pow(cy - t.y, 2)) <= t.radius) {
                            isZapped = true; zapFraction = frac; zapTower = t; zapIsAir = false; zapX = cx;
                            break;
                        }
                    }
                }
                if (isZapped) break;
            }

            if (isZapped) {
                pActive.zappedThisHole = true; // Immunity granted for next shot
                
                let sideName = zapTower.x < 0 ? "left" : "right";
                let bounceMsg = "";

                // Scale laterals and truncate floats to prevent telemetry spam
                lateralTotal *= zapFraction;
                lateralKickX *= zapFraction;
                lateralKickY *= zapFraction;
                physicsX *= zapFraction;
                windXEffect = Math.round(windXEffect * zapFraction);

                if (zapIsAir) {
                    carryDistance = Math.round(carryDistance * zapFraction);
                    rollDistance = 0;
                    totalDistance = carryDistance;
                    bounceMsg = `BZZZZT! The ball flew into the magnetic field of the ${sideName} high-voltage tower and was instantly zapped out of the sky!`;
                } else {
                    rollDistance = Math.round(rollDistance * zapFraction);
                    totalDistance = carryDistance + rollDistance;
                    bounceMsg = `BZZZZT! The ball rolled directly into the magnetic field of the ${sideName} high-voltage tower and was instantly fried into the turf!`;
                }
                
                flightPathNarrative = flightPathNarrative ? flightPathNarrative + " " + bounceMsg : bounceMsg;
                
                let delayMs = zapIsAir ? ((hangTimeSecs * zapFraction) * 1000) : (hangTimeSecs * 1000) + ((rollDistance / 10) * zapFraction * 1000);
                let panValue = Math.max(-1, Math.min(1, zapX / 25));
                
                let timeoutId = setTimeout(() => {
                    // v5.89.3 Custom Zap Audio Grab-Bag (4 Files)
                    if (typeof quick === 'undefined' || !quick) {
                        window.zapSounds = window.zapSounds || ['electricity_zap1', 'electricity_zap2', 'electricity_zap3', 'electricity_zap4'];
                        window.zapSounds.sort(() => Math.random() - 0.5);
                        let zapFile = window.zapSounds.pop() || 'electricity_zap1';
                        if (window.zapSounds.length === 0) window.zapSounds = ['electricity_zap1', 'electricity_zap2', 'electricity_zap3', 'electricity_zap4'];
                        
                        let vol = typeof window.ambientVolumeLevels !== 'undefined' ? window.ambientVolumeLevels[window.ambientVolumeIndex] : 1.0;
                        
                        if (typeof audioCtx !== 'undefined' && audioCtx) {
                            let zapAudio = new Audio(`audio/courses/pasture/${zapFile}.mp3`);
                            zapAudio.volume = vol;
                            let source = audioCtx.createMediaElementSource(zapAudio);
                            let panner = audioCtx.createStereoPanner();
                            panner.pan.value = panValue;
                            source.connect(panner);
                            panner.connect(audioCtx.destination);
                            zapAudio.play().catch(e => {});
                        } else {
                            let zapAudio = new Audio(`audio/courses/pasture/${zapFile}.mp3`);
                            zapAudio.volume = vol;
                            zapAudio.play().catch(e => {});
                        }
                    }
                    
                    if (typeof window.hotSwapAmbient === 'function') {
                        window.hotSwapAmbient('audio/courses/pasture/am_farm1.mp3');
                    }
                }, delayMs);
                if (typeof window.stateTimeouts !== 'undefined') window.stateTimeouts.push(timeoutId);
            }
        }
    }

    // v5.44.2 Absolute Coordinate Resync
    ballX = startX + (Math.sin(finalRad) * totalDistance) + (Math.cos(finalRad) * lateralTotal) + lateralKickX;
    ballY = startY + (Math.cos(finalRad) * totalDistance) - (Math.sin(finalRad) * lateralTotal) + lateralKickY;

    const landX = startX + (Math.sin(finalRad) * carryDistance + Math.cos(finalRad) * (physicsX + windXEffect));
    const landY = startY + (Math.cos(finalRad) * carryDistance - Math.sin(finalRad) * (physicsX + windXEffect));

    const contactLabel = hingeDiff < -60 ? "Thin" : hingeDiff > 60 ? "Fat" : "Flushed";
    const loftDiff = dynamicLoft - club.loft;
    const trajectoryLabel = loftDiff < -8 ? "piercing" : loftDiff < -3 ? "low" : loftDiff > 8 ? "towering" : loftDiff > 3 ? "high" : "standard";
    const shapeLabel = sideSpinRPM < -2500 ? "snap hook" : sideSpinRPM < -1000 ? "hook" : sideSpinRPM < -250 ? "draw" : sideSpinRPM > 2500 ? "banana slice" : sideSpinRPM > 1000 ? "slice" : sideSpinRPM > 250 ? "fade" : "straight shot";
    const shotShapeNarrative = `A ${trajectoryLabel} ${shapeLabel}`;

    const currentHole = window.currentCourse.holes[hole - 1];
    let treeCollisionReport = "";

    let treeResult = window.resolveTreeCollisions({
        gameMode, synthTreeActive, synthTreeDist, synthTreeX, synthTreeHeight,
        carryDistance, totalDistance, rollDistance, ballX, ballY,
        startX, startY, landX, landY, dynamicLoft, hangTimeSecs,
        shotShapeNarrative, finalRad, physicsX, windXEffect,
        currentHole, stateTimeouts, flightPathNarrative, treeCollisionReport
    });
    ({ carryDistance, totalDistance, rollDistance, ballX, ballY, flightPathNarrative, treeCollisionReport } = treeResult);

    let distanceToPin = calculateDistanceToPin();
    const holeData = window.currentCourse.holes[hole - 1];

    let hazardResult = window.resolveHazardLie({
        gameMode, rangeTargetLie, ballX, ballY, moveX, moveY,
        carryDistance, totalDistance, rollDistance, flightPathNarrative,
        holeData, activeFairwayWidth, distanceToPin, strokes,
        players, currentPlayerIndex, isBotTurn
    });
    currentLie = hazardResult.currentLie;

    // v5.65.0 Hole 8 Toilet Reward Intercept (Post-Math Evaluation)
    if (!quick && typeof window.currentCourse !== 'undefined' && window.currentCourse.name === "The Pasture" && typeof hole !== 'undefined' && hole === 8 && typeof strokes !== 'undefined' && strokes === 1 && currentLie === "Green") {
        if (typeof stateTimeouts !== 'undefined') {
            stateTimeouts.push(setTimeout(() => {
                if (typeof window.triggerToiletEvent === 'function') window.triggerToiletEvent();
            }, 800));
        }
    }

    let inWater = hazardResult.inWater;
    let rollStopTriggered = hazardResult.rollStopTriggered;
    ballX = hazardResult.ballX;
    ballY = hazardResult.ballY;
    rollDistance = hazardResult.rollDistance;
    totalDistance = hazardResult.totalDistance;
    strokes = hazardResult.strokes;
    flightPathNarrative = hazardResult.flightPathNarrative;
    // v4.36.1 Linear Touch Magnetism (Approach/Hole-Out Logic)
    let isHoleOut = false;
    if ((gameMode === 'course' || gameMode === 'chipping') && currentLie === "Green" && club.name !== "Putter") {
        const finalRelY = ballY - pinY;
        const finalRelX = ballX - pinX;
        const finalDistToPin = Math.sqrt(Math.pow(finalRelX, 2) + Math.pow(finalRelY, 2));

        // v5.45.0 Tier 4: Chip-In Gravity Well / Touch Focus Hole-Out
        let touchBonus = 1.0;
        if (shotOriginDistToPin < 60 && accuracyScore >= 95 && Math.abs(hingeDiff) <= 15) {
            touchBonus = 6.0; // Tier 4: Chip-in gravity well
        } else if (focusIndex === 2) {
            touchBonus = Math.max(0.5, 1.0 + (2.0 * focusEffect)); // Max 3.0x, Min 0.5x
        }

        let diffScale = typeof difficultyLevels !== 'undefined' ? difficultyLevels[difficultyIndex] : { impactMod: 1.0 };
        let captureRadius = 0.15 * touchBonus * diffScale.impactMod; 

        if (finalDistToPin <= captureRadius && accuracyScore >= 90) { // Require a solid strike
            isHoleOut = true;
            isHoleComplete = true;
            ballX = pinX;
            ballY = pinY;
            currentLie = "Hole";
            if (!quick) {
                window.cupSounds = window.cupSounds || ['cup1', 'cup2', 'cup3', 'cup4', 'cup5', 'cup6'];
                window.cupSounds.sort(() => Math.random() - 0.5);
                let cupFile = window.cupSounds.pop() || 'cup1';
                if (window.cupSounds.length === 0) window.cupSounds = ['cup1', 'cup2', 'cup3', 'cup4', 'cup5', 'cup6'];
                let vol = typeof window.ambientVolumeLevels !== 'undefined' ? window.ambientVolumeLevels[window.ambientVolumeIndex] : 1.0;
                let cupAudio = new Audio(`audio/swings/${cupFile}.mp3`);
                cupAudio.volume = vol;
                cupAudio.play().catch(e=>{});
            }
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
    if (!quick) playNoise(hangTimeSecs + 0.3, 0.3, false);

    // v5.43.1 Hole 6 Wind Gust Audio (safe: totalDistance fully resolved)
    if (gameMode === 'course' && window.currentCourse && window.currentCourse.name === "The Pasture" && hole === 6 && typeof totalDistance !== 'undefined' && totalDistance > 25 && currentLie !== "Green" && !quick) {
        let gustNum = Math.floor(Math.random() * 6) + 1;
        let gustAudio = new Audio(`audio/swings/wind_gust${gustNum}.mp3`);
        gustAudio.volume = (typeof window.ambientVolumeLevels !== 'undefined' ? window.ambientVolumeLevels[window.ambientVolumeIndex] : 1.0);
        stateTimeouts.push(setTimeout(() => {
            gustAudio.play().catch(e => console.warn("Gust audio missing:", e));
        }, 600));
    }

    // v5.65.0 Duck Mishap Intercept (v5.84.3: guarded by skipDuckEvent set in Acorn Dome)
    // v6.01.0 Extended with Dynamic Character Voice Registry
    if (accuracyScore < 80 && !quick && !window.skipDuckEvent) {
        if (typeof window.triggerDuckEvent === 'function') window.triggerDuckEvent();
    } else {
        const flushThresh = 90;
        let pName = typeof players !== 'undefined' && players.length > 0 ? players[currentPlayerIndex].name : "Player";
        let voicePrefix = typeof window.audioVoices !== 'undefined' ? window.audioVoices[pName] : null;
        
        if (voicePrefix) {
            let isFlushed = accuracyScore >= flushThresh;
            
            // Initialize personal grab bags if they don't exist yet
            if (typeof window.botAudioBags === 'undefined') window.botAudioBags = {};
            if (!window.botAudioBags[pName]) {
                window.botAudioBags[pName] = {
                    dartsGood: [1,2,3,4,5,6].map(n => `${voicePrefix}_gdart${n}`),
                    dartsAverage: [1,2,3,4,5,6].map(n => `${voicePrefix}_adart${n}`),
                    approachesGood: [1,2,3,4,5,6].map(n => `${voicePrefix}_gapproach${n}`),
                    approachesAverage: [1,2,3,4,5,6].map(n => `${voicePrefix}_aapproach${n}`),
                    drivesGood: [1,2,3,4,5,6].map(n => `${voicePrefix}_gdrive${n}`),
                    drivesAverage: [1,2,3,4,5,6].map(n => `${voicePrefix}_adrive${n}`)
                };
            }
            
            let myBags = window.botAudioBags[pName];
            let activeBagName = null;
            let finalDistToPin = Math.sqrt(Math.pow(ballX - pinX, 2) + Math.pow(ballY - pinY, 2));
            
            // 1. Darts (< 8 yards to pin)
            if (finalDistToPin <= 8 && !inWater && currentLie !== 'Sand' && currentLie !== 'Rough' && currentLie !== 'Mud' && currentLie !== 'Manure') {
                activeBagName = isFlushed ? 'dartsGood' : 'dartsAverage';
            } 
            // 2. Approaches (> 80 yards out, lands safely on green)
            else if (distanceToPin >= 80 && currentLie === 'Green') {
                activeBagName = isFlushed ? 'approachesGood' : 'approachesAverage';
            }
            // 3. Drives (Stroke 1, lands in fairway)
            else if (strokes === 1 && currentLie === 'Fairway') {
                activeBagName = isFlushed ? 'drivesGood' : 'drivesAverage';
            }

            if (activeBagName) {
                let bag = myBags[activeBagName];
                bag.sort(() => Math.random() - 0.5);
                let audioFile = bag.pop();
                
                if (bag.length === 0) {
                    // Dynamically refill the empty bag
                    let fileKey = activeBagName.includes('dart') ? 'dart' : activeBagName.includes('approach') ? 'approach' : 'drive';
                    let tierKey = activeBagName.includes('Good') ? 'g' : 'a';
                    myBags[activeBagName] = [1,2,3,4,5,6].map(n => `${voicePrefix}_${tierKey}${fileKey}${n}`);
                }
                
                let vol = typeof window.ambientVolumeLevels !== 'undefined' ? window.ambientVolumeLevels[window.ambientVolumeIndex] : 1.0;
                let commentAudio = new Audio(`audio/bots/${audioFile}.mp3`);
                commentAudio.volume = vol;
                commentAudio.play().catch(e=>{});
            }
        }
    } // Close anticipatory audio else block

    // v4.31.3 Live 3D Audio Flight Injection
    // Calculate final lateral drift (35 yards offline = 100% hard pan into one ear)
    let endPan = Math.max(-1, Math.min(1, lateralTotal / 35)); 
    if (!quick && typeof window.trigger3DFlight === 'function') {
        window.trigger3DFlight(hangTimeSecs, dynamicLoft, 0.0, endPan, ballTypes[activeBallIndex]);
    }

    // v4.19.4 Track flight timeout
    let shotDurationMs = quick ? 5 : hangTimeSecs * 1000; // v4.86.0 Simulate Bypass
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
        let isMud = currentLie === "Mud" || currentLie === "Manure";
        let rollTimeSecs = Math.max(0, Math.abs(rollDistance) / 10);
        let caddyDelayMs = 500;

        if (currentLie === "Green" && !isWater) {
            rollTimeSecs = Math.max(3.0, Math.min(6.0, Math.abs(rollDistance) / 3));
            caddyDelayMs = 1000;
        }

        if (isWater || isMud) {
            rollTimeSecs = 0;
            bounceSequenceMs = 400;
            if (!quick) {
                if (isWater) {
                    if (typeof window.playGolfSound === 'function') window.playGolfSound('hazard_05');
                    else if (typeof window.playSplash === 'function') window.playSplash(0.5);
                } else if (isMud) {
                    window.mudSounds = window.mudSounds || ['mud_rock_small1', 'mud_rock_small2', 'mud_rock_small3', 'mud_rock_small4', 'mud_rock_small5', 'mud_rock_small6'];
                    window.mudSounds.sort(() => Math.random() - 0.5);
                    let mudFile = window.mudSounds.pop() || 'mud_rock_small1';
                    if (window.mudSounds.length === 0) window.mudSounds = ['mud_rock_small1', 'mud_rock_small2', 'mud_rock_small3', 'mud_rock_small4', 'mud_rock_small5', 'mud_rock_small6'];

                    if (typeof audioCtx !== 'undefined' && audioCtx) {
                        let mudAudio = new Audio('audio/courses/pasture/' + mudFile + '.mp3');
                        mudAudio.volume = typeof window.ambientVolumeLevels !== 'undefined' ? window.ambientVolumeLevels[window.ambientVolumeIndex] : 1.0;
                        let source = audioCtx.createMediaElementSource(mudAudio);
                        let panner = audioCtx.createStereoPanner();
                        panner.pan.value = endPan;
                        source.connect(panner);
                        panner.connect(audioCtx.destination);
                        mudAudio.play().catch(e=>{});
                    } else {
                        new Audio('audio/courses/pasture/' + mudFile + '.mp3').play().catch(e=>{});
                    }
                }
            }
        } else {
            // Only bounce and roll if NOT in water
            if (!quick) bounceOffsets.forEach((bounceOffsetMs, bounceIndex) => {
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
                        if (!quick && typeof window.playPannedGreenRoll === 'function') {
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
            const roughDesc = isStartingInRough ? "Hacked it out of the rough. " : "";
            let kickDesc = lateralKick === 0 ? "rolls straight" : `kicks ${Math.abs(lateralKick)} yds ${lateralKick > 0 ? 'right' : 'left'}`;

            // v5.46.2 Shadow Origin Fix
            const landX = startX + (Math.sin(finalRad) * carryDistance + Math.cos(finalRad) * (physicsX + windXEffect));
            const landY = startY + (Math.cos(finalRad) * carryDistance - Math.sin(finalRad) * (physicsX + windXEffect));
            const landDistToPin = Math.sqrt(Math.pow(pinX - landX, 2) + Math.pow(pinY - landY, 2));
            const greenSize = holeData.greenRadius || 20;

            let proximityDesc = `Settles in the ${currentLie}, ${dirStr}.`;
            
            // Trigger precision reporting if on the green OR if it landed on the green
            if (currentLie === "Green" || landDistToPin <= greenSize) {
                // v5.46.1 Relative Proximity Math (Dot/Cross Products)
                let vX = pinX - startX;
                let vY = pinY - startY;
                let vMag = Math.sqrt(vX*vX + vY*vY) || 1;

                let bLandX = landX - startX;
                let bLandY = landY - startY;
                let landDot = (vX * bLandX) + (vY * bLandY);
                let landCross = (vX * bLandY) - (vY * bLandX);

                const landRelY = (landDot / vMag) - vMag; // Positive = Long, Negative = Short
                const landRelX = landCross / vMag;        // Positive = Right, Negative = Left

                let bFinalX = ballX - startX;
                let bFinalY = ballY - startY;
                let finalDot = (vX * bFinalX) + (vY * bFinalY);
                let finalCross = (vX * bFinalY) - (vY * bFinalX);

                const finalRelY = (finalDot / vMag) - vMag;
                const finalRelX = finalCross / vMag;
                const finalDistToPin = Math.sqrt(Math.pow(ballX - pinX, 2) + Math.pow(ballY - pinY, 2));

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

            const chokeStr = typeof isChokedDown !== 'undefined' && isChokedDown ? " (Choked 90%)" : "";
            const shotBroadcast = `### ${pName}\n**Club:** ${club.name}\n**Result:** ${roughDesc}${shotDesc} ${windDesc} Carries ${carryDistance}, rolls ${rollDistance} forward and ${kickDesc} for a total of ${totalDistance}. ${proximityDesc}`;
            let envMetrics = (typeof synthTreeActive !== 'undefined' && synthTreeActive) ? `* **Environment:** Synth Tree at ${synthTreeDist}y, X:${synthTreeX}, Height:${Math.round(synthTreeHeight)}ft\n` : "";
            const execMetrics = `* **Execution:** Power ${finalPower}%. Hinge Diff ${hingeDiff}ms. Impact Offset ${impactDiff}ms. Accuracy Score ${accuracyScore}%. Backspin: ${backspinRPM} RPM. Side Spin: ${sideSpinRPM} RPM (${sideSpinShape}).\n${treeCollisionReport}`;
            const metrics = `**Telemetry**\n* **Setup:** ${club.name}${chokeStr} | Style: ${currentStyle.name} | Focus: ${focusModes[focusIndex].name} | Stance: ${stanceNames[stanceIndex]} / ${alignmentNames[stanceAlignment + 2]} | Aim: ${aimAngle}° | Wind: Y:${windY} X:${windX}\n${envMetrics}${execMetrics}`;

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
                    let delayAnnounceMs = 0;
                    if (!quick) {
                        let vol = typeof window.ambientVolumeLevels !== 'undefined' ? window.ambientVolumeLevels[window.ambientVolumeIndex] : 1.0;
                        delayAnnounceMs = window.playScoringAudioSequence(strokes, par, vol);
                    }

                    const completionMessage = `Hole complete! ${shotBroadcast} You reached the green in ${strokes} strokes.`;
                    lastShotReport = completionMessage + "\n\nTelemetry:\n" + metrics;
                    holeTelemetry.push(lastShotReport);

                    stateTimeouts.push(setTimeout(() => {
                        if (!quick) window.announce(completionMessage);
                        if (!quick) window.setCaddyPanelText(lastShotReport);
                    }, delayAnnounceMs));

                    stateTimeouts.push(setTimeout(() => {
                        window.advanceTurn();
                    }, delayAnnounceMs));
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
                        let broadcast = `${shotBroadcast} Stroke ${strokes + 1}${penaltyStr} ${distanceToPin} yards to the pin.`;
                        
                        // Track the Caddy/Transition sequence
                        stateTimeouts.push(setTimeout(() => {
                            // v5.1.0 Auto Rules Engines
                            if (!isHoleComplete && gameMode === 'course') {
                                let remainingDist = calculateDistanceToPin();

                                // Auto-Gimme
                                if (isPutting && wizardGimmes > 1) {
                                    let thresh = wizardGimmes === 2 ? 1.0 : 2.0; // 3ft or 6ft
                                    if (remainingDist <= thresh) {
                                        strokes++; puttsThisHole++; isHoleComplete = true;
                                        let feetStr = Math.round(remainingDist * 3);
                                        broadcast += ` That's inside the leather. Gimme taken from ${feetStr} feet. Hole complete.`;
                                    }
                                }

                                // Auto-Max Score
                                if (!isHoleComplete && wizardMaxScore > 0) {
                                    let limit = wizardMaxScore === 1 ? par * 2 : 8;
                                    if (strokes >= limit) {
                                        isHoleComplete = true;
                                        broadcast += ` Reached max score of ${limit}. Hole complete.`;
                                    }
                                }
                            }

                            let delayAnnounceMs = 0;
                            if (isHoleComplete && !quick) {
                                let vol = typeof window.ambientVolumeLevels !== 'undefined' ? window.ambientVolumeLevels[window.ambientVolumeIndex] : 1.0;
                                delayAnnounceMs = window.playScoringAudioSequence(strokes, par, vol);
                            }

                            stateTimeouts.push(setTimeout(() => {
                                document.getElementById('visual-output').innerText = broadcast;
                                lastShotReport = broadcast + "\n\nTelemetry:\n" + metrics;
                                holeTelemetry.push(lastShotReport);

                                // v5.56.0 Dynamic Caddy Yield
                                if (typeof window.waitForDuckToClear === 'function') {
                                    window.waitForDuckToClear(() => {
                                        if (typeof pacingModeIndex !== 'undefined' && pacingModes[pacingModeIndex] === 'Simulate') {
                                            // Suppress
                                        } else {
                                            window.setCaddyPanelText(lastShotReport);
                                            window.announce(broadcast);
                                        }
                                    });
                                } else {
                                    if (typeof pacingModeIndex !== 'undefined' && pacingModes[pacingModeIndex] === 'Simulate') {
                                        // Suppress
                                    } else {
                                        window.setCaddyPanelText(lastShotReport);
                                        window.announce(broadcast);
                                    }
                                }
                            }, delayAnnounceMs));

                            if (gameMode === 'course' && currentLie === "Green") {
                                if (!quick) { playTone(440, 'sine', 0.1, 0.5); stateTimeouts.push(setTimeout(() => playTone(554, 'sine', 0.1, 0.5), 150)); stateTimeouts.push(setTimeout(() => playTone(659, 'sine', 0.2, 0.5), 300)); }
                                stateTimeouts.push(setTimeout(() => {
                                    window.initPutting();
                                    window.advanceTurn(true);
                                }, quick ? 0 : 3500 + delayAnnounceMs));
                            } else {
                                if (gameMode === 'course') window.updateTargetZone();
                                driftWind(); aimAngle = 0; stanceIndex = 2; stanceAlignment = 0; swingState = 0; isPutting = false; isChokedDown = false;

                                // v4.45.1 ARIA Interruption Fix (Wait 4 seconds before advancing turn)
                                stateTimeouts.push(setTimeout(() => {
                                    window.advanceTurn();
                                }, quick ? 0 : 4000 + delayAnnounceMs));
                            }
                        }, quick ? 0 : (typeof isPutting !== 'undefined' && isPutting && club.name === "Putter" && strokes > 1 ? 1500 : 0)));
                        // Track the Auto-Save delay
                        stateTimeouts.push(setTimeout(() => {
                            shotStyleIndex = 0; // v4.19.7 Reset style to Normal after shot completion
                            if (typeof window.saveGame === 'function') window.saveGame();
                        }, 2000));
                    }
                }
            }
        }, quick ? 5 : bounceSequenceMs + (rollTimeSecs * 1000) + caddyDelayMs));

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

    }, shotDurationMs));
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

// v5.60.0 3D Auto-Equip
window.autoEquipBestClub = function() {
    let distToTarget = calculateDistanceToTarget();
    let elevationDiff = (typeof targetZ !== 'undefined' && typeof ballZ !== 'undefined') ? (targetZ - ballZ) : 0;
    let effectiveDistToTarget = distToTarget + elevationDiff;
    
    // v5.79.0 Comprehensive Auto-Equip Lie Multipliers
    let lieMultiplier = 1.0;
    if (currentLie === 'Sand') lieMultiplier = 0.70;
    else if (currentLie === 'Pine Needles') lieMultiplier = 0.90;
    else if (currentLie === 'Packed Earth') lieMultiplier = 0.95;
    else if (currentLie === 'Mud' || currentLie === 'Manure') lieMultiplier = 0.60;
    else if (currentLie.includes('Rough')) {
        let rIndex = typeof roughConditionIndex !== 'undefined' ? roughConditionIndex : 1;
        lieMultiplier = (typeof roughConditions !== 'undefined' && roughConditions[rIndex]) ? (roughConditions[rIndex].penalty + 0.025) : 0.875;
    }
    let currentStyle = shotStyles[shotStyleIndex];
    let chokeMod = typeof isChokedDown !== 'undefined' && isChokedDown ? 0.9 : 1.0;
    let bestClubIndex = currentClubIndex;
    let smallestDiff = 9999;

    for (let i = 0; i < clubs.length; i++) {
        if (clubs[i].name === "Putter") continue;
        let dynamicLoft = Math.max(0, clubs[i].loft + currentStyle.loftMod + ((2 - stanceIndex) * 5));
        let loftDistMod = 1 + ((26 - dynamicLoft) * 0.005);
        let expectedDist = clubs[i].baseDistance * lieMultiplier * loftDistMod * chokeMod;

        let diff = Math.abs(expectedDist - effectiveDistToTarget);
        if (diff < smallestDiff) {
            smallestDiff = diff;
            bestClubIndex = i;
        }
    }
    currentClubIndex = bestClubIndex;
    club = clubs[currentClubIndex];
    // v5.104.0 Auto-Tee for Range
    if (typeof gameMode !== 'undefined' && gameMode === 'range') {
        if (club.name === 'Driver') { rangeLie = 'Tee'; currentLie = 'Tee'; }
        else if (typeof rangeLie !== 'undefined' && rangeLie === 'Tee') { rangeLie = 'Fairway'; currentLie = 'Fairway'; }
    }
    if (typeof window.autoSetFocus === 'function') window.autoSetFocus();
    window.updateDashboard();
};

window.autoSetFocus = function(isPuttingOverride = false) {
    if (typeof focusIndex === 'undefined') return;

    // 1. Putting Override
    if (isPuttingOverride || (typeof isPutting !== 'undefined' && isPutting) || currentLie === "Green") {
        focusIndex = 2; // Touch
        return;
    }

    let distToTarget = typeof calculateDistanceToTarget === 'function' ? calculateDistanceToTarget() : 999;

    // 2. Short Game (< 50 yards)
    if (distToTarget < 50) {
        focusIndex = 2; // Touch
        return;
    }

    // 3. Trouble Lies
    if (currentLie === 'Sand' || currentLie.includes('Rough') || currentLie === 'Pine Needles' || currentLie === 'Mud' || currentLie === 'Manure' || currentLie === 'Packed Earth') {
        focusIndex = 5; // Recovery
        return;
    }

    // 4. Club-Specific Logic
    if (typeof club !== 'undefined' && club) {
        if (club.name.includes("Wood") || club.name === "Driver") {
            let threeWood = typeof clubs !== 'undefined' ? clubs.find(c => c.name === "3 Wood") : null;
            let threeWoodMax = threeWood ? (threeWood.baseDistance * 1.1) : 250;

            if (distToTarget <= threeWoodMax) {
                focusIndex = 4; // Accuracy (Approaching green)
            } else {
                focusIndex = 1; // Power (Bombing)
            }
            return;
        }

        if (club.name.includes("Iron") || club.name.includes("Wedge")) {
            focusIndex = 4; // Accuracy
            return;
        }
    }

    focusIndex = 0; // Standard fallback
};

// v4.37.0 Terrain Probe Helper
window.getCaddyAdvice = function() {
    if (typeof caddyLevel !== 'undefined' && caddyLevel < 3) return "I can only read advanced telemetry at Level 3. Press Shift + A to upgrade me.";

    // --- PART 1: THE PUTTING ORACLE ---
    if (gameMode === 'putting' || ((gameMode === 'course' || gameMode === 'range') && currentLie === "Green")) {
        let distToPin = calculateDistanceToPin();
        const holeData = window.currentCourse.holes[hole - 1];
        let activeContours = [];
        if (gameMode === 'course' && holeData.greenType && typeof window.greenDictionary !== 'undefined') {
            activeContours = window.greenDictionary[holeData.greenType] || [];
        } else if (gameMode === 'putting') {
            activeContours = [
                { startY: 45, endY: 25, slopeX: 0.8, slopeY: 0.4 },
                { startY: 25, endY: 10, slopeX: -0.3, slopeY: 0.0 },
                { startY: 10, endY: 0, slopeX: 0.6, slopeY: -0.3 }
            ];
        }

        let bestAim = null; let bestPace = null;
        let bestMissDist = 9999; let bestMissAim = 0; let bestMissPace = distToPin;
        let tempoBonus = 1.0; // Standard hole size assumption
        let baseHoleRadius = 0.15;
        let activeHoleRadius = ((distToPin <= 2.0) ? (baseHoleRadius * 3.0) : baseHoleRadius) * tempoBonus;
        let slopeDampener = 1.0; // Oracle mirrors v5.45.0 uncapped break
        let baseHeading = Math.atan2(pinX - ballX, pinY - ballY);

        for (let p = Math.max(0.33, distToPin * 0.5); p <= distToPin * 3.0; p += 0.33) {
            for (let a = -45; a <= 45; a += 0.2) {
                let simX = ballX, simY = ballY;
                let effectivePace = p * (((typeof window.tournamentGreens !== 'undefined' && window.tournamentGreens) ? 13 : 10) / 10);
                let speedRemaining = effectivePace; let distTraveled = 0;
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

                if (!madeIt) {
                    let finalDistToHole = Math.sqrt(Math.pow(pinX - simX, 2) + Math.pow(pinY - simY, 2));
                    if (finalDistToHole <= activeHoleRadius && speedRemaining <= captureSpeedLimit) {
                        madeIt = true;
                    }
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
            let absAim = Math.abs(bestAim);
            let aimText = absAim < 0.1 ? "aim straight" : `aim ${absAim.toFixed(1)} degrees ${bestAim < 0 ? 'Left' : 'Right'}`;
            let isShort = distToPin <= 5.0;
            let unit = isShort ? "feet" : "yards";
            let paceDisplay = isShort ? `${Math.round(bestPace * 3)}` : `${bestPace}`;
            let distDisplay = isShort ? `${Math.round(distToPin * 3)}` : `${Math.round(distToPin)}`;
            return `[Oracle Putting]: ${distDisplay} ${unit}. To sink it with perfect timing, ${aimText} and hit it with ${paceDisplay} ${unit} of pace.`;
        } else {
            let safeAim = bestMissAim || 0;
            let safePace = bestMissPace || distToPin;
            let absAim = Math.abs(safeAim);
            let aimText = absAim < 0.1 ? "aim straight" : `aim ${absAim.toFixed(1)} degrees ${safeAim < 0 ? 'Left' : 'Right'}`;
            let isShort = distToPin <= 5.0;
            let unit = isShort ? "feet" : "yards";
            let paceDisplay = isShort ? `${Math.round(safePace * 3)}` : `${safePace.toFixed(1)}`;
            return `[Oracle Putting]: Cannot find a guaranteed make. Best lag option: ${aimText} and hit it with ${paceDisplay} ${unit} of pace.`;
        }
    }

    // --- PART 2: THE FAIRWAY ORACLE ---
    if (gameMode !== 'course' && gameMode !== 'range') return "Oracle mode is available on the course and Holo Range only.";
    
    const holeData = window.currentCourse.holes[hole - 1];
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
    let elevationDiff = (typeof targetZ !== 'undefined' && typeof ballZ !== 'undefined') ? (targetZ - ballZ) : 0; // v5.1.2

    const style = shotStyles[0]; // Oracle simulates standard full swings
    // v5.40.2 Mud / v5.77.0 Manure early-return
    if (currentLie === 'Mud' || currentLie === 'Manure') {
        let dynamicLoft = Math.max(0, club.loft + style.loftMod + ((2 - stanceIndex) * 5));
        let loftDistMod = 1 + ((26 - dynamicLoft) * 0.005);
        let baseCarry = club.baseDistance * style.distMod * loftDistMod;
        let minC = Math.round(baseCarry * 0.50);
        let maxC = Math.round(baseCarry * 0.70);
        return `Buried in thick mud. 100% power carries ${minC} to ${maxC} yards and stops dead. Massive dispersion expected.`;
    }
    let lieMultiplier = 1.0;
    if (currentLie === 'Sand') lieMultiplier = 0.70;
    else if (currentLie === 'Pine Needles') lieMultiplier = 0.90;
    else if (currentLie === 'Packed Earth') lieMultiplier = 0.95;
    else if (currentLie.includes('Rough')) {
        let rIndex = typeof roughConditionIndex !== 'undefined' ? roughConditionIndex : 1;
        lieMultiplier = (typeof roughConditions !== 'undefined' && roughConditions[rIndex]) ? (roughConditions[rIndex].penalty + 0.025) : 0.875;
    }

    const simulatedClubs = [];
    for (let i = 0; i < 14; i++) simulatedClubs.push(clubs[i % clubs.length]);

    let best = null;

    simulatedClubs.forEach(simClub => {
        if (simClub.name === "Putter") return; 
        
        for (let simStance = 0; simStance < 5; simStance++) {
            let dynamicLoft = Math.max(0, simClub.loft + style.loftMod + ((2 - simStance) * 5));
            let loftDistMod = 1 + ((26 - dynamicLoft) * 0.005);
            let baseCarry = simClub.baseDistance;
            // v5.50.0 Focus Anticipation
            let predictedFocus = 0; 
            if (simClub.name === "Driver" || simClub.name.includes("Wood")) {
                predictedFocus = (targetDist > 250) ? 1 : 4; 
            } else {
                predictedFocus = 4; 
            }
            let focusDistMod = (predictedFocus === 1) ? 1.10 : 1.0;
            baseCarry = baseCarry * focusDistMod;
            let totalDist = baseCarry * style.distMod * loftDistMod * lieMultiplier;
            
            let backspinRPM = Math.max(400, Math.round((simClub.loft * 150) + 1000 + ((simStance - 2) * 500) + style.spinMod));
                    // v6.02.0 Kinetic Spin Decay
                    if (style.name !== "Flop") {
                        let energyScale = Math.max(0.1, Math.min(1.0, baseCarry / 50.0));
                        backspinRPM = Math.round(backspinRPM * energyScale);
                    }
            let gyroMod = Math.max(0.6, Math.min(1.3, 1 - ((backspinRPM - 4000) / 10000)));
            let spinRollMod = Math.max(0.1, 1 - ((backspinRPM - 4000) / 10000));
            let rollDist = totalDist * simClub.rollPct * style.rollMod * spinRollMod;
            let carryDist = Math.max(1, totalDist - rollDist);

            let hangTime = Math.min(6, Math.max(0.5, (totalDist / 60) + (dynamicLoft / 15)));
            let windForward = windY * (hangTime / 2.5) * style.windMod * gyroMod;
            let windCross = windX * (hangTime / 2.5) * style.windMod * gyroMod;

            let desiredHeading = Math.atan2((targetPoint.x - ballX) - windCross, (targetPoint.y - ballY) - windForward);
            let aimDeg = Math.round((desiredHeading - baseHeading) * (180 / Math.PI));
            aimDeg = Math.max(-45, Math.min(45, aimDeg)); 

            let heading = baseHeading + (aimDeg * Math.PI / 180);
            let effectiveCarry = carryDist + windForward - elevationDiff; // v5.1.2 Topography Match

            let landX = Math.sin(heading) * effectiveCarry + Math.cos(heading) * windCross;
            let landY = Math.cos(heading) * effectiveCarry - Math.sin(heading) * windCross;
            let finalX = ballX + landX + (Math.sin(heading) * rollDist);
            let finalY = ballY + landY + (Math.cos(heading) * rollDist);

            let miss = Math.sqrt(Math.pow(targetPoint.x - finalX, 2) + Math.pow(targetPoint.y - finalY, 2));

            // Loft Bias: Subtract up to 3 yards from the miss score based on club loft to prioritize Wedges/Short Irons
            let adjustedMiss = miss - (simClub.loft * 0.05);

            if (!best || adjustedMiss < best.adjustedMiss || (adjustedMiss === best.adjustedMiss && Math.abs(aimDeg) < Math.abs(best.aimDeg))) {
                best = {
                    clubName: simClub.name,
                    stanceName: stanceNames[simStance],
                    aimDeg,
                    miss,
                    adjustedMiss
                };
            }
        }
    });

    // Aggression Bias for Par 4/5
    if (best && holeData.par > 3 && targetDist > 150 && (currentLie === "Tee" || currentLie === "Fairway")) {
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
    if (isPutting || ((gameMode === 'course' || gameMode === 'range') && currentLie === "Green")) {
        let distToPin = calculateDistanceToPin();
        const holeData = window.currentCourse.holes[hole - 1];
        let activeContours = [];
        if (gameMode === 'course' && holeData.greenType && typeof window.greenDictionary !== 'undefined') {
            activeContours = window.greenDictionary[holeData.greenType] || [];
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
        let slopeDampener = 1.0; // Oracle mirrors v5.45.0 uncapped break
        let baseHeading = Math.atan2(pinX - ballX, pinY - ballY);

        for (let p = Math.max(0.33, distToPin * 0.5); p <= distToPin * 3.0; p += 0.33) {
            for (let a = -45; a <= 45; a += 0.2) {
                let simX = ballX, simY = ballY;
                let effectivePace = p * (((typeof window.tournamentGreens !== 'undefined' && window.tournamentGreens) ? 13 : 10) / 10);
                let speedRemaining = effectivePace; let distTraveled = 0;
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
                if (!madeIt) {
                    if (finalDistToHole <= activeHoleRadius && speedRemaining <= captureSpeedLimit) {
                        madeIt = true;
                    }
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
        const holeData = window.currentCourse.holes[hole - 1];
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
        let elevationDiff = (typeof targetZ !== 'undefined' && typeof ballZ !== 'undefined') ? (targetZ - ballZ) : 0;
        let effectiveDist = distToTarget + elevationDiff;
        // GCA: Use effectiveDist (not raw geometry alone) for club reach logic.
        let allowedStyles = effectiveDist <= 100 ? [0, 1, 2, 3, 4] : [0];
        let lieMultiplier = 1.0;
        if (currentLie === 'Sand') lieMultiplier = 0.70;
        else if (currentLie === 'Pine Needles') lieMultiplier = 0.90;
        else if (currentLie === 'Packed Earth') lieMultiplier = 0.95;
        else if (currentLie.includes('Rough')) {
            let rIndex = typeof roughConditionIndex !== 'undefined' ? roughConditionIndex : 1;
            lieMultiplier = (typeof roughConditions !== 'undefined' && roughConditions[rIndex]) ? (roughConditions[rIndex].penalty + 0.025) : 0.875;
        }
        let best = null;

        for (let sIdx of allowedStyles) {
            let style = shotStyles[sIdx];
            for (let i = clubs.length - 1; i >= 0; i--) {
                let simClub = clubs[i];
                // v4.80.0 Driver Simulation Logic
                if (clubs[i].name === "Driver") {
                    // Strictly forbid Driver from the rough/sand
                    if (currentLie !== "Tee" && currentLie !== "Fairway") continue;
                }
                if (simClub.name === "Putter") continue; 
                if (effectiveDist < 120 && (simClub.name.includes('Wood') || simClub.name.includes('Driver'))) continue;
                if (sIdx >= 1 && sIdx <= 4 && !simClub.name.includes("Wedge") && simClub.name !== "9 Iron") continue;
                for (let simStance = 0; simStance < 5; simStance++) {
                    let dynamicLoft = Math.max(0, simClub.loft + style.loftMod + ((2 - simStance) * 5));
                    let loftDistMod = 1 + ((26 - dynamicLoft) * 0.005);
                    let baseCarry = simClub.baseDistance;
                    // v5.50.0 Focus Anticipation
                    let p = players[currentPlayerIndex];
                    let pName = p.name;
                    let predictedFocus = 0; // Default Standard
                    if (simClub.name === "Driver" || simClub.name.includes("Wood")) {
                        predictedFocus = (effectiveDist > 250) ? 1 : 4; // 1: Power, 4: Accuracy
                    } else {
                        predictedFocus = 4; // Irons/Wedges default to Accuracy
                    }
                    if (pName && pName.includes("Bot") && p.focusIndex === 1) predictedFocus = 1; 
                    let focusDistMod = (predictedFocus === 1) ? 1.10 : 1.0;
                    baseCarry = baseCarry * focusDistMod;
                    let totalDist = baseCarry * style.distMod * loftDistMod * lieMultiplier;
                    
                    let requiredPower = 100;
                    if (totalDist > effectiveDist && totalDist > 0) {
                        requiredPower = Math.max(10, Math.min(100, Math.round((effectiveDist / totalDist) * 100)));
                    }
                    let fractionalDist = totalDist * (requiredPower / 100);
                    let backspinRPM = Math.max(400, Math.round((simClub.loft * 150) + 1000 + ((simStance - 2) * 500) + style.spinMod));
                        // v6.02.0 Kinetic Spin Decay
                        if (style.name !== "Flop") {
                            let energyScale = Math.max(0.1, Math.min(1.0, baseCarry / 50.0));
                            backspinRPM = Math.round(backspinRPM * energyScale);
                        }
                    let gyroMod = Math.max(0.6, Math.min(1.3, 1 - ((backspinRPM - 4000) / 10000)));

                    let hangTime = Math.min(6, Math.max(0.5, (fractionalDist / 60) + (dynamicLoft / 15)));
                    let relWindY = (windY * Math.cos(baseHeading)) + (windX * Math.sin(baseHeading));
                    let relWindX = (windX * Math.cos(baseHeading)) - (windY * Math.sin(baseHeading));

                    let windForward = relWindY * (hangTime / 2.5) * style.windMod * gyroMod;
                    let windCross = relWindX * (hangTime / 2.5) * style.windMod * gyroMod;
                    let desiredHeading = Math.atan2((targetPoint.x - ballX) - windCross, (targetPoint.y - ballY) - windForward);
                    let aimDeg = Math.round((desiredHeading - baseHeading) * (180 / Math.PI));
                    aimDeg = Math.max(-45, Math.min(45, aimDeg)); 

                    let heading = baseHeading + (aimDeg * Math.PI / 180);
                    let effectiveCarry = (fractionalDist * (1 - simClub.rollPct)) + windForward - elevationDiff; // v5.1.2 Topography Match
                    let rollDist = fractionalDist * simClub.rollPct;
                    
                    let landX = Math.sin(heading) * effectiveCarry + Math.cos(heading) * windCross;
                    let landY = Math.cos(heading) * effectiveCarry - Math.sin(heading) * windCross;
                    let finalX = ballX + landX + (Math.sin(heading) * rollDist);
                    let finalY = ballY + landY + (Math.cos(heading) * rollDist);

                    let miss = Math.sqrt(Math.pow(targetPoint.x - finalX, 2) + Math.pow(targetPoint.y - finalY, 2));

                    // Loft Bias: Subtract up to 3 yards from the miss score based on club loft to prioritize Wedges/Short Irons
                    let adjustedMiss = miss - (simClub.loft * 0.05);
                    // v4.80.0 Fractional Power Penalty
                    // Force the AI to avoid awkward half-swings with long/mid irons
                    if (sIdx === 0 && requiredPower < 85 && !simClub.name.includes("Wedge")) {
                        adjustedMiss += 20;
                    }
                    if (clubs[i].name === "Driver" && currentLie === "Fairway") {
                        adjustedMiss += 50; // Massive artificial penalty so AI only uses it in desperation
                    }

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
                                    if (ballHeightAtTree < tree.height) {
                                        miss += 100; // Massive penalty for hitting a tree
                                        adjustedMiss += 100;
                                    }
                                }
                            }
                        });
                    }

                    // --- v5.10.0 AI Personality Math ---
                    if (pName === "Fairway Fred") {
                        if (club.name === "Driver" || club.name === "3 Wood") adjustedMiss += 30;
                        else if (club.name.includes("Iron")) adjustedMiss -= 15;
                    } else if (pName === "Dusty Bunkers") {
                        if (requiredPower < 95) adjustedMiss += 25;
                        if (requiredPower >= 105 && requiredPower <= 110) adjustedMiss -= 20;
                    } else if (pName === "Bot Rory") {
                        if (club.name === "Driver") adjustedMiss -= 35;
                        if (sIdx === 3) adjustedMiss += 20; // Penalize Flop shots
                    } else if (pName === "Bot Golden Bear") {
                        // The Tactician: Massively penalizes shots that carry over hazards
                        if (miss > 0) adjustedMiss += 50; 
                    } else if (pName === "Bot Seve") {
                        if (sIdx === 3 || sIdx === 1) adjustedMiss -= 40; // Massive bonus to Flop and Pitch creativity
                    } else if (pName === "Bot Lefty") {
                        // Phil the Thrill: Ignores hazard danger on long shots, favors flops (Pitch) around greens
                        if (club.name.includes("Wood") && requiredPower > 90) adjustedMiss -= (miss * 0.75); 
                        if (requiredPower < 60 && sIdx === 1) adjustedMiss -= 35; 
                    }
                    // ----------------------------------

                    if (!best || adjustedMiss < best.adjustedMiss || (adjustedMiss === best.adjustedMiss && Math.abs(aimDeg) < Math.abs(best.aimDeg))) {
                        best = { clubIndex: i, stanceIndex: simStance, styleIndex: sIdx, power: requiredPower, aimDeg, miss, adjustedMiss };
                    }
                }
            }
        }
        return best || { clubIndex: 0, stanceIndex: 2, styleIndex: 0, power: 100, aimDeg: 0 };
    }
};
