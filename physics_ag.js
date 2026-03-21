// physics_ag.js - Math, Wind, and Shot Calculation (v4.31.4)

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
    
    let dist = Math.round(calculateDistanceToPin());
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

    if (gameMode === 'course' && currentLie === 'Sand') {
        const minTotal = Math.round(baseTotal * 0.60);
        const maxTotal = Math.round(baseTotal * 0.80);
        return `${club.name}. ${gripReport}100% power hits ${minTotal} to ${maxTotal} yards. In the sand. Style: ${style.name}.`;
    } else if ((gameMode === 'course' && currentLie === 'Light Rough') || (gameMode === 'range' && rangeLie === 'Rough')) {
        const minTotal = Math.round(baseTotal * 0.85);
        const maxTotal = Math.round(baseTotal * 0.95);
        return `${club.name}. ${gripReport}100% power hits ${minTotal} to ${maxTotal} yards. In the rough. Style: ${style.name}.`;
    } else {
        return `${club.name}. ${gripReport}100% power hits ${Math.round(baseTotal)} yards. Style: ${style.name}.`;
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
    if (isPutting) {
        stateTimeouts.forEach(clearTimeout);
        strokes++;
        puttsThisHole++;
        if (devPower) finalPower = 100; // v4.4.2 FIX: Enforce dev power for putts
        let impactDiff = devImpact ? 0 : Math.round((performance.now() - impactStartTime) - dropDurationMs);
        let hingeDiff = devHinge ? 0 : Math.round(hingeTimeDown - hingeTimeBack);
        
        // Touch Mechanic (Spacebar Hinge becomes Tempo)
        let accuracyScore = Math.max(10, 100 - (Math.abs(impactDiff) / 2.5));
        let tempoBonus = Math.abs(hingeDiff) < 50 ? 1.2 : 1.0; // Perfect tempo gives 20% wider cup capture
        
        let powerOvercharge = finalPower > 100 ? finalPower - 100 : 0;

        let distToPin = calculateDistanceToPin();
        let broadcast = `Putt: ${finalPower}% Power. Target was ${puttTargetDist}y.`;

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

        let distTraveled = 0;
        let simX = ballX, simY = ballY;
        let speedRemaining = puttTargetDist * (finalPower / 100);
        // v4.7.2 Apply the aim angle relative to the pin
        let currentHeading = baseHeading + (aimAngle * (Math.PI / 180));
        
        let madeIt = false, lipOut = false;
        let captureRadius = accuracyScore > 90 ? 0.8 : 0.5;
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
            let sx = zone ? zone.slopeX : 0, sy = zone ? zone.slopeY : 0; 
            
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
            
            // Hyper-Pan: 3 yards left or right forces audio 100% into that ear
            let panValue = (step.x - pinX) / 3.0; 
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
                if (lipOut) {
                    // v4.28.0 Lip-Out Audio
                    if (typeof window.playGolfSound === 'function') window.playGolfSound('putt_06');
                    else playTone(150, 'square', 0.1, 0.5);

                    resultMsg = `Lipped out a ${formattedDist} putt! Hit it too hard.`;
                }
                else {
                    let latStr = Math.abs(ballX - pinX) < 0.5 ? "straight" : ballX < pinX ? "left" : "right";
                    let vertStr = ballY < pinY ? "short" : "long";
                    resultMsg = `Missed a ${formattedDist} putt. Settled ${vertStr} and ${latStr}.`;
                }
                broadcast = `Putt: ${finalPower}% Power. ${resultMsg}`; // Override broadcast so it doesn't say "Target was 5y"
                broadcast += ` ${calculateDistanceToPin()} yards left.`;
            }

            broadcast += ` ${resultMsg}`;
            lastShotReport = broadcast + `\nTelemetry: Impact ${impactDiff}ms, Tempo ${hingeDiff}ms.`;
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
                } else if (isHoleComplete) {
                    let totalRel = 0; roundData.forEach(r => totalRel += (r.strokes - r.par));
                    let relStr = totalRel === 0 ? "Even Par" : totalRel > 0 ? `+${totalRel}` : `${totalRel}`;
                    let compMsg = `Hole complete in ${strokes} strokes. You are ${relStr}. Press Enter to proceed to the next hole, or Shift + E for your scorecard.`;
                    window.announce(compMsg);
                    window.setCaddyPanelText(compMsg);
                    swingState = 6;
                } else {
                    swingState = 0; puttState = 0; aimAngle = 0;
                    puttTargetDist = Math.round(calculateDistanceToPin());
                    window.announce(`${puttTargetDist} yards left. Targeting Mode active.`);
                    window.updateDashboard();
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

    if (devPower) finalPower = 100;
    if (devHinge) { hingeTimeBack = 1000; hingeTimeDown = 1000; }
    let impactDiff = devImpact ? 0 : Math.round((performance.now() - impactStartTime) - dropDurationMs);
    let hingeDiff = devHinge ? 0 : Math.round(hingeTimeDown - hingeTimeBack);

    let powerOvercharge = finalPower > 100 ? finalPower - 100 : 0;
    let pressureDispersion = 1 + (powerOvercharge * 0.04); 
    const hingeAcc = Math.max(10, 100 - (Math.abs(hingeDiff) / (typeof isChokedDown !== 'undefined' && isChokedDown ? 4.8 : 4)));
    
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

    let forgiveness = finalPower <= 100 ? 1 + ((100 - finalPower) * 0.01) : Math.max(0.6, 1 - (powerOvercharge * 0.015));
    forgiveness *= lieForgivenessMod * (typeof isChokedDown !== 'undefined' && isChokedDown ? 1.2 : 1.0);

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
    let sideSpinRPM = Math.round((impactDiff / 20) * 100 * spinPenalty * pressureDispersion * styleSideSpinMod) + (stanceAlignment * 800 * styleSideSpinMod);
    sideSpinRPM = Math.max(-4500, Math.min(4500, sideSpinRPM));
    
    let chokeMod = typeof isChokedDown !== 'undefined' && isChokedDown ? 0.9 : 1.0;
    let loftDistMod = 1 + ((26 - dynamicLoft) * 0.005);
    let potentialDist = club.baseDistance * (finalPower / 100) * (1 + (hingeTimeBack / 2000 * 0.15)) * currentStyle.distMod * lieMod * loftDistMod * chokeMod;
    let totalDistance = Math.round(potentialDist * dampening * Math.max(0.2, 1 - Math.pow(Math.abs(hingeDiff) / 400, 2)));

    let activeRollMod = currentStyle.rollMod;
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

    const isPutt = club.name === "Putter";
    const physicsX = isPutt ? 0 : (sideSpinRPM / 2400) * (club.maxDispersion * (typeof lieDispersionMod !== 'undefined' ? lieDispersionMod : 1) * pressureDispersion);
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

    currentLie = Math.abs(ballX) > (currentFW / 2) ? "Light Rough" : "Fairway";
    let inWater = false;

    let rollStopTriggered = false;
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

    const greenSize = holeData.greenRadius || 20;
    if (inWater) {
        currentLie = "Water Penalty";
        strokes++; 
        ballY = Math.max(0, ballY - 20); 
        ballX = 0; 
    } else if (gameMode === 'course' && distanceToPin <= greenSize) {
        currentLie = "Green";
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

        // FIX: Moved rollTimeSecs outside the block so the Caddy timer can read it later
        let isWater = currentLie.toLowerCase().includes("water");
        let rollTimeSecs = Math.max(0, Math.abs(rollDistance) / 10);

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
                    document.getElementById('visual-output').innerText = "Ball is bouncing and rolling...";
                    if (typeof window.playPannedNoise === 'function') {
                        window.playPannedNoise(rollTimeSecs, 0.4, true, endPan);
                    } else {
                        playNoise(rollTimeSecs, 0.4, true);
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
            const setupMetrics = `Setup: ${club.name}${chokeStr} | Style: ${currentStyle.name} | Stance: ${stanceNames[stanceIndex]} / ${alignmentNames[stanceAlignment + 2]} | Aim: ${aimAngle}° | Wind: Y:${windY} X:${windX}`;

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

                const landDir = landRelY < -1 ? "short" : landRelY > 1 ? "long" : "pin-high";
                const finalVertDir = finalRelY < landRelY ? "back" : "forward"; // Direction of roll
                const cupRelDir = finalRelY < 0 ? "short of" : "past";
                const finalSideDir = finalRelX < 0 ? "left" : "right";

                proximityDesc = `Landed ${window.formatProximity(landRelY)} ${landDir}. Rolled ${window.formatProximity(finalRelY - landRelY)} ${finalVertDir}, settling ${cupRelDir} the cup. Finished ${window.formatProximity(finalDistToPin)} from the pin, ${window.formatProximity(finalRelX)} to the ${finalSideDir}.`;
            }

            const shotBroadcast = `${club.name}. ${roughDesc}${shotDesc} ${windDesc} Carries ${carryDistance}, rolls ${rollDistance} forward and ${kickDesc} for a total of ${totalDistance}. ${proximityDesc}`;

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
                driftWind(); aimAngle = 0; stanceIndex = 2; stanceAlignment = 0; swingState = 0; isPutting = false;
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

                    // v4.30.0 Post-Round Transition
                    if (hole >= courses[currentCourseIndex].holes.length) {
                        gameMode = 'post_round';
                        stateTimeouts.push(setTimeout(() => {
                            viewingScorecard = true; window.showScorecard();
                            window.announce("Round Complete! Full Scorecard open. Press Shift + N to copy your Round Summary to the clipboard, or Escape to return to the Clubhouse.");
                        }, 4000));
                    } else {
                        swingState = 6;
                    }
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

                            // v4.8.0 Green Transition & Victory Arpeggio
                            if (gameMode === 'course' && currentLie === "Green") {
                                playTone(440, 'sine', 0.1, 0.5);
                                stateTimeouts.push(setTimeout(() => playTone(554, 'sine', 0.1, 0.5), 150));
                                stateTimeouts.push(setTimeout(() => playTone(659, 'sine', 0.2, 0.5), 300));
                                // Track transition delay
                                stateTimeouts.push(setTimeout(() => { window.initPutting(); }, 3500)); // Wait for Caddy to finish reading approach shot
                            } else {
                                if (gameMode === 'course') window.updateTargetZone();
                                driftWind(); aimAngle = 0; stanceIndex = 2; stanceAlignment = 0; swingState = 0; isPutting = false;
                                window.updateDashboard();
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
        }, bounceSequenceMs + (rollTimeSecs * 1000) + 500));

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